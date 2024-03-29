import { assert } from '@ember/debug';
const VALIDATED_TYPES = {
  route: ['assert', 'isRouteFactory', 'Ember.Route'],
  component: ['deprecate', 'isComponentFactory', 'Ember.Component'],
  view: ['deprecate', 'isViewFactory', 'Ember.View'],
  service: ['deprecate', 'isServiceFactory', 'Ember.Service']
};
export default function validateType(resolvedType, parsedName) {
  let validationAttributes = VALIDATED_TYPES[parsedName.type];

  if (!validationAttributes) {
    return;
  }

  let [, factoryFlag, expectedType] = validationAttributes;
  assert(`Expected ${parsedName.fullName} to resolve to an ${expectedType} but ` + `instead it was ${resolvedType}.`, Boolean(resolvedType[factoryFlag]));
}