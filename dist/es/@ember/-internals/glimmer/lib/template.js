import { getOwner } from '@ember/-internals/owner';
import { templateFactory } from '@glimmer/opcode-compiler';
export default function template(json) {
    return new FactoryWrapper(templateFactory(json));
}
class FactoryWrapper {
    constructor(factory) {
        this.factory = factory;
        this.id = factory.id;
        this.meta = factory.meta;
    }
    create(injections) {
        const owner = getOwner(injections);
        return this.factory.create(injections.compiler, { owner });
    }
}
