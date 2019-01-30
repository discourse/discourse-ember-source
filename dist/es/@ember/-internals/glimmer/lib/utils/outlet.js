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
