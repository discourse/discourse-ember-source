function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and set to use loose mode. ' + 'To use proposal-class-properties in spec mode with decorators, wait for ' + 'the next major version of decorators in stage 2.'); }

import { Object as EmberObject } from '@ember/-internals/runtime';
import { computed, get, set, setProperties } from '..';
import { moduleFor, AbstractTestCase } from 'internal-test-helpers';
import { EMBER_NATIVE_DECORATOR_SUPPORT } from '@ember/canary-features';

if (EMBER_NATIVE_DECORATOR_SUPPORT) {
  moduleFor('computed - decorator - compatibility', class extends AbstractTestCase {
    ['@test computed can be used to compose new decorators'](assert) {
      var _class, _descriptor, _temp;

      let firstName = 'Diana';
      let firstNameAlias = computed('firstName', {
        get() {
          return this.firstName;
        }

      });
      let Class1 = (_class = (_temp = class Class1 {
        constructor() {
          this.firstName = firstName;

          _initializerDefineProperty(this, "otherFirstName", _descriptor, this);
        }

      }, _temp), (_descriptor = _applyDecoratedDescriptor(_class.prototype, "otherFirstName", [firstNameAlias], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      })), _class);
      let Class2 = EmberObject.extend({
        firstName,
        otherFirstName: firstNameAlias
      });
      let obj1 = new Class1();
      let obj2 = Class2.create();
      assert.equal(firstName, obj1.otherFirstName);
      assert.equal(firstName, obj2.otherFirstName);
    }

    ['@test decorator can still have a configuration object'](assert) {
      var _dec, _class3, _descriptor2, _temp2;

      let Foo = (_dec = computed('foo', {
        get() {
          return this.bar;
        }

      }), (_class3 = (_temp2 = class Foo {
        constructor() {
          this.bar = 'something';
          this.foo = 'else';

          _initializerDefineProperty(this, "baz", _descriptor2, this);
        }

      }, _temp2), (_descriptor2 = _applyDecoratedDescriptor(_class3.prototype, "baz", [_dec], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      })), _class3));
      let obj1 = new Foo();
      assert.equal('something', obj1.baz);
    }

    ['@test it works with functions'](assert) {
      var _dec2, _class5, _descriptor3, _temp3;

      assert.expect(2);
      let Foo = (_dec2 = computed('first', 'last', function () {
        assert.equal(this.first, 'rob');
        assert.equal(this.last, 'jackson');
      }), (_class5 = (_temp3 = class Foo {
        constructor() {
          this.first = 'rob';
          this.last = 'jackson';

          _initializerDefineProperty(this, "fullName", _descriptor3, this);
        }

      }, _temp3), (_descriptor3 = _applyDecoratedDescriptor(_class5.prototype, "fullName", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      })), _class5));
      let obj = new Foo();
      get(obj, 'fullName');
    }

    ['@test computed property can be defined and accessed on a class constructor'](assert) {
      var _class7, _class8, _temp4;

      let count = 0;
      let Obj = (_class7 = (_temp4 = _class8 = class Obj {
        static get foo() {
          count++;
          return this.bar;
        }

      }, _class8.bar = 123, _temp4), (_applyDecoratedDescriptor(_class7, "foo", [computed], Object.getOwnPropertyDescriptor(_class7, "foo"), _class7)), _class7);
      assert.equal(Obj.foo, 123, 'should return value');
      Obj.foo;
      assert.equal(count, 1, 'should only call getter once');
    }

    ['@test it works with computed desc'](assert) {
      var _dec3, _class9, _descriptor4, _temp5;

      assert.expect(4);
      let expectedName = 'rob jackson';
      let expectedFirst = 'rob';
      let expectedLast = 'jackson';
      let Foo = (_dec3 = computed('first', 'last', {
        get() {
          assert.equal(this.first, expectedFirst, 'getter: first name matches');
          assert.equal(this.last, expectedLast, 'getter: last name matches');
          return `${this.first} ${this.last}`;
        },

        set(key, name) {
          assert.equal(name, expectedName, 'setter: name matches');
          let [first, last] = name.split(' ');
          setProperties(this, {
            first,
            last
          });
          return name;
        }

      }), (_class9 = (_temp5 = class Foo {
        constructor() {
          this.first = 'rob';
          this.last = 'jackson';

          _initializerDefineProperty(this, "fullName", _descriptor4, this);
        }

      }, _temp5), (_descriptor4 = _applyDecoratedDescriptor(_class9.prototype, "fullName", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      })), _class9));
      let obj = new Foo();
      get(obj, 'fullName');
      expectedName = 'yehuda katz';
      expectedFirst = 'yehuda';
      expectedLast = 'katz';
      set(obj, 'fullName', 'yehuda katz');
      assert.strictEqual(get(obj, 'fullName'), expectedName, 'return value of getter is new value of property');
    }

    ['@test it throws if it receives a desc and decorates a getter/setter']() {
      expectAssertion(() => {
        var _dec4, _class11, _temp6;

        let Foo = (_dec4 = computed('bar', {
          get() {
            return this.bar;
          }

        }), (_class11 = (_temp6 = class Foo {
          constructor() {
            this.bar = void 0;
          }

          set foo(value) {
            set(this, 'bar', value);
          }

        }, _temp6), (_applyDecoratedDescriptor(_class11.prototype, "foo", [_dec4], Object.getOwnPropertyDescriptor(_class11.prototype, "foo"), _class11.prototype)), _class11));
        new Foo();
      }, /Attempted to apply a computed property that already has a getter\/setter to a foo, but it is a method or an accessor./);
    }

    ['@test it throws if a CP is passed to it']() {
      expectAssertion(() => {
        var _dec5, _class13, _descriptor5, _temp7;

        let Foo = (_dec5 = computed('bar', computed({
          get() {
            return this._foo;
          }

        })), (_class13 = (_temp7 = class Foo {
          constructor() {
            this.bar = void 0;

            _initializerDefineProperty(this, "foo", _descriptor5, this);
          }

        }, _temp7), (_descriptor5 = _applyDecoratedDescriptor(_class13.prototype, "foo", [_dec5], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class13));
        new Foo();
      }, 'You attempted to pass a computed property instance to computed(). Computed property instances are decorator functions, and cannot be passed to computed() because they cannot be turned into decorators twice');
    }

  });
  moduleFor('computed - decorator - usage tests', class extends AbstractTestCase {
    ['@test computed property asserts the presence of a getter']() {
      expectAssertion(() => {
        var _dec6, _class15;

        let TestObj = (_dec6 = computed(), (_class15 = class TestObj {
          nonGetter() {
            return true;
          }

        }, (_applyDecoratedDescriptor(_class15.prototype, "nonGetter", [_dec6], Object.getOwnPropertyDescriptor(_class15.prototype, "nonGetter"), _class15.prototype)), _class15));
        new TestObj();
      }, /Try converting it to a getter/);
    }

    ['@test computed property works with a getter'](assert) {
      var _class16;

      let TestObj = (_class16 = class TestObj {
        get someGetter() {
          return true;
        }

      }, (_applyDecoratedDescriptor(_class16.prototype, "someGetter", [computed], Object.getOwnPropertyDescriptor(_class16.prototype, "someGetter"), _class16.prototype)), _class16);
      let instance = new TestObj();
      assert.ok(instance.someGetter);
    }

    ['@test computed property with dependent key and getter'](assert) {
      var _dec7, _class17, _temp8;

      let TestObj = (_dec7 = computed('other'), (_class17 = (_temp8 = class TestObj {
        constructor() {
          this.other = true;
        }

        get someGetter() {
          return `${this.other}`;
        }

      }, _temp8), (_applyDecoratedDescriptor(_class17.prototype, "someGetter", [_dec7], Object.getOwnPropertyDescriptor(_class17.prototype, "someGetter"), _class17.prototype)), _class17));
      let instance = new TestObj();
      assert.equal(instance.someGetter, 'true');
      set(instance, 'other', false);
      assert.equal(instance.someGetter, 'false');
    }

    ['@test computed property can be accessed without `get`'](assert) {
      var _dec8, _class19;

      let count = 0;
      let Obj = (_dec8 = computed(), (_class19 = class Obj {
        get foo() {
          count++;
          return `computed foo`;
        }

      }, (_applyDecoratedDescriptor(_class19.prototype, "foo", [_dec8], Object.getOwnPropertyDescriptor(_class19.prototype, "foo"), _class19.prototype)), _class19));
      let obj = new Obj();
      assert.equal(obj.foo, 'computed foo', 'should return value');
      assert.equal(count, 1, 'should have invoked computed property');
    }

    ['@test defining computed property should invoke property on get'](assert) {
      var _dec9, _class20;

      let count = 0;
      let Obj = (_dec9 = computed(), (_class20 = class Obj {
        get foo() {
          count++;
          return `computed foo`;
        }

      }, (_applyDecoratedDescriptor(_class20.prototype, "foo", [_dec9], Object.getOwnPropertyDescriptor(_class20.prototype, "foo"), _class20.prototype)), _class20));
      let obj = new Obj();
      assert.equal(obj.foo, 'computed foo', 'should return value');
      assert.equal(count, 1, 'should have invoked computed property');
    }

    ['@test setter is invoked with correct parameters'](assert) {
      var _dec10, _class21, _temp9;

      let count = 0;
      let Obj = (_dec10 = computed(), (_class21 = (_temp9 = class Obj {
        constructor() {
          this.__foo = 'not set';
        }

        get foo() {
          return this.__foo;
        }

        set foo(value) {
          count++;
          this.__foo = `computed ${value}`;
        }

      }, _temp9), (_applyDecoratedDescriptor(_class21.prototype, "foo", [_dec10], Object.getOwnPropertyDescriptor(_class21.prototype, "foo"), _class21.prototype)), _class21));
      let obj = new Obj();
      assert.equal(set(obj, 'foo', 'bar'), 'bar', 'should return set value with set()');
      assert.equal(count, 1, 'should have invoked computed property');
      assert.equal(get(obj, 'foo'), 'computed bar', 'should return new value with get()');
    }

    ['@test when not returning from setter, getter is called'](assert) {
      var _dec11, _class23, _temp10;

      let count = 0;
      let Obj = (_dec11 = computed(), (_class23 = (_temp10 = class Obj {
        constructor() {
          this.__foo = 'not set';
        }

        get foo() {
          count++;
          return this.__foo;
        }

        set foo(value) {
          this.__foo = `computed ${value}`;
        }

      }, _temp10), (_applyDecoratedDescriptor(_class23.prototype, "foo", [_dec11], Object.getOwnPropertyDescriptor(_class23.prototype, "foo"), _class23.prototype)), _class23));
      let obj = new Obj();
      assert.equal(set(obj, 'foo', 'bar'), 'bar', 'should return set value with set()');
      assert.equal(count, 1, 'should have invoked getter');
    }

    ['@test when returning from setter, getter is not called'](assert) {
      var _dec12, _class25, _temp11;

      let count = 0;
      let Obj = (_dec12 = computed(), (_class25 = (_temp11 = class Obj {
        constructor() {
          this.__foo = 'not set';
        }

        get foo() {
          count++;
          return this.__foo;
        }

        set foo(value) {
          this.__foo = `computed ${value}`;
          return this.__foo;
        }

      }, _temp11), (_applyDecoratedDescriptor(_class25.prototype, "foo", [_dec12], Object.getOwnPropertyDescriptor(_class25.prototype, "foo"), _class25.prototype)), _class25));
      let obj = new Obj();
      assert.equal(set(obj, 'foo', 'bar'), 'bar', 'should return set value with set()');
      assert.equal(count, 0, 'should not have invoked getter');
    }

    ['@test throws if a value is decorated twice']() {
      expectAssertion(() => {
        var _class27;

        let Obj = (_class27 = class Obj {
          get foo() {
            return this._foo;
          }

        }, (_applyDecoratedDescriptor(_class27.prototype, "foo", [computed, computed], Object.getOwnPropertyDescriptor(_class27.prototype, "foo"), _class27.prototype)), _class27);
        new Obj();
      }, "Only one computed property decorator can be applied to a class field or accessor, but 'foo' was decorated twice. You may have added the decorator to both a getter and setter, which is unecessary.");
    }

  });
} else {
  moduleFor('computed - decorator - disabled', class extends AbstractTestCase {
    ['@test using a native decorator throws if the feature flag is disabled']() {
      expectAssertion(() => {
        var _dec13, _class28, _descriptor6, _temp12;

        let Foo = (_dec13 = computed('foo', {
          get() {
            return this.bar;
          }

        }), (_class28 = (_temp12 = class Foo {
          constructor() {
            _initializerDefineProperty(this, "baz", _descriptor6, this);
          }

        }, _temp12), (_descriptor6 = _applyDecoratedDescriptor(_class28.prototype, "baz", [_dec13], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class28));
        new Foo();
      }, 'Native decorators are not enabled without the EMBER_NATIVE_DECORATOR_SUPPORT flag');
    }

  });
}