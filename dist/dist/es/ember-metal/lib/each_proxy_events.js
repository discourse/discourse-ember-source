export const EACH_PROXIES = new WeakMap();
export function eachProxyArrayWillChange(array, idx, removedCnt, addedCnt) {
    let eachProxy = EACH_PROXIES.get(array);
    if (eachProxy !== undefined) {
        eachProxy.arrayWillChange(array, idx, removedCnt, addedCnt);
    }
}
export function eachProxyArrayDidChange(array, idx, removedCnt, addedCnt) {
    let eachProxy = EACH_PROXIES.get(array);
    if (eachProxy !== undefined) {
        eachProxy.arrayDidChange(array, idx, removedCnt, addedCnt);
    }
}
