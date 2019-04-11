import { privatize as P } from '@ember/-internals/container';
import { ENV } from '@ember/-internals/environment';
import { setOwner } from '@ember/-internals/owner';
import { lookupComponent, lookupPartial } from '@ember/-internals/views';
import { EMBER_GLIMMER_ARRAY_HELPER, EMBER_MODULE_UNIFICATION, GLIMMER_CUSTOM_COMPONENT_MANAGER, GLIMMER_MODIFIER_MANAGER, } from '@ember/canary-features';
import { assert } from '@ember/debug';
import { _instrumentStart } from '@ember/instrumentation';
import { LazyCompiler, Macros, PartialDefinition } from '@glimmer/opcode-compiler';
import { getDynamicVar } from '@glimmer/runtime';
import CompileTimeLookup from './compile-time-lookup';
import { CurlyComponentDefinition } from './component-managers/curly';
import { CustomManagerDefinition } from './component-managers/custom';
import { TemplateOnlyComponentDefinition } from './component-managers/template-only';
import { isHelperFactory, isSimpleHelper } from './helper';
import { default as componentAssertionHelper } from './helpers/-assert-implicit-component-helper-argument';
import { default as classHelper } from './helpers/-class';
import { default as htmlSafeHelper } from './helpers/-html-safe';
import { default as inputTypeHelper } from './helpers/-input-type';
import { default as normalizeClassHelper } from './helpers/-normalize-class';
import { default as action } from './helpers/action';
import { default as array } from './helpers/array';
import { default as concat } from './helpers/concat';
import { default as eachIn } from './helpers/each-in';
import { default as get } from './helpers/get';
import { default as hash } from './helpers/hash';
import { inlineIf, inlineUnless } from './helpers/if-unless';
import { default as log } from './helpers/log';
import { default as mut } from './helpers/mut';
import { default as queryParams } from './helpers/query-param';
import { default as readonly } from './helpers/readonly';
import { default as unbound } from './helpers/unbound';
import ActionModifierManager from './modifiers/action';
import { CustomModifierDefinition } from './modifiers/custom';
import { populateMacros } from './syntax';
import { mountHelper } from './syntax/mount';
import { outletHelper } from './syntax/outlet';
import { getComponentManager } from './utils/custom-component-manager';
import { getModifierManager } from './utils/custom-modifier-manager';
import { ClassBasedHelperReference, SimpleHelperReference } from './utils/references';
function instrumentationPayload(name) {
    return { object: `component:${name}` };
}
function makeOptions(moduleName, namespace) {
    return {
        source: moduleName !== undefined ? `template:${moduleName}` : undefined,
        namespace,
    };
}
const BUILTINS_HELPERS = {
    if: inlineIf,
    action,
    concat,
    get,
    hash,
    log,
    mut,
    'query-params': queryParams,
    readonly,
    unbound,
    unless: inlineUnless,
    '-class': classHelper,
    '-each-in': eachIn,
    '-input-type': inputTypeHelper,
    '-normalize-class': normalizeClassHelper,
    '-html-safe': htmlSafeHelper,
    '-get-dynamic-var': getDynamicVar,
    '-mount': mountHelper,
    '-outlet': outletHelper,
    '-assert-implicit-component-helper-argument': componentAssertionHelper,
};
if (EMBER_GLIMMER_ARRAY_HELPER) {
    BUILTINS_HELPERS['array'] = array;
}
const BUILTIN_MODIFIERS = {
    action: { manager: new ActionModifierManager(), state: null },
};
export default class RuntimeResolver {
    constructor() {
        this.handles = [
            undefined,
        ];
        this.objToHandle = new WeakMap();
        this.builtInHelpers = BUILTINS_HELPERS;
        this.builtInModifiers = BUILTIN_MODIFIERS;
        // supports directly imported late bound layouts on component.prototype.layout
        this.templateCache = new Map();
        this.componentDefinitionCache = new Map();
        this.customManagerCache = new Map();
        this.templateCacheHits = 0;
        this.templateCacheMisses = 0;
        this.componentDefinitionCount = 0;
        this.helperDefinitionCount = 0;
        let macros = new Macros();
        populateMacros(macros);
        this.compiler = new LazyCompiler(new CompileTimeLookup(this), this, macros);
    }
    /***  IRuntimeResolver ***/
    /**
     * public componentDefHandleCount = 0;
     * Called while executing Append Op.PushDynamicComponentManager if string
     */
    lookupComponentDefinition(name, meta) {
        assert('You cannot use `textarea` as a component name.', name !== 'textarea');
        assert('You cannot use `input` as a component name.', name !== 'input');
        let handle = this.lookupComponentHandle(name, meta);
        if (handle === null) {
            assert(`Could not find component named "${name}" (no component or template with that name was found)`);
            return null;
        }
        return this.resolve(handle);
    }
    lookupComponentHandle(name, meta) {
        let nextHandle = this.handles.length;
        let handle = this.handle(this._lookupComponentDefinition(name, meta));
        if (nextHandle === handle) {
            this.componentDefinitionCount++;
        }
        return handle;
    }
    /**
     * Called by RuntimeConstants to lookup unresolved handles.
     */
    resolve(handle) {
        return this.handles[handle];
    }
    // End IRuntimeResolver
    /**
     * Called by CompileTimeLookup compiling Unknown or Helper OpCode
     */
    lookupHelper(name, meta) {
        let nextHandle = this.handles.length;
        let helper = this._lookupHelper(name, meta);
        if (helper !== null) {
            let handle = this.handle(helper);
            if (nextHandle === handle) {
                this.helperDefinitionCount++;
            }
            return handle;
        }
        return null;
    }
    /**
     * Called by CompileTimeLookup compiling the
     */
    lookupModifier(name, meta) {
        return this.handle(this._lookupModifier(name, meta));
    }
    /**
     * Called by CompileTimeLookup to lookup partial
     */
    lookupPartial(name, meta) {
        let partial = this._lookupPartial(name, meta);
        return this.handle(partial);
    }
    // end CompileTimeLookup
    /**
     * Creates a template with injections from a directly imported template factory.
     * @param templateFactory the directly imported template factory.
     * @param owner the owner the template instance would belong to if resolved
     */
    createTemplate(factory, owner) {
        let cache = this.templateCache.get(owner);
        let template;
        if (cache === undefined) {
            cache = new Map();
            this.templateCache.set(owner, cache);
        }
        else {
            template = cache.get(factory);
        }
        if (template === undefined) {
            const { compiler } = this;
            const injections = { compiler };
            setOwner(injections, owner);
            template = factory.create(injections);
            cache.set(factory, template);
            this.templateCacheMisses++;
        }
        else {
            this.templateCacheHits++;
        }
        return template;
    }
    // needed for lazy compile time lookup
    handle(obj) {
        if (obj === undefined || obj === null) {
            return null;
        }
        let handle = this.objToHandle.get(obj);
        if (handle === undefined) {
            handle = this.handles.push(obj) - 1;
            this.objToHandle.set(obj, handle);
        }
        return handle;
    }
    _lookupHelper(_name, meta) {
        const helper = this.builtInHelpers[_name];
        if (helper !== undefined) {
            return helper;
        }
        const { owner, moduleName } = meta;
        let name = _name;
        let namespace = undefined;
        if (EMBER_MODULE_UNIFICATION) {
            const parsed = this._parseNameForNamespace(_name);
            name = parsed.name;
            namespace = parsed.namespace;
        }
        const options = makeOptions(moduleName, namespace);
        const factory = owner.factoryFor(`helper:${name}`, options) || owner.factoryFor(`helper:${name}`);
        if (!isHelperFactory(factory)) {
            return null;
        }
        return (vm, args) => {
            const helper = factory.create();
            if (isSimpleHelper(helper)) {
                return new SimpleHelperReference(helper.compute, args.capture());
            }
            vm.newDestroyable(helper);
            return ClassBasedHelperReference.create(helper, args.capture());
        };
    }
    _lookupPartial(name, meta) {
        const template = lookupPartial(name, meta.owner);
        if (template) {
            return new PartialDefinition(name, template);
        }
        else {
            throw new Error(`${name} is not a partial`);
        }
    }
    _lookupModifier(name, meta) {
        let builtin = this.builtInModifiers[name];
        if (GLIMMER_MODIFIER_MANAGER && builtin === undefined) {
            let { owner } = meta;
            let modifier = owner.factoryFor(`modifier:${name}`);
            if (modifier !== undefined) {
                let managerFactory = getModifierManager(modifier.class);
                let manager = managerFactory(owner);
                return new CustomModifierDefinition(name, modifier, manager);
            }
        }
        return builtin;
    }
    _parseNameForNamespace(_name) {
        let name = _name;
        let namespace = undefined;
        let namespaceDelimiterOffset = _name.indexOf('::');
        if (namespaceDelimiterOffset !== -1) {
            name = _name.slice(namespaceDelimiterOffset + 2);
            namespace = _name.slice(0, namespaceDelimiterOffset);
        }
        return { name, namespace };
    }
    _lookupComponentDefinition(_name, meta) {
        let name = _name;
        let namespace = undefined;
        if (EMBER_MODULE_UNIFICATION) {
            const parsed = this._parseNameForNamespace(_name);
            name = parsed.name;
            namespace = parsed.namespace;
        }
        let { layout, component } = lookupComponent(meta.owner, name, makeOptions(meta.moduleName, namespace));
        let key = component === undefined ? layout : component;
        if (key === undefined) {
            return null;
        }
        let cachedComponentDefinition = this.componentDefinitionCache.get(key);
        if (cachedComponentDefinition !== undefined) {
            return cachedComponentDefinition;
        }
        let finalizer = _instrumentStart('render.getComponentDefinition', instrumentationPayload, name);
        let definition;
        if (layout !== undefined && component === undefined && ENV._TEMPLATE_ONLY_GLIMMER_COMPONENTS) {
            definition = new TemplateOnlyComponentDefinition(layout);
        }
        if (GLIMMER_CUSTOM_COMPONENT_MANAGER &&
            component !== undefined &&
            component.class !== undefined) {
            let managerFactory = getComponentManager(component.class);
            if (managerFactory) {
                let delegate = managerFactory(meta.owner);
                definition = new CustomManagerDefinition(name, component, delegate, layout || meta.owner.lookup(P `template:components/-default`));
            }
        }
        if (definition === undefined) {
            definition = new CurlyComponentDefinition(name, component || meta.owner.factoryFor(P `component:-default`), null, layout // TODO fix type
            );
        }
        finalizer();
        this.componentDefinitionCache.set(key, definition);
        return definition;
    }
    _lookupComponentManager(owner, managerId) {
        if (this.customManagerCache.has(managerId)) {
            return this.customManagerCache.get(managerId);
        }
        let delegate = owner.lookup(`component-manager:${managerId}`);
        this.customManagerCache.set(managerId, delegate);
        return delegate;
    }
}
