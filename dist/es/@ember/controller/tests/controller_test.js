function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and set to use loose mode. ' + 'To use proposal-class-properties in spec mode with decorators, wait for ' + 'the next major version of decorators in stage 2.'); }

import Controller, { inject as injectController } from '@ember/controller';
import { EMBER_NATIVE_DECORATOR_SUPPORT } from '@ember/canary-features';
import Service, { inject as injectService } from '@ember/service';
import { Object as EmberObject } from '@ember/-internals/runtime';
import { Mixin, get } from '@ember/-internals/metal';
import { runDestroy, buildOwner } from 'internal-test-helpers';
import { moduleFor, AbstractTestCase } from 'internal-test-helpers';
moduleFor('Controller event handling', class extends AbstractTestCase {
  ['@test Action can be handled by a function on actions object'](assert) {
    assert.expect(1);
    let TestController = Controller.extend({
      actions: {
        poke() {
          assert.ok(true, 'poked');
        }

      }
    });
    let controller = TestController.create();
    controller.send('poke');
  }

  ['@test A handled action can be bubbled to the target for continued processing'](assert) {
    assert.expect(2);
    let TestController = Controller.extend({
      actions: {
        poke() {
          assert.ok(true, 'poked 1');
          return true;
        }

      }
    });
    let controller = TestController.create({
      target: Controller.extend({
        actions: {
          poke() {
            assert.ok(true, 'poked 2');
          }

        }
      }).create()
    });
    controller.send('poke');
  }

  ["@test Action can be handled by a superclass' actions object"](assert) {
    assert.expect(4);
    let SuperController = Controller.extend({
      actions: {
        foo() {
          assert.ok(true, 'foo');
        },

        bar(msg) {
          assert.equal(msg, 'HELLO');
        }

      }
    });
    let BarControllerMixin = Mixin.create({
      actions: {
        bar(msg) {
          assert.equal(msg, 'HELLO');

          this._super(msg);
        }

      }
    });
    let IndexController = SuperController.extend(BarControllerMixin, {
      actions: {
        baz() {
          assert.ok(true, 'baz');
        }

      }
    });
    let controller = IndexController.create({});
    controller.send('foo');
    controller.send('bar', 'HELLO');
    controller.send('baz');
  }

  ['@test .send asserts if called on a destroyed controller']() {
    let owner = buildOwner();
    owner.register('controller:application', Controller.extend({
      toString() {
        return 'controller:rip-alley';
      }

    }));
    let controller = owner.lookup('controller:application');
    runDestroy(owner);
    expectAssertion(() => {
      controller.send('trigger-me-dead');
    }, "Attempted to call .send() with the action 'trigger-me-dead' on the destroyed object 'controller:rip-alley'.");
  }

});
moduleFor('Controller deprecations -> Controller Content -> Model Alias', class extends AbstractTestCase {
  ['@test `content` is not moved to `model` when `model` is unset'](assert) {
    assert.expect(2);
    let controller;
    ignoreDeprecation(function () {
      controller = Controller.extend({
        content: 'foo-bar'
      }).create();
    });
    assert.notEqual(controller.get('model'), 'foo-bar', 'model is set properly');
    assert.equal(controller.get('content'), 'foo-bar', 'content is not set properly');
  }

  ['@test specifying `content` (without `model` specified) does not result in deprecation'](assert) {
    assert.expect(2);
    expectNoDeprecation();
    let controller = Controller.extend({
      content: 'foo-bar'
    }).create();
    assert.equal(get(controller, 'content'), 'foo-bar');
  }

  ['@test specifying `content` (with `model` specified) does not result in deprecation'](assert) {
    assert.expect(3);
    expectNoDeprecation();
    let controller = Controller.create({
      content: 'foo-bar',
      model: 'blammo'
    });
    assert.equal(get(controller, 'content'), 'foo-bar');
    assert.equal(get(controller, 'model'), 'blammo');
  }

});
moduleFor('Controller deprecations -> Controller injected properties', class extends AbstractTestCase {
  ['@test defining a controller on a non-controller should fail assertion']() {
    expectAssertion(function () {
      let owner = buildOwner();
      let AnObject = EmberObject.extend({
        foo: injectController('bar')
      });
      owner.register('controller:bar', EmberObject.extend());
      owner.register('foo:main', AnObject);
      owner.lookup('foo:main');
    }, /Defining `foo` as an injected controller property on a non-controller \(`foo:main`\) is not allowed/);
  }

  ['@test controllers can be injected into controllers'](assert) {
    let owner = buildOwner();
    owner.register('controller:post', Controller.extend({
      postsController: injectController('posts')
    }));
    owner.register('controller:posts', Controller.extend());
    let postController = owner.lookup('controller:post');
    let postsController = owner.lookup('controller:posts');
    assert.equal(postsController, postController.get('postsController'), 'controller.posts is injected');
  }

  ['@test services can be injected into controllers'](assert) {
    let owner = buildOwner();
    owner.register('controller:application', Controller.extend({
      authService: injectService('auth')
    }));
    owner.register('service:auth', Service.extend());
    let appController = owner.lookup('controller:application');
    let authService = owner.lookup('service:auth');
    assert.equal(authService, appController.get('authService'), 'service.auth is injected');
  }

});

if (EMBER_NATIVE_DECORATOR_SUPPORT) {
  moduleFor('Controller Injections', class extends AbstractTestCase {
    ['@test works with native decorators'](assert) {
      var _dec, _class, _descriptor, _temp;

      let owner = buildOwner();

      class MainController extends Controller {}

      let IndexController = (_dec = injectController('main'), (_class = (_temp = class IndexController extends Controller {
        constructor(...args) {
          super(...args);

          _initializerDefineProperty(this, "main", _descriptor, this);
        }

      }, _temp), (_descriptor = _applyDecoratedDescriptor(_class.prototype, "main", [_dec], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      })), _class));
      owner.register('controller:main', MainController);
      owner.register('controller:index', IndexController);
      let index = owner.lookup('controller:index');
      assert.ok(index.main instanceof Controller, 'controller injected correctly');
    }

    ['@test uses the decorated property key if not provided'](assert) {
      var _class3, _descriptor2, _temp2;

      let owner = buildOwner();

      class MainController extends Controller {}

      let IndexController = (_class3 = (_temp2 = class IndexController extends Controller {
        constructor(...args) {
          super(...args);

          _initializerDefineProperty(this, "main", _descriptor2, this);
        }

      }, _temp2), (_descriptor2 = _applyDecoratedDescriptor(_class3.prototype, "main", [injectController], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      })), _class3);
      owner.register('controller:main', MainController);
      owner.register('controller:index', IndexController);
      let index = owner.lookup('controller:index');
      assert.ok(index.main instanceof Controller, 'controller injected correctly');
    }

  });
}