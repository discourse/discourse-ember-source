import { _WeakSet as WeakSet } from '@ember/polyfills';
import { isObject } from './spec';
const PROXIES = new WeakSet();
export function isProxy(value) {
    if (isObject(value)) {
        return PROXIES.has(value);
    }
    return false;
}
export function setProxy(object) {
    if (isObject(object)) {
        PROXIES.add(object);
    }
}
