function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and set to use loose mode. ' + 'To use proposal-class-properties in spec mode with decorators, wait for ' + 'the next major version of decorators in stage 2.'); }

import { EMBER_NATIVE_DECORATOR_SUPPORT } from '@ember/canary-features';
import Service, { inject as injectService } from '@ember/service';
import { Object as EmberObject } from '@ember/-internals/runtime';
import { buildOwner } from 'internal-test-helpers';
import { moduleFor, AbstractTestCase } from 'internal-test-helpers';

if (EMBER_NATIVE_DECORATOR_SUPPORT) {
  moduleFor('inject - decorator', class extends AbstractTestCase {
    ['@test works with native decorators'](assert) {
      var _dec, _class, _descriptor, _temp;

      let owner = buildOwner();

      class MainService extends Service {}

      let Foo = (_dec = injectService('main'), (_class = (_temp = class Foo extends EmberObject {
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
      owner.register('service:main', MainService);
      owner.register('foo:main', Foo);
      let foo = owner.lookup('foo:main');
      assert.ok(foo.main instanceof Service, 'service injected correctly');
    }

    ['@test uses the decorated property key if not provided'](assert) {
      var _class3, _descriptor2, _temp2;

      let owner = buildOwner();

      class MainService extends Service {}

      let Foo = (_class3 = (_temp2 = class Foo extends EmberObject {
        constructor(...args) {
          super(...args);

          _initializerDefineProperty(this, "main", _descriptor2, this);
        }

      }, _temp2), (_descriptor2 = _applyDecoratedDescriptor(_class3.prototype, "main", [injectService], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      })), _class3);
      owner.register('service:main', MainService);
      owner.register('foo:main', Foo);
      let foo = owner.lookup('foo:main');
      assert.ok(foo.main instanceof Service, 'service injected correctly');
    }

  });
}