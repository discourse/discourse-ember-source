function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and set to use loose mode. ' + 'To use proposal-class-properties in spec mode with decorators, wait for ' + 'the next major version of decorators in stage 2.'); }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

import { EMBER_NATIVE_DECORATOR_SUPPORT } from '@ember/canary-features';
import { Component } from '@ember/-internals/glimmer';
import { Object as EmberObject } from '@ember/-internals/runtime';
import { moduleFor, RenderingTestCase, strip } from 'internal-test-helpers';
import { action } from '../index';

if (EMBER_NATIVE_DECORATOR_SUPPORT) {
  moduleFor('@action decorator', class extends RenderingTestCase {
    '@test action decorator works with ES6 class'(assert) {
      var _class;

      let FooComponent = (_class = class FooComponent extends Component {
        foo() {
          assert.ok(true, 'called!');
        }

      }, (_applyDecoratedDescriptor(_class.prototype, "foo", [action], Object.getOwnPropertyDescriptor(_class.prototype, "foo"), _class.prototype)), _class);
      this.registerComponent('foo-bar', {
        ComponentClass: FooComponent,
        template: "<button {{action 'foo'}}>Click Me!</button>"
      });
      this.render('{{foo-bar}}');
      this.$('button').click();
    }

    '@test action decorator does not add actions to superclass'(assert) {
      var _class2, _class3;

      let Foo = (_class2 = class Foo extends EmberObject {
        foo() {// Do nothing
        }

      }, (_applyDecoratedDescriptor(_class2.prototype, "foo", [action], Object.getOwnPropertyDescriptor(_class2.prototype, "foo"), _class2.prototype)), _class2);
      let Bar = (_class3 = class Bar extends Foo {
        bar() {
          assert.ok(false, 'called');
        }

      }, (_applyDecoratedDescriptor(_class3.prototype, "bar", [action], Object.getOwnPropertyDescriptor(_class3.prototype, "bar"), _class3.prototype)), _class3);
      let foo = Foo.create();
      let bar = Bar.create();
      assert.equal(typeof foo.actions.foo, 'function', 'foo has foo action');
      assert.equal(typeof foo.actions.bar, 'undefined', 'foo does not have bar action');
      assert.equal(typeof bar.actions.foo, 'function', 'bar has foo action');
      assert.equal(typeof bar.actions.bar, 'function', 'bar has bar action');
    }

    '@test actions are properly merged through traditional and ES6 prototype hierarchy'(assert) {
      var _class4, _class5;

      assert.expect(4);
      let FooComponent = Component.extend({
        actions: {
          foo() {
            assert.ok(true, 'foo called!');
          }

        }
      });
      let BarComponent = (_class4 = class BarComponent extends FooComponent {
        bar() {
          assert.ok(true, 'bar called!');
        }

      }, (_applyDecoratedDescriptor(_class4.prototype, "bar", [action], Object.getOwnPropertyDescriptor(_class4.prototype, "bar"), _class4.prototype)), _class4);
      let BazComponent = BarComponent.extend({
        actions: {
          baz() {
            assert.ok(true, 'baz called!');
          }

        }
      });
      let QuxComponent = (_class5 = class QuxComponent extends BazComponent {
        qux() {
          assert.ok(true, 'qux called!');
        }

      }, (_applyDecoratedDescriptor(_class5.prototype, "qux", [action], Object.getOwnPropertyDescriptor(_class5.prototype, "qux"), _class5.prototype)), _class5);
      this.registerComponent('qux-component', {
        ComponentClass: QuxComponent,
        template: strip`
            <button {{action 'foo'}}>Click Foo!</button>
            <button {{action 'bar'}}>Click Bar!</button>
            <button {{action 'baz'}}>Click Baz!</button>
            <button {{action 'qux'}}>Click Qux!</button>
          `
      });
      this.render('{{qux-component}}');
      this.$('button').click();
    }

    '@test action decorator super works with native class methods'(assert) {
      var _class6;

      class FooComponent extends Component {
        foo() {
          assert.ok(true, 'called!');
        }

      }

      let BarComponent = (_class6 = class BarComponent extends FooComponent {
        foo() {
          super.foo();
        }

      }, (_applyDecoratedDescriptor(_class6.prototype, "foo", [action], Object.getOwnPropertyDescriptor(_class6.prototype, "foo"), _class6.prototype)), _class6);
      this.registerComponent('bar-bar', {
        ComponentClass: BarComponent,
        template: "<button {{action 'foo'}}>Click Me!</button>"
      });
      this.render('{{bar-bar}}');
      this.$('button').click();
    }

    '@test action decorator super works with traditional class methods'(assert) {
      var _class7;

      let FooComponent = Component.extend({
        foo() {
          assert.ok(true, 'called!');
        }

      });
      let BarComponent = (_class7 = class BarComponent extends FooComponent {
        foo() {
          super.foo();
        }

      }, (_applyDecoratedDescriptor(_class7.prototype, "foo", [action], Object.getOwnPropertyDescriptor(_class7.prototype, "foo"), _class7.prototype)), _class7);
      this.registerComponent('bar-bar', {
        ComponentClass: BarComponent,
        template: "<button {{action 'foo'}}>Click Me!</button>"
      });
      this.render('{{bar-bar}}');
      this.$('button').click();
    } // This test fails with _classes_ compiled in loose mode


    '@skip action decorator works with parent native class actions'(assert) {
      var _class8, _class9;

      let FooComponent = (_class8 = class FooComponent extends Component {
        foo() {
          assert.ok(true, 'called!');
        }

      }, (_applyDecoratedDescriptor(_class8.prototype, "foo", [action], Object.getOwnPropertyDescriptor(_class8.prototype, "foo"), _class8.prototype)), _class8);
      let BarComponent = (_class9 = class BarComponent extends FooComponent {
        foo() {
          super.foo();
        }

      }, (_applyDecoratedDescriptor(_class9.prototype, "foo", [action], Object.getOwnPropertyDescriptor(_class9.prototype, "foo"), _class9.prototype)), _class9);
      this.registerComponent('bar-bar', {
        ComponentClass: BarComponent,
        template: "<button {{action 'foo'}}>Click Me!</button>"
      });
      this.render('{{bar-bar}}');
      this.$('button').click();
    }

    '@test action decorator binds functions'(assert) {
      var _class10, _temp;

      let FooComponent = (_class10 = (_temp = class FooComponent extends Component {
        constructor(...args) {
          super(...args);
          this.bar = 'some value';
        }

        foo() {
          assert.equal(this.bar, 'some value', 'context bound correctly');
        }

      }, _temp), (_applyDecoratedDescriptor(_class10.prototype, "foo", [action], Object.getOwnPropertyDescriptor(_class10.prototype, "foo"), _class10.prototype)), _class10);
      this.registerComponent('foo-bar', {
        ComponentClass: FooComponent,
        template: '<button onclick={{this.foo}}>Click Me!</button>'
      });
      this.render('{{foo-bar}}');
      this.$('button').click();
    } // This test fails with _classes_ compiled in loose mode


    '@skip action decorator super works correctly when bound'(assert) {
      var _class12, _temp2, _class14;

      let FooComponent = (_class12 = (_temp2 = class FooComponent extends Component {
        constructor(...args) {
          super(...args);
          this.bar = 'some value';
        }

        foo() {
          assert.equal(this.bar, 'some value', 'context bound correctly');
        }

      }, _temp2), (_applyDecoratedDescriptor(_class12.prototype, "foo", [action], Object.getOwnPropertyDescriptor(_class12.prototype, "foo"), _class12.prototype)), _class12);
      let BarComponent = (_class14 = class BarComponent extends FooComponent {
        foo() {
          super.foo();
        }

      }, (_applyDecoratedDescriptor(_class14.prototype, "foo", [action], Object.getOwnPropertyDescriptor(_class14.prototype, "foo"), _class14.prototype)), _class14);
      this.registerComponent('bar-bar', {
        ComponentClass: BarComponent,
        template: '<button onclick={{this.foo}}>Click Me!</button>'
      });
      this.render('{{bar-bar}}');
      this.$('button').click();
    }

    '@test action decorator throws an error if applied to non-methods'() {
      expectAssertion(() => {
        var _class15, _descriptor, _temp3;

        let TestObject = (_class15 = (_temp3 = class TestObject extends EmberObject {
          constructor(...args) {
            super(...args);

            _initializerDefineProperty(this, "foo", _descriptor, this);
          }

        }, _temp3), (_descriptor = _applyDecoratedDescriptor(_class15.prototype, "foo", [action], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: function () {
            return 'bar';
          }
        })), _class15);
        new TestObject();
      }, /The @action decorator must be applied to methods/);
    }

    '@test action decorator throws an error if passed a function in native classes'() {
      expectAssertion(() => {
        var _dec, _class17, _descriptor2, _temp4;

        let TestObject = (_dec = action(function () {}), (_class17 = (_temp4 = class TestObject extends EmberObject {
          constructor(...args) {
            super(...args);

            _initializerDefineProperty(this, "foo", _descriptor2, this);
          }

        }, _temp4), (_descriptor2 = _applyDecoratedDescriptor(_class17.prototype, "foo", [_dec], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: function () {
            return 'bar';
          }
        })), _class17));
        new TestObject();
      }, /The @action decorator may only be passed a method when used in classic classes/);
    }

    '@test action decorator can be used as a classic decorator with strings'(assert) {
      let FooComponent = Component.extend({
        foo: action(function () {
          assert.ok(true, 'called!');
        })
      });
      this.registerComponent('foo-bar', {
        ComponentClass: FooComponent,
        template: "<button {{action 'foo'}}>Click Me!</button>"
      });
      this.render('{{foo-bar}}');
      this.$('button').click();
    }

    '@test action decorator can be used as a classic decorator directly'(assert) {
      let FooComponent = Component.extend({
        foo: action(function () {
          assert.ok(true, 'called!');
        })
      });
      this.registerComponent('foo-bar', {
        ComponentClass: FooComponent,
        template: '<button onclick={{this.foo}}>Click Me!</button>'
      });
      this.render('{{foo-bar}}');
      this.$('button').click();
    }

  });
}