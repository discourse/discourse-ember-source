import hasDom from './lib/has-dom';
export { default as hasDOM } from './lib/has-dom';
export const window = hasDom ? self : null;
export const location = hasDom ? self.location : null;
export const history = hasDom ? self.history : null;
export const userAgent = hasDom ? self.navigator.userAgent : 'Lynx (textmode)';
export const isChrome = hasDom ? !!window.chrome && !window.opera : false;
export const isFirefox = hasDom ? typeof InstallTrigger !== 'undefined' : false;
