import { InternalHelperReference } from '../utils/references';
const isEmpty = (value) => {
    return value === null || value === undefined || typeof value.toString !== 'function';
};
const normalizeTextValue = (value) => {
    if (isEmpty(value)) {
        return '';
    }
    return String(value);
};
/**
@module ember
*/
/**
  Concatenates the given arguments into a string.

  Example:

  ```handlebars
  {{some-component name=(concat firstName " " lastName)}}

  {{! would pass name="<first name value> <last name value>" to the component}}
  ```

  @public
  @method concat
  @for Ember.Templates.helpers
  @since 1.13.0
*/
function concat({ positional }) {
    return positional
        .value()
        .map(normalizeTextValue)
        .join('');
}
export default function (_vm, args) {
    return new InternalHelperReference(concat, args.capture());
}
