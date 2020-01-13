import { _WeakSet as WeakSet } from '@ember/polyfills';
const HAS_SUPER_PATTERN = /\.(_super|call\(this|apply\(this)/;
const fnToString = Function.prototype.toString;
export const checkHasSuper = (() => {
    let sourceAvailable = fnToString
        .call(function () {
        return this;
    })
        .indexOf('return this') > -1;
    if (sourceAvailable) {
        return function checkHasSuper(func) {
            return HAS_SUPER_PATTERN.test(fnToString.call(func));
        };
    }
    return function checkHasSuper() {
        return true;
    };
})();
const HAS_SUPER_MAP = new WeakMap();
export const ROOT = Object.freeze(function () { });
HAS_SUPER_MAP.set(ROOT, false);
function hasSuper(func) {
    let hasSuper = HAS_SUPER_MAP.get(func);
    if (hasSuper === undefined) {
        hasSuper = checkHasSuper(func);
        HAS_SUPER_MAP.set(func, hasSuper);
    }
    return hasSuper;
}
const OBSERVERS_MAP = new WeakMap();
export function setObservers(func, observers) {
    OBSERVERS_MAP.set(func, observers);
}
export function getObservers(func) {
    return OBSERVERS_MAP.get(func);
}
const LISTENERS_MAP = new WeakMap();
export function setListeners(func, listeners) {
    if (listeners) {
        LISTENERS_MAP.set(func, listeners);
    }
}
export function getListeners(func) {
    return LISTENERS_MAP.get(func);
}
const IS_WRAPPED_FUNCTION_SET = new WeakSet();
/**
  Wraps the passed function so that `this._super` will point to the superFunc
  when the function is invoked. This is the primitive we use to implement
  calls to super.

  @private
  @method wrap
  @for Ember
  @param {Function} func The function to call
  @param {Function} superFunc The super function.
  @return {Function} wrapped function.
*/
export function wrap(func, superFunc) {
    if (!hasSuper(func)) {
        return func;
    }
    // ensure an unwrapped super that calls _super is wrapped with a terminal _super
    if (!IS_WRAPPED_FUNCTION_SET.has(superFunc) && hasSuper(superFunc)) {
        return _wrap(func, _wrap(superFunc, ROOT));
    }
    return _wrap(func, superFunc);
}
function _wrap(func, superFunc) {
    function superWrapper() {
        let orig = this._super;
        this._super = superFunc;
        let ret = func.apply(this, arguments);
        this._super = orig;
        return ret;
    }
    IS_WRAPPED_FUNCTION_SET.add(superWrapper);
    setObservers(superWrapper, getObservers(func));
    setListeners(superWrapper, getListeners(func));
    return superWrapper;
}
