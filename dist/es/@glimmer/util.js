function unwrap(val) {
    if (val === null || val === undefined) throw new Error(`Expected value to be present`);
    return val;
}
function expect(val, message) {
    if (val === null || val === undefined) throw new Error(message);
    return val;
}
function unreachable(message = 'unreachable') {
    return new Error(message);
}

// import Logger from './logger';
// let alreadyWarned = false;
function debugAssert(test, msg) {
    // if (!alreadyWarned) {
    //   alreadyWarned = true;
    //   Logger.warn("Don't leave debug assertions on in public builds");
    // }
    if (!test) {
        throw new Error(msg || 'assertion failure');
    }
}

const { keys: objKeys } = Object;
function assign(obj) {
    for (let i = 1; i < arguments.length; i++) {
        let assignment = arguments[i];
        if (assignment === null || typeof assignment !== 'object') continue;
        let keys = objKeys(assignment);
        for (let j = 0; j < keys.length; j++) {
            let key = keys[j];
            obj[key] = assignment[key];
        }
    }
    return obj;
}
function fillNulls(count) {
    let arr = new Array(count);
    for (let i = 0; i < count; i++) {
        arr[i] = null;
    }
    return arr;
}

let GUID = 0;
function initializeGuid(object) {
    return object._guid = ++GUID;
}
function ensureGuid(object) {
    return object._guid || initializeGuid(object);
}

function dict() {
    return Object.create(null);
}
class DictSet {
    constructor() {
        this.dict = dict();
    }
    add(obj) {
        if (typeof obj === 'string') this.dict[obj] = obj;else this.dict[ensureGuid(obj)] = obj;
        return this;
    }
    delete(obj) {
        if (typeof obj === 'string') delete this.dict[obj];else if (obj._guid) delete this.dict[obj._guid];
    }
}
class Stack {
    constructor() {
        this.stack = [];
        this.current = null;
    }
    get size() {
        return this.stack.length;
    }
    push(item) {
        this.current = item;
        this.stack.push(item);
    }
    pop() {
        let item = this.stack.pop();
        let len = this.stack.length;
        this.current = len === 0 ? null : this.stack[len - 1];
        return item === undefined ? null : item;
    }
    isEmpty() {
        return this.stack.length === 0;
    }
}

class ListNode {
    constructor(value) {
        this.next = null;
        this.prev = null;
        this.value = value;
    }
}
class LinkedList {
    constructor() {
        this.clear();
    }
    head() {
        return this._head;
    }
    tail() {
        return this._tail;
    }
    clear() {
        this._head = this._tail = null;
    }
    toArray() {
        let out = [];
        this.forEachNode(n => out.push(n));
        return out;
    }
    nextNode(node) {
        return node.next;
    }
    forEachNode(callback) {
        let node = this._head;
        while (node !== null) {
            callback(node);
            node = node.next;
        }
    }
    insertBefore(node, reference = null) {
        if (reference === null) return this.append(node);
        if (reference.prev) reference.prev.next = node;else this._head = node;
        node.prev = reference.prev;
        node.next = reference;
        reference.prev = node;
        return node;
    }
    append(node) {
        let tail = this._tail;
        if (tail) {
            tail.next = node;
            node.prev = tail;
            node.next = null;
        } else {
            this._head = node;
        }
        return this._tail = node;
    }
    remove(node) {
        if (node.prev) node.prev.next = node.next;else this._head = node.next;
        if (node.next) node.next.prev = node.prev;else this._tail = node.prev;
        return node;
    }
}
class ListSlice {
    constructor(head, tail) {
        this._head = head;
        this._tail = tail;
    }
    forEachNode(callback) {
        let node = this._head;
        while (node !== null) {
            callback(node);
            node = this.nextNode(node);
        }
    }
    head() {
        return this._head;
    }
    tail() {
        return this._tail;
    }
    toArray() {
        let out = [];
        this.forEachNode(n => out.push(n));
        return out;
    }
    nextNode(node) {
        if (node === this._tail) return null;
        return node.next;
    }
}
const EMPTY_SLICE = new ListSlice(null, null);

const EMPTY_ARRAY = Object.freeze([]);

export { debugAssert as assert, assign, fillNulls, ensureGuid, initializeGuid, Stack, DictSet, dict, EMPTY_SLICE, LinkedList, ListNode, ListSlice, EMPTY_ARRAY, unwrap, expect, unreachable };
