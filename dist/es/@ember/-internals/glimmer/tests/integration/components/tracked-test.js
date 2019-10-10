function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and set to use loose mode. ' + 'To use proposal-class-properties in spec mode with decorators, wait for ' + 'the next major version of decorators in stage 2.'); }

import { Object as EmberObject, A } from '@ember/-internals/runtime';
import { EMBER_CUSTOM_COMPONENT_ARG_PROXY, EMBER_METAL_TRACKED_PROPERTIES } from '@ember/canary-features';
import { tracked, nativeDescDecorator as descriptor } from '@ember/-internals/metal';
import { moduleFor, RenderingTestCase, strip, runTask } from 'internal-test-helpers';
import GlimmerishComponent from '../../utils/glimmerish-component';
import { Component } from '../../utils/helpers';

if (EMBER_METAL_TRACKED_PROPERTIES) {
  moduleFor('Component Tracked Properties', class extends RenderingTestCase {
    '@test simple test using glimmerish component'() {
      var _class, _descriptor, _descriptor2, _temp;

      let personId = 0;
      let Person = (_class = (_temp = class Person {
        constructor(first, last) {
          _initializerDefineProperty(this, "first", _descriptor, this);

          _initializerDefineProperty(this, "last", _descriptor2, this);

          this.id = personId++;
          this.first = first;
          this.last = last;
        }

      }, _temp), (_descriptor = _applyDecoratedDescriptor(_class.prototype, "first", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      }), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, "last", [tracked], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: null
      })), _class);

      class PersonComponent extends GlimmerishComponent {
        get person() {
          return new Person(this.args.first, this.args.last);
        }

      }

      this.registerComponent('person-wrapper', {
        ComponentClass: PersonComponent,
        template: '{{@first}} {{@last}} | {{this.person.first}} {{this.person.last}}'
      });
      this.render('<PersonWrapper @first={{first}} @last={{last}} />', {
        first: 'robert',
        last: 'jackson'
      });
      this.assertText('robert jackson | robert jackson');
      runTask(() => this.context.set('first', 'max'));
      this.assertText('max jackson | max jackson');
    }

    '@test tracked properties that are uninitialized do not throw an error'() {
      let CountComponent = Component.extend({
        count: tracked(),

        increment() {
          if (!this.count) {
            this.count = 0;
          }

          this.count++;
        }

      });
      this.registerComponent('counter', {
        ComponentClass: CountComponent,
        template: '<button {{action this.increment}}>{{this.count}}</button>'
      });
      this.render('<Counter />');
      this.assertText('');
      runTask(() => this.$('button').click());
      this.assertText('1');
    }

    '@test tracked properties rerender when updated'() {
      let CountComponent = Component.extend({
        count: tracked({
          value: 0
        }),

        increment() {
          this.count++;
        }

      });
      this.registerComponent('counter', {
        ComponentClass: CountComponent,
        template: '<button {{action this.increment}}>{{this.count}}</button>'
      });
      this.render('<Counter />');
      this.assertText('0');
      runTask(() => this.$('button').click());
      this.assertText('1');
    }

    '@test tracked properties rerender when updated outside of a runloop'(assert) {
      let done = assert.async();
      let CountComponent = Component.extend({
        count: tracked({
          value: 0
        }),

        increment() {
          setTimeout(() => {
            this.count++;
          }, 100);
        }

      });
      this.registerComponent('counter', {
        ComponentClass: CountComponent,
        template: '<button {{action this.increment}}>{{this.count}}</button>'
      });
      this.render('<Counter />');
      this.assertText('0'); // intentionally outside of a runTask

      this.$('button').click();
      setTimeout(() => {
        this.assertText('1');
        done();
      }, 200);
    }

    '@test nested tracked properties rerender when updated'() {
      let Counter = EmberObject.extend({
        count: tracked({
          value: 0
        })
      });
      let CountComponent = Component.extend({
        counter: Counter.create(),

        increment() {
          this.counter.count++;
        }

      });
      this.registerComponent('counter', {
        ComponentClass: CountComponent,
        template: '<button {{action this.increment}}>{{this.counter.count}}</button>'
      });
      this.render('<Counter />');
      this.assertText('0');
      runTask(() => this.$('button').click());
      this.assertText('1');
    }

    '@test array properties rerender when updated'() {
      let NumListComponent = Component.extend({
        numbers: tracked({
          initializer: () => A([1, 2, 3])
        }),

        addNumber() {
          this.numbers.pushObject(4);
        }

      });
      this.registerComponent('num-list', {
        ComponentClass: NumListComponent,
        template: strip`
            <button {{action this.addNumber}}>
              {{#each this.numbers as |num|}}{{num}}{{/each}}
            </button>
          `
      });
      this.render('<NumList />');
      this.assertText('123');
      runTask(() => this.$('button').click());
      this.assertText('1234');
    }

    '@test getters update when dependent properties are invalidated'() {
      let CountComponent = Component.extend({
        count: tracked({
          value: 0
        }),
        countAlias: descriptor({
          get() {
            return this.count;
          }

        }),

        increment() {
          this.count++;
        }

      });
      this.registerComponent('counter', {
        ComponentClass: CountComponent,
        template: '<button {{action this.increment}}>{{this.countAlias}}</button>'
      });
      this.render('<Counter />');
      this.assertText('0');
      runTask(() => this.$('button').click());
      this.assertText('1');
    }

    '@test nested getters update when dependent properties are invalidated'() {
      let Counter = EmberObject.extend({
        count: tracked({
          value: 0
        }),
        countAlias: descriptor({
          get() {
            return this.count;
          }

        })
      });
      let CountComponent = Component.extend({
        counter: Counter.create(),

        increment() {
          this.counter.count++;
        }

      });
      this.registerComponent('counter', {
        ComponentClass: CountComponent,
        template: '<button {{action this.increment}}>{{this.counter.countAlias}}</button>'
      });
      this.render('<Counter />');
      this.assertText('0');
      runTask(() => this.$('button').click());
      this.assertText('1');
    }

    '@test tracked object passed down through components updates correctly'(assert) {
      let Person = EmberObject.extend({
        first: tracked({
          value: 'Rob'
        }),
        last: tracked({
          value: 'Jackson'
        }),
        full: descriptor({
          get() {
            return `${this.first} ${this.last}`;
          }

        })
      });
      let ParentComponent = Component.extend({
        person: Person.create()
      });
      let ChildComponent = Component.extend({
        updatePerson() {
          this.person.first = 'Kris';
          this.person.last = 'Selden';
        }

      });
      this.registerComponent('parent', {
        ComponentClass: ParentComponent,
        template: strip`
            <div id="parent">{{this.person.full}}</div>
            <Child @person={{this.person}}/>
          `
      });
      this.registerComponent('child', {
        ComponentClass: ChildComponent,
        template: strip`
            <div id="child">{{this.person.full}}</div>
            <button onclick={{action this.updatePerson}}></button>
          `
      });
      this.render('<Parent />');
      assert.equal(this.$('#parent').text(), 'Rob Jackson');
      assert.equal(this.$('#child').text(), 'Rob Jackson');
      runTask(() => this.$('button').click());
      assert.equal(this.$('#parent').text(), 'Kris Selden');
      assert.equal(this.$('#child').text(), 'Kris Selden');
    }

    '@test yielded getters update correctly'() {
      let PersonComponent = Component.extend({
        first: tracked({
          value: 'Rob'
        }),
        last: tracked({
          value: 'Jackson'
        }),
        full: descriptor({
          get() {
            return `${this.first} ${this.last}`;
          }

        }),

        updatePerson() {
          this.first = 'Kris';
          this.last = 'Selden';
        }

      });
      this.registerComponent('person', {
        ComponentClass: PersonComponent,
        template: strip`
            {{yield this.full (action this.updatePerson)}}
          `
      });
      this.render(strip`
          <Person as |name update|>
            <button onclick={{update}}>
              {{name}}
            </button>
          </Person>
        `);
      this.assertText('Rob Jackson');
      runTask(() => this.$('button').click());
      this.assertText('Kris Selden');
    }

    '@test yielded nested getters update correctly'() {
      let Person = EmberObject.extend({
        first: tracked({
          value: 'Rob'
        }),
        last: tracked({
          value: 'Jackson'
        }),
        full: descriptor({
          get() {
            return `${this.first} ${this.last}`;
          }

        })
      });
      let PersonComponent = Component.extend({
        person: Person.create(),

        updatePerson() {
          this.person.first = 'Kris';
          this.person.last = 'Selden';
        }

      });
      this.registerComponent('person', {
        ComponentClass: PersonComponent,
        template: strip`
            {{yield this.person (action this.updatePerson)}}
          `
      });
      this.render(strip`
          <Person as |p update|>
            <button onclick={{update}}>
              {{p.full}}
            </button>
          </Person>
        `);
      this.assertText('Rob Jackson');
      runTask(() => this.$('button').click());
      this.assertText('Kris Selden');
    }

  });

  if (EMBER_CUSTOM_COMPONENT_ARG_PROXY) {
    moduleFor('Component Tracked Properties w/ Args Proxy', class extends RenderingTestCase {
      '@test downstream property changes do not invalidate upstream component getters/arguments'(assert) {
        var _class3, _descriptor3, _temp2;

        let outerRenderCount = 0;
        let innerRenderCount = 0;

        class OuterComponent extends GlimmerishComponent {
          get count() {
            outerRenderCount++;
            return this.args.count;
          }

        }

        let InnerComponent = (_class3 = (_temp2 = class InnerComponent extends GlimmerishComponent {
          constructor(...args) {
            super(...args);

            _initializerDefineProperty(this, "count", _descriptor3, this);
          }

          get combinedCounts() {
            innerRenderCount++;
            return this.args.count + this.count;
          }

          updateInnerCount() {
            this.count++;
          }

        }, _temp2), (_descriptor3 = _applyDecoratedDescriptor(_class3.prototype, "count", [tracked], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: function () {
            return 0;
          }
        })), _class3);
        this.registerComponent('outer', {
          ComponentClass: OuterComponent,
          template: '<Inner @count={{this.count}}/>'
        });
        this.registerComponent('inner', {
          ComponentClass: InnerComponent,
          template: '<button {{action this.updateInnerCount}}>{{this.combinedCounts}}</button>'
        });
        this.render('<Outer @count={{this.count}}/>', {
          count: 0
        });
        this.assertText('0');
        assert.equal(outerRenderCount, 1);
        assert.equal(innerRenderCount, 1);
        runTask(() => this.$('button').click());
        this.assertText('1');
        assert.equal(outerRenderCount, 1, 'updating inner component does not cause outer component to rerender');
        assert.equal(innerRenderCount, 2, 'updating inner component causes inner component to rerender');
        runTask(() => this.context.set('count', 1));
        this.assertText('2');
        assert.equal(outerRenderCount, 2, 'outer component updates based on context');
        assert.equal(innerRenderCount, 3, 'inner component updates based on outer component');
      }

    });
  }
}