import { EMBER_GLIMMER_ANGLE_BRACKET_BUILT_INS } from '@ember/canary-features';
import { unreachable } from '@glimmer/util';
/**
 @module ember
*/
/**
  A Glimmer2 AST transformation that replaces all instances of

  ```handlebars
 {{input type=boundType}}
  ```

  with

  ```handlebars
 {{input (-input-type boundType) type=boundType}}
  ```

  Note that the type parameters is not removed as the -input-type helpers
  is only used to select the component class. The component still needs
  the type parameter to function.

  @private
  @class TransformInputTypeSyntax
*/
let transformInputTypeSyntax;
if (EMBER_GLIMMER_ANGLE_BRACKET_BUILT_INS) {
    transformInputTypeSyntax = () => {
        throw unreachable();
    };
}
else {
    transformInputTypeSyntax = function transformInputTypeSyntax(env) {
        let b = env.syntax.builders;
        return {
            name: 'transform-input-type-syntax',
            visitor: {
                MustacheStatement(node) {
                    if (isInput(node)) {
                        insertTypeHelperParameter(node, b);
                    }
                },
            },
        };
    };
    let isInput = function isInput(node) {
        return node.path.original === 'input';
    };
    let insertTypeHelperParameter = function insertTypeHelperParameter(node, builders) {
        let pairs = node.hash.pairs;
        let pair = null;
        for (let i = 0; i < pairs.length; i++) {
            if (pairs[i].key === 'type') {
                pair = pairs[i];
                break;
            }
        }
        if (pair && pair.value.type !== 'StringLiteral') {
            node.params.unshift(builders.sexpr('-input-type', [pair.value], undefined, pair.loc));
        }
    };
}
export default transformInputTypeSyntax;
