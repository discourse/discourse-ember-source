import { DEBUG } from '@glimmer/env';
class ComponentAssertionReference {
    constructor(component, message) {
        this.component = component;
        this.message = message;
        this.tag = component.tag;
    }
    value() {
        let value = this.component.value();
        if (typeof value === 'string') {
            throw new TypeError(this.message);
        }
        return value;
    }
    get(property) {
        return this.component.get(property);
    }
}
export default (_vm, args) => {
    if (DEBUG) {
        return new ComponentAssertionReference(args.positional.at(0), args.positional
            .at(1)
            .value());
    }
    else {
        return args.positional.at(0);
    }
};
