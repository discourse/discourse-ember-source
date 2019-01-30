import { isArray } from '@ember/-internals/runtime';
export default function toBool(predicate) {
    if (isArray(predicate)) {
        return predicate.length !== 0;
    }
    else {
        return !!predicate;
    }
}
