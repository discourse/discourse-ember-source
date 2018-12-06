import { DEBUG } from '@glimmer/env';
// implements the ComponentManager interface as defined in glimmer:
// tslint:disable-next-line:max-line-length
// https://github.com/glimmerjs/glimmer-vm/blob/v0.24.0-beta.4/packages/%40glimmer/runtime/lib/component/interfaces.ts#L21
export default class AbstractManager {
    constructor() {
        this.debugStack = undefined;
    }
    prepareArgs(_state, _args) {
        return null;
    }
    didCreateElement(_component, _element, _operations) {
        // noop
    }
    // inheritors should also call `this.debugStack.pop()` to
    // ensure the rerendering assertion messages are properly
    // maintained
    didRenderLayout(_component, _bounds) {
        // noop
    }
    didCreate(_bucket) {
        // noop
    }
    // inheritors should also call `this._pushToDebugStack`
    // to ensure the rerendering assertion messages are
    // properly maintained
    update(_bucket, _dynamicScope) {
        // noop
    }
    // inheritors should also call `this.debugStack.pop()` to
    // ensure the rerendering assertion messages are properly
    // maintained
    didUpdateLayout(_bucket, _bounds) {
        // noop
    }
    didUpdate(_bucket) {
        // noop
    }
}
if (DEBUG) {
    AbstractManager.prototype._pushToDebugStack = function (name, environment) {
        this.debugStack = environment.debugStack;
        this.debugStack.push(name);
    };
    AbstractManager.prototype._pushEngineToDebugStack = function (name, environment) {
        this.debugStack = environment.debugStack;
        this.debugStack.pushEngine(name);
    };
}
