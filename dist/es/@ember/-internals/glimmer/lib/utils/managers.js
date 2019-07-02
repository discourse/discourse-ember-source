const MANAGERS = new WeakMap();
const getPrototypeOf = Object.getPrototypeOf;
export function setManager(wrapper, obj) {
    MANAGERS.set(obj, wrapper);
    return obj;
}
export function getManager(obj) {
    let pointer = obj;
    while (pointer !== undefined && pointer !== null) {
        if (MANAGERS.has(pointer)) {
            return MANAGERS.get(pointer);
        }
        pointer = getPrototypeOf(pointer);
    }
    return null;
}
