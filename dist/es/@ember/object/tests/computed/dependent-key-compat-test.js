function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and set to use loose mode. ' + 'To use proposal-class-properties in spec mode with decorators, wait for ' + 'the next major version of decorators in stage 2.'); }

import { EMBER_METAL_TRACKED_PROPERTIES } from '@ember/canary-features';
import { Object as EmberObject } from '@ember/-internals/runtime';
import { computed, tracked, observer } from '@ember/-internals/metal';
import { dependentKeyCompat } from '../../compat';
import { moduleFor, AbstractTestCase, runLoopSettled } from 'internal-test-helpers';

if (EMBER_METAL_TRACKED_PROPERTIES) {
  moduleFor('dependentKeyCompat', class extends AbstractTestCase {
    '@test it works with computed properties'(assert) {
      var _dec, _class, _descriptor, _descriptor2, _temp;

      let Person = (_dec = computed('givenName', 'lastName'), (_class = (_temp = class Person {
        constructor() {
          _initializerDefineProperty(this, "firstName", _descriptor, this);

          _initializerDefineProperty(this, "lastName", _descriptor2, this);
        }

        get givenName() {
          return this.firstName;
        }

        get fullName() {
          return `${this.givenName} ${this.lastName}`;
        }

      }, _temp), (_descriptor = _applyDecoratedDescriptor(_class.prototype, "firstName", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 'Tom';
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, "lastName", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return 'Dale';
        }
      }), _applyDecoratedDescriptor(_class.prototype, "givenName", [dependentKeyCompat], Object.getOwnPropertyDescriptor(_class.prototype, "givenName"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "fullName", [_dec], Object.getOwnPropertyDescriptor(_class.prototype, "fullName"), _class.prototype)), _class));
      let tom = new Person();
      assert.equal(tom.fullName, 'Tom Dale');
      tom.firstName = 'Thomas';
      assert.equal(tom.fullName, 'Thomas Dale');
    }

    '@test it works with classic classes'(assert) {
      let Person = EmberObject.extend({
        firstName: tracked({
          value: 'Tom'
        }),
        lastName: tracked({
          value: 'Dale'
        }),
        givenName: dependentKeyCompat({
          get() {
            return this.firstName;
          }

        }),
        fullName: computed('givenName', 'lastName', function () {
          return `${this.givenName} ${this.lastName}`;
        })
      });
      let tom = Person.create();
      assert.equal(tom.fullName, 'Tom Dale');
      tom.firstName = 'Thomas';
      assert.equal(tom.fullName, 'Thomas Dale');
    }

    async '@test it works with async observers'(assert) {
      let count = 0;
      let Person = EmberObject.extend({
        firstName: tracked({
          value: 'Tom'
        }),
        lastName: tracked({
          value: 'Dale'
        }),
        givenName: dependentKeyCompat({
          get() {
            return this.firstName;
          }

        }),
        givenNameObserver: observer({
          dependentKeys: ['givenName'],

          fn() {
            count++;
          },

          sync: false
        })
      });
      let tom = Person.create();
      assert.equal(count, 0);
      tom.firstName = 'Thomas';
      await runLoopSettled();
      assert.equal(count, 1);
    }

    '@test it does not work with sync observers'(assert) {
      let count = 0;
      let Person = EmberObject.extend({
        firstName: tracked({
          value: 'Tom'
        }),
        lastName: tracked({
          value: 'Dale'
        }),
        givenName: dependentKeyCompat({
          get() {
            return this.firstName;
          }

        }),
        givenNameObserver: observer({
          dependentKeys: ['givenName'],

          fn() {
            count++;
          },

          sync: true
        })
      });
      let tom = Person.create();
      assert.equal(count, 0);
      tom.firstName = 'Thomas';
      assert.equal(count, 0);
    }

  });
}