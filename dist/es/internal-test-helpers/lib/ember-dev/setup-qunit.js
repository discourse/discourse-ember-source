import { getDebugFunction, setDebugFunction } from '@ember/debug';
import { setupAssertionHelpers } from './assertion';
import { setupContainersCheck } from './containers';
import { setupDeprecationHelpers } from './deprecation';
import { setupNamespacesCheck } from './namespaces';
import { setupRunLoopCheck } from './run-loop';
import { setupWarningHelpers } from './warning';
export default function setupQUnit({ runningProdBuild }) {
    let env = {
        runningProdBuild,
        getDebugFunction,
        setDebugFunction,
    };
    let originalModule = QUnit.module;
    QUnit.module = function (name, callback) {
        return originalModule(name, function (hooks) {
            setupContainersCheck(hooks);
            setupNamespacesCheck(hooks);
            setupRunLoopCheck(hooks);
            setupAssertionHelpers(hooks, env);
            setupDeprecationHelpers(hooks, env);
            setupWarningHelpers(hooks, env);
            callback(hooks);
        });
    };
}
