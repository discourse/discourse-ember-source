import { GLIMMER_CUSTOM_COMPONENT_MANAGER } from '@ember/canary-features';
import { getManager, setManager } from './managers';
export function setComponentManager(stringOrFunction, obj) {
    let factory;
    if (typeof stringOrFunction === 'string') {
        factory = function (owner) {
            return owner.lookup(`component-manager:${stringOrFunction}`);
        };
    }
    else {
        factory = stringOrFunction;
    }
    return setManager(factory, obj);
}
export function getComponentManager(obj) {
    if (!GLIMMER_CUSTOM_COMPONENT_MANAGER) {
        return;
    }
    return getManager(obj);
}
