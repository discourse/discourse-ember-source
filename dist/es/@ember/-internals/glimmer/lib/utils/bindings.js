import { get } from '@ember/-internals/metal';
import { assert } from '@ember/debug';
import { dasherize } from '@ember/string';
import { CachedReference, combine, map } from '@glimmer/reference';
import { PrimitiveReference } from '@glimmer/runtime';
import { Ops } from '@glimmer/wire-format';
import { ROOT_REF } from '../component';
import { referenceFromParts } from './references';
import { htmlSafe, isHTMLSafe } from './string';
export function referenceForKey(component, key) {
    return component[ROOT_REF].get(key);
}
function referenceForParts(component, parts) {
    let isAttrs = parts[0] === 'attrs';
    // TODO deprecate this
    if (isAttrs) {
        parts.shift();
        if (parts.length === 1) {
            return referenceForKey(component, parts[0]);
        }
    }
    return referenceFromParts(component[ROOT_REF], parts);
}
// TODO we should probably do this transform at build time
export function wrapComponentClassAttribute(hash) {
    if (hash === null) {
        return;
    }
    let [keys, values] = hash;
    let index = keys === null ? -1 : keys.indexOf('class');
    if (index !== -1) {
        let value = values[index];
        if (!Array.isArray(value)) {
            return;
        }
        let [type] = value;
        if (type === Ops.Get || type === Ops.MaybeLocal) {
            let path = value[value.length - 1];
            let propName = path[path.length - 1];
            values[index] = [Ops.Helper, '-class', [value, propName], null];
        }
    }
}
export const AttributeBinding = {
    parse(microsyntax) {
        let colonIndex = microsyntax.indexOf(':');
        if (colonIndex === -1) {
            assert('You cannot use class as an attributeBinding, use classNameBindings instead.', microsyntax !== 'class');
            return [microsyntax, microsyntax, true];
        }
        else {
            let prop = microsyntax.substring(0, colonIndex);
            let attribute = microsyntax.substring(colonIndex + 1);
            assert('You cannot use class as an attributeBinding, use classNameBindings instead.', attribute !== 'class');
            return [prop, attribute, false];
        }
    },
    install(_element, component, parsed, operations) {
        let [prop, attribute, isSimple] = parsed;
        if (attribute === 'id') {
            let elementId = get(component, prop);
            if (elementId === undefined || elementId === null) {
                elementId = component.elementId;
            }
            elementId = PrimitiveReference.create(elementId);
            operations.setAttribute('id', elementId, true, null);
            // operations.addStaticAttribute(element, 'id', elementId);
            return;
        }
        let isPath = prop.indexOf('.') > -1;
        let reference = isPath
            ? referenceForParts(component, prop.split('.'))
            : referenceForKey(component, prop);
        assert(`Illegal attributeBinding: '${prop}' is not a valid attribute name.`, !(isSimple && isPath));
        if (attribute === 'style') {
            reference = new StyleBindingReference(reference, referenceForKey(component, 'isVisible'));
        }
        operations.setAttribute(attribute, reference, false, null);
        // operations.addDynamicAttribute(element, attribute, reference, false);
    },
};
const DISPLAY_NONE = 'display: none;';
const SAFE_DISPLAY_NONE = htmlSafe(DISPLAY_NONE);
class StyleBindingReference extends CachedReference {
    constructor(inner, isVisible) {
        super();
        this.inner = inner;
        this.isVisible = isVisible;
        this.tag = combine([inner.tag, isVisible.tag]);
    }
    compute() {
        let value = this.inner.value();
        let isVisible = this.isVisible.value();
        if (isVisible !== false) {
            return value;
        }
        else if (!value) {
            return SAFE_DISPLAY_NONE;
        }
        else {
            let style = value + ' ' + DISPLAY_NONE;
            return isHTMLSafe(value) ? htmlSafe(style) : style;
        }
    }
}
export const IsVisibleBinding = {
    install(_element, component, operations) {
        operations.setAttribute('style', map(referenceForKey(component, 'isVisible'), this.mapStyleValue), false, null);
        // // the upstream type for addDynamicAttribute's `value` argument
        // // appears to be incorrect. It is currently a Reference<string>, I
        // // think it should be a Reference<string|null>.
        // operations.addDynamicAttribute(element, 'style', ref as any as Reference<string>, false);
    },
    mapStyleValue(isVisible) {
        return isVisible === false ? SAFE_DISPLAY_NONE : null;
    },
};
export const ClassNameBinding = {
    install(_element, component, microsyntax, operations) {
        let [prop, truthy, falsy] = microsyntax.split(':');
        let isStatic = prop === '';
        if (isStatic) {
            operations.setAttribute('class', PrimitiveReference.create(truthy), true, null);
        }
        else {
            let isPath = prop.indexOf('.') > -1;
            let parts = isPath ? prop.split('.') : [];
            let value = isPath ? referenceForParts(component, parts) : referenceForKey(component, prop);
            let ref;
            if (truthy === undefined) {
                ref = new SimpleClassNameBindingReference(value, isPath ? parts[parts.length - 1] : prop);
            }
            else {
                ref = new ColonClassNameBindingReference(value, truthy, falsy);
            }
            operations.setAttribute('class', ref, false, null);
            // // the upstream type for addDynamicAttribute's `value` argument
            // // appears to be incorrect. It is currently a Reference<string>, I
            // // think it should be a Reference<string|null>.
            // operations.addDynamicAttribute(element, 'class', ref as any as Reference<string>, false);
        }
    },
};
export class SimpleClassNameBindingReference extends CachedReference {
    constructor(inner, path) {
        super();
        this.inner = inner;
        this.path = path;
        this.tag = inner.tag;
        this.inner = inner;
        this.path = path;
        this.dasherizedPath = null;
    }
    compute() {
        let value = this.inner.value();
        if (value === true) {
            let { path, dasherizedPath } = this;
            return dasherizedPath || (this.dasherizedPath = dasherize(path));
        }
        else if (value || value === 0) {
            return String(value);
        }
        else {
            return null;
        }
    }
}
class ColonClassNameBindingReference extends CachedReference {
    constructor(inner, truthy = null, falsy = null) {
        super();
        this.inner = inner;
        this.truthy = truthy;
        this.falsy = falsy;
        this.tag = inner.tag;
    }
    compute() {
        let { inner, truthy, falsy } = this;
        return inner.value() ? truthy : falsy;
    }
}
