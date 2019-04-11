let __test_context__;
/**
 * Stores the provided context as the "global testing context".
 *
 * @param {Object} context the context to use
 */
export function setContext(context) {
    __test_context__ = context;
}
/**
 * Retrive the "global testing context" as stored by `setContext`.
 *
 * @returns {Object} the previously stored testing context
 */
export function getContext() {
    return __test_context__;
}
/**
 * Clear the "global testing context".
 */
export function unsetContext() {
    __test_context__ = undefined;
}
