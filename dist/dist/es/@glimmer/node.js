import { DOMTreeConstruction, ConcreteBounds, NewElementBuilder } from '@glimmer/runtime';

class NodeDOMTreeConstruction extends DOMTreeConstruction {
    constructor(doc) {
        super(doc);
    }
    // override to prevent usage of `this.document` until after the constructor
    setupUselessElement() {}
    insertHTMLBefore(parent, reference, html) {
        let prev = reference ? reference.previousSibling : parent.lastChild;
        let raw = this.document.createRawHTMLSection(html);
        parent.insertBefore(raw, reference);
        let first = prev ? prev.nextSibling : parent.firstChild;
        let last = reference ? reference.previousSibling : parent.lastChild;
        return new ConcreteBounds(parent, first, last);
    }
    // override to avoid SVG detection/work when in node (this is not needed in SSR)
    createElement(tag) {
        return this.document.createElement(tag);
    }
    // override to avoid namespace shenanigans when in node (this is not needed in SSR)
    setAttribute(element, name, value) {
        element.setAttribute(name, value);
    }
}

const TEXT_NODE = 3;
function currentNode(cursor) {
    let { element, nextSibling } = cursor;
    if (nextSibling === null) {
        return element.lastChild;
    } else {
        return nextSibling.previousSibling;
    }
}
class SerializeBuilder extends NewElementBuilder {
    constructor() {
        super(...arguments);
        this.serializeBlockDepth = 0;
    }
    __openBlock() {
        let depth = this.serializeBlockDepth++;
        this.__appendComment(`%+b:${depth}%`);
        super.__openBlock();
    }
    __closeBlock() {
        super.__closeBlock();
        this.__appendComment(`%-b:${--this.serializeBlockDepth}%`);
    }
    __appendHTML(html) {
        // Do we need to run the html tokenizer here?
        let first = this.__appendComment('%glmr%');
        if (this.element.tagName === 'TABLE') {
            let openIndex = html.indexOf('<');
            if (openIndex > -1) {
                let tr = html.slice(openIndex + 1, openIndex + 3);
                if (tr === 'tr') {
                    html = `<tbody>${html}</tbody>`;
                }
            }
        }
        if (html === '') {
            this.__appendComment('% %');
        } else {
            super.__appendHTML(html);
        }
        let last = this.__appendComment('%glmr%');
        return new ConcreteBounds(this.element, first, last);
    }
    __appendText(string) {
        let current = currentNode(this);
        if (string === '') {
            return this.__appendComment('% %');
        } else if (current && current.nodeType === TEXT_NODE) {
            this.__appendComment('%|%');
        }
        return super.__appendText(string);
    }
    closeElement() {
        if (this.element['needsExtraClose'] === true) {
            this.element['needsExtraClose'] = false;
            super.closeElement();
        }
        super.closeElement();
    }
    openElement(tag) {
        if (tag === 'tr') {
            if (this.element.tagName !== 'TBODY') {
                this.openElement('tbody');
                // This prevents the closeBlock comment from being re-parented
                // under the auto inserted tbody. Rehydration builder needs to
                // account for the insertion since it is injected here and not
                // really in the template.
                this.constructing['needsExtraClose'] = true;
                this.flushElement();
            }
        }
        return super.openElement(tag);
    }
    pushRemoteElement(element, cursorId, nextSibling = null) {
        let { dom } = this;
        let script = dom.createElement('script');
        script.setAttribute('glmr', cursorId);
        dom.insertBefore(element, script, nextSibling);
        super.pushRemoteElement(element, cursorId, nextSibling);
    }
}
function serializeBuilder(env, cursor) {
    return SerializeBuilder.forInitialRender(env, cursor);
}

export { NodeDOMTreeConstruction, serializeBuilder };
