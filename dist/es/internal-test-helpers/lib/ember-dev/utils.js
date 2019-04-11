function noop() { }
export function callWithStub(env, name, func, debugStub = noop) {
    let originalFunc = env.getDebugFunction(name);
    try {
        env.setDebugFunction(name, debugStub);
        func();
    }
    finally {
        env.setDebugFunction(name, originalFunc);
    }
}
export function checkTest(test) {
    return typeof test === 'function' ? test() : test;
}
