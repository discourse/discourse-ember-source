import { combine, CONSTANT_TAG } from '@glimmer/reference';
import { dirty, tagFor, tagForProperty, update } from './tags';
/**
  An object that that tracks @tracked properties that were consumed.

  @private
 */
class Tracker {
    constructor() {
        this.tags = new Set();
        this.last = null;
    }
    add(tag) {
        this.tags.add(tag);
        this.last = tag;
    }
    get size() {
        return this.tags.size;
    }
    combine() {
        if (this.tags.size === 0) {
            return CONSTANT_TAG;
        }
        else if (this.tags.size === 1) {
            return this.last;
        }
        else {
            let tags = [];
            this.tags.forEach(tag => tags.push(tag));
            return combine(tags);
        }
    }
}
export function tracked(...dependencies) {
    let [, key, descriptor] = dependencies;
    if (descriptor === undefined || 'initializer' in descriptor) {
        return descriptorForDataProperty(key, descriptor);
    }
    else {
        return descriptorForAccessor(key, descriptor);
    }
}
/**
  @private

  Whenever a tracked computed property is entered, the current tracker is
  saved off and a new tracker is replaced.

  Any tracked properties consumed are added to the current tracker.

  When a tracked computed property is exited, the tracker's tags are
  combined and added to the parent tracker.

  The consequence is that each tracked computed property has a tag
  that corresponds to the tracked properties consumed inside of
  itself, including child tracked computed properties.
 */
let CURRENT_TRACKER = null;
export function getCurrentTracker() {
    return CURRENT_TRACKER;
}
export function setCurrentTracker(tracker = new Tracker()) {
    return (CURRENT_TRACKER = tracker);
}
function descriptorForAccessor(key, descriptor) {
    let get = descriptor.get;
    let set = descriptor.set;
    function getter() {
        // Swap the parent tracker for a new tracker
        let old = CURRENT_TRACKER;
        let tracker = (CURRENT_TRACKER = new Tracker());
        // Call the getter
        let ret = get.call(this);
        // Swap back the parent tracker
        CURRENT_TRACKER = old;
        // Combine the tags in the new tracker and add them to the parent tracker
        let tag = tracker.combine();
        if (CURRENT_TRACKER)
            CURRENT_TRACKER.add(tag);
        // Update the UpdatableTag for this property with the tag for all of the
        // consumed dependencies.
        update(tagForProperty(this, key), tag);
        return ret;
    }
    function setter() {
        dirty(tagForProperty(this, key));
        set.apply(this, arguments);
    }
    return {
        enumerable: true,
        configurable: false,
        get: get && getter,
        set: set && setter,
    };
}
/**
  @private

  A getter/setter for change tracking for a particular key. The accessor
  acts just like a normal property, but it triggers the `propertyDidChange`
  hook when written to.

  Values are saved on the object using a "shadow key," or a symbol based on the
  tracked property name. Sets write the value to the shadow key, and gets read
  from it.
 */
function descriptorForDataProperty(key, descriptor) {
    let shadowKey = Symbol(key);
    return {
        enumerable: true,
        configurable: true,
        get() {
            if (CURRENT_TRACKER)
                CURRENT_TRACKER.add(tagForProperty(this, key));
            if (!(shadowKey in this)) {
                this[shadowKey] = descriptor.value;
            }
            return this[shadowKey];
        },
        set(newValue) {
            tagFor(this).inner['dirty']();
            dirty(tagForProperty(this, key));
            this[shadowKey] = newValue;
            propertyDidChange();
        },
    };
}
let propertyDidChange = function () { };
export function setPropertyDidChange(cb) {
    propertyDidChange = cb;
}
export class UntrackedPropertyError extends Error {
    constructor(target, key, message) {
        super(message);
        this.target = target;
        this.key = key;
    }
    static for(obj, key) {
        return new UntrackedPropertyError(obj, key, `The property '${key}' on ${obj} was changed after being rendered. If you want to change a property used in a template after the component has rendered, mark the property as a tracked property with the @tracked decorator.`);
    }
}
