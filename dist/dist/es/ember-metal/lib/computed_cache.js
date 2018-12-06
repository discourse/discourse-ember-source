import { EMBER_METAL_TRACKED_PROPERTIES } from '@ember/canary-features';
const COMPUTED_PROPERTY_CACHED_VALUES = new WeakMap();
const COMPUTED_PROPERTY_LAST_REVISION = EMBER_METAL_TRACKED_PROPERTIES
    ? new WeakMap()
    : undefined;
/**
  Returns the cached value for a property, if one exists.
  This can be useful for peeking at the value of a computed
  property that is generated lazily, without accidentally causing
  it to be created.

  @method cacheFor
  @static
  @for @ember/object/internals
  @param {Object} obj the object whose property you want to check
  @param {String} key the name of the property whose cached value you want
    to return
  @return {Object} the cached value
  @public
*/
export function getCacheFor(obj) {
    let cache = COMPUTED_PROPERTY_CACHED_VALUES.get(obj);
    if (cache === undefined) {
        cache = new Map();
        if (EMBER_METAL_TRACKED_PROPERTIES) {
            COMPUTED_PROPERTY_LAST_REVISION.set(obj, new Map());
        }
        COMPUTED_PROPERTY_CACHED_VALUES.set(obj, cache);
    }
    return cache;
}
export function getCachedValueFor(obj, key) {
    let cache = COMPUTED_PROPERTY_CACHED_VALUES.get(obj);
    if (cache !== undefined) {
        return cache.get(key);
    }
}
export let setLastRevisionFor;
export let getLastRevisionFor;
if (EMBER_METAL_TRACKED_PROPERTIES) {
    setLastRevisionFor = (obj, key, revision) => {
        let lastRevision = COMPUTED_PROPERTY_LAST_REVISION.get(obj);
        lastRevision.set(key, revision);
    };
    getLastRevisionFor = (obj, key) => {
        let cache = COMPUTED_PROPERTY_LAST_REVISION.get(obj);
        if (cache === undefined) {
            return 0;
        }
        else {
            let revision = cache.get(key);
            return revision === undefined ? 0 : revision;
        }
    };
}
export function peekCacheFor(obj) {
    return COMPUTED_PROPERTY_CACHED_VALUES.get(obj);
}
