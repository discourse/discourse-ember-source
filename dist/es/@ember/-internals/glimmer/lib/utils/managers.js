const MANAGERS = new WeakMap();
const getPrototypeOf = Object.getPrototypeOf;
export function setManager(factory, obj) {
    MANAGERS.set(obj, factory);
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
    return;
}
export function valueForCapturedArgs(args) {
    return {
        named: args.named.value(),
        positional: args.positional.value(),
    };
}
