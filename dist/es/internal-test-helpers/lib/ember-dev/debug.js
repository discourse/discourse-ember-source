import MethodCallTracker from './method-call-tracker';
class DebugAssert {
    constructor(methodName, env) {
        this.methodName = methodName;
        this.env = env;
        this.tracker = null;
    }
    inject() { }
    restore() {
        this.reset();
    }
    reset() {
        if (this.tracker) {
            this.tracker.restoreMethod();
        }
        this.tracker = null;
    }
    assert() {
        if (this.tracker) {
            this.tracker.assert();
        }
    }
    // Run an expectation callback within the context of a new tracker, optionally
    // accepting a function to run, which asserts immediately
    runExpectation(func, callback, async = false) {
        let originalTracker = null;
        // When helpers are passed a callback, they get a new tracker context
        if (func) {
            originalTracker = this.tracker;
            this.tracker = null;
        }
        if (!this.tracker) {
            this.tracker = new MethodCallTracker(this.env, this.methodName);
        }
        // Yield to caller with tracker instance
        callback(this.tracker);
        // Once the given callback is invoked, the pending assertions should be
        // flushed immediately
        if (func) {
            let maybePromise = func();
            if (async && typeof maybePromise.then === 'function') {
                return maybePromise.then(() => {
                    this.assert();
                    this.reset();
                    this.tracker = originalTracker;
                });
            }
            else {
                this.assert();
                this.reset();
                this.tracker = originalTracker;
            }
        }
    }
}
export default DebugAssert;
