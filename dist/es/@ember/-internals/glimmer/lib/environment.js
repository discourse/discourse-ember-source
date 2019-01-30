import { OWNER } from '@ember/-internals/owner';
import { constructStyleDeprecationMessage, lookupComponent } from '@ember/-internals/views';
import { warn } from '@ember/debug';
import { DEBUG } from '@glimmer/env';
import { Environment as GlimmerEnvironment, SimpleDynamicAttribute, } from '@glimmer/runtime';
import DebugStack from './utils/debug-stack';
import createIterable from './utils/iterable';
import { ConditionalReference } from './utils/references';
import { isHTMLSafe } from './utils/string';
import installPlatformSpecificProtocolForURL from './protocol-for-url';
export default class Environment extends GlimmerEnvironment {
    constructor(injections) {
        super(injections);
        this.inTransaction = false;
        this.owner = injections[OWNER];
        this.isInteractive = this.owner.lookup('-environment:main').isInteractive;
        // can be removed once https://github.com/tildeio/glimmer/pull/305 lands
        this.destroyedComponents = [];
        installPlatformSpecificProtocolForURL(this);
        if (DEBUG) {
            this.debugStack = new DebugStack();
        }
    }
    static create(options) {
        return new this(options);
    }
    // this gets clobbered by installPlatformSpecificProtocolForURL
    // it really should just delegate to a platform specific injection
    protocolForURL(s) {
        return s;
    }
    lookupComponent(name, meta) {
        return lookupComponent(meta.owner, name, meta);
    }
    toConditionalReference(reference) {
        return ConditionalReference.create(reference);
    }
    iterableFor(ref, key) {
        return createIterable(ref, key);
    }
    scheduleInstallModifier(modifier, manager) {
        if (this.isInteractive) {
            super.scheduleInstallModifier(modifier, manager);
        }
    }
    scheduleUpdateModifier(modifier, manager) {
        if (this.isInteractive) {
            super.scheduleUpdateModifier(modifier, manager);
        }
    }
    didDestroy(destroyable) {
        destroyable.destroy();
    }
    begin() {
        this.inTransaction = true;
        super.begin();
    }
    commit() {
        let destroyedComponents = this.destroyedComponents;
        this.destroyedComponents = [];
        // components queued for destruction must be destroyed before firing
        // `didCreate` to prevent errors when removing and adding a component
        // with the same name (would throw an error when added to view registry)
        for (let i = 0; i < destroyedComponents.length; i++) {
            destroyedComponents[i].destroy();
        }
        try {
            super.commit();
        }
        finally {
            this.inTransaction = false;
        }
    }
}
if (DEBUG) {
    class StyleAttributeManager extends SimpleDynamicAttribute {
        set(dom, value, env) {
            warn(constructStyleDeprecationMessage(value), (() => {
                if (value === null || value === undefined || isHTMLSafe(value)) {
                    return true;
                }
                return false;
            })(), { id: 'ember-htmlbars.style-xss-warning' });
            super.set(dom, value, env);
        }
        update(value, env) {
            warn(constructStyleDeprecationMessage(value), (() => {
                if (value === null || value === undefined || isHTMLSafe(value)) {
                    return true;
                }
                return false;
            })(), { id: 'ember-htmlbars.style-xss-warning' });
            super.update(value, env);
        }
    }
    Environment.prototype.attributeFor = function (element, attribute, isTrusting, namespace) {
        if (attribute === 'style' && !isTrusting) {
            return new StyleAttributeManager({ element, name: attribute, namespace });
        }
        return GlimmerEnvironment.prototype.attributeFor.call(this, element, attribute, isTrusting, namespace);
    };
}
