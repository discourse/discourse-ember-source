import { LinkedList, ListNode, dict } from '@glimmer/util';

const CONSTANT = 0;
const INITIAL = 1;
const VOLATILE = NaN;
class RevisionTag {
    validate(snapshot) {
        return this.value() === snapshot;
    }
}
RevisionTag.id = 0;
const VALUE = [];
const VALIDATE = [];
class TagWrapper {
    constructor(type, inner) {
        this.type = type;
        this.inner = inner;
    }
    value() {
        let func = VALUE[this.type];
        return func(this.inner);
    }
    validate(snapshot) {
        let func = VALIDATE[this.type];
        return func(this.inner, snapshot);
    }
}
function register(Type) {
    let type = VALUE.length;
    VALUE.push(tag => tag.value());
    VALIDATE.push((tag, snapshot) => tag.validate(snapshot));
    Type.id = type;
}
///
// CONSTANT: 0
VALUE.push(() => CONSTANT);
VALIDATE.push((_tag, snapshot) => snapshot === CONSTANT);
const CONSTANT_TAG = new TagWrapper(0, null);
// VOLATILE: 1
VALUE.push(() => VOLATILE);
VALIDATE.push((_tag, snapshot) => snapshot === VOLATILE);
const VOLATILE_TAG = new TagWrapper(1, null);
// CURRENT: 2
VALUE.push(() => $REVISION);
VALIDATE.push((_tag, snapshot) => snapshot === $REVISION);
const CURRENT_TAG = new TagWrapper(2, null);
function isConst({ tag }) {
    return tag === CONSTANT_TAG;
}
function isConstTag(tag) {
    return tag === CONSTANT_TAG;
}
///
let $REVISION = INITIAL;
function bump() {
    $REVISION++;
}
class DirtyableTag extends RevisionTag {
    static create(revision = $REVISION) {
        return new TagWrapper(this.id, new DirtyableTag(revision));
    }
    constructor(revision = $REVISION) {
        super();
        this.revision = revision;
    }
    value() {
        return this.revision;
    }
    dirty() {
        this.revision = ++$REVISION;
    }
}
register(DirtyableTag);
function combineTagged(tagged) {
    let optimized = [];
    for (let i = 0, l = tagged.length; i < l; i++) {
        let tag = tagged[i].tag;
        if (tag === VOLATILE_TAG) return VOLATILE_TAG;
        if (tag === CONSTANT_TAG) continue;
        optimized.push(tag);
    }
    return _combine(optimized);
}
function combineSlice(slice) {
    let optimized = [];
    let node = slice.head();
    while (node !== null) {
        let tag = node.tag;
        if (tag === VOLATILE_TAG) return VOLATILE_TAG;
        if (tag !== CONSTANT_TAG) optimized.push(tag);
        node = slice.nextNode(node);
    }
    return _combine(optimized);
}
function combine(tags) {
    let optimized = [];
    for (let i = 0, l = tags.length; i < l; i++) {
        let tag = tags[i];
        if (tag === VOLATILE_TAG) return VOLATILE_TAG;
        if (tag === CONSTANT_TAG) continue;
        optimized.push(tag);
    }
    return _combine(optimized);
}
function _combine(tags) {
    switch (tags.length) {
        case 0:
            return CONSTANT_TAG;
        case 1:
            return tags[0];
        case 2:
            return TagsPair.create(tags[0], tags[1]);
        default:
            return TagsCombinator.create(tags);
    }
}
class CachedTag extends RevisionTag {
    constructor() {
        super(...arguments);
        this.lastChecked = null;
        this.lastValue = null;
    }
    value() {
        let { lastChecked, lastValue } = this;
        if (lastChecked !== $REVISION) {
            this.lastChecked = $REVISION;
            this.lastValue = lastValue = this.compute();
        }
        return this.lastValue;
    }
    invalidate() {
        this.lastChecked = null;
    }
}
class TagsPair extends CachedTag {
    static create(first, second) {
        return new TagWrapper(this.id, new TagsPair(first, second));
    }
    constructor(first, second) {
        super();
        this.first = first;
        this.second = second;
    }
    compute() {
        return Math.max(this.first.value(), this.second.value());
    }
}
register(TagsPair);
class TagsCombinator extends CachedTag {
    static create(tags) {
        return new TagWrapper(this.id, new TagsCombinator(tags));
    }
    constructor(tags) {
        super();
        this.tags = tags;
    }
    compute() {
        let { tags } = this;
        let max = -1;
        for (let i = 0; i < tags.length; i++) {
            let value = tags[i].value();
            max = Math.max(value, max);
        }
        return max;
    }
}
register(TagsCombinator);
class UpdatableTag extends CachedTag {
    static create(tag) {
        return new TagWrapper(this.id, new UpdatableTag(tag));
    }
    constructor(tag) {
        super();
        this.tag = tag;
        this.lastUpdated = INITIAL;
    }
    compute() {
        return Math.max(this.lastUpdated, this.tag.value());
    }
    update(tag) {
        if (tag !== this.tag) {
            this.tag = tag;
            this.lastUpdated = $REVISION;
            this.invalidate();
        }
    }
}
register(UpdatableTag);
class CachedReference {
    constructor() {
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
    invalidate() {
        this.lastRevision = null;
    }
}
class MapperReference extends CachedReference {
    constructor(reference, mapper) {
        super();
        this.tag = reference.tag;
        this.reference = reference;
        this.mapper = mapper;
    }
    compute() {
        let { reference, mapper } = this;
        return mapper(reference.value());
    }
}
function map(reference, mapper) {
    return new MapperReference(reference, mapper);
}
//////////
class ReferenceCache {
    constructor(reference) {
        this.lastValue = null;
        this.lastRevision = null;
        this.initialized = false;
        this.tag = reference.tag;
        this.reference = reference;
    }
    peek() {
        if (!this.initialized) {
            return this.initialize();
        }
        return this.lastValue;
    }
    revalidate() {
        if (!this.initialized) {
            return this.initialize();
        }
        let { reference, lastRevision } = this;
        let tag = reference.tag;
        if (tag.validate(lastRevision)) return NOT_MODIFIED;
        this.lastRevision = tag.value();
        let { lastValue } = this;
        let value = reference.value();
        if (value === lastValue) return NOT_MODIFIED;
        this.lastValue = value;
        return value;
    }
    initialize() {
        let { reference } = this;
        let value = this.lastValue = reference.value();
        this.lastRevision = reference.tag.value();
        this.initialized = true;
        return value;
    }
}
const NOT_MODIFIED = 'adb3b78e-3d22-4e4b-877a-6317c2c5c145';
function isModified(value) {
    return value !== NOT_MODIFIED;
}

class ConstReference {
    constructor(inner) {
        this.inner = inner;
        this.tag = CONSTANT_TAG;
    }
    value() {
        return this.inner;
    }
}

class ListItem extends ListNode {
    constructor(iterable, result) {
        super(iterable.valueReferenceFor(result));
        this.retained = false;
        this.seen = false;
        this.key = result.key;
        this.iterable = iterable;
        this.memo = iterable.memoReferenceFor(result);
    }
    update(item) {
        this.retained = true;
        this.iterable.updateValueReference(this.value, item);
        this.iterable.updateMemoReference(this.memo, item);
    }
    shouldRemove() {
        return !this.retained;
    }
    reset() {
        this.retained = false;
        this.seen = false;
    }
}
class IterationArtifacts {
    constructor(iterable) {
        this.iterator = null;
        this.map = dict();
        this.list = new LinkedList();
        this.tag = iterable.tag;
        this.iterable = iterable;
    }
    isEmpty() {
        let iterator = this.iterator = this.iterable.iterate();
        return iterator.isEmpty();
    }
    iterate() {
        let iterator;
        if (this.iterator === null) {
            iterator = this.iterable.iterate();
        } else {
            iterator = this.iterator;
        }
        this.iterator = null;
        return iterator;
    }
    has(key) {
        return !!this.map[key];
    }
    get(key) {
        return this.map[key];
    }
    wasSeen(key) {
        let node = this.map[key];
        return node !== undefined && node.seen;
    }
    append(item) {
        let { map, list, iterable } = this;
        let node = map[item.key] = new ListItem(iterable, item);
        list.append(node);
        return node;
    }
    insertBefore(item, reference) {
        let { map, list, iterable } = this;
        let node = map[item.key] = new ListItem(iterable, item);
        node.retained = true;
        list.insertBefore(node, reference);
        return node;
    }
    move(item, reference) {
        let { list } = this;
        item.retained = true;
        list.remove(item);
        list.insertBefore(item, reference);
    }
    remove(item) {
        let { list } = this;
        list.remove(item);
        delete this.map[item.key];
    }
    nextNode(item) {
        return this.list.nextNode(item);
    }
    head() {
        return this.list.head();
    }
}
class ReferenceIterator {
    // if anyone needs to construct this object with something other than
    // an iterable, let @wycats know.
    constructor(iterable) {
        this.iterator = null;
        let artifacts = new IterationArtifacts(iterable);
        this.artifacts = artifacts;
    }
    next() {
        let { artifacts } = this;
        let iterator = this.iterator = this.iterator || artifacts.iterate();
        let item = iterator.next();
        if (item === null) return null;
        return artifacts.append(item);
    }
}
var Phase;
(function (Phase) {
    Phase[Phase["Append"] = 0] = "Append";
    Phase[Phase["Prune"] = 1] = "Prune";
    Phase[Phase["Done"] = 2] = "Done";
})(Phase || (Phase = {}));
class IteratorSynchronizer {
    constructor({ target, artifacts }) {
        this.target = target;
        this.artifacts = artifacts;
        this.iterator = artifacts.iterate();
        this.current = artifacts.head();
    }
    sync() {
        let phase = Phase.Append;
        while (true) {
            switch (phase) {
                case Phase.Append:
                    phase = this.nextAppend();
                    break;
                case Phase.Prune:
                    phase = this.nextPrune();
                    break;
                case Phase.Done:
                    this.nextDone();
                    return;
            }
        }
    }
    advanceToKey(key) {
        let { current, artifacts } = this;
        let seek = current;
        while (seek !== null && seek.key !== key) {
            seek.seen = true;
            seek = artifacts.nextNode(seek);
        }
        if (seek !== null) {
            this.current = artifacts.nextNode(seek);
        }
    }
    nextAppend() {
        let { iterator, current, artifacts } = this;
        let item = iterator.next();
        if (item === null) {
            return this.startPrune();
        }
        let { key } = item;
        if (current !== null && current.key === key) {
            this.nextRetain(item);
        } else if (artifacts.has(key)) {
            this.nextMove(item);
        } else {
            this.nextInsert(item);
        }
        return Phase.Append;
    }
    nextRetain(item) {
        let { artifacts, current } = this;
        current = current;
        current.update(item);
        this.current = artifacts.nextNode(current);
        this.target.retain(item.key, current.value, current.memo);
    }
    nextMove(item) {
        let { current, artifacts, target } = this;
        let { key } = item;
        let found = artifacts.get(item.key);
        found.update(item);
        if (artifacts.wasSeen(item.key)) {
            artifacts.move(found, current);
            target.move(found.key, found.value, found.memo, current ? current.key : null);
        } else {
            this.advanceToKey(key);
        }
    }
    nextInsert(item) {
        let { artifacts, target, current } = this;
        let node = artifacts.insertBefore(item, current);
        target.insert(node.key, node.value, node.memo, current ? current.key : null);
    }
    startPrune() {
        this.current = this.artifacts.head();
        return Phase.Prune;
    }
    nextPrune() {
        let { artifacts, target, current } = this;
        if (current === null) {
            return Phase.Done;
        }
        let node = current;
        this.current = artifacts.nextNode(node);
        if (node.shouldRemove()) {
            artifacts.remove(node);
            target.delete(node.key);
        } else {
            node.reset();
        }
        return Phase.Prune;
    }
    nextDone() {
        this.target.done();
    }
}

export { ConstReference, ListItem, IterationArtifacts, ReferenceIterator, IteratorSynchronizer, CONSTANT, INITIAL, VOLATILE, RevisionTag, TagWrapper, CONSTANT_TAG, VOLATILE_TAG, CURRENT_TAG, isConst, isConstTag, bump, DirtyableTag, combineTagged, combineSlice, combine, CachedTag, UpdatableTag, CachedReference, map, ReferenceCache, isModified };
