function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and set to use loose mode. ' + 'To use proposal-class-properties in spec mode with decorators, wait for ' + 'the next major version of decorators in stage 2.'); }

import { EMBER_METAL_TRACKED_PROPERTIES, EMBER_NATIVE_DECORATOR_SUPPORT } from '@ember/canary-features';
import { AbstractTestCase, moduleFor } from 'internal-test-helpers';
import { get, getWithDefault, tracked } from '../..';

if (EMBER_METAL_TRACKED_PROPERTIES && EMBER_NATIVE_DECORATOR_SUPPORT) {
  let createObj = function () {
    var _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _temp;

    let Obj = (_class = (_temp = class Obj {
      constructor() {
        _initializerDefineProperty(this, "string", _descriptor, this);

        _initializerDefineProperty(this, "number", _descriptor2, this);

        _initializerDefineProperty(this, "boolTrue", _descriptor3, this);

        _initializerDefineProperty(this, "boolFalse", _descriptor4, this);

        _initializerDefineProperty(this, "nullValue", _descriptor5, this);
      }

    }, _temp), (_descriptor = _applyDecoratedDescriptor(_class.prototype, "string", [tracked], {
      configurable: true,
      enumerable: true,
      writable: true,
      initializer: function () {
        return 'string';
      }
    }), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, "number", [tracked], {
      configurable: true,
      enumerable: true,
      writable: true,
      initializer: function () {
        return 23;
      }
    }), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, "boolTrue", [tracked], {
      configurable: true,
      enumerable: true,
      writable: true,
      initializer: function () {
        return true;
      }
    }), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, "boolFalse", [tracked], {
      configurable: true,
      enumerable: true,
      writable: true,
      initializer: function () {
        return false;
      }
    }), _descriptor5 = _applyDecoratedDescriptor(_class.prototype, "nullValue", [tracked], {
      configurable: true,
      enumerable: true,
      writable: true,
      initializer: function () {
        return null;
      }
    })), _class);
    return new Obj();
  };

  moduleFor('@tracked decorator: get', class extends AbstractTestCase {
    '@test should get arbitrary properties on an object'() {
      let obj = createObj();

      for (let key in obj) {
        this.assert.equal(get(obj, key), obj[key], key);
      }
    }

    '@test should get a @tracked path'() {
      var _class3, _descriptor6, _temp2, _class5, _descriptor7, _temp3, _class7, _descriptor8, _temp4;

      let Key = (_class3 = (_temp2 = class Key {
        constructor() {
          _initializerDefineProperty(this, "value", _descriptor6, this);
        }

      }, _temp2), (_descriptor6 = _applyDecoratedDescriptor(_class3.prototype, "value", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 'value';
        }
      })), _class3);
      let Path = (_class5 = (_temp3 = class Path {
        constructor() {
          _initializerDefineProperty(this, "key", _descriptor7, this);
        }

      }, _temp3), (_descriptor7 = _applyDecoratedDescriptor(_class5.prototype, "key", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Key();
        }
      })), _class5);
      let Obj = (_class7 = (_temp4 = class Obj {
        constructor() {
          _initializerDefineProperty(this, "path", _descriptor8, this);
        }

      }, _temp4), (_descriptor8 = _applyDecoratedDescriptor(_class7.prototype, "path", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return new Path();
        }
      })), _class7);
      let obj = new Obj();
      this.assert.equal(get(obj, 'path.key.value'), 'value');
    }

    ['@test should get arbitrary properties on an object']() {
      var _class9, _descriptor9, _temp5;

      let obj = createObj();

      for (let key in obj) {
        this.assert.equal(getWithDefault(obj, key, 'fail'), obj[key], key);
      }

      let Obj = (_class9 = (_temp5 = class Obj {
        constructor() {
          _initializerDefineProperty(this, "undef", _descriptor9, this);
        }

      }, _temp5), (_descriptor9 = _applyDecoratedDescriptor(_class9.prototype, "undef", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return undefined;
        }
      })), _class9);
      let obj2 = new Obj();
      this.assert.equal(getWithDefault(obj2, 'undef', 'default'), 'default', 'explicit undefined retrieves the default');
      this.assert.equal(getWithDefault(obj2, 'not-present', 'default'), 'default', 'non-present key retrieves the default');
    }

  });
}