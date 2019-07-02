import { ENV } from '@ember/-internals/environment';
import { guidFor } from '@ember/-internals/utils';
import { _instrumentStart } from '@ember/instrumentation';
import { assign } from '@ember/polyfills';
import { DEBUG } from '@glimmer/env';
import { CONSTANT_TAG } from '@glimmer/reference';
import { UNDEFINED_REFERENCE, } from '@glimmer/runtime';
import { RootReference } from '../utils/references';
import AbstractManager from './abstract';
function instrumentationPayload(def) {
    return { object: `${def.name}:${def.outlet}` };
}
const CAPABILITIES = {
    dynamicLayout: false,
    dynamicTag: false,
    prepareArgs: false,
    createArgs: false,
    attributeHook: false,
    elementHook: false,
    createCaller: true,
    dynamicScope: true,
    updateHook: false,
    createInstance: true,
};
class OutletComponentManager extends AbstractManager {
    create(environment, definition, _args, dynamicScope) {
        if (DEBUG) {
            this._pushToDebugStack(`template:${definition.template.referrer.moduleName}`, environment);
        }
        dynamicScope.outletState = definition.ref;
        let controller = definition.controller;
        let self = controller === undefined ? UNDEFINED_REFERENCE : new RootReference(controller);
        return {
            self,
            finalize: _instrumentStart('render.outlet', instrumentationPayload, definition),
        };
    }
    getLayout({ template }, _resolver) {
        // The router has already resolved the template
        const layout = template.asLayout();
        return {
            handle: layout.compile(),
            symbolTable: layout.symbolTable,
        };
    }
    getCapabilities() {
        return CAPABILITIES;
    }
    getSelf({ self }) {
        return self;
    }
    getTag() {
        // an outlet has no hooks
        return CONSTANT_TAG;
    }
    didRenderLayout(state) {
        state.finalize();
        if (DEBUG) {
            this.debugStack.pop();
        }
    }
    getDestructor() {
        return null;
    }
}
const OUTLET_MANAGER = new OutletComponentManager();
export class OutletComponentDefinition {
    constructor(state, manager = OUTLET_MANAGER) {
        this.state = state;
        this.manager = manager;
    }
}
export function createRootOutlet(outletView) {
    if (ENV._APPLICATION_TEMPLATE_WRAPPER) {
        const WRAPPED_CAPABILITIES = assign({}, CAPABILITIES, {
            dynamicTag: true,
            elementHook: true,
        });
        const WrappedOutletComponentManager = class extends OutletComponentManager {
            getTagName(_component) {
                return 'div';
            }
            getLayout(state) {
                // The router has already resolved the template
                const template = state.template;
                const layout = template.asWrappedLayout();
                return {
                    handle: layout.compile(),
                    symbolTable: layout.symbolTable,
                };
            }
            getCapabilities() {
                return WRAPPED_CAPABILITIES;
            }
            didCreateElement(component, element, _operations) {
                // to add GUID id and class
                element.setAttribute('class', 'ember-view');
                element.setAttribute('id', guidFor(component));
            }
        };
        const WRAPPED_OUTLET_MANAGER = new WrappedOutletComponentManager();
        return new OutletComponentDefinition(outletView.state, WRAPPED_OUTLET_MANAGER);
    }
    else {
        return new OutletComponentDefinition(outletView.state);
    }
}
