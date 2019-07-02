function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and set to use loose mode. ' + 'To use proposal-class-properties in spec mode with decorators, wait for ' + 'the next major version of decorators in stage 2.'); }

import { AbstractTestCase, moduleFor } from 'internal-test-helpers';
import { get, set, tracked } from '../..';
import { EMBER_METAL_TRACKED_PROPERTIES, EMBER_NATIVE_DECORATOR_SUPPORT } from '@ember/canary-features';

if (EMBER_METAL_TRACKED_PROPERTIES && EMBER_NATIVE_DECORATOR_SUPPORT) {
  let createObj = () => {
    var _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _temp;

    let Obj = (_class = (_temp = class Obj {
      constructor() {
        _initializerDefineProperty(this, "string", _descriptor, this);

        _initializerDefineProperty(this, "number", _descriptor2, this);

        _initializerDefineProperty(this, "boolTrue", _descriptor3, this);

        _initializerDefineProperty(this, "boolFalse", _descriptor4, this);

        _initializerDefineProperty(this, "nullValue", _descriptor5, this);

        _initializerDefineProperty(this, "undefinedValue", _descriptor6, this);
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
    }), _descriptor6 = _applyDecoratedDescriptor(_class.prototype, "undefinedValue", [tracked], {
      configurable: true,
      enumerable: true,
      writable: true,
      initializer: function () {
        return undefined;
      }
    })), _class);
    return new Obj();
  };

  moduleFor('@tracked set', class extends AbstractTestCase {
    ['@test should set arbitrary properties on an object'](assert) {
      var _class3, _descriptor7, _temp2;

      let obj = createObj();
      let Obj = (_class3 = (_temp2 = class Obj {
        constructor() {
          _initializerDefineProperty(this, "undefinedValue", _descriptor7, this);
        }

      }, _temp2), (_descriptor7 = _applyDecoratedDescriptor(_class3.prototype, "undefinedValue", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 'emberjs';
        }
      })), _class3);
      let newObj = new Obj();

      for (let key in obj) {
        assert.equal(set(newObj, key, obj[key]), obj[key], 'should return value');
        assert.equal(get(newObj, key), obj[key], 'should set value');
      }
    }

  });
}