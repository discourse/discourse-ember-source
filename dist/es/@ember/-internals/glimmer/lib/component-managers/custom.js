import { consume } from '@ember/-internals/metal';
import { HAS_NATIVE_PROXY } from '@ember/-internals/utils';
import { EMBER_CUSTOM_COMPONENT_ARG_PROXY } from '@ember/canary-features';
import { assert } from '@ember/debug';
import { DEBUG } from '@glimmer/env';
import { RootReference } from '../utils/references';
import AbstractComponentManager from './abstract';
const CAPABILITIES = {
    dynamicLayout: false,
    dynamicTag: false,
    prepareArgs: false,
    createArgs: true,
    attributeHook: false,
    elementHook: false,
    createCaller: false,
    dynamicScope: true,
    updateHook: true,
    createInstance: true,
};
export function capabilities(managerAPI, options = {}) {
    assert('Invalid component manager compatibility specified', managerAPI === '3.4');
    let updateHook = true;
    if (EMBER_CUSTOM_COMPONENT_ARG_PROXY) {
        updateHook = 'updateHook' in options ? Boolean(options.updateHook) : true;
    }
    return {
        asyncLifeCycleCallbacks: Boolean(options.asyncLifecycleCallbacks),
        destructor: Boolean(options.destructor),
        updateHook,
    };
}
export function hasAsyncLifeCycleCallbacks(delegate) {
    return delegate.capabilities.asyncLifeCycleCallbacks;
}
export function hasDestructors(delegate) {
    return delegate.capabilities.destructor;
}
/**
  The CustomComponentManager allows addons to provide custom component
  implementations that integrate seamlessly into Ember. This is accomplished
  through a delegate, registered with the custom component manager, which
  implements a set of hooks that determine component behavior.

  To create a custom component manager, instantiate a new CustomComponentManager
  class and pass the delegate as the first argument:

  ```js
  let manager = new CustomComponentManager({
    // ...delegate implementation...
  });
  ```

  ## Delegate Hooks

  Throughout the lifecycle of a component, the component manager will invoke
  delegate hooks that are responsible for surfacing those lifecycle changes to
  the end developer.

  * `create()` - invoked when a new instance of a component should be created
  * `update()` - invoked when the arguments passed to a component change
  * `getContext()` - returns the object that should be
*/
export default class CustomComponentManager extends AbstractComponentManager {
    create(_env, definition, args) {
        const { delegate } = definition;
        const capturedArgs = args.capture();
        let value;
        let namedArgsProxy = {};
        if (EMBER_CUSTOM_COMPONENT_ARG_PROXY) {
            if (HAS_NATIVE_PROXY) {
                let handler = {
                    get(_target, prop) {
                        assert('args can only be strings', typeof prop === 'string');
                        let ref = capturedArgs.named.get(prop);
                        consume(ref.tag);
                        return ref.value();
                    },
                };
                if (DEBUG) {
                    handler.set = function (_target, prop) {
                        assert(`You attempted to set ${definition.ComponentClass.class}#${String(prop)} on a components arguments. Component arguments are immutable and cannot be updated directly, they always represent the values that are passed to your component. If you want to set default values, you should use a getter instead`);
                        return false;
                    };
                }
                namedArgsProxy = new Proxy(namedArgsProxy, handler);
            }
            else {
                capturedArgs.named.names.forEach(name => {
                    Object.defineProperty(namedArgsProxy, name, {
                        get() {
                            let ref = capturedArgs.named.get(name);
                            consume(ref.tag);
                            return ref.value();
                        },
                    });
                });
            }
            value = {
                named: namedArgsProxy,
                positional: capturedArgs.positional.value(),
            };
        }
        else {
            value = capturedArgs.value();
        }
        const component = delegate.createComponent(definition.ComponentClass.class, value);
        return new CustomComponentState(delegate, component, capturedArgs, namedArgsProxy);
    }
    update({ delegate, component, args, namedArgsProxy }) {
        let value;
        if (EMBER_CUSTOM_COMPONENT_ARG_PROXY) {
            value = {
                named: namedArgsProxy,
                positional: args.positional.value(),
            };
        }
        else {
            value = args.value();
        }
        delegate.updateComponent(component, value);
    }
    didCreate({ delegate, component }) {
        if (hasAsyncLifeCycleCallbacks(delegate)) {
            delegate.didCreateComponent(component);
        }
    }
    didUpdate({ delegate, component }) {
        if (hasAsyncLifeCycleCallbacks(delegate)) {
            delegate.didUpdateComponent(component);
        }
    }
    getContext({ delegate, component }) {
        delegate.getContext(component);
    }
    getSelf({ delegate, component }) {
        return RootReference.create(delegate.getContext(component));
    }
    getDestructor(state) {
        if (hasDestructors(state.delegate)) {
            return state;
        }
        else {
            return null;
        }
    }
    getCapabilities({ delegate, }) {
        return Object.assign({}, CAPABILITIES, {
            updateHook: delegate.capabilities.updateHook,
        });
    }
    getTag({ args }) {
        return args.tag;
    }
    didRenderLayout() { }
    getLayout(state) {
        return {
            handle: state.template.asLayout().compile(),
            symbolTable: state.symbolTable,
        };
    }
}
const CUSTOM_COMPONENT_MANAGER = new CustomComponentManager();
/**
 * Stores internal state about a component instance after it's been created.
 */
export class CustomComponentState {
    constructor(delegate, component, args, namedArgsProxy) {
        this.delegate = delegate;
        this.component = component;
        this.args = args;
        this.namedArgsProxy = namedArgsProxy;
    }
    destroy() {
        const { delegate, component } = this;
        if (hasDestructors(delegate)) {
            delegate.destroyComponent(component);
        }
    }
}
export class CustomManagerDefinition {
    constructor(name, ComponentClass, delegate, template) {
        this.name = name;
        this.ComponentClass = ComponentClass;
        this.delegate = delegate;
        this.template = template;
        this.manager = CUSTOM_COMPONENT_MANAGER;
        const layout = template.asLayout();
        const symbolTable = layout.symbolTable;
        this.symbolTable = symbolTable;
        this.state = {
            name,
            ComponentClass,
            template,
            symbolTable,
            delegate,
        };
    }
}
