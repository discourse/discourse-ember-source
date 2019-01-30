import { GLIMMER_MODIFIER_MANAGER } from '@ember/canary-features';
import { getManager, setManager } from './managers';
export function setModifierManager(factory, obj) {
    return setManager(factory, obj);
}
export function getModifierManager(obj) {
    if (!GLIMMER_MODIFIER_MANAGER) {
        return;
    }
    return getManager(obj);
}
