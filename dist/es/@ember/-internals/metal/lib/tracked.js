import { HAS_NATIVE_SYMBOL, symbol as emberSymbol } from '@ember/-internals/utils';
import { EMBER_NATIVE_DECORATOR_SUPPORT } from '@ember/canary-features';
import { assert } from '@ember/debug';
import { DEBUG } from '@glimmer/env';
import { combine, CONSTANT_TAG } from '@glimmer/reference';
import { isElementDescriptor } from './decorator';
import { setClassicDecorator } from './descriptor_map';
import { dirty, ensureRunloop, tagFor, tagForProperty } from './tags';
// For some reason TS can't infer that these two functions are compatible-ish,
// so we need to corece the type
let symbol = (HAS_NATIVE_SYMBOL ? Symbol : emberSymbol);
/**
  An object that that tracks @tracked properties that were consumed.

  @private
*/
export class Tracker {
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
export function tracked(...args) {
    assert(`@tracked can only be used directly as a native decorator. If you're using tracked in classic classes, add parenthesis to call it like a function: tracked()`, !(isElementDescriptor(args.slice(0, 3)) && args.length === 5 && args[4] === true));
    if (!isElementDescriptor(args)) {
        let propertyDesc = args[0];
        assert(`tracked() may only receive an options object containing 'value' or 'initializer', received ${propertyDesc}`, args.length === 0 || (typeof propertyDesc === 'object' && propertyDesc !== null));
        if (DEBUG && propertyDesc) {
            let keys = Object.keys(propertyDesc);
            assert(`The options object passed to tracked() may only contain a 'value' or 'initializer' property, not both. Received: [${keys}]`, keys.length <= 1 &&
                (keys[0] === undefined || keys[0] === 'value' || keys[0] === 'undefined'));
            assert(`The initializer passed to tracked must be a function. Received ${propertyDesc.initializer}`, !('initializer' in propertyDesc) || typeof propertyDesc.initializer === 'function');
        }
        let initializer = propertyDesc ? propertyDesc.initializer : undefined;
        let value = propertyDesc ? propertyDesc.value : undefined;
        let decorator = function (target, key, _desc, _meta, isClassicDecorator) {
            assert(`You attempted to set a default value for ${key} with the @tracked({ value: 'default' }) syntax. You can only use this syntax with classic classes. For native classes, you can use class initializers: @tracked field = 'default';`, isClassicDecorator);
            let fieldDesc = {
                initializer: initializer || (() => value),
            };
            return descriptorForField([target, key, fieldDesc]);
        };
        setClassicDecorator(decorator);
        return decorator;
    }
    assert('Native decorators are not enabled without the EMBER_NATIVE_DECORATOR_SUPPORT flag', Boolean(EMBER_NATIVE_DECORATOR_SUPPORT));
    return descriptorForField(args);
}
if (DEBUG) {
    // Normally this isn't a classic decorator, but we want to throw a helpful
    // error in development so we need it to treat it like one
    setClassicDecorator(tracked);
}
function descriptorForField([_target, key, desc]) {
    assert(`You attempted to use @tracked on ${key}, but that element is not a class field. @tracked is only usable on class fields. Native getters and setters will autotrack add any tracked fields they encounter, so there is no need mark getters and setters with @tracked.`, !desc || (!desc.value && !desc.get && !desc.set));
    let initializer = desc ? desc.initializer : undefined;
    let secretKey = symbol(key);
    return {
        enumerable: true,
        configurable: true,
        get() {
            if (CURRENT_TRACKER)
                CURRENT_TRACKER.add(tagForProperty(this, key));
            // If the field has never been initialized, we should initialize it
            if (!(secretKey in this)) {
                this[secretKey] = typeof initializer === 'function' ? initializer.call(this) : undefined;
            }
            return this[secretKey];
        },
        set(newValue) {
            tagFor(this).inner['dirty']();
            dirty(tagForProperty(this, key));
            this[secretKey] = newValue;
            propertyDidChange();
        },
    };
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
let propertyDidChange = ensureRunloop;
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
