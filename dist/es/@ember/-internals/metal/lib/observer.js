import { ENV } from '@ember/-internals/environment';
import { peekMeta } from '@ember/-internals/meta';
import { EMBER_METAL_TRACKED_PROPERTIES } from '@ember/canary-features';
import { schedule } from '@ember/runloop';
import { CURRENT_TAG } from '@glimmer/reference';
import { getChainTagsForKey } from './chain-tags';
import changeEvent from './change_event';
import { addListener, removeListener, sendEvent } from './events';
import { unwatch, watch } from './watching';
const SYNC_DEFAULT = !ENV._DEFAULT_ASYNC_OBSERVERS;
const SYNC_OBSERVERS = new Map();
const ASYNC_OBSERVERS = new Map();
/**
@module @ember/object
*/
/**
  @method addObserver
  @static
  @for @ember/object/observers
  @param obj
  @param {String} path
  @param {Object|Function} target
  @param {Function|String} [method]
  @public
*/
export function addObserver(obj, path, target, method, sync = SYNC_DEFAULT) {
    let eventName = changeEvent(path);
    addListener(obj, eventName, target, method, false, sync);
    if (EMBER_METAL_TRACKED_PROPERTIES) {
        let meta = peekMeta(obj);
        if (meta === null || !(meta.isPrototypeMeta(obj) || meta.isInitializing())) {
            activateObserver(obj, eventName, sync);
        }
    }
    else {
        watch(obj, path);
    }
}
/**
  @method removeObserver
  @static
  @for @ember/object/observers
  @param obj
  @param {String} path
  @param {Object|Function} target
  @param {Function|String} [method]
  @public
*/
export function removeObserver(obj, path, target, method, sync = SYNC_DEFAULT) {
    let eventName = changeEvent(path);
    if (EMBER_METAL_TRACKED_PROPERTIES) {
        let meta = peekMeta(obj);
        if (meta === null || !(meta.isPrototypeMeta(obj) || meta.isInitializing())) {
            deactivateObserver(obj, eventName, sync);
        }
    }
    else {
        unwatch(obj, path);
    }
    removeListener(obj, eventName, target, method);
}
function getOrCreateActiveObserversFor(target, sync) {
    let observerMap = sync === true ? SYNC_OBSERVERS : ASYNC_OBSERVERS;
    if (!observerMap.has(target)) {
        observerMap.set(target, new Map());
    }
    return observerMap.get(target);
}
export function activateObserver(target, eventName, sync = false) {
    let activeObservers = getOrCreateActiveObserversFor(target, sync);
    if (activeObservers.has(eventName)) {
        activeObservers.get(eventName).count++;
    }
    else {
        let [path] = eventName.split(':');
        let tag = getChainTagsForKey(target, path);
        activeObservers.set(eventName, {
            count: 1,
            path,
            tag,
            lastRevision: tag.value(),
            suspended: false,
        });
    }
}
export function deactivateObserver(target, eventName, sync = false) {
    let observerMap = sync === true ? SYNC_OBSERVERS : ASYNC_OBSERVERS;
    let activeObservers = observerMap.get(target);
    if (activeObservers !== undefined) {
        let observer = activeObservers.get(eventName);
        observer.count--;
        if (observer.count === 0) {
            activeObservers.delete(eventName);
            if (activeObservers.size === 0) {
                observerMap.delete(target);
            }
        }
    }
}
/**
 * Primarily used for cases where we are redefining a class, e.g. mixins/reopen
 * being applied later. Revalidates all the observers, resetting their tags.
 *
 * @private
 * @param target
 */
export function revalidateObservers(target) {
    if (ASYNC_OBSERVERS.has(target)) {
        ASYNC_OBSERVERS.get(target).forEach(observer => {
            observer.tag = getChainTagsForKey(target, observer.path);
            observer.lastRevision = observer.tag.value();
        });
    }
    if (SYNC_OBSERVERS.has(target)) {
        SYNC_OBSERVERS.get(target).forEach(observer => {
            observer.tag = getChainTagsForKey(target, observer.path);
            observer.lastRevision = observer.tag.value();
        });
    }
}
let lastKnownRevision = 0;
export function flushAsyncObservers() {
    if (lastKnownRevision === CURRENT_TAG.value()) {
        return;
    }
    lastKnownRevision = CURRENT_TAG.value();
    ASYNC_OBSERVERS.forEach((activeObservers, target) => {
        let meta = peekMeta(target);
        if (meta && (meta.isSourceDestroying() || meta.isMetaDestroyed())) {
            ASYNC_OBSERVERS.delete(target);
            return;
        }
        activeObservers.forEach((observer, eventName) => {
            if (!observer.tag.validate(observer.lastRevision)) {
                schedule('actions', () => {
                    try {
                        sendEvent(target, eventName, [target, observer.path]);
                    }
                    finally {
                        observer.tag = getChainTagsForKey(target, observer.path);
                        observer.lastRevision = observer.tag.value();
                    }
                });
            }
        });
    });
}
export function flushSyncObservers() {
    // When flushing synchronous observers, we know that something has changed (we
    // only do this during a notifyPropertyChange), so there's no reason to check
    // a global revision.
    SYNC_OBSERVERS.forEach((activeObservers, target) => {
        let meta = peekMeta(target);
        if (meta && (meta.isSourceDestroying() || meta.isMetaDestroyed())) {
            SYNC_OBSERVERS.delete(target);
            return;
        }
        activeObservers.forEach((observer, eventName) => {
            if (!observer.suspended && !observer.tag.validate(observer.lastRevision)) {
                try {
                    observer.suspended = true;
                    sendEvent(target, eventName, [target, observer.path]);
                }
                finally {
                    observer.suspended = false;
                    observer.tag = getChainTagsForKey(target, observer.path);
                    observer.lastRevision = observer.tag.value();
                }
            }
        });
    });
}
export function setObserverSuspended(target, property, suspended) {
    let activeObservers = SYNC_OBSERVERS.get(target);
    if (!activeObservers) {
        return;
    }
    let observer = activeObservers.get(changeEvent(property));
    if (observer) {
        observer.suspended = suspended;
    }
}
