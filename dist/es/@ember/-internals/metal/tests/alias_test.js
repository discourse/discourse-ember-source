function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and set to use loose mode. ' + 'To use proposal-class-properties in spec mode with decorators, wait for ' + 'the next major version of decorators in stage 2.'); }

import { alias, computed, defineProperty, get, set, isWatching, addObserver, removeObserver, tagFor, tagForProperty } from '..';
import { Object as EmberObject } from '@ember/-internals/runtime';
import { EMBER_METAL_TRACKED_PROPERTIES } from '@ember/canary-features';
import { moduleFor, AbstractTestCase, runLoopSettled } from 'internal-test-helpers';
let obj, count;

function incrementCount() {
  count++;
}

moduleFor('@ember/-internals/metal/alias', class extends AbstractTestCase {
  beforeEach() {
    obj = {
      foo: {
        faz: 'FOO'
      }
    };
    count = 0;
  }

  afterEach() {
    obj = null;
  }

  ['@test should proxy get to alt key'](assert) {
    defineProperty(obj, 'bar', alias('foo.faz'));
    assert.equal(get(obj, 'bar'), 'FOO');
  }

  ['@test should proxy set to alt key'](assert) {
    defineProperty(obj, 'bar', alias('foo.faz'));
    set(obj, 'bar', 'BAR');
    assert.equal(get(obj, 'foo.faz'), 'BAR');
  }

  async ['@test old dependent keys should not trigger property changes'](assert) {
    let obj1 = Object.create(null);
    defineProperty(obj1, 'foo', null, null);
    defineProperty(obj1, 'bar', alias('foo'));
    defineProperty(obj1, 'baz', alias('foo'));
    defineProperty(obj1, 'baz', alias('bar')); // redefine baz
    // bootstrap the alias

    obj1.baz;
    addObserver(obj1, 'baz', incrementCount);
    set(obj1, 'foo', 'FOO');
    await runLoopSettled();
    assert.equal(count, 1);
    removeObserver(obj1, 'baz', incrementCount);
    set(obj1, 'foo', 'OOF');
    await runLoopSettled();
    assert.equal(count, 1);
  }

  async [`@test inheriting an observer of the alias from the prototype then
    redefining the alias on the instance to another property dependent on same key
    does not call the observer twice`](assert) {
    let obj1 = EmberObject.extend({
      foo: null,
      bar: alias('foo'),
      baz: alias('foo'),
      incrementCount
    });
    addObserver(obj1.prototype, 'baz', null, 'incrementCount');
    let obj2 = obj1.create();
    defineProperty(obj2, 'baz', alias('bar')); // override baz
    // bootstrap the alias

    obj2.baz;
    set(obj2, 'foo', 'FOO');
    await runLoopSettled();
    assert.equal(count, 1);
    removeObserver(obj2, 'baz', null, 'incrementCount');
    set(obj2, 'foo', 'OOF');
    await runLoopSettled();
    assert.equal(count, 1);
  }

  async ['@test an observer of the alias works if added after defining the alias'](assert) {
    defineProperty(obj, 'bar', alias('foo.faz')); // bootstrap the alias

    obj.bar;
    addObserver(obj, 'bar', incrementCount);
    set(obj, 'foo.faz', 'BAR');
    await runLoopSettled();
    assert.equal(count, 1);
  }

  async ['@test an observer of the alias works if added before defining the alias'](assert) {
    addObserver(obj, 'bar', incrementCount);
    defineProperty(obj, 'bar', alias('foo.faz')); // bootstrap the alias

    obj.bar;
    set(obj, 'foo.faz', 'BAR');
    await runLoopSettled();
    assert.equal(count, 1);
  }

  ['@test alias is dirtied if interior object of alias is set after consumption'](assert) {
    defineProperty(obj, 'bar', alias('foo.faz'));
    get(obj, 'bar');
    let tag = EMBER_METAL_TRACKED_PROPERTIES ? tagForProperty(obj, 'bar') : tagFor(obj);
    let tagValue = tag.value();
    set(obj, 'foo.faz', 'BAR');
    assert.ok(!tag.validate(tagValue), 'setting the aliased key should dirty the object');
  }

  ['@test setting alias on self should fail assertion']() {
    expectAssertion(() => defineProperty(obj, 'bar', alias('bar')), "Setting alias 'bar' on self");
  }

  ['@test destroyed alias does not disturb watch count'](assert) {
    if (!EMBER_METAL_TRACKED_PROPERTIES) {
      defineProperty(obj, 'bar', alias('foo.faz'));
      assert.equal(get(obj, 'bar'), 'FOO');
      assert.ok(isWatching(obj, 'foo.faz'));
      defineProperty(obj, 'bar', null);
      assert.notOk(isWatching(obj, 'foo.faz'));
    } else {
      assert.expect(0);
    }
  }

  ['@test setting on oneWay alias does not disturb watch count'](assert) {
    if (!EMBER_METAL_TRACKED_PROPERTIES) {
      defineProperty(obj, 'bar', alias('foo.faz').oneWay());
      assert.equal(get(obj, 'bar'), 'FOO');
      assert.ok(isWatching(obj, 'foo.faz'));
      set(obj, 'bar', null);
      assert.notOk(isWatching(obj, 'foo.faz'));
    } else {
      assert.expect(0);
    }
  }

  ['@test redefined alias with observer does not disturb watch count'](assert) {
    if (!EMBER_METAL_TRACKED_PROPERTIES) {
      defineProperty(obj, 'bar', alias('foo.faz').oneWay());
      assert.equal(get(obj, 'bar'), 'FOO');
      assert.ok(isWatching(obj, 'foo.faz'));
      addObserver(obj, 'bar', incrementCount);
      assert.equal(count, 0);
      set(obj, 'bar', null);
      assert.equal(count, 1);
      assert.notOk(isWatching(obj, 'foo.faz'));
      defineProperty(obj, 'bar', alias('foo.faz'));
      assert.equal(count, 1);
      assert.ok(isWatching(obj, 'foo.faz'));
      set(obj, 'foo.faz', 'great');
      assert.equal(count, 2);
    } else {
      assert.expect(0);
    }
  }

  ['@test property tags are bumped when the source changes [GH#17243]'](assert) {
    function assertPropertyTagChanged(obj, keyName, callback) {
      let tag = tagForProperty(obj, keyName);
      let before = tag.value();
      callback();
      let after = tag.value();
      assert.notEqual(after, before, `tagForProperty ${keyName} should change`);
    }

    function assertPropertyTagUnchanged(obj, keyName, callback) {
      let tag = tagForProperty(obj, keyName);
      let before = tag.value();
      callback();
      let after = tag.value();
      assert.equal(after, before, `tagForProperty ${keyName} should not change`);
    }

    defineProperty(obj, 'bar', alias('foo.faz'));
    assertPropertyTagUnchanged(obj, 'bar', () => {
      assert.equal(get(obj, 'bar'), 'FOO');
    });
    assertPropertyTagChanged(obj, 'bar', () => {
      set(obj, 'foo.faz', 'BAR');
    });
    assertPropertyTagUnchanged(obj, 'bar', () => {
      assert.equal(get(obj, 'bar'), 'BAR');
    });
    assertPropertyTagUnchanged(obj, 'bar', () => {
      // trigger willWatch, then didUnwatch
      addObserver(obj, 'bar', incrementCount);
      removeObserver(obj, 'bar', incrementCount);
    });
    assertPropertyTagChanged(obj, 'bar', () => {
      set(obj, 'foo.faz', 'FOO');
    });
    assertPropertyTagUnchanged(obj, 'bar', () => {
      assert.equal(get(obj, 'bar'), 'FOO');
    });
  }

  ['@test nested aliases update their chained dependencies properly'](assert) {
    var _dec, _class, _descriptor, _temp, _dec2, _class3, _temp2;

    let count = 0;
    let Inner = (_dec = alias('pojo'), (_class = (_temp = class Inner {
      constructor() {
        _initializerDefineProperty(this, "aliased", _descriptor, this);

        this.pojo = {
          value: 123
        };
      }

    }, _temp), (_descriptor = _applyDecoratedDescriptor(_class.prototype, "aliased", [_dec], {
      configurable: true,
      enumerable: true,
      writable: true,
      initializer: null
    })), _class));
    let Outer = (_dec2 = computed('inner.aliased.value'), (_class3 = (_temp2 = class Outer {
      constructor() {
        this.inner = new Inner();
      }

      get value() {
        count++;
        return this.inner.aliased.value;
      }

    }, _temp2), (_applyDecoratedDescriptor(_class3.prototype, "value", [_dec2], Object.getOwnPropertyDescriptor(_class3.prototype, "value"), _class3.prototype)), _class3));
    let outer = new Outer();
    assert.equal(outer.value, 123, 'Property works');
    outer.value;
    assert.equal(count, 1, 'Property was properly cached');
    set(outer, 'inner.pojo.value', 456);
    assert.equal(outer.value, 456, 'Property was invalidated correctly');
  }

});