import DebugAssert from './debug';
import { callWithStub } from './utils';
export function setupDeprecationHelpers(hooks, env) {
    let assertion = new DeprecationAssert(env);
    hooks.beforeEach(function () {
        assertion.reset();
        assertion.inject();
    });
    hooks.afterEach(function () {
        assertion.assert();
        assertion.restore();
    });
}
class DeprecationAssert extends DebugAssert {
    constructor(env) {
        super('deprecate', env);
    }
    inject() {
        // Expects no deprecation to happen within a function, or if no function is
        // passed, from the time of calling until the end of the test.
        //
        // expectNoDeprecation(function() {
        //   fancyNewThing();
        // });
        //
        // expectNoDeprecation();
        // Ember.deprecate("Old And Busted");
        //
        let expectNoDeprecation = func => {
            if (typeof func !== 'function') {
                func = undefined;
            }
            this.runExpectation(func, tracker => {
                if (tracker.isExpectingCalls()) {
                    throw new Error('expectNoDeprecation was called after expectDeprecation was called!');
                }
                tracker.expectNoCalls();
            });
        };
        // Expect a deprecation to happen within a function, or if no function
        // is pass, from the time of calling until the end of the test. Can be called
        // multiple times to assert deprecations with different specific messages
        // were fired.
        //
        // expectDeprecation(function() {
        //   Ember.deprecate("Old And Busted");
        // }, /* optionalStringOrRegex */);
        //
        // expectDeprecation(/* optionalStringOrRegex */);
        // Ember.deprecate("Old And Busted");
        //
        let expectDeprecation = (func, message) => {
            let actualFunc;
            if (typeof func !== 'function') {
                message = func;
                actualFunc = undefined;
            }
            else {
                actualFunc = func;
            }
            this.runExpectation(actualFunc, tracker => {
                if (tracker.isExpectingNoCalls()) {
                    throw new Error('expectDeprecation was called after expectNoDeprecation was called!');
                }
                tracker.expectCall(message, ['id', 'until']);
            });
        };
        let expectDeprecationAsync = async (func, message) => {
            let actualFunc;
            if (typeof func !== 'function') {
                message = func;
                actualFunc = undefined;
            }
            else {
                actualFunc = func;
            }
            await this.runExpectation(actualFunc, tracker => {
                if (tracker.isExpectingNoCalls()) {
                    throw new Error('expectDeprecation was called after expectNoDeprecation was called!');
                }
                tracker.expectCall(message, ['id', 'until']);
            }, true);
        };
        let ignoreDeprecation = func => {
            callWithStub(this.env, 'deprecate', func);
        };
        window.expectNoDeprecation = expectNoDeprecation;
        window.expectDeprecation = expectDeprecation;
        window.expectDeprecationAsync = expectDeprecationAsync;
        window.ignoreDeprecation = ignoreDeprecation;
    }
    restore() {
        super.restore();
        window.expectDeprecation = null;
        window.expectDeprecationAsync = null;
        window.expectNoDeprecation = null;
        window.ignoreDeprecation = null;
    }
}
export default DeprecationAssert;
