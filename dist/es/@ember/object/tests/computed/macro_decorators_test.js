function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and set to use loose mode. ' + 'To use proposal-class-properties in spec mode with decorators, wait for ' + 'the next major version of decorators in stage 2.'); }

import { moduleFor, AbstractTestCase } from 'internal-test-helpers';
import { EMBER_NATIVE_DECORATOR_SUPPORT } from '@ember/canary-features';
import { alias } from '@ember/-internals/metal';
import { and, bool, collect, deprecatingAlias, empty, equal, filter, filterBy, gt, gte, intersect, lt, lte, map, mapBy, match, max, min, not, notEmpty, oneWay, or, readOnly, setDiff, sort, sum, union, uniq, uniqBy } from '@ember/object/computed';

if (EMBER_NATIVE_DECORATOR_SUPPORT) {
  moduleFor('computed macros - decorators - assertions', class extends AbstractTestCase {
    ['@test and throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class, _descriptor, _temp;

        let Foo = (_class = (_temp = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor, this);
          }

        }, _temp), (_descriptor = _applyDecoratedDescriptor(_class.prototype, "foo", [and], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class);
        new Foo();
      }, /You attempted to use @and/);
    }

    ['@test alias throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class3, _descriptor2, _temp2;

        let Foo = (_class3 = (_temp2 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor2, this);
          }

        }, _temp2), (_descriptor2 = _applyDecoratedDescriptor(_class3.prototype, "foo", [alias], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class3);
        new Foo();
      }, /You attempted to use @alias/);
    }

    ['@test bool throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class5, _descriptor3, _temp3;

        let Foo = (_class5 = (_temp3 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor3, this);
          }

        }, _temp3), (_descriptor3 = _applyDecoratedDescriptor(_class5.prototype, "foo", [bool], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class5);
        new Foo();
      }, /You attempted to use @bool/);
    }

    ['@test collect throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class7, _descriptor4, _temp4;

        let Foo = (_class7 = (_temp4 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor4, this);
          }

        }, _temp4), (_descriptor4 = _applyDecoratedDescriptor(_class7.prototype, "foo", [collect], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class7);
        new Foo();
      }, /You attempted to use @collect/);
    }

    ['@test deprecatingAlias throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class9, _descriptor5, _temp5;

        let Foo = (_class9 = (_temp5 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor5, this);
          }

        }, _temp5), (_descriptor5 = _applyDecoratedDescriptor(_class9.prototype, "foo", [deprecatingAlias], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class9);
        new Foo();
      }, /You attempted to use @deprecatingAlias/);
    }

    ['@test empty throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class11, _descriptor6, _temp6;

        let Foo = (_class11 = (_temp6 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor6, this);
          }

        }, _temp6), (_descriptor6 = _applyDecoratedDescriptor(_class11.prototype, "foo", [empty], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class11);
        new Foo();
      }, /You attempted to use @empty/);
    }

    ['@test equal throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class13, _descriptor7, _temp7;

        let Foo = (_class13 = (_temp7 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor7, this);
          }

        }, _temp7), (_descriptor7 = _applyDecoratedDescriptor(_class13.prototype, "foo", [equal], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class13);
        new Foo();
      }, /You attempted to use @equal/);
    }

    ['@test filter throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class15, _descriptor8, _temp8;

        let Foo = (_class15 = (_temp8 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor8, this);
          }

        }, _temp8), (_descriptor8 = _applyDecoratedDescriptor(_class15.prototype, "foo", [filter], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class15);
        new Foo();
      }, /You attempted to use @filter/);
    }

    ['@test filterBy throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class17, _descriptor9, _temp9;

        let Foo = (_class17 = (_temp9 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor9, this);
          }

        }, _temp9), (_descriptor9 = _applyDecoratedDescriptor(_class17.prototype, "foo", [filterBy], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class17);
        new Foo();
      }, /You attempted to use @filterBy/);
    }

    ['@test gt throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class19, _descriptor10, _temp10;

        let Foo = (_class19 = (_temp10 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor10, this);
          }

        }, _temp10), (_descriptor10 = _applyDecoratedDescriptor(_class19.prototype, "foo", [gt], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class19);
        new Foo();
      }, /You attempted to use @gt/);
    }

    ['@test gte throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class21, _descriptor11, _temp11;

        let Foo = (_class21 = (_temp11 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor11, this);
          }

        }, _temp11), (_descriptor11 = _applyDecoratedDescriptor(_class21.prototype, "foo", [gte], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class21);
        new Foo();
      }, /You attempted to use @gte/);
    }

    ['@test intersect throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class23, _descriptor12, _temp12;

        let Foo = (_class23 = (_temp12 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor12, this);
          }

        }, _temp12), (_descriptor12 = _applyDecoratedDescriptor(_class23.prototype, "foo", [intersect], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class23);
        new Foo();
      }, /You attempted to use @intersect/);
    }

    ['@test lt throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class25, _descriptor13, _temp13;

        let Foo = (_class25 = (_temp13 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor13, this);
          }

        }, _temp13), (_descriptor13 = _applyDecoratedDescriptor(_class25.prototype, "foo", [lt], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class25);
        new Foo();
      }, /You attempted to use @lt/);
    }

    ['@test lte throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class27, _descriptor14, _temp14;

        let Foo = (_class27 = (_temp14 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor14, this);
          }

        }, _temp14), (_descriptor14 = _applyDecoratedDescriptor(_class27.prototype, "foo", [lte], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class27);
        new Foo();
      }, /You attempted to use @lte/);
    }

    ['@test map throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class29, _descriptor15, _temp15;

        let Foo = (_class29 = (_temp15 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor15, this);
          }

        }, _temp15), (_descriptor15 = _applyDecoratedDescriptor(_class29.prototype, "foo", [map], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class29);
        new Foo();
      }, /You attempted to use @map/);
    }

    ['@test mapBy throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class31, _descriptor16, _temp16;

        let Foo = (_class31 = (_temp16 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor16, this);
          }

        }, _temp16), (_descriptor16 = _applyDecoratedDescriptor(_class31.prototype, "foo", [mapBy], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class31);
        new Foo();
      }, /You attempted to use @mapBy/);
    }

    ['@test match throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class33, _descriptor17, _temp17;

        let Foo = (_class33 = (_temp17 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor17, this);
          }

        }, _temp17), (_descriptor17 = _applyDecoratedDescriptor(_class33.prototype, "foo", [match], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class33);
        new Foo();
      }, /You attempted to use @match/);
    }

    ['@test max throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class35, _descriptor18, _temp18;

        let Foo = (_class35 = (_temp18 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor18, this);
          }

        }, _temp18), (_descriptor18 = _applyDecoratedDescriptor(_class35.prototype, "foo", [max], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class35);
        new Foo();
      }, /You attempted to use @max/);
    }

    ['@test min throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class37, _descriptor19, _temp19;

        let Foo = (_class37 = (_temp19 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor19, this);
          }

        }, _temp19), (_descriptor19 = _applyDecoratedDescriptor(_class37.prototype, "foo", [min], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class37);
        new Foo();
      }, /You attempted to use @min/);
    }

    ['@test not throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class39, _descriptor20, _temp20;

        let Foo = (_class39 = (_temp20 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor20, this);
          }

        }, _temp20), (_descriptor20 = _applyDecoratedDescriptor(_class39.prototype, "foo", [not], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class39);
        new Foo();
      }, /You attempted to use @not/);
    }

    ['@test notEmpty throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class41, _descriptor21, _temp21;

        let Foo = (_class41 = (_temp21 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor21, this);
          }

        }, _temp21), (_descriptor21 = _applyDecoratedDescriptor(_class41.prototype, "foo", [notEmpty], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class41);
        new Foo();
      }, /You attempted to use @notEmpty/);
    }

    ['@test oneWay throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class43, _descriptor22, _temp22;

        let Foo = (_class43 = (_temp22 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor22, this);
          }

        }, _temp22), (_descriptor22 = _applyDecoratedDescriptor(_class43.prototype, "foo", [oneWay], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class43);
        new Foo();
      }, /You attempted to use @oneWay/);
    }

    ['@test or throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class45, _descriptor23, _temp23;

        let Foo = (_class45 = (_temp23 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor23, this);
          }

        }, _temp23), (_descriptor23 = _applyDecoratedDescriptor(_class45.prototype, "foo", [or], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class45);
        new Foo();
      }, /You attempted to use @or/);
    }

    ['@test readOnly throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class47, _descriptor24, _temp24;

        let Foo = (_class47 = (_temp24 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor24, this);
          }

        }, _temp24), (_descriptor24 = _applyDecoratedDescriptor(_class47.prototype, "foo", [readOnly], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class47);
        new Foo();
      }, /You attempted to use @readOnly/);
    }

    ['@test setDiff throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class49, _descriptor25, _temp25;

        let Foo = (_class49 = (_temp25 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor25, this);
          }

        }, _temp25), (_descriptor25 = _applyDecoratedDescriptor(_class49.prototype, "foo", [setDiff], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class49);
        new Foo();
      }, /You attempted to use @setDiff/);
    }

    ['@test sort throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class51, _descriptor26, _temp26;

        let Foo = (_class51 = (_temp26 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor26, this);
          }

        }, _temp26), (_descriptor26 = _applyDecoratedDescriptor(_class51.prototype, "foo", [sort], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class51);
        new Foo();
      }, /You attempted to use @sort/);
    }

    ['@test sum throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class53, _descriptor27, _temp27;

        let Foo = (_class53 = (_temp27 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor27, this);
          }

        }, _temp27), (_descriptor27 = _applyDecoratedDescriptor(_class53.prototype, "foo", [sum], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class53);
        new Foo();
      }, /You attempted to use @sum/);
    }

    ['@test union throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class55, _descriptor28, _temp28;

        let Foo = (_class55 = (_temp28 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor28, this);
          }

        }, _temp28), (_descriptor28 = _applyDecoratedDescriptor(_class55.prototype, "foo", [union], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class55);
        new Foo();
      }, /You attempted to use @uniq\/@union/);
    }

    ['@test uniq throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class57, _descriptor29, _temp29;

        let Foo = (_class57 = (_temp29 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor29, this);
          }

        }, _temp29), (_descriptor29 = _applyDecoratedDescriptor(_class57.prototype, "foo", [uniq], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class57);
        new Foo();
      }, /You attempted to use @uniq\/@union/);
    }

    ['@test uniqBy throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class59, _descriptor30, _temp30;

        let Foo = (_class59 = (_temp30 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor30, this);
          }

        }, _temp30), (_descriptor30 = _applyDecoratedDescriptor(_class59.prototype, "foo", [uniqBy], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class59);
        new Foo();
      }, /You attempted to use @uniqBy/);
    }

    ['@test alias throws an error if used without parameters']() {
      expectAssertion(() => {
        var _class61, _descriptor31, _temp31;

        let Foo = (_class61 = (_temp31 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "foo", _descriptor31, this);
          }

        }, _temp31), (_descriptor31 = _applyDecoratedDescriptor(_class61.prototype, "foo", [alias], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class61);
        new Foo();
      }, /You attempted to use @alias/);
    }

  });
}