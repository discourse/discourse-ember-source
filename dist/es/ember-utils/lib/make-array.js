const { isArray } = Array;
export default function makeArray(obj) {
    if (obj === null || obj === undefined) {
        return [];
    }
    return isArray(obj) ? obj : [obj];
}
