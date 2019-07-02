import { EventedTokenizer, EntityParser, HTML5NamedCharRefs } from 'simple-html-tokenizer';
import { assign } from '@glimmer/util';
import { parse } from 'handlebars';

function buildMustache(path, params, hash, raw, loc) {
    if (typeof path === 'string') {
        path = buildPath(path);
    }
    return {
        type: 'MustacheStatement',
        path,
        params: params || [],
        hash: hash || buildHash([]),
        escaped: !raw,
        loc: buildLoc(loc || null)
    };
}
function buildBlock(path, params, hash, program, inverse, loc) {
    return {
        type: 'BlockStatement',
        path: buildPath(path),
        params: params || [],
        hash: hash || buildHash([]),
        program: program || null,
        inverse: inverse || null,
        loc: buildLoc(loc || null)
    };
}
function buildElementModifier(path, params, hash, loc) {
    return {
        type: 'ElementModifierStatement',
        path: buildPath(path),
        params: params || [],
        hash: hash || buildHash([]),
        loc: buildLoc(loc || null)
    };
}
function buildPartial(name, params, hash, indent, loc) {
    return {
        type: 'PartialStatement',
        name: name,
        params: params || [],
        hash: hash || buildHash([]),
        indent: indent || '',
        strip: { open: false, close: false },
        loc: buildLoc(loc || null)
    };
}
function buildComment(value, loc) {
    return {
        type: 'CommentStatement',
        value: value,
        loc: buildLoc(loc || null)
    };
}
function buildMustacheComment(value, loc) {
    return {
        type: 'MustacheCommentStatement',
        value: value,
        loc: buildLoc(loc || null)
    };
}
function buildConcat(parts, loc) {
    return {
        type: 'ConcatStatement',
        parts: parts || [],
        loc: buildLoc(loc || null)
    };
}
function buildElement(tag, attributes, modifiers, children, comments, blockParams, loc) {
    // this is used for backwards compat prior to `blockParams` being added to the AST
    if (Array.isArray(comments)) {
        if (isBlockParms(comments)) {
            blockParams = comments;
            comments = [];
        } else if (isLoc(blockParams)) {
            loc = blockParams;
            blockParams = [];
        }
    } else if (isLoc(comments)) {
        // this is used for backwards compat prior to `comments` being added to the AST
        loc = comments;
        comments = [];
    } else if (isLoc(blockParams)) {
        loc = blockParams;
        blockParams = [];
    }
    // this is used for backwards compat, prior to `selfClosing` being part of the ElementNode AST
    let selfClosing = false;
    if (typeof tag === 'object') {
        selfClosing = tag.selfClosing;
        tag = tag.name;
    }
    return {
        type: 'ElementNode',
        tag: tag || '',
        selfClosing: selfClosing,
        attributes: attributes || [],
        blockParams: blockParams || [],
        modifiers: modifiers || [],
        comments: comments || [],
        children: children || [],
        loc: buildLoc(loc || null)
    };
}
function buildAttr(name, value, loc) {
    return {
        type: 'AttrNode',
        name: name,
        value: value,
        loc: buildLoc(loc || null)
    };
}
function buildText(chars, loc) {
    return {
        type: 'TextNode',
        chars: chars || '',
        loc: buildLoc(loc || null)
    };
}
// Expressions
function buildSexpr(path, params, hash, loc) {
    return {
        type: 'SubExpression',
        path: buildPath(path),
        params: params || [],
        hash: hash || buildHash([]),
        loc: buildLoc(loc || null)
    };
}
function buildPath(original, loc) {
    if (typeof original !== 'string') return original;
    let parts = original.split('.');
    let thisHead = false;
    if (parts[0] === 'this') {
        thisHead = true;
        parts = parts.slice(1);
    }
    return {
        type: 'PathExpression',
        original,
        this: thisHead,
        parts,
        data: false,
        loc: buildLoc(loc || null)
    };
}
function buildLiteral(type, value, loc) {
    return {
        type,
        value,
        original: value,
        loc: buildLoc(loc || null)
    };
}
// Miscellaneous
function buildHash(pairs, loc) {
    return {
        type: 'Hash',
        pairs: pairs || [],
        loc: buildLoc(loc || null)
    };
}
function buildPair(key, value, loc) {
    return {
        type: 'HashPair',
        key: key,
        value,
        loc: buildLoc(loc || null)
    };
}
function buildProgram(body, blockParams, loc) {
    return {
        type: 'Program',
        body: body || [],
        blockParams: blockParams || [],
        loc: buildLoc(loc || null)
    };
}
function buildSource(source) {
    return source || null;
}
function buildPosition(line, column) {
    return {
        line,
        column
    };
}
const SYNTHETIC = {
    source: '(synthetic)',
    start: { line: 1, column: 0 },
    end: { line: 1, column: 0 }
};
function buildLoc(...args) {
    if (args.length === 1) {
        let loc = args[0];
        if (loc && typeof loc === 'object') {
            return {
                source: buildSource(loc.source),
                start: buildPosition(loc.start.line, loc.start.column),
                end: buildPosition(loc.end.line, loc.end.column)
            };
        } else {
            return SYNTHETIC;
        }
    } else {
        let [startLine, startColumn, endLine, endColumn, source] = args;
        return {
            source: buildSource(source),
            start: buildPosition(startLine, startColumn),
            end: buildPosition(endLine, endColumn)
        };
    }
}
function isBlockParms(arr) {
    return arr[0] === 'string';
}
function isLoc(item) {
    return !Array.isArray(item);
}
var b = {
    mustache: buildMustache,
    block: buildBlock,
    partial: buildPartial,
    comment: buildComment,
    mustacheComment: buildMustacheComment,
    element: buildElement,
    elementModifier: buildElementModifier,
    attr: buildAttr,
    text: buildText,
    sexpr: buildSexpr,
    path: buildPath,
    concat: buildConcat,
    hash: buildHash,
    pair: buildPair,
    literal: buildLiteral,
    program: buildProgram,
    loc: buildLoc,
    pos: buildPosition,
    string: literal('StringLiteral'),
    boolean: literal('BooleanLiteral'),
    number: literal('NumberLiteral'),
    undefined() {
        return buildLiteral('UndefinedLiteral', undefined);
    },
    null() {
        return buildLiteral('NullLiteral', null);
    }
};
function literal(type) {
    return function (value) {
        return buildLiteral(type, value);
    };
}

/**
 * Subclass of `Error` with additional information
 * about location of incorrect markup.
 */
const SyntaxError = function () {
    SyntaxError.prototype = Object.create(Error.prototype);
    SyntaxError.prototype.constructor = SyntaxError;
    function SyntaxError(message, location) {
        let error = Error.call(this, message);
        this.message = message;
        this.stack = error.stack;
        this.location = location;
    }
    return SyntaxError;
}();

// Regex to validate the identifier for block parameters.
// Based on the ID validation regex in Handlebars.
let ID_INVERSE_PATTERN = /[!"#%-,\.\/;->@\[-\^`\{-~]/;
// Checks the element's attributes to see if it uses block params.
// If it does, registers the block params with the program and
// removes the corresponding attributes from the element.
function parseElementBlockParams(element) {
    let params = parseBlockParams(element);
    if (params) element.blockParams = params;
}
function parseBlockParams(element) {
    let l = element.attributes.length;
    let attrNames = [];
    for (let i = 0; i < l; i++) {
        attrNames.push(element.attributes[i].name);
    }
    let asIndex = attrNames.indexOf('as');
    if (asIndex !== -1 && l > asIndex && attrNames[asIndex + 1].charAt(0) === '|') {
        // Some basic validation, since we're doing the parsing ourselves
        let paramsString = attrNames.slice(asIndex).join(' ');
        if (paramsString.charAt(paramsString.length - 1) !== '|' || paramsString.match(/\|/g).length !== 2) {
            throw new SyntaxError("Invalid block parameters syntax: '" + paramsString + "'", element.loc);
        }
        let params = [];
        for (let i = asIndex + 1; i < l; i++) {
            let param = attrNames[i].replace(/\|/g, '');
            if (param !== '') {
                if (ID_INVERSE_PATTERN.test(param)) {
                    throw new SyntaxError("Invalid identifier for block parameters: '" + param + "' in '" + paramsString + "'", element.loc);
                }
                params.push(param);
            }
        }
        if (params.length === 0) {
            throw new SyntaxError("Cannot use zero block parameters: '" + paramsString + "'", element.loc);
        }
        element.attributes = element.attributes.slice(0, asIndex);
        return params;
    }
    return null;
}
function childrenFor(node) {
    switch (node.type) {
        case 'Program':
            return node.body;
        case 'ElementNode':
            return node.children;
    }
}
function appendChild(parent, node) {
    childrenFor(parent).push(node);
}
function isLiteral(path) {
    return path.type === 'StringLiteral' || path.type === 'BooleanLiteral' || path.type === 'NumberLiteral' || path.type === 'NullLiteral' || path.type === 'UndefinedLiteral';
}
function printLiteral(literal) {
    if (literal.type === 'UndefinedLiteral') {
        return 'undefined';
    } else {
        return JSON.stringify(literal.value);
    }
}

const entityParser = new EntityParser(HTML5NamedCharRefs);
class Parser {
    constructor(source) {
        this.elementStack = [];
        this.currentAttribute = null;
        this.currentNode = null;
        this.tokenizer = new EventedTokenizer(this, entityParser);
        this.source = source.split(/(?:\r\n?|\n)/g);
    }
    get currentAttr() {
        return this.currentAttribute;
    }
    get currentTag() {
        let node = this.currentNode;

        return node;
    }
    get currentStartTag() {
        let node = this.currentNode;

        return node;
    }
    get currentEndTag() {
        let node = this.currentNode;

        return node;
    }
    get currentComment() {
        let node = this.currentNode;

        return node;
    }
    get currentData() {
        let node = this.currentNode;

        return node;
    }
    acceptNode(node) {
        return this[node.type](node);
    }
    currentElement() {
        return this.elementStack[this.elementStack.length - 1];
    }
    sourceForNode(node, endNode) {
        let firstLine = node.loc.start.line - 1;
        let currentLine = firstLine - 1;
        let firstColumn = node.loc.start.column;
        let string = [];
        let line;
        let lastLine;
        let lastColumn;
        if (endNode) {
            lastLine = endNode.loc.end.line - 1;
            lastColumn = endNode.loc.end.column;
        } else {
            lastLine = node.loc.end.line - 1;
            lastColumn = node.loc.end.column;
        }
        while (currentLine < lastLine) {
            currentLine++;
            line = this.source[currentLine];
            if (currentLine === firstLine) {
                if (firstLine === lastLine) {
                    string.push(line.slice(firstColumn, lastColumn));
                } else {
                    string.push(line.slice(firstColumn));
                }
            } else if (currentLine === lastLine) {
                string.push(line.slice(0, lastColumn));
            } else {
                string.push(line);
            }
        }
        return string.join('\n');
    }
}

class HandlebarsNodeVisitors extends Parser {
    constructor() {
        super(...arguments);
        this.cursorCount = 0;
    }
    cursor() {
        return `%cursor:${this.cursorCount++}%`;
    }
    Program(program) {
        let body = [];
        this.cursorCount = 0;
        let node = b.program(body, program.blockParams, program.loc);
        let i,
            l = program.body.length;
        this.elementStack.push(node);
        if (l === 0) {
            return this.elementStack.pop();
        }
        for (i = 0; i < l; i++) {
            this.acceptNode(program.body[i]);
        }
        // Ensure that that the element stack is balanced properly.
        let poppedNode = this.elementStack.pop();
        if (poppedNode !== node) {
            let elementNode = poppedNode;
            throw new SyntaxError('Unclosed element `' + elementNode.tag + '` (on line ' + elementNode.loc.start.line + ').', elementNode.loc);
        }
        return node;
    }
    BlockStatement(block) {
        if (this.tokenizer['state'] === 'comment') {
            this.appendToCommentData(this.sourceForNode(block));
            return;
        }
        if (this.tokenizer['state'] !== 'comment' && this.tokenizer['state'] !== 'data' && this.tokenizer['state'] !== 'beforeData') {
            throw new SyntaxError('A block may only be used inside an HTML element or another block.', block.loc);
        }
        let { path, params, hash } = acceptCallNodes(this, block);
        let program = this.Program(block.program);
        let inverse = block.inverse ? this.Program(block.inverse) : null;
        if (path.original === 'in-element') {
            hash = addInElementHash(this.cursor(), hash, block.loc);
        }
        let node = b.block(path, params, hash, program, inverse, block.loc);
        let parentProgram = this.currentElement();
        appendChild(parentProgram, node);
    }
    MustacheStatement(rawMustache) {
        let { tokenizer } = this;
        if (tokenizer.state === 'comment') {
            this.appendToCommentData(this.sourceForNode(rawMustache));
            return;
        }
        let mustache;
        let { escaped, loc } = rawMustache;
        if (rawMustache.path.type.match(/Literal$/)) {
            mustache = {
                type: 'MustacheStatement',
                path: this.acceptNode(rawMustache.path),
                params: [],
                hash: b.hash(),
                escaped,
                loc
            };
        } else {
            let { path, params, hash } = acceptCallNodes(this, rawMustache);
            mustache = b.mustache(path, params, hash, !escaped, loc);
        }
        switch (tokenizer.state) {
            // Tag helpers
            case "tagOpen" /* tagOpen */:
            case "tagName" /* tagName */:
                throw new SyntaxError(`Cannot use mustaches in an elements tagname: \`${this.sourceForNode(rawMustache, rawMustache.path)}\` at L${loc.start.line}:C${loc.start.column}`, mustache.loc);
            case "beforeAttributeName" /* beforeAttributeName */:
                addElementModifier(this.currentStartTag, mustache);
                break;
            case "attributeName" /* attributeName */:
            case "afterAttributeName" /* afterAttributeName */:
                this.beginAttributeValue(false);
                this.finishAttributeValue();
                addElementModifier(this.currentStartTag, mustache);
                tokenizer.transitionTo("beforeAttributeName" /* beforeAttributeName */);
                break;
            case "afterAttributeValueQuoted" /* afterAttributeValueQuoted */:
                addElementModifier(this.currentStartTag, mustache);
                tokenizer.transitionTo("beforeAttributeName" /* beforeAttributeName */);
                break;
            // Attribute values
            case "beforeAttributeValue" /* beforeAttributeValue */:
                this.beginAttributeValue(false);
                appendDynamicAttributeValuePart(this.currentAttribute, mustache);
                tokenizer.transitionTo("attributeValueUnquoted" /* attributeValueUnquoted */);
                break;
            case "attributeValueDoubleQuoted" /* attributeValueDoubleQuoted */:
            case "attributeValueSingleQuoted" /* attributeValueSingleQuoted */:
            case "attributeValueUnquoted" /* attributeValueUnquoted */:
                appendDynamicAttributeValuePart(this.currentAttribute, mustache);
                break;
            // TODO: Only append child when the tokenizer state makes
            // sense to do so, otherwise throw an error.
            default:
                appendChild(this.currentElement(), mustache);
        }
        return mustache;
    }
    ContentStatement(content) {
        updateTokenizerLocation(this.tokenizer, content);
        this.tokenizer.tokenizePart(content.value);
        this.tokenizer.flushData();
    }
    CommentStatement(rawComment) {
        let { tokenizer } = this;
        if (tokenizer.state === "comment" /* comment */) {
                this.appendToCommentData(this.sourceForNode(rawComment));
                return null;
            }
        let { value, loc } = rawComment;
        let comment = b.mustacheComment(value, loc);
        switch (tokenizer.state) {
            case "beforeAttributeName" /* beforeAttributeName */:
                this.currentStartTag.comments.push(comment);
                break;
            case "beforeData" /* beforeData */:
            case "data" /* data */:
                appendChild(this.currentElement(), comment);
                break;
            default:
                throw new SyntaxError(`Using a Handlebars comment when in the \`${tokenizer['state']}\` state is not supported: "${comment.value}" on line ${loc.start.line}:${loc.start.column}`, rawComment.loc);
        }
        return comment;
    }
    PartialStatement(partial) {
        let { loc } = partial;
        throw new SyntaxError(`Handlebars partials are not supported: "${this.sourceForNode(partial, partial.name)}" at L${loc.start.line}:C${loc.start.column}`, partial.loc);
    }
    PartialBlockStatement(partialBlock) {
        let { loc } = partialBlock;
        throw new SyntaxError(`Handlebars partial blocks are not supported: "${this.sourceForNode(partialBlock, partialBlock.name)}" at L${loc.start.line}:C${loc.start.column}`, partialBlock.loc);
    }
    Decorator(decorator) {
        let { loc } = decorator;
        throw new SyntaxError(`Handlebars decorators are not supported: "${this.sourceForNode(decorator, decorator.path)}" at L${loc.start.line}:C${loc.start.column}`, decorator.loc);
    }
    DecoratorBlock(decoratorBlock) {
        let { loc } = decoratorBlock;
        throw new SyntaxError(`Handlebars decorator blocks are not supported: "${this.sourceForNode(decoratorBlock, decoratorBlock.path)}" at L${loc.start.line}:C${loc.start.column}`, decoratorBlock.loc);
    }
    SubExpression(sexpr) {
        let { path, params, hash } = acceptCallNodes(this, sexpr);
        return b.sexpr(path, params, hash, sexpr.loc);
    }
    PathExpression(path) {
        let { original, loc } = path;
        let parts;
        if (original.indexOf('/') !== -1) {
            if (original.slice(0, 2) === './') {
                throw new SyntaxError(`Using "./" is not supported in Glimmer and unnecessary: "${path.original}" on line ${loc.start.line}.`, path.loc);
            }
            if (original.slice(0, 3) === '../') {
                throw new SyntaxError(`Changing context using "../" is not supported in Glimmer: "${path.original}" on line ${loc.start.line}.`, path.loc);
            }
            if (original.indexOf('.') !== -1) {
                throw new SyntaxError(`Mixing '.' and '/' in paths is not supported in Glimmer; use only '.' to separate property paths: "${path.original}" on line ${loc.start.line}.`, path.loc);
            }
            parts = [path.parts.join('/')];
        } else if (original === '.') {
            let locationInfo = `L${loc.start.line}:C${loc.start.column}`;
            throw new SyntaxError(`'.' is not a supported path in Glimmer; check for a path with a trailing '.' at ${locationInfo}.`, path.loc);
        } else {
            parts = path.parts;
        }
        let thisHead = false;
        // This is to fix a bug in the Handlebars AST where the path expressions in
        // `{{this.foo}}` (and similarly `{{foo-bar this.foo named=this.foo}}` etc)
        // are simply turned into `{{foo}}`. The fix is to push it back onto the
        // parts array and let the runtime see the difference. However, we cannot
        // simply use the string `this` as it means literally the property called
        // "this" in the current context (it can be expressed in the syntax as
        // `{{[this]}}`, where the square bracket are generally for this kind of
        // escaping – such as `{{foo.["bar.baz"]}}` would mean lookup a property
        // named literally "bar.baz" on `this.foo`). By convention, we use `null`
        // for this purpose.
        if (original.match(/^this(\..+)?$/)) {
            thisHead = true;
        }
        return {
            type: 'PathExpression',
            original: path.original,
            this: thisHead,
            parts,
            data: path.data,
            loc: path.loc
        };
    }
    Hash(hash) {
        let pairs = [];
        for (let i = 0; i < hash.pairs.length; i++) {
            let pair = hash.pairs[i];
            pairs.push(b.pair(pair.key, this.acceptNode(pair.value), pair.loc));
        }
        return b.hash(pairs, hash.loc);
    }
    StringLiteral(string) {
        return b.literal('StringLiteral', string.value, string.loc);
    }
    BooleanLiteral(boolean) {
        return b.literal('BooleanLiteral', boolean.value, boolean.loc);
    }
    NumberLiteral(number) {
        return b.literal('NumberLiteral', number.value, number.loc);
    }
    UndefinedLiteral(undef) {
        return b.literal('UndefinedLiteral', undefined, undef.loc);
    }
    NullLiteral(nul) {
        return b.literal('NullLiteral', null, nul.loc);
    }
}
function calculateRightStrippedOffsets(original, value) {
    if (value === '') {
        // if it is empty, just return the count of newlines
        // in original
        return {
            lines: original.split('\n').length - 1,
            columns: 0
        };
    }
    // otherwise, return the number of newlines prior to
    // `value`
    let difference = original.split(value)[0];
    let lines = difference.split(/\n/);
    let lineCount = lines.length - 1;
    return {
        lines: lineCount,
        columns: lines[lineCount].length
    };
}
function updateTokenizerLocation(tokenizer, content) {
    let line = content.loc.start.line;
    let column = content.loc.start.column;
    let offsets = calculateRightStrippedOffsets(content.original, content.value);
    line = line + offsets.lines;
    if (offsets.lines) {
        column = offsets.columns;
    } else {
        column = column + offsets.columns;
    }
    tokenizer.line = line;
    tokenizer.column = column;
}
function acceptCallNodes(compiler, node) {
    let path = compiler.PathExpression(node.path);
    let params = node.params ? node.params.map(e => compiler.acceptNode(e)) : [];
    let hash = node.hash ? compiler.Hash(node.hash) : b.hash();
    return { path, params, hash };
}
function addElementModifier(element, mustache) {
    let { path, params, hash, loc } = mustache;
    if (isLiteral(path)) {
        let modifier = `{{${printLiteral(path)}}}`;
        let tag = `<${element.name} ... ${modifier} ...`;
        throw new SyntaxError(`In ${tag}, ${modifier} is not a valid modifier: "${path.original}" on line ${loc && loc.start.line}.`, mustache.loc);
    }
    let modifier = b.elementModifier(path, params, hash, loc);
    element.modifiers.push(modifier);
}
function addInElementHash(cursor, hash, loc) {
    let hasNextSibling = false;
    hash.pairs.forEach(pair => {
        if (pair.key === 'guid') {
            throw new SyntaxError('Cannot pass `guid` from user space', loc);
        }
        if (pair.key === 'nextSibling') {
            hasNextSibling = true;
        }
    });
    let guid = b.literal('StringLiteral', cursor);
    let guidPair = b.pair('guid', guid);
    hash.pairs.unshift(guidPair);
    if (!hasNextSibling) {
        let nullLiteral = b.literal('NullLiteral', null);
        let nextSibling = b.pair('nextSibling', nullLiteral);
        hash.pairs.push(nextSibling);
    }
    return hash;
}
function appendDynamicAttributeValuePart(attribute, part) {
    attribute.isDynamic = true;
    attribute.parts.push(part);
}

function tuple(...args) {
    return args;
}
// ensure stays in sync with typing
// ParentNode and ChildKey types are derived from VisitorKeysMap
const visitorKeys = {
    Program: tuple('body'),
    MustacheStatement: tuple('path', 'params', 'hash'),
    BlockStatement: tuple('path', 'params', 'hash', 'program', 'inverse'),
    ElementModifierStatement: tuple('path', 'params', 'hash'),
    PartialStatement: tuple('name', 'params', 'hash'),
    CommentStatement: tuple(),
    MustacheCommentStatement: tuple(),
    ElementNode: tuple('attributes', 'modifiers', 'children', 'comments'),
    AttrNode: tuple('value'),
    TextNode: tuple(),
    ConcatStatement: tuple('parts'),
    SubExpression: tuple('path', 'params', 'hash'),
    PathExpression: tuple(),
    StringLiteral: tuple(),
    BooleanLiteral: tuple(),
    NumberLiteral: tuple(),
    NullLiteral: tuple(),
    UndefinedLiteral: tuple(),
    Hash: tuple('pairs'),
    HashPair: tuple('value')
};

const TraversalError = function () {
    TraversalError.prototype = Object.create(Error.prototype);
    TraversalError.prototype.constructor = TraversalError;
    function TraversalError(message, node, parent, key) {
        let error = Error.call(this, message);
        this.key = key;
        this.message = message;
        this.node = node;
        this.parent = parent;
        this.stack = error.stack;
    }
    return TraversalError;
}();
function cannotRemoveNode(node, parent, key) {
    return new TraversalError('Cannot remove a node unless it is part of an array', node, parent, key);
}
function cannotReplaceNode(node, parent, key) {
    return new TraversalError('Cannot replace a node with multiple nodes unless it is part of an array', node, parent, key);
}
function cannotReplaceOrRemoveInKeyHandlerYet(node, key) {
    return new TraversalError('Replacing and removing in key handlers is not yet supported.', node, null, key);
}

function getEnterFunction(handler) {
    return typeof handler === 'function' ? handler : handler.enter;
}
function getExitFunction(handler) {
    return typeof handler !== 'function' ? handler.exit : undefined;
}
function getKeyHandler(handler, key) {
    let keyVisitor = typeof handler !== 'function' ? handler.keys : undefined;
    if (keyVisitor === undefined) return;
    let keyHandler = keyVisitor[key];
    if (keyHandler !== undefined) {
        // widen specific key to all keys
        return keyHandler;
    }
    return keyVisitor.All;
}
function getNodeHandler(visitor, nodeType) {
    let handler = visitor[nodeType];
    if (handler !== undefined) {
        // widen specific Node to all nodes
        return handler;
    }
    return visitor.All;
}
function visitNode(visitor, node) {
    let handler = getNodeHandler(visitor, node.type);
    let enter;
    let exit;
    if (handler !== undefined) {
        enter = getEnterFunction(handler);
        exit = getExitFunction(handler);
    }
    let result;
    if (enter !== undefined) {
        result = enter(node);
    }
    if (result !== undefined && result !== null) {
        if (JSON.stringify(node) === JSON.stringify(result)) {
            result = undefined;
        } else if (Array.isArray(result)) {
            visitArray(visitor, result);
            return result;
        } else {
            return visitNode(visitor, result) || result;
        }
    }
    if (result === undefined) {
        let keys = visitorKeys[node.type];
        for (let i = 0; i < keys.length; i++) {
            // we know if it has child keys we can widen to a ParentNode
            visitKey(visitor, handler, node, keys[i]);
        }
        if (exit !== undefined) {
            result = exit(node);
        }
    }
    return result;
}
function visitKey(visitor, handler, node, key) {
    let value = node[key];
    if (!value) {
        return;
    }
    let keyEnter;
    let keyExit;
    if (handler !== undefined) {
        let keyHandler = getKeyHandler(handler, key);
        if (keyHandler !== undefined) {
            keyEnter = getEnterFunction(keyHandler);
            keyExit = getExitFunction(keyHandler);
        }
    }
    if (keyEnter !== undefined) {
        if (keyEnter(node, key) !== undefined) {
            throw cannotReplaceOrRemoveInKeyHandlerYet(node, key);
        }
    }
    if (Array.isArray(value)) {
        visitArray(visitor, value);
    } else {
        let result = visitNode(visitor, value);
        if (result !== undefined) {
            assignKey(node, key, result);
        }
    }
    if (keyExit !== undefined) {
        if (keyExit(node, key) !== undefined) {
            throw cannotReplaceOrRemoveInKeyHandlerYet(node, key);
        }
    }
}
function visitArray(visitor, array) {
    for (let i = 0; i < array.length; i++) {
        let result = visitNode(visitor, array[i]);
        if (result !== undefined) {
            i += spliceArray(array, i, result) - 1;
        }
    }
}
function assignKey(node, key, result) {
    if (result === null) {
        throw cannotRemoveNode(node[key], node, key);
    } else if (Array.isArray(result)) {
        if (result.length === 1) {
            node[key] = result[0];
        } else {
            if (result.length === 0) {
                throw cannotRemoveNode(node[key], node, key);
            } else {
                throw cannotReplaceNode(node[key], node, key);
            }
        }
    } else {
        node[key] = result;
    }
}
function spliceArray(array, index, result) {
    if (result === null) {
        array.splice(index, 1);
        return 0;
    } else if (Array.isArray(result)) {
        array.splice(index, 1, ...result);
        return result.length;
    } else {
        array.splice(index, 1, result);
        return 1;
    }
}
function traverse(node, visitor) {
    visitNode(visitor, node);
}

const ATTR_VALUE_REGEX_TEST = /[\xA0"&]/;
const ATTR_VALUE_REGEX_REPLACE = new RegExp(ATTR_VALUE_REGEX_TEST.source, 'g');
const TEXT_REGEX_TEST = /[\xA0&<>]/;
const TEXT_REGEX_REPLACE = new RegExp(TEXT_REGEX_TEST.source, 'g');
function attrValueReplacer(char) {
    switch (char.charCodeAt(0)) {
        case 160 /* NBSP */:
            return '&nbsp;';
        case 34 /* QUOT */:
            return '&quot;';
        case 38 /* AMP */:
            return '&amp;';
        default:
            return char;
    }
}
function textReplacer(char) {
    switch (char.charCodeAt(0)) {
        case 160 /* NBSP */:
            return '&nbsp;';
        case 38 /* AMP */:
            return '&amp;';
        case 60 /* LT */:
            return '&lt;';
        case 62 /* GT */:
            return '&gt;';
        default:
            return char;
    }
}
function escapeAttrValue(attrValue) {
    if (ATTR_VALUE_REGEX_TEST.test(attrValue)) {
        return attrValue.replace(ATTR_VALUE_REGEX_REPLACE, attrValueReplacer);
    }
    return attrValue;
}
function escapeText(text) {
    if (TEXT_REGEX_TEST.test(text)) {
        return text.replace(TEXT_REGEX_REPLACE, textReplacer);
    }
    return text;
}

function unreachable() {
    throw new Error('unreachable');
}
function build(ast) {
    if (!ast) {
        return '';
    }
    const output = [];
    switch (ast.type) {
        case 'Program':
            {
                const chainBlock = ast['chained'] && ast.body[0];
                if (chainBlock) {
                    chainBlock['chained'] = true;
                }
                const body = buildEach(ast.body).join('');
                output.push(body);
            }
            break;
        case 'ElementNode':
            output.push('<', ast.tag);
            if (ast.attributes.length) {
                output.push(' ', buildEach(ast.attributes).join(' '));
            }
            if (ast.modifiers.length) {
                output.push(' ', buildEach(ast.modifiers).join(' '));
            }
            if (ast.comments.length) {
                output.push(' ', buildEach(ast.comments).join(' '));
            }
            if (ast.blockParams.length) {
                output.push(' ', 'as', ' ', `|${ast.blockParams.join(' ')}|`);
            }
            if (voidMap[ast.tag]) {
                if (ast.selfClosing) {
                    output.push(' /');
                }
                output.push('>');
            } else {
                output.push('>');
                output.push.apply(output, buildEach(ast.children));
                output.push('</', ast.tag, '>');
            }
            break;
        case 'AttrNode':
            if (ast.value.type === 'TextNode') {
                if (ast.value.chars !== '') {
                    output.push(ast.name, '=');
                    output.push('"', escapeAttrValue(ast.value.chars), '"');
                } else {
                    output.push(ast.name);
                }
            } else {
                output.push(ast.name, '=');
                // ast.value is mustache or concat
                output.push(build(ast.value));
            }
            break;
        case 'ConcatStatement':
            output.push('"');
            ast.parts.forEach(node => {
                if (node.type === 'TextNode') {
                    output.push(escapeAttrValue(node.chars));
                } else {
                    output.push(build(node));
                }
            });
            output.push('"');
            break;
        case 'TextNode':
            output.push(escapeText(ast.chars));
            break;
        case 'MustacheStatement':
            {
                output.push(compactJoin(['{{', pathParams(ast), '}}']));
            }
            break;
        case 'MustacheCommentStatement':
            {
                output.push(compactJoin(['{{!--', ast.value, '--}}']));
            }
            break;
        case 'ElementModifierStatement':
            {
                output.push(compactJoin(['{{', pathParams(ast), '}}']));
            }
            break;
        case 'PathExpression':
            output.push(ast.original);
            break;
        case 'SubExpression':
            {
                output.push('(', pathParams(ast), ')');
            }
            break;
        case 'BooleanLiteral':
            output.push(ast.value ? 'true' : 'false');
            break;
        case 'BlockStatement':
            {
                const lines = [];
                if (ast['chained']) {
                    lines.push(['{{else ', pathParams(ast), '}}'].join(''));
                } else {
                    lines.push(openBlock(ast));
                }
                lines.push(build(ast.program));
                if (ast.inverse) {
                    if (!ast.inverse['chained']) {
                        lines.push('{{else}}');
                    }
                    lines.push(build(ast.inverse));
                }
                if (!ast['chained']) {
                    lines.push(closeBlock(ast));
                }
                output.push(lines.join(''));
            }
            break;
        case 'PartialStatement':
            {
                output.push(compactJoin(['{{>', pathParams(ast), '}}']));
            }
            break;
        case 'CommentStatement':
            {
                output.push(compactJoin(['<!--', ast.value, '-->']));
            }
            break;
        case 'StringLiteral':
            {
                output.push(`"${ast.value}"`);
            }
            break;
        case 'NumberLiteral':
            {
                output.push(String(ast.value));
            }
            break;
        case 'UndefinedLiteral':
            {
                output.push('undefined');
            }
            break;
        case 'NullLiteral':
            {
                output.push('null');
            }
            break;
        case 'Hash':
            {
                output.push(ast.pairs.map(pair => {
                    return build(pair);
                }).join(' '));
            }
            break;
        case 'HashPair':
            {
                output.push(`${ast.key}=${build(ast.value)}`);
            }
            break;
    }
    return output.join('');
}
function compact(array) {
    const newArray = [];
    array.forEach(a => {
        if (typeof a !== 'undefined' && a !== null && a !== '') {
            newArray.push(a);
        }
    });
    return newArray;
}
function buildEach(asts) {
    return asts.map(build);
}
function pathParams(ast) {
    let path;
    switch (ast.type) {
        case 'MustacheStatement':
        case 'SubExpression':
        case 'ElementModifierStatement':
        case 'BlockStatement':
            if (isLiteral(ast.path)) {
                return String(ast.path.value);
            }
            path = build(ast.path);
            break;
        case 'PartialStatement':
            path = build(ast.name);
            break;
        default:
            return unreachable();
    }
    return compactJoin([path, buildEach(ast.params).join(' '), build(ast.hash)], ' ');
}
function compactJoin(array, delimiter) {
    return compact(array).join(delimiter || '');
}
function blockParams(block) {
    const params = block.program.blockParams;
    if (params.length) {
        return ` as |${params.join(' ')}|`;
    }
    return null;
}
function openBlock(block) {
    return ['{{#', pathParams(block), blockParams(block), '}}'].join('');
}
function closeBlock(block) {
    return ['{{/', build(block.path), '}}'].join('');
}

class Walker {
    constructor(order) {
        this.order = order;
        this.stack = [];
    }
    visit(node, callback) {
        if (!node) {
            return;
        }
        this.stack.push(node);
        if (this.order === 'post') {
            this.children(node, callback);
            callback(node, this);
        } else {
            callback(node, this);
            this.children(node, callback);
        }
        this.stack.pop();
    }
    children(node, callback) {
        let visitor = visitors[node.type];
        if (visitor) {
            visitor(this, node, callback);
        }
    }
}
let visitors = {
    Program(walker, node, callback) {
        for (let i = 0; i < node.body.length; i++) {
            walker.visit(node.body[i], callback);
        }
    },
    ElementNode(walker, node, callback) {
        for (let i = 0; i < node.children.length; i++) {
            walker.visit(node.children[i], callback);
        }
    },
    BlockStatement(walker, node, callback) {
        walker.visit(node.program, callback);
        walker.visit(node.inverse || null, callback);
    }
};

const voidMap = Object.create(null);
let voidTagNames = 'area base br col command embed hr img input keygen link meta param source track wbr';
voidTagNames.split(' ').forEach(tagName => {
    voidMap[tagName] = true;
});
class TokenizerEventHandlers extends HandlebarsNodeVisitors {
    constructor() {
        super(...arguments);
        this.tagOpenLine = 0;
        this.tagOpenColumn = 0;
    }
    reset() {
        this.currentNode = null;
    }
    // Comment
    beginComment() {
        this.currentNode = b.comment('');
        this.currentNode.loc = {
            source: null,
            start: b.pos(this.tagOpenLine, this.tagOpenColumn),
            end: null
        };
    }
    appendToCommentData(char) {
        this.currentComment.value += char;
    }
    finishComment() {
        this.currentComment.loc.end = b.pos(this.tokenizer.line, this.tokenizer.column);
        appendChild(this.currentElement(), this.currentComment);
    }
    // Data
    beginData() {
        this.currentNode = b.text();
        this.currentNode.loc = {
            source: null,
            start: b.pos(this.tokenizer.line, this.tokenizer.column),
            end: null
        };
    }
    appendToData(char) {
        this.currentData.chars += char;
    }
    finishData() {
        this.currentData.loc.end = b.pos(this.tokenizer.line, this.tokenizer.column);
        appendChild(this.currentElement(), this.currentData);
    }
    // Tags - basic
    tagOpen() {
        this.tagOpenLine = this.tokenizer.line;
        this.tagOpenColumn = this.tokenizer.column;
    }
    beginStartTag() {
        this.currentNode = {
            type: 'StartTag',
            name: '',
            attributes: [],
            modifiers: [],
            comments: [],
            selfClosing: false,
            loc: SYNTHETIC
        };
    }
    beginEndTag() {
        this.currentNode = {
            type: 'EndTag',
            name: '',
            attributes: [],
            modifiers: [],
            comments: [],
            selfClosing: false,
            loc: SYNTHETIC
        };
    }
    finishTag() {
        let { line, column } = this.tokenizer;
        let tag = this.currentTag;
        tag.loc = b.loc(this.tagOpenLine, this.tagOpenColumn, line, column);
        if (tag.type === 'StartTag') {
            this.finishStartTag();
            if (voidMap[tag.name] || tag.selfClosing) {
                this.finishEndTag(true);
            }
        } else if (tag.type === 'EndTag') {
            this.finishEndTag(false);
        }
    }
    finishStartTag() {
        let { name, attributes, modifiers, comments, selfClosing } = this.currentStartTag;
        let loc = b.loc(this.tagOpenLine, this.tagOpenColumn);
        let element = b.element({ name, selfClosing }, attributes, modifiers, [], comments, [], loc);
        this.elementStack.push(element);
    }
    finishEndTag(isVoid) {
        let tag = this.currentTag;
        let element = this.elementStack.pop();
        let parent = this.currentElement();
        validateEndTag(tag, element, isVoid);
        element.loc.end.line = this.tokenizer.line;
        element.loc.end.column = this.tokenizer.column;
        parseElementBlockParams(element);
        appendChild(parent, element);
    }
    markTagAsSelfClosing() {
        this.currentTag.selfClosing = true;
    }
    // Tags - name
    appendToTagName(char) {
        this.currentTag.name += char;
    }
    // Tags - attributes
    beginAttribute() {
        let tag = this.currentTag;
        if (tag.type === 'EndTag') {
            throw new SyntaxError(`Invalid end tag: closing tag must not have attributes, ` + `in \`${tag.name}\` (on line ${this.tokenizer.line}).`, tag.loc);
        }
        this.currentAttribute = {
            name: '',
            parts: [],
            isQuoted: false,
            isDynamic: false,
            start: b.pos(this.tokenizer.line, this.tokenizer.column),
            valueStartLine: 0,
            valueStartColumn: 0
        };
    }
    appendToAttributeName(char) {
        this.currentAttr.name += char;
    }
    beginAttributeValue(isQuoted) {
        this.currentAttr.isQuoted = isQuoted;
        this.currentAttr.valueStartLine = this.tokenizer.line;
        this.currentAttr.valueStartColumn = this.tokenizer.column;
    }
    appendToAttributeValue(char) {
        let parts = this.currentAttr.parts;
        let lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.type === 'TextNode') {
            lastPart.chars += char;
            // update end location for each added char
            lastPart.loc.end.line = this.tokenizer.line;
            lastPart.loc.end.column = this.tokenizer.column;
        } else {
            // initially assume the text node is a single char
            let loc = b.loc(this.tokenizer.line, this.tokenizer.column, this.tokenizer.line, this.tokenizer.column);
            // correct for `\n` as first char
            if (char === '\n') {
                loc.start.line -= 1;
                loc.start.column = lastPart ? lastPart.loc.end.column : this.currentAttr.valueStartColumn;
            }
            let text = b.text(char, loc);
            parts.push(text);
        }
    }
    finishAttributeValue() {
        let { name, parts, isQuoted, isDynamic, valueStartLine, valueStartColumn } = this.currentAttr;
        let value = assembleAttributeValue(parts, isQuoted, isDynamic, this.tokenizer.line);
        value.loc = b.loc(valueStartLine, valueStartColumn, this.tokenizer.line, this.tokenizer.column);
        let loc = b.loc(this.currentAttr.start.line, this.currentAttr.start.column, this.tokenizer.line, this.tokenizer.column);
        let attribute = b.attr(name, value, loc);
        this.currentStartTag.attributes.push(attribute);
    }
    reportSyntaxError(message) {
        throw new SyntaxError(`Syntax error at line ${this.tokenizer.line} col ${this.tokenizer.column}: ${message}`, b.loc(this.tokenizer.line, this.tokenizer.column));
    }
}
function assembleAttributeValue(parts, isQuoted, isDynamic, line) {
    if (isDynamic) {
        if (isQuoted) {
            return assembleConcatenatedValue(parts);
        } else {
            if (parts.length === 1 || parts.length === 2 && parts[1].type === 'TextNode' && parts[1].chars === '/') {
                return parts[0];
            } else {
                throw new SyntaxError(`An unquoted attribute value must be a string or a mustache, ` + `preceeded by whitespace or a '=' character, and ` + `followed by whitespace, a '>' character, or '/>' (on line ${line})`, b.loc(line, 0));
            }
        }
    } else {
        return parts.length > 0 ? parts[0] : b.text('');
    }
}
function assembleConcatenatedValue(parts) {
    for (let i = 0; i < parts.length; i++) {
        let part = parts[i];
        if (part.type !== 'MustacheStatement' && part.type !== 'TextNode') {
            throw new SyntaxError('Unsupported node in quoted attribute value: ' + part['type'], part.loc);
        }
    }
    return b.concat(parts);
}
function validateEndTag(tag, element, selfClosing) {
    let error;
    if (voidMap[tag.name] && !selfClosing) {
        // EngTag is also called by StartTag for void and self-closing tags (i.e.
        // <input> or <br />, so we need to check for that here. Otherwise, we would
        // throw an error for those cases.
        error = 'Invalid end tag ' + formatEndTagInfo(tag) + ' (void elements cannot have end tags).';
    } else if (element.tag === undefined) {
        error = 'Closing tag ' + formatEndTagInfo(tag) + ' without an open tag.';
    } else if (element.tag !== tag.name) {
        error = 'Closing tag ' + formatEndTagInfo(tag) + ' did not match last open tag `' + element.tag + '` (on line ' + element.loc.start.line + ').';
    }
    if (error) {
        throw new SyntaxError(error, element.loc);
    }
}
function formatEndTagInfo(tag) {
    return '`' + tag.name + '` (on line ' + tag.loc.end.line + ')';
}
const syntax = {
    parse: preprocess,
    builders: b,
    print: build,
    traverse,
    Walker
};
function preprocess(html, options) {
    const parseOptions = options ? options.parseOptions : {};
    let ast = typeof html === 'object' ? html : parse(html, parseOptions);
    let program = new TokenizerEventHandlers(html).acceptNode(ast);
    if (options && options.plugins && options.plugins.ast) {
        for (let i = 0, l = options.plugins.ast.length; i < l; i++) {
            let transform = options.plugins.ast[i];
            let env = assign({}, options, { syntax }, { plugins: undefined });
            let pluginResult = transform(env);
            traverse(program, pluginResult.visitor);
        }
    }
    return program;
}



var nodes = /*#__PURE__*/Object.freeze({

});

// used by ember-compiler

export { nodes as AST, preprocess, b as builders, TraversalError, cannotRemoveNode, cannotReplaceNode, cannotReplaceOrRemoveInKeyHandlerYet, traverse, Walker, build as print, SyntaxError, isLiteral, printLiteral };
