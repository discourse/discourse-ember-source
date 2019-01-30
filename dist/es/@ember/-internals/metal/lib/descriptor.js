import { Descriptor } from './properties';
export default function descriptor(desc) {
    return new NativeDescriptor(desc);
}
/**
  A wrapper for a native ES5 descriptor. In an ideal world, we wouldn't need
  this at all, however, the way we currently flatten/merge our mixins require
  a special value to denote a descriptor.

  @class NativeDescriptor
  @private
*/
class NativeDescriptor extends Descriptor {
    constructor(desc) {
        super();
        this.desc = desc;
        this.enumerable = desc.enumerable !== false;
        this.configurable = desc.configurable !== false;
    }
    setup(obj, key, meta) {
        Object.defineProperty(obj, key, this.desc);
        meta.writeDescriptors(key, this);
    }
    get(obj, key) {
        return obj[key];
    }
    set(obj, key, value) {
        return (obj[key] = value);
    }
}
