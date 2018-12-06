import { combine, DirtyableTag } from '@glimmer/reference';
/**
 * Represents the root outlet.
 */
export class RootOutletReference {
    constructor(outletState) {
        this.outletState = outletState;
        this.tag = DirtyableTag.create();
    }
    get(key) {
        return new PathReference(this, key);
    }
    value() {
        return this.outletState;
    }
    update(state) {
        this.outletState.outlets.main = state;
        this.tag.inner.dirty();
    }
}
/**
 * Represents the connected outlet.
 */
export class OutletReference {
    constructor(parentStateRef, outletNameRef) {
        this.parentStateRef = parentStateRef;
        this.outletNameRef = outletNameRef;
        this.tag = combine([parentStateRef.tag, outletNameRef.tag]);
    }
    value() {
        let outletState = this.parentStateRef.value();
        let outlets = outletState === undefined ? undefined : outletState.outlets;
        return outlets === undefined ? undefined : outlets[this.outletNameRef.value()];
    }
    get(key) {
        return new PathReference(this, key);
    }
}
/**
 * Outlet state is dirtied from root.
 * This just using the parent tag for dirtiness.
 */
class PathReference {
    constructor(parent, key) {
        this.parent = parent;
        this.key = key;
        this.tag = parent.tag;
    }
    get(key) {
        return new PathReference(this, key);
    }
    value() {
        let parent = this.parent.value();
        return parent && parent[this.key];
    }
}
/**
 * So this is a relic of the past that SHOULD go away
 * in 3.0. Preferably it is deprecated in the release that
 * follows the Glimmer release.
 */
export class OrphanedOutletReference {
    constructor(root, name) {
        this.root = root;
        this.name = name;
        this.tag = root.tag;
    }
    value() {
        let rootState = this.root.value();
        let outletState = rootState && rootState.outlets.main;
        let outlets = outletState && outletState.outlets;
        outletState = outlets && outlets.__ember_orphans__;
        outlets = outletState && outletState.outlets;
        if (outlets === undefined) {
            return;
        }
        let matched = outlets[this.name];
        if (matched === undefined || matched.render === undefined) {
            return;
        }
        let state = Object.create(null);
        state[matched.render.outlet] = matched;
        matched.wasUsed = true;
        return { outlets: state, render: undefined };
    }
    get(key) {
        return new PathReference(this, key);
    }
}
