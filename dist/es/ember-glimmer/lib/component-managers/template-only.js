import { CONSTANT_TAG } from '@glimmer/reference';
import { NULL_REFERENCE, } from '@glimmer/runtime';
import AbstractManager from './abstract';
const CAPABILITIES = {
    dynamicLayout: false,
    dynamicTag: false,
    prepareArgs: false,
    createArgs: false,
    attributeHook: false,
    elementHook: false,
    createCaller: true,
    dynamicScope: true,
    updateHook: true,
    createInstance: true,
};
export default class TemplateOnlyComponentManager extends AbstractManager {
    getLayout(template) {
        const layout = template.asLayout();
        return {
            handle: layout.compile(),
            symbolTable: layout.symbolTable,
        };
    }
    getCapabilities() {
        return CAPABILITIES;
    }
    create() {
        return null;
    }
    getSelf() {
        return NULL_REFERENCE;
    }
    getTag() {
        return CONSTANT_TAG;
    }
    getDestructor() {
        return null;
    }
}
const MANAGER = new TemplateOnlyComponentManager();
export class TemplateOnlyComponentDefinition {
    constructor(state) {
        this.state = state;
        this.manager = MANAGER;
    }
}
