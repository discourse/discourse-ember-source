import { deprecate } from '@ember/debug';
import { COMPONENT_MANAGER_STRING_LOOKUP } from '@ember/deprecated-features';
import { getManager, setManager } from './managers';
export function setComponentManager(stringOrFunction, obj) {
    let factory;
    if (COMPONENT_MANAGER_STRING_LOOKUP && typeof stringOrFunction === 'string') {
        deprecate('Passing the name of the component manager to "setupComponentManager" is deprecated. Please pass a function that produces an instance of the manager.', false, {
            id: 'deprecate-string-based-component-manager',
            until: '4.0.0',
            url: 'https://emberjs.com/deprecations/v3.x/#toc_component-manager-string-lookup',
        });
        factory = function (owner) {
            return owner.lookup(`component-manager:${stringOrFunction}`);
        };
    }
    else {
        factory = stringOrFunction;
    }
    return setManager({ factory, internal: false, type: 'component' }, obj);
}
export function getComponentManager(obj) {
    let wrapper = getManager(obj);
    if (wrapper && !wrapper.internal && wrapper.type === 'component') {
        return wrapper.factory;
    }
    else {
        return undefined;
    }
}
