import { getOwner } from '@ember/-internals/owner';
import { EMBER_MODULE_UNIFICATION, EMBER_NATIVE_DECORATOR_SUPPORT } from '@ember/canary-features';
import { assert } from '@ember/debug';
import { DEBUG } from '@glimmer/env';
import { computed } from './computed';
import { isElementDescriptor } from './decorator';
import { defineProperty } from './properties';
export let DEBUG_INJECTION_FUNCTIONS;
if (DEBUG) {
    DEBUG_INJECTION_FUNCTIONS = new WeakMap();
}
export default function inject(type, ...args) {
    assert('a string type must be provided to inject', typeof type === 'string');
    let calledAsDecorator = isElementDescriptor(args);
    let source, namespace;
    let name = calledAsDecorator ? undefined : args[0];
    let options = calledAsDecorator ? undefined : args[1];
    if (EMBER_MODULE_UNIFICATION) {
        source = options ? options.source : undefined;
        namespace = undefined;
        if (name !== undefined) {
            let namespaceDelimiterOffset = name.indexOf('::');
            if (namespaceDelimiterOffset !== -1) {
                namespace = name.slice(0, namespaceDelimiterOffset);
                name = name.slice(namespaceDelimiterOffset + 2);
            }
        }
    }
    let getInjection = function (propertyName) {
        let owner = getOwner(this) || this.container; // fallback to `container` for backwards compat
        assert(`Attempting to lookup an injected property on an object without a container, ensure that the object was instantiated via a container.`, Boolean(owner));
        return owner.lookup(`${type}:${name || propertyName}`, { source, namespace });
    };
    if (DEBUG) {
        DEBUG_INJECTION_FUNCTIONS.set(getInjection, {
            namespace,
            source,
            type,
            name,
        });
    }
    let decorator = computed({
        get: getInjection,
        set(keyName, value) {
            defineProperty(this, keyName, null, value);
        },
    });
    if (calledAsDecorator) {
        assert('Native decorators are not enabled without the EMBER_NATIVE_DECORATOR_SUPPORT flag. If you are using inject in a classic class, add parenthesis to it: inject()', Boolean(EMBER_NATIVE_DECORATOR_SUPPORT));
        return decorator(args[0], args[1], args[2]);
    }
    else {
        return decorator;
    }
}
