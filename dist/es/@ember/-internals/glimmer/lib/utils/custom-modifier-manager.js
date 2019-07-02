import { getManager, setManager } from './managers';
export function setModifierManager(factory, obj) {
    return setManager({ factory, internal: false, type: 'modifier' }, obj);
}
export function getModifierManager(obj) {
    let wrapper = getManager(obj);
    if (wrapper && !wrapper.internal && wrapper.type === 'modifier') {
        return wrapper.factory;
    }
    else {
        return undefined;
    }
}
