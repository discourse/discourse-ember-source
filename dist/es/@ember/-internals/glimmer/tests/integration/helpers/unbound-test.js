import { RenderingTestCase, moduleFor, strip, runTask, runLoopSettled } from 'internal-test-helpers';
import { set, get, setProperties } from '@ember/-internals/metal';
import { A as emberA } from '@ember/-internals/runtime';
import { Component } from '../../utils/helpers';
moduleFor('Helpers test: {{unbound}}', class extends RenderingTestCase {
  ['@test should be able to output a property without binding']() {
    this.render(`<div id="first">{{unbound content.anUnboundString}}</div>`, {
      content: {
        anUnboundString: 'No spans here, son.'
      }
    });
    this.assertText('No spans here, son.');
    runTask(() => this.rerender());
    this.assertText('No spans here, son.');
    runTask(() => set(this.context, 'content.anUnboundString', 'HEY'));
    this.assertText('No spans here, son.');
    runTask(() => set(this.context, 'content', {
      anUnboundString: 'No spans here, son.'
    }));
    this.assertText('No spans here, son.');
  }

  ['@test should be able to use unbound helper in #each helper']() {
    this.render(`<ul>{{#each items as |item|}}<li>{{unbound item}}</li>{{/each}}</ul>`, {
      items: emberA(['a', 'b', 'c', 1, 2, 3])
    });
    this.assertText('abc123');
    runTask(() => this.rerender());
    this.assertText('abc123');
  }

  ['@test should be able to use unbound helper in #each helper (with objects)']() {
    this.render(`<ul>{{#each items as |item|}}<li>{{unbound item.wham}}</li>{{/each}}</ul>`, {
      items: emberA([{
        wham: 'bam'
      }, {
        wham: 1
      }])
    });
    this.assertText('bam1');
    runTask(() => this.rerender());
    this.assertText('bam1');
    runTask(() => this.context.items.setEach('wham', 'HEY'));
    this.assertText('bam1');
    runTask(() => set(this.context, 'items', emberA([{
      wham: 'bam'
    }, {
      wham: 1
    }])));
    this.assertText('bam1');
  }

  ['@test it should assert unbound cannot be called with multiple arguments']() {
    let willThrow = () => {
      this.render(`{{unbound foo bar}}`, {
        foo: 'BORK',
        bar: 'BLOOP'
      });
    };

    expectAssertion(willThrow, /unbound helper cannot be called with multiple params or hash params/);
  }

  ['@test should render on attributes']() {
    this.render(`<a href="{{unbound model.foo}}"></a>`, {
      model: {
        foo: 'BORK'
      }
    });
    this.assertHTML('<a href="BORK"></a>');
    runTask(() => this.rerender());
    this.assertHTML('<a href="BORK"></a>');
    runTask(() => set(this.context, 'model.foo', 'OOF'));
    this.assertHTML('<a href="BORK"></a>');
    runTask(() => set(this.context, 'model', {
      foo: 'BORK'
    }));
    this.assertHTML('<a href="BORK"></a>');
  }

  ['@test should property escape unsafe hrefs']() {
    let unsafeUrls = emberA([{
      name: 'Bob',
      url: 'javascript:bob-is-cool'
    }, {
      name: 'James',
      url: 'vbscript:james-is-cool'
    }, {
      name: 'Richard',
      url: 'javascript:richard-is-cool'
    }]);
    this.render(`<ul>{{#each people as |person|}}<li><a href="{{unbound person.url}}">{{person.name}}</a></li>{{/each}}</ul>`, {
      people: unsafeUrls
    });
    let escapedHtml = strip`
      <ul>
        <li>
          <a href="unsafe:javascript:bob-is-cool">Bob</a>
        </li>
        <li>
          <a href="unsafe:vbscript:james-is-cool">James</a>
        </li>
        <li>
          <a href="unsafe:javascript:richard-is-cool">Richard</a>
        </li>
      </ul>
    `;
    this.assertHTML(escapedHtml);
    runTask(() => this.rerender());
    this.assertHTML(escapedHtml);
    runTask(() => this.context.people.setEach('url', 'http://google.com'));
    this.assertHTML(escapedHtml);
    runTask(() => set(this.context, 'people', unsafeUrls));
    this.assertHTML(escapedHtml);
  }

  ['@skip helper form updates on parent re-render']() {
    this.render(`{{unbound foo}}`, {
      foo: 'BORK'
    });
    this.assertText('BORK');
    runTask(() => this.rerender());
    this.assertText('BORK');
    runTask(() => set(this.context, 'foo', 'OOF'));
    this.assertText('BORK');
    runTask(() => this.rerender());
    this.assertText('OOF');
    runTask(() => set(this.context, 'foo', ''));
    this.assertText('OOF');
    runTask(() => set(this.context, 'foo', 'BORK'));
    runTask(() => this.rerender());
    this.assertText('BORK');
  } // semantics here is not guaranteed


  ['@test sexpr form does not update no matter what']() {
    this.registerHelper('capitalize', args => args[0].toUpperCase());
    this.render(`{{capitalize (unbound foo)}}`, {
      foo: 'bork'
    });
    this.assertText('BORK');
    runTask(() => this.rerender());
    this.assertText('BORK');
    runTask(() => {
      set(this.context, 'foo', 'oof');
      this.rerender();
    });
    this.assertText('BORK');
    runTask(() => set(this.context, 'foo', 'blip'));
    this.assertText('BORK');
    runTask(() => {
      set(this.context, 'foo', 'bork');
      this.rerender();
    });
    this.assertText('BORK');
  }

  ['@test sexpr in helper form does not update on parent re-render']() {
    this.registerHelper('capitalize', params => params[0].toUpperCase());
    this.registerHelper('doublize', params => `${params[0]} ${params[0]}`);
    this.render(`{{capitalize (unbound (doublize foo))}}`, {
      foo: 'bork'
    });
    this.assertText('BORK BORK');
    runTask(() => this.rerender());
    this.assertText('BORK BORK');
    runTask(() => {
      set(this.context, 'foo', 'oof');
      this.rerender();
    });
    this.assertText('BORK BORK');
    runTask(() => set(this.context, 'foo', 'blip'));
    this.assertText('BORK BORK');
    runTask(() => {
      set(this.context, 'foo', 'bork');
      this.rerender();
    });
    this.assertText('BORK BORK');
  }

  ['@test should be able to render an unbound helper invocation']() {
    this.registerHelper('repeat', ([value], {
      count
    }) => {
      let a = [];

      while (a.length < count) {
        a.push(value);
      }

      return a.join('');
    });
    this.render(`{{unbound (repeat foo count=bar)}} {{repeat foo count=bar}} {{unbound (repeat foo count=2)}} {{repeat foo count=4}}`, {
      foo: 'X',
      bar: 5
    });
    this.assertText('XXXXX XXXXX XX XXXX');
    runTask(() => this.rerender());
    this.assertText('XXXXX XXXXX XX XXXX');
    runTask(() => set(this.context, 'bar', 1));
    this.assertText('XXXXX X XX XXXX');
    runTask(() => set(this.context, 'bar', 5));
    this.assertText('XXXXX XXXXX XX XXXX');
  }

  ['@test should be able to render an bound helper invocation mixed with static values']() {
    this.registerHelper('surround', ([prefix, value, suffix]) => `${prefix}-${value}-${suffix}`);
    this.render(strip`
      {{unbound (surround model.prefix model.value "bar")}} {{surround model.prefix model.value "bar"}} {{unbound (surround "bar" model.value model.suffix)}} {{surround "bar" model.value model.suffix}}`, {
      model: {
        prefix: 'before',
        value: 'core',
        suffix: 'after'
      }
    });
    this.assertText('before-core-bar before-core-bar bar-core-after bar-core-after');
    runTask(() => this.rerender());
    this.assertText('before-core-bar before-core-bar bar-core-after bar-core-after');
    runTask(() => {
      setProperties(this.context.model, {
        prefix: 'beforeChanged',
        value: 'coreChanged',
        suffix: 'afterChanged'
      });
    });
    this.assertText('before-core-bar beforeChanged-coreChanged-bar bar-core-after bar-coreChanged-afterChanged');
    runTask(() => {
      set(this.context, 'model', {
        prefix: 'before',
        value: 'core',
        suffix: 'after'
      });
    });
    this.assertText('before-core-bar before-core-bar bar-core-after bar-core-after');
  }

  ['@test should be able to render unbound forms of multi-arg helpers']() {
    this.registerHelper('fauxconcat', params => params.join(''));
    this.render(`{{fauxconcat model.foo model.bar model.bing}} {{unbound (fauxconcat model.foo model.bar model.bing)}}`, {
      model: {
        foo: 'a',
        bar: 'b',
        bing: 'c'
      }
    });
    this.assertText('abc abc');
    runTask(() => this.rerender());
    this.assertText('abc abc');
    runTask(() => set(this.context, 'model.bar', 'X'));
    this.assertText('aXc abc');
    runTask(() => set(this.context, 'model', {
      foo: 'a',
      bar: 'b',
      bing: 'c'
    }));
    this.assertText('abc abc');
  }

  async ['@test should be able to render an unbound helper invocation for helpers with dependent keys']() {
    this.registerHelper('capitalizeName', {
      destroy() {
        this.removeObserver('value.firstName', this, this.recompute);

        this._super(...arguments);
      },

      compute([value]) {
        if (this.get('value')) {
          this.removeObserver('value.firstName', this, this.recompute);
        }

        this.set('value', value);
        this.addObserver('value.firstName', this, this.recompute);
        return value ? get(value, 'firstName').toUpperCase() : '';
      }

    });
    this.registerHelper('concatNames', {
      destroy() {
        this.teardown();

        this._super(...arguments);
      },

      teardown() {
        this.removeObserver('value.firstName', this, this.recompute);
        this.removeObserver('value.lastName', this, this.recompute);
      },

      compute([value]) {
        if (this.get('value')) {
          this.teardown();
        }

        this.set('value', value);
        this.addObserver('value.firstName', this, this.recompute);
        this.addObserver('value.lastName', this, this.recompute);
        return (value ? get(value, 'firstName') : '') + (value ? get(value, 'lastName') : '');
      }

    });
    this.render(`{{capitalizeName person}} {{unbound (capitalizeName person)}} {{concatNames person}} {{unbound (concatNames person)}}`, {
      person: {
        firstName: 'shooby',
        lastName: 'taylor'
      }
    });
    this.assertText('SHOOBY SHOOBY shoobytaylor shoobytaylor');
    runTask(() => this.rerender());
    await runLoopSettled();
    this.assertText('SHOOBY SHOOBY shoobytaylor shoobytaylor');
    runTask(() => set(this.context, 'person.firstName', 'sally'));
    await runLoopSettled();
    this.assertText('SALLY SHOOBY sallytaylor shoobytaylor');
    runTask(() => set(this.context, 'person', {
      firstName: 'shooby',
      lastName: 'taylor'
    }));
    await runLoopSettled();
    this.assertText('SHOOBY SHOOBY shoobytaylor shoobytaylor');
  }

  ['@test should be able to render an unbound helper invocation in #each helper']() {
    this.registerHelper('capitalize', params => params[0].toUpperCase());
    this.render(`{{#each people as |person|}}{{capitalize person.firstName}} {{unbound (capitalize person.firstName)}}{{/each}}`, {
      people: emberA([{
        firstName: 'shooby',
        lastName: 'taylor'
      }, {
        firstName: 'cindy',
        lastName: 'taylor'
      }])
    });
    this.assertText('SHOOBY SHOOBYCINDY CINDY');
    runTask(() => this.rerender());
    this.assertText('SHOOBY SHOOBYCINDY CINDY');
    runTask(() => this.context.people.setEach('firstName', 'chad'));
    this.assertText('CHAD SHOOBYCHAD CINDY');
    runTask(() => set(this.context, 'people', emberA([{
      firstName: 'shooby',
      lastName: 'taylor'
    }, {
      firstName: 'cindy',
      lastName: 'taylor'
    }])));
    this.assertText('SHOOBY SHOOBYCINDY CINDY');
  }

  async ['@test should be able to render an unbound helper invocation with bound hash options']() {
    this.registerHelper('capitalizeName', {
      destroy() {
        this.removeObserver('value.firstName', this, this.recompute);

        this._super(...arguments);
      },

      compute([value]) {
        if (this.get('value')) {
          this.removeObserver('value.firstName', this, this.recompute);
        }

        this.set('value', value);
        this.addObserver('value.firstName', this, this.recompute);
        return value ? get(value, 'firstName').toUpperCase() : '';
      }

    });
    this.registerHelper('concatNames', {
      destroy() {
        this.teardown();

        this._super(...arguments);
      },

      teardown() {
        this.removeObserver('value.firstName', this, this.recompute);
        this.removeObserver('value.lastName', this, this.recompute);
      },

      compute([value]) {
        if (this.get('value')) {
          this.teardown();
        }

        this.set('value', value);
        this.addObserver('value.firstName', this, this.recompute);
        this.addObserver('value.lastName', this, this.recompute);
        return (value ? get(value, 'firstName') : '') + (value ? get(value, 'lastName') : '');
      }

    });
    this.render(`{{capitalizeName person}} {{unbound (capitalizeName person)}} {{concatNames person}} {{unbound (concatNames person)}}`, {
      person: {
        firstName: 'shooby',
        lastName: 'taylor'
      }
    });
    await runLoopSettled();
    this.assertText('SHOOBY SHOOBY shoobytaylor shoobytaylor');
    runTask(() => this.rerender());
    await runLoopSettled();
    this.assertText('SHOOBY SHOOBY shoobytaylor shoobytaylor');
    runTask(() => set(this.context, 'person.firstName', 'sally'));
    await runLoopSettled();
    this.assertText('SALLY SHOOBY sallytaylor shoobytaylor');
    runTask(() => set(this.context, 'person', {
      firstName: 'shooby',
      lastName: 'taylor'
    }));
    this.assertText('SHOOBY SHOOBY shoobytaylor shoobytaylor');
  }

  ['@test should be able to render bound form of a helper inside unbound form of same helper']() {
    this.render(strip`
      {{#if (unbound model.foo)}}
        {{#if model.bar}}true{{/if}}
        {{#unless model.bar}}false{{/unless}}
      {{/if}}
      {{#unless (unbound model.notfoo)}}
        {{#if model.bar}}true{{/if}}
        {{#unless model.bar}}false{{/unless}}
      {{/unless}}`, {
      model: {
        foo: true,
        notfoo: false,
        bar: true
      }
    });
    this.assertText('truetrue');
    runTask(() => this.rerender());
    this.assertText('truetrue');
    runTask(() => set(this.context, 'model.bar', false));
    this.assertText('falsefalse');
    runTask(() => set(this.context, 'model', {
      foo: true,
      notfoo: false,
      bar: true
    }));
    this.assertText('truetrue');
  }

  ['@test yielding unbound does not update']() {
    let fooBarInstance;
    let FooBarComponent = Component.extend({
      init() {
        this._super(...arguments);

        fooBarInstance = this;
      },

      model: {
        foo: 'bork'
      }
    });
    this.registerComponent('foo-bar', {
      ComponentClass: FooBarComponent,
      template: `{{yield (unbound model.foo)}}`
    });
    this.render(`{{#foo-bar as |value|}}{{value}}{{/foo-bar}}`);
    this.assertText('bork');
    runTask(() => this.rerender());
    this.assertText('bork');
    runTask(() => set(fooBarInstance, 'model.foo', 'oof'));
    this.assertText('bork');
    runTask(() => set(fooBarInstance, 'model', {
      foo: 'bork'
    }));
    this.assertText('bork');
  }

  ['@test yielding unbound hash does not update']() {
    let fooBarInstance;
    let FooBarComponent = Component.extend({
      init() {
        this._super(...arguments);

        fooBarInstance = this;
      },

      model: {
        foo: 'bork'
      }
    });
    this.registerComponent('foo-bar', {
      ComponentClass: FooBarComponent,
      template: `{{yield (unbound (hash foo=model.foo))}}`
    });
    this.render(`{{#foo-bar as |value|}}{{value.foo}}{{/foo-bar}}`);
    this.assertText('bork');
    runTask(() => this.rerender());
    this.assertText('bork');
    runTask(() => set(fooBarInstance, 'model.foo', 'oof'));
    this.assertText('bork');
    runTask(() => set(fooBarInstance, 'model', {
      foo: 'bork'
    }));
    this.assertText('bork');
  }

});