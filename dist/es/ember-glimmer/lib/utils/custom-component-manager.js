import { GLIMMER_CUSTOM_COMPONENT_MANAGER } from '@ember/canary-features';
const getPrototypeOf = Object.getPrototypeOf;
const MANAGERS = new WeakMap();
export function setComponentManager(managerId, obj) {
    MANAGERS.set(obj, managerId);
    return obj;
}
export function getComponentManager(obj) {
    if (!GLIMMER_CUSTOM_COMPONENT_MANAGER) {
        return;
    }
    let pointer = obj;
    while (pointer !== undefined && pointer !== null) {
        if (MANAGERS.has(pointer)) {
            return MANAGERS.get(pointer);
        }
        pointer = getPrototypeOf(pointer);
    }
    return;
}
