import { assert } from '@ember/debug';
import { combine, CONSTANT_TAG, UpdatableTag, } from '@glimmer/reference';
import { get, objectAt, tagFor, tagForProperty } from 'ember-metal';
import { _contentFor, isEmberArray } from 'ember-runtime';
import { guidFor, HAS_NATIVE_SYMBOL, isProxy } from 'ember-utils';
import { isEachIn } from '../helpers/each-in';
import { UpdatableReference } from './references';
const ITERATOR_KEY_GUID = 'be277757-bbbe-4620-9fcb-213ef433cca2';
export default function iterableFor(ref, keyPath) {
    if (isEachIn(ref)) {
        return new EachInIterable(ref, keyPath || '@key');
    }
    else {
        return new EachIterable(ref, keyPath || '@identity');
    }
}
class BoundedIterator {
    constructor(length, keyFor) {
        this.length = length;
        this.keyFor = keyFor;
        this.position = 0;
    }
    isEmpty() {
        return false;
    }
    memoFor(position) {
        return position;
    }
    next() {
        let { length, keyFor, position } = this;
        if (position >= length) {
            return null;
        }
        let value = this.valueFor(position);
        let memo = this.memoFor(position);
        let key = keyFor(value, memo, position);
        this.position++;
        return { key, value, memo };
    }
}
class ArrayIterator extends BoundedIterator {
    constructor(array, length, keyFor) {
        super(length, keyFor);
        this.array = array;
    }
    static from(array, keyFor) {
        let { length } = array;
        if (length === 0) {
            return EMPTY_ITERATOR;
        }
        else {
            return new this(array, length, keyFor);
        }
    }
    static fromForEachable(object, keyFor) {
        let array = [];
        object.forEach(item => array.push(item));
        return this.from(array, keyFor);
    }
    valueFor(position) {
        return this.array[position];
    }
}
class EmberArrayIterator extends BoundedIterator {
    constructor(array, length, keyFor) {
        super(length, keyFor);
        this.array = array;
    }
    static from(array, keyFor) {
        let { length } = array;
        if (length === 0) {
            return EMPTY_ITERATOR;
        }
        else {
            return new this(array, length, keyFor);
        }
    }
    valueFor(position) {
        return objectAt(this.array, position);
    }
}
class ObjectIterator extends BoundedIterator {
    constructor(keys, values, length, keyFor) {
        super(length, keyFor);
        this.keys = keys;
        this.values = values;
    }
    static fromIndexable(obj, keyFor) {
        let keys = Object.keys(obj);
        let values = [];
        let { length } = keys;
        for (let i = 0; i < length; i++) {
            values.push(get(obj, keys[i]));
        }
        if (length === 0) {
            return EMPTY_ITERATOR;
        }
        else {
            return new this(keys, values, length, keyFor);
        }
    }
    static fromForEachable(obj, keyFor) {
        let keys = [];
        let values = [];
        let length = 0;
        let isMapLike = false;
        obj.forEach((value, key) => {
            isMapLike = isMapLike || arguments.length >= 2;
            if (isMapLike) {
                keys.push(key);
            }
            values.push(value);
            length++;
        });
        if (length === 0) {
            return EMPTY_ITERATOR;
        }
        else if (isMapLike) {
            return new this(keys, values, length, keyFor);
        }
        else {
            return new ArrayIterator(values, length, keyFor);
        }
    }
    valueFor(position) {
        return this.values[position];
    }
    memoFor(position) {
        return this.keys[position];
    }
}
class NativeIterator {
    constructor(iterable, result, keyFor) {
        this.iterable = iterable;
        this.result = result;
        this.keyFor = keyFor;
        this.position = 0;
    }
    static from(iterable, keyFor) {
        let iterator = iterable[Symbol.iterator]();
        let result = iterator.next();
        let { value, done } = result;
        if (done) {
            return EMPTY_ITERATOR;
        }
        else if (Array.isArray(value) && value.length === 2) {
            return new this(iterator, result, keyFor);
        }
        else {
            return new ArrayLikeNativeIterator(iterator, result, keyFor);
        }
    }
    isEmpty() {
        return false;
    }
    next() {
        let { iterable, result, position, keyFor } = this;
        if (result.done) {
            return null;
        }
        let value = this.valueFor(result, position);
        let memo = this.memoFor(result, position);
        let key = keyFor(value, memo, position);
        this.position++;
        this.result = iterable.next();
        return { key, value, memo };
    }
}
class ArrayLikeNativeIterator extends NativeIterator {
    valueFor(result) {
        return result.value;
    }
    memoFor(_result, position) {
        return position;
    }
}
class MapLikeNativeIterator extends NativeIterator {
    valueFor(result) {
        return result.value[1];
    }
    memoFor(result) {
        return result.value[0];
    }
}
const EMPTY_ITERATOR = {
    isEmpty() {
        return true;
    },
    next() {
        assert('Cannot call next() on an empty iterator');
        return null;
    },
};
class EachInIterable {
    constructor(ref, keyPath) {
        this.ref = ref;
        this.keyPath = keyPath;
        this.valueTag = UpdatableTag.create(CONSTANT_TAG);
        this.tag = combine([ref.tag, this.valueTag]);
    }
    iterate() {
        let { ref, valueTag } = this;
        let iterable = ref.value();
        let tag = tagFor(iterable);
        if (isProxy(iterable)) {
            // this is because the each-in doesn't actually get(proxy, 'key') but bypasses it
            // and the proxy's tag is lazy updated on access
            iterable = _contentFor(iterable);
        }
        valueTag.inner.update(tag);
        if (!isIndexable(iterable)) {
            return EMPTY_ITERATOR;
        }
        if (Array.isArray(iterable) || isEmberArray(iterable)) {
            return ObjectIterator.fromIndexable(iterable, this.keyFor(true));
        }
        else if (HAS_NATIVE_SYMBOL && isNativeIterable(iterable)) {
            return MapLikeNativeIterator.from(iterable, this.keyFor());
        }
        else if (hasForEach(iterable)) {
            return ObjectIterator.fromForEachable(iterable, this.keyFor());
        }
        else {
            return ObjectIterator.fromIndexable(iterable, this.keyFor(true));
        }
    }
    valueReferenceFor(item) {
        return new UpdatableReference(item.value);
    }
    updateValueReference(ref, item) {
        ref.update(item.value);
    }
    memoReferenceFor(item) {
        return new UpdatableReference(item.memo);
    }
    updateMemoReference(ref, item) {
        ref.update(item.memo);
    }
    keyFor(hasUniqueKeys = false) {
        let { keyPath } = this;
        switch (keyPath) {
            case '@key':
                return hasUniqueKeys ? ObjectKey : Unique(MapKey);
            case '@index':
                return Index;
            case '@identity':
                return Unique(Identity);
            default:
                assert(`Invalid key: ${keyPath}`, keyPath[0] !== '@');
                return Unique(KeyPath(keyPath));
        }
    }
}
class EachIterable {
    constructor(ref, keyPath) {
        this.ref = ref;
        this.keyPath = keyPath;
        this.valueTag = UpdatableTag.create(CONSTANT_TAG);
        this.tag = combine([ref.tag, this.valueTag]);
    }
    iterate() {
        let { ref, valueTag } = this;
        let iterable = ref.value();
        valueTag.inner.update(tagForProperty(iterable, '[]'));
        if (iterable === null || typeof iterable !== 'object') {
            return EMPTY_ITERATOR;
        }
        let keyFor = this.keyFor();
        if (Array.isArray(iterable)) {
            return ArrayIterator.from(iterable, keyFor);
        }
        else if (isEmberArray(iterable)) {
            return EmberArrayIterator.from(iterable, keyFor);
        }
        else if (HAS_NATIVE_SYMBOL && isNativeIterable(iterable)) {
            return ArrayLikeNativeIterator.from(iterable, keyFor);
        }
        else if (hasForEach(iterable)) {
            return ArrayIterator.fromForEachable(iterable, keyFor);
        }
        else {
            return EMPTY_ITERATOR;
        }
    }
    valueReferenceFor(item) {
        return new UpdatableReference(item.value);
    }
    updateValueReference(ref, item) {
        ref.update(item.value);
    }
    memoReferenceFor(item) {
        return new UpdatableReference(item.memo);
    }
    updateMemoReference(ref, item) {
        ref.update(item.memo);
    }
    keyFor() {
        let { keyPath } = this;
        switch (keyPath) {
            case '@index':
                return Index;
            case '@identity':
                return Unique(Identity);
            default:
                assert(`Invalid key: ${keyPath}`, keyPath[0] !== '@');
                return Unique(KeyPath(keyPath));
        }
    }
}
function hasForEach(value) {
    return typeof value['forEach'] === 'function';
}
function isNativeIterable(value) {
    return typeof value[Symbol.iterator] === 'function';
}
function isIndexable(value) {
    return value !== null && (typeof value === 'object' || typeof value === 'function');
}
// Position in an array is guarenteed to be unique
function Index(_value, _memo, position) {
    return String(position);
}
// Object.keys(...) is guarenteed to be strings and unique
function ObjectKey(_value, memo) {
    return memo;
}
// Map keys can be any objects
function MapKey(_value, memo) {
    return Identity(memo);
}
function Identity(value) {
    switch (typeof value) {
        case 'string':
            return value;
        case 'number':
            return String(value);
        default:
            return guidFor(value);
    }
}
function KeyPath(keyPath) {
    return (value) => String(get(value, keyPath));
}
function Unique(func) {
    let seen = {};
    return (value, memo, position) => {
        let key = func(value, memo, position);
        let count = seen[key];
        if (count === undefined) {
            seen[key] = 0;
            return key;
        }
        else {
            seen[key] = ++count;
            return `${key}${ITERATOR_KEY_GUID}${count}`;
        }
    };
}
