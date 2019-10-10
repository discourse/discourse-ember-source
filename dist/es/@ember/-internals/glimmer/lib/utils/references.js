import { consume, didRender, get, set, tagFor, tagForProperty, track, watchKey, } from '@ember/-internals/metal';
import { isProxy, symbol } from '@ember/-internals/utils';
import { EMBER_METAL_TRACKED_PROPERTIES } from '@ember/canary-features';
import { debugFreeze } from '@ember/debug';
import { DEBUG } from '@glimmer/env';
import { combine, CONSTANT_TAG, ConstReference, DirtyableTag, isConst, TagWrapper, UpdatableTag, } from '@glimmer/reference';
import { ConditionalReference as GlimmerConditionalReference, PrimitiveReference, UNDEFINED_REFERENCE, } from '@glimmer/runtime';
import { unreachable } from '@glimmer/util';
import { RECOMPUTE_TAG } from '../helper';
import emberToBool from './to-bool';
export const UPDATE = symbol('UPDATE');
export const INVOKE = symbol('INVOKE');
export const ACTION = symbol('ACTION');
class EmberPathReference {
    get(key) {
        return PropertyReference.create(this, key);
    }
}
export class CachedReference extends EmberPathReference {
    constructor() {
        super();
        this.lastRevision = null;
        this.lastValue = null;
    }
    value() {
        let { tag, lastRevision, lastValue } = this;
        if (lastRevision === null || !tag.validate(lastRevision)) {
            lastValue = this.lastValue = this.compute();
            this.lastRevision = tag.value();
        }
        return lastValue;
    }
}
export class RootReference extends ConstReference {
    constructor(value) {
        super(value);
        this.children = Object.create(null);
    }
    static create(value) {
        return valueToRef(value);
    }
    get(propertyKey) {
        let ref = this.children[propertyKey];
        if (ref === undefined) {
            ref = this.children[propertyKey] = new RootPropertyReference(this.inner, propertyKey);
        }
        return ref;
    }
}
let TwoWayFlushDetectionTag;
if (DEBUG) {
    TwoWayFlushDetectionTag = class TwoWayFlushDetectionTag {
        constructor(tag, key, ref) {
            this.tag = tag;
            this.key = key;
            this.ref = ref;
            this.parent = null;
        }
        static create(tag, key, ref) {
            return new TagWrapper(tag.type, new TwoWayFlushDetectionTag(tag, key, ref));
        }
        value() {
            return this.tag.value();
        }
        validate(ticket) {
            let { parent, key, ref } = this;
            let isValid = this.tag.validate(ticket);
            if (isValid && parent) {
                didRender(parent, key, ref);
            }
            return isValid;
        }
        didCompute(parent) {
            this.parent = parent;
            didRender(parent, this.key, this.ref);
        }
    };
}
export class PropertyReference extends CachedReference {
    static create(parentReference, propertyKey) {
        if (isConst(parentReference)) {
            return valueKeyToRef(parentReference.value(), propertyKey);
        }
        else {
            return new NestedPropertyReference(parentReference, propertyKey);
        }
    }
    get(key) {
        return new NestedPropertyReference(this, key);
    }
}
export class RootPropertyReference extends PropertyReference {
    constructor(parentValue, propertyKey) {
        super();
        this.parentValue = parentValue;
        this.propertyKey = propertyKey;
        if (EMBER_METAL_TRACKED_PROPERTIES) {
            this.propertyTag = UpdatableTag.create(CONSTANT_TAG);
        }
        else {
            this.propertyTag = UpdatableTag.create(tagForProperty(parentValue, propertyKey));
        }
        if (DEBUG) {
            this.tag = TwoWayFlushDetectionTag.create(this.propertyTag, propertyKey, this);
        }
        else {
            this.tag = this.propertyTag;
        }
        if (DEBUG && !EMBER_METAL_TRACKED_PROPERTIES) {
            watchKey(parentValue, propertyKey);
        }
    }
    compute() {
        let { parentValue, propertyKey } = this;
        if (DEBUG) {
            this.tag.inner.didCompute(parentValue);
        }
        let ret;
        if (EMBER_METAL_TRACKED_PROPERTIES) {
            let tag = track(() => {
                ret = get(parentValue, propertyKey);
            });
            consume(tag);
            this.propertyTag.inner.update(tag);
        }
        else {
            ret = get(parentValue, propertyKey);
        }
        return ret;
    }
    [UPDATE](value) {
        set(this.parentValue, this.propertyKey, value);
    }
}
export class NestedPropertyReference extends PropertyReference {
    constructor(parentReference, propertyKey) {
        super();
        this.parentReference = parentReference;
        this.propertyKey = propertyKey;
        let parentReferenceTag = parentReference.tag;
        let propertyTag = (this.propertyTag = UpdatableTag.create(CONSTANT_TAG));
        if (DEBUG) {
            let tag = combine([parentReferenceTag, propertyTag]);
            this.tag = TwoWayFlushDetectionTag.create(tag, propertyKey, this);
        }
        else {
            this.tag = combine([parentReferenceTag, propertyTag]);
        }
    }
    compute() {
        let { parentReference, propertyTag, propertyKey } = this;
        let _parentValue = parentReference.value();
        let parentValueType = typeof _parentValue;
        if (parentValueType === 'string' && propertyKey === 'length') {
            return _parentValue.length;
        }
        if ((parentValueType === 'object' && _parentValue !== null) || parentValueType === 'function') {
            let parentValue = _parentValue;
            if (DEBUG && !EMBER_METAL_TRACKED_PROPERTIES) {
                watchKey(parentValue, propertyKey);
            }
            if (DEBUG) {
                this.tag.inner.didCompute(parentValue);
            }
            let ret;
            if (EMBER_METAL_TRACKED_PROPERTIES) {
                let tag = track(() => {
                    ret = get(parentValue, propertyKey);
                });
                consume(tag);
                propertyTag.inner.update(tag);
            }
            else {
                ret = get(parentValue, propertyKey);
                propertyTag.inner.update(tagForProperty(parentValue, propertyKey));
            }
            return ret;
        }
        else {
            return undefined;
        }
    }
    [UPDATE](value) {
        set(this.parentReference.value() /* let the other side handle the error */, this.propertyKey, value);
    }
}
export class UpdatableReference extends EmberPathReference {
    constructor(value) {
        super();
        this.tag = DirtyableTag.create();
        this._value = value;
    }
    value() {
        return this._value;
    }
    update(value) {
        let { _value } = this;
        if (value !== _value) {
            this.tag.inner.dirty();
            this._value = value;
        }
    }
}
export class ConditionalReference extends GlimmerConditionalReference {
    static create(reference) {
        if (isConst(reference)) {
            let value = reference.value();
            if (!isProxy(value)) {
                return PrimitiveReference.create(emberToBool(value));
            }
        }
        return new ConditionalReference(reference);
    }
    constructor(reference) {
        super(reference);
        this.objectTag = UpdatableTag.create(CONSTANT_TAG);
        this.tag = combine([reference.tag, this.objectTag]);
    }
    toBool(predicate) {
        if (isProxy(predicate)) {
            this.objectTag.inner.update(tagForProperty(predicate, 'isTruthy'));
            return Boolean(get(predicate, 'isTruthy'));
        }
        else {
            this.objectTag.inner.update(tagFor(predicate));
            return emberToBool(predicate);
        }
    }
}
export class SimpleHelperReference extends CachedReference {
    constructor(helper, args) {
        super();
        this.helper = helper;
        this.args = args;
        this.tag = args.tag;
    }
    static create(helper, args) {
        if (isConst(args)) {
            let { positional, named } = args;
            let positionalValue = positional.value();
            let namedValue = named.value();
            if (DEBUG) {
                debugFreeze(positionalValue);
                debugFreeze(namedValue);
            }
            let result = helper(positionalValue, namedValue);
            return valueToRef(result);
        }
        else {
            return new SimpleHelperReference(helper, args);
        }
    }
    compute() {
        let { helper, args: { positional, named }, } = this;
        let positionalValue = positional.value();
        let namedValue = named.value();
        if (DEBUG) {
            debugFreeze(positionalValue);
            debugFreeze(namedValue);
        }
        return helper(positionalValue, namedValue);
    }
}
export class ClassBasedHelperReference extends CachedReference {
    constructor(instance, args) {
        super();
        this.instance = instance;
        this.args = args;
        this.tag = combine([instance[RECOMPUTE_TAG], args.tag]);
    }
    static create(instance, args) {
        return new ClassBasedHelperReference(instance, args);
    }
    compute() {
        let { instance, args: { positional, named }, } = this;
        let positionalValue = positional.value();
        let namedValue = named.value();
        if (DEBUG) {
            debugFreeze(positionalValue);
            debugFreeze(namedValue);
        }
        return instance.compute(positionalValue, namedValue);
    }
}
export class InternalHelperReference extends CachedReference {
    constructor(helper, args) {
        super();
        this.helper = helper;
        this.args = args;
        this.tag = args.tag;
    }
    compute() {
        let { helper, args } = this;
        return helper(args);
    }
}
export class UnboundReference extends ConstReference {
    static create(value) {
        return valueToRef(value, false);
    }
    get(key) {
        return valueToRef(this.inner[key], false);
    }
}
export class ReadonlyReference extends CachedReference {
    constructor(inner) {
        super();
        this.inner = inner;
        this.tag = inner.tag;
    }
    get [INVOKE]() {
        return this.inner[INVOKE];
    }
    compute() {
        return this.inner.value();
    }
    get(key) {
        return this.inner.get(key);
    }
}
export function referenceFromParts(root, parts) {
    let reference = root;
    for (let i = 0; i < parts.length; i++) {
        reference = reference.get(parts[i]);
    }
    return reference;
}
function isObject(value) {
    return value !== null && typeof value === 'object';
}
function isFunction(value) {
    return typeof value === 'function';
}
function isPrimitive(value) {
    if (DEBUG) {
        let type = typeof value;
        return (value === undefined ||
            value === null ||
            type === 'boolean' ||
            type === 'number' ||
            type === 'string');
    }
    else {
        return true;
    }
}
function valueToRef(value, bound = true) {
    if (isObject(value)) {
        // root of interop with ember objects
        return bound ? new RootReference(value) : new UnboundReference(value);
    }
    else if (isFunction(value)) {
        // ember doesn't do observing with functions
        return new UnboundReference(value);
    }
    else if (isPrimitive(value)) {
        return PrimitiveReference.create(value);
    }
    else if (DEBUG) {
        let type = typeof value;
        let output;
        try {
            output = String(value);
        }
        catch (e) {
            output = null;
        }
        if (output) {
            throw unreachable(`[BUG] Unexpected ${type} (${output})`);
        }
        else {
            throw unreachable(`[BUG] Unexpected ${type}`);
        }
    }
    else {
        throw unreachable();
    }
}
function valueKeyToRef(value, key) {
    if (isObject(value)) {
        // root of interop with ember objects
        return new RootPropertyReference(value, key);
    }
    else if (isFunction(value)) {
        // ember doesn't do observing with functions
        return new UnboundReference(value[key]);
    }
    else if (isPrimitive(value)) {
        return UNDEFINED_REFERENCE;
    }
    else if (DEBUG) {
        let type = typeof value;
        let output;
        try {
            output = String(value);
        }
        catch (e) {
            output = null;
        }
        if (output) {
            throw unreachable(`[BUG] Unexpected ${type} (${output})`);
        }
        else {
            throw unreachable(`[BUG] Unexpected ${type}`);
        }
    }
    else {
        throw unreachable();
    }
}
