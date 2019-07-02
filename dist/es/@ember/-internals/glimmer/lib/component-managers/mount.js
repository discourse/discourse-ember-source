import { DEBUG } from '@glimmer/env';
import { CONSTANT_TAG } from '@glimmer/reference';
import { generateControllerFactory } from '@ember/-internals/routing';
import { RootReference } from '../utils/references';
import AbstractManager from './abstract';
const CAPABILITIES = {
    dynamicLayout: true,
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
class MountManager extends AbstractManager {
    getDynamicLayout(state, _) {
        let template = state.engine.lookup('template:application');
        let layout = template.asLayout();
        return {
            handle: layout.compile(),
            symbolTable: layout.symbolTable,
        };
    }
    getCapabilities() {
        return CAPABILITIES;
    }
    create(environment, state) {
        if (DEBUG) {
            this._pushEngineToDebugStack(`engine:${state.name}`, environment);
        }
        // TODO
        // mount is a runtime helper, this shouldn't use dynamic layout
        // we should resolve the engine app template in the helper
        // it also should use the owner that looked up the mount helper.
        let engine = environment.owner.buildChildEngineInstance(state.name);
        engine.boot();
        let applicationFactory = engine.factoryFor(`controller:application`);
        let controllerFactory = applicationFactory || generateControllerFactory(engine, 'application');
        let controller;
        let self;
        let bucket;
        let tag;
        let modelRef = state.modelRef;
        if (modelRef === undefined) {
            controller = controllerFactory.create();
            self = new RootReference(controller);
            tag = CONSTANT_TAG;
            bucket = { engine, controller, self, tag };
        }
        else {
            let model = modelRef.value();
            let modelRev = modelRef.tag.value();
            controller = controllerFactory.create({ model });
            self = new RootReference(controller);
            tag = modelRef.tag;
            bucket = { engine, controller, self, tag, modelRef, modelRev };
        }
        return bucket;
    }
    getSelf({ self }) {
        return self;
    }
    getTag(state) {
        return state.tag;
    }
    getDestructor({ engine }) {
        return engine;
    }
    didRenderLayout() {
        if (DEBUG) {
            this.debugStack.pop();
        }
    }
    update(bucket) {
        let { controller, modelRef, modelRev } = bucket;
        if (!modelRef.tag.validate(modelRev)) {
            let model = modelRef.value();
            bucket.modelRev = modelRef.tag.value();
            controller.set('model', model);
        }
    }
}
const MOUNT_MANAGER = new MountManager();
export class MountDefinition {
    constructor(name, modelRef) {
        this.manager = MOUNT_MANAGER;
        this.state = { name, modelRef };
    }
}
