import global from './global';
// legacy imports/exports/lookup stuff (should we keep this??)
export const context = (function (global, Ember) {
    return Ember === undefined
        ? { imports: global, exports: global, lookup: global }
        : {
            // import jQuery
            imports: Ember.imports || global,
            // export Ember
            exports: Ember.exports || global,
            // search for Namespaces
            lookup: Ember.lookup || global,
        };
})(global, global.Ember);
export function getLookup() {
    return context.lookup;
}
export function setLookup(value) {
    context.lookup = value;
}
