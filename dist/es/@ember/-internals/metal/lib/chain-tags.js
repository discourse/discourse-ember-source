import { meta as metaFor, peekMeta } from '@ember/-internals/meta';
import { isEmberArray } from '@ember/-internals/utils';
import { assert } from '@ember/debug';
import { combine, CONSTANT_TAG, UpdatableTag } from '@glimmer/reference';
import { getLastRevisionFor, peekCacheFor } from './computed_cache';
import { descriptorForProperty } from './descriptor_map';
import get from './property_get';
import { tagForProperty } from './tags';
import { track } from './tracked';
export function finishLazyChains(obj, key, value) {
    let meta = peekMeta(obj);
    let lazyTags = meta !== null ? meta.readableLazyChainsFor(key) : undefined;
    if (lazyTags === undefined) {
        return;
    }
    if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
        lazyTags.clear();
        return;
    }
    while (lazyTags.length > 0) {
        let [path, tag] = lazyTags.pop();
        tag.inner.update(getChainTagsForKey(value, path));
    }
}
export function getChainTagsForKeys(obj, keys) {
    let chainTags = [];
    for (let i = 0; i < keys.length; i++) {
        chainTags.push(getChainTagsForKey(obj, keys[i]));
    }
    return combine(chainTags);
}
export function getChainTagsForKey(obj, key) {
    let chainTags = [];
    let current = obj;
    let segments = key.split('.');
    // prevent closures
    let segment, descriptor;
    while (segments.length > 0) {
        segment = segments.shift();
        if (segment === '@each' && segments.length > 0) {
            assert(`When using @each, the value you are attempting to watch must be an array, was: ${current.toString()}`, Array.isArray(current) || isEmberArray(current));
            segment = segments.shift();
            // Push the tags for each item's property
            let tags = current.map(item => {
                assert(`When using @each to observe the array \`${current.toString()}\`, the items in the array must be objects`, typeof item === 'object');
                return tagForProperty(item, segment);
            });
            // Push the tag for the array length itself
            chainTags.push(...tags, tagForProperty(current, '[]'));
            // There shouldn't be any more segments after an `@each`, so break
            assert(`When using @each, you can only chain one property level deep`, segments.length === 0);
            break;
        }
        let propertyTag = tagForProperty(current, segment);
        chainTags.push(propertyTag);
        descriptor = descriptorForProperty(current, segment);
        if (descriptor === undefined) {
            // TODO: Assert that current[segment] isn't an undecorated, non-MANDATORY_SETTER getter
            if (!(segment in current) && typeof current.unknownProperty === 'function') {
                current = current.unknownProperty(segment);
            }
            else {
                current = current[segment];
            }
        }
        else {
            let lastRevision = getLastRevisionFor(current, segment);
            if (propertyTag.validate(lastRevision)) {
                if (typeof descriptor.altKey === 'string') {
                    // it's an alias, so just get the altkey without tracking
                    track(() => {
                        current = get(obj, descriptor.altKey);
                    });
                }
                else {
                    current = peekCacheFor(current).get(segment);
                }
            }
            else if (segments.length > 0) {
                let placeholderTag = UpdatableTag.create(CONSTANT_TAG);
                metaFor(current)
                    .writableLazyChainsFor(segment)
                    .push([segments.join('.'), placeholderTag]);
                chainTags.push(placeholderTag);
                break;
            }
        }
        let currentType = typeof current;
        if (current === null || (currentType !== 'object' && currentType !== 'function')) {
            // we've hit the end of the chain for now, break out
            break;
        }
    }
    return combine(chainTags);
}
