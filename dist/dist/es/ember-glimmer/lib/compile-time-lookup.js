export default class CompileTimeLookup {
    constructor(resolver) {
        this.resolver = resolver;
    }
    getCapabilities(handle) {
        let definition = this.resolver.resolve(handle);
        let { manager, state } = definition;
        return manager.getCapabilities(state);
    }
    getLayout(handle) {
        const { manager, state } = this.resolver.resolve(handle);
        const capabilities = manager.getCapabilities(state);
        if (capabilities.dynamicLayout) {
            return null;
        }
        const invocation = manager.getLayout(state, this.resolver);
        return {
            // TODO: this seems weird, it already is compiled
            compile() {
                return invocation.handle;
            },
            symbolTable: invocation.symbolTable,
        };
    }
    lookupHelper(name, referrer) {
        return this.resolver.lookupHelper(name, referrer);
    }
    lookupModifier(name, referrer) {
        return this.resolver.lookupModifier(name, referrer);
    }
    lookupComponentDefinition(name, referrer) {
        return this.resolver.lookupComponentHandle(name, referrer);
    }
    lookupPartial(name, referrer) {
        return this.resolver.lookupPartial(name, referrer);
    }
}
