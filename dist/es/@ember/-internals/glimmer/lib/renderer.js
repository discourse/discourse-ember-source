import { ENV } from '@ember/-internals/environment';
import { runInTransaction } from '@ember/-internals/metal';
import { getViewElement, getViewId } from '@ember/-internals/views';
import { assert } from '@ember/debug';
import { backburner, getCurrentRunLoop } from '@ember/runloop';
import { CURRENT_TAG } from '@glimmer/reference';
import { clientBuilder, curry, renderMain, UNDEFINED_REFERENCE, } from '@glimmer/runtime';
import RSVP from 'rsvp';
import { BOUNDS } from './component';
import { createRootOutlet } from './component-managers/outlet';
import { RootComponentDefinition } from './component-managers/root';
import { UnboundReference } from './utils/references';
export class DynamicScope {
    constructor(view, outletState) {
        this.view = view;
        this.outletState = outletState;
    }
    child() {
        return new DynamicScope(this.view, this.outletState);
    }
    get(key) {
        // tslint:disable-next-line:max-line-length
        assert(`Using \`-get-dynamic-scope\` is only supported for \`outletState\` (you used \`${key}\`).`, key === 'outletState');
        return this.outletState;
    }
    set(key, value) {
        // tslint:disable-next-line:max-line-length
        assert(`Using \`-with-dynamic-scope\` is only supported for \`outletState\` (you used \`${key}\`).`, key === 'outletState');
        this.outletState = value;
        return value;
    }
}
class RootState {
    constructor(root, env, template, self, parentElement, dynamicScope, builder) {
        assert(`You cannot render \`${self.value()}\` without a template.`, template !== undefined);
        this.id = getViewId(root);
        this.env = env;
        this.root = root;
        this.result = undefined;
        this.shouldReflush = false;
        this.destroyed = false;
        let options = (this.options = {
            alwaysRevalidate: false,
        });
        this.render = () => {
            let layout = template.asLayout();
            let handle = layout.compile();
            let iterator = renderMain(layout['compiler'].program, env, self, dynamicScope, builder(env, { element: parentElement, nextSibling: null }), handle);
            let iteratorResult;
            do {
                iteratorResult = iterator.next();
            } while (!iteratorResult.done);
            let result = (this.result = iteratorResult.value);
            // override .render function after initial render
            this.render = () => result.rerender(options);
        };
    }
    isFor(possibleRoot) {
        return this.root === possibleRoot;
    }
    destroy() {
        let { result, env } = this;
        this.destroyed = true;
        this.env = undefined;
        this.root = null;
        this.result = undefined;
        this.render = undefined;
        if (result) {
            /*
             Handles these scenarios:
      
             * When roots are removed during standard rendering process, a transaction exists already
               `.begin()` / `.commit()` are not needed.
             * When roots are being destroyed manually (`component.append(); component.destroy() case), no
               transaction exists already.
             * When roots are being destroyed during `Renderer#destroy`, no transaction exists
      
             */
            let needsTransaction = !env.inTransaction;
            if (needsTransaction) {
                env.begin();
            }
            try {
                result.destroy();
            }
            finally {
                if (needsTransaction) {
                    env.commit();
                }
            }
        }
    }
}
const renderers = [];
export function _resetRenderers() {
    renderers.length = 0;
}
function register(renderer) {
    assert('Cannot register the same renderer twice', renderers.indexOf(renderer) === -1);
    renderers.push(renderer);
}
function deregister(renderer) {
    let index = renderers.indexOf(renderer);
    assert('Cannot deregister unknown unregistered renderer', index !== -1);
    renderers.splice(index, 1);
}
function loopBegin() {
    for (let i = 0; i < renderers.length; i++) {
        renderers[i]._scheduleRevalidate();
    }
}
function K() {
    /* noop */
}
let renderSettledDeferred = null;
/*
  Returns a promise which will resolve when rendering has settled. Settled in
  this context is defined as when all of the tags in use are "current" (e.g.
  `renderers.every(r => r._isValid())`). When this is checked at the _end_ of
  the run loop, this essentially guarantees that all rendering is completed.

  @method renderSettled
  @returns {Promise<void>} a promise which fulfills when rendering has settled
*/
export function renderSettled() {
    if (renderSettledDeferred === null) {
        renderSettledDeferred = RSVP.defer();
        // if there is no current runloop, the promise created above will not have
        // a chance to resolve (because its resolved in backburner's "end" event)
        if (!getCurrentRunLoop()) {
            // ensure a runloop has been kicked off
            backburner.schedule('actions', null, K);
        }
    }
    return renderSettledDeferred.promise;
}
function resolveRenderPromise() {
    if (renderSettledDeferred !== null) {
        let resolve = renderSettledDeferred.resolve;
        renderSettledDeferred = null;
        backburner.join(null, resolve);
    }
}
let loops = 0;
function loopEnd() {
    for (let i = 0; i < renderers.length; i++) {
        if (!renderers[i]._isValid()) {
            if (loops > ENV._RERENDER_LOOP_LIMIT) {
                loops = 0;
                // TODO: do something better
                renderers[i].destroy();
                throw new Error('infinite rendering invalidation detected');
            }
            loops++;
            return backburner.join(null, K);
        }
    }
    loops = 0;
    resolveRenderPromise();
}
backburner.on('begin', loopBegin);
backburner.on('end', loopEnd);
export class Renderer {
    constructor(env, rootTemplate, viewRegistry, destinedForDOM = false, builder = clientBuilder) {
        this._env = env;
        this._rootTemplate = rootTemplate;
        this._viewRegistry = viewRegistry;
        this._destinedForDOM = destinedForDOM;
        this._destroyed = false;
        this._roots = [];
        this._lastRevision = -1;
        this._isRenderingRoots = false;
        this._removedRoots = [];
        this._builder = builder;
    }
    // renderer HOOKS
    appendOutletView(view, target) {
        let definition = createRootOutlet(view);
        this._appendDefinition(view, curry(definition), target);
    }
    appendTo(view, target) {
        let definition = new RootComponentDefinition(view);
        this._appendDefinition(view, curry(definition), target);
    }
    _appendDefinition(root, definition, target) {
        let self = new UnboundReference(definition);
        let dynamicScope = new DynamicScope(null, UNDEFINED_REFERENCE);
        let rootState = new RootState(root, this._env, this._rootTemplate, self, target, dynamicScope, this._builder);
        this._renderRoot(rootState);
    }
    rerender() {
        this._scheduleRevalidate();
    }
    register(view) {
        let id = getViewId(view);
        assert('Attempted to register a view with an id already in use: ' + id, !this._viewRegistry[id]);
        this._viewRegistry[id] = view;
    }
    unregister(view) {
        delete this._viewRegistry[getViewId(view)];
    }
    remove(view) {
        view._transitionTo('destroying');
        this.cleanupRootFor(view);
        if (this._destinedForDOM) {
            view.trigger('didDestroyElement');
        }
    }
    cleanupRootFor(view) {
        // no need to cleanup roots if we have already been destroyed
        if (this._destroyed) {
            return;
        }
        let roots = this._roots;
        // traverse in reverse so we can remove items
        // without mucking up the index
        let i = this._roots.length;
        while (i--) {
            let root = roots[i];
            if (root.isFor(view)) {
                root.destroy();
                roots.splice(i, 1);
            }
        }
    }
    destroy() {
        if (this._destroyed) {
            return;
        }
        this._destroyed = true;
        this._clearAllRoots();
    }
    getBounds(view) {
        let bounds = view[BOUNDS];
        let parentElement = bounds.parentElement();
        let firstNode = bounds.firstNode();
        let lastNode = bounds.lastNode();
        return { parentElement, firstNode, lastNode };
    }
    createElement(tagName) {
        return this._env.getAppendOperations().createElement(tagName);
    }
    _renderRoot(root) {
        let { _roots: roots } = this;
        roots.push(root);
        if (roots.length === 1) {
            register(this);
        }
        this._renderRootsTransaction();
    }
    _renderRoots() {
        let { _roots: roots, _env: env, _removedRoots: removedRoots } = this;
        let globalShouldReflush = false;
        let initialRootsLength;
        do {
            env.begin();
            try {
                // ensure that for the first iteration of the loop
                // each root is processed
                initialRootsLength = roots.length;
                globalShouldReflush = false;
                for (let i = 0; i < roots.length; i++) {
                    let root = roots[i];
                    if (root.destroyed) {
                        // add to the list of roots to be removed
                        // they will be removed from `this._roots` later
                        removedRoots.push(root);
                        // skip over roots that have been marked as destroyed
                        continue;
                    }
                    let { shouldReflush } = root;
                    // when processing non-initial reflush loops,
                    // do not process more roots than needed
                    if (i >= initialRootsLength && !shouldReflush) {
                        continue;
                    }
                    root.options.alwaysRevalidate = shouldReflush;
                    // track shouldReflush based on this roots render result
                    shouldReflush = root.shouldReflush = runInTransaction(root, 'render');
                    // globalShouldReflush should be `true` if *any* of
                    // the roots need to reflush
                    globalShouldReflush = globalShouldReflush || shouldReflush;
                }
                this._lastRevision = CURRENT_TAG.value();
            }
            finally {
                env.commit();
            }
        } while (globalShouldReflush || roots.length > initialRootsLength);
        // remove any roots that were destroyed during this transaction
        while (removedRoots.length) {
            let root = removedRoots.pop();
            let rootIndex = roots.indexOf(root);
            roots.splice(rootIndex, 1);
        }
        if (this._roots.length === 0) {
            deregister(this);
        }
    }
    _renderRootsTransaction() {
        if (this._isRenderingRoots) {
            // currently rendering roots, a new root was added and will
            // be processed by the existing _renderRoots invocation
            return;
        }
        // used to prevent calling _renderRoots again (see above)
        // while we are actively rendering roots
        this._isRenderingRoots = true;
        let completedWithoutError = false;
        try {
            this._renderRoots();
            completedWithoutError = true;
        }
        finally {
            if (!completedWithoutError) {
                this._lastRevision = CURRENT_TAG.value();
                if (this._env.inTransaction === true) {
                    this._env.commit();
                }
            }
            this._isRenderingRoots = false;
        }
    }
    _clearAllRoots() {
        let roots = this._roots;
        for (let i = 0; i < roots.length; i++) {
            let root = roots[i];
            root.destroy();
        }
        this._removedRoots.length = 0;
        this._roots = [];
        // if roots were present before destroying
        // deregister this renderer instance
        if (roots.length) {
            deregister(this);
        }
    }
    _scheduleRevalidate() {
        backburner.scheduleOnce('render', this, this._revalidate);
    }
    _isValid() {
        return this._destroyed || this._roots.length === 0 || CURRENT_TAG.validate(this._lastRevision);
    }
    _revalidate() {
        if (this._isValid()) {
            return;
        }
        this._renderRootsTransaction();
    }
}
export class InertRenderer extends Renderer {
    static create({ env, rootTemplate, _viewRegistry, builder, }) {
        return new this(env, rootTemplate, _viewRegistry, false, builder);
    }
    getElement(_view) {
        throw new Error('Accessing `this.element` is not allowed in non-interactive environments (such as FastBoot).');
    }
}
export class InteractiveRenderer extends Renderer {
    static create({ env, rootTemplate, _viewRegistry, builder, }) {
        return new this(env, rootTemplate, _viewRegistry, true, builder);
    }
    getElement(view) {
        return getViewElement(view);
    }
}
