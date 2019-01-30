var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { AbstractTestCase, moduleFor } from 'internal-test-helpers';
import { get, set, tracked } from '../..';
import { EMBER_METAL_TRACKED_PROPERTIES } from '@ember/canary-features';
if (EMBER_METAL_TRACKED_PROPERTIES) {
    const createObj = () => {
        class Obj {
            constructor() {
                this.string = 'string';
                this.number = 23;
                this.boolTrue = true;
                this.boolFalse = false;
                this.nullValue = null;
                this.undefinedValue = undefined;
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
        __decorate([
            tracked
        ], Obj.prototype, "undefinedValue", void 0);
        return new Obj();
    };
    moduleFor('@tracked set', class extends AbstractTestCase {
        ['@test should set arbitrary properties on an object'](assert) {
            let obj = createObj();
            class Obj {
                constructor() {
                    this.undefinedValue = 'emberjs';
                }
            }
            __decorate([
                tracked
            ], Obj.prototype, "undefinedValue", void 0);
            let newObj = new Obj();
            for (let key in obj) {
                assert.equal(set(newObj, key, obj[key]), obj[key], 'should return value');
                assert.equal(get(newObj, key), obj[key], 'should set value');
            }
        }
        ['@test should set a number key on an object'](assert) {
            class Obj {
                constructor() {
                    this[1] = 'original';
                }
            }
            __decorate([
                tracked
            ], Obj.prototype, 1, void 0);
            let obj = new Obj();
            set(obj, '1', 'first');
            assert.equal(obj[1], 'first');
        }
    });
}
