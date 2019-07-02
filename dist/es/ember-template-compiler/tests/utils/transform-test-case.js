import { precompile } from '@glimmer/compiler';
import { AbstractTestCase } from 'internal-test-helpers';
import { compileOptions } from '../../index';
export default class extends AbstractTestCase {
    assertTransformed(before, after) {
        this.assert.deepEqual(deloc(ast(before)), deloc(ast(after)));
    }
}
function ast(template) {
    let program = null;
    function extractProgram() {
        return {
            name: 'extract-program',
            visitor: {
                Program: {
                    exit(node) {
                        program = clone(node);
                    },
                },
            },
        };
    }
    let options = compileOptions({
        moduleName: '-top-level',
    });
    options.plugins.ast.push(extractProgram);
    precompile(template, options);
    return program;
}
function clone(node) {
    let out = Object.create(null);
    let keys = Object.keys(node);
    keys.forEach(key => {
        let value = node[key];
        if (value !== null && typeof value === 'object') {
            out[key] = clone(value);
        }
        else {
            out[key] = value;
        }
    });
    return out;
}
function deloc(node) {
    let out = Object.create(null);
    let keys = Object.keys(node);
    keys.forEach(key => {
        let value = node[key];
        if (key === 'loc') {
            return;
        }
        else if (value !== null && typeof value === 'object') {
            out[key] = deloc(value);
        }
        else {
            out[key] = value;
        }
    });
    return out;
}
