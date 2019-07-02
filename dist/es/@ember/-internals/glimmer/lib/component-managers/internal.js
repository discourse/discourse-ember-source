import AbstractComponentManager from './abstract';
export class InternalComponentDefinition {
    constructor(manager, ComponentClass, layout) {
        this.manager = manager;
        this.state = { ComponentClass, layout };
    }
}
export default class InternalManager extends AbstractComponentManager {
    constructor(owner) {
        super();
        this.owner = owner;
    }
    getLayout({ layout: _layout }) {
        let layout = _layout.asLayout();
        return {
            handle: layout.compile(),
            symbolTable: layout.symbolTable,
        };
    }
}
