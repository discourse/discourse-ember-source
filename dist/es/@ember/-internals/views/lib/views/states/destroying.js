import { assign } from '@ember/polyfills';
import EmberError from '@ember/error';
import _default from './default';
const destroying = assign({}, _default, {
  appendChild() {
    throw new EmberError("You can't call appendChild on a view being destroyed");
  },

  rerender() {
    throw new EmberError("You can't call rerender on a view being destroyed");
  }

});
export default Object.freeze(destroying);