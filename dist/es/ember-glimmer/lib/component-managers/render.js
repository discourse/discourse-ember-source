import { RENDER_HELPER } from '@ember/deprecated-features';
import { CONSTANT_TAG } from '@glimmer/reference';
import { DEBUG } from '@glimmer/env';
import { generateController, generateControllerFactory } from 'ember-routing';
import { OrphanedOutletReference } from '../utils/outlet';
import { RootReference } from '../utils/references';
import AbstractManager from './abstract';
let NON_SINGLETON_RENDER_MANAGER;
let SINGLETON_RENDER_MANAGER;
let RenderDefinition;
if (RENDER_HELPER) {
    class AbstractRenderManager extends AbstractManager {
        create(env, definition, args, dynamicScope) {
            let { name } = definition;
            if (DEBUG) {
                this._pushToDebugStack(`controller:${name} (with the render helper)`, env);
            }
            if (dynamicScope.rootOutletState) {
                dynamicScope.outletState = new OrphanedOutletReference(dynamicScope.rootOutletState, name);
            }
            return this.createRenderState(args, env.owner, name);
        }
        getLayout({ template }) {
            const layout = template.asLayout();
            return {
                handle: layout.compile(),
                symbolTable: layout.symbolTable,
            };
        }
        getSelf({ controller }) {
            return new RootReference(controller);
        }
    }
    if (DEBUG) {
        AbstractRenderManager.prototype.didRenderLayout = function () {
            this.debugStack.pop();
        };
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
        updateHook: true,
        createInstance: true,
    };
    class SingletonRenderManager extends AbstractRenderManager {
        createRenderState(_args, owner, name) {
            let controller = owner.lookup(`controller:${name}`) || generateController(owner, name);
            return { controller };
        }
        getCapabilities(_) {
            return CAPABILITIES;
        }
        getTag() {
            // todo this should be the tag of the state args
            return CONSTANT_TAG;
        }
        getDestructor() {
            return null;
        }
    }
    SINGLETON_RENDER_MANAGER = new SingletonRenderManager();
    const NONSINGLETON_CAPABILITIES = {
        dynamicLayout: false,
        dynamicTag: false,
        prepareArgs: false,
        createArgs: true,
        attributeHook: false,
        elementHook: false,
        dynamicScope: true,
        createCaller: false,
        updateHook: true,
        createInstance: true,
    };
    class NonSingletonRenderManager extends AbstractRenderManager {
        createRenderState(args, owner, name) {
            let model = args.positional.at(1);
            let factory = owner.factoryFor(`controller:${name}`) ||
                generateControllerFactory(owner, `controller:${name}`);
            let controller = factory.create({ model: model.value() });
            return { controller, model };
        }
        update({ controller, model }) {
            controller.set('model', model.value());
        }
        getCapabilities(_) {
            return NONSINGLETON_CAPABILITIES;
        }
        getTag({ model }) {
            return model.tag;
        }
        getDestructor({ controller }) {
            return controller;
        }
    }
    NON_SINGLETON_RENDER_MANAGER = new NonSingletonRenderManager();
    RenderDefinition = class RenderDefinition {
        constructor(name, template, manager) {
            this.manager = manager;
            this.state = {
                name,
                template,
            };
        }
    };
}
export { RenderDefinition, NON_SINGLETON_RENDER_MANAGER, SINGLETON_RENDER_MANAGER };
