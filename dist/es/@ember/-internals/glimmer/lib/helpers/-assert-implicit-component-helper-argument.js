import { assert } from '@ember/debug';
import { DEBUG } from '@glimmer/env';
let helper;
if (DEBUG) {
    class ComponentAssertionReference {
        constructor(component, message) {
            this.component = component;
            this.message = message;
            this.tag = component.tag;
        }
        value() {
            let value = this.component.value();
            assert(this.message, typeof value !== 'string');
            return value;
        }
        get(property) {
            return this.component.get(property);
        }
    }
    helper = (_vm, args) => new ComponentAssertionReference(args.positional.at(0), args.positional.at(1).value());
}
else {
    helper = (_vm, args) => args.positional.at(0);
}
export default helper;
