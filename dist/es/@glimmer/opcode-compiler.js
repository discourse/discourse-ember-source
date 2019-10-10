import { dict, EMPTY_ARRAY, unreachable, Stack, assign } from '@glimmer/util';
import { Register } from '@glimmer/vm';
import { Ops } from '@glimmer/wire-format';
import { InstructionEncoder } from '@glimmer/encoder';
import { Program, LazyConstants } from '@glimmer/program';

const PLACEHOLDER_HANDLE = -1;

var Ops$1;
(function (Ops$$1) {
    Ops$$1[Ops$$1["OpenComponentElement"] = 0] = "OpenComponentElement";
    Ops$$1[Ops$$1["DidCreateElement"] = 1] = "DidCreateElement";
    Ops$$1[Ops$$1["DidRenderLayout"] = 2] = "DidRenderLayout";
    Ops$$1[Ops$$1["Debugger"] = 3] = "Debugger";
})(Ops$1 || (Ops$1 = {}));

var Ops$2 = Ops;
const ATTRS_BLOCK = '&attrs';
class Compilers {
    constructor(offset = 0) {
        this.offset = offset;
        this.names = dict();
        this.funcs = [];
    }
    add(name, func) {
        this.funcs.push(func);
        this.names[name] = this.funcs.length - 1;
    }
    compile(sexp, builder) {
        let name = sexp[this.offset];
        let index = this.names[name];
        let func = this.funcs[index];

        func(sexp, builder);
    }
}
let _statementCompiler;
function statementCompiler() {
    if (_statementCompiler) {
        return _statementCompiler;
    }
    const STATEMENTS = _statementCompiler = new Compilers();
    STATEMENTS.add(Ops$2.Text, (sexp, builder) => {
        builder.text(sexp[1]);
    });
    STATEMENTS.add(Ops$2.Comment, (sexp, builder) => {
        builder.comment(sexp[1]);
    });
    STATEMENTS.add(Ops$2.CloseElement, (_sexp, builder) => {
        builder.closeElement();
    });
    STATEMENTS.add(Ops$2.FlushElement, (_sexp, builder) => {
        builder.flushElement();
    });
    STATEMENTS.add(Ops$2.Modifier, (sexp, builder) => {
        let { referrer } = builder;
        let [, name, params, hash] = sexp;
        let handle = builder.compiler.resolveModifier(name, referrer);
        if (handle !== null) {
            builder.modifier(handle, params, hash);
        } else {
            throw new Error(`Compile Error ${name} is not a modifier: Helpers may not be used in the element form.`);
        }
    });
    STATEMENTS.add(Ops$2.StaticAttr, (sexp, builder) => {
        let [, name, value, namespace] = sexp;
        builder.staticAttr(name, namespace, value);
    });
    STATEMENTS.add(Ops$2.DynamicAttr, (sexp, builder) => {
        dynamicAttr(sexp, false, builder);
    });
    STATEMENTS.add(Ops$2.ComponentAttr, (sexp, builder) => {
        componentAttr(sexp, false, builder);
    });
    STATEMENTS.add(Ops$2.TrustingAttr, (sexp, builder) => {
        dynamicAttr(sexp, true, builder);
    });
    STATEMENTS.add(Ops$2.TrustingComponentAttr, (sexp, builder) => {
        componentAttr(sexp, true, builder);
    });
    STATEMENTS.add(Ops$2.OpenElement, (sexp, builder) => {
        let [, tag, simple] = sexp;
        if (!simple) {
            builder.putComponentOperations();
        }
        builder.openPrimitiveElement(tag);
    });
    STATEMENTS.add(Ops$2.DynamicComponent, (sexp, builder) => {
        let [, definition, attrs, args, template] = sexp;
        let block = builder.template(template);
        let attrsBlock = null;
        if (attrs.length > 0) {
            attrsBlock = builder.inlineBlock({ statements: attrs, parameters: EMPTY_ARRAY });
        }
        builder.dynamicComponent(definition, attrsBlock, null, args, false, block, null);
    });
    STATEMENTS.add(Ops$2.Component, (sexp, builder) => {
        let [, tag, attrs, args, block] = sexp;
        let { referrer } = builder;
        let { handle, capabilities, compilable } = builder.compiler.resolveLayoutForTag(tag, referrer);
        if (handle !== null && capabilities !== null) {
            let attrsBlock = null;
            if (attrs.length > 0) {
                attrsBlock = builder.inlineBlock({ statements: attrs, parameters: EMPTY_ARRAY });
            }
            let child = builder.template(block);
            if (compilable) {
                builder.pushComponentDefinition(handle);
                builder.invokeStaticComponent(capabilities, compilable, attrsBlock, null, args, false, child && child);
            } else {
                builder.pushComponentDefinition(handle);
                builder.invokeComponent(capabilities, attrsBlock, null, args, false, child && child);
            }
        } else {
            throw new Error(`Compile Error: Cannot find component ${tag}`);
        }
    });
    STATEMENTS.add(Ops$2.Partial, (sexp, builder) => {
        let [, name, evalInfo] = sexp;
        let { referrer } = builder;
        builder.replayableIf({
            args() {
                builder.expr(name);
                builder.dup();
                return 2;
            },
            ifTrue() {
                builder.invokePartial(referrer, builder.evalSymbols(), evalInfo);
                builder.popScope();
                builder.popFrame(); // FIXME: WAT
            }
        });
    });
    STATEMENTS.add(Ops$2.Yield, (sexp, builder) => {
        let [, to, params] = sexp;
        builder.yield(to, params);
    });
    STATEMENTS.add(Ops$2.AttrSplat, (sexp, builder) => {
        let [, to] = sexp;
        builder.yield(to, []);
    });
    STATEMENTS.add(Ops$2.Debugger, (sexp, builder) => {
        let [, evalInfo] = sexp;
        builder.debugger(builder.evalSymbols(), evalInfo);
    });
    STATEMENTS.add(Ops$2.ClientSideStatement, (sexp, builder) => {
        CLIENT_SIDE.compile(sexp, builder);
    });
    STATEMENTS.add(Ops$2.Append, (sexp, builder) => {
        let [, value, trusting] = sexp;
        let returned = builder.compileInline(sexp) || value;
        if (returned === true) return;
        builder.guardedAppend(value, trusting);
    });
    STATEMENTS.add(Ops$2.Block, (sexp, builder) => {
        let [, name, params, hash, _template, _inverse] = sexp;
        let template = builder.template(_template);
        let inverse = builder.template(_inverse);
        let templateBlock = template && template;
        let inverseBlock = inverse && inverse;
        builder.compileBlock(name, params, hash, templateBlock, inverseBlock);
    });
    const CLIENT_SIDE = new Compilers(1);
    CLIENT_SIDE.add(Ops$1.OpenComponentElement, (sexp, builder) => {
        builder.putComponentOperations();
        builder.openPrimitiveElement(sexp[2]);
    });
    CLIENT_SIDE.add(Ops$1.DidCreateElement, (_sexp, builder) => {
        builder.didCreateElement(Register.s0);
    });
    CLIENT_SIDE.add(Ops$1.Debugger, () => {
        // tslint:disable-next-line:no-debugger
        debugger;
    });
    CLIENT_SIDE.add(Ops$1.DidRenderLayout, (_sexp, builder) => {
        builder.didRenderLayout(Register.s0);
    });
    return STATEMENTS;
}
function componentAttr(sexp, trusting, builder) {
    let [, name, value, namespace] = sexp;
    builder.expr(value);
    if (namespace) {
        builder.componentAttr(name, namespace, trusting);
    } else {
        builder.componentAttr(name, null, trusting);
    }
}
function dynamicAttr(sexp, trusting, builder) {
    let [, name, value, namespace] = sexp;
    builder.expr(value);
    if (namespace) {
        builder.dynamicAttr(name, namespace, trusting);
    } else {
        builder.dynamicAttr(name, null, trusting);
    }
}
let _expressionCompiler;
function expressionCompiler() {
    if (_expressionCompiler) {
        return _expressionCompiler;
    }
    const EXPRESSIONS = _expressionCompiler = new Compilers();
    EXPRESSIONS.add(Ops$2.Unknown, (sexp, builder) => {
        let { compiler, referrer, containingLayout: { asPartial } } = builder;
        let name = sexp[1];
        let handle = compiler.resolveHelper(name, referrer);
        if (handle !== null) {
            builder.helper(handle, null, null);
        } else if (asPartial) {
            builder.resolveMaybeLocal(name);
        } else {
            builder.getVariable(0);
            builder.getProperty(name);
        }
    });
    EXPRESSIONS.add(Ops$2.Concat, (sexp, builder) => {
        let parts = sexp[1];
        for (let i = 0; i < parts.length; i++) {
            builder.expr(parts[i]);
        }
        builder.concat(parts.length);
    });
    EXPRESSIONS.add(Ops$2.Helper, (sexp, builder) => {
        let { compiler, referrer } = builder;
        let [, name, params, hash] = sexp;
        // TODO: triage this in the WF compiler
        if (name === 'component') {

            let [definition, ...restArgs] = params;
            builder.curryComponent(definition, restArgs, hash, true);
            return;
        }
        let handle = compiler.resolveHelper(name, referrer);
        if (handle !== null) {
            builder.helper(handle, params, hash);
        } else {
            throw new Error(`Compile Error: ${name} is not a helper`);
        }
    });
    EXPRESSIONS.add(Ops$2.Get, (sexp, builder) => {
        let [, head, path] = sexp;
        builder.getVariable(head);
        for (let i = 0; i < path.length; i++) {
            builder.getProperty(path[i]);
        }
    });
    EXPRESSIONS.add(Ops$2.MaybeLocal, (sexp, builder) => {
        let [, path] = sexp;
        if (builder.containingLayout.asPartial) {
            let head = path[0];
            path = path.slice(1);
            builder.resolveMaybeLocal(head);
        } else {
            builder.getVariable(0);
        }
        for (let i = 0; i < path.length; i++) {
            builder.getProperty(path[i]);
        }
    });
    EXPRESSIONS.add(Ops$2.Undefined, (_sexp, builder) => {
        return builder.pushPrimitiveReference(undefined);
    });
    EXPRESSIONS.add(Ops$2.HasBlock, (sexp, builder) => {
        builder.hasBlock(sexp[1]);
    });
    EXPRESSIONS.add(Ops$2.HasBlockParams, (sexp, builder) => {
        builder.hasBlockParams(sexp[1]);
    });
    return EXPRESSIONS;
}
class Macros {
    constructor() {
        let { blocks, inlines } = populateBuiltins();
        this.blocks = blocks;
        this.inlines = inlines;
    }
}
class Blocks {
    constructor() {
        this.names = dict();
        this.funcs = [];
    }
    add(name, func) {
        this.funcs.push(func);
        this.names[name] = this.funcs.length - 1;
    }
    addMissing(func) {
        this.missing = func;
    }
    compile(name, params, hash, template, inverse, builder) {
        let index = this.names[name];
        if (index === undefined) {

            let func = this.missing;
            let handled = func(name, params, hash, template, inverse, builder);
        } else {
            let func = this.funcs[index];
            func(params, hash, template, inverse, builder);
        }
    }
}
class Inlines {
    constructor() {
        this.names = dict();
        this.funcs = [];
    }
    add(name, func) {
        this.funcs.push(func);
        this.names[name] = this.funcs.length - 1;
    }
    addMissing(func) {
        this.missing = func;
    }
    compile(sexp, builder) {
        let value = sexp[1];
        // TODO: Fix this so that expression macros can return
        // things like components, so that {{component foo}}
        // is the same as {{(component foo)}}
        if (!Array.isArray(value)) return ['expr', value];
        let name;
        let params;
        let hash;
        if (value[0] === Ops$2.Helper) {
            name = value[1];
            params = value[2];
            hash = value[3];
        } else if (value[0] === Ops$2.Unknown) {
            name = value[1];
            params = hash = null;
        } else {
            return ['expr', value];
        }
        let index = this.names[name];
        if (index === undefined && this.missing) {
            let func = this.missing;
            let returned = func(name, params, hash, builder);
            return returned === false ? ['expr', value] : returned;
        } else if (index !== undefined) {
            let func = this.funcs[index];
            let returned = func(name, params, hash, builder);
            return returned === false ? ['expr', value] : returned;
        } else {
            return ['expr', value];
        }
    }
}
function populateBuiltins(blocks = new Blocks(), inlines = new Inlines()) {
    blocks.add('if', (params, _hash, template, inverse, builder) => {
        //        PutArgs
        //        Test(Environment)
        //        Enter(BEGIN, END)
        // BEGIN: Noop
        //        JumpUnless(ELSE)
        //        Evaluate(default)
        //        Jump(END)
        // ELSE:  Noop
        //        Evalulate(inverse)
        // END:   Noop
        //        Exit
        if (!params || params.length !== 1) {
            throw new Error(`SYNTAX ERROR: #if requires a single argument`);
        }
        builder.replayableIf({
            args() {
                builder.expr(params[0]);
                builder.toBoolean();
                return 1;
            },
            ifTrue() {
                builder.invokeStaticBlock(template);
            },
            ifFalse() {
                if (inverse) {
                    builder.invokeStaticBlock(inverse);
                }
            }
        });
    });
    blocks.add('unless', (params, _hash, template, inverse, builder) => {
        //        PutArgs
        //        Test(Environment)
        //        Enter(BEGIN, END)
        // BEGIN: Noop
        //        JumpUnless(ELSE)
        //        Evaluate(default)
        //        Jump(END)
        // ELSE:  Noop
        //        Evalulate(inverse)
        // END:   Noop
        //        Exit
        if (!params || params.length !== 1) {
            throw new Error(`SYNTAX ERROR: #unless requires a single argument`);
        }
        builder.replayableIf({
            args() {
                builder.expr(params[0]);
                builder.toBoolean();
                return 1;
            },
            ifTrue() {
                if (inverse) {
                    builder.invokeStaticBlock(inverse);
                }
            },
            ifFalse() {
                builder.invokeStaticBlock(template);
            }
        });
    });
    blocks.add('with', (params, _hash, template, inverse, builder) => {
        //        PutArgs
        //        Test(Environment)
        //        Enter(BEGIN, END)
        // BEGIN: Noop
        //        JumpUnless(ELSE)
        //        Evaluate(default)
        //        Jump(END)
        // ELSE:  Noop
        //        Evalulate(inverse)
        // END:   Noop
        //        Exit
        if (!params || params.length !== 1) {
            throw new Error(`SYNTAX ERROR: #with requires a single argument`);
        }
        builder.replayableIf({
            args() {
                builder.expr(params[0]);
                builder.dup();
                builder.toBoolean();
                return 2;
            },
            ifTrue() {
                builder.invokeStaticBlock(template, 1);
            },
            ifFalse() {
                if (inverse) {
                    builder.invokeStaticBlock(inverse);
                }
            }
        });
    });
    blocks.add('each', (params, hash, template, inverse, builder) => {
        //         Enter(BEGIN, END)
        // BEGIN:  Noop
        //         PutArgs
        //         PutIterable
        //         JumpUnless(ELSE)
        //         EnterList(BEGIN2, END2)
        // ITER:   Noop
        //         NextIter(BREAK)
        // BEGIN2: Noop
        //         PushChildScope
        //         Evaluate(default)
        //         PopScope
        // END2:   Noop
        //         Exit
        //         Jump(ITER)
        // BREAK:  Noop
        //         ExitList
        //         Jump(END)
        // ELSE:   Noop
        //         Evalulate(inverse)
        // END:    Noop
        //         Exit
        builder.replayable({
            args() {
                if (hash && hash[0][0] === 'key') {
                    builder.expr(hash[1][0]);
                } else {
                    builder.pushPrimitiveReference(null);
                }
                builder.expr(params[0]);
                return 2;
            },
            body() {
                builder.putIterator();
                builder.jumpUnless('ELSE');
                builder.pushFrame();
                builder.dup(Register.fp, 1);
                builder.returnTo('ITER');
                builder.enterList('BODY');
                builder.label('ITER');
                builder.iterate('BREAK');
                builder.label('BODY');
                builder.invokeStaticBlock(template, 2);
                builder.pop(2);
                builder.jump('FINALLY');
                builder.label('BREAK');
                builder.exitList();
                builder.popFrame();
                builder.jump('FINALLY');
                builder.label('ELSE');
                if (inverse) {
                    builder.invokeStaticBlock(inverse);
                }
            }
        });
    });
    blocks.add('in-element', (params, hash, template, _inverse, builder) => {
        if (!params || params.length !== 1) {
            throw new Error(`SYNTAX ERROR: #in-element requires a single argument`);
        }
        builder.replayableIf({
            args() {
                let [keys, values] = hash;
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    if (key === 'nextSibling' || key === 'guid') {
                        builder.expr(values[i]);
                    } else {
                        throw new Error(`SYNTAX ERROR: #in-element does not take a \`${keys[0]}\` option`);
                    }
                }
                builder.expr(params[0]);
                builder.dup();
                return 4;
            },
            ifTrue() {
                builder.pushRemoteElement();
                builder.invokeStaticBlock(template);
                builder.popRemoteElement();
            }
        });
    });
    blocks.add('-with-dynamic-vars', (_params, hash, template, _inverse, builder) => {
        if (hash) {
            let [names, expressions] = hash;
            builder.compileParams(expressions);
            builder.pushDynamicScope();
            builder.bindDynamicScope(names);
            builder.invokeStaticBlock(template);
            builder.popDynamicScope();
        } else {
            builder.invokeStaticBlock(template);
        }
    });
    blocks.add('component', (_params, hash, template, inverse, builder) => {

        let tag = _params[0];
        if (typeof tag === 'string') {
            let returned = builder.staticComponentHelper(_params[0], hash, template);
            if (returned) return;
        }
        let [definition, ...params] = _params;
        builder.dynamicComponent(definition, null, params, hash, true, template, inverse);
    });
    inlines.add('component', (_name, _params, hash, builder) => {

        let tag = _params && _params[0];
        if (typeof tag === 'string') {
            let returned = builder.staticComponentHelper(tag, hash, null);
            if (returned) return true;
        }
        let [definition, ...params] = _params;
        builder.dynamicComponent(definition, null, params, hash, true, null, null);
        return true;
    });
    return { blocks, inlines };
}

const PLACEHOLDER_HANDLE$1 = -1;
class CompilableProgram {
    constructor(compiler, layout) {
        this.compiler = compiler;
        this.layout = layout;
        this.compiled = null;
    }
    get symbolTable() {
        return this.layout.block;
    }
    compile() {
        if (this.compiled !== null) return this.compiled;
        this.compiled = PLACEHOLDER_HANDLE$1;
        let { block: { statements } } = this.layout;
        return this.compiled = this.compiler.add(statements, this.layout);
    }
}
class CompilableBlock {
    constructor(compiler, parsed) {
        this.compiler = compiler;
        this.parsed = parsed;
        this.compiled = null;
    }
    get symbolTable() {
        return this.parsed.block;
    }
    compile() {
        if (this.compiled !== null) return this.compiled;
        // Track that compilation has started but not yet finished by temporarily
        // using a placeholder handle. In eager compilation mode, where compile()
        // may be called recursively, we use this as a signal that the handle cannot
        // be known synchronously and must be linked lazily.
        this.compiled = PLACEHOLDER_HANDLE$1;
        let { block: { statements }, containingLayout } = this.parsed;
        return this.compiled = this.compiler.add(statements, containingLayout);
    }
}

function compile(statements, builder, compiler) {
    let sCompiler = statementCompiler();
    for (let i = 0; i < statements.length; i++) {
        sCompiler.compile(statements[i], builder);
    }
    let handle = builder.commit();
    return handle;
}

function debugSlice(program, start, end) {
}
function logOpcode(type, params) {
    let out = type;
    if (params) {
        let args = Object.keys(params).map(p => ` ${p}=${json(params[p])}`).join('');
        out += args;
    }
    return `(${out})`;
}
function json(param) {
}
function debug(pos, c, op, ...operands) {
    let metadata = null;
    if (!metadata) {
        throw unreachable(`Missing Opcode Metadata for ${op}`);
    }
    let out = dict();
    metadata.ops.forEach((operand, index) => {
        let op = operands[index];
        switch (operand.type) {
            case 'to':
                out[operand.name] = pos + op;
                break;
            case 'i32':
            case 'symbol':
            case 'block':
                out[operand.name] = op;
                break;
            case 'handle':
                out[operand.name] = c.resolveHandle(op);
                break;
            case 'str':
                out[operand.name] = c.getString(op);
                break;
            case 'option-str':
                out[operand.name] = op ? c.getString(op) : null;
                break;
            case 'str-array':
                out[operand.name] = c.getStringArray(op);
                break;
            case 'array':
                out[operand.name] = c.getArray(op);
                break;
            case 'bool':
                out[operand.name] = !!op;
                break;
            case 'primitive':
                out[operand.name] = decodePrimitive(op, c);
                break;
            case 'register':
                out[operand.name] = Register[op];
                break;
            case 'serializable':
                out[operand.name] = c.getSerializable(op);
                break;
            case 'lazy-constant':
                out[operand.name] = c.getOther(op);
                break;
        }
    });
    return [metadata.name, out];
}
function decodePrimitive(primitive, constants) {
    let flag = primitive & 7; // 111
    let value = primitive >> 3;
    switch (flag) {
        case 0 /* NUMBER */:
            return value;
        case 1 /* FLOAT */:
            return constants.getNumber(value);
        case 2 /* STRING */:
            return constants.getString(value);
        case 3 /* BOOLEAN_OR_VOID */:
            switch (value) {
                case 0:
                    return false;
                case 1:
                    return true;
                case 2:
                    return null;
                case 3:
                    return undefined;
            }
        case 4 /* NEGATIVE */:
        case 5 /* BIG_NUM */:
            return constants.getNumber(value);
        default:
            throw unreachable();
    }
}

class StdLib {
    constructor(main, trustingGuardedAppend, cautiousGuardedAppend) {
        this.main = main;
        this.trustingGuardedAppend = trustingGuardedAppend;
        this.cautiousGuardedAppend = cautiousGuardedAppend;
    }
    static compile(compiler) {
        let main = this.std(compiler, b => b.main());
        let trustingGuardedAppend = this.std(compiler, b => b.stdAppend(true));
        let cautiousGuardedAppend = this.std(compiler, b => b.stdAppend(false));
        return new StdLib(main, trustingGuardedAppend, cautiousGuardedAppend);
    }
    static std(compiler, callback) {
        return StdOpcodeBuilder.build(compiler, callback);
    }
    getAppend(trusting) {
        return trusting ? this.trustingGuardedAppend : this.cautiousGuardedAppend;
    }
}
class AbstractCompiler {
    constructor(macros, program, resolver) {
        this.macros = macros;
        this.program = program;
        this.resolver = resolver;
        this.initialize();
    }
    initialize() {
        this.stdLib = StdLib.compile(this);
    }
    get constants() {
        return this.program.constants;
    }
    compileInline(sexp, builder) {
        let { inlines } = this.macros;
        return inlines.compile(sexp, builder);
    }
    compileBlock(name, params, hash, template, inverse, builder) {
        let { blocks } = this.macros;
        blocks.compile(name, params, hash, template, inverse, builder);
    }
    add(statements, containingLayout) {
        return compile(statements, this.builderFor(containingLayout), this);
    }
    commit(scopeSize, buffer) {
        let heap = this.program.heap;
        // TODO: change the whole malloc API and do something more efficient
        let handle = heap.malloc();
        for (let i = 0; i < buffer.length; i++) {
            let value = buffer[i];
            if (typeof value === 'function') {
                heap.pushPlaceholder(value);
            } else {
                heap.push(value);
            }
        }
        heap.finishMalloc(handle, scopeSize);
        return handle;
    }
    resolveLayoutForTag(tag, referrer) {
        let { resolver } = this;
        let handle = resolver.lookupComponentDefinition(tag, referrer);
        if (handle === null) return { handle: null, capabilities: null, compilable: null };
        return this.resolveLayoutForHandle(handle);
    }
    resolveLayoutForHandle(handle) {
        let { resolver } = this;
        let capabilities = resolver.getCapabilities(handle);
        let compilable = null;
        if (!capabilities.dynamicLayout) {
            compilable = resolver.getLayout(handle);
        }
        return {
            handle,
            capabilities,
            compilable
        };
    }
    resolveModifier(name, referrer) {
        return this.resolver.lookupModifier(name, referrer);
    }
    resolveHelper(name, referrer) {
        return this.resolver.lookupHelper(name, referrer);
    }
}
let debugCompiler;

class WrappedBuilder {
    constructor(compiler, layout) {
        this.compiler = compiler;
        this.layout = layout;
        this.compiled = null;
        let { block } = layout;
        let symbols = block.symbols.slice();
        // ensure ATTRS_BLOCK is always included (only once) in the list of symbols
        let attrsBlockIndex = symbols.indexOf(ATTRS_BLOCK);
        if (attrsBlockIndex === -1) {
            this.attrsBlockNumber = symbols.push(ATTRS_BLOCK);
        } else {
            this.attrsBlockNumber = attrsBlockIndex + 1;
        }
        this.symbolTable = {
            hasEval: block.hasEval,
            symbols
        };
    }
    compile() {
        if (this.compiled !== null) return this.compiled;
        //========DYNAMIC
        //        PutValue(TagExpr)
        //        Test
        //        JumpUnless(BODY)
        //        PutComponentOperations
        //        OpenDynamicPrimitiveElement
        //        DidCreateElement
        //        ...attr statements...
        //        FlushElement
        // BODY:  Noop
        //        ...body statements...
        //        PutValue(TagExpr)
        //        Test
        //        JumpUnless(END)
        //        CloseElement
        // END:   Noop
        //        DidRenderLayout
        //        Exit
        //
        //========STATIC
        //        OpenPrimitiveElementOpcode
        //        DidCreateElement
        //        ...attr statements...
        //        FlushElement
        //        ...body statements...
        //        CloseElement
        //        DidRenderLayout
        //        Exit
        let { compiler, layout } = this;
        let b = compiler.builderFor(layout);
        b.startLabels();
        b.fetch(Register.s1);
        b.getComponentTagName(Register.s0);
        b.primitiveReference();
        b.dup();
        b.load(Register.s1);
        b.jumpUnless('BODY');
        b.fetch(Register.s1);
        b.putComponentOperations();
        b.openDynamicElement();
        b.didCreateElement(Register.s0);
        b.yield(this.attrsBlockNumber, []);
        b.flushElement();
        b.label('BODY');
        b.invokeStaticBlock(blockFor(layout, compiler));
        b.fetch(Register.s1);
        b.jumpUnless('END');
        b.closeElement();
        b.label('END');
        b.load(Register.s1);
        b.stopLabels();
        let handle = b.commit();
        return this.compiled = handle;
    }
}
function blockFor(layout, compiler) {
    return new CompilableBlock(compiler, {
        block: {
            statements: layout.block.statements,
            parameters: EMPTY_ARRAY
        },
        containingLayout: layout
    });
}
class ComponentBuilder {
    constructor(builder) {
        this.builder = builder;
    }
    static(handle, args) {
        let [params, hash, _default, inverse] = args;
        let { builder } = this;
        if (handle !== null) {
            let { capabilities, compilable } = builder.compiler.resolveLayoutForHandle(handle);
            if (compilable) {
                builder.pushComponentDefinition(handle);
                builder.invokeStaticComponent(capabilities, compilable, null, params, hash, false, _default, inverse);
            } else {
                builder.pushComponentDefinition(handle);
                builder.invokeComponent(capabilities, null, params, hash, false, _default, inverse);
            }
        }
    }
}

class Labels {
    constructor() {
        this.labels = dict();
        this.targets = [];
    }
    label(name, index) {
        this.labels[name] = index;
    }
    target(at, target) {
        this.targets.push({ at, target });
    }
    patch(encoder) {
        let { targets, labels } = this;
        for (let i = 0; i < targets.length; i++) {
            let { at, target } = targets[i];
            let address = labels[target] - at;
            encoder.patch(at, address);
        }
    }
}
class StdOpcodeBuilder {
    constructor(compiler, size = 0) {
        this.size = size;
        this.encoder = new InstructionEncoder([]);
        this.labelsStack = new Stack();
        this.compiler = compiler;
    }
    static build(compiler, callback) {
        let builder = new StdOpcodeBuilder(compiler);
        callback(builder);
        return builder.commit();
    }
    push(name) {
        switch (arguments.length) {
            case 1:
                return this.encoder.encode(name, 0);
            case 2:
                return this.encoder.encode(name, 0, arguments[1]);
            case 3:
                return this.encoder.encode(name, 0, arguments[1], arguments[2]);
            default:
                return this.encoder.encode(name, 0, arguments[1], arguments[2], arguments[3]);
        }
    }
    pushMachine(name) {
        switch (arguments.length) {
            case 1:
                return this.encoder.encode(name, 1024 /* MACHINE_MASK */);
            case 2:
                return this.encoder.encode(name, 1024 /* MACHINE_MASK */, arguments[1]);
            case 3:
                return this.encoder.encode(name, 1024 /* MACHINE_MASK */, arguments[1], arguments[2]);
            default:
                return this.encoder.encode(name, 1024 /* MACHINE_MASK */, arguments[1], arguments[2], arguments[3]);
        }
    }
    commit() {
        this.pushMachine(24 /* Return */);
        return this.compiler.commit(this.size, this.encoder.buffer);
    }
    reserve(name) {
        this.encoder.encode(name, 0, -1);
    }
    reserveWithOperand(name, operand) {
        this.encoder.encode(name, 0, -1, operand);
    }
    reserveMachine(name) {
        this.encoder.encode(name, 1024 /* MACHINE_MASK */, -1);
    }
    ///
    main() {
        this.push(68 /* Main */, Register.s0);
        this.invokePreparedComponent(false, false, true);
    }
    appendHTML() {
        this.push(28 /* AppendHTML */);
    }
    appendSafeHTML() {
        this.push(29 /* AppendSafeHTML */);
    }
    appendDocumentFragment() {
        this.push(30 /* AppendDocumentFragment */);
    }
    appendNode() {
        this.push(31 /* AppendNode */);
    }
    appendText() {
        this.push(32 /* AppendText */);
    }
    beginComponentTransaction() {
        this.push(91 /* BeginComponentTransaction */);
    }
    commitComponentTransaction() {
        this.push(92 /* CommitComponentTransaction */);
    }
    pushDynamicScope() {
        this.push(44 /* PushDynamicScope */);
    }
    popDynamicScope() {
        this.push(45 /* PopDynamicScope */);
    }
    pushRemoteElement() {
        this.push(41 /* PushRemoteElement */);
    }
    popRemoteElement() {
        this.push(42 /* PopRemoteElement */);
    }
    pushRootScope(symbols, bindCallerScope) {
        this.push(20 /* RootScope */, symbols, bindCallerScope ? 1 : 0);
    }
    pushVirtualRootScope(register) {
        this.push(21 /* VirtualRootScope */, register);
    }
    pushChildScope() {
        this.push(22 /* ChildScope */);
    }
    popScope() {
        this.push(23 /* PopScope */);
    }
    prepareArgs(state) {
        this.push(79 /* PrepareArgs */, state);
    }
    createComponent(state, hasDefault) {
        let flag = hasDefault | 0;
        this.push(81 /* CreateComponent */, flag, state);
    }
    registerComponentDestructor(state) {
        this.push(82 /* RegisterComponentDestructor */, state);
    }
    putComponentOperations() {
        this.push(83 /* PutComponentOperations */);
    }
    getComponentSelf(state) {
        this.push(84 /* GetComponentSelf */, state);
    }
    getComponentTagName(state) {
        this.push(85 /* GetComponentTagName */, state);
    }
    getComponentLayout(state) {
        this.push(86 /* GetComponentLayout */, state);
    }
    setupForEval(state) {
        this.push(87 /* SetupForEval */, state);
    }
    invokeComponentLayout(state) {
        this.push(90 /* InvokeComponentLayout */, state);
    }
    didCreateElement(state) {
        this.push(93 /* DidCreateElement */, state);
    }
    didRenderLayout(state) {
        this.push(94 /* DidRenderLayout */, state);
    }
    pushFrame() {
        this.pushMachine(57 /* PushFrame */);
    }
    popFrame() {
        this.pushMachine(58 /* PopFrame */);
    }
    pushSmallFrame() {
        this.pushMachine(59 /* PushSmallFrame */);
    }
    popSmallFrame() {
        this.pushMachine(60 /* PopSmallFrame */);
    }
    invokeVirtual() {
        this.pushMachine(49 /* InvokeVirtual */);
    }
    invokeYield() {
        this.push(51 /* InvokeYield */);
    }
    toBoolean() {
        this.push(63 /* ToBoolean */);
    }
    invokePreparedComponent(hasBlock, bindableBlocks, bindableAtNames, populateLayout = null) {
        this.beginComponentTransaction();
        this.pushDynamicScope();
        this.createComponent(Register.s0, hasBlock);
        // this has to run after createComponent to allow
        // for late-bound layouts, but a caller is free
        // to populate the layout earlier if it wants to
        // and do nothing here.
        if (populateLayout) populateLayout();
        this.registerComponentDestructor(Register.s0);
        this.getComponentSelf(Register.s0);
        this.pushVirtualRootScope(Register.s0);
        this.setVariable(0);
        this.setupForEval(Register.s0);
        if (bindableAtNames) this.setNamedVariables(Register.s0);
        if (bindableBlocks) this.setBlocks(Register.s0);
        this.pop();
        this.invokeComponentLayout(Register.s0);
        this.didRenderLayout(Register.s0);
        this.popFrame();
        this.popScope();
        this.popDynamicScope();
        this.commitComponentTransaction();
    }
    get pos() {
        return this.encoder.typePos;
    }
    get nextPos() {
        return this.encoder.size;
    }
    ///
    compileInline(sexp) {
        return this.compiler.compileInline(sexp, this);
    }
    compileBlock(name, params, hash, template, inverse) {
        this.compiler.compileBlock(name, params, hash, template, inverse, this);
    }
    label(name) {
        this.labels.label(name, this.nextPos);
    }
    // helpers
    get labels() {
        return this.labelsStack.current;
    }
    startLabels() {
        this.labelsStack.push(new Labels());
    }
    stopLabels() {
        let label = this.labelsStack.pop();
        label.patch(this.encoder);
    }
    // components
    pushCurriedComponent() {
        this.push(74 /* PushCurriedComponent */);
    }
    pushDynamicComponentInstance() {
        this.push(73 /* PushDynamicComponentInstance */);
    }
    // dom
    openDynamicElement() {
        this.push(34 /* OpenDynamicElement */);
    }
    flushElement() {
        this.push(38 /* FlushElement */);
    }
    closeElement() {
        this.push(39 /* CloseElement */);
    }
    // lists
    putIterator() {
        this.push(66 /* PutIterator */);
    }
    enterList(start) {
        this.reserve(64 /* EnterList */);
        this.labels.target(this.pos, start);
    }
    exitList() {
        this.push(65 /* ExitList */);
    }
    iterate(breaks) {
        this.reserve(67 /* Iterate */);
        this.labels.target(this.pos, breaks);
    }
    // expressions
    setNamedVariables(state) {
        this.push(2 /* SetNamedVariables */, state);
    }
    setBlocks(state) {
        this.push(3 /* SetBlocks */, state);
    }
    setVariable(symbol) {
        this.push(4 /* SetVariable */, symbol);
    }
    setBlock(symbol) {
        this.push(5 /* SetBlock */, symbol);
    }
    getVariable(symbol) {
        this.push(6 /* GetVariable */, symbol);
    }
    getBlock(symbol) {
        this.push(8 /* GetBlock */, symbol);
    }
    hasBlock(symbol) {
        this.push(9 /* HasBlock */, symbol);
    }
    concat(size) {
        this.push(11 /* Concat */, size);
    }
    load(register) {
        this.push(18 /* Load */, register);
    }
    fetch(register) {
        this.push(19 /* Fetch */, register);
    }
    dup(register = Register.sp, offset = 0) {
        return this.push(16 /* Dup */, register, offset);
    }
    pop(count = 1) {
        return this.push(17 /* Pop */, count);
    }
    // vm
    returnTo(label) {
        this.reserveMachine(25 /* ReturnTo */);
        this.labels.target(this.pos, label);
    }
    primitiveReference() {
        this.push(14 /* PrimitiveReference */);
    }
    reifyU32() {
        this.push(15 /* ReifyU32 */);
    }
    enter(args) {
        this.push(61 /* Enter */, args);
    }
    exit() {
        this.push(62 /* Exit */);
    }
    return() {
        this.pushMachine(24 /* Return */);
    }
    jump(target) {
        this.reserveMachine(52 /* Jump */);
        this.labels.target(this.pos, target);
    }
    jumpIf(target) {
        this.reserve(53 /* JumpIf */);
        this.labels.target(this.pos, target);
    }
    jumpUnless(target) {
        this.reserve(54 /* JumpUnless */);
        this.labels.target(this.pos, target);
    }
    jumpEq(value, target) {
        this.reserveWithOperand(55 /* JumpEq */, value);
        this.labels.target(this.pos, target);
    }
    assertSame() {
        this.push(56 /* AssertSame */);
    }
    pushEmptyArgs() {
        this.push(77 /* PushEmptyArgs */);
    }
    switch(_opcode, callback) {
        // Setup the switch DSL
        let clauses = [];
        let count = 0;
        function when(match, callback) {
            clauses.push({ match, callback, label: `CLAUSE${count++}` });
        }
        // Call the callback
        callback(when);
        // Emit the opcodes for the switch
        this.enter(2);
        this.assertSame();
        this.reifyU32();
        this.startLabels();
        // First, emit the jump opcodes. We don't need a jump for the last
        // opcode, since it bleeds directly into its clause.
        clauses.slice(0, -1).forEach(clause => this.jumpEq(clause.match, clause.label));
        // Enumerate the clauses in reverse order. Earlier matches will
        // require fewer checks.
        for (let i = clauses.length - 1; i >= 0; i--) {
            let clause = clauses[i];
            this.label(clause.label);
            this.pop(2);
            clause.callback();
            // The first match is special: it is placed directly before the END
            // label, so no additional jump is needed at the end of it.
            if (i !== 0) {
                this.jump('END');
            }
        }
        this.label('END');
        this.stopLabels();
        this.exit();
    }
    stdAppend(trusting) {
        this.switch(this.contentType(), when => {
            when(1 /* String */, () => {
                if (trusting) {
                    this.assertSame();
                    this.appendHTML();
                } else {
                    this.appendText();
                }
            });
            when(0 /* Component */, () => {
                this.pushCurriedComponent();
                this.pushDynamicComponentInstance();
                this.invokeBareComponent();
            });
            when(3 /* SafeString */, () => {
                this.assertSame();
                this.appendSafeHTML();
            });
            when(4 /* Fragment */, () => {
                this.assertSame();
                this.appendDocumentFragment();
            });
            when(5 /* Node */, () => {
                this.assertSame();
                this.appendNode();
            });
        });
    }
    populateLayout(state) {
        this.push(89 /* PopulateLayout */, state);
    }
    invokeBareComponent() {
        this.fetch(Register.s0);
        this.dup(Register.sp, 1);
        this.load(Register.s0);
        this.pushFrame();
        this.pushEmptyArgs();
        this.prepareArgs(Register.s0);
        this.invokePreparedComponent(false, false, true, () => {
            this.getComponentLayout(Register.s0);
            this.populateLayout(Register.s0);
        });
        this.load(Register.s0);
    }
    isComponent() {
        this.push(69 /* IsComponent */);
    }
    contentType() {
        this.push(70 /* ContentType */);
    }
    pushBlockScope() {
        this.push(47 /* PushBlockScope */);
    }
}
class OpcodeBuilder extends StdOpcodeBuilder {
    constructor(compiler, containingLayout) {
        super(compiler, containingLayout ? containingLayout.block.symbols.length : 0);
        this.containingLayout = containingLayout;
        this.component = new ComponentBuilder(this);
        this.expressionCompiler = expressionCompiler();
        this.constants = compiler.constants;
        this.stdLib = compiler.stdLib;
    }
    /// MECHANICS
    get referrer() {
        return this.containingLayout && this.containingLayout.referrer;
    }
    expr(expression) {
        if (Array.isArray(expression)) {
            this.expressionCompiler.compile(expression, this);
        } else {
            this.pushPrimitiveReference(expression);
        }
    }
    ///
    // args
    pushArgs(names, flags) {
        let serialized = this.constants.stringArray(names);
        this.push(76 /* PushArgs */, serialized, flags);
    }
    pushYieldableBlock(block) {
        this.pushSymbolTable(block && block.symbolTable);
        this.pushBlockScope();
        this.pushBlock(block);
    }
    curryComponent(definition,
    /* TODO: attrs: Option<RawInlineBlock>, */params, hash, synthetic) {
        let referrer = this.containingLayout.referrer;
        this.pushFrame();
        this.compileArgs(params, hash, null, synthetic);
        this.push(80 /* CaptureArgs */);
        this.expr(definition);
        this.push(71 /* CurryComponent */, this.constants.serializable(referrer));
        this.popFrame();
        this.fetch(Register.v0);
    }
    pushSymbolTable(table) {
        if (table) {
            let constant = this.constants.serializable(table);
            this.push(48 /* PushSymbolTable */, constant);
        } else {
            this.primitive(null);
        }
    }
    invokeComponent(capabilities, attrs, params, hash, synthetic, block, inverse = null, layout) {
        this.fetch(Register.s0);
        this.dup(Register.sp, 1);
        this.load(Register.s0);
        this.pushFrame();
        let bindableBlocks = !!(block || inverse || attrs);
        let bindableAtNames = capabilities === true || capabilities.prepareArgs || !!(hash && hash[0].length !== 0);
        let blocks = { main: block, else: inverse, attrs };
        this.compileArgs(params, hash, blocks, synthetic);
        this.prepareArgs(Register.s0);
        this.invokePreparedComponent(block !== null, bindableBlocks, bindableAtNames, () => {
            if (layout) {
                this.pushSymbolTable(layout.symbolTable);
                this.pushLayout(layout);
                this.resolveLayout();
            } else {
                this.getComponentLayout(Register.s0);
            }
            this.populateLayout(Register.s0);
        });
        this.load(Register.s0);
    }
    invokeStaticComponent(capabilities, layout, attrs, params, hash, synthetic, block, inverse = null) {
        let { symbolTable } = layout;
        let bailOut = symbolTable.hasEval || capabilities.prepareArgs;
        if (bailOut) {
            this.invokeComponent(capabilities, attrs, params, hash, synthetic, block, inverse, layout);
            return;
        }
        this.fetch(Register.s0);
        this.dup(Register.sp, 1);
        this.load(Register.s0);
        let { symbols } = symbolTable;
        if (capabilities.createArgs) {
            this.pushFrame();
            this.compileArgs(params, hash, null, synthetic);
        }
        this.beginComponentTransaction();
        if (capabilities.dynamicScope) {
            this.pushDynamicScope();
        }
        if (capabilities.createInstance) {
            this.createComponent(Register.s0, block !== null);
        }
        if (capabilities.createArgs) {
            this.popFrame();
        }
        this.pushFrame();
        this.registerComponentDestructor(Register.s0);
        let bindings = [];
        this.getComponentSelf(Register.s0);
        bindings.push({ symbol: 0, isBlock: false });
        for (let i = 0; i < symbols.length; i++) {
            let symbol = symbols[i];
            switch (symbol.charAt(0)) {
                case '&':
                    let callerBlock = null;
                    if (symbol === '&default') {
                        callerBlock = block;
                    } else if (symbol === '&inverse') {
                        callerBlock = inverse;
                    } else if (symbol === ATTRS_BLOCK) {
                        callerBlock = attrs;
                    } else {
                        throw unreachable();
                    }
                    if (callerBlock) {
                        this.pushYieldableBlock(callerBlock);
                        bindings.push({ symbol: i + 1, isBlock: true });
                    } else {
                        this.pushYieldableBlock(null);
                        bindings.push({ symbol: i + 1, isBlock: true });
                    }
                    break;
                case '@':
                    if (!hash) {
                        break;
                    }
                    let [keys, values] = hash;
                    let lookupName = symbol;
                    if (synthetic) {
                        lookupName = symbol.slice(1);
                    }
                    let index = keys.indexOf(lookupName);
                    if (index !== -1) {
                        this.expr(values[index]);
                        bindings.push({ symbol: i + 1, isBlock: false });
                    }
                    break;
            }
        }
        this.pushRootScope(symbols.length + 1, !!(block || inverse || attrs));
        for (let i = bindings.length - 1; i >= 0; i--) {
            let { symbol, isBlock } = bindings[i];
            if (isBlock) {
                this.setBlock(symbol);
            } else {
                this.setVariable(symbol);
            }
        }
        this.invokeStatic(layout);
        if (capabilities.createInstance) {
            this.didRenderLayout(Register.s0);
        }
        this.popFrame();
        this.popScope();
        if (capabilities.dynamicScope) {
            this.popDynamicScope();
        }
        this.commitComponentTransaction();
        this.load(Register.s0);
    }
    dynamicComponent(definition, attrs, params, hash, synthetic, block, inverse = null) {
        this.replayable({
            args: () => {
                this.expr(definition);
                this.dup();
                return 2;
            },
            body: () => {
                this.jumpUnless('ELSE');
                this.resolveDynamicComponent(this.containingLayout.referrer);
                this.pushDynamicComponentInstance();
                this.invokeComponent(true, attrs, params, hash, synthetic, block, inverse);
                this.label('ELSE');
            }
        });
    }
    yield(to, params) {
        this.compileArgs(params, null, null, false);
        this.getBlock(to);
        this.resolveBlock();
        this.invokeYield();
        this.popScope();
        this.popFrame();
    }
    guardedAppend(expression, trusting) {
        this.pushFrame();
        this.expr(expression);
        this.pushMachine(50 /* InvokeStatic */, this.stdLib.getAppend(trusting));
        this.popFrame();
    }
    invokeStaticBlock(block, callerCount = 0) {
        let { parameters } = block.symbolTable;
        let calleeCount = parameters.length;
        let count = Math.min(callerCount, calleeCount);
        this.pushFrame();
        if (count) {
            this.pushChildScope();
            for (let i = 0; i < count; i++) {
                this.dup(Register.fp, callerCount - i);
                this.setVariable(parameters[i]);
            }
        }
        this.pushBlock(block);
        this.resolveBlock();
        this.invokeVirtual();
        if (count) {
            this.popScope();
        }
        this.popFrame();
    }
    /// CONVENIENCE
    // internal helpers
    string(_string) {
        return this.constants.string(_string);
    }
    names(_names) {
        let names = [];
        for (let i = 0; i < _names.length; i++) {
            let n = _names[i];
            names[i] = this.constants.string(n);
        }
        return this.constants.array(names);
    }
    symbols(symbols) {
        return this.constants.array(symbols);
    }
    // vm
    primitive(_primitive) {
        let type = 0 /* NUMBER */;
        let primitive;
        switch (typeof _primitive) {
            case 'number':
                if (_primitive % 1 === 0) {
                    if (_primitive > -1) {
                        primitive = _primitive;
                    } else {
                        primitive = this.constants.number(_primitive);
                        type = 4 /* NEGATIVE */;
                    }
                } else {
                    primitive = this.constants.number(_primitive);
                    type = 1 /* FLOAT */;
                }
                break;
            case 'string':
                primitive = this.string(_primitive);
                type = 2 /* STRING */;
                break;
            case 'boolean':
                primitive = _primitive | 0;
                type = 3 /* BOOLEAN_OR_VOID */;
                break;
            case 'object':
                // assume null
                primitive = 2;
                type = 3 /* BOOLEAN_OR_VOID */;
                break;
            case 'undefined':
                primitive = 3;
                type = 3 /* BOOLEAN_OR_VOID */;
                break;
            default:
                throw new Error('Invalid primitive passed to pushPrimitive');
        }
        let immediate = this.sizeImmediate(primitive << 3 | type, primitive);
        this.push(13 /* Primitive */, immediate);
    }
    sizeImmediate(shifted, primitive) {
        if (shifted >= 4294967295 /* MAX_SIZE */ || shifted < 0) {
            return this.constants.number(primitive) << 3 | 5 /* BIG_NUM */;
        }
        return shifted;
    }
    pushPrimitiveReference(primitive) {
        this.primitive(primitive);
        this.primitiveReference();
    }
    // components
    pushComponentDefinition(handle) {
        this.push(72 /* PushComponentDefinition */, this.constants.handle(handle));
    }
    resolveDynamicComponent(referrer) {
        this.push(75 /* ResolveDynamicComponent */, this.constants.serializable(referrer));
    }
    staticComponentHelper(tag, hash, template) {
        let { handle, capabilities, compilable } = this.compiler.resolveLayoutForTag(tag, this.referrer);
        if (handle !== null && capabilities !== null) {
            if (compilable) {
                if (hash) {
                    for (let i = 0; i < hash.length; i = i + 2) {
                        hash[i][0] = `@${hash[i][0]}`;
                    }
                }
                this.pushComponentDefinition(handle);
                this.invokeStaticComponent(capabilities, compilable, null, null, hash, false, template && template);
                return true;
            }
        }
        return false;
    }
    // partial
    invokePartial(referrer, symbols, evalInfo) {
        let _meta = this.constants.serializable(referrer);
        let _symbols = this.constants.stringArray(symbols);
        let _evalInfo = this.constants.array(evalInfo);
        this.push(95 /* InvokePartial */, _meta, _symbols, _evalInfo);
    }
    resolveMaybeLocal(name) {
        this.push(96 /* ResolveMaybeLocal */, this.string(name));
    }
    // debugger
    debugger(symbols, evalInfo) {
        this.push(97 /* Debugger */, this.constants.stringArray(symbols), this.constants.array(evalInfo));
    }
    // dom
    text(text) {
        this.push(26 /* Text */, this.constants.string(text));
    }
    openPrimitiveElement(tag) {
        this.push(33 /* OpenElement */, this.constants.string(tag));
    }
    modifier(locator, params, hash) {
        this.pushFrame();
        this.compileArgs(params, hash, null, true);
        this.push(40 /* Modifier */, this.constants.handle(locator));
        this.popFrame();
    }
    comment(_comment) {
        let comment = this.constants.string(_comment);
        this.push(27 /* Comment */, comment);
    }
    dynamicAttr(_name, _namespace, trusting) {
        let name = this.constants.string(_name);
        let namespace = _namespace ? this.constants.string(_namespace) : 0;
        this.push(36 /* DynamicAttr */, name, trusting === true ? 1 : 0, namespace);
    }
    componentAttr(_name, _namespace, trusting) {
        let name = this.constants.string(_name);
        let namespace = _namespace ? this.constants.string(_namespace) : 0;
        this.push(37 /* ComponentAttr */, name, trusting === true ? 1 : 0, namespace);
    }
    staticAttr(_name, _namespace, _value) {
        let name = this.constants.string(_name);
        let namespace = _namespace ? this.constants.string(_namespace) : 0;
        let value = this.constants.string(_value);
        this.push(35 /* StaticAttr */, name, value, namespace);
    }
    // expressions
    hasBlockParams(to) {
        this.getBlock(to);
        this.resolveBlock();
        this.push(10 /* HasBlockParams */);
    }
    getProperty(key) {
        this.push(7 /* GetProperty */, this.string(key));
    }
    helper(helper, params, hash) {
        this.pushFrame();
        this.compileArgs(params, hash, null, true);
        this.push(1 /* Helper */, this.constants.handle(helper));
        this.popFrame();
        this.fetch(Register.v0);
    }
    bindDynamicScope(_names) {
        this.push(43 /* BindDynamicScope */, this.names(_names));
    }
    // convenience methods
    /**
     * A convenience for pushing some arguments on the stack and
     * running some code if the code needs to be re-executed during
     * updating execution if some of the arguments have changed.
     *
     * # Initial Execution
     *
     * The `args` function should push zero or more arguments onto
     * the stack and return the number of arguments pushed.
     *
     * The `body` function provides the instructions to execute both
     * during initial execution and during updating execution.
     *
     * Internally, this function starts by pushing a new frame, so
     * that the body can return and sets the return point ($ra) to
     * the ENDINITIAL label.
     *
     * It then executes the `args` function, which adds instructions
     * responsible for pushing the arguments for the block to the
     * stack. These arguments will be restored to the stack before
     * updating execution.
     *
     * Next, it adds the Enter opcode, which marks the current position
     * in the DOM, and remembers the current $pc (the next instruction)
     * as the first instruction to execute during updating execution.
     *
     * Next, it runs `body`, which adds the opcodes that should
     * execute both during initial execution and during updating execution.
     * If the `body` wishes to finish early, it should Jump to the
     * `FINALLY` label.
     *
     * Next, it adds the FINALLY label, followed by:
     *
     * - the Exit opcode, which finalizes the marked DOM started by the
     *   Enter opcode.
     * - the Return opcode, which returns to the current return point
     *   ($ra).
     *
     * Finally, it adds the ENDINITIAL label followed by the PopFrame
     * instruction, which restores $fp, $sp and $ra.
     *
     * # Updating Execution
     *
     * Updating execution for this `replayable` occurs if the `body` added an
     * assertion, via one of the `JumpIf`, `JumpUnless` or `AssertSame` opcodes.
     *
     * If, during updating executon, the assertion fails, the initial VM is
     * restored, and the stored arguments are pushed onto the stack. The DOM
     * between the starting and ending markers is cleared, and the VM's cursor
     * is set to the area just cleared.
     *
     * The return point ($ra) is set to -1, the exit instruction.
     *
     * Finally, the $pc is set to to the instruction saved off by the
     * Enter opcode during initial execution, and execution proceeds as
     * usual.
     *
     * The only difference is that when a `Return` instruction is
     * encountered, the program jumps to -1 rather than the END label,
     * and the PopFrame opcode is not needed.
     */
    replayable({ args, body }) {
        // Start a new label frame, to give END and RETURN
        // a unique meaning.
        this.startLabels();
        this.pushFrame();
        // If the body invokes a block, its return will return to
        // END. Otherwise, the return in RETURN will return to END.
        this.returnTo('ENDINITIAL');
        // Push the arguments onto the stack. The args() function
        // tells us how many stack elements to retain for re-execution
        // when updating.
        let count = args();
        // Start a new updating closure, remembering `count` elements
        // from the stack. Everything after this point, and before END,
        // will execute both initially and to update the block.
        //
        // The enter and exit opcodes also track the area of the DOM
        // associated with this block. If an assertion inside the block
        // fails (for example, the test value changes from true to false
        // in an #if), the DOM is cleared and the program is re-executed,
        // restoring `count` elements to the stack and executing the
        // instructions between the enter and exit.
        this.enter(count);
        // Evaluate the body of the block. The body of the block may
        // return, which will jump execution to END during initial
        // execution, and exit the updating routine.
        body();
        // All execution paths in the body should run the FINALLY once
        // they are done. It is executed both during initial execution
        // and during updating execution.
        this.label('FINALLY');
        // Finalize the DOM.
        this.exit();
        // In initial execution, this is a noop: it returns to the
        // immediately following opcode. In updating execution, this
        // exits the updating routine.
        this.return();
        // Cleanup code for the block. Runs on initial execution
        // but not on updating.
        this.label('ENDINITIAL');
        this.popFrame();
        this.stopLabels();
    }
    /**
     * A specialized version of the `replayable` convenience that allows the
     * caller to provide different code based upon whether the item at
     * the top of the stack is true or false.
     *
     * As in `replayable`, the `ifTrue` and `ifFalse` code can invoke `return`.
     *
     * During the initial execution, a `return` will continue execution
     * in the cleanup code, which finalizes the current DOM block and pops
     * the current frame.
     *
     * During the updating execution, a `return` will exit the updating
     * routine, as it can reuse the DOM block and is always only a single
     * frame deep.
     */
    replayableIf({ args, ifTrue, ifFalse }) {
        this.replayable({
            args,
            body: () => {
                // If the conditional is false, jump to the ELSE label.
                this.jumpUnless('ELSE');
                // Otherwise, execute the code associated with the true branch.
                ifTrue();
                // We're done, so return. In the initial execution, this runs
                // the cleanup code. In the updating VM, it exits the updating
                // routine.
                this.jump('FINALLY');
                this.label('ELSE');
                // If the conditional is false, and code associatied ith the
                // false branch was provided, execute it. If there was no code
                // associated with the false branch, jumping to the else statement
                // has no other behavior.
                if (ifFalse) {
                    ifFalse();
                }
            }
        });
    }
    inlineBlock(block) {
        return new CompilableBlock(this.compiler, {
            block,
            containingLayout: this.containingLayout
        });
    }
    evalSymbols() {
        let { containingLayout: { block } } = this;
        return block.hasEval ? block.symbols : null;
    }
    compileParams(params) {
        if (!params) return 0;
        for (let i = 0; i < params.length; i++) {
            this.expr(params[i]);
        }
        return params.length;
    }
    compileArgs(params, hash, blocks, synthetic) {
        if (blocks) {
            this.pushYieldableBlock(blocks.main);
            this.pushYieldableBlock(blocks.else);
            this.pushYieldableBlock(blocks.attrs);
        }
        let count = this.compileParams(params);
        let flags = count << 4;
        if (synthetic) flags |= 0b1000;
        if (blocks) {
            flags |= 0b111;
        }
        let names = EMPTY_ARRAY;
        if (hash) {
            names = hash[0];
            let val = hash[1];
            for (let i = 0; i < val.length; i++) {
                this.expr(val[i]);
            }
        }
        this.pushArgs(names, flags);
    }
    template(block) {
        if (!block) return null;
        return this.inlineBlock(block);
    }
}
class LazyOpcodeBuilder extends OpcodeBuilder {
    pushBlock(block) {
        if (block) {
            this.pushOther(block);
        } else {
            this.primitive(null);
        }
    }
    resolveBlock() {
        this.push(46 /* CompileBlock */);
    }
    pushLayout(layout) {
        if (layout) {
            this.pushOther(layout);
        } else {
            this.primitive(null);
        }
    }
    resolveLayout() {
        this.push(46 /* CompileBlock */);
    }
    invokeStatic(compilable) {
        this.pushOther(compilable);
        this.push(46 /* CompileBlock */);
        this.pushMachine(49 /* InvokeVirtual */);
    }
    pushOther(value) {
        this.push(12 /* Constant */, this.other(value));
    }
    other(value) {
        return this.constants.other(value);
    }
}
class EagerOpcodeBuilder extends OpcodeBuilder {
    pushBlock(block) {
        let handle = block ? block.compile() : null;
        this.primitive(handle);
    }
    resolveBlock() {
        return;
    }
    pushLayout(layout) {
        if (layout) {
            this.primitive(layout.compile());
        } else {
            this.primitive(null);
        }
    }
    resolveLayout() {}
    invokeStatic(compilable) {
        let handle = compilable.compile();
        // If the handle for the invoked component is not yet known (for example,
        // because this is a recursive invocation and we're still compiling), push a
        // function that will produce the correct handle when the heap is
        // serialized.
        if (handle === PLACEHOLDER_HANDLE$1) {
            this.pushMachine(50 /* InvokeStatic */, () => compilable.compile());
        } else {
            this.pushMachine(50 /* InvokeStatic */, handle);
        }
    }
}

class LazyCompiler extends AbstractCompiler {
    // FIXME: turn to static method
    constructor(lookup, resolver, macros) {
        let constants = new LazyConstants(resolver);
        let program = new Program(constants);
        super(macros, program, lookup);
    }
    builderFor(containingLayout) {
        return new LazyOpcodeBuilder(this, containingLayout);
    }
}

class PartialDefinition {
    constructor(name, // for debugging
    template) {
        this.name = name;
        this.template = template;
    }
    getPartial() {
        let partial = this.template.asPartial();
        let handle = partial.compile();
        return { symbolTable: partial.symbolTable, handle };
    }
}

let clientId = 0;
function templateFactory({ id: templateId, meta, block }) {
    let parsedBlock;
    let id = templateId || `client-${clientId++}`;
    let create = (compiler, envMeta) => {
        let newMeta = envMeta ? assign({}, envMeta, meta) : meta;
        if (!parsedBlock) {
            parsedBlock = JSON.parse(block);
        }
        return new TemplateImpl(compiler, { id, block: parsedBlock, referrer: newMeta });
    };
    return { id, meta, create };
}
class TemplateImpl {
    constructor(compiler, parsedLayout) {
        this.compiler = compiler;
        this.parsedLayout = parsedLayout;
        this.layout = null;
        this.partial = null;
        this.wrappedLayout = null;
        let { block } = parsedLayout;
        this.symbols = block.symbols;
        this.hasEval = block.hasEval;
        this.referrer = parsedLayout.referrer;
        this.id = parsedLayout.id || `client-${clientId++}`;
    }
    asLayout() {
        if (this.layout) return this.layout;
        return this.layout = new CompilableProgram(this.compiler, Object.assign({}, this.parsedLayout, { asPartial: false }));
    }
    asPartial() {
        if (this.partial) return this.partial;
        return this.layout = new CompilableProgram(this.compiler, Object.assign({}, this.parsedLayout, { asPartial: true }));
    }
    asWrappedLayout() {
        if (this.wrappedLayout) return this.wrappedLayout;
        return this.wrappedLayout = new WrappedBuilder(this.compiler, Object.assign({}, this.parsedLayout, { asPartial: false }));
    }
}

export { ATTRS_BLOCK, Macros, LazyCompiler, compile, AbstractCompiler, debugCompiler, CompilableBlock, CompilableProgram, LazyOpcodeBuilder, EagerOpcodeBuilder, OpcodeBuilder, StdOpcodeBuilder, PartialDefinition, templateFactory, debug, debugSlice, logOpcode, WrappedBuilder, PLACEHOLDER_HANDLE };
