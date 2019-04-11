import { didRender, get, set, tagFor, tagForProperty, watchKey } from '@ember/-internals/metal';
import { isProxy, symbol } from '@ember/-internals/utils';
import { DEBUG } from '@glimmer/env';
import { combine, CONSTANT_TAG, ConstReference, DirtyableTag, isConst, TagWrapper, UpdatableTag, } from '@glimmer/reference';
import { ConditionalReference as GlimmerConditionalReference, PrimitiveReference, } from '@glimmer/runtime';
import { RECOMPUTE_TAG } from '../helper';
import emberToBool from './to-bool';
export const UPDATE = symbol('UPDATE');
export const INVOKE = symbol('INVOKE');
export const ACTION = symbol('ACTION');
let maybeFreeze;
if (DEBUG) {
    // gaurding this in a DEBUG gaurd (as well as all invocations)
    // so that it is properly stripped during the minification's
    // dead code elimination
    maybeFreeze = (obj) => {
        // re-freezing an already frozen object introduces a significant
        // performance penalty on Chrome (tested through 59).
        //
        // See: https://bugs.chromium.org/p/v8/issues/detail?id=6450
        if (!Object.isFrozen(obj)) {
            Object.freeze(obj);
        }
    };
}
class EmberPathReference {
    get(key) {
        return PropertyReference.create(this, key);
    }
}
export class CachedReference extends EmberPathReference {
    constructor() {
        super();
        this._lastRevision = null;
        this._lastValue = null;
    }
    value() {
        let { tag, _lastRevision, _lastValue } = this;
        if (_lastRevision === null || !tag.validate(_lastRevision)) {
            _lastValue = this._lastValue = this.compute();
            this._lastRevision = tag.value();
        }
        return _lastValue;
    }
}
export class RootReference extends ConstReference {
    constructor(value) {
        super(value);
        this.children = Object.create(null);
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
    TwoWayFlushDetectionTag = class {
        static create(tag, key, ref) {
            return new TagWrapper(tag.type, new TwoWayFlushDetectionTag(tag, key, ref));
        }
        constructor(tag, key, ref) {
            this.tag = tag;
            this.parent = null;
            this.key = key;
            this.ref = ref;
        }
        value() {
            return this.tag.value();
        }
        validate(ticket) {
            let { parent, key } = this;
            let isValid = this.tag.validate(ticket);
            if (isValid && parent) {
                didRender(parent, key, this.ref);
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
            return new RootPropertyReference(parentReference.value(), propertyKey);
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
        this._parentValue = parentValue;
        this._propertyKey = propertyKey;
        if (DEBUG) {
            this.tag = TwoWayFlushDetectionTag.create(tagForProperty(parentValue, propertyKey), propertyKey, this);
        }
        else {
            this.tag = tagForProperty(parentValue, propertyKey);
        }
        if (DEBUG) {
            watchKey(parentValue, propertyKey);
        }
    }
    compute() {
        let { _parentValue, _propertyKey } = this;
        if (DEBUG) {
            this.tag.inner.didCompute(_parentValue);
        }
        return get(_parentValue, _propertyKey);
    }
    [UPDATE](value) {
        set(this._parentValue, this._propertyKey, value);
    }
}
export class NestedPropertyReference extends PropertyReference {
    constructor(parentReference, propertyKey) {
        super();
        let parentReferenceTag = parentReference.tag;
        let parentObjectTag = UpdatableTag.create(CONSTANT_TAG);
        this._parentReference = parentReference;
        this._parentObjectTag = parentObjectTag;
        this._propertyKey = propertyKey;
        if (DEBUG) {
            let tag = combine([parentReferenceTag, parentObjectTag]);
            this.tag = TwoWayFlushDetectionTag.create(tag, propertyKey, this);
        }
        else {
            this.tag = combine([parentReferenceTag, parentObjectTag]);
        }
    }
    compute() {
        let { _parentReference, _parentObjectTag, _propertyKey } = this;
        let parentValue = _parentReference.value();
        _parentObjectTag.inner.update(tagForProperty(parentValue, _propertyKey));
        let parentValueType = typeof parentValue;
        if (parentValueType === 'string' && _propertyKey === 'length') {
            return parentValue.length;
        }
        if ((parentValueType === 'object' && parentValue !== null) || parentValueType === 'function') {
            if (DEBUG) {
                watchKey(parentValue, _propertyKey);
            }
            if (DEBUG) {
                this.tag.inner.didCompute(parentValue);
            }
            return get(parentValue, _propertyKey);
        }
        else {
            return undefined;
        }
    }
    [UPDATE](value) {
        let parent = this._parentReference.value();
        set(parent, this._propertyKey, value);
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
            if (isProxy(value)) {
                return new RootPropertyReference(value, 'isTruthy');
            }
            else {
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
            return get(predicate, 'isTruthy');
        }
        else {
            this.objectTag.inner.update(tagFor(predicate));
            return emberToBool(predicate);
        }
    }
}
export class SimpleHelperReference extends CachedReference {
    static create(helper, args) {
        if (isConst(args)) {
            let { positional, named } = args;
            let positionalValue = positional.value();
            let namedValue = named.value();
            if (DEBUG) {
                maybeFreeze(positionalValue);
                maybeFreeze(namedValue);
            }
            let result = helper(positionalValue, namedValue);
            return valueToRef(result);
        }
        else {
            return new SimpleHelperReference(helper, args);
        }
    }
    constructor(helper, args) {
        super();
        this.tag = args.tag;
        this.helper = helper;
        this.args = args;
    }
    compute() {
        let { helper, args: { positional, named }, } = this;
        let positionalValue = positional.value();
        let namedValue = named.value();
        if (DEBUG) {
            maybeFreeze(positionalValue);
            maybeFreeze(namedValue);
        }
        return helper(positionalValue, namedValue);
    }
}
export class ClassBasedHelperReference extends CachedReference {
    static create(instance, args) {
        return new ClassBasedHelperReference(instance, args);
    }
    constructor(instance, args) {
        super();
        this.tag = combine([instance[RECOMPUTE_TAG], args.tag]);
        this.instance = instance;
        this.args = args;
    }
    compute() {
        let { instance, args: { positional, named }, } = this;
        let positionalValue = positional.value();
        let namedValue = named.value();
        if (DEBUG) {
            maybeFreeze(positionalValue);
            maybeFreeze(namedValue);
        }
        return instance.compute(positionalValue, namedValue);
    }
}
export class InternalHelperReference extends CachedReference {
    constructor(helper, args) {
        super();
        this.tag = args.tag;
        this.helper = helper;
        this.args = args;
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
        return valueToRef(get(this.inner, key), false);
    }
}
export class ReadonlyReference extends CachedReference {
    constructor(inner) {
        super();
        this.inner = inner;
    }
    get tag() {
        return this.inner.tag;
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
export function valueToRef(value, bound = true) {
    if (value !== null && typeof value === 'object') {
        // root of interop with ember objects
        return bound ? new RootReference(value) : new UnboundReference(value);
    }
    // ember doesn't do observing with functions
    if (typeof value === 'function') {
        return new UnboundReference(value);
    }
    return PrimitiveReference.create(value);
}
