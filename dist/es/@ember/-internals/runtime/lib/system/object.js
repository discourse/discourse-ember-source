/**
@module @ember/object
*/
import { FACTORY_FOR } from '@ember/-internals/container';
import { OWNER, setOwner } from '@ember/-internals/owner';
import { symbol, setName } from '@ember/-internals/utils';
import { addListener } from '@ember/-internals/metal';
import { EMBER_FRAMEWORK_OBJECT_OWNER_ARGUMENT } from '@ember/canary-features';
import CoreObject from './core_object';
import Observable from '../mixins/observable';
import { assert } from '@ember/debug';
import { DEBUG } from '@glimmer/env';
let OVERRIDE_OWNER = symbol('OVERRIDE_OWNER');
/**
  `EmberObject` is the main base class for all Ember objects. It is a subclass
  of `CoreObject` with the `Observable` mixin applied. For details,
  see the documentation for each of these.

  @class EmberObject
  @extends CoreObject
  @uses Observable
  @public
*/

export default class EmberObject extends CoreObject {
  get _debugContainerKey() {
    let factory = FACTORY_FOR.get(this);
    return factory !== undefined && factory.fullName;
  }

  get [OWNER]() {
    if (this[OVERRIDE_OWNER]) {
      return this[OVERRIDE_OWNER];
    }

    let factory = FACTORY_FOR.get(this);
    return factory !== undefined && factory.owner;
  } // we need a setter here largely to support
  // folks calling `owner.ownerInjection()` API


  set [OWNER](value) {
    this[OVERRIDE_OWNER] = value;
  }

}
setName(EmberObject, 'Ember.Object');
Observable.apply(EmberObject.prototype);
export let FrameworkObject;

if (EMBER_FRAMEWORK_OBJECT_OWNER_ARGUMENT) {
  FrameworkObject = class FrameworkObject extends CoreObject {
    get _debugContainerKey() {
      let factory = FACTORY_FOR.get(this);
      return factory !== undefined && factory.fullName;
    }

    constructor(owner) {
      super();
      setOwner(this, owner);
    }

  };
  Observable.apply(FrameworkObject.prototype);
} else {
  FrameworkObject = class FrameworkObject extends EmberObject {};
}

if (DEBUG) {
  let INIT_WAS_CALLED = symbol('INIT_WAS_CALLED');
  let ASSERT_INIT_WAS_CALLED = symbol('ASSERT_INIT_WAS_CALLED');
  FrameworkObject = class DebugFrameworkObject extends EmberObject {
    init() {
      super.init(...arguments);
      this[INIT_WAS_CALLED] = true;
    }

    [ASSERT_INIT_WAS_CALLED]() {
      assert(`You must call \`this._super(...arguments);\` when overriding \`init\` on a framework object. Please update ${this} to call \`this._super(...arguments);\` from \`init\`.`, this[INIT_WAS_CALLED]);
    }

  };
  addListener(FrameworkObject.prototype, 'init', null, ASSERT_INIT_WAS_CALLED);
}