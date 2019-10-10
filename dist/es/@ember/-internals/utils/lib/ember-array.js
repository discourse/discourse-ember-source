import symbol from './symbol';
export const EMBER_ARRAY = symbol('EMBER_ARRAY');
export function isEmberArray(obj) {
    return obj && obj[EMBER_ARRAY];
}
