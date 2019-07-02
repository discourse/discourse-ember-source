import { assert } from '@ember/debug';
import calculateLocationDisplay from '../system/calculate-location-display';
export default function assertSplattributeExpressions(env) {
    let { moduleName } = env.meta;
    return {
        name: 'assert-splattribute-expressions',
        visitor: {
            PathExpression({ original, loc }) {
                if (original === '...attributes') {
                    assert(`${errorMessage()} ${calculateLocationDisplay(moduleName, loc)}`);
                }
            },
        },
    };
}
function errorMessage() {
    return '`...attributes` can only be used in the element position e.g. `<div ...attributes />`. It cannot be used as a path.';
}
