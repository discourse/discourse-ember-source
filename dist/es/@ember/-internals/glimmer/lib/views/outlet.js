import { OWNER } from '@ember/-internals/owner';
import { assign } from '@ember/polyfills';
import { schedule } from '@ember/runloop';
import { RootOutletReference } from '../utils/outlet';
const TOP_LEVEL_NAME = '-top-level';
const TOP_LEVEL_OUTLET = 'main';
export default class OutletView {
    constructor(_environment, renderer, owner, template) {
        this._environment = _environment;
        this.renderer = renderer;
        this.owner = owner;
        this.template = template;
        let ref = (this.ref = new RootOutletReference({
            outlets: { main: undefined },
            render: {
                owner: owner,
                into: undefined,
                outlet: TOP_LEVEL_OUTLET,
                name: TOP_LEVEL_NAME,
                controller: undefined,
                template,
            },
        }));
        this.state = {
            ref,
            name: TOP_LEVEL_NAME,
            outlet: TOP_LEVEL_OUTLET,
            template,
            controller: undefined,
        };
    }
    static extend(injections) {
        return class extends OutletView {
            static create(options) {
                if (options) {
                    return super.create(assign({}, injections, options));
                }
                else {
                    return super.create(injections);
                }
            }
        };
    }
    static reopenClass(injections) {
        assign(this, injections);
    }
    static create(options) {
        let { _environment, renderer, template } = options;
        let owner = options[OWNER];
        return new OutletView(_environment, renderer, owner, template);
    }
    appendTo(selector) {
        let target;
        if (this._environment.hasDOM) {
            target = typeof selector === 'string' ? document.querySelector(selector) : selector;
        }
        else {
            target = selector;
        }
        schedule('render', this.renderer, 'appendOutletView', this, target);
    }
    rerender() {
        /**/
    }
    setOutletState(state) {
        this.ref.update(state);
    }
    destroy() {
        /**/
    }
}
