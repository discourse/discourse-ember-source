import { set } from '@ember/-internals/metal';
import { combine, CONSTANT_TAG, isConst, UpdatableTag, } from '@glimmer/reference';
import { NULL_REFERENCE } from '@glimmer/runtime';
import { CachedReference, referenceFromParts, UPDATE } from '../utils/references';
/**
@module ember
*/
/**
  Dynamically look up a property on an object. The second argument to `{{get}}`
  should have a string value, although it can be bound.

  For example, these two usages are equivalent:

  ```handlebars
  {{person.height}}
  {{get person "height"}}
  ```

  If there were several facts about a person, the `{{get}}` helper can dynamically
  pick one:

  ```handlebars
  {{get person factName}}
  ```

  For a more complex example, this template would allow the user to switch
  between showing the user's height and weight with a click:

  ```handlebars
  {{get person factName}}
  <button {{action (fn (mut factName)) "height"}}>Show height</button>
  <button {{action (fn (mut factName)) "weight"}}>Show weight</button>
  ```

  The `{{get}}` helper can also respect mutable values itself. For example:

  ```handlebars
  {{input value=(mut (get person factName)) type="text"}}
  <button {{action (fn (mut factName)) "height"}}>Show height</button>
  <button {{action (fn (mut factName)) "weight"}}>Show weight</button>
  ```

  Would allow the user to swap what fact is being displayed, and also edit
  that fact via a two-way mutable binding.

  @public
  @method get
  @for Ember.Templates.helpers
  @since 2.1.0
 */
export default function (_vm, args) {
    return GetHelperReference.create(args.positional.at(0), args.positional.at(1));
}
function referenceFromPath(source, path) {
    let innerReference;
    if (path === undefined || path === null || path === '') {
        innerReference = NULL_REFERENCE;
    }
    else if (typeof path === 'string' && path.indexOf('.') > -1) {
        innerReference = referenceFromParts(source, path.split('.'));
    }
    else {
        innerReference = source.get(path);
    }
    return innerReference;
}
class GetHelperReference extends CachedReference {
    static create(sourceReference, pathReference) {
        if (isConst(pathReference)) {
            let path = pathReference.value();
            return referenceFromPath(sourceReference, path);
        }
        else {
            return new GetHelperReference(sourceReference, pathReference);
        }
    }
    constructor(sourceReference, pathReference) {
        super();
        this.sourceReference = sourceReference;
        this.pathReference = pathReference;
        this.lastPath = null;
        this.innerReference = NULL_REFERENCE;
        let innerTag = (this.innerTag = UpdatableTag.create(CONSTANT_TAG));
        this.tag = combine([sourceReference.tag, pathReference.tag, innerTag]);
    }
    compute() {
        let { lastPath, innerReference, innerTag } = this;
        let path = this.pathReference.value();
        if (path !== lastPath) {
            innerReference = referenceFromPath(this.sourceReference, path);
            innerTag.inner.update(innerReference.tag);
            this.innerReference = innerReference;
            this.lastPath = path;
        }
        return innerReference.value();
    }
    [UPDATE](value) {
        set(this.sourceReference.value(), this.pathReference.value(), value);
    }
}
