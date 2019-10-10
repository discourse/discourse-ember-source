import { meta as metaFor } from '@ember/-internals/meta';
import { isProxy, setupMandatorySetter, symbol } from '@ember/-internals/utils';
import { EMBER_METAL_TRACKED_PROPERTIES } from '@ember/canary-features';
import { backburner } from '@ember/runloop';
import { DEBUG } from '@glimmer/env';
import { combine, CONSTANT_TAG, DirtyableTag, UpdatableTag, } from '@glimmer/reference';
export const UNKNOWN_PROPERTY_TAG = symbol('UNKNOWN_PROPERTY_TAG');
function makeTag() {
    return DirtyableTag.create();
}
export function tagForProperty(object, propertyKey, _meta) {
    let objectType = typeof object;
    if (objectType !== 'function' && (objectType !== 'object' || object === null)) {
        return CONSTANT_TAG;
    }
    let meta = _meta === undefined ? metaFor(object) : _meta;
    if (EMBER_METAL_TRACKED_PROPERTIES) {
        if (!(propertyKey in object) && typeof object[UNKNOWN_PROPERTY_TAG] === 'function') {
            return object[UNKNOWN_PROPERTY_TAG](propertyKey);
        }
    }
    else if (isProxy(object)) {
        return tagFor(object, meta);
    }
    let tags = meta.writableTags();
    let tag = tags[propertyKey];
    if (tag) {
        return tag;
    }
    if (EMBER_METAL_TRACKED_PROPERTIES) {
        let pair = combine([makeTag(), UpdatableTag.create(CONSTANT_TAG)]);
        if (DEBUG) {
            if (EMBER_METAL_TRACKED_PROPERTIES) {
                setupMandatorySetter(object, propertyKey);
            }
            pair._propertyKey = propertyKey;
        }
        return (tags[propertyKey] = pair);
    }
    else {
        return (tags[propertyKey] = makeTag());
    }
}
export function tagFor(object, _meta) {
    if (typeof object === 'object' && object !== null) {
        let meta = _meta === undefined ? metaFor(object) : _meta;
        if (!meta.isMetaDestroyed()) {
            return meta.writableTag(makeTag);
        }
    }
    return CONSTANT_TAG;
}
export let dirty;
export let update;
if (EMBER_METAL_TRACKED_PROPERTIES) {
    dirty = tag => {
        tag.inner.first.inner.dirty();
    };
    update = (outer, inner) => {
        outer.inner.lastChecked = 0;
        outer.inner.second.inner.update(inner);
    };
}
else {
    dirty = tag => {
        tag.inner.dirty();
    };
}
export function markObjectAsDirty(obj, propertyKey, _meta) {
    let meta = _meta === undefined ? metaFor(obj) : _meta;
    let objectTag = meta.readableTag();
    if (objectTag !== undefined) {
        if (isProxy(obj)) {
            objectTag.inner.first.inner.dirty();
        }
        else {
            objectTag.inner.dirty();
        }
    }
    let tags = meta.readableTags();
    let propertyTag = tags !== undefined ? tags[propertyKey] : undefined;
    if (propertyTag !== undefined) {
        dirty(propertyTag);
    }
    if (objectTag !== undefined || propertyTag !== undefined) {
        ensureRunloop();
    }
}
export function ensureRunloop() {
    backburner.ensureInstance();
}
