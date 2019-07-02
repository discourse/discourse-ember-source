import { assert } from '@ember/debug';
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
    return {
        asyncLifeCycleCallbacks: Boolean(options.asyncLifecycleCallbacks),
        destructor: Boolean(options.destructor),
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
        const component = delegate.createComponent(definition.ComponentClass.class, capturedArgs.value());
        return new CustomComponentState(delegate, component, capturedArgs);
    }
    update({ delegate, component, args }) {
        delegate.updateComponent(component, args.value());
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
    getCapabilities() {
        return CAPABILITIES;
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
    constructor(delegate, component, args) {
        this.delegate = delegate;
        this.component = component;
        this.args = args;
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
