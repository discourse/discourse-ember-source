function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and set to use loose mode. ' + 'To use proposal-class-properties in spec mode with decorators, wait for ' + 'the next major version of decorators in stage 2.'); }

import { AbstractTestCase, moduleFor } from 'internal-test-helpers';
import { defineProperty, tracked, nativeDescDecorator } from '../..';
import { track } from './support';
import { EMBER_METAL_TRACKED_PROPERTIES, EMBER_NATIVE_DECORATOR_SUPPORT } from '@ember/canary-features';

if (EMBER_METAL_TRACKED_PROPERTIES) {
  moduleFor('@tracked decorator - classic classes', class extends AbstractTestCase {
    [`@test validators for tracked getters with dependencies should invalidate when the dependencies invalidate`](assert) {
      let obj = {};
      defineProperty(obj, 'first', tracked());
      defineProperty(obj, 'last', tracked());
      defineProperty(obj, 'full', nativeDescDecorator({
        get() {
          return `${this.first} ${this.last}`;
        },

        set(value) {
          let [first, last] = value.split(' ');
          this.first = first;
          this.last = last;
        }

      }));
      obj.first = 'Tom';
      obj.last = 'Dale';
      let tag = track(() => obj.full);
      let snapshot = tag.value();
      assert.equal(obj.full, 'Tom Dale', 'The full name starts correct');
      assert.equal(tag.validate(snapshot), true);
      snapshot = tag.value();
      assert.equal(tag.validate(snapshot), true);
      obj.full = 'Melanie Sumner';
      assert.equal(tag.validate(snapshot), false);
      assert.equal(obj.full, 'Melanie Sumner');
      assert.equal(obj.first, 'Melanie');
      assert.equal(obj.last, 'Sumner');
      snapshot = tag.value();
      assert.equal(tag.validate(snapshot), true);
    }

    [`@test can pass a default value to the tracked decorator`](assert) {
      class Tracked {
        get full() {
          return `${this.first} ${this.last}`;
        }

      }

      defineProperty(Tracked.prototype, 'first', tracked({
        value: 'Tom'
      }));
      defineProperty(Tracked.prototype, 'last', tracked({
        value: 'Dale'
      }));
      let obj = new Tracked();
      assert.equal(obj.full, 'Tom Dale', 'Default values are correctly assign');
    }

    [`@test errors if used directly on a classic class`]() {
      expectAssertion(() => {
        class Tracked {
          get full() {
            return `${this.first} ${this.last}`;
          }

        }

        defineProperty(Tracked.prototype, 'first', tracked);
      }, "@tracked can only be used directly as a native decorator. If you're using tracked in classic classes, add parenthesis to call it like a function: tracked()");
    }

    [`@test errors on any keys besides 'value', 'get', or 'set' being passed`]() {
      expectAssertion(() => {
        class Tracked {
          get full() {
            return `${this.first} ${this.last}`;
          }

        }

        defineProperty(Tracked.prototype, 'first', tracked({
          foo() {}

        }));
      }, "The options object passed to tracked() may only contain a 'value' or 'initializer' property, not both. Received: [foo]");
    }

    [`@test errors if 'value' and 'get'/'set' are passed together`]() {
      expectAssertion(() => {
        class Tracked {
          get full() {
            return `${this.first} ${this.last}`;
          }

        }

        defineProperty(Tracked.prototype, 'first', tracked({
          value: 123,
          initializer: () => 123
        }));
      }, "The options object passed to tracked() may only contain a 'value' or 'initializer' property, not both. Received: [value,initializer]");
    }

    [`@test errors on anything besides an options object being passed`]() {
      expectAssertion(() => {
        class Tracked {
          get full() {
            return `${this.first} ${this.last}`;
          }

        }

        defineProperty(Tracked.prototype, 'first', tracked(null));
      }, "tracked() may only receive an options object containing 'value' or 'initializer', received null");
    }

  });

  if (EMBER_NATIVE_DECORATOR_SUPPORT) {
    moduleFor('@tracked decorator - native decorator behavior', class extends AbstractTestCase {
      [`@test errors if options are passed to native decorator`]() {
        expectAssertion(() => {
          var _dec, _class, _descriptor, _temp;

          let Tracked = (_dec = tracked(), (_class = (_temp = class Tracked {
            constructor() {
              _initializerDefineProperty(this, "first", _descriptor, this);
            }

            get full() {
              return `${this.first} ${this.last}`;
            }

          }, _temp), (_descriptor = _applyDecoratedDescriptor(_class.prototype, "first", [_dec], {
            configurable: true,
            enumerable: true,
            writable: true,
            initializer: null
          })), _class));
          new Tracked();
        }, "You attempted to set a default value for first with the @tracked({ value: 'default' }) syntax. You can only use this syntax with classic classes. For native classes, you can use class initializers: @tracked field = 'default';");
      }

      [`@test errors if options are passed to native decorator (GH#17764)`](assert) {
        var _class3, _descriptor2, _temp2;

        let Tracked = (_class3 = (_temp2 = class Tracked {
          constructor() {
            _initializerDefineProperty(this, "value", _descriptor2, this);
          }

        }, _temp2), (_descriptor2 = _applyDecoratedDescriptor(_class3.prototype, "value", [tracked], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class3);
        let obj = new Tracked();
        assert.strictEqual(obj.value, undefined, 'uninitilized value defaults to undefined');
      }

    });
  } else {
    moduleFor('@tracked decorator - native decorator behavior', class extends AbstractTestCase {
      [`@test errors if used as a native decorator`]() {
        expectAssertion(() => {
          var _class5, _descriptor3, _temp3;

          let Tracked = (_class5 = (_temp3 = class Tracked {
            constructor() {
              _initializerDefineProperty(this, "first", _descriptor3, this);
            }

          }, _temp3), (_descriptor3 = _applyDecoratedDescriptor(_class5.prototype, "first", [tracked], {
            configurable: true,
            enumerable: true,
            writable: true,
            initializer: null
          })), _class5);
          new Tracked();
        }, 'Native decorators are not enabled without the EMBER_NATIVE_DECORATOR_SUPPORT flag');
      }

    });
  }
}