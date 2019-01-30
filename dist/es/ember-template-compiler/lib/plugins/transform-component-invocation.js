import calculateLocationDisplay from '../system/calculate-location-display';
/**
  Transforms unambigious invocations of closure components to be wrapped with
  the component helper. Once these syntaxes are fully supported by Glimmer VM
  natively, this transform can be removed.

  ```handlebars
  {{!-- this.foo is not a legal helper/component name --}}
  {{this.foo "with" some="args"}}
  ```

  with

  ```handlebars
  {{component this.foo "with" some="args"}}
  ```

  and

  ```handlebars
  {{!-- this.foo is not a legal helper/component name --}}
  {{#this.foo}}...{{/this.foo}}
  ```

  with

  ```handlebars
  {{#component this.foo}}...{{/component}}
  ```

  and

  ```handlebars
  {{!-- foo.bar is not a legal helper/component name --}}
  {{foo.bar "with" some="args"}}
  ```

  with

  ```handlebars
  {{component foo.bar "with" some="args"}}
  ```

  and

  ```handlebars
  {{!-- foo.bar is not a legal helper/component name --}}
  {{#foo.bar}}...{{/foo.bar}}
  ```

  with

  ```handlebars
  {{#component foo.bar}}...{{/component}}
  ```

  and

  ```handlebars
  {{!-- @foo is not a legal helper/component name --}}
  {{@foo "with" some="args"}}
  ```

  with

  ```handlebars
  {{component @foo "with" some="args"}}
  ```

  and

  ```handlebars
  {{!-- @foo is not a legal helper/component name --}}
  {{#@foo}}...{{/@foo}}
  ```

  with

  ```handlebars
  {{#component @foo}}...{{/component}}
  ```

  and

  ```handlebars
  {{#let ... as |foo|}}
    {{!-- foo is a local variable --}}
    {{foo "with" some="args"}}
  {{/let}}
  ```

  with

  ```handlebars
  {{#let ... as |foo|}}
    {{component foo "with" some="args"}}
  {{/let}}
  ```

  and

  ```handlebars
  {{#let ... as |foo|}}
    {{!-- foo is a local variable --}}
    {{#foo}}...{{/foo}}
  {{/let}}
  ```

  with

  ```handlebars
  {{#let ... as |foo|}}
    {{#component foo}}...{{/component}}
  {{/let}}
  ```

  @private
  @class TransFormComponentInvocation
*/
export default function transformComponentInvocation(env) {
    let { moduleName } = env.meta;
    let { builders: b } = env.syntax;
    let locals = [];
    let isAttrs = false;
    return {
        name: 'transform-component-invocation',
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
                    attributes: {
                        enter() {
                            isAttrs = true;
                        },
                        exit() {
                            isAttrs = false;
                        },
                    },
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
            BlockStatement(node) {
                if (isBlockInvocation(node, locals)) {
                    wrapInComponent(moduleName, node, b);
                }
            },
            MustacheStatement(node) {
                if (!isAttrs && isInlineInvocation(node, locals)) {
                    wrapInComponent(moduleName, node, b);
                }
            },
        },
    };
}
function isInlineInvocation(node, locals) {
    let { path } = node;
    return isPath(path) && isIllegalName(path, locals) && hasArguments(node);
}
function isPath(node) {
    return node.type === 'PathExpression';
}
function isIllegalName(node, locals) {
    return isThisPath(node) || isDotPath(node) || isNamedArg(node) || isLocalVariable(node, locals);
}
function isThisPath(node) {
    return node.this === true;
}
function isDotPath(node) {
    return node.parts.length > 1;
}
function isNamedArg(node) {
    return node.data === true;
}
function isLocalVariable(node, locals) {
    return !node.this && hasLocalVariable(node.parts[0], locals);
}
function hasLocalVariable(name, locals) {
    return locals.some(names => names.indexOf(name) !== -1);
}
function hasArguments(node) {
    return node.params.length > 0 || node.hash.pairs.length > 0;
}
function isBlockInvocation(node, locals) {
    return isIllegalName(node.path, locals);
}
function wrapInAssertion(moduleName, node, b) {
    let error = b.string(`expected \`${node.original}\` to be a contextual component but found a string. Did you mean \`(component ${node.original})\`? ${calculateLocationDisplay(moduleName, node.loc)}`);
    return b.sexpr(b.path('-assert-implicit-component-helper-argument'), [node, error], b.hash(), node.loc);
}
function wrapInComponent(moduleName, node, b) {
    let component = wrapInAssertion(moduleName, node.path, b);
    node.path = b.path('component');
    node.params.unshift(component);
}
