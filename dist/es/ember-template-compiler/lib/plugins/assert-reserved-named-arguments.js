import { assert } from '@ember/debug';
import calculateLocationDisplay from '../system/calculate-location-display';
export default function assertReservedNamedArguments(env) {
    let { moduleName } = env.meta;
    return {
        name: 'assert-reserved-named-arguments',
        visitor: {
            // In general, we don't assert on the invocation side to avoid creating migration
            // hazards (e.g. using angle bracket to invoke a classic component that uses
            // `this.someReservedName`. However, we want to avoid leaking special internal
            // things, such as `__ARGS__`, so those would need to be asserted on both sides.
            AttrNode({ name, loc }) {
                if (name === '@__ARGS__') {
                    assert(`${assertMessage(name)} ${calculateLocationDisplay(moduleName, loc)}`);
                }
            },
            HashPair({ key, loc }) {
                if (key === '__ARGS__') {
                    assert(`${assertMessage(key)} ${calculateLocationDisplay(moduleName, loc)}`);
                }
            },
            PathExpression({ original, loc }) {
                if (isReserved(original)) {
                    assert(`${assertMessage(original)} ${calculateLocationDisplay(moduleName, loc)}`);
                }
            },
        },
    };
}
const RESERVED = ['@arguments', '@args', '@block', '@else'];
function isReserved(name) {
    return RESERVED.indexOf(name) !== -1 || Boolean(name.match(/^@[^a-z]/));
}
function assertMessage(name) {
    return `'${name}' is reserved.`;
}
