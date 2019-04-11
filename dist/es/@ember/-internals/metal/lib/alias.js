import { meta as metaFor } from '@ember/-internals/meta';
import { inspect } from '@ember/-internals/utils';
import { assert } from '@ember/debug';
import EmberError from '@ember/error';
import { ComputedProperty } from './computed';
import { getCachedValueFor, getCacheFor } from './computed_cache';
import { addDependentKeys, removeDependentKeys, } from './dependent_keys';
import { defineProperty, Descriptor } from './properties';
import { get } from './property_get';
import { set } from './property_set';
const CONSUMED = Object.freeze({});
export default function alias(altKey) {
    return new AliasedProperty(altKey);
}
export class AliasedProperty extends Descriptor {
    constructor(altKey) {
        super();
        this.altKey = altKey;
        this._dependentKeys = [altKey];
    }
    setup(obj, keyName, meta) {
        assert(`Setting alias '${keyName}' on self`, this.altKey !== keyName);
        super.setup(obj, keyName, meta);
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
        return this;
    }
    oneWay() {
        this.set = AliasedProperty_oneWaySet;
        return this;
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
// Backwards compatibility with Ember Data.
AliasedProperty.prototype._meta = undefined;
AliasedProperty.prototype.meta = ComputedProperty.prototype.meta;
