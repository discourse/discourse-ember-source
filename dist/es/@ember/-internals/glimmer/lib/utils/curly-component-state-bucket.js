import { clearElementView, clearViewElement, getViewElement } from '@ember/-internals/views';
// tslint:disable-next-line:no-empty
function NOOP() { }
/**
  @module ember
*/
/**
  Represents the internal state of the component.

  @class ComponentStateBucket
  @private
*/
export default class ComponentStateBucket {
    constructor(environment, component, args, finalizer, hasWrappedElement) {
        this.environment = environment;
        this.component = component;
        this.args = args;
        this.finalizer = finalizer;
        this.hasWrappedElement = hasWrappedElement;
        this.classRef = null;
        this.classRef = null;
        this.argsRevision = args === null ? 0 : args.tag.value();
    }
    destroy() {
        let { component, environment } = this;
        if (environment.isInteractive) {
            component.trigger('willDestroyElement');
            component.trigger('willClearRender');
            let element = getViewElement(component);
            if (element) {
                clearElementView(element);
                clearViewElement(component);
            }
        }
        environment.destroyedComponents.push(component);
    }
    finalize() {
        let { finalizer } = this;
        finalizer();
        this.finalizer = NOOP;
    }
}
