import { assert } from '@ember/debug';
import calculateLocationDisplay from '../system/calculate-location-display';
export default function assertModifiersNotInComponents(env) {
    let { moduleName } = env.meta;
    let scopes = [];
    function isComponentInvocation(node) {
        return (node.tag[0] === '@' ||
            node.tag[0].toUpperCase() === node.tag[0] ||
            node.tag.indexOf('.') > -1 ||
            scopes.some(params => params.some(p => p === node.tag)));
    }
    return {
        name: 'assert-modifiers-not-in-components',
        visitor: {
            Program: {
                enter(node) {
                    scopes.push(node.blockParams);
                },
                exit() {
                    scopes.pop();
                },
            },
            ElementNode: {
                keys: {
                    children: {
                        enter(node) {
                            scopes.push(node.blockParams);
                        },
                        exit() {
                            scopes.pop();
                        },
                    },
                },
                enter(node) {
                    if (node.modifiers.length > 0 && isComponentInvocation(node)) {
                        assert(`Passing modifiers to components require the "ember-glimmer-forward-modifiers-with-splattributes" canary feature, which has not been stabilized yet. See RFC #435 for details. ${calculateLocationDisplay(moduleName, node.loc)}`);
                    }
                },
            },
        },
    };
}
