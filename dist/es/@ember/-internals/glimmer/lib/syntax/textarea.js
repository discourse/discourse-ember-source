import { EMBER_GLIMMER_ANGLE_BRACKET_BUILT_INS } from '@ember/canary-features';
import { DEBUG } from '@glimmer/env';
import { unreachable } from '@glimmer/util';
import { wrapComponentClassAttribute } from '../utils/bindings';
import { hashToArgs } from './utils';
export let textAreaMacro;
if (EMBER_GLIMMER_ANGLE_BRACKET_BUILT_INS) {
    if (DEBUG) {
        textAreaMacro = () => {
            throw unreachable();
        };
    }
}
else {
    textAreaMacro = function textAreaMacro(_name, params, hash, builder) {
        let definition = builder.compiler['resolver'].lookupComponentDefinition('-text-area', builder.referrer);
        wrapComponentClassAttribute(hash);
        builder.component.static(definition, [params || [], hashToArgs(hash), null, null]);
        return true;
    };
}
