import { assert } from '@ember/debug';
import calculateLocationDisplay from '../system/calculate-location-display';
export default function assertLocalVariableShadowingHelperInvocation(env) {
    let { moduleName } = env.meta;
    let locals = [];
    return {
        name: 'assert-local-variable-shadowing-helper-invocation',
        visitor: {
            Program: {
                enter(node) {
                    locals.push(node.blockParams);
                },
                exit() {
                    locals.pop();
                },
            },
            ElementNode: {
                keys: {
                    children: {
                        enter(node) {
                            locals.push(node.blockParams);
                        },
                        exit() {
                            locals.pop();
                        },
                    },
                },
            },
            MustacheStatement(node) {
                if (isPath(node.path) && hasArguments(node)) {
                    let name = node.path.parts[0];
                    let type = 'helper';
                    assert(`${messageFor(name, type)} ${calculateLocationDisplay(moduleName, node.loc)}`, !isLocalVariable(node.path, locals));
                }
            },
            SubExpression(node) {
                let name = node.path.parts[0];
                let type = 'helper';
                assert(`${messageFor(name, type)} ${calculateLocationDisplay(moduleName, node.loc)}`, !isLocalVariable(node.path, locals));
            },
            ElementModifierStatement(node) {
                let name = node.path.parts[0];
                let type = 'modifier';
                assert(`${messageFor(name, type)} ${calculateLocationDisplay(moduleName, node.loc)}`, !isLocalVariable(node.path, locals));
            },
        },
    };
}
function isLocalVariable(node, locals) {
    return !node.this && node.parts.length === 1 && hasLocalVariable(node.parts[0], locals);
}
function hasLocalVariable(name, locals) {
    return locals.some(names => names.indexOf(name) !== -1);
}
function messageFor(name, type) {
    return `Cannot invoke the \`${name}\` ${type} because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict.`;
}
function isPath(node) {
    return node.type === 'PathExpression';
}
function hasArguments(node) {
    return node.params.length > 0 || node.hash.pairs.length > 0;
}
