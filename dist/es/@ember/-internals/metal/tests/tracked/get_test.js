var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { EMBER_METAL_TRACKED_PROPERTIES } from '@ember/canary-features';
import { AbstractTestCase, moduleFor } from 'internal-test-helpers';
import { get, getWithDefault, tracked } from '../..';
if (EMBER_METAL_TRACKED_PROPERTIES) {
    const createObj = function () {
        class Obj {
            constructor() {
                this.string = 'string';
                this.number = 23;
                this.boolTrue = true;
                this.boolFalse = false;
                this.nullValue = null;
            }
        }
        __decorate([
            tracked
        ], Obj.prototype, "string", void 0);
        __decorate([
            tracked
        ], Obj.prototype, "number", void 0);
        __decorate([
            tracked
        ], Obj.prototype, "boolTrue", void 0);
        __decorate([
            tracked
        ], Obj.prototype, "boolFalse", void 0);
        __decorate([
            tracked
        ], Obj.prototype, "nullValue", void 0);
        return new Obj();
    };
    moduleFor('@tracked decorator: get', class extends AbstractTestCase {
        '@test should get arbitrary properties on an object'() {
            let obj = createObj();
            for (let key in obj) {
                this.assert.equal(get(obj, key), obj[key], key);
            }
        }
        '@test should retrieve a number key on an object'() {
            class Obj {
                constructor() {
                    this[1] = 'first';
                }
            }
            __decorate([
                tracked
            ], Obj.prototype, 1, void 0);
            let obj = new Obj();
            this.assert.equal(get(obj, '1'), 'first');
        }
        '@test should retrieve an empty key on an object'() {
            class Obj {
                constructor() {
                    this[''] = 'empty';
                }
            }
            __decorate([
                tracked
            ], Obj.prototype, "", void 0);
            let obj = new Obj();
            this.assert.equal(get(obj, ''), 'empty');
        }
        '@test should get a @tracked path'() {
            class Key {
                constructor() {
                    this.value = 'value';
                }
            }
            __decorate([
                tracked
            ], Key.prototype, "value", void 0);
            class Path {
                constructor() {
                    this.key = new Key();
                }
            }
            __decorate([
                tracked
            ], Path.prototype, "key", void 0);
            class Obj {
                constructor() {
                    this.path = new Path();
                }
            }
            __decorate([
                tracked
            ], Obj.prototype, "path", void 0);
            let obj = new Obj();
            this.assert.equal(get(obj, 'path.key.value'), 'value');
        }
        '@test should not access a property more than once'() {
            let count = 20;
            class Count {
                get id() {
                    return ++count;
                }
            }
            __decorate([
                tracked
            ], Count.prototype, "id", null);
            let obj = new Count();
            get(obj, 'id');
            this.assert.equal(count, 21);
        }
    });
    moduleFor('@tracked decorator: getWithDefault', class extends AbstractTestCase {
        ['@test should get arbitrary properties on an object']() {
            let obj = createObj();
            for (let key in obj) {
                this.assert.equal(getWithDefault(obj, key, 'fail'), obj[key], key);
            }
            class Obj {
                constructor() {
                    this.undef = undefined;
                }
            }
            __decorate([
                tracked
            ], Obj.prototype, "undef", void 0);
            let obj2 = new Obj();
            this.assert.equal(getWithDefault(obj2, 'undef', 'default'), 'default', 'explicit undefined retrieves the default');
            this.assert.equal(getWithDefault(obj2, 'not-present', 'default'), 'default', 'non-present key retrieves the default');
        }
    });
}
