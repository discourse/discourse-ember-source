import { set } from '@ember/-internals/metal';
import { assert, debugFreeze } from '@ember/debug';
import { CONSTANT_TAG, isConst } from '@glimmer/reference';
import { RootReference } from '../utils/references';
import InternalComponentManager from './internal';
const CAPABILITIES = {
    dynamicLayout: false,
    dynamicTag: false,
    prepareArgs: true,
    createArgs: true,
    attributeHook: false,
    elementHook: false,
    createCaller: true,
    dynamicScope: false,
    updateHook: true,
    createInstance: true,
};
const EMPTY_POSITIONAL_ARGS = [];
debugFreeze(EMPTY_POSITIONAL_ARGS);
export default class InputComponentManager extends InternalComponentManager {
    getCapabilities() {
        return CAPABILITIES;
    }
    prepareArgs(_state, args) {
        assert('The `<Input />` component does not take any positional arguments', args.positional.length === 0);
        let __ARGS__ = args.named.capture().map;
        return {
            positional: EMPTY_POSITIONAL_ARGS,
            named: {
                __ARGS__: new RootReference(__ARGS__),
                type: args.named.get('type'),
            },
        };
    }
    create(_env, { ComponentClass }, args, _dynamicScope, caller) {
        assert('caller must be const', isConst(caller));
        let type = args.named.get('type');
        let instance = ComponentClass.create({
            caller: caller.value(),
            type: type.value(),
        });
        return { type, instance };
    }
    getSelf({ instance }) {
        return new RootReference(instance);
    }
    getTag() {
        return CONSTANT_TAG;
    }
    update({ type, instance }) {
        set(instance, 'type', type.value());
    }
    getDestructor({ instance }) {
        return instance;
    }
}
export const InputComponentManagerFactory = (owner) => {
    return new InputComponentManager(owner);
};
