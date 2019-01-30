import { valueForCapturedArgs } from '../utils/managers';
// Currently there are no capabilities for modifiers
export function capabilities(_managerAPI, _optionalFeatures) {
    return {};
}
export class CustomModifierDefinition {
    constructor(name, ModifierClass, delegate) {
        this.name = name;
        this.ModifierClass = ModifierClass;
        this.delegate = delegate;
        this.manager = CUSTOM_MODIFIER_MANAGER;
        this.state = {
            ModifierClass,
            name,
            delegate,
        };
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
        let modifierArgs = valueForCapturedArgs(args);
        delegate.destroyModifier(modifier, modifierArgs);
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
class CustomModifierManager {
    create(element, definition, args) {
        const capturedArgs = args.capture();
        let modifierArgs = valueForCapturedArgs(capturedArgs);
        let instance = definition.delegate.createModifier(definition.ModifierClass, modifierArgs);
        return new CustomModifierState(element, definition.delegate, instance, capturedArgs);
    }
    getTag({ args }) {
        return args.tag;
    }
    install(state) {
        let { element, args, delegate, modifier } = state;
        let modifierArgs = valueForCapturedArgs(args);
        delegate.installModifier(modifier, element, modifierArgs);
    }
    update(state) {
        let { args, delegate, modifier } = state;
        let modifierArgs = valueForCapturedArgs(args);
        delegate.updateModifier(modifier, modifierArgs);
    }
    getDestructor(state) {
        return state;
    }
}
const CUSTOM_MODIFIER_MANAGER = new CustomModifierManager();
