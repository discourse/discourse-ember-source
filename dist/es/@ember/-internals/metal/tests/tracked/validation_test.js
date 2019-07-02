function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and set to use loose mode. ' + 'To use proposal-class-properties in spec mode with decorators, wait for ' + 'the next major version of decorators in stage 2.'); }

import { computed, defineProperty, get, set, tagForProperty, tracked } from '../..';
import { EMBER_METAL_TRACKED_PROPERTIES, EMBER_NATIVE_DECORATOR_SUPPORT } from '@ember/canary-features';
import { AbstractTestCase, moduleFor } from 'internal-test-helpers';
import { track } from './support';

if (EMBER_METAL_TRACKED_PROPERTIES && EMBER_NATIVE_DECORATOR_SUPPORT) {
  moduleFor('@tracked get validation', class extends AbstractTestCase {
    [`@test autotracking should work with tracked fields`](assert) {
      var _class, _descriptor, _temp;

      let Tracked = (_class = (_temp = class Tracked {
        constructor(first) {
          _initializerDefineProperty(this, "first", _descriptor, this);

          this.first = first;
        }

      }, _temp), (_descriptor = _applyDecoratedDescriptor(_class.prototype, "first", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return undefined;
        }
      })), _class);
      let obj = new Tracked('Tom', 'Dale');
      let tag = track(() => obj.first);
      let snapshot = tag.value();
      assert.equal(obj.first, 'Tom', 'The full name starts correct');
      assert.equal(tag.validate(snapshot), true);
      snapshot = tag.value();
      assert.equal(tag.validate(snapshot), true);
      obj.first = 'Thomas';
      assert.equal(tag.validate(snapshot), false);
      assert.equal(obj.first, 'Thomas');
      snapshot = tag.value();
      assert.equal(tag.validate(snapshot), true);
    }

    [`@test autotracking should work with native getters`](assert) {
      var _class3, _descriptor2, _descriptor3, _temp2;

      let Tracked = (_class3 = (_temp2 = class Tracked {
        constructor(first, last) {
          _initializerDefineProperty(this, "first", _descriptor2, this);

          _initializerDefineProperty(this, "last", _descriptor3, this);

          this.first = first;
          this.last = last;
        }

        get full() {
          return `${this.first} ${this.last}`;
        }

      }, _temp2), (_descriptor2 = _applyDecoratedDescriptor(_class3.prototype, "first", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return undefined;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class3.prototype, "last", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return undefined;
        }
      })), _class3);
      let obj = new Tracked('Tom', 'Dale');
      let tag = track(() => obj.full);
      let snapshot = tag.value();
      assert.equal(obj.full, 'Tom Dale', 'The full name starts correct');
      assert.equal(tag.validate(snapshot), true);
      snapshot = tag.value();
      assert.equal(tag.validate(snapshot), true);
      obj.first = 'Thomas';
      assert.equal(tag.validate(snapshot), false);
      assert.equal(obj.full, 'Thomas Dale');
      snapshot = tag.value();
      assert.equal(tag.validate(snapshot), true);
    }

    [`@test autotracking should work with native setters`](assert) {
      var _class5, _descriptor4, _descriptor5, _temp3;

      let Tracked = (_class5 = (_temp3 = class Tracked {
        constructor(first, last) {
          _initializerDefineProperty(this, "first", _descriptor4, this);

          _initializerDefineProperty(this, "last", _descriptor5, this);

          this.first = first;
          this.last = last;
        }

        get full() {
          return `${this.first} ${this.last}`;
        }

        set full(value) {
          let [first, last] = value.split(' ');
          this.first = first;
          this.last = last;
        }

      }, _temp3), (_descriptor4 = _applyDecoratedDescriptor(_class5.prototype, "first", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return undefined;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class5.prototype, "last", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return undefined;
        }
      })), _class5);
      let obj = new Tracked('Tom', 'Dale');
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

    [`@test interaction with Ember object model (tracked property depending on Ember property)`](assert) {
      class Tracked {
        constructor(name) {
          this.name = name;
        }

        get full() {
          return `${get(this, 'name.first')} ${get(this, 'name.last')}`;
        }

      }

      let tom = {
        first: 'Tom',
        last: 'Dale'
      };
      let obj = new Tracked(tom);
      let tag = track(() => obj.full);
      let snapshot = tag.value();
      assert.equal(obj.full, 'Tom Dale');
      assert.equal(tag.validate(snapshot), true);
      snapshot = tag.value();
      assert.equal(tag.validate(snapshot), true);
      set(tom, 'first', 'Thomas');
      assert.equal(tag.validate(snapshot), false, 'invalid after setting with Ember set');
      assert.equal(obj.full, 'Thomas Dale');
      snapshot = tag.value();
      assert.equal(tag.validate(snapshot), true);
      set(obj, 'name', {
        first: 'Ricardo',
        last: 'Mendes'
      });
      assert.equal(tag.validate(snapshot), false, 'invalid after setting with Ember set');
      assert.equal(obj.full, 'Ricardo Mendes');
      snapshot = tag.value();
      assert.equal(tag.validate(snapshot), true);
    }

    [`@test interaction with Ember object model (Ember computed property depending on tracked property)`](assert) {
      var _class7, _descriptor6, _descriptor7, _temp4;

      class EmberObject {
        constructor(name) {
          this.name = name;
        }

      }

      defineProperty(EmberObject.prototype, 'full', computed('name', function () {
        let name = get(this, 'name');
        return `${name.first} ${name.last}`;
      }));
      let Name = (_class7 = (_temp4 = class Name {
        constructor(first, last) {
          _initializerDefineProperty(this, "first", _descriptor6, this);

          _initializerDefineProperty(this, "last", _descriptor7, this);

          this.first = first;
          this.last = last;
        }

      }, _temp4), (_descriptor6 = _applyDecoratedDescriptor(_class7.prototype, "first", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor7 = _applyDecoratedDescriptor(_class7.prototype, "last", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      })), _class7);
      let tom = new Name('Tom', 'Dale');
      let obj = new EmberObject(tom);
      let tag = tagForProperty(obj, 'full');
      let snapshot = tag.value();
      let full = get(obj, 'full');
      assert.equal(full, 'Tom Dale');
      assert.equal(tag.validate(snapshot), true);
      snapshot = tag.value();
      assert.equal(tag.validate(snapshot), true);
      tom.first = 'Thomas';
      assert.equal(tag.validate(snapshot), false, 'invalid after setting with tracked properties');
      assert.equal(get(obj, 'full'), 'Thomas Dale');
      snapshot = tag.value();
      assert.equal(tag.validate(snapshot), true);
    }

    ['@test interaction with the Ember object model (paths going through tracked properties)'](assert) {
      var _class9, _descriptor8, _temp5;

      let self;

      class EmberObject {
        constructor(contact) {
          this.contact = void 0;
          this.contact = contact;
          self = this;
        }

      }

      defineProperty(EmberObject.prototype, 'full', computed('contact.name.first', 'contact.name.last', function () {
        let contact = get(self, 'contact');
        return `${get(contact.name, 'first')} ${get(contact.name, 'last')}`;
      }));
      let Contact = (_class9 = (_temp5 = class Contact {
        constructor(name) {
          _initializerDefineProperty(this, "name", _descriptor8, this);

          this.name = name;
        }

      }, _temp5), (_descriptor8 = _applyDecoratedDescriptor(_class9.prototype, "name", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return undefined;
        }
      })), _class9);

      class EmberName {
        constructor(first, last) {
          this.first = void 0;
          this.last = void 0;
          this.first = first;
          this.last = last;
        }

      }

      let tom = new EmberName('Tom', 'Dale');
      let contact = new Contact(tom);
      let obj = new EmberObject(contact);
      let tag = tagForProperty(obj, 'full');
      let snapshot = tag.value();
      let full = get(obj, 'full');
      assert.equal(full, 'Tom Dale');
      assert.equal(tag.validate(snapshot), true);
      snapshot = tag.value();
      assert.equal(tag.validate(snapshot), true);
      set(tom, 'first', 'Thomas');
      assert.equal(tag.validate(snapshot), false, 'invalid after setting with Ember.set');
      assert.equal(get(obj, 'full'), 'Thomas Dale');
      snapshot = tag.value();
      tom = contact.name = new EmberName('T', 'Dale');
      assert.equal(tag.validate(snapshot), false, 'invalid after setting with Ember.set');
      assert.equal(get(obj, 'full'), 'T Dale');
      snapshot = tag.value();
      set(tom, 'first', 'Tizzle');
      assert.equal(tag.validate(snapshot), false, 'invalid after setting with Ember.set');
      assert.equal(get(obj, 'full'), 'Tizzle Dale');
    }

  });
}