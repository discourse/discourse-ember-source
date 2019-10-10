import { meta as metaFor } from '@ember/-internals/meta';
import { inspect } from '@ember/-internals/utils';
import { EMBER_METAL_TRACKED_PROPERTIES } from '@ember/canary-features';
import { assert } from '@ember/debug';
import EmberError from '@ember/error';
import { finishLazyChains, getChainTagsForKey } from './chain-tags';
import { getCachedValueFor, getCacheFor, setLastRevisionFor } from './computed_cache';
import { addDependentKeys, ComputedDescriptor, isElementDescriptor, makeComputedDecorator, removeDependentKeys, } from './decorator';
import { descriptorForDecorator } from './descriptor_map';
import { defineProperty } from './properties';
import { get } from './property_get';
import { set } from './property_set';
import { tagForProperty, update } from './tags';
import { consume, track } from './tracked';
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
        if (!EMBER_METAL_TRACKED_PROPERTIES) {
            this._dependentKeys = [altKey];
        }
    }
    setup(obj, keyName, propertyDesc, meta) {
        assert(`Setting alias '${keyName}' on self`, this.altKey !== keyName);
        super.setup(obj, keyName, propertyDesc, meta);
        if (!EMBER_METAL_TRACKED_PROPERTIES && meta.peekWatching(keyName) > 0) {
            this.consume(obj, keyName, meta);
        }
    }
    teardown(obj, keyName, meta) {
        if (!EMBER_METAL_TRACKED_PROPERTIES) {
            this.unconsume(obj, keyName, meta);
        }
        super.teardown(obj, keyName, meta);
    }
    willWatch(obj, keyName, meta) {
        if (!EMBER_METAL_TRACKED_PROPERTIES) {
            this.consume(obj, keyName, meta);
        }
    }
    get(obj, keyName) {
        let ret;
        if (EMBER_METAL_TRACKED_PROPERTIES) {
            let propertyTag = tagForProperty(obj, keyName);
            // We don't use the tag since CPs are not automatic, we just want to avoid
            // anything tracking while we get the altKey
            track(() => {
                ret = get(obj, this.altKey);
            });
            let altPropertyTag = getChainTagsForKey(obj, this.altKey);
            update(propertyTag, altPropertyTag);
            consume(propertyTag);
            finishLazyChains(obj, keyName, ret);
            setLastRevisionFor(obj, keyName, propertyTag.value());
        }
        else {
            ret = get(obj, this.altKey);
            this.consume(obj, keyName, metaFor(obj));
        }
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
