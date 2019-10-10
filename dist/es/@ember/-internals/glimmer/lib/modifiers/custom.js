import { CONSTANT_TAG } from '@glimmer/reference';
// Currently there are no capabilities for modifiers
export function capabilities(_managerAPI, _optionalFeatures) {
    return {};
}
export class CustomModifierDefinition {
    constructor(name, ModifierClass, delegate, isInteractive) {
        this.name = name;
        this.ModifierClass = ModifierClass;
        this.delegate = delegate;
        this.state = {
            ModifierClass,
            name,
            delegate,
        };
        this.manager = isInteractive
            ? CUSTOM_INTERACTIVE_MODIFIER_MANAGER
            : CUSTOM_NON_INTERACTIVE_MODIFIER_MANAGER;
    }
}
export class CustomModifierState {
    constructor(element, delegate, modifier, args) {
        this.element = element;
        this.delegate = delegate;
        this.modifier = modifier;
        this.args = args;
    }
    destroy() {
        const { delegate, modifier, args } = this;
        delegate.destroyModifier(modifier, args.value());
    }
}
/**
  The CustomModifierManager allows addons to provide custom modifier
  implementations that integrate seamlessly into Ember. This is accomplished
  through a delegate, registered with the custom modifier manager, which
  implements a set of hooks that determine modifier behavior.
  To create a custom modifier manager, instantiate a new CustomModifierManager
  class and pass the delegate as the first argument:

  ```js
  let manager = new CustomModifierManager({
    // ...delegate implementation...
  });
  ```

  ## Delegate Hooks

  Throughout the lifecycle of a modifier, the modifier manager will invoke
  delegate hooks that are responsible for surfacing those lifecycle changes to
  the end developer.
  * `createModifier()` - invoked when a new instance of a modifier should be created
  * `installModifier()` - invoked when the modifier is installed on the element
  * `updateModifier()` - invoked when the arguments passed to a modifier change
  * `destroyModifier()` - invoked when the modifier is about to be destroyed
*/
class InteractiveCustomModifierManager {
    create(element, definition, args) {
        const capturedArgs = args.capture();
        let instance = definition.delegate.createModifier(definition.ModifierClass, capturedArgs.value());
        return new CustomModifierState(element, definition.delegate, instance, capturedArgs);
    }
    getTag({ args }) {
        return args.tag;
    }
    install(state) {
        let { element, args, delegate, modifier } = state;
        delegate.installModifier(modifier, element, args.value());
    }
    update(state) {
        let { args, delegate, modifier } = state;
        delegate.updateModifier(modifier, args.value());
    }
    getDestructor(state) {
        return state;
    }
}
class NonInteractiveCustomModifierManager {
    create() {
        return null;
    }
    getTag() {
        return CONSTANT_TAG;
    }
    install() { }
    update() { }
    getDestructor() {
        return null;
    }
}
const CUSTOM_INTERACTIVE_MODIFIER_MANAGER = new InteractiveCustomModifierManager();
const CUSTOM_NON_INTERACTIVE_MODIFIER_MANAGER = new NonInteractiveCustomModifierManager();
