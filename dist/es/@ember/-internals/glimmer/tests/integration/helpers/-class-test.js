import { RenderingTestCase, moduleFor, classes, runTask } from 'internal-test-helpers';

import { set } from '@ember/-internals/metal';

moduleFor(
  'Helpers test: {{-class}}',
  class extends RenderingTestCase {
    ['@test casts binding to dasherized class']() {
      this.registerComponent('foo-bar', { template: '' });
      this.render(`{{foo-bar class=(-class someTruth "someTruth")}}`, {
        someTruth: true,
      });

      this.assertComponentElement(this.firstChild, {
        tagName: 'div',
        attrs: { class: classes('some-truth ember-view') },
      });

      runTask(() => this.rerender());

      this.assertComponentElement(this.firstChild, {
        tagName: 'div',
        attrs: { class: classes('some-truth ember-view') },
      });

      runTask(() => set(this.context, 'someTruth', false));

      this.assertComponentElement(this.firstChild, {
        tagName: 'div',
        attrs: { class: classes('ember-view') },
      });

      runTask(() => set(this.context, 'someTruth', true));

      this.assertComponentElement(this.firstChild, {
        tagName: 'div',
        attrs: { class: classes('some-truth ember-view') },
      });
    }

    ['@tests casts leaf path of binding to dasherized class']() {
      this.registerComponent('foo-bar', { template: '' });
      this.render(`{{foo-bar class=(-class model.someTruth "someTruth")}}`, {
        model: {
          someTruth: true,
        },
      });

      this.assertComponentElement(this.firstChild, {
        tagName: 'div',
        attrs: { class: classes('some-truth ember-view') },
      });

      runTask(() => this.rerender());

      this.assertComponentElement(this.firstChild, {
        tagName: 'div',
        attrs: { class: classes('some-truth ember-view') },
      });

      runTask(() => set(this.context, 'model.someTruth', false));

      this.assertComponentElement(this.firstChild, {
        tagName: 'div',
        attrs: { class: classes('ember-view') },
      });

      runTask(() => set(this.context, 'model', { someTruth: true }));

      this.assertComponentElement(this.firstChild, {
        tagName: 'div',
        attrs: { class: classes('some-truth ember-view') },
      });
    }
  }
);
