import { meta as metaFor, peekMeta } from '@ember/-internals/meta';
import { makeChainNode } from './chains';
export function watchPath(obj, keyPath, meta) {
    let m = meta === undefined ? metaFor(obj) : meta;
    let counter = m.peekWatching(keyPath);
    m.writeWatching(keyPath, counter + 1);
    if (counter === 0) {
        // activate watching first time
        m.writableChains(makeChainNode).add(keyPath);
    }
}
export function unwatchPath(obj, keyPath, meta) {
    let m = meta === undefined ? peekMeta(obj) : meta;
    if (m === null) {
        return;
    }
    let counter = m.peekWatching(keyPath);
    if (counter > 0) {
        m.writeWatching(keyPath, counter - 1);
        if (counter === 1) {
            m.writableChains(makeChainNode).remove(keyPath);
        }
    }
}
