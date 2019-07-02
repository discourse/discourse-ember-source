import { meta as metaFor } from '@ember/-internals/meta';
import { inspect } from '@ember/-internals/utils';
import { assert } from '@ember/debug';
import EmberError from '@ember/error';
import { getCachedValueFor, getCacheFor } from './computed_cache';
import { addDependentKeys, ComputedDescriptor, isElementDescriptor, makeComputedDecorator, removeDependentKeys, } from './decorator';
import { descriptorForDecorator } from './descriptor_map';
import { defineProperty } from './properties';
import { get } from './property_get';
import { set } from './property_set';
const CONSUMED = Object.freeze({});
export default function alias(altKey) {
    assert('You attempted to use @alias as a decorator directly, but it requires a `altKey` parameter', !isElementDescriptor(Array.prototype.slice.call(arguments)));
    return makeComputedDecorator(new AliasedProperty(altKey), AliasDecoratorImpl);
}
// TODO: This class can be svelted once `meta` has been deprecated
class AliasDecoratorImpl extends Function {
    readOnly() {
        descriptorForDecorator(this).readOnly();
        return this;
    }
    oneWay() {
        descriptorForDecorator(this).oneWay();
        return this;
    }
    meta(meta) {
        let prop = descriptorForDecorator(this);
        if (arguments.length === 0) {
            return prop._meta || {};
        }
        else {
            prop._meta = meta;
        }
    }
}
export class AliasedProperty extends ComputedDescriptor {
    constructor(altKey) {
        super();
        this.altKey = altKey;
        this._dependentKeys = [altKey];
    }
    setup(obj, keyName, propertyDesc, meta) {
        assert(`Setting alias '${keyName}' on self`, this.altKey !== keyName);
        super.setup(obj, keyName, propertyDesc, meta);
        if (meta.peekWatching(keyName) > 0) {
            this.consume(obj, keyName, meta);
        }
    }
    teardown(obj, keyName, meta) {
        this.unconsume(obj, keyName, meta);
        super.teardown(obj, keyName, meta);
    }
    willWatch(obj, keyName, meta) {
        this.consume(obj, keyName, meta);
    }
    get(obj, keyName) {
        let ret = get(obj, this.altKey);
        this.consume(obj, keyName, metaFor(obj));
        return ret;
    }
    unconsume(obj, keyName, meta) {
        let wasConsumed = getCachedValueFor(obj, keyName) === CONSUMED;
        if (wasConsumed || meta.peekWatching(keyName) > 0) {
            removeDependentKeys(this, obj, keyName, meta);
        }
        if (wasConsumed) {
            getCacheFor(obj).delete(keyName);
        }
    }
    consume(obj, keyName, meta) {
        let cache = getCacheFor(obj);
        if (cache.get(keyName) !== CONSUMED) {
            cache.set(keyName, CONSUMED);
            addDependentKeys(this, obj, keyName, meta);
        }
    }
    set(obj, _keyName, value) {
        return set(obj, this.altKey, value);
    }
    readOnly() {
        this.set = AliasedProperty_readOnlySet;
    }
    oneWay() {
        this.set = AliasedProperty_oneWaySet;
    }
}
function AliasedProperty_readOnlySet(obj, keyName) {
    // eslint-disable-line no-unused-vars
    throw new EmberError(`Cannot set read-only property '${keyName}' on object: ${inspect(obj)}`);
}
function AliasedProperty_oneWaySet(obj, keyName, value) {
    defineProperty(obj, keyName, null);
    return set(obj, keyName, value);
}
