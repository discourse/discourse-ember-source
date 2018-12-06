import { isObject } from './spec';
const NAMES = new WeakMap();
export function setName(obj, name) {
    if (isObject(obj))
        NAMES.set(obj, name);
}
export function getName(obj) {
    return NAMES.get(obj);
}
