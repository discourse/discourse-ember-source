import { meta as metaFor } from '@ember/-internals/meta';
import { isProxy } from '@ember/-internals/utils';
import { EMBER_METAL_TRACKED_PROPERTIES } from '@ember/canary-features';
import { backburner } from '@ember/runloop';
import { combine, CONSTANT_TAG, DirtyableTag, UpdatableTag, } from '@glimmer/reference';
function makeTag() {
    return DirtyableTag.create();
}
export function tagForProperty(object, propertyKey, _meta) {
    let objectType = typeof object;
    if (objectType !== 'function' && (objectType !== 'object' || object === null)) {
        return CONSTANT_TAG;
    }
    let meta = _meta === undefined ? metaFor(object) : _meta;
    if (isProxy(object)) {
        return tagFor(object, meta);
    }
    let tags = meta.writableTags();
    let tag = tags[propertyKey];
    if (tag) {
        return tag;
    }
    if (EMBER_METAL_TRACKED_PROPERTIES) {
        let pair = combine([makeTag(), UpdatableTag.create(CONSTANT_TAG)]);
        return (tags[propertyKey] = pair);
    }
    else {
        return (tags[propertyKey] = makeTag());
    }
}
export function tagFor(object, _meta) {
    if (typeof object === 'object' && object !== null) {
        let meta = _meta === undefined ? metaFor(object) : _meta;
        return meta.writableTag(makeTag);
    }
    else {
        return CONSTANT_TAG;
    }
}
export let dirty;
export let update;
if (EMBER_METAL_TRACKED_PROPERTIES) {
    dirty = tag => {
        tag.inner.first.inner.dirty();
    };
    update = (outer, inner) => {
        outer.inner.second.inner.update(inner);
    };
}
else {
    dirty = tag => {
        tag.inner.dirty();
    };
}
export function markObjectAsDirty(obj, propertyKey, meta) {
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
