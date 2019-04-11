import { privatize as P } from '@ember/-internals/container';
import { get } from '@ember/-internals/metal';
import { getOwner } from '@ember/-internals/owner';
import { guidFor } from '@ember/-internals/utils';
import { addChildView, setViewElement } from '@ember/-internals/views';
import { assert } from '@ember/debug';
import { _instrumentStart } from '@ember/instrumentation';
import { assign } from '@ember/polyfills';
import { DEBUG } from '@glimmer/env';
import { combine } from '@glimmer/reference';
import { PrimitiveReference, } from '@glimmer/runtime';
import { EMPTY_ARRAY } from '@glimmer/util';
import { BOUNDS, DIRTY_TAG, HAS_BLOCK, IS_DISPATCHING_ATTRS, ROOT_REF } from '../component';
import { AttributeBinding, ClassNameBinding, IsVisibleBinding, referenceForKey, SimpleClassNameBindingReference, } from '../utils/bindings';
import ComponentStateBucket from '../utils/curly-component-state-bucket';
import { processComponentArgs } from '../utils/process-args';
import AbstractManager from './abstract';
function aliasIdToElementId(args, props) {
    if (args.named.has('id')) {
        // tslint:disable-next-line:max-line-length
        assert(`You cannot invoke a component with both 'id' and 'elementId' at the same time.`, !args.named.has('elementId'));
        props.elementId = props.id;
    }
}
function isTemplateFactory(template) {
    return typeof template.create === 'function';
}
// We must traverse the attributeBindings in reverse keeping track of
// what has already been applied. This is essentially refining the concatenated
// properties applying right to left.
function applyAttributeBindings(element, attributeBindings, component, operations) {
    let seen = [];
    let i = attributeBindings.length - 1;
    while (i !== -1) {
        let binding = attributeBindings[i];
        let parsed = AttributeBinding.parse(binding);
        let attribute = parsed[1];
        if (seen.indexOf(attribute) === -1) {
            seen.push(attribute);
            AttributeBinding.install(element, component, parsed, operations);
        }
        i--;
    }
    if (seen.indexOf('id') === -1) {
        let id = component.elementId ? component.elementId : guidFor(component);
        operations.setAttribute('id', PrimitiveReference.create(id), false, null);
    }
    if (seen.indexOf('style') === -1) {
        IsVisibleBinding.install(element, component, operations);
    }
}
const DEFAULT_LAYOUT = P `template:components/-default`;
export default class CurlyComponentManager extends AbstractManager {
    getLayout(state, _resolver) {
        return {
            // TODO fix
            handle: state.handle,
            symbolTable: state.symbolTable,
        };
    }
    templateFor(component, resolver) {
        let layout = get(component, 'layout');
        if (layout !== undefined) {
            // This needs to be cached by template.id
            if (isTemplateFactory(layout)) {
                return resolver.createTemplate(layout, getOwner(component));
            }
            else {
                // we were provided an instance already
                return layout;
            }
        }
        let owner = getOwner(component);
        let layoutName = get(component, 'layoutName');
        if (layoutName) {
            let template = owner.lookup('template:' + layoutName);
            if (template) {
                return template;
            }
        }
        return owner.lookup(DEFAULT_LAYOUT);
    }
    getDynamicLayout({ component }, resolver) {
        const template = this.templateFor(component, resolver);
        const layout = template.asWrappedLayout();
        return {
            handle: layout.compile(),
            symbolTable: layout.symbolTable,
        };
    }
    getTagName(state) {
        const { component, hasWrappedElement } = state;
        if (!hasWrappedElement) {
            return null;
        }
        return (component && component.tagName) || 'div';
    }
    getCapabilities(state) {
        return state.capabilities;
    }
    prepareArgs(state, args) {
        const { positionalParams } = state.ComponentClass.class;
        // early exits
        if (positionalParams === undefined ||
            positionalParams === null ||
            args.positional.length === 0) {
            return null;
        }
        let named;
        if (typeof positionalParams === 'string') {
            assert(`You cannot specify positional parameters and the hash argument \`${positionalParams}\`.`, !args.named.has(positionalParams));
            named = { [positionalParams]: args.positional.capture() };
            assign(named, args.named.capture().map);
        }
        else if (Array.isArray(positionalParams) && positionalParams.length > 0) {
            const count = Math.min(positionalParams.length, args.positional.length);
            named = {};
            assign(named, args.named.capture().map);
            for (let i = 0; i < count; i++) {
                const name = positionalParams[i];
                assert(`You cannot specify both a positional param (at position ${i}) and the hash argument \`${name}\`.`, !args.named.has(name));
                named[name] = args.positional.at(i);
            }
        }
        else {
            return null;
        }
        return { positional: EMPTY_ARRAY, named };
    }
    /*
     * This hook is responsible for actually instantiating the component instance.
     * It also is where we perform additional bookkeeping to support legacy
     * features like exposed by view mixins like ChildViewSupport, ActionSupport,
     * etc.
     */
    create(environment, state, args, dynamicScope, callerSelfRef, hasBlock) {
        if (DEBUG) {
            this._pushToDebugStack(`component:${state.name}`, environment);
        }
        // Get the nearest concrete component instance from the scope. "Virtual"
        // components will be skipped.
        let parentView = dynamicScope.view;
        // Get the Ember.Component subclass to instantiate for this component.
        let factory = state.ComponentClass;
        // Capture the arguments, which tells Glimmer to give us our own, stable
        // copy of the Arguments object that is safe to hold on to between renders.
        let capturedArgs = args.named.capture();
        let props = processComponentArgs(capturedArgs);
        // Alias `id` argument to `elementId` property on the component instance.
        aliasIdToElementId(args, props);
        // Set component instance's parentView property to point to nearest concrete
        // component.
        props.parentView = parentView;
        // Set whether this component was invoked with a block
        // (`{{#my-component}}{{/my-component}}`) or without one
        // (`{{my-component}}`).
        props[HAS_BLOCK] = hasBlock;
        // Save the current `this` context of the template as the component's
        // `_target`, so bubbled actions are routed to the right place.
        props._target = callerSelfRef.value();
        // static layout asserts CurriedDefinition
        if (state.template) {
            props.layout = state.template;
        }
        // Now that we've built up all of the properties to set on the component instance,
        // actually create it.
        let component = factory.create(props);
        let finalizer = _instrumentStart('render.component', initialRenderInstrumentDetails, component);
        // We become the new parentView for downstream components, so save our
        // component off on the dynamic scope.
        dynamicScope.view = component;
        // Unless we're the root component, we need to add ourselves to our parent
        // component's childViews array.
        if (parentView !== null && parentView !== undefined) {
            addChildView(parentView, component);
        }
        component.trigger('didReceiveAttrs');
        let hasWrappedElement = component.tagName !== '';
        // We usually do this in the `didCreateElement`, but that hook doesn't fire for tagless components
        if (!hasWrappedElement) {
            if (environment.isInteractive) {
                component.trigger('willRender');
            }
            component._transitionTo('hasElement');
            if (environment.isInteractive) {
                component.trigger('willInsertElement');
            }
        }
        // Track additional lifecycle metadata about this component in a state bucket.
        // Essentially we're saving off all the state we'll need in the future.
        let bucket = new ComponentStateBucket(environment, component, capturedArgs, finalizer, hasWrappedElement);
        if (args.named.has('class')) {
            bucket.classRef = args.named.get('class');
        }
        if (DEBUG) {
            processComponentInitializationAssertions(component, props);
        }
        if (environment.isInteractive && hasWrappedElement) {
            component.trigger('willRender');
        }
        return bucket;
    }
    getSelf({ component }) {
        return component[ROOT_REF];
    }
    didCreateElement({ component, classRef, environment }, element, operations) {
        setViewElement(component, element);
        let { attributeBindings, classNames, classNameBindings } = component;
        if (attributeBindings && attributeBindings.length) {
            applyAttributeBindings(element, attributeBindings, component, operations);
        }
        else {
            let id = component.elementId ? component.elementId : guidFor(component);
            operations.setAttribute('id', PrimitiveReference.create(id), false, null);
            IsVisibleBinding.install(element, component, operations);
        }
        if (classRef) {
            const ref = new SimpleClassNameBindingReference(classRef, classRef['_propertyKey']);
            operations.setAttribute('class', ref, false, null);
        }
        if (classNames && classNames.length) {
            classNames.forEach((name) => {
                operations.setAttribute('class', PrimitiveReference.create(name), false, null);
            });
        }
        if (classNameBindings && classNameBindings.length) {
            classNameBindings.forEach((binding) => {
                ClassNameBinding.install(element, component, binding, operations);
            });
        }
        operations.setAttribute('class', PrimitiveReference.create('ember-view'), false, null);
        if ('ariaRole' in component) {
            operations.setAttribute('role', referenceForKey(component, 'ariaRole'), false, null);
        }
        component._transitionTo('hasElement');
        if (environment.isInteractive) {
            component.trigger('willInsertElement');
        }
    }
    didRenderLayout(bucket, bounds) {
        bucket.component[BOUNDS] = bounds;
        bucket.finalize();
        if (DEBUG) {
            this.debugStack.pop();
        }
    }
    getTag({ args, component }) {
        return args ? combine([args.tag, component[DIRTY_TAG]]) : component[DIRTY_TAG];
    }
    didCreate({ component, environment }) {
        if (environment.isInteractive) {
            component._transitionTo('inDOM');
            component.trigger('didInsertElement');
            component.trigger('didRender');
        }
    }
    update(bucket) {
        let { component, args, argsRevision, environment } = bucket;
        if (DEBUG) {
            this._pushToDebugStack(component._debugContainerKey, environment);
        }
        bucket.finalizer = _instrumentStart('render.component', rerenderInstrumentDetails, component);
        if (args && !args.tag.validate(argsRevision)) {
            let props = processComponentArgs(args);
            bucket.argsRevision = args.tag.value();
            component[IS_DISPATCHING_ATTRS] = true;
            component.setProperties(props);
            component[IS_DISPATCHING_ATTRS] = false;
            component.trigger('didUpdateAttrs');
            component.trigger('didReceiveAttrs');
        }
        if (environment.isInteractive) {
            component.trigger('willUpdate');
            component.trigger('willRender');
        }
    }
    didUpdateLayout(bucket) {
        bucket.finalize();
        if (DEBUG) {
            this.debugStack.pop();
        }
    }
    didUpdate({ component, environment }) {
        if (environment.isInteractive) {
            component.trigger('didUpdate');
            component.trigger('didRender');
        }
    }
    getDestructor(stateBucket) {
        return stateBucket;
    }
}
export function validatePositionalParameters(named, positional, positionalParamsDefinition) {
    if (DEBUG) {
        if (!named || !positional || !positional.length) {
            return;
        }
        let paramType = typeof positionalParamsDefinition;
        if (paramType === 'string') {
            // tslint:disable-next-line:max-line-length
            assert(`You cannot specify positional parameters and the hash argument \`${positionalParamsDefinition}\`.`, !named.has(positionalParamsDefinition));
        }
        else {
            if (positional.length < positionalParamsDefinition.length) {
                positionalParamsDefinition = positionalParamsDefinition.slice(0, positional.length);
            }
            for (let i = 0; i < positionalParamsDefinition.length; i++) {
                let name = positionalParamsDefinition[i];
                assert(`You cannot specify both a positional param (at position ${i}) and the hash argument \`${name}\`.`, !named.has(name));
            }
        }
    }
}
export function processComponentInitializationAssertions(component, props) {
    assert(`classNameBindings must be non-empty strings: ${component}`, (() => {
        let { classNameBindings } = component;
        for (let i = 0; i < classNameBindings.length; i++) {
            let binding = classNameBindings[i];
            if (typeof binding !== 'string' || binding.length === 0) {
                return false;
            }
        }
        return true;
    })());
    assert(`classNameBindings must not have spaces in them: ${component}`, (() => {
        let { classNameBindings } = component;
        for (let i = 0; i < classNameBindings.length; i++) {
            let binding = classNameBindings[i];
            if (binding.split(' ').length > 1) {
                return false;
            }
        }
        return true;
    })());
    assert(`You cannot use \`classNameBindings\` on a tag-less component: ${component}`, component.tagName !== '' ||
        !component.classNameBindings ||
        component.classNameBindings.length === 0);
    assert(`You cannot use \`elementId\` on a tag-less component: ${component}`, component.tagName !== '' ||
        props.id === component.elementId ||
        (!component.elementId && component.elementId !== ''));
    assert(`You cannot use \`attributeBindings\` on a tag-less component: ${component}`, component.tagName !== '' ||
        !component.attributeBindings ||
        component.attributeBindings.length === 0);
}
export function initialRenderInstrumentDetails(component) {
    return component.instrumentDetails({ initialRender: true });
}
export function rerenderInstrumentDetails(component) {
    return component.instrumentDetails({ initialRender: false });
}
export const CURLY_CAPABILITIES = {
    dynamicLayout: true,
    dynamicTag: true,
    prepareArgs: true,
    createArgs: true,
    attributeHook: true,
    elementHook: true,
    createCaller: true,
    dynamicScope: true,
    updateHook: true,
    createInstance: true,
};
const CURLY_COMPONENT_MANAGER = new CurlyComponentManager();
export class CurlyComponentDefinition {
    // tslint:disable-next-line:no-shadowed-variable
    constructor(name, ComponentClass, handle, template, args) {
        this.name = name;
        this.ComponentClass = ComponentClass;
        this.handle = handle;
        this.manager = CURLY_COMPONENT_MANAGER;
        const layout = template && template.asLayout();
        const symbolTable = layout ? layout.symbolTable : undefined;
        this.symbolTable = symbolTable;
        this.template = template;
        this.args = args;
        this.state = {
            name,
            ComponentClass,
            handle,
            template,
            capabilities: CURLY_CAPABILITIES,
            symbolTable,
        };
    }
}
