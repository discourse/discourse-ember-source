var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { get, set, tracked } from '../..';
import { EMBER_METAL_TRACKED_PROPERTIES } from '@ember/canary-features';
import { AbstractTestCase, moduleFor } from 'internal-test-helpers';
if (EMBER_METAL_TRACKED_PROPERTIES) {
    moduleFor('@tracked getters', class extends AbstractTestCase {
        ['@test works without get'](assert) {
            let count = 0;
            class Count {
                get foo() {
                    count++;
                    return `computed foo`;
                }
            }
            __decorate([
                tracked
            ], Count.prototype, "foo", null);
            let obj = new Count();
            assert.equal(obj.foo, 'computed foo', 'should return value');
            assert.equal(count, 1, 'should have invoked computed property');
        }
        ['@test defining computed property should invoke property on get'](assert) {
            let count = 0;
            class Count {
                get foo() {
                    count++;
                    return `computed foo`;
                }
            }
            __decorate([
                tracked
            ], Count.prototype, "foo", null);
            let obj = new Count();
            assert.equal(get(obj, 'foo'), 'computed foo', 'should return value');
            assert.equal(count, 1, 'should have invoked computed property');
        }
        ['@test defining computed property should invoke property on set'](assert) {
            let count = 0;
            class Foo {
                constructor() {
                    this.__foo = '';
                }
                get foo() {
                    return this.__foo;
                }
                set foo(value) {
                    count++;
                    this.__foo = `computed ${value}`;
                }
            }
            __decorate([
                tracked
            ], Foo.prototype, "foo", null);
            let obj = new Foo();
            assert.equal(set(obj, 'foo', 'bar'), 'bar', 'should return set value');
            assert.equal(count, 1, 'should have invoked computed property');
            assert.equal(get(obj, 'foo'), 'computed bar', 'should return new value');
        }
    });
}
