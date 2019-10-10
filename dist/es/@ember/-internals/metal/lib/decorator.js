import { meta as metaFor } from '@ember/-internals/meta';
import { EMBER_METAL_TRACKED_PROPERTIES, EMBER_NATIVE_DECORATOR_SUPPORT, } from '@ember/canary-features';
import { assert } from '@ember/debug';
import { setClassicDecorator } from './descriptor_map';
import { unwatch, watch } from './watching';
export function isElementDescriptor(args) {
    let [maybeTarget, maybeKey, maybeDesc] = args;
    return (
    // Ensure we have the right number of args
    args.length === 3 &&
        // Make sure the target is a class or object (prototype)
        (typeof maybeTarget === 'function' ||
            (typeof maybeTarget === 'object' && maybeTarget !== null)) &&
        // Make sure the key is a string
        typeof maybeKey === 'string' &&
        // Make sure the descriptor is the right shape
        ((typeof maybeDesc === 'object' &&
            maybeDesc !== null &&
            'enumerable' in maybeDesc &&
            'configurable' in maybeDesc) ||
            // TS compatibility
            maybeDesc === undefined));
}
// ..........................................................
// DEPENDENT KEYS
//
export function addDependentKeys(desc, obj, keyName, meta) {
    // the descriptor has a list of dependent keys, so
    // add all of its dependent keys.
    let depKeys = desc._dependentKeys;
    if (depKeys === null || depKeys === undefined) {
        return;
    }
    for (let idx = 0; idx < depKeys.length; idx++) {
        let depKey = depKeys[idx];
        // Increment the number of times depKey depends on keyName.
        meta.writeDeps(depKey, keyName, meta.peekDeps(depKey, keyName) + 1);
        // Watch the depKey
        watch(obj, depKey, meta);
    }
}
export function removeDependentKeys(desc, obj, keyName, meta) {
    // the descriptor has a list of dependent keys, so
    // remove all of its dependent keys.
    let depKeys = desc._dependentKeys;
    if (depKeys === null || depKeys === undefined) {
        return;
    }
    for (let idx = 0; idx < depKeys.length; idx++) {
        let depKey = depKeys[idx];
        // Decrement the number of times depKey depends on keyName.
        meta.writeDeps(depKey, keyName, meta.peekDeps(depKey, keyName) - 1);
        // Unwatch the depKey
        unwatch(obj, depKey, meta);
    }
}
export function nativeDescDecorator(propertyDesc) {
    let decorator = function () {
        return propertyDesc;
    };
    setClassicDecorator(decorator);
    return decorator;
}
/**
  Objects of this type can implement an interface to respond to requests to
  get and set. The default implementation handles simple properties.

  @class Descriptor
  @private
*/
export class ComputedDescriptor {
    constructor() {
        this.enumerable = true;
        this.configurable = true;
        this._dependentKeys = undefined;
        this._meta = undefined;
    }
    setup(_obj, keyName, _propertyDesc, meta) {
        meta.writeDescriptors(keyName, this);
    }
    teardown(_obj, keyName, meta) {
        meta.removeDescriptors(keyName);
    }
}
function DESCRIPTOR_GETTER_FUNCTION(name, descriptor) {
    return function CPGETTER_FUNCTION() {
        return descriptor.get(this, name);
    };
}
function DESCRIPTOR_SETTER_FUNCTION(name, descriptor) {
    return function CPSETTER_FUNCTION(value) {
        return descriptor.set(this, name, value);
    };
}
export function makeComputedDecorator(desc, DecoratorClass) {
    let decorator = function COMPUTED_DECORATOR(target, key, propertyDesc, maybeMeta, isClassicDecorator) {
        assert('Native decorators are not enabled without the EMBER_NATIVE_DECORATOR_SUPPORT flag', EMBER_NATIVE_DECORATOR_SUPPORT || isClassicDecorator);
        assert(`Only one computed property decorator can be applied to a class field or accessor, but '${key}' was decorated twice. You may have added the decorator to both a getter and setter, which is unecessary.`, isClassicDecorator ||
            !propertyDesc ||
            !propertyDesc.get ||
            propertyDesc.get.toString().indexOf('CPGETTER_FUNCTION') === -1);
        let meta = arguments.length === 3 ? metaFor(target) : maybeMeta;
        desc.setup(target, key, propertyDesc, meta);
        let computedDesc = {
            enumerable: desc.enumerable,
            configurable: desc.configurable,
            get: DESCRIPTOR_GETTER_FUNCTION(key, desc),
        };
        if (EMBER_METAL_TRACKED_PROPERTIES) {
            computedDesc.set = DESCRIPTOR_SETTER_FUNCTION(key, desc);
        }
        return computedDesc;
    };
    setClassicDecorator(decorator, desc);
    Object.setPrototypeOf(decorator, DecoratorClass.prototype);
    return decorator;
}
