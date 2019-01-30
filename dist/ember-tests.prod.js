(function() {
/*!
 * @overview  Ember - JavaScript Application Framework
 * @copyright Copyright 2011-2018 Tilde Inc. and contributors
 *            Portions Copyright 2006-2011 Strobe Inc.
 *            Portions Copyright 2008-2011 Apple Inc. All rights reserved.
 * @license   Licensed under MIT license
 *            See https://raw.github.com/emberjs/ember.js/master/LICENSE
 * @version   3.7.0
 */

/*globals process */
var enifed, requireModule, Ember;

// Used in @ember/-internals/environment/lib/global.js
mainContext = this; // eslint-disable-line no-undef

(function() {
  function missingModule(name, referrerName) {
    if (referrerName) {
      throw new Error('Could not find module ' + name + ' required by: ' + referrerName);
    } else {
      throw new Error('Could not find module ' + name);
    }
  }

  function internalRequire(_name, referrerName) {
    var name = _name;
    var mod = registry[name];

    if (!mod) {
      name = name + '/index';
      mod = registry[name];
    }

    var exports = seen[name];

    if (exports !== undefined) {
      return exports;
    }

    exports = seen[name] = {};

    if (!mod) {
      missingModule(_name, referrerName);
    }

    var deps = mod.deps;
    var callback = mod.callback;
    var reified = new Array(deps.length);

    for (var i = 0; i < deps.length; i++) {
      if (deps[i] === 'exports') {
        reified[i] = exports;
      } else if (deps[i] === 'require') {
        reified[i] = requireModule;
      } else {
        reified[i] = internalRequire(deps[i], name);
      }
    }

    callback.apply(this, reified);

    return exports;
  }

  var isNode =
    typeof window === 'undefined' &&
    typeof process !== 'undefined' &&
    {}.toString.call(process) === '[object process]';

  if (!isNode) {
    Ember = this.Ember = this.Ember || {};
  }

  if (typeof Ember === 'undefined') {
    Ember = {};
  }

  if (typeof Ember.__loader === 'undefined') {
    var registry = Object.create(null);
    var seen = Object.create(null);

    enifed = function(name, deps, callback) {
      var value = {};

      if (!callback) {
        value.deps = [];
        value.callback = deps;
      } else {
        value.deps = deps;
        value.callback = callback;
      }

      registry[name] = value;
    };

    requireModule = function(name) {
      return internalRequire(name, null);
    };

    // setup `require` module
    requireModule['default'] = requireModule;

    requireModule.has = function registryHas(moduleName) {
      return !!registry[moduleName] || !!registry[moduleName + '/index'];
    };

    requireModule._eak_seen = registry;

    Ember.__loader = {
      define: enifed,
      require: requireModule,
      registry: registry,
    };
  } else {
    enifed = Ember.__loader.define;
    requireModule = Ember.__loader.require;
  }
})();

enifed('@ember/application/tests/application_instance_test', ['@ember/engine', '@ember/application', '@ember/application/instance', '@ember/runloop', '@ember/-internals/container', 'internal-test-helpers', '@ember/-internals/runtime', '@ember/debug'], function (_engine, _application, _instance, _runloop, _container, _internalTestHelpers, _runtime, _debug) {
  'use strict';

  const originalDebug = (0, _debug.getDebugFunction)('debug');
  const noop = function () {};

  let application, appInstance;

  (0, _internalTestHelpers.moduleFor)('ApplicationInstance', class extends _internalTestHelpers.AbstractTestCase {
    constructor() {
      (0, _debug.setDebugFunction)('debug', noop);
      super();

      document.getElementById('qunit-fixture').innerHTML = `
      <div id='one'><div id='one-child'>HI</div></div><div id='two'>HI</div>
    `;
      application = (0, _runloop.run)(() => _application.default.create({ rootElement: '#one', router: null }));
    }

    teardown() {
      (0, _debug.setDebugFunction)('debug', originalDebug);
      if (appInstance) {
        (0, _runloop.run)(appInstance, 'destroy');
        appInstance = null;
      }

      if (application) {
        (0, _runloop.run)(application, 'destroy');
        application = null;
      }

      document.getElementById('qunit-fixture').innerHTML = '';
    }

    ['@test an application instance can be created based upon an application'](assert) {
      appInstance = (0, _runloop.run)(() => _instance.default.create({ application }));

      assert.ok(appInstance, 'instance should be created');
      assert.equal(appInstance.application, application, 'application should be set to parent');
    }

    ['@test customEvents added to the application before setupEventDispatcher'](assert) {
      assert.expect(1);

      appInstance = (0, _runloop.run)(() => _instance.default.create({ application }));
      appInstance.setupRegistry();

      application.customEvents = {
        awesome: 'sauce'
      };

      let eventDispatcher = appInstance.lookup('event_dispatcher:main');
      eventDispatcher.setup = function (events) {
        assert.equal(events.awesome, 'sauce');
      };

      appInstance.setupEventDispatcher();
    }

    ['@test customEvents added to the application before setupEventDispatcher'](assert) {
      assert.expect(1);

      appInstance = (0, _runloop.run)(() => _instance.default.create({ application }));
      appInstance.setupRegistry();

      application.customEvents = {
        awesome: 'sauce'
      };

      let eventDispatcher = appInstance.lookup('event_dispatcher:main');
      eventDispatcher.setup = function (events) {
        assert.equal(events.awesome, 'sauce');
      };

      appInstance.setupEventDispatcher();
    }

    ['@test customEvents added to the application instance before setupEventDispatcher'](assert) {
      assert.expect(1);

      appInstance = (0, _runloop.run)(() => _instance.default.create({ application }));
      appInstance.setupRegistry();

      appInstance.customEvents = {
        awesome: 'sauce'
      };

      let eventDispatcher = appInstance.lookup('event_dispatcher:main');
      eventDispatcher.setup = function (events) {
        assert.equal(events.awesome, 'sauce');
      };

      appInstance.setupEventDispatcher();
    }

    ['@test unregistering a factory clears all cached instances of that factory'](assert) {
      assert.expect(5);

      appInstance = (0, _runloop.run)(() => _instance.default.create({ application }));

      let PostController1 = (0, _internalTestHelpers.factory)();
      let PostController2 = (0, _internalTestHelpers.factory)();

      appInstance.register('controller:post', PostController1);

      let postController1 = appInstance.lookup('controller:post');
      let postController1Factory = appInstance.factoryFor('controller:post');
      assert.ok(postController1 instanceof PostController1, 'precond - lookup creates instance');
      assert.equal(PostController1, postController1Factory.class, 'precond - factoryFor().class matches');

      appInstance.unregister('controller:post');
      appInstance.register('controller:post', PostController2);

      let postController2 = appInstance.lookup('controller:post');
      let postController2Factory = appInstance.factoryFor('controller:post');
      assert.ok(postController2 instanceof PostController2, 'lookup creates instance');
      assert.equal(PostController2, postController2Factory.class, 'factoryFor().class matches');

      assert.notStrictEqual(postController1, postController2, 'lookup creates a brand new instance, because the previous one was reset');
    }

    ['@skip unregistering a factory clears caches with source of that factory'](assert) {
      assert.expect(1);

      appInstance = (0, _runloop.run)(() => _instance.default.create({ application }));

      let PostController1 = (0, _internalTestHelpers.factory)();
      let PostController2 = (0, _internalTestHelpers.factory)();

      appInstance.register('controller:post', PostController1);

      appInstance.lookup('controller:post');
      let postControllerLookupWithSource = appInstance.lookup('controller:post', {
        source: 'doesnt-even-matter'
      });

      appInstance.unregister('controller:post');
      appInstance.register('controller:post', PostController2);

      // The cache that is source-specific is not cleared
      assert.ok(postControllerLookupWithSource !== appInstance.lookup('controller:post', {
        source: 'doesnt-even-matter'
      }), 'lookup with source creates a new instance');
    }

    ['@test can build and boot a registered engine'](assert) {
      assert.expect(11);

      let ChatEngine = _engine.default.extend();
      let chatEngineInstance;

      application.register('engine:chat', ChatEngine);

      (0, _runloop.run)(() => {
        appInstance = _instance.default.create({ application });
        appInstance.setupRegistry();
        chatEngineInstance = appInstance.buildChildEngineInstance('chat');
      });

      return chatEngineInstance.boot().then(() => {
        assert.ok(true, 'boot successful');

        let registrations = ['route:basic', 'service:-routing', 'service:-glimmer-environment'];

        registrations.forEach(key => {
          assert.strictEqual(chatEngineInstance.resolveRegistration(key), appInstance.resolveRegistration(key), `Engine and parent app share registrations for '${key}'`);
        });

        let singletons = ['router:main', _container.privatize`-bucket-cache:main`, '-view-registry:main', '-environment:main', 'service:-document', 'event_dispatcher:main'];

        let env = appInstance.lookup('-environment:main');
        singletons.push(env.isInteractive ? 'renderer:-dom' : 'renderer:-inert');

        singletons.forEach(key => {
          assert.strictEqual(chatEngineInstance.lookup(key), appInstance.lookup(key), `Engine and parent app share singleton '${key}'`);
        });
      });
    }

    ['@test can build a registry via ApplicationInstance.setupRegistry() -- simulates ember-test-helpers'](assert) {
      let namespace = _runtime.Object.create({
        Resolver: { create: function () {} }
      });

      let registry = _application.default.buildRegistry(namespace);

      _instance.default.setupRegistry(registry);

      assert.equal(registry.resolve('service:-document'), document);
    }
  });
});
enifed('@ember/application/tests/application_test', ['ember/version', '@ember/-internals/environment', '@ember/-internals/metal', '@ember/debug', '@ember/application', '@ember/-internals/routing', '@ember/-internals/views', '@ember/controller', '@ember/-internals/runtime', '@ember/-internals/glimmer', '@ember/-internals/container', '@ember/polyfills', 'internal-test-helpers', '@ember/runloop'], function (_version, _environment, _metal, _debug, _application, _routing, _views, _controller, _runtime, _glimmer, _container, _polyfills, _internalTestHelpers, _runloop) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Application, autobooting multiple apps', class extends _internalTestHelpers.ApplicationTestCase {
    get fixture() {
      return `
      <div id="one">
        <div id="one-child">HI</div>
      </div>
      <div id="two">HI</div>
    `;
    }

    get applicationOptions() {
      return (0, _polyfills.assign)(super.applicationOptions, {
        rootElement: '#one',
        router: null,
        autoboot: true
      });
    }

    createSecondApplication(options) {
      let myOptions = (0, _polyfills.assign)(this.applicationOptions, options);
      return this.secondApp = _application.default.create(myOptions);
    }

    teardown() {
      super.teardown();

      if (this.secondApp) {
        this.runTask(() => this.secondApp.destroy());
      }
    }

    [`@test you can make a new application in a non-overlapping element`](assert) {
      let app = this.runTask(() => this.createSecondApplication({
        rootElement: '#two'
      }));

      this.runTask(() => app.destroy());
      assert.ok(true, 'should not raise');
    }

    [`@test you cannot make a new application that is a parent of an existing application`]() {
      expectAssertion(() => {
        this.runTask(() => this.createSecondApplication({
          rootElement: this.applicationOptions.rootElement
        }));
      });
    }

    [`@test you cannot make a new application that is a descendant of an existing application`]() {
      expectAssertion(() => {
        this.runTask(() => this.createSecondApplication({
          rootElement: '#one-child'
        }));
      });
    }

    [`@test you cannot make a new application that is a duplicate of an existing application`]() {
      expectAssertion(() => {
        this.runTask(() => this.createSecondApplication({
          rootElement: '#one'
        }));
      });
    }

    [`@test you cannot make two default applications without a rootElement error`]() {
      expectAssertion(() => {
        this.runTask(() => this.createSecondApplication());
      });
    }
  }); /*globals EmberDev */


  (0, _internalTestHelpers.moduleFor)('Application', class extends _internalTestHelpers.ApplicationTestCase {
    [`@test builds a registry`](assert) {
      let { application } = this;
      assert.strictEqual(application.resolveRegistration('application:main'), application, `application:main is registered`);
      assert.deepEqual(application.registeredOptionsForType('component'), { singleton: false }, `optionsForType 'component'`);
      assert.deepEqual(application.registeredOptionsForType('view'), { singleton: false }, `optionsForType 'view'`);

      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'controller:basic');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, '-view-registry:main');
      (0, _internalTestHelpers.verifyInjection)(assert, application, 'view', '_viewRegistry', '-view-registry:main');
      (0, _internalTestHelpers.verifyInjection)(assert, application, 'route', '_topLevelViewTemplate', 'template:-outlet');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'route:basic');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'event_dispatcher:main');
      (0, _internalTestHelpers.verifyInjection)(assert, application, 'router:main', 'namespace', 'application:main');
      (0, _internalTestHelpers.verifyInjection)(assert, application, 'view:-outlet', 'namespace', 'application:main');

      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'location:auto');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'location:hash');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'location:history');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'location:none');

      (0, _internalTestHelpers.verifyInjection)(assert, application, 'controller', 'target', 'router:main');
      (0, _internalTestHelpers.verifyInjection)(assert, application, 'controller', 'namespace', 'application:main');

      (0, _internalTestHelpers.verifyRegistration)(assert, application, _container.privatize`-bucket-cache:main`);
      (0, _internalTestHelpers.verifyInjection)(assert, application, 'router', '_bucketCache', _container.privatize`-bucket-cache:main`);
      (0, _internalTestHelpers.verifyInjection)(assert, application, 'route', '_bucketCache', _container.privatize`-bucket-cache:main`);

      (0, _internalTestHelpers.verifyInjection)(assert, application, 'route', '_router', 'router:main');

      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'component:-text-field');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'component:-text-area');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'component:-checkbox');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'component:link-to');

      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'service:-routing');
      (0, _internalTestHelpers.verifyInjection)(assert, application, 'service:-routing', 'router', 'router:main');

      // DEBUGGING
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'resolver-for-debugging:main');
      (0, _internalTestHelpers.verifyInjection)(assert, application, 'container-debug-adapter:main', 'resolver', 'resolver-for-debugging:main');
      (0, _internalTestHelpers.verifyInjection)(assert, application, 'data-adapter:main', 'containerDebugAdapter', 'container-debug-adapter:main');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'container-debug-adapter:main');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'component-lookup:main');

      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'service:-glimmer-environment');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'service:-dom-changes');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'service:-dom-tree-construction');
      (0, _internalTestHelpers.verifyInjection)(assert, application, 'service:-glimmer-environment', 'appendOperations', 'service:-dom-tree-construction');
      (0, _internalTestHelpers.verifyInjection)(assert, application, 'service:-glimmer-environment', 'updateOperations', 'service:-dom-changes');
      (0, _internalTestHelpers.verifyInjection)(assert, application, 'renderer', 'env', 'service:-glimmer-environment');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'view:-outlet');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'renderer:-dom');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'renderer:-inert');
      (0, _internalTestHelpers.verifyRegistration)(assert, application, _container.privatize`template:components/-default`);
      (0, _internalTestHelpers.verifyRegistration)(assert, application, 'template:-outlet');
      (0, _internalTestHelpers.verifyInjection)(assert, application, 'view:-outlet', 'template', 'template:-outlet');
      (0, _internalTestHelpers.verifyInjection)(assert, application, 'template', 'compiler', _container.privatize`template-compiler:main`);

      assert.deepEqual(application.registeredOptionsForType('helper'), { instantiate: false }, `optionsForType 'helper'`);
    }
  });

  (0, _internalTestHelpers.moduleFor)('Application, default resolver with autoboot', class extends _internalTestHelpers.DefaultResolverApplicationTestCase {
    constructor() {
      super(...arguments);
      this.originalLookup = _environment.context.lookup;
    }

    teardown() {
      _environment.context.lookup = this.originalLookup;
      super.teardown();
      (0, _glimmer.setTemplates)({});
    }

    get applicationOptions() {
      return (0, _polyfills.assign)(super.applicationOptions, {
        autoboot: true
      });
    }

    [`@test acts like a namespace`](assert) {
      this.application = this.runTask(() => this.createApplication());
      let Foo = this.application.Foo = _runtime.Object.extend();
      assert.equal(Foo.toString(), 'TestApp.Foo', 'Classes pick up their parent namespace');
    }

    [`@test can specify custom router`](assert) {
      let MyRouter = _routing.Router.extend();
      this.runTask(() => {
        this.createApplication();
        this.application.Router = MyRouter;
      });

      assert.ok(this.application.__deprecatedInstance__.lookup('router:main') instanceof MyRouter, 'application resolved the correct router');
    }

    [`@test Minimal Application initialized with just an application template`]() {
      this.setupFixture('<script type="text/x-handlebars">Hello World</script>');
      this.runTask(() => this.createApplication());
      this.assertInnerHTML('Hello World');
    }
  });

  (0, _internalTestHelpers.moduleFor)('Application, autobooting', class extends _internalTestHelpers.AutobootApplicationTestCase {
    constructor() {
      super(...arguments);
      this.originalLogVersion = _environment.ENV.LOG_VERSION;
      this.originalDebug = (0, _debug.getDebugFunction)('debug');
      this.originalWarn = (0, _debug.getDebugFunction)('warn');
    }

    teardown() {
      (0, _debug.setDebugFunction)('warn', this.originalWarn);
      (0, _debug.setDebugFunction)('debug', this.originalDebug);
      _environment.ENV.LOG_VERSION = this.originalLogVersion;
      super.teardown();
    }

    [`@test initialized application goes to initial route`]() {
      this.runTask(() => {
        this.createApplication();
        this.addTemplate('application', '{{outlet}}');
        this.addTemplate('index', '<h1>Hi from index</h1>');
      });

      this.assertText('Hi from index');
    }

    [`@test ready hook is called before routing begins`](assert) {
      assert.expect(2);

      this.runTask(() => {
        function registerRoute(application, name, callback) {
          let route = _routing.Route.extend({
            activate: callback
          });

          application.register('route:' + name, route);
        }

        let MyApplication = _application.default.extend({
          ready() {
            registerRoute(this, 'index', () => {
              assert.ok(true, 'last-minute route is activated');
            });
          }
        });

        let app = this.createApplication({}, MyApplication);

        registerRoute(app, 'application', () => assert.ok(true, 'normal route is activated'));
      });
    }

    [`@test initialize application via initialize call`](assert) {
      this.runTask(() => this.createApplication());
      // This is not a public way to access the container; we just
      // need to make some assertions about the created router
      let router = this.applicationInstance.lookup('router:main');
      assert.equal(router instanceof _routing.Router, true, 'Router was set from initialize call');
      assert.equal(router.location instanceof _routing.NoneLocation, true, 'Location was set from location implementation name');
    }

    [`@test initialize application with stateManager via initialize call from Router class`](assert) {
      this.runTask(() => {
        this.createApplication();
        this.addTemplate('application', '<h1>Hello!</h1>');
      });
      // This is not a public way to access the container; we just
      // need to make some assertions about the created router
      let router = this.application.__deprecatedInstance__.lookup('router:main');
      assert.equal(router instanceof _routing.Router, true, 'Router was set from initialize call');
      this.assertText('Hello!');
    }

    [`@test Application Controller backs the appplication template`]() {
      this.runTask(() => {
        this.createApplication();
        this.addTemplate('application', '<h1>{{greeting}}</h1>');
        this.add('controller:application', _controller.default.extend({
          greeting: 'Hello!'
        }));
      });
      this.assertText('Hello!');
    }

    [`@test enable log of libraries with an ENV var`](assert) {
      if (EmberDev && EmberDev.runningProdBuild) {
        assert.ok(true, 'Logging does not occur in production builds');
        return;
      }

      let messages = [];

      _environment.ENV.LOG_VERSION = true;

      (0, _debug.setDebugFunction)('debug', message => messages.push(message));

      _metal.libraries.register('my-lib', '2.0.0a');

      this.runTask(() => this.createApplication());

      assert.equal(messages[1], 'Ember  : ' + _version.default);
      if (_views.jQueryDisabled) {
        assert.equal(messages[2], 'my-lib : ' + '2.0.0a');
      } else {
        assert.equal(messages[2], 'jQuery : ' + (0, _views.jQuery)().jquery);
        assert.equal(messages[3], 'my-lib : ' + '2.0.0a');
      }

      _metal.libraries.deRegister('my-lib');
    }

    [`@test disable log of version of libraries with an ENV var`](assert) {
      let logged = false;

      _environment.ENV.LOG_VERSION = false;

      (0, _debug.setDebugFunction)('debug', () => logged = true);

      this.runTask(() => this.createApplication());

      assert.ok(!logged, 'library version logging skipped');
    }

    [`@test can resolve custom router`](assert) {
      let CustomRouter = _routing.Router.extend();

      this.runTask(() => {
        this.createApplication();
        this.add('router:main', CustomRouter);
      });

      assert.ok(this.application.__deprecatedInstance__.lookup('router:main') instanceof CustomRouter, 'application resolved the correct router');
    }

    [`@test does not leak itself in onLoad._loaded`](assert) {
      assert.equal(_application._loaded.application, undefined);
      this.runTask(() => this.createApplication());
      assert.equal(_application._loaded.application, this.application);
      this.runTask(() => this.application.destroy());
      assert.equal(_application._loaded.application, undefined);
    }

    [`@test can build a registry via Application.buildRegistry() --- simulates ember-test-helpers`](assert) {
      let namespace = _runtime.Object.create({
        Resolver: { create: function () {} }
      });

      let registry = _application.default.buildRegistry(namespace);

      assert.equal(registry.resolve('application:main'), namespace);
    }
  });

  (0, _internalTestHelpers.moduleFor)('Application#buildRegistry', class extends _internalTestHelpers.AbstractTestCase {
    [`@test can build a registry via Application.buildRegistry() --- simulates ember-test-helpers`](assert) {
      let namespace = _runtime.Object.create({
        Resolver: { create() {} }
      });

      let registry = _application.default.buildRegistry(namespace);

      assert.equal(registry.resolve('application:main'), namespace);
    }
  });

  (0, _internalTestHelpers.moduleFor)('Application - instance tracking', class extends _internalTestHelpers.ApplicationTestCase {
    ['@test tracks built instance'](assert) {
      let instance = this.application.buildInstance();
      (0, _runloop.run)(() => {
        this.application.destroy();
      });

      assert.ok(instance.isDestroyed, 'instance was destroyed');
    }

    ['@test tracks built instances'](assert) {
      let instanceA = this.application.buildInstance();
      let instanceB = this.application.buildInstance();
      (0, _runloop.run)(() => {
        this.application.destroy();
      });

      assert.ok(instanceA.isDestroyed, 'instanceA was destroyed');
      assert.ok(instanceB.isDestroyed, 'instanceB was destroyed');
    }
  });
});
enifed('@ember/application/tests/bootstrap-test', ['@ember/polyfills', 'internal-test-helpers'], function (_polyfills, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Application with default resolver and autoboot', class extends _internalTestHelpers.DefaultResolverApplicationTestCase {
    get fixture() {
      return `
      <div id="app"></div>

      <script type="text/x-handlebars">Hello {{outlet}}</script>
      <script type="text/x-handlebars" id="index">World!</script>
    `;
    }

    get applicationOptions() {
      return (0, _polyfills.assign)(super.applicationOptions, {
        autoboot: true,
        rootElement: '#app'
      });
    }

    ['@test templates in script tags are extracted at application creation'](assert) {
      this.runTask(() => this.createApplication());
      assert.equal(document.getElementById('app').textContent, 'Hello World!');
    }
  });
});
enifed('@ember/application/tests/dependency_injection/custom_resolver_test', ['@ember/application/globals-resolver', '@ember/polyfills', 'internal-test-helpers'], function (_globalsResolver, _polyfills, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Application with extended default resolver and autoboot', class extends _internalTestHelpers.DefaultResolverApplicationTestCase {
    get applicationOptions() {
      let applicationTemplate = this.compile(`<h1>Fallback</h1>`);

      let Resolver = _globalsResolver.default.extend({
        resolveTemplate(resolvable) {
          if (resolvable.fullNameWithoutType === 'application') {
            return applicationTemplate;
          } else {
            return this._super(resolvable);
          }
        }
      });

      return (0, _polyfills.assign)(super.applicationOptions, {
        Resolver,
        autoboot: true
      });
    }

    [`@test a resolver can be supplied to application`]() {
      this.runTask(() => this.createApplication());
      this.assertText('Fallback');
    }
  });
});
enifed('@ember/application/tests/dependency_injection/default_resolver_test', ['internal-test-helpers', '@ember/-internals/environment', '@ember/controller', '@ember/service', '@ember/-internals/runtime', '@ember/-internals/routing', '@ember/-internals/glimmer', '@ember/debug'], function (_internalTestHelpers, _environment, _controller, _service, _runtime, _routing, _glimmer, _debug) {
  'use strict';

  /* globals EmberDev */
  (0, _internalTestHelpers.moduleFor)('Application Dependency Injection - Integration - default resolver', class extends _internalTestHelpers.DefaultResolverApplicationTestCase {
    beforeEach() {
      this.runTask(() => this.createApplication());
      return this.visit('/');
    }

    get privateRegistry() {
      return this.application.__registry__;
    }

    /*
    * This first batch of tests are integration tests against the public
    * applicationInstance API.
    */

    [`@test the default resolver looks up templates in Ember.TEMPLATES`](assert) {
      let fooTemplate = this.addTemplate('foo', `foo template`);
      let fooBarTemplate = this.addTemplate('fooBar', `fooBar template`);
      let fooBarBazTemplate = this.addTemplate('fooBar/baz', `fooBar/baz template`);

      assert.equal(this.applicationInstance.factoryFor('template:foo').class, fooTemplate, 'resolves template:foo');
      assert.equal(this.applicationInstance.factoryFor('template:fooBar').class, fooBarTemplate, 'resolves template:foo_bar');
      assert.equal(this.applicationInstance.factoryFor('template:fooBar.baz').class, fooBarBazTemplate, 'resolves template:foo_bar.baz');
    }

    [`@test the default resolver looks up basic name as no prefix`](assert) {
      let instance = this.applicationInstance.lookup('controller:basic');
      assert.ok(_controller.default.detect(instance), 'locator looks up correct controller');
    }

    [`@test the default resolver looks up arbitrary types on the namespace`](assert) {
      let Class = this.application.FooManager = _runtime.Object.extend();
      let resolvedClass = this.application.resolveRegistration('manager:foo');
      assert.equal(Class, resolvedClass, 'looks up FooManager on application');
    }

    [`@test the default resolver resolves models on the namespace`](assert) {
      let Class = this.application.Post = _runtime.Object.extend();
      let factoryClass = this.applicationInstance.factoryFor('model:post').class;
      assert.equal(Class, factoryClass, 'looks up Post model on application');
    }

    [`@test the default resolver resolves *:main on the namespace`](assert) {
      let Class = this.application.FooBar = _runtime.Object.extend();
      let factoryClass = this.applicationInstance.factoryFor('foo-bar:main').class;
      assert.equal(Class, factoryClass, 'looks up FooBar type without name on application');
    }

    [`@test the default resolver resolves container-registered helpers`](assert) {
      let shorthandHelper = (0, _glimmer.helper)(() => {});
      let helper = _glimmer.Helper.extend();

      this.application.register('helper:shorthand', shorthandHelper);
      this.application.register('helper:complete', helper);

      let lookedUpShorthandHelper = this.applicationInstance.factoryFor('helper:shorthand').class;

      assert.ok(lookedUpShorthandHelper.isHelperFactory, 'shorthand helper isHelper');

      let lookedUpHelper = this.applicationInstance.factoryFor('helper:complete').class;

      assert.ok(lookedUpHelper.isHelperFactory, 'complete helper is factory');
      assert.ok(helper.detect(lookedUpHelper), 'looked up complete helper');
    }

    [`@test the default resolver resolves container-registered helpers via lookupFor`](assert) {
      let shorthandHelper = (0, _glimmer.helper)(() => {});
      let helper = _glimmer.Helper.extend();

      this.application.register('helper:shorthand', shorthandHelper);
      this.application.register('helper:complete', helper);

      let lookedUpShorthandHelper = this.applicationInstance.factoryFor('helper:shorthand').class;

      assert.ok(lookedUpShorthandHelper.isHelperFactory, 'shorthand helper isHelper');

      let lookedUpHelper = this.applicationInstance.factoryFor('helper:complete').class;

      assert.ok(lookedUpHelper.isHelperFactory, 'complete helper is factory');
      assert.ok(helper.detect(lookedUpHelper), 'looked up complete helper');
    }

    [`@test the default resolver resolves helpers on the namespace`](assert) {
      let ShorthandHelper = (0, _glimmer.helper)(() => {});
      let CompleteHelper = _glimmer.Helper.extend();

      this.application.ShorthandHelper = ShorthandHelper;
      this.application.CompleteHelper = CompleteHelper;

      let resolvedShorthand = this.application.resolveRegistration('helper:shorthand');
      let resolvedComplete = this.application.resolveRegistration('helper:complete');

      assert.equal(resolvedShorthand, ShorthandHelper, 'resolve fetches the shorthand helper factory');
      assert.equal(resolvedComplete, CompleteHelper, 'resolve fetches the complete helper factory');
    }

    [`@test the default resolver resolves to the same instance, no matter the notation `](assert) {
      this.application.NestedPostController = _controller.default.extend({});

      assert.equal(this.applicationInstance.lookup('controller:nested-post'), this.applicationInstance.lookup('controller:nested_post'), 'looks up NestedPost controller on application');
    }

    [`@test the default resolver throws an error if the fullName to resolve is invalid`]() {
      expectAssertion(() => {
        this.applicationInstance.resolveRegistration(undefined);
      }, /fullName must be a proper full name/);
      expectAssertion(() => {
        this.applicationInstance.resolveRegistration(null);
      }, /fullName must be a proper full name/);
      expectAssertion(() => {
        this.applicationInstance.resolveRegistration('');
      }, /fullName must be a proper full name/);
      expectAssertion(() => {
        this.applicationInstance.resolveRegistration('');
      }, /fullName must be a proper full name/);
      expectAssertion(() => {
        this.applicationInstance.resolveRegistration(':');
      }, /fullName must be a proper full name/);
      expectAssertion(() => {
        this.applicationInstance.resolveRegistration('model');
      }, /fullName must be a proper full name/);
      expectAssertion(() => {
        this.applicationInstance.resolveRegistration('model:');
      }, /fullName must be a proper full name/);
      expectAssertion(() => {
        this.applicationInstance.resolveRegistration(':type');
      }, /fullName must be a proper full name/);
    }

    /*
    * The following are integration tests against the private registry API.
    */

    [`@test lookup description`](assert) {
      this.application.toString = () => 'App';

      assert.equal(this.privateRegistry.describe('controller:foo'), 'App.FooController', 'Type gets appended at the end');
      assert.equal(this.privateRegistry.describe('controller:foo.bar'), 'App.FooBarController', 'dots are removed');
      assert.equal(this.privateRegistry.describe('model:foo'), 'App.Foo', "models don't get appended at the end");
    }

    [`@test assertion for routes without isRouteFactory property`]() {
      this.application.FooRoute = _glimmer.Component.extend();

      expectAssertion(() => {
        this.privateRegistry.resolve(`route:foo`);
      }, /to resolve to an Ember.Route/, 'Should assert');
    }

    [`@test no assertion for routes that extend from Route`](assert) {
      assert.expect(0);
      this.application.FooRoute = _routing.Route.extend();
      this.privateRegistry.resolve(`route:foo`);
    }

    [`@test deprecation warning for service factories without isServiceFactory property`]() {
      expectAssertion(() => {
        this.application.FooService = _runtime.Object.extend();
        this.privateRegistry.resolve('service:foo');
      }, /Expected service:foo to resolve to an Ember.Service but instead it was TestApp\.FooService\./);
    }

    [`@test no deprecation warning for service factories that extend from Service`](assert) {
      assert.expect(0);
      this.application.FooService = _service.default.extend();
      this.privateRegistry.resolve('service:foo');
    }

    [`@test deprecation warning for component factories without isComponentFactory property`]() {
      expectAssertion(() => {
        this.application.FooComponent = _runtime.Object.extend();
        this.privateRegistry.resolve('component:foo');
      }, /Expected component:foo to resolve to an Ember\.Component but instead it was TestApp\.FooComponent\./);
    }

    [`@test no deprecation warning for component factories that extend from Component`]() {
      expectNoDeprecation();
      this.application.FooView = _glimmer.Component.extend();
      this.privateRegistry.resolve('component:foo');
    }

    [`@test knownForType returns each item for a given type found`](assert) {
      this.application.FooBarHelper = 'foo';
      this.application.BazQuxHelper = 'bar';

      let found = this.privateRegistry.resolver.knownForType('helper');

      assert.deepEqual(found, {
        'helper:foo-bar': true,
        'helper:baz-qux': true
      });
    }

    [`@test knownForType is not required to be present on the resolver`](assert) {
      delete this.privateRegistry.resolver.knownForType;

      this.privateRegistry.resolver.knownForType('helper', () => {});

      assert.ok(true, 'does not error');
    }
  });

  (0, _internalTestHelpers.moduleFor)('Application Dependency Injection - Integration - default resolver w/ other namespace', class extends _internalTestHelpers.DefaultResolverApplicationTestCase {
    beforeEach() {
      this.UserInterface = _environment.context.lookup.UserInterface = _runtime.Namespace.create();
      this.runTask(() => this.createApplication());
      return this.visit('/');
    }

    teardown() {
      let UserInterfaceNamespace = _runtime.Namespace.NAMESPACES_BY_ID['UserInterface'];
      if (UserInterfaceNamespace) {
        this.runTask(() => {
          UserInterfaceNamespace.destroy();
        });
      }
      super.teardown();
    }

    [`@test the default resolver can look things up in other namespaces`](assert) {
      this.UserInterface.NavigationController = _controller.default.extend();

      let nav = this.applicationInstance.lookup('controller:userInterface/navigation');

      assert.ok(nav instanceof this.UserInterface.NavigationController, 'the result should be an instance of the specified class');
    }
  });

  (0, _internalTestHelpers.moduleFor)('Application Dependency Injection - Integration - default resolver', class extends _internalTestHelpers.DefaultResolverApplicationTestCase {
    constructor() {
      super();
      this._originalLookup = _environment.context.lookup;
      this._originalInfo = (0, _debug.getDebugFunction)('info');
    }

    beforeEach() {
      this.runTask(() => this.createApplication());
      return this.visit('/');
    }

    teardown() {
      (0, _debug.setDebugFunction)('info', this._originalInfo);
      _environment.context.lookup = this._originalLookup;
      super.teardown();
    }

    [`@test the default resolver logs hits if 'LOG_RESOLVER' is set`](assert) {
      if (EmberDev && EmberDev.runningProdBuild) {
        assert.ok(true, 'Logging does not occur in production builds');
        return;
      }

      assert.expect(3);

      this.application.LOG_RESOLVER = true;
      this.application.ScoobyDoo = _runtime.Object.extend();
      this.application.toString = () => 'App';

      (0, _debug.setDebugFunction)('info', function (symbol, name, padding, lookupDescription) {
        assert.equal(symbol, '[✓]', 'proper symbol is printed when a module is found');
        assert.equal(name, 'doo:scooby', 'proper lookup value is logged');
        assert.equal(lookupDescription, 'App.ScoobyDoo');
      });

      this.applicationInstance.resolveRegistration('doo:scooby');
    }

    [`@test the default resolver logs misses if 'LOG_RESOLVER' is set`](assert) {
      if (EmberDev && EmberDev.runningProdBuild) {
        assert.ok(true, 'Logging does not occur in production builds');
        return;
      }

      assert.expect(3);

      this.application.LOG_RESOLVER = true;
      this.application.toString = () => 'App';

      (0, _debug.setDebugFunction)('info', function (symbol, name, padding, lookupDescription) {
        assert.equal(symbol, '[ ]', 'proper symbol is printed when a module is not found');
        assert.equal(name, 'doo:scooby', 'proper lookup value is logged');
        assert.equal(lookupDescription, 'App.ScoobyDoo');
      });

      this.applicationInstance.resolveRegistration('doo:scooby');
    }

    [`@test doesn't log without LOG_RESOLVER`](assert) {
      if (EmberDev && EmberDev.runningProdBuild) {
        assert.ok(true, 'Logging does not occur in production builds');
        return;
      }

      let infoCount = 0;

      this.application.ScoobyDoo = _runtime.Object.extend();

      (0, _debug.setDebugFunction)('info', () => infoCount = infoCount + 1);

      this.applicationInstance.resolveRegistration('doo:scooby');
      this.applicationInstance.resolveRegistration('doo:scrappy');
      assert.equal(infoCount, 0, 'console.info should not be called if LOG_RESOLVER is not set');
    }
  });
});
enifed('@ember/application/tests/dependency_injection/normalization_test', ['@ember/runloop', '@ember/application', 'internal-test-helpers'], function (_runloop, _application, _internalTestHelpers) {
  'use strict';

  let application, registry;

  (0, _internalTestHelpers.moduleFor)('Application Dependency Injection - normalize', class extends _internalTestHelpers.AbstractTestCase {
    constructor() {
      super();

      application = (0, _runloop.run)(_application.default, 'create');
      registry = application.__registry__;
    }

    teardown() {
      super.teardown();
      (0, _runloop.run)(application, 'destroy');
      application = undefined;
      registry = undefined;
    }

    ['@test normalization'](assert) {
      assert.ok(registry.normalize, 'registry#normalize is present');

      assert.equal(registry.normalize('foo:bar'), 'foo:bar');

      assert.equal(registry.normalize('controller:posts'), 'controller:posts');
      assert.equal(registry.normalize('controller:posts_index'), 'controller:postsIndex');
      assert.equal(registry.normalize('controller:posts.index'), 'controller:postsIndex');
      assert.equal(registry.normalize('controller:posts-index'), 'controller:postsIndex');
      assert.equal(registry.normalize('controller:posts.post.index'), 'controller:postsPostIndex');
      assert.equal(registry.normalize('controller:posts_post.index'), 'controller:postsPostIndex');
      assert.equal(registry.normalize('controller:posts.post_index'), 'controller:postsPostIndex');
      assert.equal(registry.normalize('controller:posts.post-index'), 'controller:postsPostIndex');
      assert.equal(registry.normalize('controller:postsIndex'), 'controller:postsIndex');
      assert.equal(registry.normalize('controller:blogPosts.index'), 'controller:blogPostsIndex');
      assert.equal(registry.normalize('controller:blog/posts.index'), 'controller:blog/postsIndex');
      assert.equal(registry.normalize('controller:blog/posts-index'), 'controller:blog/postsIndex');
      assert.equal(registry.normalize('controller:blog/posts.post.index'), 'controller:blog/postsPostIndex');
      assert.equal(registry.normalize('controller:blog/posts_post.index'), 'controller:blog/postsPostIndex');
      assert.equal(registry.normalize('controller:blog/posts_post-index'), 'controller:blog/postsPostIndex');

      assert.equal(registry.normalize('template:blog/posts_index'), 'template:blog/posts_index');
    }

    ['@test normalization is indempotent'](assert) {
      let examples = ['controller:posts', 'controller:posts.post.index', 'controller:blog/posts.post_index', 'template:foo_bar'];

      examples.forEach(example => {
        assert.equal(registry.normalize(registry.normalize(example)), registry.normalize(example));
      });
    }
  });
});
enifed('@ember/application/tests/dependency_injection/to_string_test', ['@ember/polyfills', '@ember/-internals/utils', '@ember/-internals/runtime', 'internal-test-helpers'], function (_polyfills, _utils, _runtime, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Application Dependency Injection - DefaultResolver#toString', class extends _internalTestHelpers.DefaultResolverApplicationTestCase {
    constructor() {
      super();
      this.runTask(() => this.createApplication());
      this.application.Post = _runtime.Object.extend();
    }

    beforeEach() {
      return this.visit('/');
    }

    ['@test factories'](assert) {
      let PostFactory = this.applicationInstance.factoryFor('model:post').class;
      assert.equal(PostFactory.toString(), 'TestApp.Post', 'expecting the model to be post');
    }

    ['@test instances'](assert) {
      let post = this.applicationInstance.lookup('model:post');
      let guid = (0, _utils.guidFor)(post);

      assert.equal(post.toString(), '<TestApp.Post:' + guid + '>', 'expecting the model to be post');
    }
  });

  (0, _internalTestHelpers.moduleFor)('Application Dependency Injection - Resolver#toString', class extends _internalTestHelpers.ApplicationTestCase {
    beforeEach() {
      return this.visit('/');
    }

    get applicationOptions() {
      return (0, _polyfills.assign)(super.applicationOptions, {
        Resolver: class extends _internalTestHelpers.ModuleBasedTestResolver {
          makeToString(_, fullName) {
            return fullName;
          }
        }
      });
    }

    ['@test toString called on a resolver'](assert) {
      this.add('model:peter', _runtime.Object.extend());

      let peter = this.applicationInstance.lookup('model:peter');
      let guid = (0, _utils.guidFor)(peter);
      assert.equal(peter.toString(), `<model:peter:${guid}>`, 'expecting the supermodel to be peter');
    }
  });
});
enifed('@ember/application/tests/dependency_injection_test', ['@ember/-internals/environment', '@ember/runloop', '@ember/-internals/runtime', '@ember/application', 'internal-test-helpers'], function (_environment, _runloop, _runtime, _application, _internalTestHelpers) {
  'use strict';

  let originalLookup = _environment.context.lookup;
  let registry, locator, application;

  (0, _internalTestHelpers.moduleFor)('Application Dependency Injection', class extends _internalTestHelpers.AbstractTestCase {
    constructor() {
      super();

      application = (0, _runloop.run)(_application.default, 'create');

      application.Person = _runtime.Object.extend({});
      application.Orange = _runtime.Object.extend({});
      application.Email = _runtime.Object.extend({});
      application.User = _runtime.Object.extend({});
      application.PostIndexController = _runtime.Object.extend({});

      application.register('model:person', application.Person, {
        singleton: false
      });
      application.register('model:user', application.User, {
        singleton: false
      });
      application.register('fruit:favorite', application.Orange);
      application.register('communication:main', application.Email, {
        singleton: false
      });
      application.register('controller:postIndex', application.PostIndexController, {
        singleton: true
      });

      registry = application.__registry__;
      locator = application.__container__;

      _environment.context.lookup = {};
    }

    teardown() {
      super.teardown();
      (0, _runloop.run)(application, 'destroy');
      registry = application = locator = null;
      _environment.context.lookup = originalLookup;
    }

    ['@test container lookup is normalized'](assert) {
      let dotNotationController = locator.lookup('controller:post.index');
      let camelCaseController = locator.lookup('controller:postIndex');

      assert.ok(dotNotationController instanceof application.PostIndexController);
      assert.ok(camelCaseController instanceof application.PostIndexController);

      assert.equal(dotNotationController, camelCaseController);
    }

    ['@test registered entities can be looked up later'](assert) {
      assert.equal(registry.resolve('model:person'), application.Person);
      assert.equal(registry.resolve('model:user'), application.User);
      assert.equal(registry.resolve('fruit:favorite'), application.Orange);
      assert.equal(registry.resolve('communication:main'), application.Email);
      assert.equal(registry.resolve('controller:postIndex'), application.PostIndexController);

      assert.equal(locator.lookup('fruit:favorite'), locator.lookup('fruit:favorite'), 'singleton lookup worked');
      assert.ok(locator.lookup('model:user') !== locator.lookup('model:user'), 'non-singleton lookup worked');
    }

    ['@test injections'](assert) {
      application.inject('model', 'fruit', 'fruit:favorite');
      application.inject('model:user', 'communication', 'communication:main');

      let user = locator.lookup('model:user');
      let person = locator.lookup('model:person');
      let fruit = locator.lookup('fruit:favorite');

      assert.equal(user.get('fruit'), fruit);
      assert.equal(person.get('fruit'), fruit);

      assert.ok(application.Email.detectInstance(user.get('communication')));
    }
  });
});
enifed('@ember/application/tests/initializers_test', ['@ember/polyfills', 'internal-test-helpers', '@ember/application'], function (_polyfills, _internalTestHelpers, _application) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Application initializers', class extends _internalTestHelpers.AutobootApplicationTestCase {
    get fixture() {
      return `<div id="one">ONE</div>
      <div id="two">TWO</div>
    `;
    }

    get applicationOptions() {
      return (0, _polyfills.assign)(super.applicationOptions, {
        rootElement: '#one'
      });
    }

    createSecondApplication(options, MyApplication = _application.default) {
      let myOptions = (0, _polyfills.assign)(this.applicationOptions, {
        rootElement: '#two'
      }, options);
      let secondApp = this.secondApp = MyApplication.create(myOptions);
      return secondApp;
    }

    teardown() {
      super.teardown();

      if (this.secondApp) {
        this.runTask(() => this.secondApp.destroy());
      }
    }

    [`@test initializers require proper 'name' and 'initialize' properties`]() {
      let MyApplication = _application.default.extend();

      expectAssertion(() => {
        MyApplication.initializer({ name: 'initializer' });
      });

      expectAssertion(() => {
        MyApplication.initializer({ initialize() {} });
      });
    }

    [`@test initializers that throw errors cause the boot promise to reject with the error`](assert) {
      assert.expect(2);

      let MyApplication = _application.default.extend();

      MyApplication.initializer({
        name: 'initializer',
        initialize() {
          throw new Error('boot failure');
        }
      });

      this.runTask(() => {
        this.createApplication({
          autoboot: false
        }, MyApplication);
      });

      let app = this.application;

      try {
        this.runTask(() => {
          app.boot().then(() => {
            assert.ok(false, 'The boot promise should not resolve when there is a boot error');
          }, error => {
            assert.ok(error instanceof Error, 'The boot promise should reject with an error');
            assert.equal(error.message, 'boot failure');
          });
        });
      } catch (error) {
        assert.ok(false, 'The boot method should not throw');
        throw error;
      }
    }

    [`@test initializers are passed an App`](assert) {
      let MyApplication = _application.default.extend();

      MyApplication.initializer({
        name: 'initializer',
        initialize(App) {
          assert.ok(App instanceof _application.default, 'initialize is passed an Application');
        }
      });

      this.runTask(() => this.createApplication({}, MyApplication));
    }

    [`@test initializers can be registered in a specified order`](assert) {
      let order = [];
      let MyApplication = _application.default.extend();

      MyApplication.initializer({
        name: 'fourth',
        after: 'third',
        initialize() {
          order.push('fourth');
        }
      });

      MyApplication.initializer({
        name: 'second',
        after: 'first',
        before: 'third',
        initialize() {
          order.push('second');
        }
      });

      MyApplication.initializer({
        name: 'fifth',
        after: 'fourth',
        before: 'sixth',
        initialize() {
          order.push('fifth');
        }
      });

      MyApplication.initializer({
        name: 'first',
        before: 'second',
        initialize() {
          order.push('first');
        }
      });

      MyApplication.initializer({
        name: 'third',
        initialize() {
          order.push('third');
        }
      });

      MyApplication.initializer({
        name: 'sixth',
        initialize() {
          order.push('sixth');
        }
      });

      this.runTask(() => this.createApplication({}, MyApplication));

      assert.deepEqual(order, ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']);
    }

    [`@test initializers can be registered in a specified order as an array`](assert) {
      let order = [];
      let MyApplication = _application.default.extend();

      MyApplication.initializer({
        name: 'third',
        initialize() {
          order.push('third');
        }
      });

      MyApplication.initializer({
        name: 'second',
        after: 'first',
        before: ['third', 'fourth'],
        initialize() {
          order.push('second');
        }
      });

      MyApplication.initializer({
        name: 'fourth',
        after: ['second', 'third'],
        initialize() {
          order.push('fourth');
        }
      });

      MyApplication.initializer({
        name: 'fifth',
        after: 'fourth',
        before: 'sixth',
        initialize() {
          order.push('fifth');
        }
      });

      MyApplication.initializer({
        name: 'first',
        before: ['second'],
        initialize() {
          order.push('first');
        }
      });

      MyApplication.initializer({
        name: 'sixth',
        initialize() {
          order.push('sixth');
        }
      });

      this.runTask(() => this.createApplication({}, MyApplication));

      assert.deepEqual(order, ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']);
    }

    [`@test initializers can have multiple dependencies`](assert) {
      let order = [];
      let MyApplication = _application.default.extend();
      let a = {
        name: 'a',
        before: 'b',
        initialize() {
          order.push('a');
        }
      };
      let b = {
        name: 'b',
        initialize() {
          order.push('b');
        }
      };
      let c = {
        name: 'c',
        after: 'b',
        initialize() {
          order.push('c');
        }
      };
      let afterB = {
        name: 'after b',
        after: 'b',
        initialize() {
          order.push('after b');
        }
      };
      let afterC = {
        name: 'after c',
        after: 'c',
        initialize() {
          order.push('after c');
        }
      };

      MyApplication.initializer(b);
      MyApplication.initializer(a);
      MyApplication.initializer(afterC);
      MyApplication.initializer(afterB);
      MyApplication.initializer(c);

      this.runTask(() => this.createApplication({}, MyApplication));

      assert.ok(order.indexOf(a.name) < order.indexOf(b.name), 'a < b');
      assert.ok(order.indexOf(b.name) < order.indexOf(c.name), 'b < c');
      assert.ok(order.indexOf(b.name) < order.indexOf(afterB.name), 'b < afterB');
      assert.ok(order.indexOf(c.name) < order.indexOf(afterC.name), 'c < afterC');
    }

    [`@test initializers set on Application subclasses are not shared between apps`](assert) {
      let firstInitializerRunCount = 0;
      let secondInitializerRunCount = 0;
      let FirstApp = _application.default.extend();

      FirstApp.initializer({
        name: 'first',
        initialize() {
          firstInitializerRunCount++;
        }
      });

      let SecondApp = _application.default.extend();

      SecondApp.initializer({
        name: 'second',
        initialize() {
          secondInitializerRunCount++;
        }
      });

      this.runTask(() => this.createApplication({}, FirstApp));

      assert.equal(firstInitializerRunCount, 1, 'first initializer only was run');
      assert.equal(secondInitializerRunCount, 0, 'first initializer only was run');

      this.runTask(() => this.createSecondApplication({}, SecondApp));

      assert.equal(firstInitializerRunCount, 1, 'second initializer only was run');
      assert.equal(secondInitializerRunCount, 1, 'second initializer only was run');
    }

    [`@test initializers are concatenated`](assert) {
      let firstInitializerRunCount = 0;
      let secondInitializerRunCount = 0;
      let FirstApp = _application.default.extend();

      FirstApp.initializer({
        name: 'first',
        initialize() {
          firstInitializerRunCount++;
        }
      });

      let SecondApp = FirstApp.extend();
      SecondApp.initializer({
        name: 'second',
        initialize() {
          secondInitializerRunCount++;
        }
      });

      this.runTask(() => this.createApplication({}, FirstApp));

      assert.equal(firstInitializerRunCount, 1, 'first initializer only was run when base class created');
      assert.equal(secondInitializerRunCount, 0, 'first initializer only was run when base class created');

      firstInitializerRunCount = 0;
      this.runTask(() => this.createSecondApplication({}, SecondApp));

      assert.equal(firstInitializerRunCount, 1, 'first initializer was run when subclass created');
      assert.equal(secondInitializerRunCount, 1, 'second initializers was run when subclass created');
    }

    [`@test initializers are per-app`](assert) {
      assert.expect(2);

      let FirstApp = _application.default.extend();

      FirstApp.initializer({
        name: 'abc',
        initialize() {}
      });

      expectAssertion(() => {
        FirstApp.initializer({
          name: 'abc',
          initialize() {}
        });
      });

      let SecondApp = _application.default.extend();
      SecondApp.instanceInitializer({
        name: 'abc',
        initialize() {}
      });

      assert.ok(true, 'Two apps can have initializers named the same.');
    }

    [`@test initializers are executed in their own context`](assert) {
      assert.expect(1);
      let MyApplication = _application.default.extend();

      MyApplication.initializer({
        name: 'coolInitializer',
        myProperty: 'cool',
        initialize() {
          assert.equal(this.myProperty, 'cool', 'should have access to its own context');
        }
      });

      this.runTask(() => this.createApplication({}, MyApplication));
    }
  });
});
enifed('@ember/application/tests/instance_initializers_test', ['@ember/polyfills', 'internal-test-helpers', '@ember/application/instance', '@ember/application'], function (_polyfills, _internalTestHelpers, _instance, _application) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Application instance initializers', class extends _internalTestHelpers.AutobootApplicationTestCase {
    get fixture() {
      return `<div id="one">ONE</div>
      <div id="two">TWO</div>
    `;
    }

    get applicationOptions() {
      return (0, _polyfills.assign)(super.applicationOptions, {
        rootElement: '#one'
      });
    }

    createSecondApplication(options, MyApplication = _application.default) {
      let myOptions = (0, _polyfills.assign)(this.applicationOptions, {
        rootElement: '#two'
      }, options);
      let secondApp = this.secondApp = MyApplication.create(myOptions);
      return secondApp;
    }

    teardown() {
      super.teardown();

      if (this.secondApp) {
        this.runTask(() => this.secondApp.destroy());
      }
    }

    [`@test initializers require proper 'name' and 'initialize' properties`]() {
      let MyApplication = _application.default.extend();

      expectAssertion(() => {
        MyApplication.instanceInitializer({ name: 'initializer' });
      });

      expectAssertion(() => {
        MyApplication.instanceInitializer({ initialize() {} });
      });

      this.runTask(() => this.createApplication({}, MyApplication));
    }

    [`@test initializers are passed an app instance`](assert) {
      let MyApplication = _application.default.extend();

      MyApplication.instanceInitializer({
        name: 'initializer',
        initialize(instance) {
          assert.ok(instance instanceof _instance.default, 'initialize is passed an application instance');
        }
      });

      this.runTask(() => this.createApplication({}, MyApplication));
    }

    [`@test initializers can be registered in a specified order`](assert) {
      let order = [];
      let MyApplication = _application.default.extend();

      MyApplication.instanceInitializer({
        name: 'fourth',
        after: 'third',
        initialize() {
          order.push('fourth');
        }
      });

      MyApplication.instanceInitializer({
        name: 'second',
        after: 'first',
        before: 'third',
        initialize() {
          order.push('second');
        }
      });

      MyApplication.instanceInitializer({
        name: 'fifth',
        after: 'fourth',
        before: 'sixth',
        initialize() {
          order.push('fifth');
        }
      });

      MyApplication.instanceInitializer({
        name: 'first',
        before: 'second',
        initialize() {
          order.push('first');
        }
      });

      MyApplication.instanceInitializer({
        name: 'third',
        initialize() {
          order.push('third');
        }
      });

      MyApplication.instanceInitializer({
        name: 'sixth',
        initialize() {
          order.push('sixth');
        }
      });

      this.runTask(() => this.createApplication({}, MyApplication));

      assert.deepEqual(order, ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']);
    }

    [`@test initializers can be registered in a specified order as an array`](assert) {
      let order = [];
      let MyApplication = _application.default.extend();

      MyApplication.instanceInitializer({
        name: 'third',
        initialize() {
          order.push('third');
        }
      });

      MyApplication.instanceInitializer({
        name: 'second',
        after: 'first',
        before: ['third', 'fourth'],
        initialize() {
          order.push('second');
        }
      });

      MyApplication.instanceInitializer({
        name: 'fourth',
        after: ['second', 'third'],
        initialize() {
          order.push('fourth');
        }
      });

      MyApplication.instanceInitializer({
        name: 'fifth',
        after: 'fourth',
        before: 'sixth',
        initialize() {
          order.push('fifth');
        }
      });

      MyApplication.instanceInitializer({
        name: 'first',
        before: ['second'],
        initialize() {
          order.push('first');
        }
      });

      MyApplication.instanceInitializer({
        name: 'sixth',
        initialize() {
          order.push('sixth');
        }
      });

      this.runTask(() => this.createApplication({}, MyApplication));

      assert.deepEqual(order, ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']);
    }

    [`@test initializers can have multiple dependencies`](assert) {
      let order = [];
      let MyApplication = _application.default.extend();
      let a = {
        name: 'a',
        before: 'b',
        initialize() {
          order.push('a');
        }
      };
      let b = {
        name: 'b',
        initialize() {
          order.push('b');
        }
      };
      let c = {
        name: 'c',
        after: 'b',
        initialize() {
          order.push('c');
        }
      };
      let afterB = {
        name: 'after b',
        after: 'b',
        initialize() {
          order.push('after b');
        }
      };
      let afterC = {
        name: 'after c',
        after: 'c',
        initialize() {
          order.push('after c');
        }
      };

      MyApplication.instanceInitializer(b);
      MyApplication.instanceInitializer(a);
      MyApplication.instanceInitializer(afterC);
      MyApplication.instanceInitializer(afterB);
      MyApplication.instanceInitializer(c);

      this.runTask(() => this.createApplication({}, MyApplication));

      assert.ok(order.indexOf(a.name) < order.indexOf(b.name), 'a < b');
      assert.ok(order.indexOf(b.name) < order.indexOf(c.name), 'b < c');
      assert.ok(order.indexOf(b.name) < order.indexOf(afterB.name), 'b < afterB');
      assert.ok(order.indexOf(c.name) < order.indexOf(afterC.name), 'c < afterC');
    }

    [`@test initializers set on Application subclasses should not be shared between apps`](assert) {
      let firstInitializerRunCount = 0;
      let secondInitializerRunCount = 0;
      let FirstApp = _application.default.extend();

      FirstApp.instanceInitializer({
        name: 'first',
        initialize() {
          firstInitializerRunCount++;
        }
      });

      let SecondApp = _application.default.extend();
      SecondApp.instanceInitializer({
        name: 'second',
        initialize() {
          secondInitializerRunCount++;
        }
      });

      this.runTask(() => this.createApplication({}, FirstApp));

      assert.equal(firstInitializerRunCount, 1, 'first initializer only was run');
      assert.equal(secondInitializerRunCount, 0, 'first initializer only was run');

      this.runTask(() => this.createSecondApplication({}, SecondApp));

      assert.equal(firstInitializerRunCount, 1, 'second initializer only was run');
      assert.equal(secondInitializerRunCount, 1, 'second initializer only was run');
    }

    [`@test initializers are concatenated`](assert) {
      let firstInitializerRunCount = 0;
      let secondInitializerRunCount = 0;
      let FirstApp = _application.default.extend();

      FirstApp.instanceInitializer({
        name: 'first',
        initialize() {
          firstInitializerRunCount++;
        }
      });

      let SecondApp = FirstApp.extend();
      SecondApp.instanceInitializer({
        name: 'second',
        initialize() {
          secondInitializerRunCount++;
        }
      });

      this.runTask(() => this.createApplication({}, FirstApp));

      assert.equal(firstInitializerRunCount, 1, 'first initializer only was run when base class created');
      assert.equal(secondInitializerRunCount, 0, 'first initializer only was run when base class created');

      firstInitializerRunCount = 0;
      this.runTask(() => this.createSecondApplication({}, SecondApp));

      assert.equal(firstInitializerRunCount, 1, 'first initializer was run when subclass created');
      assert.equal(secondInitializerRunCount, 1, 'second initializers was run when subclass created');
    }

    [`@test initializers are per-app`](assert) {
      assert.expect(2);

      let FirstApp = _application.default.extend();
      FirstApp.instanceInitializer({
        name: 'abc',
        initialize() {}
      });

      expectAssertion(function () {
        FirstApp.instanceInitializer({
          name: 'abc',
          initialize() {}
        });
      });

      this.runTask(() => this.createApplication({}, FirstApp));

      let SecondApp = _application.default.extend();
      SecondApp.instanceInitializer({
        name: 'abc',
        initialize() {}
      });

      this.runTask(() => this.createSecondApplication({}, SecondApp));

      assert.ok(true, 'Two apps can have initializers named the same.');
    }

    [`@test initializers are run before ready hook`](assert) {
      assert.expect(2);

      let MyApplication = _application.default.extend({
        ready() {
          assert.ok(true, 'ready is called');
          readyWasCalled = false;
        }
      });
      let readyWasCalled = false;

      MyApplication.instanceInitializer({
        name: 'initializer',
        initialize() {
          assert.ok(!readyWasCalled, 'ready is not yet called');
        }
      });

      this.runTask(() => this.createApplication({}, MyApplication));
    }

    [`@test initializers are executed in their own context`](assert) {
      assert.expect(1);

      let MyApplication = _application.default.extend();

      MyApplication.instanceInitializer({
        name: 'coolInitializer',
        myProperty: 'cool',
        initialize() {
          assert.equal(this.myProperty, 'cool', 'should have access to its own context');
        }
      });

      this.runTask(() => this.createApplication({}, MyApplication));
    }

    [`@test initializers get an instance on app reset`](assert) {
      assert.expect(2);

      let MyApplication = _application.default.extend();

      MyApplication.instanceInitializer({
        name: 'giveMeAnInstance',
        initialize(instance) {
          assert.ok(!!instance, 'Initializer got an instance');
        }
      });

      this.runTask(() => this.createApplication({}, MyApplication));

      this.runTask(() => this.application.reset());
    }
  });
});
enifed('@ember/application/tests/lazy_load_test', ['@ember/runloop', '@ember/application', 'internal-test-helpers'], function (_runloop, _application, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Lazy Loading', class extends _internalTestHelpers.AbstractTestCase {
    afterEach() {
      let keys = Object.keys(_application._loaded);
      for (let i = 0; i < keys.length; i++) {
        delete _application._loaded[keys[i]];
      }
    }

    ['@test if a load hook is registered, it is executed when runLoadHooks are exected'](assert) {
      let count = 0;

      (0, _runloop.run)(function () {
        (0, _application.onLoad)('__test_hook__', function (object) {
          count += object;
        });
      });

      (0, _runloop.run)(function () {
        (0, _application.runLoadHooks)('__test_hook__', 1);
      });

      assert.equal(count, 1, 'the object was passed into the load hook');
    }

    ['@test if runLoadHooks was already run, it executes newly added hooks immediately'](assert) {
      let count = 0;
      (0, _runloop.run)(() => {
        (0, _application.onLoad)('__test_hook__', object => count += object);
      });

      (0, _runloop.run)(() => (0, _application.runLoadHooks)('__test_hook__', 1));

      count = 0;
      (0, _runloop.run)(() => {
        (0, _application.onLoad)('__test_hook__', object => count += object);
      });

      assert.equal(count, 1, 'the original object was passed into the load hook');
    }

    ["@test hooks in ENV.EMBER_LOAD_HOOKS['hookName'] get executed"](assert) {
      // Note that the necessary code to perform this test is run before
      // the Ember lib is loaded in tests/index.html

      (0, _runloop.run)(() => {
        (0, _application.runLoadHooks)('__before_ember_test_hook__', 1);
      });

      assert.equal(window.ENV.__test_hook_count__, 1, 'the object was passed into the load hook');
    }

    ['@test load hooks trigger a custom event'](assert) {
      if (typeof window === 'object' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
        let eventObject = 'super duper awesome events';

        window.addEventListener('__test_hook_for_events__', function (e) {
          assert.ok(true, 'custom event was fired');
          assert.equal(e.detail, eventObject, 'event details are provided properly');
        });

        (0, _runloop.run)(() => {
          (0, _application.runLoadHooks)('__test_hook_for_events__', eventObject);
        });
      } else {
        assert.expect(0);
      }
    }
  });
});
enifed('@ember/application/tests/logging_test', ['internal-test-helpers', '@ember/controller', '@ember/-internals/routing', '@ember/polyfills'], function (_internalTestHelpers, _controller, _routing, _polyfills) {
  'use strict';

  /*globals EmberDev */

  class LoggingApplicationTestCase extends _internalTestHelpers.ApplicationTestCase {
    constructor() {
      super();

      this.logs = {};

      /* eslint-disable no-console */
      this._originalLogger = console.info;

      console.info = (_, { fullName }) => {
        if (!this.logs.hasOwnProperty(fullName)) {
          this.logs[fullName] = 0;
        }
        /* eslint-ensable no-console */
        this.logs[fullName]++;
      };

      this.router.map(function () {
        this.route('posts', { resetNamespace: true });
      });
    }

    teardown() {
      /* eslint-disable no-console */
      console.info = this._originalLogger;
      /* eslint-enable no-console */
      super.teardown();
    }
  }

  (0, _internalTestHelpers.moduleFor)('Application with LOG_ACTIVE_GENERATION=true', class extends LoggingApplicationTestCase {
    get applicationOptions() {
      return (0, _polyfills.assign)(super.applicationOptions, {
        LOG_ACTIVE_GENERATION: true
      });
    }

    ['@test log class generation if logging enabled'](assert) {
      if (EmberDev && EmberDev.runningProdBuild) {
        assert.ok(true, 'Logging does not occur in production builds');
        return;
      }

      return this.visit('/posts').then(() => {
        assert.equal(Object.keys(this.logs).length, 4, 'expected logs');
      });
    }

    ['@test actively generated classes get logged'](assert) {
      if (EmberDev && EmberDev.runningProdBuild) {
        assert.ok(true, 'Logging does not occur in production builds');
        return;
      }

      return this.visit('/posts').then(() => {
        assert.equal(this.logs['controller:application'], 1, 'expected: ApplicationController was generated');
        assert.equal(this.logs['controller:posts'], 1, 'expected: PostsController was generated');

        assert.equal(this.logs['route:application'], 1, 'expected: ApplicationRoute was generated');
        assert.equal(this.logs['route:posts'], 1, 'expected: PostsRoute was generated');
      });
    }

    ['@test predefined classes do not get logged'](assert) {
      this.add('controller:application', _controller.default.extend());
      this.add('controller:posts', _controller.default.extend());
      this.add('route:application', _routing.Route.extend());
      this.add('route:posts', _routing.Route.extend());

      return this.visit('/posts').then(() => {
        assert.ok(!this.logs['controller:application'], 'did not expect: ApplicationController was generated');
        assert.ok(!this.logs['controller:posts'], 'did not expect: PostsController was generated');

        assert.ok(!this.logs['route:application'], 'did not expect: ApplicationRoute was generated');
        assert.ok(!this.logs['route:posts'], 'did not expect: PostsRoute was generated');
      });
    }
  });

  (0, _internalTestHelpers.moduleFor)('Application when LOG_ACTIVE_GENERATION=false', class extends LoggingApplicationTestCase {
    get applicationOptions() {
      return (0, _polyfills.assign)(super.applicationOptions, {
        LOG_ACTIVE_GENERATION: false
      });
    }

    [`@test do NOT log class generation if logging disabled`](assert) {
      return this.visit('/posts').then(() => {
        assert.equal(Object.keys(this.logs).length, 0, 'expected logs');
      });
    }
  });

  (0, _internalTestHelpers.moduleFor)('Application with LOG_VIEW_LOOKUPS=true', class extends LoggingApplicationTestCase {
    get applicationOptions() {
      return (0, _polyfills.assign)(super.applicationOptions, {
        LOG_VIEW_LOOKUPS: true
      });
    }

    [`@test log when template and view are missing when flag is active`](assert) {
      if (EmberDev && EmberDev.runningProdBuild) {
        assert.ok(true, 'Logging does not occur in production builds');
        return;
      }

      this.addTemplate('application', '{{outlet}}');

      return this.visit('/').then(() => this.visit('/posts')).then(() => {
        assert.equal(this.logs['template:application'], undefined, 'expected: Should not log template:application since it exists.');
        assert.equal(this.logs['template:index'], 1, 'expected: Could not find "index" template or view.');
        assert.equal(this.logs['template:posts'], 1, 'expected: Could not find "posts" template or view.');
      });
    }
  });

  (0, _internalTestHelpers.moduleFor)('Application with LOG_VIEW_LOOKUPS=false', class extends LoggingApplicationTestCase {
    get applicationOptions() {
      return (0, _polyfills.assign)(super.applicationOptions, {
        LOG_VIEW_LOOKUPS: false
      });
    }

    [`@test do not log when template and view are missing when flag is not true`](assert) {
      return this.visit('/posts').then(() => {
        assert.equal(Object.keys(this.logs).length, 0, 'expected no logs');
      });
    }

    [`@test do not log which views are used with templates when flag is not true`](assert) {
      return this.visit('/posts').then(() => {
        assert.equal(Object.keys(this.logs).length, 0, 'expected no logs');
      });
    }
  });
});
enifed('@ember/application/tests/readiness_test', ['internal-test-helpers', '@ember/runloop', '@ember/application'], function (_internalTestHelpers, _runloop, _application) {
  'use strict';

  let jQuery, application, Application;
  let readyWasCalled, domReady, readyCallbacks;

  // We are using a small mock of jQuery because jQuery is third-party code with
  // very well-defined semantics, and we want to confirm that a jQuery stub run
  // in a more minimal server environment that implements this behavior will be
  // sufficient for Ember's requirements.
  (0, _internalTestHelpers.moduleFor)('Application readiness', class extends _internalTestHelpers.ApplicationTestCase {
    constructor() {
      super();

      readyWasCalled = 0;
      readyCallbacks = [];

      let jQueryInstance = {
        ready(callback) {
          readyCallbacks.push(callback);
          if (jQuery.isReady) {
            domReady();
          }
        }
      };

      jQuery = function () {
        return jQueryInstance;
      };
      jQuery.isReady = false;

      let domReadyCalled = 0;
      domReady = function () {
        if (domReadyCalled !== 0) {
          return;
        }
        domReadyCalled++;
        for (let i = 0; i < readyCallbacks.length; i++) {
          readyCallbacks[i]();
        }
      };

      Application = _application.default.extend({
        $: jQuery,

        ready() {
          readyWasCalled++;
        }
      });
    }

    teardown() {
      if (application) {
        (0, _runloop.run)(() => application.destroy());
        jQuery = readyCallbacks = domReady = Application = application = undefined;
      }
    }

    // These tests are confirming that if the callbacks passed into jQuery's ready hook is called
    // synchronously during the application's initialization, we get the same behavior as if
    // it was triggered after initialization.

    ["@test Application's ready event is called right away if jQuery is already ready"](assert) {
      jQuery.isReady = true;

      (0, _runloop.run)(() => {
        application = Application.create({ router: false });

        assert.equal(readyWasCalled, 0, 'ready is not called until later');
      });

      assert.equal(readyWasCalled, 1, 'ready was called');

      domReady();

      assert.equal(readyWasCalled, 1, "application's ready was not called again");
    }

    ["@test Application's ready event is called after the document becomes ready"](assert) {
      (0, _runloop.run)(() => {
        application = Application.create({ router: false });
      });

      assert.equal(readyWasCalled, 0, "ready wasn't called yet");

      domReady();

      assert.equal(readyWasCalled, 1, 'ready was called now that DOM is ready');
    }

    ["@test Application's ready event can be deferred by other components"](assert) {
      (0, _runloop.run)(() => {
        application = Application.create({ router: false });
        application.deferReadiness();
      });

      assert.equal(readyWasCalled, 0, "ready wasn't called yet");

      domReady();

      assert.equal(readyWasCalled, 0, "ready wasn't called yet");

      (0, _runloop.run)(() => {
        application.advanceReadiness();
        assert.equal(readyWasCalled, 0);
      });

      assert.equal(readyWasCalled, 1, 'ready was called now all readiness deferrals are advanced');
    }

    ["@test Application's ready event can be deferred by other components"](assert) {
      jQuery.isReady = false;

      (0, _runloop.run)(() => {
        application = Application.create({ router: false });
        application.deferReadiness();
        assert.equal(readyWasCalled, 0, "ready wasn't called yet");
      });

      domReady();

      assert.equal(readyWasCalled, 0, "ready wasn't called yet");

      (0, _runloop.run)(() => {
        application.advanceReadiness();
      });

      assert.equal(readyWasCalled, 1, 'ready was called now all readiness deferrals are advanced');

      expectAssertion(() => {
        application.deferReadiness();
      });
    }
  });
});
enifed('@ember/application/tests/reset_test', ['@ember/runloop', '@ember/-internals/metal', '@ember/controller', '@ember/-internals/routing', 'internal-test-helpers'], function (_runloop, _metal, _controller, _routing, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Application - resetting', class extends _internalTestHelpers.AutobootApplicationTestCase {
    ['@test Brings its own run-loop if not provided'](assert) {
      assert.expect(0);
      (0, _runloop.run)(() => this.createApplication());
      this.application.reset();
    }

    ['@test Does not bring its own run loop if one is already provided'](assert) {
      assert.expect(3);

      let didBecomeReady = false;

      (0, _runloop.run)(() => this.createApplication());

      (0, _runloop.run)(() => {
        this.application.ready = () => {
          didBecomeReady = true;
        };

        this.application.reset();

        this.application.deferReadiness();
        assert.ok(!didBecomeReady, 'app is not ready');
      });

      assert.ok(!didBecomeReady, 'app is not ready');
      (0, _runloop.run)(this.application, 'advanceReadiness');
      assert.ok(didBecomeReady, 'app is ready');
    }

    ['@test When an application is reset, new instances of controllers are generated'](assert) {
      (0, _runloop.run)(() => {
        this.createApplication();
        this.add('controller:academic', _controller.default.extend());
      });

      let firstController = this.applicationInstance.lookup('controller:academic');
      let secondController = this.applicationInstance.lookup('controller:academic');

      this.application.reset();

      let thirdController = this.applicationInstance.lookup('controller:academic');

      assert.strictEqual(firstController, secondController, 'controllers looked up in succession should be the same instance');

      assert.ok(firstController.isDestroying, 'controllers are destroyed when their application is reset');

      assert.notStrictEqual(firstController, thirdController, 'controllers looked up after the application is reset should not be the same instance');
    }

    ['@test When an application is reset, the eventDispatcher is destroyed and recreated'](assert) {
      let eventDispatcherWasSetup = 0;
      let eventDispatcherWasDestroyed = 0;

      let mockEventDispatcher = {
        setup() {
          eventDispatcherWasSetup++;
        },
        destroy() {
          eventDispatcherWasDestroyed++;
        }
      };

      (0, _runloop.run)(() => {
        this.createApplication();
        this.add('event_dispatcher:main', {
          create: () => mockEventDispatcher
        });

        assert.equal(eventDispatcherWasSetup, 0);
        assert.equal(eventDispatcherWasDestroyed, 0);
      });

      assert.equal(eventDispatcherWasSetup, 1);
      assert.equal(eventDispatcherWasDestroyed, 0);

      this.application.reset();

      assert.equal(eventDispatcherWasDestroyed, 1);
      assert.equal(eventDispatcherWasSetup, 2, 'setup called after reset');
    }

    ['@test When an application is reset, the router URL is reset to `/`'](assert) {
      (0, _runloop.run)(() => {
        this.createApplication();

        this.add('router:main', _routing.Router.extend({
          location: 'none'
        }));

        this.router.map(function () {
          this.route('one');
          this.route('two');
        });
      });

      let initialRouter, initialApplicationController;
      return this.visit('/one').then(() => {
        initialApplicationController = this.applicationInstance.lookup('controller:application');
        initialRouter = this.applicationInstance.lookup('router:main');
        let location = initialRouter.get('location');

        assert.equal(location.getURL(), '/one');
        assert.equal((0, _metal.get)(initialApplicationController, 'currentPath'), 'one');

        this.application.reset();

        return this.application._bootPromise;
      }).then(() => {
        let applicationController = this.applicationInstance.lookup('controller:application');
        assert.strictEqual(applicationController, undefined, 'application controller no longer exists');

        return this.visit('/one');
      }).then(() => {
        let applicationController = this.applicationInstance.lookup('controller:application');
        let router = this.applicationInstance.lookup('router:main');
        let location = router.get('location');

        assert.notEqual(initialRouter, router, 'a different router instance was created');
        assert.notEqual(initialApplicationController, applicationController, 'a different application controller is created');

        assert.equal(location.getURL(), '/one');
        assert.equal((0, _metal.get)(applicationController, 'currentPath'), 'one');
      });
    }

    ['@test When an application with advance/deferReadiness is reset, the app does correctly become ready after reset'](assert) {
      let readyCallCount = 0;

      (0, _runloop.run)(() => {
        this.createApplication({
          ready() {
            readyCallCount++;
          }
        });

        this.application.deferReadiness();
        assert.equal(readyCallCount, 0, 'ready has not yet been called');
      });

      (0, _runloop.run)(this.application, 'advanceReadiness');

      assert.equal(readyCallCount, 1, 'ready was called once');

      this.application.reset();

      assert.equal(readyCallCount, 2, 'ready was called twice');
    }
  });
});
enifed('@ember/application/tests/visit_test', ['internal-test-helpers', '@ember/service', '@ember/-internals/runtime', '@ember/runloop', '@ember/application', '@ember/application/instance', '@ember/engine', '@ember/-internals/routing', '@ember/-internals/glimmer', 'ember-template-compiler', '@ember/-internals/environment'], function (_internalTestHelpers, _service, _runtime, _runloop, _application, _instance, _engine, _routing, _glimmer, _emberTemplateCompiler, _environment) {
  'use strict';

  function expectAsyncError() {
    _runtime.RSVP.off('error');
  }

  (0, _internalTestHelpers.moduleFor)('Application - visit()', class extends _internalTestHelpers.ApplicationTestCase {
    teardown() {
      _runtime.RSVP.on('error', _runtime.onerrorDefault);
      _environment.ENV._APPLICATION_TEMPLATE_WRAPPER = false;
      super.teardown();
    }

    createApplication(options) {
      return super.createApplication(options, _application.default.extend());
    }

    assertEmptyFixture(message) {
      this.assert.strictEqual(document.getElementById('qunit-fixture').children.length, 0, `there are no elements in the fixture element ${message ? message : ''}`);
    }

    [`@test does not add serialize-mode markers by default`](assert) {
      let templateContent = '<div class="foo">Hi, Mom!</div>';
      this.addTemplate('index', templateContent);
      let rootElement = document.createElement('div');

      let bootOptions = {
        isBrowser: false,
        rootElement
      };

      _environment.ENV._APPLICATION_TEMPLATE_WRAPPER = false;
      return this.visit('/', bootOptions).then(() => {
        assert.equal(rootElement.innerHTML, templateContent, 'without serialize flag renders as expected');
      });
    }

    [`@test _renderMode: rehydration`](assert) {
      assert.expect(2);

      let indexTemplate = '<div class="foo">Hi, Mom!</div>';
      this.addTemplate('index', indexTemplate);
      let rootElement = document.createElement('div');

      let bootOptions = {
        isBrowser: false,
        rootElement,
        _renderMode: 'serialize'
      };

      _environment.ENV._APPLICATION_TEMPLATE_WRAPPER = false;

      return this.visit('/', bootOptions).then(instance => {
        assert.ok((0, _glimmer.isSerializationFirstNode)(instance.rootElement.firstChild), 'glimmer-vm comment node was not found');
      }).then(() => {
        return this.runTask(() => {
          this.applicationInstance.destroy();
          this.applicationInstance = null;
        });
      }).then(() => {
        bootOptions = {
          isBrowser: false,
          rootElement,
          _renderMode: 'rehydrate'
        };

        this.application.visit('/', bootOptions).then(instance => {
          assert.equal(instance.rootElement.innerHTML, indexTemplate, 'was not properly rehydrated');
        });
      });
    }

    // This tests whether the application is "autobooted" by registering an
    // instance initializer and asserting it never gets run. Since this is
    // inherently testing that async behavior *doesn't* happen, we set a
    // 500ms timeout to verify that when autoboot is set to false, the
    // instance initializer that would normally get called on DOM ready
    // does not fire.
    [`@test Applications with autoboot set to false do not autoboot`](assert) {
      function delay(time) {
        return new _runtime.RSVP.Promise(resolve => (0, _runloop.later)(resolve, time));
      }

      let appBooted = 0;
      let instanceBooted = 0;

      this.application.initializer({
        name: 'assert-no-autoboot',
        initialize() {
          appBooted++;
        }
      });

      this.application.instanceInitializer({
        name: 'assert-no-autoboot',
        initialize() {
          instanceBooted++;
        }
      });

      assert.ok(!this.applicationInstance, 'precond - no instance');
      assert.ok(appBooted === 0, 'precond - not booted');
      assert.ok(instanceBooted === 0, 'precond - not booted');

      // Continue after 500ms
      return delay(500).then(() => {
        assert.ok(appBooted === 0, '500ms elapsed without app being booted');
        assert.ok(instanceBooted === 0, '500ms elapsed without instances being booted');

        return this.runTask(() => this.application.boot());
      }).then(() => {
        assert.ok(appBooted === 1, 'app should boot when manually calling `app.boot()`');
        assert.ok(instanceBooted === 0, 'no instances should be booted automatically when manually calling `app.boot()');
      });
    }

    [`@test calling visit() on an app without first calling boot() should boot the app`](assert) {
      let appBooted = 0;
      let instanceBooted = 0;

      this.application.initializer({
        name: 'assert-no-autoboot',
        initialize() {
          appBooted++;
        }
      });

      this.application.instanceInitializer({
        name: 'assert-no-autoboot',
        initialize() {
          instanceBooted++;
        }
      });

      return this.visit('/').then(() => {
        assert.ok(appBooted === 1, 'the app should be booted`');
        assert.ok(instanceBooted === 1, 'an instances should be booted');
      });
    }

    [`@test calling visit() on an already booted app should not boot it again`](assert) {
      let appBooted = 0;
      let instanceBooted = 0;

      this.application.initializer({
        name: 'assert-no-autoboot',
        initialize() {
          appBooted++;
        }
      });

      this.application.instanceInitializer({
        name: 'assert-no-autoboot',
        initialize() {
          instanceBooted++;
        }
      });

      return this.runTask(() => this.application.boot()).then(() => {
        assert.ok(appBooted === 1, 'the app should be booted');
        assert.ok(instanceBooted === 0, 'no instances should be booted');

        return this.visit('/');
      }).then(() => {
        assert.ok(appBooted === 1, 'the app should not be booted again');
        assert.ok(instanceBooted === 1, 'an instance should be booted');

        /*
        * Destroy the instance.
        */
        return this.runTask(() => {
          this.applicationInstance.destroy();
          this.applicationInstance = null;
        });
      }).then(() => {
        /*
        * Visit on the application a second time. The application should remain
        * booted, but a new instance will be created.
        */
        return this.application.visit('/').then(instance => {
          this.applicationInstance = instance;
        });
      }).then(() => {
        assert.ok(appBooted === 1, 'the app should not be booted again');
        assert.ok(instanceBooted === 2, 'another instance should be booted');
      });
    }

    [`@test visit() rejects on application boot failure`](assert) {
      this.application.initializer({
        name: 'error',
        initialize() {
          throw new Error('boot failure');
        }
      });

      expectAsyncError();

      return this.visit('/').then(() => {
        assert.ok(false, 'It should not resolve the promise');
      }, error => {
        assert.ok(error instanceof Error, 'It should reject the promise with the boot error');
        assert.equal(error.message, 'boot failure');
      });
    }

    [`@test visit() rejects on instance boot failure`](assert) {
      this.application.instanceInitializer({
        name: 'error',
        initialize() {
          throw new Error('boot failure');
        }
      });

      expectAsyncError();

      return this.visit('/').then(() => {
        assert.ok(false, 'It should not resolve the promise');
      }, error => {
        assert.ok(error instanceof Error, 'It should reject the promise with the boot error');
        assert.equal(error.message, 'boot failure');
      });
    }

    [`@test visit() follows redirects`](assert) {
      this.router.map(function () {
        this.route('a');
        this.route('b', { path: '/b/:b' });
        this.route('c', { path: '/c/:c' });
      });

      this.add('route:a', _routing.Route.extend({
        afterModel() {
          this.replaceWith('b', 'zomg');
        }
      }));

      this.add('route:b', _routing.Route.extend({
        afterModel(params) {
          this.transitionTo('c', params.b);
        }
      }));

      /*
      * First call to `visit` is `this.application.visit` and returns the
      * applicationInstance.
      */
      return this.visit('/a').then(instance => {
        assert.ok(instance instanceof _instance.default, 'promise is resolved with an ApplicationInstance');
        assert.equal(instance.getURL(), '/c/zomg', 'It should follow all redirects');
      });
    }

    [`@test visit() rejects if an error occurred during a transition`](assert) {
      this.router.map(function () {
        this.route('a');
        this.route('b', { path: '/b/:b' });
        this.route('c', { path: '/c/:c' });
      });

      this.add('route:a', _routing.Route.extend({
        afterModel() {
          this.replaceWith('b', 'zomg');
        }
      }));

      this.add('route:b', _routing.Route.extend({
        afterModel(params) {
          this.transitionTo('c', params.b);
        }
      }));

      this.add('route:c', _routing.Route.extend({
        afterModel() {
          throw new Error('transition failure');
        }
      }));

      expectAsyncError();

      return this.visit('/a').then(() => {
        assert.ok(false, 'It should not resolve the promise');
      }, error => {
        assert.ok(error instanceof Error, 'It should reject the promise with the boot error');
        assert.equal(error.message, 'transition failure');
      });
    }

    [`@test visit() chain`](assert) {
      this.router.map(function () {
        this.route('a');
        this.route('b');
        this.route('c');
      });

      return this.visit('/').then(instance => {
        assert.ok(instance instanceof _instance.default, 'promise is resolved with an ApplicationInstance');
        assert.equal(instance.getURL(), '/');

        return instance.visit('/a');
      }).then(instance => {
        assert.ok(instance instanceof _instance.default, 'promise is resolved with an ApplicationInstance');
        assert.equal(instance.getURL(), '/a');

        return instance.visit('/b');
      }).then(instance => {
        assert.ok(instance instanceof _instance.default, 'promise is resolved with an ApplicationInstance');
        assert.equal(instance.getURL(), '/b');

        return instance.visit('/c');
      }).then(instance => {
        assert.ok(instance instanceof _instance.default, 'promise is resolved with an ApplicationInstance');
        assert.equal(instance.getURL(), '/c');
      });
    }

    [`@test visit() returns a promise that resolves when the view has rendered`](assert) {
      this.addTemplate('application', `<h1>Hello world</h1>`);

      this.assertEmptyFixture();

      return this.visit('/').then(instance => {
        assert.ok(instance instanceof _instance.default, 'promise is resolved with an ApplicationInstance');
        assert.equal(this.element.textContent, 'Hello world', 'the application was rendered once the promise resolves');
      });
    }

    [`@test visit() returns a promise that resolves without rendering when shouldRender is set to false`](assert) {
      assert.expect(3);

      this.addTemplate('application', '<h1>Hello world</h1>');

      this.assertEmptyFixture();

      return this.visit('/', { shouldRender: false }).then(instance => {
        assert.ok(instance instanceof _instance.default, 'promise is resolved with an ApplicationInstance');

        this.assertEmptyFixture('after visit');
      });
    }

    [`@test visit() renders a template when shouldRender is set to true`](assert) {
      assert.expect(3);

      this.addTemplate('application', '<h1>Hello world</h1>');

      this.assertEmptyFixture();

      return this.visit('/', { shouldRender: true }).then(instance => {
        assert.ok(instance instanceof _instance.default, 'promise is resolved with an ApplicationInstance');
        assert.strictEqual(document.querySelector('#qunit-fixture').children.length, 1, 'there is 1 element in the fixture element after visit');
      });
    }

    [`@test visit() returns a promise that resolves without rendering when shouldRender is set to false with Engines`](assert) {
      assert.expect(3);

      this.router.map(function () {
        this.mount('blog');
      });

      this.addTemplate('application', '<h1>Hello world</h1>');

      // Register engine
      let BlogEngine = _engine.default.extend();
      this.add('engine:blog', BlogEngine);

      // Register engine route map
      let BlogMap = function () {};
      this.add('route-map:blog', BlogMap);

      this.assertEmptyFixture();

      return this.visit('/blog', { shouldRender: false }).then(instance => {
        assert.ok(instance instanceof _instance.default, 'promise is resolved with an ApplicationInstance');

        this.assertEmptyFixture('after visit');
      });
    }

    [`@test visit() does not setup the event_dispatcher:main if isInteractive is false (with Engines) GH#15615`](assert) {
      assert.expect(3);

      this.router.map(function () {
        this.mount('blog');
      });

      this.addTemplate('application', '<h1>Hello world</h1>{{outlet}}');
      this.add('event_dispatcher:main', {
        create() {
          throw new Error('should not happen!');
        }
      });

      // Register engine
      let BlogEngine = _engine.default.extend({
        init(...args) {
          this._super.apply(this, args);
          this.register('template:application', (0, _emberTemplateCompiler.compile)('{{cache-money}}'));
          this.register('template:components/cache-money', (0, _emberTemplateCompiler.compile)(`
          <p>Dis cache money</p>
        `));
          this.register('component:cache-money', _glimmer.Component.extend({}));
        }
      });
      this.add('engine:blog', BlogEngine);

      // Register engine route map
      let BlogMap = function () {};
      this.add('route-map:blog', BlogMap);

      this.assertEmptyFixture();

      return this.visit('/blog', { isInteractive: false }).then(instance => {
        assert.ok(instance instanceof _instance.default, 'promise is resolved with an ApplicationInstance');
        assert.strictEqual(this.element.querySelector('p').textContent, 'Dis cache money', 'Engine component is resolved');
      });
    }

    [`@test visit() on engine resolves engine component`](assert) {
      assert.expect(2);

      this.router.map(function () {
        this.mount('blog');
      });

      // Register engine
      let BlogEngine = _engine.default.extend({
        init(...args) {
          this._super.apply(this, args);
          this.register('template:application', (0, _emberTemplateCompiler.compile)('{{cache-money}}'));
          this.register('template:components/cache-money', (0, _emberTemplateCompiler.compile)(`
          <p>Dis cache money</p>
        `));
          this.register('component:cache-money', _glimmer.Component.extend({}));
        }
      });
      this.add('engine:blog', BlogEngine);

      // Register engine route map
      let BlogMap = function () {};
      this.add('route-map:blog', BlogMap);

      this.assertEmptyFixture();

      return this.visit('/blog', { shouldRender: true }).then(() => {
        assert.strictEqual(this.element.querySelector('p').textContent, 'Dis cache money', 'Engine component is resolved');
      });
    }

    [`@test visit() on engine resolves engine helper`](assert) {
      assert.expect(2);

      this.router.map(function () {
        this.mount('blog');
      });

      // Register engine
      let BlogEngine = _engine.default.extend({
        init(...args) {
          this._super.apply(this, args);
          this.register('template:application', (0, _emberTemplateCompiler.compile)('{{swag}}'));
          this.register('helper:swag', (0, _glimmer.helper)(function () {
            return 'turnt up';
          }));
        }
      });
      this.add('engine:blog', BlogEngine);

      // Register engine route map
      let BlogMap = function () {};
      this.add('route-map:blog', BlogMap);

      this.assertEmptyFixture();

      return this.visit('/blog', { shouldRender: true }).then(() => {
        assert.strictEqual(this.element.textContent, 'turnt up', 'Engine component is resolved');
      });
    }

    [`@test Ember Islands-style setup`](assert) {
      let xFooInitCalled = false;
      let xFooDidInsertElementCalled = false;

      let xBarInitCalled = false;
      let xBarDidInsertElementCalled = false;

      this.router.map(function () {
        this.route('show', { path: '/:component_name' });
      });

      this.add('route:show', _routing.Route.extend({
        queryParams: {
          data: { refreshModel: true }
        },

        model(params) {
          return {
            componentName: params.component_name,
            componentData: params.data ? JSON.parse(params.data) : undefined
          };
        }
      }));

      let Counter = _runtime.Object.extend({
        value: 0,

        increment() {
          this.incrementProperty('value');
        }
      });

      this.add('service:isolatedCounter', Counter);
      this.add('service:sharedCounter', Counter.create());
      this.application.registerOptions('service:sharedCounter', {
        instantiate: false
      });

      this.addTemplate('show', '{{component model.componentName model=model.componentData}}');

      this.addTemplate('components/x-foo', `
      <h1>X-Foo</h1>
      <p>Hello {{model.name}}, I have been clicked {{isolatedCounter.value}} times ({{sharedCounter.value}} times combined)!</p>
    `);

      this.add('component:x-foo', _glimmer.Component.extend({
        tagName: 'x-foo',

        isolatedCounter: (0, _service.inject)(),
        sharedCounter: (0, _service.inject)(),

        init() {
          this._super();
          xFooInitCalled = true;
        },

        didInsertElement() {
          xFooDidInsertElementCalled = true;
        },

        click() {
          this.get('isolatedCounter').increment();
          this.get('sharedCounter').increment();
        }
      }));

      this.addTemplate('components/x-bar', `
      <h1>X-Bar</h1>
      <button {{action "incrementCounter"}}>Join {{counter.value}} others in clicking me!</button>
    `);

      this.add('component:x-bar', _glimmer.Component.extend({
        counter: (0, _service.inject)('sharedCounter'),

        actions: {
          incrementCounter() {
            this.get('counter').increment();
          }
        },

        init() {
          this._super();
          xBarInitCalled = true;
        },

        didInsertElement() {
          xBarDidInsertElementCalled = true;
        }
      }));

      let fixtureElement = document.querySelector('#qunit-fixture');
      let foo = document.createElement('div');
      let bar = document.createElement('div');
      fixtureElement.appendChild(foo);
      fixtureElement.appendChild(bar);

      let data = encodeURIComponent(JSON.stringify({ name: 'Godfrey' }));
      let instances = [];

      return _runtime.RSVP.all([this.runTask(() => {
        return this.application.visit(`/x-foo?data=${data}`, {
          rootElement: foo
        });
      }), this.runTask(() => {
        return this.application.visit('/x-bar', { rootElement: bar });
      })]).then(_instances => {
        instances = _instances;

        assert.ok(xFooInitCalled);
        assert.ok(xFooDidInsertElementCalled);

        assert.ok(xBarInitCalled);
        assert.ok(xBarDidInsertElementCalled);

        assert.equal(foo.querySelector('h1').textContent, 'X-Foo');
        assert.equal(foo.querySelector('p').textContent, 'Hello Godfrey, I have been clicked 0 times (0 times combined)!');
        assert.ok(foo.textContent.indexOf('X-Bar') === -1);

        assert.equal(bar.querySelector('h1').textContent, 'X-Bar');
        assert.equal(bar.querySelector('button').textContent, 'Join 0 others in clicking me!');
        assert.ok(bar.textContent.indexOf('X-Foo') === -1);

        this.runTask(() => {
          this.click(foo.querySelector('x-foo'));
        });

        assert.equal(foo.querySelector('p').textContent, 'Hello Godfrey, I have been clicked 1 times (1 times combined)!');
        assert.equal(bar.querySelector('button').textContent, 'Join 1 others in clicking me!');

        this.runTask(() => {
          this.click(bar.querySelector('button'));
          this.click(bar.querySelector('button'));
        });

        assert.equal(foo.querySelector('p').textContent, 'Hello Godfrey, I have been clicked 1 times (3 times combined)!');
        assert.equal(bar.querySelector('button').textContent, 'Join 3 others in clicking me!');
      }).finally(() => {
        this.runTask(() => {
          instances.forEach(instance => {
            instance.destroy();
          });
        });
      });
    }
  });
});
enifed('@ember/controller/tests/controller_test', ['@ember/controller', '@ember/service', '@ember/-internals/runtime', '@ember/-internals/metal', 'internal-test-helpers'], function (_controller, _service, _runtime, _metal, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Controller event handling', class extends _internalTestHelpers.AbstractTestCase {
    ['@test Action can be handled by a function on actions object'](assert) {
      assert.expect(1);
      let TestController = _controller.default.extend({
        actions: {
          poke() {
            assert.ok(true, 'poked');
          }
        }
      });
      let controller = TestController.create();
      controller.send('poke');
    }

    ['@test A handled action can be bubbled to the target for continued processing'](assert) {
      assert.expect(2);
      let TestController = _controller.default.extend({
        actions: {
          poke() {
            assert.ok(true, 'poked 1');
            return true;
          }
        }
      });

      let controller = TestController.create({
        target: _controller.default.extend({
          actions: {
            poke() {
              assert.ok(true, 'poked 2');
            }
          }
        }).create()
      });
      controller.send('poke');
    }

    ["@test Action can be handled by a superclass' actions object"](assert) {
      assert.expect(4);

      let SuperController = _controller.default.extend({
        actions: {
          foo() {
            assert.ok(true, 'foo');
          },
          bar(msg) {
            assert.equal(msg, 'HELLO');
          }
        }
      });

      let BarControllerMixin = _metal.Mixin.create({
        actions: {
          bar(msg) {
            assert.equal(msg, 'HELLO');
            this._super(msg);
          }
        }
      });

      let IndexController = SuperController.extend(BarControllerMixin, {
        actions: {
          baz() {
            assert.ok(true, 'baz');
          }
        }
      });

      let controller = IndexController.create({});
      controller.send('foo');
      controller.send('bar', 'HELLO');
      controller.send('baz');
    }

    ['@test .send asserts if called on a destroyed controller']() {
      let owner = (0, _internalTestHelpers.buildOwner)();

      owner.register('controller:application', _controller.default.extend({
        toString() {
          return 'controller:rip-alley';
        }
      }));

      let controller = owner.lookup('controller:application');
      (0, _internalTestHelpers.runDestroy)(owner);

      expectAssertion(() => {
        controller.send('trigger-me-dead');
      }, "Attempted to call .send() with the action 'trigger-me-dead' on the destroyed object 'controller:rip-alley'.");
    }
  });

  (0, _internalTestHelpers.moduleFor)('Controller deprecations -> Controller Content -> Model Alias', class extends _internalTestHelpers.AbstractTestCase {
    ['@test `content` is not moved to `model` when `model` is unset'](assert) {
      assert.expect(2);
      let controller;

      ignoreDeprecation(function () {
        controller = _controller.default.extend({
          content: 'foo-bar'
        }).create();
      });

      assert.notEqual(controller.get('model'), 'foo-bar', 'model is set properly');
      assert.equal(controller.get('content'), 'foo-bar', 'content is not set properly');
    }

    ['@test specifying `content` (without `model` specified) does not result in deprecation'](assert) {
      assert.expect(2);
      expectNoDeprecation();

      let controller = _controller.default.extend({
        content: 'foo-bar'
      }).create();

      assert.equal((0, _metal.get)(controller, 'content'), 'foo-bar');
    }

    ['@test specifying `content` (with `model` specified) does not result in deprecation'](assert) {
      assert.expect(3);
      expectNoDeprecation();

      let controller = _controller.default.extend({
        content: 'foo-bar',
        model: 'blammo'
      }).create();

      assert.equal((0, _metal.get)(controller, 'content'), 'foo-bar');
      assert.equal((0, _metal.get)(controller, 'model'), 'blammo');
    }
  });

  (0, _internalTestHelpers.moduleFor)('Controller deprecations -> Controller injected properties', class extends _internalTestHelpers.AbstractTestCase {
    ['@test defining a controller on a non-controller should fail assertion']() {
      expectAssertion(function () {
        let owner = (0, _internalTestHelpers.buildOwner)();

        let AnObject = _runtime.Object.extend({
          foo: (0, _controller.inject)('bar')
        });

        owner.register('controller:bar', _runtime.Object.extend());
        owner.register('foo:main', AnObject);

        owner.lookup('foo:main');
      }, /Defining `foo` as an injected controller property on a non-controller \(`foo:main`\) is not allowed/);
    }

    ['@test controllers can be injected into controllers'](assert) {
      let owner = (0, _internalTestHelpers.buildOwner)();

      owner.register('controller:post', _controller.default.extend({
        postsController: (0, _controller.inject)('posts')
      }));

      owner.register('controller:posts', _controller.default.extend());

      let postController = owner.lookup('controller:post');
      let postsController = owner.lookup('controller:posts');

      assert.equal(postsController, postController.get('postsController'), 'controller.posts is injected');
    }

    ['@test services can be injected into controllers'](assert) {
      let owner = (0, _internalTestHelpers.buildOwner)();

      owner.register('controller:application', _controller.default.extend({
        authService: (0, _service.inject)('auth')
      }));

      owner.register('service:auth', _service.default.extend());

      let appController = owner.lookup('controller:application');
      let authService = owner.lookup('service:auth');

      assert.equal(authService, appController.get('authService'), 'service.auth is injected');
    }
  });
});
enifed('@ember/debug/tests/handlers-test', ['@ember/debug/lib/handlers', 'internal-test-helpers'], function (_handlers, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('ember-debug: registerHandler', class extends _internalTestHelpers.AbstractTestCase {
    teardown() {
      delete _handlers.HANDLERS.blarz;
    }

    ['@test calls handler on `invoke` when `falsey`'](assert) {
      assert.expect(2);

      function handler(message) {
        assert.ok(true, 'called handler');
        assert.equal(message, 'Foo bar');
      }

      (0, _handlers.registerHandler)('blarz', handler);

      (0, _handlers.invoke)('blarz', 'Foo bar', false);
    }

    ['@test does not call handler on `invoke` when `truthy`'](assert) {
      assert.expect(0);

      function handler() {
        assert.ok(false, 'called handler');
      }

      (0, _handlers.registerHandler)('blarz', handler);

      (0, _handlers.invoke)('blarz', 'Foo bar', true);
    }

    ['@test calling `invoke` without handlers does not throw an error'](assert) {
      assert.expect(0);

      (0, _handlers.invoke)('blarz', 'Foo bar', false);
    }

    ['@test invoking `next` argument calls the next handler'](assert) {
      assert.expect(2);

      function handler1() {
        assert.ok(true, 'called handler1');
      }

      function handler2(message, options, next) {
        assert.ok(true, 'called handler2');
        next(message, options);
      }

      (0, _handlers.registerHandler)('blarz', handler1);
      (0, _handlers.registerHandler)('blarz', handler2);

      (0, _handlers.invoke)('blarz', 'Foo', false);
    }

    ['@test invoking `next` when no other handlers exists does not error'](assert) {
      assert.expect(1);

      function handler(message, options, next) {
        assert.ok(true, 'called handler1');

        next(message, options);
      }

      (0, _handlers.registerHandler)('blarz', handler);

      (0, _handlers.invoke)('blarz', 'Foo', false);
    }

    ['@test handlers are called in the proper order'](assert) {
      assert.expect(11);

      let expectedMessage = 'This is the message';
      let expectedOptions = { id: 'foo-bar' };
      let expected = ['first', 'second', 'third', 'fourth', 'fifth'];
      let actualCalls = [];

      function generateHandler(item) {
        return function (message, options, next) {
          assert.equal(message, expectedMessage, `message supplied to ${item} handler is correct`);
          assert.equal(options, expectedOptions, `options supplied to ${item} handler is correct`);

          actualCalls.push(item);

          next(message, options);
        };
      }

      expected.forEach(item => (0, _handlers.registerHandler)('blarz', generateHandler(item)));

      (0, _handlers.invoke)('blarz', expectedMessage, false, expectedOptions);

      assert.deepEqual(actualCalls, expected.reverse(), 'handlers were called in proper order');
    }

    ['@test not invoking `next` prevents further handlers from being called'](assert) {
      assert.expect(1);

      function handler1() {
        assert.ok(false, 'called handler1');
      }

      function handler2() {
        assert.ok(true, 'called handler2');
      }

      (0, _handlers.registerHandler)('blarz', handler1);
      (0, _handlers.registerHandler)('blarz', handler2);

      (0, _handlers.invoke)('blarz', 'Foo', false);
    }

    ['@test handlers can call `next` with custom message and/or options'](assert) {
      assert.expect(4);

      let initialMessage = 'initial message';
      let initialOptions = { id: 'initial-options' };

      let handler2Message = 'Handler2 Message';
      let handler2Options = { id: 'handler-2' };

      function handler1(message, options) {
        assert.equal(message, handler2Message, 'handler2 message provided to handler1');
        assert.equal(options, handler2Options, 'handler2 options provided to handler1');
      }

      function handler2(message, options, next) {
        assert.equal(message, initialMessage, 'initial message provided to handler2');
        assert.equal(options, initialOptions, 'initial options proivided to handler2');

        next(handler2Message, handler2Options);
      }

      (0, _handlers.registerHandler)('blarz', handler1);
      (0, _handlers.registerHandler)('blarz', handler2);

      (0, _handlers.invoke)('blarz', initialMessage, false, initialOptions);
    }
  });
});
enifed('@ember/debug/tests/main_test', ['@ember/-internals/environment', '@ember/-internals/runtime', '@ember/debug/lib/handlers', '@ember/debug/lib/deprecate', '@ember/debug/lib/warn', '@ember/debug/index', 'internal-test-helpers'], function (_environment, _runtime, _handlers, _deprecate, _warn, _index, _internalTestHelpers) {
  'use strict';

  let originalEnvValue;
  let originalDeprecateHandler;
  let originalWarnHandler;

  const originalConsoleWarn = console.warn; // eslint-disable-line no-console
  const noop = function () {};

  (0, _internalTestHelpers.moduleFor)('ember-debug', class extends _internalTestHelpers.AbstractTestCase {
    constructor() {
      super();

      originalEnvValue = _environment.ENV.RAISE_ON_DEPRECATION;
      originalDeprecateHandler = _handlers.HANDLERS.deprecate;
      originalWarnHandler = _handlers.HANDLERS.warn;

      _environment.ENV.RAISE_ON_DEPRECATION = true;
    }

    teardown() {
      _handlers.HANDLERS.deprecate = originalDeprecateHandler;
      _handlers.HANDLERS.warn = originalWarnHandler;

      _environment.ENV.RAISE_ON_DEPRECATION = originalEnvValue;
    }

    afterEach() {
      console.warn = originalConsoleWarn; // eslint-disable-line no-console
    }

    ['@test deprecate does not throw if RAISE_ON_DEPRECATION is false'](assert) {
      assert.expect(1);
      console.warn = noop; // eslint-disable-line no-console

      _environment.ENV.RAISE_ON_DEPRECATION = false;

      try {
        (0, _index.deprecate)('Should not throw', false, { id: 'test', until: 'forever' });
        assert.ok(true, 'deprecate did not throw');
      } catch (e) {
        assert.ok(false, `Expected deprecate not to throw but it did: ${e.message}`);
      }
    }

    ['@test deprecate resets deprecation level to RAISE if ENV.RAISE_ON_DEPRECATION is set'](assert) {
      assert.expect(2);
      console.warn = noop; // eslint-disable-line no-console

      _environment.ENV.RAISE_ON_DEPRECATION = false;

      try {
        (0, _index.deprecate)('Should not throw', false, { id: 'test', until: 'forever' });
        assert.ok(true, 'deprecate did not throw');
      } catch (e) {
        assert.ok(false, `Expected deprecate not to throw but it did: ${e.message}`);
      }

      _environment.ENV.RAISE_ON_DEPRECATION = true;

      assert.throws(() => {
        (0, _index.deprecate)('Should throw', false, { id: 'test', until: 'forever' });
      }, /Should throw/);
    }

    ['@test When ENV.RAISE_ON_DEPRECATION is true, it is still possible to silence a deprecation by id'](assert) {
      assert.expect(3);

      _environment.ENV.RAISE_ON_DEPRECATION = true;
      (0, _deprecate.registerHandler)(function (message, options, next) {
        if (!options || options.id !== 'my-deprecation') {
          next(...arguments);
        }
      });

      try {
        (0, _index.deprecate)('should be silenced with matching id', false, {
          id: 'my-deprecation',
          until: 'forever'
        });
        assert.ok(true, 'Did not throw when level is set by id');
      } catch (e) {
        assert.ok(false, `Expected deprecate not to throw but it did: ${e.message}`);
      }

      assert.throws(() => {
        (0, _index.deprecate)('Should throw with no matching id', false, {
          id: 'test',
          until: 'forever'
        });
      }, /Should throw with no matching id/);

      assert.throws(() => {
        (0, _index.deprecate)('Should throw with non-matching id', false, {
          id: 'other-id',
          until: 'forever'
        });
      }, /Should throw with non-matching id/);
    }

    ['@test deprecate throws deprecation if second argument is falsy'](assert) {
      assert.expect(3);

      assert.throws(() => (0, _index.deprecate)('Deprecation is thrown', false, {
        id: 'test',
        until: 'forever'
      }));
      assert.throws(() => (0, _index.deprecate)('Deprecation is thrown', '', { id: 'test', until: 'forever' }));
      assert.throws(() => (0, _index.deprecate)('Deprecation is thrown', 0, { id: 'test', until: 'forever' }));
    }

    ['@test deprecate does not invoke a function as the second argument'](assert) {
      assert.expect(1);

      (0, _index.deprecate)('Deprecation is thrown', function () {
        assert.ok(false, 'this function should not be invoked');
      }, { id: 'test', until: 'forever' });

      assert.ok(true, 'deprecations were not thrown');
    }

    ['@test deprecate does not throw deprecations if second argument is truthy'](assert) {
      assert.expect(1);

      (0, _index.deprecate)('Deprecation is thrown', true, {
        id: 'test',
        until: 'forever'
      });
      (0, _index.deprecate)('Deprecation is thrown', '1', { id: 'test', until: 'forever' });
      (0, _index.deprecate)('Deprecation is thrown', 1, { id: 'test', until: 'forever' });

      assert.ok(true, 'deprecations were not thrown');
    }

    ['@test assert throws if second argument is falsy'](assert) {
      assert.expect(3);

      assert.throws(() => (0, _index.assert)('Assertion is thrown', false));
      assert.throws(() => (0, _index.assert)('Assertion is thrown', ''));
      assert.throws(() => (0, _index.assert)('Assertion is thrown', 0));
    }

    ['@test assert does not throw if second argument is a function'](assert) {
      assert.expect(1);

      (0, _index.assert)('Assertion is thrown', () => true);

      assert.ok(true, 'assertions were not thrown');
    }

    ['@test assert does not throw if second argument is falsy'](assert) {
      assert.expect(1);

      (0, _index.assert)('Assertion is thrown', true);
      (0, _index.assert)('Assertion is thrown', '1');
      (0, _index.assert)('Assertion is thrown', 1);

      assert.ok(true, 'assertions were not thrown');
    }

    ['@test assert does not throw if second argument is an object'](assert) {
      assert.expect(1);
      let Igor = _runtime.Object.extend();

      (0, _index.assert)('is truthy', Igor);
      (0, _index.assert)('is truthy', Igor.create());

      assert.ok(true, 'assertions were not thrown');
    }

    ['@test deprecate does not throw a deprecation at log and silence'](assert) {
      assert.expect(4);
      let id = 'ABC';
      let until = 'forever';
      let shouldThrow = false;

      (0, _deprecate.registerHandler)(function (message, options) {
        if (options && options.id === id) {
          if (shouldThrow) {
            throw new Error(message);
          }
        }
      });

      try {
        (0, _index.deprecate)('Deprecation for testing purposes', false, { id, until });
        assert.ok(true, 'Deprecation did not throw');
      } catch (e) {
        assert.ok(false, 'Deprecation was thrown despite being added to blacklist');
      }

      try {
        (0, _index.deprecate)('Deprecation for testing purposes', false, { id, until });
        assert.ok(true, 'Deprecation did not throw');
      } catch (e) {
        assert.ok(false, 'Deprecation was thrown despite being added to blacklist');
      }

      shouldThrow = true;

      assert.throws(function () {
        (0, _index.deprecate)('Deprecation is thrown', false, { id, until });
      });

      assert.throws(function () {
        (0, _index.deprecate)('Deprecation is thrown', false, { id, until });
      });
    }

    ['@test deprecate without options triggers an assertion'](assert) {
      assert.expect(2);

      assert.throws(() => (0, _index.deprecate)('foo'), new RegExp(_deprecate.missingOptionsDeprecation), 'proper assertion is triggered when options is missing');

      assert.throws(() => (0, _index.deprecate)('foo', false, {}), new RegExp(_deprecate.missingOptionsDeprecation), 'proper assertion is triggered when options is missing');
    }

    ['@test deprecate without options.id triggers an assertion'](assert) {
      assert.expect(1);

      assert.throws(() => (0, _index.deprecate)('foo', false, { until: 'forever' }), new RegExp(_deprecate.missingOptionsIdDeprecation), 'proper assertion is triggered when options.id is missing');
    }

    ['@test deprecate without options.until triggers an assertion'](assert) {
      assert.expect(1);

      assert.throws(() => (0, _index.deprecate)('foo', false, { id: 'test' }), new RegExp(_deprecate.missingOptionsUntilDeprecation), 'proper assertion is triggered when options.until is missing');
    }

    ['@test warn without options triggers an assert'](assert) {
      assert.expect(1);

      assert.throws(() => (0, _index.warn)('foo'), new RegExp(_warn.missingOptionsDeprecation), 'deprecation is triggered when options is missing');
    }

    ['@test warn without options.id triggers an assertion'](assert) {
      assert.expect(1);

      assert.throws(() => (0, _index.warn)('foo', false, {}), new RegExp(_warn.missingOptionsIdDeprecation), 'deprecation is triggered when options is missing');
    }

    ['@test warn without options.id nor test triggers an assertion'](assert) {
      assert.expect(1);

      assert.throws(() => (0, _index.warn)('foo', {}), new RegExp(_warn.missingOptionsIdDeprecation), 'deprecation is triggered when options is missing');
    }

    ['@test warn without test but with options does not trigger an assertion'](assert) {
      assert.expect(1);

      (0, _warn.registerHandler)(function (message) {
        assert.equal(message, 'foo', 'warning was triggered');
      });

      (0, _index.warn)('foo', { id: 'ember-debug.do-not-raise' });
    }
  });
});
enifed('@ember/engine/tests/engine_initializers_test', ['@ember/runloop', '@ember/engine', 'internal-test-helpers'], function (_runloop, _engine, _internalTestHelpers) {
  'use strict';

  let MyEngine, myEngine, myEngineInstance;

  (0, _internalTestHelpers.moduleFor)('Engine initializers', class extends _internalTestHelpers.AbstractTestCase {
    teardown() {
      (0, _runloop.run)(() => {
        if (myEngineInstance) {
          myEngineInstance.destroy();
          myEngineInstance = null;
        }

        if (myEngine) {
          myEngine.destroy();
          myEngine = null;
        }
      });
    }

    ["@test initializers require proper 'name' and 'initialize' properties"]() {
      MyEngine = _engine.default.extend();

      expectAssertion(() => {
        (0, _runloop.run)(() => {
          MyEngine.initializer({ name: 'initializer' });
        });
      });

      expectAssertion(() => {
        (0, _runloop.run)(() => {
          MyEngine.initializer({ initialize() {} });
        });
      });
    }

    ['@test initializers are passed an Engine'](assert) {
      MyEngine = _engine.default.extend();

      MyEngine.initializer({
        name: 'initializer',
        initialize(engine) {
          assert.ok(engine instanceof _engine.default, 'initialize is passed an Engine');
        }
      });

      myEngine = MyEngine.create();
      myEngineInstance = myEngine.buildInstance();
    }

    ['@test initializers can be registered in a specified order'](assert) {
      let order = [];

      MyEngine = _engine.default.extend();
      MyEngine.initializer({
        name: 'fourth',
        after: 'third',
        initialize() {
          order.push('fourth');
        }
      });

      MyEngine.initializer({
        name: 'second',
        after: 'first',
        before: 'third',
        initialize() {
          order.push('second');
        }
      });

      MyEngine.initializer({
        name: 'fifth',
        after: 'fourth',
        before: 'sixth',
        initialize() {
          order.push('fifth');
        }
      });

      MyEngine.initializer({
        name: 'first',
        before: 'second',
        initialize() {
          order.push('first');
        }
      });

      MyEngine.initializer({
        name: 'third',
        initialize() {
          order.push('third');
        }
      });

      MyEngine.initializer({
        name: 'sixth',
        initialize() {
          order.push('sixth');
        }
      });

      myEngine = MyEngine.create();
      myEngineInstance = myEngine.buildInstance();

      assert.deepEqual(order, ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']);
    }

    ['@test initializers can be registered in a specified order as an array'](assert) {
      let order = [];

      MyEngine = _engine.default.extend();

      MyEngine.initializer({
        name: 'third',
        initialize() {
          order.push('third');
        }
      });

      MyEngine.initializer({
        name: 'second',
        after: 'first',
        before: ['third', 'fourth'],
        initialize() {
          order.push('second');
        }
      });

      MyEngine.initializer({
        name: 'fourth',
        after: ['second', 'third'],
        initialize() {
          order.push('fourth');
        }
      });

      MyEngine.initializer({
        name: 'fifth',
        after: 'fourth',
        before: 'sixth',
        initialize() {
          order.push('fifth');
        }
      });

      MyEngine.initializer({
        name: 'first',
        before: ['second'],
        initialize() {
          order.push('first');
        }
      });

      MyEngine.initializer({
        name: 'sixth',
        initialize() {
          order.push('sixth');
        }
      });

      myEngine = MyEngine.create();
      myEngineInstance = myEngine.buildInstance();

      assert.deepEqual(order, ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']);
    }

    ['@test initializers can have multiple dependencies'](assert) {
      let order = [];

      MyEngine = _engine.default.extend();

      let a = {
        name: 'a',
        before: 'b',
        initialize() {
          order.push('a');
        }
      };
      let b = {
        name: 'b',
        initialize() {
          order.push('b');
        }
      };
      let c = {
        name: 'c',
        after: 'b',
        initialize() {
          order.push('c');
        }
      };
      let afterB = {
        name: 'after b',
        after: 'b',
        initialize() {
          order.push('after b');
        }
      };
      let afterC = {
        name: 'after c',
        after: 'c',
        initialize() {
          order.push('after c');
        }
      };

      MyEngine.initializer(b);
      MyEngine.initializer(a);
      MyEngine.initializer(afterC);
      MyEngine.initializer(afterB);
      MyEngine.initializer(c);

      myEngine = MyEngine.create();
      myEngineInstance = myEngine.buildInstance();

      assert.ok(order.indexOf(a.name) < order.indexOf(b.name), 'a < b');
      assert.ok(order.indexOf(b.name) < order.indexOf(c.name), 'b < c');
      assert.ok(order.indexOf(b.name) < order.indexOf(afterB.name), 'b < afterB');
      assert.ok(order.indexOf(c.name) < order.indexOf(afterC.name), 'c < afterC');
    }

    ['@test initializers set on Engine subclasses are not shared between engines'](assert) {
      let firstInitializerRunCount = 0;
      let secondInitializerRunCount = 0;
      let FirstEngine = _engine.default.extend();

      FirstEngine.initializer({
        name: 'first',
        initialize() {
          firstInitializerRunCount++;
        }
      });

      let SecondEngine = _engine.default.extend();

      SecondEngine.initializer({
        name: 'second',
        initialize() {
          secondInitializerRunCount++;
        }
      });

      let firstEngine = FirstEngine.create();
      let firstEngineInstance = firstEngine.buildInstance();

      assert.equal(firstInitializerRunCount, 1, 'first initializer only was run');
      assert.equal(secondInitializerRunCount, 0, 'first initializer only was run');

      let secondEngine = SecondEngine.create();
      let secondEngineInstance = secondEngine.buildInstance();

      assert.equal(firstInitializerRunCount, 1, 'second initializer only was run');
      assert.equal(secondInitializerRunCount, 1, 'second initializer only was run');

      (0, _runloop.run)(function () {
        firstEngineInstance.destroy();
        secondEngineInstance.destroy();

        firstEngine.destroy();
        secondEngine.destroy();
      });
    }

    ['@test initializers are concatenated'](assert) {
      let firstInitializerRunCount = 0;
      let secondInitializerRunCount = 0;
      let FirstEngine = _engine.default.extend();

      FirstEngine.initializer({
        name: 'first',
        initialize() {
          firstInitializerRunCount++;
        }
      });

      let SecondEngine = FirstEngine.extend();

      SecondEngine.initializer({
        name: 'second',
        initialize() {
          secondInitializerRunCount++;
        }
      });

      let firstEngine = FirstEngine.create();
      let firstEngineInstance = firstEngine.buildInstance();

      assert.equal(firstInitializerRunCount, 1, 'first initializer only was run when base class created');
      assert.equal(secondInitializerRunCount, 0, 'second initializer was not run when first base class created');
      firstInitializerRunCount = 0;

      let secondEngine = SecondEngine.create();
      let secondEngineInstance = secondEngine.buildInstance();

      assert.equal(firstInitializerRunCount, 1, 'first initializer was run when subclass created');
      assert.equal(secondInitializerRunCount, 1, 'second initializers was run when subclass created');

      (0, _runloop.run)(function () {
        firstEngineInstance.destroy();
        secondEngineInstance.destroy();

        firstEngine.destroy();
        secondEngine.destroy();
      });
    }

    ['@test initializers are per-engine'](assert) {
      assert.expect(2);

      let FirstEngine = _engine.default.extend();

      FirstEngine.initializer({
        name: 'abc',
        initialize() {}
      });

      expectAssertion(function () {
        FirstEngine.initializer({
          name: 'abc',
          initialize() {}
        });
      });

      let SecondEngine = _engine.default.extend();
      SecondEngine.instanceInitializer({
        name: 'abc',
        initialize() {}
      });

      assert.ok(true, 'Two engines can have initializers named the same.');
    }

    ['@test initializers are executed in their own context'](assert) {
      assert.expect(1);

      MyEngine = _engine.default.extend();

      MyEngine.initializer({
        name: 'coolInitializer',
        myProperty: 'cool',
        initialize() {
          assert.equal(this.myProperty, 'cool', 'should have access to its own context');
        }
      });

      myEngine = MyEngine.create();
      myEngineInstance = myEngine.buildInstance();
    }
  });
});
enifed('@ember/engine/tests/engine_instance_initializers_test', ['@ember/runloop', '@ember/engine', '@ember/engine/instance', 'internal-test-helpers'], function (_runloop, _engine, _instance, _internalTestHelpers) {
  'use strict';

  let MyEngine, myEngine, myEngineInstance;

  function buildEngineInstance(EngineClass) {
    let engineInstance = EngineClass.buildInstance();
    (0, _engine.setEngineParent)(engineInstance, {
      lookup() {
        return {};
      },
      resolveRegistration() {
        return {};
      }
    });
    return engineInstance;
  }

  (0, _internalTestHelpers.moduleFor)('Engine instance initializers', class extends _internalTestHelpers.AbstractTestCase {
    teardown() {
      super.teardown();
      (0, _runloop.run)(() => {
        if (myEngineInstance) {
          myEngineInstance.destroy();
        }

        if (myEngine) {
          myEngine.destroy();
        }
      });
      MyEngine = myEngine = myEngineInstance = undefined;
    }

    ["@test initializers require proper 'name' and 'initialize' properties"]() {
      MyEngine = _engine.default.extend();

      expectAssertion(() => {
        (0, _runloop.run)(() => {
          MyEngine.instanceInitializer({ name: 'initializer' });
        });
      });

      expectAssertion(() => {
        (0, _runloop.run)(() => {
          MyEngine.instanceInitializer({ initialize() {} });
        });
      });
    }

    ['@test initializers are passed an engine instance'](assert) {
      MyEngine = _engine.default.extend();

      MyEngine.instanceInitializer({
        name: 'initializer',
        initialize(instance) {
          assert.ok(instance instanceof _instance.default, 'initialize is passed an engine instance');
        }
      });

      myEngine = MyEngine.create();
      myEngineInstance = buildEngineInstance(myEngine);
      return myEngineInstance.boot();
    }

    ['@test initializers can be registered in a specified order'](assert) {
      let order = [];

      MyEngine = _engine.default.extend();

      MyEngine.instanceInitializer({
        name: 'fourth',
        after: 'third',
        initialize() {
          order.push('fourth');
        }
      });

      MyEngine.instanceInitializer({
        name: 'second',
        after: 'first',
        before: 'third',
        initialize() {
          order.push('second');
        }
      });

      MyEngine.instanceInitializer({
        name: 'fifth',
        after: 'fourth',
        before: 'sixth',
        initialize() {
          order.push('fifth');
        }
      });

      MyEngine.instanceInitializer({
        name: 'first',
        before: 'second',
        initialize() {
          order.push('first');
        }
      });

      MyEngine.instanceInitializer({
        name: 'third',
        initialize() {
          order.push('third');
        }
      });

      MyEngine.instanceInitializer({
        name: 'sixth',
        initialize() {
          order.push('sixth');
        }
      });

      myEngine = MyEngine.create();
      myEngineInstance = buildEngineInstance(myEngine);

      return myEngineInstance.boot().then(() => {
        assert.deepEqual(order, ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']);
      });
    }

    ['@test initializers can be registered in a specified order as an array'](assert) {
      let order = [];
      MyEngine = _engine.default.extend();

      MyEngine.instanceInitializer({
        name: 'third',
        initialize() {
          order.push('third');
        }
      });

      MyEngine.instanceInitializer({
        name: 'second',
        after: 'first',
        before: ['third', 'fourth'],
        initialize() {
          order.push('second');
        }
      });

      MyEngine.instanceInitializer({
        name: 'fourth',
        after: ['second', 'third'],
        initialize() {
          order.push('fourth');
        }
      });

      MyEngine.instanceInitializer({
        name: 'fifth',
        after: 'fourth',
        before: 'sixth',
        initialize() {
          order.push('fifth');
        }
      });

      MyEngine.instanceInitializer({
        name: 'first',
        before: ['second'],
        initialize() {
          order.push('first');
        }
      });

      MyEngine.instanceInitializer({
        name: 'sixth',
        initialize() {
          order.push('sixth');
        }
      });

      myEngine = MyEngine.create();
      myEngineInstance = buildEngineInstance(myEngine);

      return myEngineInstance.boot().then(() => {
        assert.deepEqual(order, ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']);
      });
    }

    ['@test initializers can have multiple dependencies'](assert) {
      let order = [];

      MyEngine = _engine.default.extend();

      let a = {
        name: 'a',
        before: 'b',
        initialize() {
          order.push('a');
        }
      };
      let b = {
        name: 'b',
        initialize() {
          order.push('b');
        }
      };
      let c = {
        name: 'c',
        after: 'b',
        initialize() {
          order.push('c');
        }
      };
      let afterB = {
        name: 'after b',
        after: 'b',
        initialize() {
          order.push('after b');
        }
      };
      let afterC = {
        name: 'after c',
        after: 'c',
        initialize() {
          order.push('after c');
        }
      };

      MyEngine.instanceInitializer(b);
      MyEngine.instanceInitializer(a);
      MyEngine.instanceInitializer(afterC);
      MyEngine.instanceInitializer(afterB);
      MyEngine.instanceInitializer(c);

      myEngine = MyEngine.create();
      myEngineInstance = buildEngineInstance(myEngine);

      return myEngineInstance.boot().then(() => {
        assert.ok(order.indexOf(a.name) < order.indexOf(b.name), 'a < b');
        assert.ok(order.indexOf(b.name) < order.indexOf(c.name), 'b < c');
        assert.ok(order.indexOf(b.name) < order.indexOf(afterB.name), 'b < afterB');
        assert.ok(order.indexOf(c.name) < order.indexOf(afterC.name), 'c < afterC');
      });
    }

    ['@test initializers set on Engine subclasses should not be shared between engines'](assert) {
      let firstInitializerRunCount = 0;
      let secondInitializerRunCount = 0;
      let FirstEngine = _engine.default.extend();
      let firstEngine, firstEngineInstance;

      FirstEngine.instanceInitializer({
        name: 'first',
        initialize() {
          firstInitializerRunCount++;
        }
      });

      let SecondEngine = _engine.default.extend();
      let secondEngine, secondEngineInstance;

      SecondEngine.instanceInitializer({
        name: 'second',
        initialize() {
          secondInitializerRunCount++;
        }
      });

      firstEngine = FirstEngine.create();
      firstEngineInstance = buildEngineInstance(firstEngine);

      return firstEngineInstance.boot().then(() => {
        assert.equal(firstInitializerRunCount, 1, 'first initializer only was run');
        assert.equal(secondInitializerRunCount, 0, 'first initializer only was run');

        secondEngine = SecondEngine.create();
        secondEngineInstance = buildEngineInstance(secondEngine);
        return secondEngineInstance.boot();
      }).then(() => {
        assert.equal(firstInitializerRunCount, 1, 'second initializer only was run');
        assert.equal(secondInitializerRunCount, 1, 'second initializer only was run');

        (0, _runloop.run)(() => {
          firstEngineInstance.destroy();
          secondEngineInstance.destroy();

          firstEngine.destroy();
          secondEngine.destroy();
        });
      });
    }

    ['@test initializers are concatenated'](assert) {
      let firstInitializerRunCount = 0;
      let secondInitializerRunCount = 0;
      let FirstEngine = _engine.default.extend();

      FirstEngine.instanceInitializer({
        name: 'first',
        initialize() {
          firstInitializerRunCount++;
        }
      });

      let SecondEngine = FirstEngine.extend();

      SecondEngine.instanceInitializer({
        name: 'second',
        initialize() {
          secondInitializerRunCount++;
        }
      });

      let firstEngine = FirstEngine.create();
      let firstEngineInstance = buildEngineInstance(firstEngine);

      let secondEngine, secondEngineInstance;

      return firstEngineInstance.boot().then(() => {
        assert.equal(firstInitializerRunCount, 1, 'first initializer only was run when base class created');
        assert.equal(secondInitializerRunCount, 0, 'second initializer was not run when first base class created');
        firstInitializerRunCount = 0;

        secondEngine = SecondEngine.create();
        secondEngineInstance = buildEngineInstance(secondEngine);
        return secondEngineInstance.boot();
      }).then(() => {
        assert.equal(firstInitializerRunCount, 1, 'first initializer was run when subclass created');
        assert.equal(secondInitializerRunCount, 1, 'second initializers was run when subclass created');

        (0, _runloop.run)(() => {
          firstEngineInstance.destroy();
          secondEngineInstance.destroy();

          firstEngine.destroy();
          secondEngine.destroy();
        });
      });
    }

    ['@test initializers are per-engine'](assert) {
      assert.expect(2);

      let FirstEngine = _engine.default.extend();

      FirstEngine.instanceInitializer({
        name: 'abc',
        initialize() {}
      });

      expectAssertion(() => {
        FirstEngine.instanceInitializer({
          name: 'abc',
          initialize() {}
        });
      });

      let SecondEngine = _engine.default.extend();
      SecondEngine.instanceInitializer({
        name: 'abc',
        initialize() {}
      });

      assert.ok(true, 'Two engines can have initializers named the same.');
    }

    ['@test initializers are executed in their own context'](assert) {
      assert.expect(1);

      let MyEngine = _engine.default.extend();

      MyEngine.instanceInitializer({
        name: 'coolInitializer',
        myProperty: 'cool',
        initialize() {
          assert.equal(this.myProperty, 'cool', 'should have access to its own context');
        }
      });

      myEngine = MyEngine.create();
      myEngineInstance = buildEngineInstance(myEngine);

      return myEngineInstance.boot();
    }
  });
});
enifed('@ember/engine/tests/engine_instance_test', ['@ember/engine', '@ember/engine/instance', '@ember/runloop', 'internal-test-helpers'], function (_engine, _instance, _runloop, _internalTestHelpers) {
  'use strict';

  let engine, engineInstance;

  (0, _internalTestHelpers.moduleFor)('EngineInstance', class extends _internalTestHelpers.AbstractTestCase {
    constructor() {
      super();

      (0, _runloop.run)(() => {
        engine = _engine.default.create({ router: null });
      });
    }

    teardown() {
      if (engineInstance) {
        (0, _runloop.run)(engineInstance, 'destroy');
        engineInstance = undefined;
      }

      if (engine) {
        (0, _runloop.run)(engine, 'destroy');
        engine = undefined;
      }
    }

    ['@test an engine instance can be created based upon a base engine'](assert) {
      (0, _runloop.run)(() => {
        engineInstance = _instance.default.create({ base: engine });
      });

      assert.ok(engineInstance, 'instance should be created');
      assert.equal(engineInstance.base, engine, 'base should be set to engine');
    }

    ['@test unregistering a factory clears all cached instances of that factory'](assert) {
      assert.expect(3);

      engineInstance = (0, _runloop.run)(() => _instance.default.create({ base: engine }));

      let PostComponent = (0, _internalTestHelpers.factory)();

      engineInstance.register('component:post', PostComponent);

      let postComponent1 = engineInstance.lookup('component:post');
      assert.ok(postComponent1, 'lookup creates instance');

      engineInstance.unregister('component:post');
      engineInstance.register('component:post', PostComponent);

      let postComponent2 = engineInstance.lookup('component:post');
      assert.ok(postComponent2, 'lookup creates instance');

      assert.notStrictEqual(postComponent1, postComponent2, 'lookup creates a brand new instance because previous one was reset');
    }

    ['@test can be booted when its parent has been set'](assert) {
      assert.expect(3);

      engineInstance = (0, _runloop.run)(() => _instance.default.create({ base: engine }));

      expectAssertion(() => {
        engineInstance._bootSync();
      }, "An engine instance's parent must be set via `setEngineParent(engine, parent)` prior to calling `engine.boot()`.");

      (0, _engine.setEngineParent)(engineInstance, {});

      // Stub `cloneParentDependencies`, the internals of which are tested along
      // with application instances.
      engineInstance.cloneParentDependencies = function () {
        assert.ok(true, 'parent dependencies are cloned');
      };

      return engineInstance.boot().then(() => {
        assert.ok(true, 'boot successful');
      });
    }

    ['@test can build a child instance of a registered engine'](assert) {
      let ChatEngine = _engine.default.extend();
      let chatEngineInstance;

      engine.register('engine:chat', ChatEngine);

      (0, _runloop.run)(() => {
        engineInstance = _instance.default.create({ base: engine });

        // Try to build an unregistered engine.
        assert.throws(() => {
          engineInstance.buildChildEngineInstance('fake');
        }, `You attempted to mount the engine 'fake', but it is not registered with its parent.`);

        // Build the `chat` engine, registered above.
        chatEngineInstance = engineInstance.buildChildEngineInstance('chat');
      });

      assert.ok(chatEngineInstance, 'child engine instance successfully created');

      assert.strictEqual((0, _engine.getEngineParent)(chatEngineInstance), engineInstance, 'child engine instance is assigned the correct parent');
    }
  });
});
enifed('@ember/engine/tests/engine_parent_test', ['@ember/engine', 'internal-test-helpers'], function (_engine, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('EngineParent', class extends _internalTestHelpers.AbstractTestCase {
    ["@test An engine's parent can be set with `setEngineParent` and retrieved with `getEngineParent`"](assert) {
      let engine = {};
      let parent = {};

      assert.strictEqual((0, _engine.getEngineParent)(engine), undefined, 'parent has not been set');

      (0, _engine.setEngineParent)(engine, parent);

      assert.strictEqual((0, _engine.getEngineParent)(engine), parent, 'parent has been set');
    }
  });
});
enifed('@ember/engine/tests/engine_test', ['@ember/-internals/environment', '@ember/runloop', '@ember/engine', '@ember/-internals/runtime', '@ember/-internals/container', 'internal-test-helpers'], function (_environment, _runloop, _engine, _runtime, _container, _internalTestHelpers) {
  'use strict';

  let engine;
  let originalLookup = _environment.context.lookup;

  (0, _internalTestHelpers.moduleFor)('Engine', class extends _internalTestHelpers.AbstractTestCase {
    constructor() {
      super();

      (0, _runloop.run)(() => {
        engine = _engine.default.create();
        _environment.context.lookup = { TestEngine: engine };
      });
    }

    teardown() {
      _environment.context.lookup = originalLookup;
      if (engine) {
        (0, _runloop.run)(engine, 'destroy');
        engine = null;
      }
    }

    ['@test acts like a namespace'](assert) {
      engine.Foo = _runtime.Object.extend();
      assert.equal(engine.Foo.toString(), 'TestEngine.Foo', 'Classes pick up their parent namespace');
    }

    ['@test builds a registry'](assert) {
      assert.strictEqual(engine.resolveRegistration('application:main'), engine, `application:main is registered`);
      assert.deepEqual(engine.registeredOptionsForType('component'), { singleton: false }, `optionsForType 'component'`);
      assert.deepEqual(engine.registeredOptionsForType('view'), { singleton: false }, `optionsForType 'view'`);
      (0, _internalTestHelpers.verifyRegistration)(assert, engine, 'controller:basic');
      (0, _internalTestHelpers.verifyInjection)(assert, engine, 'view', '_viewRegistry', '-view-registry:main');
      (0, _internalTestHelpers.verifyInjection)(assert, engine, 'route', '_topLevelViewTemplate', 'template:-outlet');
      (0, _internalTestHelpers.verifyInjection)(assert, engine, 'view:-outlet', 'namespace', 'application:main');

      (0, _internalTestHelpers.verifyInjection)(assert, engine, 'controller', 'target', 'router:main');
      (0, _internalTestHelpers.verifyInjection)(assert, engine, 'controller', 'namespace', 'application:main');

      (0, _internalTestHelpers.verifyInjection)(assert, engine, 'router', '_bucketCache', _container.privatize`-bucket-cache:main`);
      (0, _internalTestHelpers.verifyInjection)(assert, engine, 'route', '_bucketCache', _container.privatize`-bucket-cache:main`);

      (0, _internalTestHelpers.verifyInjection)(assert, engine, 'route', '_router', 'router:main');

      (0, _internalTestHelpers.verifyRegistration)(assert, engine, 'component:-text-field');
      (0, _internalTestHelpers.verifyRegistration)(assert, engine, 'component:-text-area');
      (0, _internalTestHelpers.verifyRegistration)(assert, engine, 'component:-checkbox');
      (0, _internalTestHelpers.verifyRegistration)(assert, engine, 'component:link-to');

      (0, _internalTestHelpers.verifyRegistration)(assert, engine, 'service:-routing');
      (0, _internalTestHelpers.verifyInjection)(assert, engine, 'service:-routing', 'router', 'router:main');

      // DEBUGGING
      (0, _internalTestHelpers.verifyRegistration)(assert, engine, 'resolver-for-debugging:main');
      (0, _internalTestHelpers.verifyInjection)(assert, engine, 'container-debug-adapter:main', 'resolver', 'resolver-for-debugging:main');
      (0, _internalTestHelpers.verifyInjection)(assert, engine, 'data-adapter:main', 'containerDebugAdapter', 'container-debug-adapter:main');
      (0, _internalTestHelpers.verifyRegistration)(assert, engine, 'container-debug-adapter:main');
      (0, _internalTestHelpers.verifyRegistration)(assert, engine, 'component-lookup:main');

      (0, _internalTestHelpers.verifyInjection)(assert, engine, 'service:-dom-changes', 'document', 'service:-document');
      (0, _internalTestHelpers.verifyInjection)(assert, engine, 'service:-dom-tree-construction', 'document', 'service:-document');
      (0, _internalTestHelpers.verifyRegistration)(assert, engine, 'view:-outlet');
      (0, _internalTestHelpers.verifyRegistration)(assert, engine, _container.privatize`template:components/-default`);
      (0, _internalTestHelpers.verifyRegistration)(assert, engine, 'template:-outlet');
      (0, _internalTestHelpers.verifyInjection)(assert, engine, 'view:-outlet', 'template', 'template:-outlet');
      (0, _internalTestHelpers.verifyInjection)(assert, engine, 'template', 'compiler', _container.privatize`template-compiler:main`);
      assert.deepEqual(engine.registeredOptionsForType('helper'), { instantiate: false }, `optionsForType 'helper'`);
    }
  });
});
enifed('@ember/error/tests/index_test', ['@ember/error', 'internal-test-helpers'], function (_error, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Ember Error Throwing', class extends _internalTestHelpers.AbstractTestCase {
    ['@test new EmberError displays provided message'](assert) {
      assert.throws(() => {
        throw new _error.default('A Message');
      }, function (e) {
        return e.message === 'A Message';
      }, 'the assigned message was displayed');
    }
  });
});
enifed('@ember/instrumentation/tests/index-test', ['@ember/instrumentation', 'internal-test-helpers'], function (_instrumentation, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Ember Instrumentation', class extends _internalTestHelpers.AbstractTestCase {
    afterEach() {
      (0, _instrumentation.reset)();
    }

    ['@test execute block even if no listeners'](assert) {
      let result = (0, _instrumentation.instrument)('render', {}, function () {
        return 'hello';
      });
      assert.equal(result, 'hello', 'called block');
    }

    ['@test subscribing to a simple path receives the listener'](assert) {
      assert.expect(12);

      let sentPayload = {};
      let count = 0;

      (0, _instrumentation.subscribe)('render', {
        before(name, timestamp, payload) {
          if (count === 0) {
            assert.strictEqual(name, 'render');
          } else {
            assert.strictEqual(name, 'render.handlebars');
          }

          assert.ok(typeof timestamp === 'number');
          assert.strictEqual(payload, sentPayload);
        },

        after(name, timestamp, payload) {
          if (count === 0) {
            assert.strictEqual(name, 'render');
          } else {
            assert.strictEqual(name, 'render.handlebars');
          }

          assert.ok(typeof timestamp === 'number');
          assert.strictEqual(payload, sentPayload);

          count++;
        }
      });

      (0, _instrumentation.instrument)('render', sentPayload, function () {});

      (0, _instrumentation.instrument)('render.handlebars', sentPayload, function () {});
    }

    ['@test returning a value from the before callback passes it to the after callback'](assert) {
      assert.expect(2);

      let passthru1 = {};
      let passthru2 = {};

      (0, _instrumentation.subscribe)('render', {
        before() {
          return passthru1;
        },
        after(name, timestamp, payload, beforeValue) {
          assert.strictEqual(beforeValue, passthru1);
        }
      });

      (0, _instrumentation.subscribe)('render', {
        before() {
          return passthru2;
        },
        after(name, timestamp, payload, beforeValue) {
          assert.strictEqual(beforeValue, passthru2);
        }
      });

      (0, _instrumentation.instrument)('render', null, function () {});
    }

    ['@test instrument with 2 args (name, callback) no payload'](assert) {
      assert.expect(1);

      (0, _instrumentation.subscribe)('render', {
        before(name, timestamp, payload) {
          assert.deepEqual(payload, {});
        },
        after() {}
      });

      (0, _instrumentation.instrument)('render', function () {});
    }

    ['@test instrument with 3 args (name, callback, binding) no payload'](assert) {
      assert.expect(2);

      let binding = {};
      (0, _instrumentation.subscribe)('render', {
        before(name, timestamp, payload) {
          assert.deepEqual(payload, {});
        },
        after() {}
      });

      (0, _instrumentation.instrument)('render', function () {
        assert.deepEqual(this, binding);
      }, binding);
    }

    ['@test instrument with 3 args (name, payload, callback) with payload'](assert) {
      assert.expect(1);

      let expectedPayload = { hi: 1 };
      (0, _instrumentation.subscribe)('render', {
        before(name, timestamp, payload) {
          assert.deepEqual(payload, expectedPayload);
        },
        after() {}
      });

      (0, _instrumentation.instrument)('render', expectedPayload, function () {});
    }

    ['@test instrument with 4 args (name, payload, callback, binding) with payload'](assert) {
      assert.expect(2);

      let expectedPayload = { hi: 1 };
      let binding = {};
      (0, _instrumentation.subscribe)('render', {
        before(name, timestamp, payload) {
          assert.deepEqual(payload, expectedPayload);
        },
        after() {}
      });

      (0, _instrumentation.instrument)('render', expectedPayload, function () {
        assert.deepEqual(this, binding);
      }, binding);
    }

    ['@test raising an exception in the instrumentation attaches it to the payload'](assert) {
      assert.expect(2);

      let error = new Error('Instrumentation');

      (0, _instrumentation.subscribe)('render', {
        before() {},
        after(name, timestamp, payload) {
          assert.strictEqual(payload.exception, error);
        }
      });

      (0, _instrumentation.subscribe)('render', {
        before() {},
        after(name, timestamp, payload) {
          assert.strictEqual(payload.exception, error);
        }
      });

      (0, _instrumentation.instrument)('render.handlebars', null, function () {
        throw error;
      });
    }

    ['@test it is possible to add a new subscriber after the first instrument'](assert) {
      (0, _instrumentation.instrument)('render.handlebars', null, function () {});

      (0, _instrumentation.subscribe)('render', {
        before() {
          assert.ok(true, 'Before callback was called');
        },
        after() {
          assert.ok(true, 'After callback was called');
        }
      });

      (0, _instrumentation.instrument)('render.handlebars', null, function () {});
    }

    ['@test it is possible to remove a subscriber'](assert) {
      assert.expect(4);

      let count = 0;

      let subscriber = (0, _instrumentation.subscribe)('render', {
        before() {
          assert.equal(count, 0);
          assert.ok(true, 'Before callback was called');
        },
        after() {
          assert.equal(count, 0);
          assert.ok(true, 'After callback was called');
          count++;
        }
      });

      (0, _instrumentation.instrument)('render.handlebars', null, function () {});

      (0, _instrumentation.unsubscribe)(subscriber);

      (0, _instrumentation.instrument)('render.handlebars', null, function () {});
    }
  });
});
enifed('@ember/map/tests/map_test', ['@ember/map', '@ember/map/with-default', '@ember/map/lib/ordered-set', 'internal-test-helpers'], function (_map, _withDefault, _orderedSet, _internalTestHelpers) {
  'use strict';

  let object, number, string, map, variety;
  const varieties = [['Map', _map.default], ['MapWithDefault', _withDefault.default]];

  function testMap(nameAndFunc) {
    variety = nameAndFunc[0];

    (0, _internalTestHelpers.moduleFor)('Ember.' + variety + ' (forEach and get are implicitly tested)', class extends _internalTestHelpers.AbstractTestCase {
      beforeEach() {
        object = {};
        number = 42;
        string = 'foo';

        expectDeprecation(() => {
          map = nameAndFunc[1].create();
        }, 'Use of @ember/Map is deprecated. Please use native `Map` instead', { id: 'ember-map-deprecation', until: '3.5.0' });
      }

      ['@test set'](assert) {
        map.set(object, 'winning');
        map.set(number, 'winning');
        map.set(string, 'winning');

        mapHasEntries(assert, [[object, 'winning'], [number, 'winning'], [string, 'winning']]);

        map.set(object, 'losing');
        map.set(number, 'losing');
        map.set(string, 'losing');

        mapHasEntries(assert, [[object, 'losing'], [number, 'losing'], [string, 'losing']]);

        assert.equal(map.has('nope'), false, 'expected the key `nope` to not be present');
        assert.equal(map.has({}), false, 'expected they key `{}` to not be present');
      }

      ['@test set chaining'](assert) {
        map.set(object, 'winning').set(number, 'winning').set(string, 'winning');

        mapHasEntries(assert, [[object, 'winning'], [number, 'winning'], [string, 'winning']]);

        map.set(object, 'losing').set(number, 'losing').set(string, 'losing');

        mapHasEntries(assert, [[object, 'losing'], [number, 'losing'], [string, 'losing']]);

        assert.equal(map.has('nope'), false, 'expected the key `nope` to not be present');
        assert.equal(map.has({}), false, 'expected they key `{}` to not be present');
      }

      ['@test with key with undefined value'](assert) {
        map.set('foo', undefined);

        map.forEach(function (value, key) {
          assert.equal(value, undefined);
          assert.equal(key, 'foo');
        });

        assert.ok(map.has('foo'), 'has key foo, even with undefined value');

        assert.equal(map.size, 1);
      }

      ['@test arity of forEach is 1 – es6 23.1.3.5'](assert) {
        assert.equal(map.forEach.length, 1, 'expected arity for map.forEach is 1');
      }

      ['@test forEach throws without a callback as the first argument'](assert) {
        assert.equal(map.forEach.length, 1, 'expected arity for map.forEach is 1');
      }

      ['@test has empty collection'](assert) {
        assert.equal(map.has('foo'), false);
        assert.equal(map.has(), false);
      }

      ['@test delete'](assert) {
        expectNoDeprecation();

        map.set(object, 'winning');
        map.set(number, 'winning');
        map.set(string, 'winning');

        map.delete(object);
        map.delete(number);
        map.delete(string);

        // doesn't explode
        map.delete({});

        mapHasEntries(assert, []);
      }

      ['@test copy and then update'](assert) {
        map.set(object, 'winning');
        map.set(number, 'winning');
        map.set(string, 'winning');

        let map2;
        expectDeprecation(() => {
          map2 = map.copy();
        }, 'Use of @ember/Map is deprecated. Please use native `Map` instead', { id: 'ember-map-deprecation', until: '3.5.0' });

        map2.set(object, 'losing');
        map2.set(number, 'losing');
        map2.set(string, 'losing');

        mapHasEntries(assert, [[object, 'winning'], [number, 'winning'], [string, 'winning']]);

        mapHasEntries(assert, [[object, 'losing'], [number, 'losing'], [string, 'losing']], map2);
      }

      ['@test copy and then delete'](assert) {
        map.set(object, 'winning');
        map.set(number, 'winning');
        map.set(string, 'winning');

        let map2;
        expectDeprecation(() => {
          map2 = map.copy();
        }, 'Use of @ember/Map is deprecated. Please use native `Map` instead', { id: 'ember-map-deprecation', until: '3.5.0' });

        map2.delete(object);
        map2.delete(number);
        map2.delete(string);

        mapHasEntries(assert, [[object, 'winning'], [number, 'winning'], [string, 'winning']]);

        mapHasEntries(assert, [], map2);
      }

      ['@test size'](assert) {
        //Add a key twice
        assert.equal(map.size, 0);
        map.set(string, 'a string');
        assert.equal(map.size, 1);
        map.set(string, 'the same string');
        assert.equal(map.size, 1);

        //Add another
        map.set(number, 'a number');
        assert.equal(map.size, 2);

        //Remove one that doesn't exist
        map.delete('does not exist');
        assert.equal(map.size, 2);

        //Check copy
        expectDeprecation(() => {
          let copy = map.copy();
          assert.equal(copy.size, 2);
        }, 'Use of @ember/Map is deprecated. Please use native `Map` instead', { id: 'ember-map-deprecation', until: '3.5.0' });

        //Remove a key twice
        map.delete(number);
        assert.equal(map.size, 1);
        map.delete(number);
        assert.equal(map.size, 1);

        //Remove the last key
        map.delete(string);
        assert.equal(map.size, 0);
        map.delete(string);
        assert.equal(map.size, 0);
      }

      ['@test forEach without proper callback'](assert) {
        expectAssertion(function () {
          map.forEach();
        }, '[object Undefined] is not a function');

        expectAssertion(function () {
          map.forEach(undefined);
        }, '[object Undefined] is not a function');

        expectAssertion(function () {
          map.forEach(1);
        }, '[object Number] is not a function');

        expectAssertion(function () {
          map.forEach({});
        }, '[object Object] is not a function');

        map.forEach(function (value, key) {
          map.delete(key);
        });
        // ensure the error happens even if no data is present
        assert.equal(map.size, 0);
        expectAssertion(function () {
          map.forEach({});
        }, '[object Object] is not a function');
      }

      ['@test forEach basic'](assert) {
        map.set('a', 1);
        map.set('b', 2);
        map.set('c', 3);

        let iteration = 0;

        let expectations = [{ value: 1, key: 'a', context: unboundThis }, { value: 2, key: 'b', context: unboundThis }, { value: 3, key: 'c', context: unboundThis }];

        map.forEach(function (value, key, theMap) {
          let expectation = expectations[iteration];

          assert.equal(value, expectation.value, 'value should be correct');
          assert.equal(key, expectation.key, 'key should be correct');
          assert.equal(this, expectation.context, 'context should be as if it was unbound');
          assert.equal(map, theMap, 'map being iterated over should be passed in');

          iteration++;
        });

        assert.equal(iteration, 3, 'expected 3 iterations');
      }

      ['@test forEach basic /w context'](assert) {
        map.set('a', 1);
        map.set('b', 2);
        map.set('c', 3);

        let iteration = 0;
        let context = {};
        let expectations = [{ value: 1, key: 'a', context: context }, { value: 2, key: 'b', context: context }, { value: 3, key: 'c', context: context }];

        map.forEach(function (value, key, theMap) {
          let expectation = expectations[iteration];

          assert.equal(value, expectation.value, 'value should be correct');
          assert.equal(key, expectation.key, 'key should be correct');
          assert.equal(this, expectation.context, 'context should be as if it was unbound');
          assert.equal(map, theMap, 'map being iterated over should be passed in');

          iteration++;
        }, context);

        assert.equal(iteration, 3, 'expected 3 iterations');
      }

      ['@test forEach basic /w deletion while enumerating'](assert) {
        map.set('a', 1);
        map.set('b', 2);
        map.set('c', 3);

        let iteration = 0;

        let expectations = [{ value: 1, key: 'a', context: unboundThis }, { value: 2, key: 'b', context: unboundThis }];

        map.forEach(function (value, key, theMap) {
          if (iteration === 0) {
            map.delete('c');
          }

          let expectation = expectations[iteration];

          assert.equal(value, expectation.value, 'value should be correct');
          assert.equal(key, expectation.key, 'key should be correct');
          assert.equal(this, expectation.context, 'context should be as if it was unbound');
          assert.equal(map, theMap, 'map being iterated over should be passed in');

          iteration++;
        });

        assert.equal(iteration, 2, 'expected 3 iterations');
      }

      ['@test forEach basic /w addition while enumerating'](assert) {
        map.set('a', 1);
        map.set('b', 2);
        map.set('c', 3);

        let iteration = 0;

        let expectations = [{ value: 1, key: 'a', context: unboundThis }, { value: 2, key: 'b', context: unboundThis }, { value: 3, key: 'c', context: unboundThis }, { value: 4, key: 'd', context: unboundThis }];

        map.forEach(function (value, key, theMap) {
          if (iteration === 0) {
            map.set('d', 4);
          }

          let expectation = expectations[iteration];

          assert.equal(value, expectation.value, 'value should be correct');
          assert.equal(key, expectation.key, 'key should be correct');
          assert.equal(this, expectation.context, 'context should be as if it was unbound');
          assert.equal(map, theMap, 'map being iterated over should be passed in');

          iteration++;
        });

        assert.equal(iteration, 4, 'expected 3 iterations');
      }

      ['@test clear'](assert) {
        let iterations = 0;

        map.set('a', 1);
        map.set('b', 2);
        map.set('c', 3);
        map.set('d', 4);

        assert.equal(map.size, 4);

        map.forEach(function () {
          iterations++;
        });
        assert.equal(iterations, 4);

        map.clear();
        assert.equal(map.size, 0);
        iterations = 0;
        map.forEach(function () {
          iterations++;
        });
        assert.equal(iterations, 0);
      }

      ['@skip -0'](assert) {
        assert.equal(map.has(-0), false);
        assert.equal(map.has(0), false);

        map.set(-0, 'zero');

        assert.equal(map.has(-0), true);
        assert.equal(map.has(0), true);

        assert.equal(map.get(0), 'zero');
        assert.equal(map.get(-0), 'zero');

        map.forEach(function (value, key) {
          assert.equal(1 / key, Infinity, 'spec says key should be positive zero');
        });
      }

      ['@test NaN'](assert) {
        assert.equal(map.has(NaN), false);

        map.set(NaN, 'not-a-number');

        assert.equal(map.has(NaN), true);

        assert.equal(map.get(NaN), 'not-a-number');
      }

      ['@test NaN Boxed'](assert) {
        let boxed = new Number(NaN);
        assert.equal(map.has(boxed), false);

        map.set(boxed, 'not-a-number');

        assert.equal(map.has(boxed), true);
        assert.equal(map.has(NaN), false);

        assert.equal(map.get(NaN), undefined);
        assert.equal(map.get(boxed), 'not-a-number');
      }

      ['@test 0 value'](assert) {
        let obj = {};
        assert.equal(map.has(obj), false);

        assert.equal(map.size, 0);
        map.set(obj, 0);
        assert.equal(map.size, 1);

        assert.equal(map.has(obj), true);
        assert.equal(map.get(obj), 0);

        map.delete(obj);
        assert.equal(map.has(obj), false);
        assert.equal(map.get(obj), undefined);
        assert.equal(map.size, 0);
      }
    });

    let mapHasLength = function (assert, expected, theMap) {
      theMap = theMap || map;

      let length = 0;
      theMap.forEach(function () {
        length++;
      });

      assert.equal(length, expected, 'map should contain ' + expected + ' items');
    };

    let mapHasEntries = function (assert, entries, theMap) {
      theMap = theMap || map;

      for (let i = 0; i < entries.length; i++) {
        assert.equal(theMap.get(entries[i][0]), entries[i][1]);
        assert.equal(theMap.has(entries[i][0]), true);
      }

      mapHasLength(assert, entries.length, theMap);
    };

    let unboundThis;

    (function () {
      unboundThis = this;
    })();
  }

  for (let i = 0; i < varieties.length; i++) {
    testMap(varieties[i]);
  }

  (0, _internalTestHelpers.moduleFor)('MapWithDefault - default values', class extends _internalTestHelpers.AbstractTestCase {
    ['@test Retrieving a value that has not been set returns and sets a default value'](assert) {
      let map;
      expectDeprecation(() => {
        map = _withDefault.default.create({
          defaultValue(key) {
            return [key];
          }
        });
      }, 'Use of @ember/Map is deprecated. Please use native `Map` instead', { id: 'ember-map-deprecation', until: '3.5.0' });

      let value = map.get('ohai');
      assert.deepEqual(value, ['ohai']);

      assert.strictEqual(value, map.get('ohai'));
    }

    ['@test Map.prototype.constructor'](assert) {
      expectDeprecation(() => {
        let map = new _map.default();
        assert.equal(map.constructor, _map.default);
      }, 'Use of @ember/Map is deprecated. Please use native `Map` instead', { id: 'ember-map-deprecation', until: '3.5.0' });
    }

    ['@test MapWithDefault.prototype.constructor'](assert) {
      expectDeprecation(() => {
        let map = new _withDefault.default({
          defaultValue(key) {
            return key;
          }
        });
        assert.equal(map.constructor, _withDefault.default);
      }, 'Use of @ember/Map is deprecated. Please use native `Map` instead', { id: 'ember-map-deprecation', until: '3.5.0' });
    }

    ['@test Copying a MapWithDefault copies the default value'](assert) {
      let map;
      expectDeprecation(() => {
        map = _withDefault.default.create({
          defaultValue(key) {
            return [key];
          }
        });
      }, 'Use of @ember/Map is deprecated. Please use native `Map` instead', { id: 'ember-map-deprecation', until: '3.5.0' });

      map.set('ohai', 1);
      map.get('bai');

      let map2;
      expectDeprecation(() => {
        map2 = map.copy();
      }, 'Use of @ember/Map is deprecated. Please use native `Map` instead', { id: 'ember-map-deprecation', until: '3.5.0' });

      assert.equal(map2.get('ohai'), 1);
      assert.deepEqual(map2.get('bai'), ['bai']);

      map2.set('kthx', 3);

      assert.deepEqual(map.get('kthx'), ['kthx']);
      assert.equal(map2.get('kthx'), 3);

      assert.deepEqual(map2.get('default'), ['default']);

      map2.defaultValue = key => ['tom is on', key];

      assert.deepEqual(map2.get('drugs'), ['tom is on', 'drugs']);
    }
  });

  (0, _internalTestHelpers.moduleFor)('OrderedSet', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      object = {};
      number = 42;
      string = 'foo';

      expectDeprecation(() => {
        map = _orderedSet.default.create();
      }, 'Use of @ember/OrderedSet is deprecated. Please use native `Map` instead', { id: 'ember-map-deprecation', until: '3.5.0' });
    }

    ['@test add returns the set'](assert) {
      let obj = {};
      assert.equal(map.add(obj), map);
      assert.equal(map.add(obj), map, 'when it is already in the set');
    }
  });

  (0, _internalTestHelpers.moduleFor)('__OrderedSet__', class extends _internalTestHelpers.AbstractTestCase {
    ['@test private __OrderedSet__ can be created without deprecation']() {
      expectNoDeprecation();
      _orderedSet.__OrderedSet__.create();
    }
  });
});
enifed('@ember/object/tests/computed/computed_macros_test', ['@ember/-internals/metal', '@ember/object/computed', '@ember/-internals/runtime', 'internal-test-helpers'], function (_metal, _computed, _runtime, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('CP macros', class extends _internalTestHelpers.AbstractTestCase {
    ['@test Ember.computed.empty'](assert) {
      let obj = _runtime.Object.extend({
        bestLannister: null,
        lannisters: null,

        bestLannisterUnspecified: (0, _computed.empty)('bestLannister'),
        noLannistersKnown: (0, _computed.empty)('lannisters')
      }).create({
        lannisters: (0, _runtime.A)()
      });

      assert.equal((0, _metal.get)(obj, 'bestLannisterUnspecified'), true, 'bestLannister initially empty');
      assert.equal((0, _metal.get)(obj, 'noLannistersKnown'), true, 'lannisters initially empty');

      (0, _metal.get)(obj, 'lannisters').pushObject('Tyrion');
      (0, _metal.set)(obj, 'bestLannister', 'Tyrion');

      assert.equal((0, _metal.get)(obj, 'bestLannisterUnspecified'), false, 'empty respects strings');
      assert.equal((0, _metal.get)(obj, 'noLannistersKnown'), false, 'empty respects array mutations');
    }

    ['@test Ember.computed.notEmpty'](assert) {
      let obj = _runtime.Object.extend({
        bestLannister: null,
        lannisters: null,

        bestLannisterSpecified: (0, _computed.notEmpty)('bestLannister'),
        LannistersKnown: (0, _computed.notEmpty)('lannisters')
      }).create({
        lannisters: (0, _runtime.A)()
      });

      assert.equal((0, _metal.get)(obj, 'bestLannisterSpecified'), false, 'bestLannister initially empty');
      assert.equal((0, _metal.get)(obj, 'LannistersKnown'), false, 'lannisters initially empty');

      (0, _metal.get)(obj, 'lannisters').pushObject('Tyrion');
      (0, _metal.set)(obj, 'bestLannister', 'Tyrion');

      assert.equal((0, _metal.get)(obj, 'bestLannisterSpecified'), true, 'empty respects strings');
      assert.equal((0, _metal.get)(obj, 'LannistersKnown'), true, 'empty respects array mutations');
    }

    ['@test computed.not'](assert) {
      let obj = { foo: true };
      (0, _metal.defineProperty)(obj, 'notFoo', (0, _computed.not)('foo'));
      assert.equal((0, _metal.get)(obj, 'notFoo'), false);

      obj = { foo: { bar: true } };
      (0, _metal.defineProperty)(obj, 'notFoo', (0, _computed.not)('foo.bar'));
      assert.equal((0, _metal.get)(obj, 'notFoo'), false);
    }

    ['@test computed.empty'](assert) {
      let obj = { foo: [], bar: undefined, baz: null, quz: '' };
      (0, _metal.defineProperty)(obj, 'fooEmpty', (0, _computed.empty)('foo'));
      (0, _metal.defineProperty)(obj, 'barEmpty', (0, _computed.empty)('bar'));
      (0, _metal.defineProperty)(obj, 'bazEmpty', (0, _computed.empty)('baz'));
      (0, _metal.defineProperty)(obj, 'quzEmpty', (0, _computed.empty)('quz'));

      assert.equal((0, _metal.get)(obj, 'fooEmpty'), true);
      (0, _metal.set)(obj, 'foo', [1]);
      assert.equal((0, _metal.get)(obj, 'fooEmpty'), false);
      assert.equal((0, _metal.get)(obj, 'barEmpty'), true);
      assert.equal((0, _metal.get)(obj, 'bazEmpty'), true);
      assert.equal((0, _metal.get)(obj, 'quzEmpty'), true);
      (0, _metal.set)(obj, 'quz', 'asdf');
      assert.equal((0, _metal.get)(obj, 'quzEmpty'), false);
    }

    ['@test computed.bool'](assert) {
      let obj = { foo() {}, bar: 'asdf', baz: null, quz: false };
      (0, _metal.defineProperty)(obj, 'fooBool', (0, _computed.bool)('foo'));
      (0, _metal.defineProperty)(obj, 'barBool', (0, _computed.bool)('bar'));
      (0, _metal.defineProperty)(obj, 'bazBool', (0, _computed.bool)('baz'));
      (0, _metal.defineProperty)(obj, 'quzBool', (0, _computed.bool)('quz'));
      assert.equal((0, _metal.get)(obj, 'fooBool'), true);
      assert.equal((0, _metal.get)(obj, 'barBool'), true);
      assert.equal((0, _metal.get)(obj, 'bazBool'), false);
      assert.equal((0, _metal.get)(obj, 'quzBool'), false);
    }

    ['@test computed.alias'](assert) {
      let obj = { bar: 'asdf', baz: null, quz: false };
      (0, _metal.defineProperty)(obj, 'bay', (0, _metal.computed)(function () {
        return 'apple';
      }));

      (0, _metal.defineProperty)(obj, 'barAlias', (0, _metal.alias)('bar'));
      (0, _metal.defineProperty)(obj, 'bazAlias', (0, _metal.alias)('baz'));
      (0, _metal.defineProperty)(obj, 'quzAlias', (0, _metal.alias)('quz'));
      (0, _metal.defineProperty)(obj, 'bayAlias', (0, _metal.alias)('bay'));

      assert.equal((0, _metal.get)(obj, 'barAlias'), 'asdf');
      assert.equal((0, _metal.get)(obj, 'bazAlias'), null);
      assert.equal((0, _metal.get)(obj, 'quzAlias'), false);
      assert.equal((0, _metal.get)(obj, 'bayAlias'), 'apple');

      (0, _metal.set)(obj, 'barAlias', 'newBar');
      (0, _metal.set)(obj, 'bazAlias', 'newBaz');
      (0, _metal.set)(obj, 'quzAlias', null);

      assert.equal((0, _metal.get)(obj, 'barAlias'), 'newBar');
      assert.equal((0, _metal.get)(obj, 'bazAlias'), 'newBaz');
      assert.equal((0, _metal.get)(obj, 'quzAlias'), null);

      assert.equal((0, _metal.get)(obj, 'bar'), 'newBar');
      assert.equal((0, _metal.get)(obj, 'baz'), 'newBaz');
      assert.equal((0, _metal.get)(obj, 'quz'), null);
    }

    ['@test computed.alias set'](assert) {
      let obj = {};
      let constantValue = 'always `a`';

      (0, _metal.defineProperty)(obj, 'original', (0, _metal.computed)({
        get: function () {
          return constantValue;
        },
        set: function () {
          return constantValue;
        }
      }));
      (0, _metal.defineProperty)(obj, 'aliased', (0, _metal.alias)('original'));

      assert.equal((0, _metal.get)(obj, 'original'), constantValue);
      assert.equal((0, _metal.get)(obj, 'aliased'), constantValue);

      (0, _metal.set)(obj, 'aliased', 'should not set to this value');

      assert.equal((0, _metal.get)(obj, 'original'), constantValue);
      assert.equal((0, _metal.get)(obj, 'aliased'), constantValue);
    }

    ['@test computed.match'](assert) {
      let obj = { name: 'Paul' };
      (0, _metal.defineProperty)(obj, 'isPaul', (0, _computed.match)('name', /Paul/));

      assert.equal((0, _metal.get)(obj, 'isPaul'), true, 'is Paul');

      (0, _metal.set)(obj, 'name', 'Pierre');

      assert.equal((0, _metal.get)(obj, 'isPaul'), false, 'is not Paul anymore');
    }

    ['@test computed.notEmpty'](assert) {
      let obj = { items: [1] };
      (0, _metal.defineProperty)(obj, 'hasItems', (0, _computed.notEmpty)('items'));

      assert.equal((0, _metal.get)(obj, 'hasItems'), true, 'is not empty');

      (0, _metal.set)(obj, 'items', []);

      assert.equal((0, _metal.get)(obj, 'hasItems'), false, 'is empty');
    }

    ['@test computed.equal'](assert) {
      let obj = { name: 'Paul' };
      (0, _metal.defineProperty)(obj, 'isPaul', (0, _computed.equal)('name', 'Paul'));

      assert.equal((0, _metal.get)(obj, 'isPaul'), true, 'is Paul');

      (0, _metal.set)(obj, 'name', 'Pierre');

      assert.equal((0, _metal.get)(obj, 'isPaul'), false, 'is not Paul anymore');
    }

    ['@test computed.gt'](assert) {
      let obj = { number: 2 };
      (0, _metal.defineProperty)(obj, 'isGreaterThenOne', (0, _computed.gt)('number', 1));

      assert.equal((0, _metal.get)(obj, 'isGreaterThenOne'), true, 'is gt');

      (0, _metal.set)(obj, 'number', 1);

      assert.equal((0, _metal.get)(obj, 'isGreaterThenOne'), false, 'is not gt');

      (0, _metal.set)(obj, 'number', 0);

      assert.equal((0, _metal.get)(obj, 'isGreaterThenOne'), false, 'is not gt');
    }

    ['@test computed.gte'](assert) {
      let obj = { number: 2 };
      (0, _metal.defineProperty)(obj, 'isGreaterOrEqualThenOne', (0, _computed.gte)('number', 1));

      assert.equal((0, _metal.get)(obj, 'isGreaterOrEqualThenOne'), true, 'is gte');

      (0, _metal.set)(obj, 'number', 1);

      assert.equal((0, _metal.get)(obj, 'isGreaterOrEqualThenOne'), true, 'is gte');

      (0, _metal.set)(obj, 'number', 0);

      assert.equal((0, _metal.get)(obj, 'isGreaterOrEqualThenOne'), false, 'is not gte');
    }

    ['@test computed.lt'](assert) {
      let obj = { number: 0 };
      (0, _metal.defineProperty)(obj, 'isLesserThenOne', (0, _computed.lt)('number', 1));

      assert.equal((0, _metal.get)(obj, 'isLesserThenOne'), true, 'is lt');

      (0, _metal.set)(obj, 'number', 1);

      assert.equal((0, _metal.get)(obj, 'isLesserThenOne'), false, 'is not lt');

      (0, _metal.set)(obj, 'number', 2);

      assert.equal((0, _metal.get)(obj, 'isLesserThenOne'), false, 'is not lt');
    }

    ['@test computed.lte'](assert) {
      let obj = { number: 0 };
      (0, _metal.defineProperty)(obj, 'isLesserOrEqualThenOne', (0, _computed.lte)('number', 1));

      assert.equal((0, _metal.get)(obj, 'isLesserOrEqualThenOne'), true, 'is lte');

      (0, _metal.set)(obj, 'number', 1);

      assert.equal((0, _metal.get)(obj, 'isLesserOrEqualThenOne'), true, 'is lte');

      (0, _metal.set)(obj, 'number', 2);

      assert.equal((0, _metal.get)(obj, 'isLesserOrEqualThenOne'), false, 'is not lte');
    }

    ['@test computed.and two properties'](assert) {
      let obj = { one: true, two: true };
      (0, _metal.defineProperty)(obj, 'oneAndTwo', (0, _computed.and)('one', 'two'));

      assert.equal((0, _metal.get)(obj, 'oneAndTwo'), true, 'one and two');

      (0, _metal.set)(obj, 'one', false);

      assert.equal((0, _metal.get)(obj, 'oneAndTwo'), false, 'one and not two');

      (0, _metal.set)(obj, 'one', null);
      (0, _metal.set)(obj, 'two', 'Yes');

      assert.equal((0, _metal.get)(obj, 'oneAndTwo'), null, 'returns falsy value as in &&');

      (0, _metal.set)(obj, 'one', true);
      (0, _metal.set)(obj, 'two', 2);

      assert.equal((0, _metal.get)(obj, 'oneAndTwo'), 2, 'returns truthy value as in &&');
    }

    ['@test computed.and three properties'](assert) {
      let obj = { one: true, two: true, three: true };
      (0, _metal.defineProperty)(obj, 'oneTwoThree', (0, _computed.and)('one', 'two', 'three'));

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), true, 'one and two and three');

      (0, _metal.set)(obj, 'one', false);

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), false, 'one and not two and not three');

      (0, _metal.set)(obj, 'one', true);
      (0, _metal.set)(obj, 'two', 2);
      (0, _metal.set)(obj, 'three', 3);

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), 3, 'returns truthy value as in &&');
    }

    ['@test computed.and expand properties'](assert) {
      let obj = { one: true, two: true, three: true };
      (0, _metal.defineProperty)(obj, 'oneTwoThree', (0, _computed.and)('{one,two,three}'));

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), true, 'one and two and three');

      (0, _metal.set)(obj, 'one', false);

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), false, 'one and not two and not three');

      (0, _metal.set)(obj, 'one', true);
      (0, _metal.set)(obj, 'two', 2);
      (0, _metal.set)(obj, 'three', 3);

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), 3, 'returns truthy value as in &&');
    }

    ['@test computed.or two properties'](assert) {
      let obj = { one: true, two: true };
      (0, _metal.defineProperty)(obj, 'oneOrTwo', (0, _computed.or)('one', 'two'));

      assert.equal((0, _metal.get)(obj, 'oneOrTwo'), true, 'one or two');

      (0, _metal.set)(obj, 'one', false);

      assert.equal((0, _metal.get)(obj, 'oneOrTwo'), true, 'one or two');

      (0, _metal.set)(obj, 'two', false);

      assert.equal((0, _metal.get)(obj, 'oneOrTwo'), false, 'nor one nor two');

      (0, _metal.set)(obj, 'two', null);

      assert.equal((0, _metal.get)(obj, 'oneOrTwo'), null, 'returns last falsy value as in ||');

      (0, _metal.set)(obj, 'two', true);

      assert.equal((0, _metal.get)(obj, 'oneOrTwo'), true, 'one or two');

      (0, _metal.set)(obj, 'one', 1);

      assert.equal((0, _metal.get)(obj, 'oneOrTwo'), 1, 'returns truthy value as in ||');
    }

    ['@test computed.or three properties'](assert) {
      let obj = { one: true, two: true, three: true };
      (0, _metal.defineProperty)(obj, 'oneTwoThree', (0, _computed.or)('one', 'two', 'three'));

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), true, 'one or two or three');

      (0, _metal.set)(obj, 'one', false);

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), true, 'one or two or three');

      (0, _metal.set)(obj, 'two', false);

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), true, 'one or two or three');

      (0, _metal.set)(obj, 'three', false);

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), false, 'one or two or three');

      (0, _metal.set)(obj, 'three', null);

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), null, 'returns last falsy value as in ||');

      (0, _metal.set)(obj, 'two', true);

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), true, 'one or two or three');

      (0, _metal.set)(obj, 'one', 1);

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), 1, 'returns truthy value as in ||');
    }

    ['@test computed.or expand properties'](assert) {
      let obj = { one: true, two: true, three: true };
      (0, _metal.defineProperty)(obj, 'oneTwoThree', (0, _computed.or)('{one,two,three}'));

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), true, 'one or two or three');

      (0, _metal.set)(obj, 'one', false);

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), true, 'one or two or three');

      (0, _metal.set)(obj, 'two', false);

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), true, 'one or two or three');

      (0, _metal.set)(obj, 'three', false);

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), false, 'one or two or three');

      (0, _metal.set)(obj, 'three', null);

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), null, 'returns last falsy value as in ||');

      (0, _metal.set)(obj, 'two', true);

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), true, 'one or two or three');

      (0, _metal.set)(obj, 'one', 1);

      assert.equal((0, _metal.get)(obj, 'oneTwoThree'), 1, 'returns truthy value as in ||');
    }

    ['@test computed.or and computed.and warn about dependent keys with spaces']() {
      let obj = { one: true, two: true };
      expectAssertion(function () {
        (0, _metal.defineProperty)(obj, 'oneOrTwo', (0, _computed.or)('one', 'two three'));
      }, /Dependent keys passed to computed\.or\(\) can't have spaces\./);

      expectAssertion(function () {
        (0, _metal.defineProperty)(obj, 'oneAndTwo', (0, _computed.and)('one', 'two three'));
      }, /Dependent keys passed to computed\.and\(\) can't have spaces\./);
    }

    ['@test computed.oneWay'](assert) {
      let obj = {
        firstName: 'Teddy',
        lastName: 'Zeenny'
      };

      (0, _metal.defineProperty)(obj, 'nickName', (0, _computed.oneWay)('firstName'));

      assert.equal((0, _metal.get)(obj, 'firstName'), 'Teddy');
      assert.equal((0, _metal.get)(obj, 'lastName'), 'Zeenny');
      assert.equal((0, _metal.get)(obj, 'nickName'), 'Teddy');

      (0, _metal.set)(obj, 'nickName', 'TeddyBear');

      assert.equal((0, _metal.get)(obj, 'firstName'), 'Teddy');
      assert.equal((0, _metal.get)(obj, 'lastName'), 'Zeenny');

      assert.equal((0, _metal.get)(obj, 'nickName'), 'TeddyBear');

      (0, _metal.set)(obj, 'firstName', 'TEDDDDDDDDYYY');

      assert.equal((0, _metal.get)(obj, 'nickName'), 'TeddyBear');
    }

    ['@test computed.readOnly'](assert) {
      let obj = {
        firstName: 'Teddy',
        lastName: 'Zeenny'
      };

      (0, _metal.defineProperty)(obj, 'nickName', (0, _computed.readOnly)('firstName'));

      assert.equal((0, _metal.get)(obj, 'firstName'), 'Teddy');
      assert.equal((0, _metal.get)(obj, 'lastName'), 'Zeenny');
      assert.equal((0, _metal.get)(obj, 'nickName'), 'Teddy');

      assert.throws(function () {
        (0, _metal.set)(obj, 'nickName', 'TeddyBear');
      }, / /);

      assert.equal((0, _metal.get)(obj, 'firstName'), 'Teddy');
      assert.equal((0, _metal.get)(obj, 'lastName'), 'Zeenny');

      assert.equal((0, _metal.get)(obj, 'nickName'), 'Teddy');

      (0, _metal.set)(obj, 'firstName', 'TEDDDDDDDDYYY');

      assert.equal((0, _metal.get)(obj, 'nickName'), 'TEDDDDDDDDYYY');
    }

    ['@test computed.deprecatingAlias'](assert) {
      let obj = { bar: 'asdf', baz: null, quz: false };
      (0, _metal.defineProperty)(obj, 'bay', (0, _metal.computed)(function () {
        return 'apple';
      }));

      (0, _metal.defineProperty)(obj, 'barAlias', (0, _computed.deprecatingAlias)('bar', { id: 'bar-deprecation', until: 'some.version' }));
      (0, _metal.defineProperty)(obj, 'bazAlias', (0, _computed.deprecatingAlias)('baz', { id: 'baz-deprecation', until: 'some.version' }));
      (0, _metal.defineProperty)(obj, 'quzAlias', (0, _computed.deprecatingAlias)('quz', { id: 'quz-deprecation', until: 'some.version' }));
      (0, _metal.defineProperty)(obj, 'bayAlias', (0, _computed.deprecatingAlias)('bay', { id: 'bay-deprecation', until: 'some.version' }));

      expectDeprecation(function () {
        assert.equal((0, _metal.get)(obj, 'barAlias'), 'asdf');
      }, 'Usage of `barAlias` is deprecated, use `bar` instead.');

      expectDeprecation(function () {
        assert.equal((0, _metal.get)(obj, 'bazAlias'), null);
      }, 'Usage of `bazAlias` is deprecated, use `baz` instead.');

      expectDeprecation(function () {
        assert.equal((0, _metal.get)(obj, 'quzAlias'), false);
      }, 'Usage of `quzAlias` is deprecated, use `quz` instead.');

      expectDeprecation(function () {
        assert.equal((0, _metal.get)(obj, 'bayAlias'), 'apple');
      }, 'Usage of `bayAlias` is deprecated, use `bay` instead.');

      expectDeprecation(function () {
        (0, _metal.set)(obj, 'barAlias', 'newBar');
      }, 'Usage of `barAlias` is deprecated, use `bar` instead.');

      expectDeprecation(function () {
        (0, _metal.set)(obj, 'bazAlias', 'newBaz');
      }, 'Usage of `bazAlias` is deprecated, use `baz` instead.');

      expectDeprecation(function () {
        (0, _metal.set)(obj, 'quzAlias', null);
      }, 'Usage of `quzAlias` is deprecated, use `quz` instead.');

      assert.equal((0, _metal.get)(obj, 'barAlias'), 'newBar');
      assert.equal((0, _metal.get)(obj, 'bazAlias'), 'newBaz');
      assert.equal((0, _metal.get)(obj, 'quzAlias'), null);

      assert.equal((0, _metal.get)(obj, 'bar'), 'newBar');
      assert.equal((0, _metal.get)(obj, 'baz'), 'newBaz');
      assert.equal((0, _metal.get)(obj, 'quz'), null);
    }
  });
});
enifed('@ember/object/tests/computed/reduce_computed_macros_test', ['@ember/runloop', '@ember/-internals/metal', '@ember/-internals/runtime', '@ember/object/computed', 'internal-test-helpers'], function (_runloop, _metal, _runtime, _computed, _internalTestHelpers) {
  'use strict';

  let obj;
  (0, _internalTestHelpers.moduleFor)('map', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      obj = _runtime.Object.extend({
        mapped: (0, _computed.map)('array.@each.v', item => item.v),
        mappedObjects: (0, _computed.map)('arrayObjects.@each.v', item => ({
          name: item.v.name
        }))
      }).create({
        arrayObjects: (0, _runtime.A)([{ v: { name: 'Robert' } }, { v: { name: 'Leanna' } }]),

        array: (0, _runtime.A)([{ v: 1 }, { v: 3 }, { v: 2 }, { v: 1 }])
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test map is readOnly'](assert) {
      assert.throws(function () {
        obj.set('mapped', 1);
      }, /Cannot set read-only property "mapped" on object:/);
    }

    ['@test it maps simple properties'](assert) {
      assert.deepEqual(obj.get('mapped'), [1, 3, 2, 1]);

      obj.get('array').pushObject({ v: 5 });

      assert.deepEqual(obj.get('mapped'), [1, 3, 2, 1, 5]);

      (0, _runtime.removeAt)(obj.get('array'), 3);

      assert.deepEqual(obj.get('mapped'), [1, 3, 2, 5]);
    }

    ['@test it maps simple unshifted properties'](assert) {
      let array = (0, _runtime.A)();

      obj = _runtime.Object.extend({
        mapped: (0, _computed.map)('array', item => item.toUpperCase())
      }).create({
        array
      });

      array.unshiftObject('c');
      array.unshiftObject('b');
      array.unshiftObject('a');

      array.popObject();

      assert.deepEqual(obj.get('mapped'), ['A', 'B'], 'properties unshifted in sequence are mapped correctly');
    }

    ['@test it has the correct `this`'](assert) {
      obj = _runtime.Object.extend({
        mapped: (0, _computed.map)('array', function (item) {
          assert.equal(this, obj, 'should have correct context');
          return this.upperCase(item);
        }),
        upperCase(string) {
          return string.toUpperCase();
        }
      }).create({
        array: ['a', 'b', 'c']
      });

      assert.deepEqual(obj.get('mapped'), ['A', 'B', 'C'], 'properties unshifted in sequence are mapped correctly');
    }

    ['@test it passes the index to the callback'](assert) {
      let array = ['a', 'b', 'c'];

      obj = _runtime.Object.extend({
        mapped: (0, _computed.map)('array', (item, index) => index)
      }).create({
        array
      });

      assert.deepEqual(obj.get('mapped'), [0, 1, 2], 'index is passed to callback correctly');
    }

    ['@test it maps objects'](assert) {
      assert.deepEqual(obj.get('mappedObjects'), [{ name: 'Robert' }, { name: 'Leanna' }]);

      obj.get('arrayObjects').pushObject({
        v: { name: 'Eddard' }
      });

      assert.deepEqual(obj.get('mappedObjects'), [{ name: 'Robert' }, { name: 'Leanna' }, { name: 'Eddard' }]);

      (0, _runtime.removeAt)(obj.get('arrayObjects'), 1);

      assert.deepEqual(obj.get('mappedObjects'), [{ name: 'Robert' }, { name: 'Eddard' }]);

      (0, _metal.set)(obj.get('arrayObjects')[0], 'v', { name: 'Stannis' });

      assert.deepEqual(obj.get('mappedObjects'), [{ name: 'Stannis' }, { name: 'Eddard' }]);
    }

    ['@test it maps unshifted objects with property observers'](assert) {
      let array = (0, _runtime.A)();
      let cObj = { v: 'c' };

      obj = _runtime.Object.extend({
        mapped: (0, _computed.map)('array.@each.v', item => (0, _metal.get)(item, 'v').toUpperCase())
      }).create({
        array
      });

      array.unshiftObject(cObj);
      array.unshiftObject({ v: 'b' });
      array.unshiftObject({ v: 'a' });

      (0, _metal.set)(cObj, 'v', 'd');

      assert.deepEqual(array.mapBy('v'), ['a', 'b', 'd'], 'precond - unmapped array is correct');
      assert.deepEqual(obj.get('mapped'), ['A', 'B', 'D'], 'properties unshifted in sequence are mapped correctly');
    }
  });

  (0, _internalTestHelpers.moduleFor)('mapBy', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      obj = _runtime.Object.extend({
        mapped: (0, _computed.mapBy)('array', 'v')
      }).create({
        array: (0, _runtime.A)([{ v: 1 }, { v: 3 }, { v: 2 }, { v: 1 }])
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test mapBy is readOnly'](assert) {
      assert.throws(function () {
        obj.set('mapped', 1);
      }, /Cannot set read-only property "mapped" on object:/);
    }

    ['@test it maps properties'](assert) {
      assert.deepEqual(obj.get('mapped'), [1, 3, 2, 1]);

      obj.get('array').pushObject({ v: 5 });

      assert.deepEqual(obj.get('mapped'), [1, 3, 2, 1, 5]);

      (0, _runtime.removeAt)(obj.get('array'), 3);

      assert.deepEqual(obj.get('mapped'), [1, 3, 2, 5]);
    }

    ['@test it is observable'](assert) {
      let calls = 0;

      assert.deepEqual(obj.get('mapped'), [1, 3, 2, 1]);

      (0, _metal.addObserver)(obj, 'mapped.@each', () => calls++);

      obj.get('array').pushObject({ v: 5 });

      assert.equal(calls, 1, 'mapBy is observable');
    }
  });

  (0, _internalTestHelpers.moduleFor)('filter', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      obj = _runtime.Object.extend({
        filtered: (0, _computed.filter)('array', item => item % 2 === 0)
      }).create({
        array: (0, _runtime.A)([1, 2, 3, 4, 5, 6, 7, 8])
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test filter is readOnly'](assert) {
      assert.throws(function () {
        obj.set('filtered', 1);
      }, /Cannot set read-only property "filtered" on object:/);
    }

    ['@test it filters according to the specified filter function'](assert) {
      assert.deepEqual(obj.get('filtered'), [2, 4, 6, 8], 'filter filters by the specified function');
    }

    ['@test it passes the index to the callback'](assert) {
      obj = _runtime.Object.extend({
        filtered: (0, _computed.filter)('array', (item, index) => index === 1)
      }).create({
        array: ['a', 'b', 'c']
      });

      assert.deepEqual((0, _metal.get)(obj, 'filtered'), ['b'], 'index is passed to callback correctly');
    }

    ['@test it has the correct `this`'](assert) {
      obj = _runtime.Object.extend({
        filtered: (0, _computed.filter)('array', function (item, index) {
          assert.equal(this, obj);
          return this.isOne(index);
        }),
        isOne(value) {
          return value === 1;
        }
      }).create({
        array: ['a', 'b', 'c']
      });

      assert.deepEqual((0, _metal.get)(obj, 'filtered'), ['b'], 'index is passed to callback correctly');
    }

    ['@test it passes the array to the callback'](assert) {
      obj = _runtime.Object.extend({
        filtered: (0, _computed.filter)('array', (item, index, array) => index === (0, _metal.get)(array, 'length') - 2)
      }).create({
        array: (0, _runtime.A)(['a', 'b', 'c'])
      });

      assert.deepEqual(obj.get('filtered'), ['b'], 'array is passed to callback correctly');
    }

    ['@test it caches properly'](assert) {
      let array = obj.get('array');

      let filtered = obj.get('filtered');
      assert.ok(filtered === obj.get('filtered'));

      array.addObject(11);
      let newFiltered = obj.get('filtered');

      assert.ok(filtered !== newFiltered);

      assert.ok(obj.get('filtered') === newFiltered);
    }

    ['@test it updates as the array is modified'](assert) {
      let array = obj.get('array');

      assert.deepEqual(obj.get('filtered'), [2, 4, 6, 8], 'precond - filtered array is initially correct');

      array.addObject(11);
      assert.deepEqual(obj.get('filtered'), [2, 4, 6, 8], 'objects not passing the filter are not added');

      array.addObject(12);
      assert.deepEqual(obj.get('filtered'), [2, 4, 6, 8, 12], 'objects passing the filter are added');

      array.removeObject(3);
      array.removeObject(4);

      assert.deepEqual(obj.get('filtered'), [2, 6, 8, 12], 'objects removed from the dependent array are removed from the computed array');
    }

    ['@test the dependent array can be cleared one at a time'](assert) {
      let array = (0, _metal.get)(obj, 'array');

      assert.deepEqual(obj.get('filtered'), [2, 4, 6, 8], 'precond - filtered array is initially correct');

      // clear 1-8 but in a random order
      array.removeObject(3);
      array.removeObject(1);
      array.removeObject(2);
      array.removeObject(4);
      array.removeObject(8);
      array.removeObject(6);
      array.removeObject(5);
      array.removeObject(7);

      assert.deepEqual(obj.get('filtered'), [], 'filtered array cleared correctly');
    }

    ['@test the dependent array can be `clear`ed directly (#3272)'](assert) {
      assert.deepEqual(obj.get('filtered'), [2, 4, 6, 8], 'precond - filtered array is initially correct');

      obj.get('array').clear();

      assert.deepEqual(obj.get('filtered'), [], 'filtered array cleared correctly');
    }

    ['@test it updates as the array is replaced'](assert) {
      assert.deepEqual(obj.get('filtered'), [2, 4, 6, 8], 'precond - filtered array is initially correct');

      obj.set('array', [20, 21, 22, 23, 24]);

      assert.deepEqual(obj.get('filtered'), [20, 22, 24], 'computed array is updated when array is changed');
    }

    ['@test it updates properly on @each with {} dependencies'](assert) {
      let item = _runtime.Object.create({ prop: true });

      obj = _runtime.Object.extend({
        filtered: (0, _computed.filter)('items.@each.{prop}', function (item) {
          return item.get('prop') === true;
        })
      }).create({
        items: (0, _runtime.A)([item])
      });

      assert.deepEqual(obj.get('filtered'), [item]);

      item.set('prop', false);

      assert.deepEqual(obj.get('filtered'), []);
    }
  });

  (0, _internalTestHelpers.moduleFor)('filterBy', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      obj = _runtime.Object.extend({
        a1s: (0, _computed.filterBy)('array', 'a', 1),
        as: (0, _computed.filterBy)('array', 'a'),
        bs: (0, _computed.filterBy)('array', 'b')
      }).create({
        array: (0, _runtime.A)([{ name: 'one', a: 1, b: false }, { name: 'two', a: 2, b: false }, { name: 'three', a: 1, b: true }, { name: 'four', b: true }])
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test filterBy is readOnly'](assert) {
      assert.throws(function () {
        obj.set('as', 1);
      }, /Cannot set read-only property "as" on object:/);
    }

    ['@test properties can be filtered by truthiness'](assert) {
      assert.deepEqual(obj.get('as').mapBy('name'), ['one', 'two', 'three'], 'properties can be filtered by existence');
      assert.deepEqual(obj.get('bs').mapBy('name'), ['three', 'four'], 'booleans can be filtered');

      (0, _metal.set)(obj.get('array')[0], 'a', undefined);
      (0, _metal.set)(obj.get('array')[3], 'a', true);

      (0, _metal.set)(obj.get('array')[0], 'b', true);
      (0, _metal.set)(obj.get('array')[3], 'b', false);

      assert.deepEqual(obj.get('as').mapBy('name'), ['two', 'three', 'four'], 'arrays computed by filter property respond to property changes');
      assert.deepEqual(obj.get('bs').mapBy('name'), ['one', 'three'], 'arrays computed by filtered property respond to property changes');

      obj.get('array').pushObject({ name: 'five', a: 6, b: true });

      assert.deepEqual(obj.get('as').mapBy('name'), ['two', 'three', 'four', 'five'], 'arrays computed by filter property respond to added objects');
      assert.deepEqual(obj.get('bs').mapBy('name'), ['one', 'three', 'five'], 'arrays computed by filtered property respond to added objects');

      obj.get('array').popObject();

      assert.deepEqual(obj.get('as').mapBy('name'), ['two', 'three', 'four'], 'arrays computed by filter property respond to removed objects');
      assert.deepEqual(obj.get('bs').mapBy('name'), ['one', 'three'], 'arrays computed by filtered property respond to removed objects');

      obj.set('array', [{ name: 'six', a: 12, b: true }]);

      assert.deepEqual(obj.get('as').mapBy('name'), ['six'], 'arrays computed by filter property respond to array changes');
      assert.deepEqual(obj.get('bs').mapBy('name'), ['six'], 'arrays computed by filtered property respond to array changes');
    }

    ['@test properties can be filtered by values'](assert) {
      assert.deepEqual(obj.get('a1s').mapBy('name'), ['one', 'three'], 'properties can be filtered by matching value');

      obj.get('array').pushObject({ name: 'five', a: 1 });

      assert.deepEqual(obj.get('a1s').mapBy('name'), ['one', 'three', 'five'], 'arrays computed by matching value respond to added objects');

      obj.get('array').popObject();

      assert.deepEqual(obj.get('a1s').mapBy('name'), ['one', 'three'], 'arrays computed by matching value respond to removed objects');

      (0, _metal.set)(obj.get('array')[1], 'a', 1);
      (0, _metal.set)(obj.get('array')[2], 'a', 2);

      assert.deepEqual(obj.get('a1s').mapBy('name'), ['one', 'two'], 'arrays computed by matching value respond to modified properties');
    }

    ['@test properties values can be replaced'](assert) {
      obj = _runtime.Object.extend({
        a1s: (0, _computed.filterBy)('array', 'a', 1),
        a1bs: (0, _computed.filterBy)('a1s', 'b')
      }).create({
        array: []
      });

      assert.deepEqual(obj.get('a1bs').mapBy('name'), [], 'properties can be filtered by matching value');

      (0, _metal.set)(obj, 'array', [{ name: 'item1', a: 1, b: true }]);

      assert.deepEqual(obj.get('a1bs').mapBy('name'), ['item1'], 'properties can be filtered by matching value');
    }
  });

  [['uniq', _computed.uniq], ['union', _computed.union]].forEach(tuple => {
    let [name, macro] = tuple;

    (0, _internalTestHelpers.moduleFor)(`computed.${name}`, class extends _internalTestHelpers.AbstractTestCase {
      beforeEach() {
        obj = _runtime.Object.extend({
          union: macro('array', 'array2', 'array3')
        }).create({
          array: (0, _runtime.A)([1, 2, 3, 4, 5, 6]),
          array2: (0, _runtime.A)([4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9]),
          array3: (0, _runtime.A)([1, 8, 10])
        });
      }

      afterEach() {
        (0, _runloop.run)(obj, 'destroy');
      }

      [`@test ${name} is readOnly`](assert) {
        assert.throws(function () {
          obj.set('union', 1);
        }, /Cannot set read-only property "union" on object:/);
      }

      ['@test does not include duplicates'](assert) {
        let array = obj.get('array');
        let array2 = obj.get('array2');

        assert.deepEqual(obj.get('union').sort((x, y) => x - y), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], name + ' does not include duplicates');

        array.pushObject(8);

        assert.deepEqual(obj.get('union').sort((x, y) => x - y), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], name + ' does not add existing items');

        array.pushObject(11);

        assert.deepEqual(obj.get('union').sort((x, y) => x - y), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], name + ' adds new items');

        (0, _runtime.removeAt)(array2, 6); // remove 7

        assert.deepEqual(obj.get('union').sort((x, y) => x - y), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], name + ' does not remove items that are still in the dependent array');

        array2.removeObject(7);

        assert.deepEqual(obj.get('union').sort((x, y) => x - y), [1, 2, 3, 4, 5, 6, 8, 9, 10, 11], name + ' removes items when their last instance is gone');
      }

      ['@test has set-union semantics'](assert) {
        let array = obj.get('array');

        assert.deepEqual(obj.get('union').sort((x, y) => x - y), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], name + ' is initially correct');

        array.removeObject(6);

        assert.deepEqual(obj.get('union').sort((x, y) => x - y), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 'objects are not removed if they exist in other dependent arrays');

        array.clear();

        assert.deepEqual(obj.get('union').sort((x, y) => x - y), [1, 4, 5, 6, 7, 8, 9, 10], 'objects are removed when they are no longer in any dependent array');
      }
    });
  });

  (0, _internalTestHelpers.moduleFor)('computed.uniqBy', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      obj = _runtime.Object.extend({
        list: null,
        uniqueById: (0, _computed.uniqBy)('list', 'id')
      }).create({
        list: (0, _runtime.A)([{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 1, value: 'one' }])
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test uniqBy is readOnly'](assert) {
      assert.throws(function () {
        obj.set('uniqueById', 1);
      }, /Cannot set read-only property "uniqueById" on object:/);
    }
    ['@test does not include duplicates'](assert) {
      assert.deepEqual(obj.get('uniqueById'), [{ id: 1, value: 'one' }, { id: 2, value: 'two' }]);
    }

    ['@test it does not share state among instances'](assert) {
      let MyObject = _runtime.Object.extend({
        list: [],
        uniqueByName: (0, _computed.uniqBy)('list', 'name')
      });
      let a = MyObject.create({
        list: [{ name: 'bob' }, { name: 'mitch' }, { name: 'mitch' }]
      });
      let b = MyObject.create({
        list: [{ name: 'warren' }, { name: 'mitch' }]
      });

      assert.deepEqual(a.get('uniqueByName'), [{ name: 'bob' }, { name: 'mitch' }]);
      // Making sure that 'mitch' appears
      assert.deepEqual(b.get('uniqueByName'), [{ name: 'warren' }, { name: 'mitch' }]);
    }

    ['@test it handles changes to the dependent array'](assert) {
      obj.get('list').pushObject({ id: 3, value: 'three' });

      assert.deepEqual(obj.get('uniqueById'), [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }], 'The list includes three');

      obj.get('list').pushObject({ id: 3, value: 'three' });

      assert.deepEqual(obj.get('uniqueById'), [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }], 'The list does not include a duplicate three');
    }

    ['@test it returns an empty array when computed on a non-array'](assert) {
      let MyObject = _runtime.Object.extend({
        list: null,
        uniq: (0, _computed.uniqBy)('list', 'name')
      });
      let a = MyObject.create({ list: 'not an array' });

      assert.deepEqual(a.get('uniq'), []);
    }
  });

  (0, _internalTestHelpers.moduleFor)('computed.intersect', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      obj = _runtime.Object.extend({
        intersection: (0, _computed.intersect)('array', 'array2', 'array3')
      }).create({
        array: (0, _runtime.A)([1, 2, 3, 4, 5, 6]),
        array2: (0, _runtime.A)([3, 3, 3, 4, 5]),
        array3: (0, _runtime.A)([3, 5, 6, 7, 8])
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test intersect is readOnly'](assert) {
      assert.throws(function () {
        obj.set('intersection', 1);
      }, /Cannot set read-only property "intersection" on object:/);
    }

    ['@test it has set-intersection semantics'](assert) {
      let array2 = obj.get('array2');
      let array3 = obj.get('array3');

      assert.deepEqual(obj.get('intersection').sort((x, y) => x - y), [3, 5], 'intersection is initially correct');

      array2.shiftObject();

      assert.deepEqual(obj.get('intersection').sort((x, y) => x - y), [3, 5], 'objects are not removed when they are still in all dependent arrays');

      array2.shiftObject();

      assert.deepEqual(obj.get('intersection').sort((x, y) => x - y), [3, 5], 'objects are not removed when they are still in all dependent arrays');

      array2.shiftObject();

      assert.deepEqual(obj.get('intersection'), [5], 'objects are removed once they are gone from all dependent arrays');

      array2.pushObject(1);

      assert.deepEqual(obj.get('intersection'), [5], 'objects are not added as long as they are missing from any dependent array');

      array3.pushObject(1);

      assert.deepEqual(obj.get('intersection').sort((x, y) => x - y), [1, 5], 'objects added once they belong to all dependent arrays');
    }
  });

  (0, _internalTestHelpers.moduleFor)('setDiff', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      obj = _runtime.Object.extend({
        diff: (0, _computed.setDiff)('array', 'array2')
      }).create({
        array: (0, _runtime.A)([1, 2, 3, 4, 5, 6, 7]),
        array2: (0, _runtime.A)([3, 4, 5, 10])
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test setDiff is readOnly'](assert) {
      assert.throws(function () {
        obj.set('diff', 1);
      }, /Cannot set read-only property "diff" on object:/);
    }

    ['@test it asserts if given fewer or more than two dependent properties']() {
      expectAssertion(function () {
        _runtime.Object.extend({
          diff: (0, _computed.setDiff)('array')
        }).create({
          array: (0, _runtime.A)([1, 2, 3, 4, 5, 6, 7]),
          array2: (0, _runtime.A)([3, 4, 5])
        });
      }, /\`computed\.setDiff\` requires exactly two dependent arrays/, 'setDiff requires two dependent arrays');

      expectAssertion(function () {
        _runtime.Object.extend({
          diff: (0, _computed.setDiff)('array', 'array2', 'array3')
        }).create({
          array: (0, _runtime.A)([1, 2, 3, 4, 5, 6, 7]),
          array2: (0, _runtime.A)([3, 4, 5]),
          array3: (0, _runtime.A)([7])
        });
      }, /\`computed\.setDiff\` requires exactly two dependent arrays/, 'setDiff requires two dependent arrays');
    }

    ['@test it has set-diff semantics'](assert) {
      let array1 = obj.get('array');
      let array2 = obj.get('array2');

      assert.deepEqual(obj.get('diff').sort((x, y) => x - y), [1, 2, 6, 7], 'set-diff is initially correct');

      array2.popObject();

      assert.deepEqual(obj.get('diff').sort((x, y) => x - y), [1, 2, 6, 7], 'removing objects from the remove set has no effect if the object is not in the keep set');

      array2.shiftObject();

      assert.deepEqual(obj.get('diff').sort((x, y) => x - y), [1, 2, 3, 6, 7], "removing objects from the remove set adds them if they're in the keep set");

      array1.removeObject(3);

      assert.deepEqual(obj.get('diff').sort((x, y) => x - y), [1, 2, 6, 7], 'removing objects from the keep array removes them from the computed array');

      array1.pushObject(5);

      assert.deepEqual(obj.get('diff').sort((x, y) => x - y), [1, 2, 6, 7], 'objects added to the keep array that are in the remove array are not added to the computed array');

      array1.pushObject(22);

      assert.deepEqual(obj.get('diff').sort((x, y) => x - y), [1, 2, 6, 7, 22], 'objects added to the keep array not in the remove array are added to the computed array');
    }
  });

  (0, _internalTestHelpers.moduleFor)('sort - sortProperties', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      obj = _runtime.Object.extend({
        sortedItems: (0, _computed.sort)('items', 'itemSorting')
      }).create({
        itemSorting: (0, _runtime.A)(['lname', 'fname']),
        items: (0, _runtime.A)([{ fname: 'Jaime', lname: 'Lannister', age: 34 }, { fname: 'Cersei', lname: 'Lannister', age: 34 }, { fname: 'Robb', lname: 'Stark', age: 16 }, { fname: 'Bran', lname: 'Stark', age: 8 }])
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test sort is readOnly'](assert) {
      assert.throws(function () {
        obj.set('sortedItems', 1);
      }, /Cannot set read-only property "sortedItems" on object:/);
    }

    ['@test arrays are initially sorted'](assert) {
      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'array is initially sorted');
    }

    ['@test default sort order is correct'](assert) {
      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'array is initially sorted');
    }

    ['@test changing the dependent array updates the sorted array'](assert) {
      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

      obj.set('items', [{ fname: 'Roose', lname: 'Bolton' }, { fname: 'Theon', lname: 'Greyjoy' }, { fname: 'Ramsey', lname: 'Bolton' }, { fname: 'Stannis', lname: 'Baratheon' }]);

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Stannis', 'Ramsey', 'Roose', 'Theon'], 'changing dependent array updates sorted array');
    }

    ['@test adding to the dependent array updates the sorted array'](assert) {
      let items = obj.get('items');

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

      items.pushObject({
        fname: 'Tyrion',
        lname: 'Lannister'
      });

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Tyrion', 'Bran', 'Robb'], 'Adding to the dependent array updates the sorted array');
    }

    ['@test removing from the dependent array updates the sorted array'](assert) {
      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

      obj.get('items').popObject();

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Robb'], 'Removing from the dependent array updates the sorted array');
    }

    ['@test distinct items may be sort-equal, although their relative order will not be guaranteed'](assert) {
      // We recreate jaime and "Cersei" here only for test stability: we want
      // their guid-ordering to be deterministic
      let jaimeInDisguise = {
        fname: 'Cersei',
        lname: 'Lannister',
        age: 34
      };

      let jaime = {
        fname: 'Jaime',
        lname: 'Lannister',
        age: 34
      };

      let items = obj.get('items');

      items.replace(0, 1, [jaime]);
      items.replace(1, 1, [jaimeInDisguise]);

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

      (0, _metal.set)(jaimeInDisguise, 'fname', 'Jaime');

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Jaime', 'Jaime', 'Bran', 'Robb'], 'sorted array is updated');

      (0, _metal.set)(jaimeInDisguise, 'fname', 'Cersei');

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'sorted array is updated');
    }

    ['@test guid sort-order fallback with a search proxy is not confused by non-search ObjectProxys'](assert) {
      let tyrion = {
        fname: 'Tyrion',
        lname: 'Lannister'
      };

      let tyrionInDisguise = _runtime.ObjectProxy.create({
        fname: 'Yollo',
        lname: '',
        content: tyrion
      });

      let items = obj.get('items');

      items.pushObject(tyrion);

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Tyrion', 'Bran', 'Robb']);

      items.pushObject(tyrionInDisguise);

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Yollo', 'Cersei', 'Jaime', 'Tyrion', 'Bran', 'Robb']);
    }

    ['@test updating sort properties detaches observers for old sort properties'](assert) {
      let objectToRemove = obj.get('items')[3];

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

      obj.set('itemSorting', (0, _runtime.A)(['fname:desc']));

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Robb', 'Jaime', 'Cersei', 'Bran'], 'after updating sort properties array is updated');

      obj.get('items').removeObject(objectToRemove);

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Robb', 'Jaime', 'Cersei'], 'after removing item array is updated');

      (0, _metal.set)(objectToRemove, 'lname', 'Updated-Stark');

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Robb', 'Jaime', 'Cersei'], 'after changing removed item array is not updated');
    }

    ['@test sort works if array property is null (non array value) on first evaluation of computed prop'](assert) {
      obj.set('items', null);
      assert.deepEqual(obj.get('sortedItems'), []);
      obj.set('items', (0, _runtime.A)([{ fname: 'Cersei', lname: 'Lanister' }]));
      assert.deepEqual(obj.get('sortedItems'), [{ fname: 'Cersei', lname: 'Lanister' }]);
    }

    ['@test updating sort properties updates the sorted array'](assert) {
      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

      obj.set('itemSorting', (0, _runtime.A)(['fname:desc']));

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Robb', 'Jaime', 'Cersei', 'Bran'], 'after updating sort properties array is updated');
    }

    ['@test updating sort properties invalidates the sorted array'](assert) {
      let sortProps = obj.get('itemSorting');

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

      sortProps.clear();
      sortProps.pushObject('fname');

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Bran', 'Cersei', 'Jaime', 'Robb'], 'after updating sort properties array is updated');
    }

    ['@test updating new sort properties invalidates the sorted array'](assert) {
      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

      obj.set('itemSorting', (0, _runtime.A)(['age:desc', 'fname:asc']));

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Robb', 'Bran'], 'precond - array is correct after item sorting is changed');

      (0, _metal.set)(obj.get('items')[1], 'age', 29);

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Jaime', 'Cersei', 'Robb', 'Bran'], 'after updating sort properties array is updated');
    }

    ['@test sort direction defaults to ascending'](assert) {
      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb']);
    }

    ['@test sort direction defaults to ascending (with sort property change)'](assert) {
      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

      obj.set('itemSorting', (0, _runtime.A)(['fname']));

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Bran', 'Cersei', 'Jaime', 'Robb'], 'sort direction defaults to ascending');
    }

    ["@test updating an item's sort properties updates the sorted array"](assert) {
      let tyrionInDisguise = obj.get('items')[1];

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

      (0, _metal.set)(tyrionInDisguise, 'fname', 'Tyrion');

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Jaime', 'Tyrion', 'Bran', 'Robb'], "updating an item's sort properties updates the sorted array");
    }

    ["@test updating several of an item's sort properties updated the sorted array"](assert) {
      let sansaInDisguise = obj.get('items')[1];

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

      (0, _metal.setProperties)(sansaInDisguise, {
        fname: 'Sansa',
        lname: 'Stark'
      });

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Jaime', 'Bran', 'Robb', 'Sansa'], "updating an item's sort properties updates the sorted array");
    }

    ["@test updating an item's sort properties does not error when binary search does a self compare (#3273)"](assert) {
      let jaime = {
        name: 'Jaime',
        status: 1
      };

      let cersei = {
        name: 'Cersei',
        status: 2
      };

      let obj = _runtime.Object.extend({
        sortProps: ['status'],
        sortedPeople: (0, _computed.sort)('people', 'sortProps')
      }).create({
        people: [jaime, cersei]
      });

      assert.deepEqual(obj.get('sortedPeople'), [jaime, cersei], 'precond - array is initially sorted');

      (0, _metal.set)(cersei, 'status', 3);

      assert.deepEqual(obj.get('sortedPeople'), [jaime, cersei], 'array is sorted correctly');

      (0, _metal.set)(cersei, 'status', 2);

      assert.deepEqual(obj.get('sortedPeople'), [jaime, cersei], 'array is sorted correctly');
    }

    ['@test array should not be sorted if sort properties array is empty'](assert) {
      var o = _runtime.Object.extend({
        sortedItems: (0, _computed.sort)('items', 'itemSorting')
      }).create({
        itemSorting: (0, _runtime.A)([]),
        // This bug only manifests when array.sort(() => 0) is not equal to array.
        // In order for this to happen, the browser must use an unstable sort and the
        // array must be sufficient large. On Chrome, 12 items is currently sufficient.
        items: (0, _runtime.A)([6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5])
      });

      assert.deepEqual(o.get('sortedItems'), [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5], 'array is not changed');
    }

    ['@test array should update if items to be sorted is replaced when sort properties array is empty'](assert) {
      var o = _runtime.Object.extend({
        sortedItems: (0, _computed.sort)('items', 'itemSorting')
      }).create({
        itemSorting: (0, _runtime.A)([]),
        items: (0, _runtime.A)([6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5])
      });

      assert.deepEqual(o.get('sortedItems'), [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5], 'array is not changed');

      (0, _metal.set)(o, 'items', (0, _runtime.A)([5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4]));

      assert.deepEqual(o.get('sortedItems'), [5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4], 'array was updated');
    }

    ['@test array should update if items to be sorted is mutated when sort properties array is empty'](assert) {
      var o = _runtime.Object.extend({
        sortedItems: (0, _computed.sort)('items', 'itemSorting')
      }).create({
        itemSorting: (0, _runtime.A)([]),
        items: (0, _runtime.A)([6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5])
      });

      assert.deepEqual(o.get('sortedItems'), [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5], 'array is not changed');

      o.get('items').pushObject(12);

      assert.deepEqual(o.get('sortedItems'), [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 12], 'array was updated');
    }

    ['@test array observers do not leak'](assert) {
      let daria = { name: 'Daria' };
      let jane = { name: 'Jane' };

      let sisters = [jane, daria];

      let sortProps = (0, _runtime.A)(['name']);
      let jaime = _runtime.Object.extend({
        sortedPeople: (0, _computed.sort)('sisters', 'sortProps'),
        sortProps
      }).create({
        sisters
      });

      jaime.get('sortedPeople');
      (0, _runloop.run)(jaime, 'destroy');

      try {
        sortProps.pushObject({
          name: 'Anna'
        });
        assert.ok(true);
      } catch (e) {
        assert.ok(false, e);
      }
    }

    ['@test property paths in sort properties update the sorted array'](assert) {
      let jaime = {
        relatedObj: { status: 1, firstName: 'Jaime', lastName: 'Lannister' }
      };

      let cersei = {
        relatedObj: { status: 2, firstName: 'Cersei', lastName: 'Lannister' }
      };

      let sansa = _runtime.Object.create({
        relatedObj: { status: 3, firstName: 'Sansa', lastName: 'Stark' }
      });

      let obj = _runtime.Object.extend({
        sortProps: ['relatedObj.status'],
        sortedPeople: (0, _computed.sort)('people', 'sortProps')
      }).create({
        people: [jaime, cersei, sansa]
      });

      assert.deepEqual(obj.get('sortedPeople'), [jaime, cersei, sansa], 'precond - array is initially sorted');

      (0, _metal.set)(cersei, 'status', 3);

      assert.deepEqual(obj.get('sortedPeople'), [jaime, cersei, sansa], 'array is sorted correctly');

      (0, _metal.set)(cersei, 'status', 1);

      assert.deepEqual(obj.get('sortedPeople'), [jaime, cersei, sansa], 'array is sorted correctly');

      sansa.set('status', 1);

      assert.deepEqual(obj.get('sortedPeople'), [jaime, cersei, sansa], 'array is sorted correctly');

      obj.set('sortProps', ['relatedObj.firstName']);

      assert.deepEqual(obj.get('sortedPeople'), [cersei, jaime, sansa], 'array is sorted correctly');
    }

    ['@test if the dependentKey is neither an array nor object, it will return an empty array'](assert) {
      (0, _metal.set)(obj, 'items', null);
      assert.ok((0, _runtime.isArray)(obj.get('sortedItems')), 'returns an empty arrays');

      (0, _metal.set)(obj, 'array', undefined);
      assert.ok((0, _runtime.isArray)(obj.get('sortedItems')), 'returns an empty arrays');

      (0, _metal.set)(obj, 'array', 'not an array');
      assert.ok((0, _runtime.isArray)(obj.get('sortedItems')), 'returns an empty arrays');
    }
  });

  function sortByLnameFname(a, b) {
    let lna = (0, _metal.get)(a, 'lname');
    let lnb = (0, _metal.get)(b, 'lname');

    if (lna !== lnb) {
      return lna > lnb ? 1 : -1;
    }

    return sortByFnameAsc(a, b);
  }

  function sortByFnameAsc(a, b) {
    let fna = (0, _metal.get)(a, 'fname');
    let fnb = (0, _metal.get)(b, 'fname');

    if (fna === fnb) {
      return 0;
    }
    return fna > fnb ? 1 : -1;
  }

  (0, _internalTestHelpers.moduleFor)('sort - sort function', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      obj = _runtime.Object.extend({
        sortedItems: (0, _computed.sort)('items.@each.fname', sortByLnameFname)
      }).create({
        items: (0, _runtime.A)([{ fname: 'Jaime', lname: 'Lannister', age: 34 }, { fname: 'Cersei', lname: 'Lannister', age: 34 }, { fname: 'Robb', lname: 'Stark', age: 16 }, { fname: 'Bran', lname: 'Stark', age: 8 }])
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test sort has correct `this`'](assert) {
      let obj = _runtime.Object.extend({
        sortedItems: (0, _computed.sort)('items.@each.fname', function (a, b) {
          assert.equal(this, obj, 'expected the object to be `this`');
          return this.sortByLastName(a, b);
        }),
        sortByLastName(a, b) {
          return sortByFnameAsc(a, b);
        }
      }).create({
        items: (0, _runtime.A)([{ fname: 'Jaime', lname: 'Lannister', age: 34 }, { fname: 'Cersei', lname: 'Lannister', age: 34 }, { fname: 'Robb', lname: 'Stark', age: 16 }, { fname: 'Bran', lname: 'Stark', age: 8 }])
      });

      obj.get('sortedItems');
    }

    ['@test sort (with function) is readOnly'](assert) {
      assert.throws(function () {
        obj.set('sortedItems', 1);
      }, /Cannot set read-only property "sortedItems" on object:/);
    }

    ['@test arrays are initially sorted'](assert) {
      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'array is initially sorted');
    }

    ['@test default sort order is correct'](assert) {
      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'array is initially sorted');
    }

    ['@test changing the dependent array updates the sorted array'](assert) {
      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

      obj.set('items', [{ fname: 'Roose', lname: 'Bolton' }, { fname: 'Theon', lname: 'Greyjoy' }, { fname: 'Ramsey', lname: 'Bolton' }, { fname: 'Stannis', lname: 'Baratheon' }]);

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Stannis', 'Ramsey', 'Roose', 'Theon'], 'changing dependent array updates sorted array');
    }

    ['@test adding to the dependent array updates the sorted array'](assert) {
      let items = obj.get('items');

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

      items.pushObject({
        fname: 'Tyrion',
        lname: 'Lannister'
      });

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Tyrion', 'Bran', 'Robb'], 'Adding to the dependent array updates the sorted array');
    }

    ['@test removing from the dependent array updates the sorted array'](assert) {
      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

      obj.get('items').popObject();

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Robb'], 'Removing from the dependent array updates the sorted array');
    }

    ['@test distinct items may be sort-equal, although their relative order will not be guaranteed'](assert) {
      // We recreate jaime and "Cersei" here only for test stability: we want
      // their guid-ordering to be deterministic
      let jaimeInDisguise = {
        fname: 'Cersei',
        lname: 'Lannister',
        age: 34
      };

      let jaime = {
        fname: 'Jaime',
        lname: 'Lannister',
        age: 34
      };

      let items = obj.get('items');

      items.replace(0, 1, [jaime]);
      items.replace(1, 1, [jaimeInDisguise]);

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

      (0, _metal.set)(jaimeInDisguise, 'fname', 'Jaime');

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Jaime', 'Jaime', 'Bran', 'Robb'], 'sorted array is updated');

      (0, _metal.set)(jaimeInDisguise, 'fname', 'Cersei');

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'sorted array is updated');
    }

    ['@test guid sort-order fallback with a search proxy is not confused by non-search ObjectProxys'](assert) {
      let tyrion = {
        fname: 'Tyrion',
        lname: 'Lannister'
      };

      let tyrionInDisguise = _runtime.ObjectProxy.create({
        fname: 'Yollo',
        lname: '',
        content: tyrion
      });

      let items = obj.get('items');

      items.pushObject(tyrion);

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Tyrion', 'Bran', 'Robb']);

      items.pushObject(tyrionInDisguise);

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Yollo', 'Cersei', 'Jaime', 'Tyrion', 'Bran', 'Robb']);
    }

    ['@test changing item properties specified via @each triggers a resort of the modified item'](assert) {
      let items = (0, _metal.get)(obj, 'items');

      let tyrionInDisguise = items[1];

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

      (0, _metal.set)(tyrionInDisguise, 'fname', 'Tyrion');

      assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Jaime', 'Tyrion', 'Bran', 'Robb'], 'updating a specified property on an item resorts it');
    }

    ['@test changing item properties not specified via @each does not trigger a resort'](assert) {
      if (!false /* EMBER_METAL_TRACKED_PROPERTIES */) {
          let items = obj.get('items');
          let cersei = items[1];

          assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'precond - array is initially sorted');

          (0, _metal.set)(cersei, 'lname', 'Stark'); // plot twist! (possibly not canon)

          // The array has become unsorted.  If your sort function is sensitive to
          // properties, they *must* be specified as dependent item property keys or
          // we'll be doing binary searches on unsorted arrays.
          assert.deepEqual(obj.get('sortedItems').mapBy('fname'), ['Cersei', 'Jaime', 'Bran', 'Robb'], 'updating an unspecified property on an item does not resort it');
        } else {
        assert.expect(0);
      }
    }
  });

  (0, _internalTestHelpers.moduleFor)('sort - stability', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      obj = _runtime.Object.extend({
        sortProps: ['count', 'name'],
        sortedItems: (0, _computed.sort)('items', 'sortProps')
      }).create({
        items: [{ name: 'A', count: 1, thing: 4 }, { name: 'B', count: 1, thing: 3 }, { name: 'C', count: 1, thing: 2 }, { name: 'D', count: 1, thing: 4 }]
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test sorts correctly as only one property changes'](assert) {
      assert.deepEqual(obj.get('sortedItems').mapBy('name'), ['A', 'B', 'C', 'D'], 'initial');

      (0, _metal.set)(obj.get('items')[3], 'count', 2);

      assert.deepEqual(obj.get('sortedItems').mapBy('name'), ['A', 'B', 'C', 'D'], 'final');
    }
  });

  let klass;
  (0, _internalTestHelpers.moduleFor)('sort - concurrency', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      klass = _runtime.Object.extend({
        sortProps: ['count'],
        sortedItems: (0, _computed.sort)('items', 'sortProps'),
        customSortedItems: (0, _computed.sort)('items.@each.count', (a, b) => a.count - b.count)
      });
      obj = klass.create({
        items: (0, _runtime.A)([{ name: 'A', count: 1, thing: 4, id: 1 }, { name: 'B', count: 2, thing: 3, id: 2 }, { name: 'C', count: 3, thing: 2, id: 3 }, { name: 'D', count: 4, thing: 1, id: 4 }])
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test sorts correctly after mutation to the sort properties'](assert) {
      let sorted = obj.get('sortedItems');
      assert.deepEqual(sorted.mapBy('name'), ['A', 'B', 'C', 'D'], 'initial');

      (0, _metal.set)(obj.get('items')[1], 'count', 5);
      (0, _metal.set)(obj.get('items')[2], 'count', 6);

      assert.deepEqual(obj.get('sortedItems').mapBy('name'), ['A', 'D', 'B', 'C'], 'final');
    }

    ['@test sort correctly after mutation to the sort'](assert) {
      assert.deepEqual(obj.get('customSortedItems').mapBy('name'), ['A', 'B', 'C', 'D'], 'initial');

      (0, _metal.set)(obj.get('items')[1], 'count', 5);
      (0, _metal.set)(obj.get('items')[2], 'count', 6);

      assert.deepEqual(obj.get('customSortedItems').mapBy('name'), ['A', 'D', 'B', 'C'], 'final');

      assert.deepEqual(obj.get('sortedItems').mapBy('name'), ['A', 'D', 'B', 'C'], 'final');
    }

    ['@test sort correctly on multiple instances of the same class'](assert) {
      let obj2 = klass.create({
        items: (0, _runtime.A)([{ name: 'W', count: 23, thing: 4 }, { name: 'X', count: 24, thing: 3 }, { name: 'Y', count: 25, thing: 2 }, { name: 'Z', count: 26, thing: 1 }])
      });

      assert.deepEqual(obj2.get('sortedItems').mapBy('name'), ['W', 'X', 'Y', 'Z'], 'initial');
      assert.deepEqual(obj.get('sortedItems').mapBy('name'), ['A', 'B', 'C', 'D'], 'initial');

      (0, _metal.set)(obj.get('items')[1], 'count', 5);
      (0, _metal.set)(obj.get('items')[2], 'count', 6);
      (0, _metal.set)(obj2.get('items')[1], 'count', 27);
      (0, _metal.set)(obj2.get('items')[2], 'count', 28);

      assert.deepEqual(obj.get('sortedItems').mapBy('name'), ['A', 'D', 'B', 'C'], 'final');
      assert.deepEqual(obj2.get('sortedItems').mapBy('name'), ['W', 'Z', 'X', 'Y'], 'final');

      obj.set('sortProps', ['thing']);

      assert.deepEqual(obj.get('sortedItems').mapBy('name'), ['D', 'C', 'B', 'A'], 'final');

      obj2.notifyPropertyChange('sortedItems'); // invalidate to flush, to get DK refreshed
      obj2.get('sortedItems'); // flush to get updated DK

      obj2.set('items.firstObject.count', 9999);

      assert.deepEqual(obj2.get('sortedItems').mapBy('name'), ['Z', 'X', 'Y', 'W'], 'final');
    }

    ['@test sort correctly when multiple sorts are chained on the same instance of a class'](assert) {
      let obj2 = klass.extend({
        items: (0, _metal.computed)('sibling.sortedItems.[]', function () {
          return this.get('sibling.sortedItems');
        }),
        asdf: (0, _metal.observer)('sibling.sortedItems.[]', function () {
          this.get('sibling.sortedItems');
        })
      }).create({
        sibling: obj
      });

      /*
                                             ┌───────────┐                              ┌────────────┐
                                             │sortedProps│                              │sortedProps2│
                                             └───────────┘                              └────────────┘
                                                   ▲                                           ▲
                                                   │               ╔═══════════╗               │
                                                   │─ ─ ─ ─ ─ ─ ─ ▶║ CP (sort) ║◀─ ─ ─ ─ ─ ─ ─ ┤
                                                   │               ╚═══════════╝               │
                                                   │                                           │
      ┌───────────┐                            ┏━━━━━━━━━━━┓                              ┏━━━━━━━━━━━━┓
      │           │   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    ┃           ┃    ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─     ┃            ┃
      │   items   │◀──  items.@each.count  │◀──┃sortedItems┃◀───  items.@each.count  │◀───┃sortedItems2┃
      │           │   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    ┃           ┃    └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─     ┃            ┃
      └───────────┘                            ┗━━━━━━━━━━━┛                              ┗━━━━━━━━━━━━┛
      */

      assert.deepEqual(obj.get('sortedItems').mapBy('name'), ['A', 'B', 'C', 'D'], 'obj.sortedItems.name should be sorted alpha');
      assert.deepEqual(obj2.get('sortedItems').mapBy('name'), ['A', 'B', 'C', 'D'], 'obj2.sortedItems.name should be sorted alpha');

      (0, _metal.set)(obj.get('items')[1], 'count', 5);
      (0, _metal.set)(obj.get('items')[2], 'count', 6);

      assert.deepEqual(obj.get('sortedItems').mapBy('name'), ['A', 'D', 'B', 'C'], 'obj.sortedItems.name should now have changed');
      assert.deepEqual(obj2.get('sortedItems').mapBy('name'), ['A', 'D', 'B', 'C'], 'obj2.sortedItems.name should still mirror sortedItems2');

      obj.set('sortProps', ['thing']);
      obj2.set('sortProps', ['id']);

      assert.deepEqual(obj2.get('sortedItems').mapBy('name'), ['A', 'B', 'C', 'D'], 'we now sort obj2 by id, so we expect a b c d');
      assert.deepEqual(obj.get('sortedItems').mapBy('name'), ['D', 'C', 'B', 'A'], 'we now sort obj by thing');
    }
  });

  (0, _internalTestHelpers.moduleFor)('max', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      obj = _runtime.Object.extend({
        max: (0, _computed.max)('items')
      }).create({
        items: (0, _runtime.A)([1, 2, 3])
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test max is readOnly'](assert) {
      assert.throws(function () {
        obj.set('max', 1);
      }, /Cannot set read-only property "max" on object:/);
    }

    ['@test max tracks the max number as objects are added'](assert) {
      assert.equal(obj.get('max'), 3, 'precond - max is initially correct');

      let items = obj.get('items');

      items.pushObject(5);

      assert.equal(obj.get('max'), 5, 'max updates when a larger number is added');

      items.pushObject(2);

      assert.equal(obj.get('max'), 5, 'max does not update when a smaller number is added');
    }

    ['@test max recomputes when the current max is removed'](assert) {
      assert.equal(obj.get('max'), 3, 'precond - max is initially correct');

      obj.get('items').removeObject(2);

      assert.equal(obj.get('max'), 3, 'max is unchanged when a non-max item is removed');

      obj.get('items').removeObject(3);

      assert.equal(obj.get('max'), 1, 'max is recomputed when the current max is removed');
    }
  });

  (0, _internalTestHelpers.moduleFor)('min', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      obj = _runtime.Object.extend({
        min: (0, _computed.min)('items')
      }).create({
        items: (0, _runtime.A)([1, 2, 3])
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test min is readOnly'](assert) {
      assert.throws(function () {
        obj.set('min', 1);
      }, /Cannot set read-only property "min" on object:/);
    }

    ['@test min tracks the min number as objects are added'](assert) {
      assert.equal(obj.get('min'), 1, 'precond - min is initially correct');

      obj.get('items').pushObject(-2);

      assert.equal(obj.get('min'), -2, 'min updates when a smaller number is added');

      obj.get('items').pushObject(2);

      assert.equal(obj.get('min'), -2, 'min does not update when a larger number is added');
    }

    ['@test min recomputes when the current min is removed'](assert) {
      let items = obj.get('items');

      assert.equal(obj.get('min'), 1, 'precond - min is initially correct');

      items.removeObject(2);

      assert.equal(obj.get('min'), 1, 'min is unchanged when a non-min item is removed');

      items.removeObject(1);

      assert.equal(obj.get('min'), 3, 'min is recomputed when the current min is removed');
    }
  });

  (0, _internalTestHelpers.moduleFor)('Ember.arrayComputed - mixed sugar', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      obj = _runtime.Object.extend({
        lannisters: (0, _computed.filterBy)('items', 'lname', 'Lannister'),
        lannisterSorting: (0, _runtime.A)(['fname']),
        sortedLannisters: (0, _computed.sort)('lannisters', 'lannisterSorting'),

        starks: (0, _computed.filterBy)('items', 'lname', 'Stark'),
        starkAges: (0, _computed.mapBy)('starks', 'age'),
        oldestStarkAge: (0, _computed.max)('starkAges')
      }).create({
        items: (0, _runtime.A)([{ fname: 'Jaime', lname: 'Lannister', age: 34 }, { fname: 'Cersei', lname: 'Lannister', age: 34 }, { fname: 'Robb', lname: 'Stark', age: 16 }, { fname: 'Bran', lname: 'Stark', age: 8 }])
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test filtering and sorting can be combined'](assert) {
      let items = obj.get('items');

      assert.deepEqual(obj.get('sortedLannisters').mapBy('fname'), ['Cersei', 'Jaime'], 'precond - array is initially filtered and sorted');

      items.pushObject({ fname: 'Tywin', lname: 'Lannister' });
      items.pushObject({ fname: 'Lyanna', lname: 'Stark' });
      items.pushObject({ fname: 'Gerion', lname: 'Lannister' });

      assert.deepEqual(obj.get('sortedLannisters').mapBy('fname'), ['Cersei', 'Gerion', 'Jaime', 'Tywin'], 'updates propagate to array');
    }

    ['@test filtering, sorting and reduce (max) can be combined'](assert) {
      let items = obj.get('items');

      assert.equal(16, obj.get('oldestStarkAge'), 'precond - end of chain is initially correct');

      items.pushObject({ fname: 'Rickon', lname: 'Stark', age: 5 });

      assert.equal(16, obj.get('oldestStarkAge'), 'chain is updated correctly');

      items.pushObject({ fname: 'Eddard', lname: 'Stark', age: 35 });

      assert.equal(35, obj.get('oldestStarkAge'), 'chain is updated correctly');
    }
  });

  function todo(name, priority) {
    return _runtime.Object.create({ name: name, priority: priority });
  }

  function priorityComparator(todoA, todoB) {
    let pa = parseInt((0, _metal.get)(todoA, 'priority'), 10);
    let pb = parseInt((0, _metal.get)(todoB, 'priority'), 10);

    return pa - pb;
  }

  function evenPriorities(todo) {
    let p = parseInt((0, _metal.get)(todo, 'priority'), 10);

    return p % 2 === 0;
  }

  (0, _internalTestHelpers.moduleFor)('Ember.arrayComputed - chains', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      obj = _runtime.Object.extend({
        sorted: (0, _computed.sort)('todos.@each.priority', priorityComparator),
        filtered: (0, _computed.filter)('sorted.@each.priority', evenPriorities)
      }).create({
        todos: (0, _runtime.A)([todo('E', 4), todo('D', 3), todo('C', 2), todo('B', 1), todo('A', 0)])
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test it can filter and sort when both depend on the same item property'](assert) {
      assert.deepEqual(obj.get('todos').mapBy('name'), ['E', 'D', 'C', 'B', 'A'], 'precond - todos initially correct');
      assert.deepEqual(obj.get('sorted').mapBy('name'), ['A', 'B', 'C', 'D', 'E'], 'precond - sorted initially correct');
      assert.deepEqual(obj.get('filtered').mapBy('name'), ['A', 'C', 'E'], 'precond - filtered initially correct');

      (0, _metal.set)(obj.get('todos')[1], 'priority', 6);

      assert.deepEqual(obj.get('todos').mapBy('name'), ['E', 'D', 'C', 'B', 'A'], 'precond - todos remain correct');
      assert.deepEqual(obj.get('sorted').mapBy('name'), ['A', 'B', 'C', 'E', 'D'], 'precond - sorted updated correctly');
      assert.deepEqual(obj.get('filtered').mapBy('name'), ['A', 'C', 'E', 'D'], 'filtered updated correctly');
    }
  });

  let userFnCalls;
  (0, _internalTestHelpers.moduleFor)('Chaining array and reduced CPs', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      userFnCalls = 0;
      obj = _runtime.Object.extend({
        mapped: (0, _computed.mapBy)('array', 'v'),
        max: (0, _computed.max)('mapped'),
        maxDidChange: (0, _metal.observer)('max', () => userFnCalls++)
      }).create({
        array: (0, _runtime.A)([{ v: 1 }, { v: 3 }, { v: 2 }, { v: 1 }])
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test it computes interdependent array computed properties'](assert) {
      assert.equal(obj.get('max'), 3, 'sanity - it properly computes the maximum value');

      let calls = 0;

      (0, _metal.addObserver)(obj, 'max', () => calls++);

      obj.get('array').pushObject({ v: 5 });

      assert.equal(obj.get('max'), 5, 'maximum value is updated correctly');
      assert.equal(userFnCalls, 1, 'object defined observers fire');
      assert.equal(calls, 1, 'runtime created observers fire');
    }
  });

  (0, _internalTestHelpers.moduleFor)('sum', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      obj = _runtime.Object.extend({
        total: (0, _computed.sum)('array')
      }).create({
        array: (0, _runtime.A)([1, 2, 3])
      });
    }

    afterEach() {
      (0, _runloop.run)(obj, 'destroy');
    }

    ['@test sum is readOnly'](assert) {
      assert.throws(function () {
        obj.set('total', 1);
      }, /Cannot set read-only property "total" on object:/);
    }

    ['@test sums the values in the dependentKey'](assert) {
      assert.equal(obj.get('total'), 6, 'sums the values');
    }

    ['@test if the dependentKey is neither an array nor object, it will return `0`'](assert) {
      (0, _metal.set)(obj, 'array', null);
      assert.equal((0, _metal.get)(obj, 'total'), 0, 'returns 0');

      (0, _metal.set)(obj, 'array', undefined);
      assert.equal((0, _metal.get)(obj, 'total'), 0, 'returns 0');

      (0, _metal.set)(obj, 'array', 'not an array');
      assert.equal((0, _metal.get)(obj, 'total'), 0, 'returns 0');
    }

    ['@test updates when array is modified'](assert) {
      obj.get('array').pushObject(1);

      assert.equal(obj.get('total'), 7, 'recomputed when elements are added');

      obj.get('array').popObject();

      assert.equal(obj.get('total'), 6, 'recomputes when elements are removed');
    }
  });

  (0, _internalTestHelpers.moduleFor)('collect', class extends _internalTestHelpers.AbstractTestCase {
    ['@test works'](assert) {
      let obj = { one: 'foo', two: 'bar', three: null };
      (0, _metal.defineProperty)(obj, 'all', (0, _computed.collect)('one', 'two', 'three', 'four'));

      assert.deepEqual((0, _metal.get)(obj, 'all'), ['foo', 'bar', null, null], 'have all of them');

      (0, _metal.set)(obj, 'four', true);

      assert.deepEqual((0, _metal.get)(obj, 'all'), ['foo', 'bar', null, true], 'have all of them');

      let a = [];
      (0, _metal.set)(obj, 'one', 0);
      (0, _metal.set)(obj, 'three', a);

      assert.deepEqual((0, _metal.get)(obj, 'all'), [0, 'bar', a, true], 'have all of them');
    }
  });
});
enifed('@ember/polyfills/tests/assign_test', ['@ember/polyfills', 'internal-test-helpers'], function (_polyfills, _internalTestHelpers) {
  'use strict';

  class AssignTests extends _internalTestHelpers.AbstractTestCase {
    ['@test merging objects'](assert) {
      let trgt = { a: 1 };
      let src1 = { b: 2 };
      let src2 = { c: 3 };
      this.assign(trgt, src1, src2);

      assert.deepEqual(trgt, { a: 1, b: 2, c: 3 }, 'assign copies values from one or more source objects to a target object');
      assert.deepEqual(src1, { b: 2 }, 'assign does not change source object 1');
      assert.deepEqual(src2, { c: 3 }, 'assign does not change source object 2');
    }

    ['@test merging objects with same property'](assert) {
      let trgt = { a: 1, b: 1 };
      let src1 = { a: 2, b: 2 };
      let src2 = { a: 3 };
      this.assign(trgt, src1, src2);

      assert.deepEqual(trgt, { a: 3, b: 2 }, 'properties are overwritten by other objects that have the same properties later in the parameters order');
    }

    ['@test null'](assert) {
      let trgt = { a: 1 };
      this.assign(trgt, null);

      assert.deepEqual(trgt, { a: 1 }, 'null as a source parameter is ignored');
    }

    ['@test undefined'](assert) {
      let trgt = { a: 1 };
      this.assign(trgt, null);

      assert.deepEqual(trgt, { a: 1 }, 'undefined as a source parameter is ignored');
    }
  }

  (0, _internalTestHelpers.moduleFor)('Ember.assign (polyfill)', class extends AssignTests {
    assign() {
      return (0, _polyfills.assignPolyfill)(...arguments);
    }
  });

  (0, _internalTestHelpers.moduleFor)('Ember.assign (maybe not-polyfill ;) )', class extends AssignTests {
    assign() {
      return (0, _polyfills.assign)(...arguments);
    }
  });
});
enifed('@ember/polyfills/tests/merge_test', ['@ember/polyfills', 'internal-test-helpers'], function (_polyfills, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Ember.merge', class extends _internalTestHelpers.AbstractTestCase {
    ['@test merging objects'](assert) {
      let src1 = { a: 1 };
      let src2 = { b: 2 };
      expectDeprecation(() => {
        (0, _polyfills.merge)(src1, src2);
      }, 'Use of `merge` has been deprecated. Please use `assign` instead.');

      assert.deepEqual(src1, { a: 1, b: 2 }, 'merge copies values from second source object to first object');
    }
  });
});
enifed('@ember/runloop/tests/debounce_test', ['@ember/runloop', 'internal-test-helpers'], function (_runloop, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('debounce', class extends _internalTestHelpers.AbstractTestCase {
    ['@test debounce - with target, with method, without args'](assert) {
      let done = assert.async();

      let calledWith = [];
      let target = {
        someFunc(...args) {
          calledWith.push(args);
        }
      };

      (0, _runloop.debounce)(target, target.someFunc, 10);
      (0, _runloop.debounce)(target, target.someFunc, 10);
      (0, _runloop.debounce)(target, target.someFunc, 10);

      setTimeout(() => {
        assert.deepEqual(calledWith, [[]], 'someFunc called once with correct arguments');
        done();
      }, 20);
    }

    ['@test debounce - with target, with method name, without args'](assert) {
      let done = assert.async();

      let calledWith = [];
      let target = {
        someFunc(...args) {
          calledWith.push(args);
        }
      };

      (0, _runloop.debounce)(target, 'someFunc', 10);
      (0, _runloop.debounce)(target, 'someFunc', 10);
      (0, _runloop.debounce)(target, 'someFunc', 10);

      setTimeout(() => {
        assert.deepEqual(calledWith, [[]], 'someFunc called once with correct arguments');
        done();
      }, 20);
    }

    ['@test debounce - without target, without args'](assert) {
      let done = assert.async();

      let calledWith = [];
      function someFunc(...args) {
        calledWith.push(args);
      }

      (0, _runloop.debounce)(someFunc, 10);
      (0, _runloop.debounce)(someFunc, 10);
      (0, _runloop.debounce)(someFunc, 10);

      setTimeout(() => {
        assert.deepEqual(calledWith, [[]], 'someFunc called once with correct arguments');
        done();
      }, 20);
    }

    ['@test debounce - without target, with args'](assert) {
      let done = assert.async();

      let calledWith = [];
      function someFunc(...args) {
        calledWith.push(args);
      }

      (0, _runloop.debounce)(someFunc, { isFoo: true }, 10);
      (0, _runloop.debounce)(someFunc, { isBar: true }, 10);
      (0, _runloop.debounce)(someFunc, { isBaz: true }, 10);

      setTimeout(() => {
        assert.deepEqual(calledWith, [[{ isBaz: true }]], 'someFunc called once with correct arguments');
        done();
      }, 20);
    }
  });
});
enifed('@ember/runloop/tests/later_test', ['internal-test-helpers', '@ember/polyfills', '@ember/runloop'], function (_internalTestHelpers, _polyfills, _runloop) {
  'use strict';

  const originalSetTimeout = window.setTimeout;
  const originalDateValueOf = Date.prototype.valueOf;
  const originalPlatform = _runloop.backburner._platform;

  function wait(callback, maxWaitCount = 100) {
    originalSetTimeout(() => {
      if (maxWaitCount > 0 && ((0, _runloop.hasScheduledTimers)() || (0, _runloop.getCurrentRunLoop)())) {
        wait(callback, maxWaitCount - 1);

        return;
      }

      callback();
    }, 10);
  }

  // Synchronous "sleep". This simulates work being done
  // after later was called but before the run loop
  // has flushed. In previous versions, this would have
  // caused the later callback to have run from
  // within the run loop flush, since by the time the
  // run loop has to flush, it would have considered
  // the timer already expired.
  function pauseUntil(time) {
    while (+new Date() < time) {
      /* do nothing - sleeping */
    }
  }

  (0, _internalTestHelpers.moduleFor)('run.later', class extends _internalTestHelpers.AbstractTestCase {
    teardown() {
      _runloop.backburner._platform = originalPlatform;
      window.setTimeout = originalSetTimeout;
      Date.prototype.valueOf = originalDateValueOf;
    }

    ['@test should invoke after specified period of time - function only'](assert) {
      let done = assert.async();
      let invoked = false;

      (0, _runloop.run)(() => {
        (0, _runloop.later)(() => invoked = true, 100);
      });

      wait(() => {
        assert.equal(invoked, true, 'should have invoked later item');
        done();
      });
    }

    ['@test should invoke after specified period of time - target/method'](assert) {
      let done = assert.async();
      let obj = { invoked: false };

      (0, _runloop.run)(() => {
        (0, _runloop.later)(obj, function () {
          this.invoked = true;
        }, 100);
      });

      wait(() => {
        assert.equal(obj.invoked, true, 'should have invoked later item');
        done();
      });
    }

    ['@test should invoke after specified period of time - target/method/args'](assert) {
      let done = assert.async();
      let obj = { invoked: 0 };

      (0, _runloop.run)(() => {
        (0, _runloop.later)(obj, function (amt) {
          this.invoked += amt;
        }, 10, 100);
      });

      wait(() => {
        assert.equal(obj.invoked, 10, 'should have invoked later item');
        done();
      });
    }

    ['@test should always invoke within a separate runloop'](assert) {
      let done = assert.async();
      let obj = { invoked: 0 };
      let firstRunLoop, secondRunLoop;

      (0, _runloop.run)(() => {
        firstRunLoop = (0, _runloop.getCurrentRunLoop)();

        (0, _runloop.later)(obj, function (amt) {
          this.invoked += amt;
          secondRunLoop = (0, _runloop.getCurrentRunLoop)();
        }, 10, 1);

        pauseUntil(+new Date() + 100);
      });

      assert.ok(firstRunLoop, 'first run loop captured');
      assert.ok(!(0, _runloop.getCurrentRunLoop)(), "shouldn't be in a run loop after flush");
      assert.equal(obj.invoked, 0, "shouldn't have invoked later item yet");

      wait(() => {
        assert.equal(obj.invoked, 10, 'should have invoked later item');
        assert.ok(secondRunLoop, 'second run loop took place');
        assert.ok(secondRunLoop !== firstRunLoop, 'two different run loops took place');
        done();
      });
    }

    // Our current implementation doesn't allow us to correctly enforce this ordering.
    // We should probably implement a queue to provide this guarantee.
    // See https://github.com/emberjs/ember.js/issues/3526 for more information.

    // asyncTest('callback order', function() {
    //   let array = [];
    //   function fn(val) { array.push(val); }

    //   run(function() {
    //     later(this, fn, 4, 5);
    //     later(this, fn, 1, 1);
    //     later(this, fn, 5, 10);
    //     later(this, fn, 2, 3);
    //     later(this, fn, 3, 3);
    //   });

    //   deepEqual(array, []);

    //   wait(function() {
    //     QUnit.start();
    //     deepEqual(array, [1,2,3,4,5], 'callbacks were called in expected order');
    //   });
    // });

    // Out current implementation doesn't allow us to properly enforce what is tested here.
    // We should probably fix it, but it's not technically a bug right now.
    // See https://github.com/emberjs/ember.js/issues/3522 for more information.

    // asyncTest('callbacks coalesce into same run loop if expiring at the same time', function() {
    //   let array = [];
    //   function fn(val) { array.push(getCurrentRunLoop()); }

    //   run(function() {

    //     // Force +new Date to return the same result while scheduling
    //     // later timers. Otherwise: non-determinism!
    //     let now = +new Date();
    //     Date.prototype.valueOf = function() { return now; };

    //     later(this, fn, 10);
    //     later(this, fn, 200);
    //     later(this, fn, 200);

    //     Date.prototype.valueOf = originalDateValueOf;
    //   });

    //   deepEqual(array, []);

    //   wait(function() {
    //     QUnit.start();
    //     equal(array.length, 3, 'all callbacks called');
    //     ok(array[0] !== array[1], 'first two callbacks have different run loops');
    //     ok(array[0], 'first runloop present');
    //     ok(array[1], 'second runloop present');
    //     equal(array[1], array[2], 'last two callbacks got the same run loop');
    //   });
    // });

    ['@test inception calls to later should run callbacks in separate run loops'](assert) {
      let done = assert.async();
      let runLoop, finished;

      (0, _runloop.run)(() => {
        runLoop = (0, _runloop.getCurrentRunLoop)();
        assert.ok(runLoop);

        (0, _runloop.later)(() => {
          assert.ok((0, _runloop.getCurrentRunLoop)() && (0, _runloop.getCurrentRunLoop)() !== runLoop, 'first later callback has own run loop');
          runLoop = (0, _runloop.getCurrentRunLoop)();

          (0, _runloop.later)(() => {
            assert.ok((0, _runloop.getCurrentRunLoop)() && (0, _runloop.getCurrentRunLoop)() !== runLoop, 'second later callback has own run loop');
            finished = true;
          }, 40);
        }, 40);
      });

      wait(() => {
        assert.ok(finished, 'all .later callbacks run');
        done();
      });
    }

    ['@test setTimeout should never run with a negative wait'](assert) {
      let done = assert.async();
      // Rationale: The old run loop code was susceptible to an occasional
      // bug where invokeLaterTimers would be scheduled with a setTimeout
      // with a negative wait. Modern browsers normalize this to 0, but
      // older browsers (IE <= 8) break with a negative wait, which
      // happens when an expired timer callback takes a while to run,
      // which is what we simulate here.
      let newSetTimeoutUsed;
      _runloop.backburner._platform = (0, _polyfills.assign)({}, originalPlatform, {
        setTimeout() {
          let wait = arguments[arguments.length - 1];
          newSetTimeoutUsed = true;
          assert.ok(!isNaN(wait) && wait >= 0, 'wait is a non-negative number');

          return originalPlatform.setTimeout.apply(originalPlatform, arguments);
        }
      });

      let count = 0;
      (0, _runloop.run)(() => {
        (0, _runloop.later)(() => {
          count++;

          // This will get run first. Waste some time.
          // This is intended to break invokeLaterTimers code by taking a
          // long enough time that other timers should technically expire. It's
          // fine that they're not called in this run loop; just need to
          // make sure that invokeLaterTimers doesn't end up scheduling
          // a negative setTimeout.
          pauseUntil(+new Date() + 60);
        }, 1);

        (0, _runloop.later)(() => {
          assert.equal(count, 1, 'callbacks called in order');
        }, 50);
      });

      wait(() => {
        assert.ok(newSetTimeoutUsed, 'stub setTimeout was used');
        done();
      });
    }
  });
});
enifed('@ember/runloop/tests/next_test', ['@ember/runloop', 'internal-test-helpers'], function (_runloop, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('run.next', class extends _internalTestHelpers.AbstractTestCase {
    ['@test should invoke immediately on next timeout'](assert) {
      let done = assert.async();
      let invoked = false;

      (0, _runloop.run)(() => (0, _runloop.next)(() => invoked = true));

      assert.equal(invoked, false, 'should not have invoked yet');

      setTimeout(() => {
        assert.equal(invoked, true, 'should have invoked later item');
        done();
      }, 20);
    }

    ['@test callback should be called from within separate loop'](assert) {
      let done = assert.async();
      let firstRunLoop, secondRunLoop;
      (0, _runloop.run)(() => {
        firstRunLoop = (0, _runloop.getCurrentRunLoop)();
        (0, _runloop.next)(() => secondRunLoop = (0, _runloop.getCurrentRunLoop)());
      });

      setTimeout(() => {
        assert.ok(secondRunLoop, 'callback was called from within run loop');
        assert.ok(firstRunLoop && secondRunLoop !== firstRunLoop, 'two separate run loops were invoked');
        done();
      }, 20);
    }

    ['@test multiple calls to next share coalesce callbacks into same run loop'](assert) {
      let done = assert.async();
      let secondRunLoop, thirdRunLoop;
      (0, _runloop.run)(() => {
        (0, _runloop.next)(() => secondRunLoop = (0, _runloop.getCurrentRunLoop)());
        (0, _runloop.next)(() => thirdRunLoop = (0, _runloop.getCurrentRunLoop)());
      });

      setTimeout(() => {
        assert.ok(secondRunLoop && secondRunLoop === thirdRunLoop, 'callbacks coalesced into same run loop');
        done();
      }, 20);
    }
  });
});
enifed('@ember/runloop/tests/once_test', ['@ember/runloop', 'internal-test-helpers'], function (_runloop, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('system/run_loop/once_test', class extends _internalTestHelpers.AbstractTestCase {
    ['@test calling invokeOnce more than once invokes only once'](assert) {
      let count = 0;
      (0, _runloop.run)(() => {
        function F() {
          count++;
        }
        (0, _runloop.once)(F);
        (0, _runloop.once)(F);
        (0, _runloop.once)(F);
      });

      assert.equal(count, 1, 'should have invoked once');
    }

    ['@test should differentiate based on target'](assert) {
      let A = { count: 0 };
      let B = { count: 0 };
      (0, _runloop.run)(() => {
        function F() {
          this.count++;
        }
        (0, _runloop.once)(A, F);
        (0, _runloop.once)(B, F);
        (0, _runloop.once)(A, F);
        (0, _runloop.once)(B, F);
      });

      assert.equal(A.count, 1, 'should have invoked once on A');
      assert.equal(B.count, 1, 'should have invoked once on B');
    }

    ['@test should ignore other arguments - replacing previous ones'](assert) {
      let A = { count: 0 };
      let B = { count: 0 };

      (0, _runloop.run)(() => {
        function F(amt) {
          this.count += amt;
        }
        (0, _runloop.once)(A, F, 10);
        (0, _runloop.once)(B, F, 20);
        (0, _runloop.once)(A, F, 30);
        (0, _runloop.once)(B, F, 40);
      });

      assert.equal(A.count, 30, 'should have invoked once on A');
      assert.equal(B.count, 40, 'should have invoked once on B');
    }

    ['@test should be inside of a runloop when running'](assert) {
      (0, _runloop.run)(() => {
        (0, _runloop.once)(() => assert.ok(!!(0, _runloop.getCurrentRunLoop)(), 'should have a runloop'));
      });
    }
  });
});
enifed('@ember/runloop/tests/onerror_test', ['@ember/runloop', '@ember/-internals/error-handling', '@ember/debug', 'internal-test-helpers'], function (_runloop, _errorHandling, _debug, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('system/run_loop/onerror_test', class extends _internalTestHelpers.AbstractTestCase {
    ['@test With Ember.onerror undefined, errors in run are thrown'](assert) {
      let thrown = new Error('Boom!');
      let original = (0, _errorHandling.getOnerror)();

      let caught;
      (0, _errorHandling.setOnerror)(undefined);
      try {
        (0, _runloop.run)(() => {
          throw thrown;
        });
      } catch (error) {
        caught = error;
      } finally {
        (0, _errorHandling.setOnerror)(original);
      }

      assert.deepEqual(caught, thrown);
    }

    ['@test With Ember.onerror set, errors in run are caught'](assert) {
      let thrown = new Error('Boom!');
      let original = (0, _errorHandling.getOnerror)();
      let originalDispatchOverride = (0, _errorHandling.getDispatchOverride)();
      let originalIsTesting = (0, _debug.isTesting)();

      let caught;
      (0, _errorHandling.setOnerror)(error => {
        caught = error;
      });
      (0, _errorHandling.setDispatchOverride)(null);
      (0, _debug.setTesting)(false);

      try {
        (0, _runloop.run)(() => {
          throw thrown;
        });
      } finally {
        (0, _errorHandling.setOnerror)(original);
        (0, _errorHandling.setDispatchOverride)(originalDispatchOverride);
        (0, _debug.setTesting)(originalIsTesting);
      }

      assert.deepEqual(caught, thrown);
    }
  });
});
enifed('@ember/runloop/tests/run_bind_test', ['@ember/runloop', 'internal-test-helpers'], function (_runloop, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('system/run_loop/run_bind_test', class extends _internalTestHelpers.AbstractTestCase {
    ['@test bind builds a run-loop wrapped callback handler'](assert) {
      assert.expect(3);

      let obj = {
        value: 0,
        increment(increment) {
          assert.ok((0, _runloop.getCurrentRunLoop)(), 'expected a run-loop');
          return this.value += increment;
        }
      };

      let proxiedFunction = (0, _runloop.bind)(obj, obj.increment, 1);
      assert.equal(proxiedFunction(), 1);
      assert.equal(obj.value, 1);
    }

    ['@test bind keeps the async callback arguments'](assert) {
      assert.expect(4);

      function asyncCallback(increment, increment2, increment3) {
        assert.ok((0, _runloop.getCurrentRunLoop)(), 'expected a run-loop');
        assert.equal(increment, 1);
        assert.equal(increment2, 2);
        assert.equal(increment3, 3);
      }

      function asyncFunction(fn) {
        fn(2, 3);
      }

      asyncFunction((0, _runloop.bind)(asyncCallback, asyncCallback, 1));
    }

    ['@test [GH#16652] bind throws an error if callback is undefined']() {
      let assertBindThrows = (msg, ...args) => {
        expectAssertion(function () {
          (0, _runloop.bind)(...args);
        }, /could not find a suitable method to bind/, msg);
      };
      assertBindThrows('without arguments');
      assertBindThrows('with one arguments that is not a function', 'myMethod');
      assertBindThrows('if second parameter is not a function and not a property in first parameter', Object.create(null), 'myMethod');
    }
  });
});
enifed('@ember/runloop/tests/run_test', ['@ember/runloop', 'internal-test-helpers'], function (_runloop, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('system/run_loop/run_test', class extends _internalTestHelpers.AbstractTestCase {
    ['@test run invokes passed function, returning value'](assert) {
      let obj = {
        foo() {
          return [this.bar, 'FOO'];
        },
        bar: 'BAR',
        checkArgs(arg1, arg2) {
          return [arg1, this.bar, arg2];
        }
      };

      assert.equal((0, _runloop.run)(() => 'FOO'), 'FOO', 'pass function only');
      assert.deepEqual((0, _runloop.run)(obj, obj.foo), ['BAR', 'FOO'], 'pass obj and obj.method');
      assert.deepEqual((0, _runloop.run)(obj, 'foo'), ['BAR', 'FOO'], 'pass obj and "method"');
      assert.deepEqual((0, _runloop.run)(obj, obj.checkArgs, 'hello', 'world'), ['hello', 'BAR', 'world'], 'pass obj, obj.method, and extra arguments');
    }
  });
});
enifed('@ember/runloop/tests/schedule_test', ['@ember/runloop', 'internal-test-helpers'], function (_runloop, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('system/run_loop/schedule_test', class extends _internalTestHelpers.AbstractTestCase {
    ['@test scheduling item in queue should defer until finished'](assert) {
      let cnt = 0;

      (0, _runloop.run)(() => {
        (0, _runloop.schedule)('actions', () => cnt++);
        (0, _runloop.schedule)('actions', () => cnt++);
        assert.equal(cnt, 0, 'should not run action yet');
      });

      assert.equal(cnt, 2, 'should flush actions now');
    }

    ['@test a scheduled item can be canceled'](assert) {
      let hasRan = false;

      (0, _runloop.run)(() => {
        let cancelId = (0, _runloop.schedule)('actions', () => hasRan = true);
        (0, _runloop.cancel)(cancelId);
      });

      assert.notOk(hasRan, 'should not have ran callback run');
    }

    ['@test nested runs should queue each phase independently'](assert) {
      let cnt = 0;

      (0, _runloop.run)(() => {
        (0, _runloop.schedule)('actions', () => cnt++);
        assert.equal(cnt, 0, 'should not run action yet');

        (0, _runloop.run)(() => {
          (0, _runloop.schedule)('actions', () => cnt++);
        });
        assert.equal(cnt, 1, 'should not run action yet');
      });

      assert.equal(cnt, 2, 'should flush actions now');
    }

    ['@test prior queues should be flushed before moving on to next queue'](assert) {
      let order = [];

      (0, _runloop.run)(() => {
        let runLoop = (0, _runloop.getCurrentRunLoop)();
        assert.ok(runLoop, 'run loop present');

        expectDeprecation(() => {
          (0, _runloop.schedule)('sync', () => {
            order.push('sync');
            assert.equal(runLoop, (0, _runloop.getCurrentRunLoop)(), 'same run loop used');
          });
        }, `Scheduling into the 'sync' run loop queue is deprecated.`);

        (0, _runloop.schedule)('actions', () => {
          order.push('actions');
          assert.equal(runLoop, (0, _runloop.getCurrentRunLoop)(), 'same run loop used');

          (0, _runloop.schedule)('actions', () => {
            order.push('actions');
            assert.equal(runLoop, (0, _runloop.getCurrentRunLoop)(), 'same run loop used');
          });

          expectDeprecation(() => {
            (0, _runloop.schedule)('sync', () => {
              order.push('sync');
              assert.equal(runLoop, (0, _runloop.getCurrentRunLoop)(), 'same run loop used');
            });
          }, `Scheduling into the 'sync' run loop queue is deprecated.`);
        });

        (0, _runloop.schedule)('destroy', () => {
          order.push('destroy');
          assert.equal(runLoop, (0, _runloop.getCurrentRunLoop)(), 'same run loop used');
        });
      });

      assert.deepEqual(order, ['sync', 'actions', 'sync', 'actions', 'destroy']);
    }
  });
});
enifed('@ember/runloop/tests/sync_test', ['@ember/runloop', 'internal-test-helpers'], function (_runloop, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('system/run_loop/sync_test', class extends _internalTestHelpers.AbstractTestCase {
    ['@test sync() will immediately flush the sync queue only'](assert) {
      let cnt = 0;

      (0, _runloop.run)(() => {
        function cntup() {
          cnt++;
        }

        function syncfunc() {
          if (++cnt < 5) {
            expectDeprecation(() => {
              (0, _runloop.schedule)('sync', syncfunc);
            }, `Scheduling into the 'sync' run loop queue is deprecated.`);
          }
          (0, _runloop.schedule)('actions', cntup);
        }

        syncfunc();

        assert.equal(cnt, 1, 'should not run action yet');
      });

      assert.equal(cnt, 10, 'should flush actions now too');
    }
  });
});
enifed('@ember/runloop/tests/unwind_test', ['@ember/runloop', '@ember/error', 'internal-test-helpers'], function (_runloop, _error, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('system/run_loop/unwind_test', class extends _internalTestHelpers.AbstractTestCase {
    ['@test RunLoop unwinds despite unhandled exception'](assert) {
      let initialRunLoop = (0, _runloop.getCurrentRunLoop)();

      assert.throws(() => {
        (0, _runloop.run)(() => {
          (0, _runloop.schedule)('actions', function () {
            throw new _error.default('boom!');
          });
        });
      }, Error, 'boom!');

      // The real danger at this point is that calls to autorun will stick
      // tasks into the already-dead runloop, which will never get
      // flushed. I can't easily demonstrate this in a unit test because
      // autorun explicitly doesn't work in test mode. - ef4
      assert.equal((0, _runloop.getCurrentRunLoop)(), initialRunLoop, 'Previous run loop should be cleaned up despite exception');
    }

    ['@test run unwinds despite unhandled exception'](assert) {
      var initialRunLoop = (0, _runloop.getCurrentRunLoop)();

      assert.throws(() => {
        (0, _runloop.run)(function () {
          throw new _error.default('boom!');
        });
      }, _error.default, 'boom!');

      assert.equal((0, _runloop.getCurrentRunLoop)(), initialRunLoop, 'Previous run loop should be cleaned up despite exception');
    }
  });
});
enifed('@ember/string/tests/camelize_test', ['@ember/-internals/environment', '@ember/string', 'internal-test-helpers'], function (_environment, _string, _internalTestHelpers) {
  'use strict';

  function test(assert, given, expected, description) {
    assert.deepEqual((0, _string.camelize)(given), expected, description);
    if (_environment.ENV.EXTEND_PROTOTYPES.String) {
      assert.deepEqual(given.camelize(), expected, description);
    }
  }

  (0, _internalTestHelpers.moduleFor)('EmberStringUtils.camelize', class extends _internalTestHelpers.AbstractTestCase {
    ['@test String.prototype.camelize is not modified without EXTEND_PROTOTYPES'](assert) {
      if (!_environment.ENV.EXTEND_PROTOTYPES.String) {
        assert.ok('undefined' === typeof String.prototype.camelize, 'String.prototype helper disabled');
      } else {
        assert.expect(0);
      }
    }

    ['@test String camelize tests'](assert) {
      test(assert, 'my favorite items', 'myFavoriteItems', 'camelize normal string');
      test(assert, 'I Love Ramen', 'iLoveRamen', 'camelize capitalized string');
      test(assert, 'css-class-name', 'cssClassName', 'camelize dasherized string');
      test(assert, 'action_name', 'actionName', 'camelize underscored string');
      test(assert, 'action.name', 'actionName', 'camelize dot notation string');
      test(assert, 'innerHTML', 'innerHTML', 'does nothing with camelcased string');
      test(assert, 'PrivateDocs/OwnerInvoice', 'privateDocs/ownerInvoice', 'camelize namespaced classified string');
      test(assert, 'private_docs/owner_invoice', 'privateDocs/ownerInvoice', 'camelize namespaced underscored string');
      test(assert, 'private-docs/owner-invoice', 'privateDocs/ownerInvoice', 'camelize namespaced dasherized string');
    }
  });
});
enifed('@ember/string/tests/capitalize_test', ['@ember/-internals/environment', '@ember/string', 'internal-test-helpers'], function (_environment, _string, _internalTestHelpers) {
  'use strict';

  function test(assert, given, expected, description) {
    assert.deepEqual((0, _string.capitalize)(given), expected, description);
    if (_environment.ENV.EXTEND_PROTOTYPES.String) {
      assert.deepEqual(given.capitalize(), expected, description);
    }
  }

  (0, _internalTestHelpers.moduleFor)('EmberStringUtils.capitalize', class extends _internalTestHelpers.AbstractTestCase {
    ['@test String.prototype.capitalize is not modified without EXTEND_PROTOTYPES'](assert) {
      if (!_environment.ENV.EXTEND_PROTOTYPES.String) {
        assert.ok('undefined' === typeof String.prototype.capitalize, 'String.prototype helper disabled');
      } else {
        assert.expect(0);
      }
    }

    ['@test String capitalize tests'](assert) {
      test(assert, 'my favorite items', 'My favorite items', 'capitalize normal string');
      test(assert, 'css-class-name', 'Css-class-name', 'capitalize dasherized string');
      test(assert, 'action_name', 'Action_name', 'capitalize underscored string');
      test(assert, 'innerHTML', 'InnerHTML', 'capitalize camelcased string');
      test(assert, 'Capitalized string', 'Capitalized string', 'does nothing with capitalized string');
      test(assert, 'privateDocs/ownerInvoice', 'PrivateDocs/OwnerInvoice', 'capitalize namespaced camelized string');
      test(assert, 'private_docs/owner_invoice', 'Private_docs/Owner_invoice', 'capitalize namespaced underscored string');
      test(assert, 'private-docs/owner-invoice', 'Private-docs/Owner-invoice', 'capitalize namespaced dasherized string');
      test(assert, 'šabc', 'Šabc', 'capitalize string with accent character');
    }
  });
});
enifed('@ember/string/tests/classify_test', ['@ember/-internals/environment', '@ember/string', 'internal-test-helpers'], function (_environment, _string, _internalTestHelpers) {
  'use strict';

  function test(assert, given, expected, description) {
    assert.deepEqual((0, _string.classify)(given), expected, description);
    if (_environment.ENV.EXTEND_PROTOTYPES.String) {
      assert.deepEqual(given.classify(), expected, description);
    }
  }

  (0, _internalTestHelpers.moduleFor)('EmberStringUtils.classify', class extends _internalTestHelpers.AbstractTestCase {
    ['@test String.prototype.classify is not modified without EXTEND_PROTOTYPES'](assert) {
      if (!_environment.ENV.EXTEND_PROTOTYPES.String) {
        assert.ok('undefined' === typeof String.prototype.classify, 'String.prototype helper disabled');
      } else {
        assert.expect(0);
      }
    }

    ['@test String classify tests'](assert) {
      test(assert, 'my favorite items', 'MyFavoriteItems', 'classify normal string');
      test(assert, 'css-class-name', 'CssClassName', 'classify dasherized string');
      test(assert, 'action_name', 'ActionName', 'classify underscored string');
      test(assert, 'privateDocs/ownerInvoice', 'PrivateDocs/OwnerInvoice', 'classify namespaced camelized string');
      test(assert, 'private_docs/owner_invoice', 'PrivateDocs/OwnerInvoice', 'classify namespaced underscored string');
      test(assert, 'private-docs/owner-invoice', 'PrivateDocs/OwnerInvoice', 'classify namespaced dasherized string');
      test(assert, '-view-registry', '_ViewRegistry', 'classify prefixed dasherized string');
      test(assert, 'components/-text-field', 'Components/_TextField', 'classify namespaced prefixed dasherized string');
      test(assert, '_Foo_Bar', '_FooBar', 'classify underscore-prefixed underscored string');
      test(assert, '_Foo-Bar', '_FooBar', 'classify underscore-prefixed dasherized string');
      test(assert, '_foo/_bar', '_Foo/_Bar', 'classify underscore-prefixed-namespaced underscore-prefixed string');
      test(assert, '-foo/_bar', '_Foo/_Bar', 'classify dash-prefixed-namespaced underscore-prefixed string');
      test(assert, '-foo/-bar', '_Foo/_Bar', 'classify dash-prefixed-namespaced dash-prefixed string');
      test(assert, 'InnerHTML', 'InnerHTML', 'does nothing with classified string');
      test(assert, '_FooBar', '_FooBar', 'does nothing with classified prefixed string');
    }
  });
});
enifed('@ember/string/tests/dasherize_test', ['@ember/-internals/environment', '@ember/string', 'internal-test-helpers'], function (_environment, _string, _internalTestHelpers) {
  'use strict';

  function test(assert, given, expected, description) {
    assert.deepEqual((0, _string.dasherize)(given), expected, description);
    if (_environment.ENV.EXTEND_PROTOTYPES.String) {
      assert.deepEqual(given.dasherize(), expected, description);
    }
  }

  (0, _internalTestHelpers.moduleFor)('EmberStringUtils.dasherize', class extends _internalTestHelpers.AbstractTestCase {
    ['@test String.prototype.dasherize is not modified without EXTEND_PROTOTYPES'](assert) {
      if (!_environment.ENV.EXTEND_PROTOTYPES.String) {
        assert.ok('undefined' === typeof String.prototype.dasherize, 'String.prototype helper disabled');
      } else {
        assert.expect(0);
      }
    }

    ['@test String dasherize tests'](assert) {
      test(assert, 'my favorite items', 'my-favorite-items', 'dasherize normal string');
      test(assert, 'css-class-name', 'css-class-name', 'does nothing with dasherized string');
      test(assert, 'action_name', 'action-name', 'dasherize underscored string');
      test(assert, 'innerHTML', 'inner-html', 'dasherize camelcased string');
      test(assert, 'toString', 'to-string', 'dasherize string that is the property name of Object.prototype');
      test(assert, 'PrivateDocs/OwnerInvoice', 'private-docs/owner-invoice', 'dasherize namespaced classified string');
      test(assert, 'privateDocs/ownerInvoice', 'private-docs/owner-invoice', 'dasherize namespaced camelized string');
      test(assert, 'private_docs/owner_invoice', 'private-docs/owner-invoice', 'dasherize namespaced underscored string');
    }
  });
});
enifed('@ember/string/tests/decamelize_test', ['@ember/-internals/environment', '@ember/string', 'internal-test-helpers'], function (_environment, _string, _internalTestHelpers) {
  'use strict';

  function test(assert, given, expected, description) {
    assert.deepEqual((0, _string.decamelize)(given), expected, description);
    if (_environment.ENV.EXTEND_PROTOTYPES.String) {
      assert.deepEqual(given.decamelize(), expected, description);
    }
  }

  (0, _internalTestHelpers.moduleFor)('EmberStringUtils.decamelize', class extends _internalTestHelpers.AbstractTestCase {
    ['@test String.prototype.decamelize is not modified without EXTEND_PROTOTYPES'](assert) {
      if (!_environment.ENV.EXTEND_PROTOTYPES.String) {
        assert.ok('undefined' === typeof String.prototype.decamelize, 'String.prototype helper disabled');
      } else {
        assert.expect(0);
      }
    }

    ['@test String decamelize tests'](assert) {
      test(assert, 'my favorite items', 'my favorite items', 'does nothing with normal string');
      test(assert, 'css-class-name', 'css-class-name', 'does nothing with dasherized string');
      test(assert, 'action_name', 'action_name', 'does nothing with underscored string');
      test(assert, 'innerHTML', 'inner_html', 'converts a camelized string into all lower case separated by underscores.');
      test(assert, 'size160Url', 'size160_url', 'decamelizes strings with numbers');
      test(assert, 'PrivateDocs/OwnerInvoice', 'private_docs/owner_invoice', 'decamelize namespaced classified string');
      test(assert, 'privateDocs/ownerInvoice', 'private_docs/owner_invoice', 'decamelize namespaced camelized string');
    }
  });
});
enifed('@ember/string/tests/loc_test', ['@ember/-internals/environment', '@ember/string', '@ember/string/lib/string_registry', 'internal-test-helpers'], function (_environment, _string, _string_registry, _internalTestHelpers) {
  'use strict';

  let oldString;

  function test(assert, given, args, expected, description) {
    assert.equal((0, _string.loc)(given, args), expected, description);
    if (_environment.ENV.EXTEND_PROTOTYPES.String) {
      assert.deepEqual(given.loc(...args), expected, description);
    }
  }

  (0, _internalTestHelpers.moduleFor)('EmberStringUtils.loc', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      oldString = (0, _string_registry.getStrings)();
      (0, _string_registry.setStrings)({
        '_Hello World': 'Bonjour le monde',
        '_Hello %@': 'Bonjour %@',
        '_Hello %@ %@': 'Bonjour %@ %@',
        '_Hello %@# %@#': 'Bonjour %@2 %@1'
      });
    }

    afterEach() {
      (0, _string_registry.setStrings)(oldString);
    }

    ['@test String.prototype.loc is not available without EXTEND_PROTOTYPES'](assert) {
      if (!_environment.ENV.EXTEND_PROTOTYPES.String) {
        assert.ok('undefined' === typeof String.prototype.loc, 'String.prototype helper disabled');
      } else {
        assert.expect(0);
      }
    }

    ['@test String loc tests'](assert) {
      test(assert, '_Hello World', [], 'Bonjour le monde', `loc('_Hello World') => 'Bonjour le monde'`);
      test(assert, '_Hello %@ %@', ['John', 'Doe'], 'Bonjour John Doe', `loc('_Hello %@ %@', ['John', 'Doe']) => 'Bonjour John Doe'`);
      test(assert, '_Hello %@# %@#', ['John', 'Doe'], 'Bonjour Doe John', `loc('_Hello %@# %@#', ['John', 'Doe']) => 'Bonjour Doe John'`);
      test(assert, '_Not In Strings', [], '_Not In Strings', `loc('_Not In Strings') => '_Not In Strings'`);
    }

    ['@test works with argument form'](assert) {
      assert.equal((0, _string.loc)('_Hello %@', 'John'), 'Bonjour John');
      assert.equal((0, _string.loc)('_Hello %@ %@', ['John'], 'Doe'), 'Bonjour John Doe');
    }
  });
});
enifed('@ember/string/tests/underscore_test', ['@ember/-internals/environment', '@ember/string', 'internal-test-helpers'], function (_environment, _string, _internalTestHelpers) {
  'use strict';

  function test(assert, given, expected, description) {
    assert.deepEqual((0, _string.underscore)(given), expected, description);
    if (_environment.ENV.EXTEND_PROTOTYPES.String) {
      assert.deepEqual(given.underscore(), expected, description);
    }
  }

  (0, _internalTestHelpers.moduleFor)('EmberStringUtils.underscore', class extends _internalTestHelpers.AbstractTestCase {
    ['@test String.prototype.underscore is not available without EXTEND_PROTOTYPES'](assert) {
      if (!_environment.ENV.EXTEND_PROTOTYPES.String) {
        assert.ok('undefined' === typeof String.prototype.underscore, 'String.prototype helper disabled');
      } else {
        assert.expect(0);
      }
    }

    ['@test String underscore tests'](assert) {
      test(assert, 'my favorite items', 'my_favorite_items', 'with normal string');
      test(assert, 'css-class-name', 'css_class_name', 'with dasherized string');
      test(assert, 'action_name', 'action_name', 'does nothing with underscored string');
      test(assert, 'innerHTML', 'inner_html', 'with camelcased string');
      test(assert, 'PrivateDocs/OwnerInvoice', 'private_docs/owner_invoice', 'underscore namespaced classified string');
      test(assert, 'privateDocs/ownerInvoice', 'private_docs/owner_invoice', 'underscore namespaced camelized string');
      test(assert, 'private-docs/owner-invoice', 'private_docs/owner_invoice', 'underscore namespaced dasherized string');
    }
  });
});
enifed('@ember/string/tests/w_test', ['@ember/-internals/environment', '@ember/string', 'internal-test-helpers'], function (_environment, _string, _internalTestHelpers) {
  'use strict';

  function test(assert, given, expected, description) {
    assert.deepEqual((0, _string.w)(given), expected, description);
    if (_environment.ENV.EXTEND_PROTOTYPES.String) {
      assert.deepEqual(given.w(), expected, description);
    }
  }

  (0, _internalTestHelpers.moduleFor)('EmberStringUtils.w', class extends _internalTestHelpers.AbstractTestCase {
    ['@test String.prototype.w is not available without EXTEND_PROTOTYPES'](assert) {
      if (!_environment.ENV.EXTEND_PROTOTYPES.String) {
        assert.ok('undefined' === typeof String.prototype.w, 'String.prototype helper disabled');
      } else {
        assert.expect(0);
      }
    }

    ['@test String w tests'](assert) {
      test(assert, 'one two three', ['one', 'two', 'three'], `w('one two three') => ['one','two','three']`);
      test(assert, 'one   two  three', ['one', 'two', 'three'], `w('one    two    three') with extra spaces between words => ['one','two','three']`);
      test(assert, 'one\ttwo  three', ['one', 'two', 'three'], `w('one two three') with tabs`);
    }
  });
});
enifed('ember-template-compiler/tests/plugins/assert-if-helper-without-arguments-test', ['ember-template-compiler/index', 'internal-test-helpers'], function (_index, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('ember-template-compiler: assert-if-helper-without-argument', class extends _internalTestHelpers.AbstractTestCase {
    [`@test block if helper expects one argument`]() {
      expectAssertion(() => {
        (0, _index.compile)(`{{#if}}aVal{{/if}}`, {
          moduleName: 'baz/foo-bar'
        });
      }, `#if requires a single argument. ('baz/foo-bar' @ L1:C0) `);

      expectAssertion(() => {
        (0, _index.compile)(`{{#if val1 val2}}aVal{{/if}}`, {
          moduleName: 'baz/foo-bar'
        });
      }, `#if requires a single argument. ('baz/foo-bar' @ L1:C0) `);

      expectAssertion(() => {
        (0, _index.compile)(`{{#if}}aVal{{/if}}`, {
          moduleName: 'baz/foo-bar'
        });
      }, `#if requires a single argument. ('baz/foo-bar' @ L1:C0) `);
    }

    [`@test inline if helper expects between one and three arguments`]() {
      expectAssertion(() => {
        (0, _index.compile)(`{{if}}`, {
          moduleName: 'baz/foo-bar'
        });
      }, `The inline form of the 'if' helper expects two or three arguments. ('baz/foo-bar' @ L1:C0) `);

      (0, _index.compile)(`{{if foo bar baz}}`, {
        moduleName: 'baz/foo-bar'
      });
    }

    ['@test subexpression if helper expects between one and three arguments']() {
      expectAssertion(() => {
        (0, _index.compile)(`{{input foo=(if)}}`, {
          moduleName: 'baz/foo-bar'
        });
      }, `The inline form of the 'if' helper expects two or three arguments. ('baz/foo-bar' @ L1:C12) `);

      (0, _index.compile)(`{{some-thing foo=(if foo bar baz)}}`, {
        moduleName: 'baz/foo-bar'
      });
    }
  });
});
enifed('ember-template-compiler/tests/plugins/assert-input-helper-without-block-test', ['ember-template-compiler/index', 'internal-test-helpers'], function (_index, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('ember-template-compiler: assert-input-helper-without-block', class extends _internalTestHelpers.AbstractTestCase {
    ['@test Using {{#input}}{{/input}} is not valid']() {
      let expectedMessage = `The {{input}} helper cannot be used in block form. ('baz/foo-bar' @ L1:C0) `;

      expectAssertion(() => {
        (0, _index.compile)('{{#input value="123"}}Completely invalid{{/input}}', {
          moduleName: 'baz/foo-bar'
        });
      }, expectedMessage);
    }
  });
});
enifed('ember-template-compiler/tests/plugins/assert-local-variable-shadowing-helper-invocation-test', ['ember-template-compiler/index', 'internal-test-helpers'], function (_index, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('ember-template-compiler: assert-local-variable-shadowing-helper-invocation', class extends _internalTestHelpers.AbstractTestCase {
    [`@test block statements shadowing sub-expression invocations`]() {
      expectAssertion(() => {
        (0, _index.compile)(`
          {{#let foo as |foo|}}
            {{concat (foo)}}
          {{/let}}`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` helper because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L3:C21) `);

      expectAssertion(() => {
        (0, _index.compile)(`
          {{#let foo as |foo|}}
            {{concat (foo bar baz)}}
          {{/let}}`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` helper because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L3:C21) `);

      // Not shadowed

      (0, _index.compile)(`
        {{#let foo as |foo|}}{{/let}}
        {{concat (foo)}}
        {{concat (foo bar baz)}}`, { moduleName: 'baz/foo-bar' });

      // Not invocations

      (0, _index.compile)(`
        {{#let foo as |foo|}}
          {{concat foo}}
        {{/let}}`, { moduleName: 'baz/foo-bar' });

      (0, _index.compile)(`
        {{#let (concat foo) as |concat|}}
          {{input value=concat}}
        {{/let}}`, { moduleName: 'baz/foo-bar' });
    }

    [`@test element nodes shadowing sub-expression invocations`]() {
      expectAssertion(() => {
        (0, _index.compile)(`
          <Foo as |foo|>
            {{concat (foo)}}
          </Foo>`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` helper because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L3:C21) `);

      expectAssertion(() => {
        (0, _index.compile)(`
          <Foo as |foo|>
            {{concat (foo bar baz)}}
          </Foo>`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` helper because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L3:C21) `);

      // Not shadowed

      (0, _index.compile)(`
        <Foo as |foo|></Foo>
        {{concat (foo)}}
        {{concat (foo bar baz)}}`, { moduleName: 'baz/foo-bar' });

      // Not invocations

      (0, _index.compile)(`
        <Foo as |foo|>
          {{concat foo}}
        </Foo>`, { moduleName: 'baz/foo-bar' });

      (0, _index.compile)(`
        <Foo foo={{concat foo}} as |concat|>
          {{input value=concat}}
        </Foo>`, { moduleName: 'baz/foo-bar' });
    }

    [`@test deeply nested sub-expression invocations`]() {
      expectAssertion(() => {
        (0, _index.compile)(`
          {{#let foo as |foo|}}
            <FooBar as |bar|>
              {{#each items as |baz|}}
                {{concat (foo)}}
              {{/each}}
            </FooBar>
          {{/let}}`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` helper because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L5:C25) `);

      expectAssertion(() => {
        (0, _index.compile)(`
          {{#let foo as |foo|}}
            <FooBar as |bar|>
              {{#each items as |baz|}}
                {{concat (foo bar baz)}}
              {{/each}}
            </FooBar>
          {{/let}}`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` helper because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L5:C25) `);

      // Not shadowed

      (0, _index.compile)(`
        {{#let foo as |foo|}}
          <FooBar as |bar|>
            {{#each items as |baz|}}
            {{/each}}
            {{concat (baz)}}
            {{concat (baz bat)}}
          </FooBar>
          {{concat (bar)}}
          {{concat (bar baz bat)}}
        {{/let}}
        {{concat (foo)}}
        {{concat (foo bar baz bat)}}`, { moduleName: 'baz/foo-bar' });

      // Not invocations

      (0, _index.compile)(`
        {{#let foo as |foo|}}
          <FooBar as |bar|>
            {{#each items as |baz|}}
              {{concat foo}}
            {{/each}}
          </FooBar>
        {{/let}}`, { moduleName: 'baz/foo-bar' });

      (0, _index.compile)(`
        {{#let (foo foo) as |foo|}}
          <FooBar bar=(bar bar) as |bar|>
            {{#each (baz baz) as |baz|}}
              {{concat foo bar baz}}
            {{/each}}
          </FooBar>
        {{/let}}`, { moduleName: 'baz/foo-bar' });
    }

    [`@test block statements shadowing attribute sub-expression invocations`]() {
      expectAssertion(() => {
        (0, _index.compile)(`
          {{#let foo as |foo|}}
            <div class={{concat (foo bar baz)}} />
          {{/let}}`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` helper because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L3:C32) `);

      // Not shadowed

      (0, _index.compile)(`
        {{#let foo as |foo|}}{{/let}}
        <div class={{concat (foo)}} />
        <div class={{concat (foo bar baz)}} />`, { moduleName: 'baz/foo-bar' });

      // Not invocations

      (0, _index.compile)(`
        {{#let foo as |foo|}}
          <div class={{concat foo}} />
        {{/let}}`, { moduleName: 'baz/foo-bar' });

      (0, _index.compile)(`
        {{#let (foo foo) as |foo|}}
          <div class={{concat foo}} />
        {{/let}}`, { moduleName: 'baz/foo-bar' });
    }

    [`@test element nodes shadowing attribute sub-expression invocations`]() {
      expectAssertion(() => {
        (0, _index.compile)(`
          <Foo as |foo|>
            <div class={{concat (foo bar baz)}} />
          </Foo>`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` helper because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L3:C32) `);

      // Not shadowed

      (0, _index.compile)(`
        <Foo as |foo|></Foo>
        <div class={{concat (foo)}} />
        <div class={{concat (foo bar baz)}} />`, { moduleName: 'baz/foo-bar' });

      // Not invocations

      (0, _index.compile)(`
        <Foo as |foo|>
          <div class={{concat foo}} />
        </Foo>`, { moduleName: 'baz/foo-bar' });

      (0, _index.compile)(`
        <Foo foo={{foo foo}} as |foo|>
          <div class={{concat foo}} />
        </Foo>`, { moduleName: 'baz/foo-bar' });
    }

    [`@test deeply nested attribute sub-expression invocations`]() {
      expectAssertion(() => {
        (0, _index.compile)(`
          {{#let foo as |foo|}}
            <FooBar as |bar|>
              {{#each items as |baz|}}
                <div class={{concat (foo bar baz)}} />
              {{/each}}
            </FooBar>
          {{/let}}`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` helper because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L5:C36) `);

      // Not shadowed

      (0, _index.compile)(`
        {{#let foo as |foo|}}
          <FooBar as |bar|>
            {{#each items as |baz|}}
            {{/each}}
            <div class={{concat (baz)}} />
            <div class={{concat (baz bat)}} />
          </FooBar>
          <div class={{concat (bar)}} />
          <div class={{concat (bar baz bat)}} />
        {{/let}}
        <div class={{concat (foo)}} />
        <div class={{concat (foo bar baz bat)}} />`, { moduleName: 'baz/foo-bar' });

      // Not invocations

      (0, _index.compile)(`
        {{#let foo as |foo|}}
          <FooBar as |bar|>
            {{#each items as |baz|}}
              <div class={{concat foo}} />
            {{/each}}
          </FooBar>
        {{/let}}`, { moduleName: 'baz/foo-bar' });

      (0, _index.compile)(`
        {{#let (foo foo) as |foo|}}
          <FooBar bar=(bar bar) as |bar|>
            {{#each (baz baz) as |baz|}}
              <div class={{concat foo bar baz}} />
            {{/each}}
          </FooBar>
        {{/let}}`, { moduleName: 'baz/foo-bar' });
    }

    [`@test block statements shadowing attribute mustache invocations`]() {
      expectAssertion(() => {
        (0, _index.compile)(`
          {{#let foo as |foo|}}
            <div class={{foo bar baz}} />
          {{/let}}`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` helper because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L3:C23) `);

      // Not shadowed

      (0, _index.compile)(`
        {{#let foo as |foo|}}{{/let}}
        <div class={{foo}} />
        <div class={{foo bar baz}} />`, { moduleName: 'baz/foo-bar' });

      // Not invocations

      (0, _index.compile)(`
        {{#let foo as |foo|}}
          <div class={{foo}} />
        {{/let}}`, { moduleName: 'baz/foo-bar' });

      (0, _index.compile)(`
        {{#let (concat foo) as |concat|}}
          <div class={{concat}} />
        {{/let}}`, { moduleName: 'baz/foo-bar' });
    }

    [`@test element nodes shadowing attribute mustache invocations`]() {
      expectAssertion(() => {
        (0, _index.compile)(`
          <Foo as |foo|>
            <div class={{foo bar baz}} />
          </Foo>`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` helper because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L3:C23) `);

      // Not shadowed

      (0, _index.compile)(`
        <Foo as |foo|></Foo>
        <div class={{foo}} />
        <div class={{foo bar baz}} />`, { moduleName: 'baz/foo-bar' });

      // Not invocations

      (0, _index.compile)(`
        <Foo as |foo|>
          <div class={{foo}} />
        </Foo>`, { moduleName: 'baz/foo-bar' });

      (0, _index.compile)(`
        <Foo foo={{concat foo}} as |concat|>
          <div class={{concat}} />
        </Foo>`, { moduleName: 'baz/foo-bar' });
    }

    [`@test deeply nested attribute mustache invocations`]() {
      expectAssertion(() => {
        (0, _index.compile)(`
          {{#let foo as |foo|}}
            <FooBar as |bar|>
              {{#each items as |baz|}}
                <div class={{foo bar baz}} />
              {{/each}}
            </FooBar>
          {{/let}}`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` helper because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L5:C27) `);

      // Not shadowed

      (0, _index.compile)(`
        {{#let foo as |foo|}}
          <FooBar as |bar|>
            {{#each items as |baz|}}
            {{/each}}
            <div class={{baz}} />
            <div class={{baz bat}} />
          </FooBar>
          <div class={{bar}} />
          <div class={{bar baz bat}} />
        {{/let}}
        <div class={{foo}} />
        <div class={{foo bar baz bat}} />`, { moduleName: 'baz/foo-bar' });

      // Not invocations

      (0, _index.compile)(`
        {{#let foo as |foo|}}
          <FooBar as |bar|>
            {{#each items as |baz|}}
              <div class={{foo}} />
            {{/each}}
          </FooBar>
        {{/let}}`, { moduleName: 'baz/foo-bar' });

      (0, _index.compile)(`
        {{#let (foo foo) as |foo|}}
          <FooBar bar=(bar bar) as |bar|>
            {{#each (baz baz) as |baz|}}
              <div foo={{foo}} bar={{bar}} baz={{baz}} />
            {{/each}}
          </FooBar>
        {{/let}}`, { moduleName: 'baz/foo-bar' });
    }

    [`@test block statements shadowing mustache invocations`](assert) {
      // These are fine, because they should already be considered contextual
      // component invocations, not helper invocations
      assert.expect(0);

      (0, _index.compile)(`
        {{#let foo as |foo|}}
          {{foo}}
        {{/let}}`, { moduleName: 'baz/foo-bar' });

      (0, _index.compile)(`
        {{#let foo as |foo|}}
          {{foo bar baz}}
        {{/let}}`, { moduleName: 'baz/foo-bar' });
    }

    [`@test element nodes shadowing mustache invocations`](assert) {
      // These are fine, because they should already be considered contextual
      // component invocations, not helper invocations
      assert.expect(0);

      (0, _index.compile)(`
        <Foo as |foo|>
          {{foo}}
        </Foo>`, { moduleName: 'baz/foo-bar' });

      (0, _index.compile)(`
        <Foo as |foo|>
          {{foo bar baz}}
        </Foo>`, { moduleName: 'baz/foo-bar' });
    }

    [`@test deeply nested mustache invocations`](assert) {
      // These are fine, because they should already be considered contextual
      // component invocations, not helper invocations
      assert.expect(0);

      (0, _index.compile)(`
        {{#let foo as |foo|}}
          <FooBar as |bar|>
            {{#each items as |baz|}}
              {{foo}}
            {{/each}}
          </FooBar>
        {{/let}}`, { moduleName: 'baz/foo-bar' });

      (0, _index.compile)(`
        {{#let foo as |foo|}}
          <FooBar as |bar|>
            {{#each items as |baz|}}
              {{foo bar baz}}
            {{/each}}
          </FooBar>
        {{/let}}`, { moduleName: 'baz/foo-bar' });
    }

    [`@test block statements shadowing modifier invocations`]() {
      expectAssertion(() => {
        (0, _index.compile)(`
          {{#let foo as |foo|}}
            <div {{foo}} />
          {{/let}}`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` modifier because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L3:C17) `);

      expectAssertion(() => {
        (0, _index.compile)(`
          {{#let foo as |foo|}}
            <div {{foo bar baz}} />
          {{/let}}`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` modifier because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L3:C17) `);

      // Not shadowed

      (0, _index.compile)(`
        {{#let foo as |foo|}}{{/let}}
        <div {{foo}} />
        <div {{foo bar baz}} />`, { moduleName: 'baz/foo-bar' });
    }

    [`@test element nodes shadowing modifier invocations`]() {
      expectAssertion(() => {
        (0, _index.compile)(`
          <Foo as |foo|>
            <div {{foo}} />
          </Foo>`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` modifier because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L3:C17) `);

      expectAssertion(() => {
        (0, _index.compile)(`
          <Foo as |foo|>
            <div {{foo bar baz}} />
          </Foo>`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` modifier because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L3:C17) `);

      // Not shadowed

      (0, _index.compile)(`
        <Foo as |foo|></Foo>
        <div {{foo}} />
        <div {{foo bar baz}} />`, { moduleName: 'baz/foo-bar' });
    }

    [`@test deeply nested modifier invocations`]() {
      expectAssertion(() => {
        (0, _index.compile)(`
          {{#let foo as |foo|}}
            <FooBar as |bar|>
              {{#each items as |baz|}}
                <div {{foo}} />
              {{/each}}
            </FooBar>
          {{/let}}`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` modifier because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L5:C21) `);

      expectAssertion(() => {
        (0, _index.compile)(`
          {{#let foo as |foo|}}
            <FooBar as |bar|>
              {{#each items as |baz|}}
                <div {{foo bar baz}} />
              {{/each}}
            </FooBar>
          {{/let}}`, { moduleName: 'baz/foo-bar' });
      }, `Cannot invoke the \`foo\` modifier because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict. ('baz/foo-bar' @ L5:C21) `);

      // Not shadowed

      (0, _index.compile)(`
        {{#let foo as |foo|}}
          <FooBar as |bar|>
            {{#each items as |baz|}}
            {{/each}}
            <div {{baz}} />
            <div {{baz bat}} />
          </FooBar>
          <div {{bar}} />
          <div {{bar baz bat}} />
        {{/let}}
        <div {{foo}} />
        <div {{foo bar baz bat}} />`, { moduleName: 'baz/foo-bar' });
    }
  });
});
enifed('ember-template-compiler/tests/plugins/assert-reserved-named-arguments-test', ['ember-template-compiler/index', 'internal-test-helpers'], function (_index, _internalTestHelpers) {
  'use strict';

  if (true /* EMBER_GLIMMER_NAMED_ARGUMENTS */) {
      (0, _internalTestHelpers.moduleFor)('ember-template-compiler: assert-reserved-named-arguments (EMBER_GLIMMER_NAMED_ARGUMENTS) ', class extends _internalTestHelpers.AbstractTestCase {
        [`@test '@arguments' is reserved`]() {
          expectAssertion(() => {
            (0, _index.compile)(`{{@arguments}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@arguments' is reserved. ('baz/foo-bar' @ L1:C2) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{#if @arguments}}Yup{{/if}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@arguments' is reserved. ('baz/foo-bar' @ L1:C6) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{input type=(if @arguments "bar" "baz")}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@arguments' is reserved. ('baz/foo-bar' @ L1:C17) `);
        }

        [`@test '@args' is reserved`]() {
          expectAssertion(() => {
            (0, _index.compile)(`{{@args}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@args' is reserved. ('baz/foo-bar' @ L1:C2) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{#if @args}}Yup{{/if}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@args' is reserved. ('baz/foo-bar' @ L1:C6) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{input type=(if @args "bar" "baz")}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@args' is reserved. ('baz/foo-bar' @ L1:C17) `);
        }

        [`@test '@block' is reserved`]() {
          expectAssertion(() => {
            (0, _index.compile)(`{{@block}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@block' is reserved. ('baz/foo-bar' @ L1:C2) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{#if @block}}Yup{{/if}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@block' is reserved. ('baz/foo-bar' @ L1:C6) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{input type=(if @block "bar" "baz")}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@block' is reserved. ('baz/foo-bar' @ L1:C17) `);
        }

        [`@test '@else' is reserved`]() {
          expectAssertion(() => {
            (0, _index.compile)(`{{@else}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@else' is reserved. ('baz/foo-bar' @ L1:C2) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{#if @else}}Yup{{/if}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@else' is reserved. ('baz/foo-bar' @ L1:C6) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{input type=(if @else "bar" "baz")}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@else' is reserved. ('baz/foo-bar' @ L1:C17) `);
        }

        // anything else that doesn't start with a lower case letter
        [`@test '@Arguments' is reserved`]() {
          expectAssertion(() => {
            (0, _index.compile)(`{{@Arguments}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@Arguments' is reserved. ('baz/foo-bar' @ L1:C2) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{#if @Arguments}}Yup{{/if}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@Arguments' is reserved. ('baz/foo-bar' @ L1:C6) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{input type=(if @Arguments "bar" "baz")}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@Arguments' is reserved. ('baz/foo-bar' @ L1:C17) `);
        }

        [`@test '@Args' is reserved`]() {
          expectAssertion(() => {
            (0, _index.compile)(`{{@Args}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@Args' is reserved. ('baz/foo-bar' @ L1:C2) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{#if @Args}}Yup{{/if}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@Args' is reserved. ('baz/foo-bar' @ L1:C6) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{input type=(if @Args "bar" "baz")}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@Args' is reserved. ('baz/foo-bar' @ L1:C17) `);
        }

        [`@test '@FOO' is reserved`]() {
          expectAssertion(() => {
            (0, _index.compile)(`{{@FOO}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@FOO' is reserved. ('baz/foo-bar' @ L1:C2) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{#if @FOO}}Yup{{/if}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@FOO' is reserved. ('baz/foo-bar' @ L1:C6) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{input type=(if @FOO "bar" "baz")}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@FOO' is reserved. ('baz/foo-bar' @ L1:C17) `);
        }

        [`@test '@Foo' is reserved`]() {
          expectAssertion(() => {
            (0, _index.compile)(`{{@Foo}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@Foo' is reserved. ('baz/foo-bar' @ L1:C2) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{#if @Foo}}Yup{{/if}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@Foo' is reserved. ('baz/foo-bar' @ L1:C6) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{input type=(if @Foo "bar" "baz")}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@Foo' is reserved. ('baz/foo-bar' @ L1:C17) `);
        }

        [`@test '@.' is reserved`]() {
          expectAssertion(() => {
            (0, _index.compile)(`{{@.}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@.' is reserved. ('baz/foo-bar' @ L1:C2) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{#if @.}}Yup{{/if}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@.' is reserved. ('baz/foo-bar' @ L1:C6) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{input type=(if @. "bar" "baz")}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@.' is reserved. ('baz/foo-bar' @ L1:C17) `);
        }

        [`@test '@_' is reserved`]() {
          expectAssertion(() => {
            (0, _index.compile)(`{{@_}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@_' is reserved. ('baz/foo-bar' @ L1:C2) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{#if @_}}Yup{{/if}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@_' is reserved. ('baz/foo-bar' @ L1:C6) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{input type=(if @_ "bar" "baz")}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@_' is reserved. ('baz/foo-bar' @ L1:C17) `);
        }

        [`@test '@-' is reserved`]() {
          expectAssertion(() => {
            (0, _index.compile)(`{{@-}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@-' is reserved. ('baz/foo-bar' @ L1:C2) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{#if @-}}Yup{{/if}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@-' is reserved. ('baz/foo-bar' @ L1:C6) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{input type=(if @- "bar" "baz")}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@-' is reserved. ('baz/foo-bar' @ L1:C17) `);
        }

        [`@test '@$' is reserved`]() {
          expectAssertion(() => {
            (0, _index.compile)(`{{@$}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@$' is reserved. ('baz/foo-bar' @ L1:C2) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{#if @$}}Yup{{/if}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@$' is reserved. ('baz/foo-bar' @ L1:C6) `);

          expectAssertion(() => {
            (0, _index.compile)(`{{input type=(if @$ "bar" "baz")}}`, {
              moduleName: 'baz/foo-bar'
            });
          }, `'@$' is reserved. ('baz/foo-bar' @ L1:C17) `);
        }

        [`@test '@' is de facto reserved (parse error)`](assert) {
          assert.throws(() => {
            (0, _index.compile)('{{@}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);

          assert.throws(() => {
            (0, _index.compile)('{{#if @}}Yup{{/if}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);

          assert.throws(() => {
            (0, _index.compile)('{{input type=(if @ "bar" "baz")}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);
        }

        [`@test '@0' is de facto reserved (parse error)`](assert) {
          assert.throws(() => {
            (0, _index.compile)('{{@0}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);

          assert.throws(() => {
            (0, _index.compile)('{{#if @0}}Yup{{/if}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);

          assert.throws(() => {
            (0, _index.compile)('{{input type=(if @0 "bar" "baz")}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);
        }

        [`@test '@1' is de facto reserved (parse error)`](assert) {
          assert.throws(() => {
            (0, _index.compile)('{{@1}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);

          assert.throws(() => {
            (0, _index.compile)('{{#if @1}}Yup{{/if}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);

          assert.throws(() => {
            (0, _index.compile)('{{input type=(if @1 "bar" "baz")}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);
        }

        [`@test '@2' is de facto reserved (parse error)`](assert) {
          assert.throws(() => {
            (0, _index.compile)('{{@2}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);

          assert.throws(() => {
            (0, _index.compile)('{{#if @2}}Yup{{/if}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);

          assert.throws(() => {
            (0, _index.compile)('{{input type=(if @2 "bar" "baz")}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);
        }

        [`@test '@@' is de facto reserved (parse error)`](assert) {
          assert.throws(() => {
            (0, _index.compile)('{{@@}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);

          assert.throws(() => {
            (0, _index.compile)('{{#if @@}}Yup{{/if}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);

          assert.throws(() => {
            (0, _index.compile)('{{input type=(if @@ "bar" "baz")}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);
        }

        [`@test '@=' is de facto reserved (parse error)`](assert) {
          assert.throws(() => {
            (0, _index.compile)('{{@=}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);

          assert.throws(() => {
            (0, _index.compile)('{{#if @=}}Yup{{/if}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);

          assert.throws(() => {
            (0, _index.compile)('{{input type=(if @= "bar" "baz")}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);
        }

        [`@test '@!' is de facto reserved (parse error)`](assert) {
          assert.throws(() => {
            (0, _index.compile)('{{@!}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);

          assert.throws(() => {
            (0, _index.compile)('{{#if @!}}Yup{{/if}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);

          assert.throws(() => {
            (0, _index.compile)('{{input type=(if @! "bar" "baz")}}', {
              moduleName: 'baz/foo-bar'
            });
          }, /Expecting 'ID'/);
        }
      });
    } else {
    (0, _internalTestHelpers.moduleFor)('ember-template-compiler: assert-reserved-named-arguments', class extends _internalTestHelpers.AbstractTestCase {
      ['@test Paths beginning with @ are not valid']() {
        expectAssertion(() => {
          (0, _index.compile)('{{@foo}}', {
            moduleName: 'baz/foo-bar'
          });
        }, `'@foo' is not a valid path. ('baz/foo-bar' @ L1:C2) `);

        expectAssertion(() => {
          (0, _index.compile)('{{#if @foo}}Yup{{/if}}', {
            moduleName: 'baz/foo-bar'
          });
        }, `'@foo' is not a valid path. ('baz/foo-bar' @ L1:C6) `);

        expectAssertion(() => {
          (0, _index.compile)('{{input type=(if @foo "bar" "baz")}}', {
            moduleName: 'baz/foo-bar'
          });
        }, `'@foo' is not a valid path. ('baz/foo-bar' @ L1:C17) `);
      }
    });
  }
});
enifed('ember-template-compiler/tests/plugins/assert-splattribute-expression-test', ['internal-test-helpers', 'ember-template-compiler/index'], function (_internalTestHelpers, _index) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('ember-template-compiler: assert-splattribute-expression', class extends _internalTestHelpers.AbstractTestCase {
    expectedMessage(locInfo) {
      return true /* EMBER_GLIMMER_ANGLE_BRACKET_INVOCATION */ ? `Using "...attributes" can only be used in the element position e.g. <div ...attributes />. It cannot be used as a path. (${locInfo}) ` : `...attributes is an invalid path (${locInfo}) `;
    }

    '@test ...attributes is in element space'(assert) {
      if (true /* EMBER_GLIMMER_ANGLE_BRACKET_INVOCATION */) {
          assert.expect(0);

          (0, _index.compile)('<div ...attributes>Foo</div>');
        } else {
        expectAssertion(() => {
          (0, _index.compile)('<div ...attributes>Foo</div>');
        }, this.expectedMessage('L1:C5'));
      }
    }

    '@test {{...attributes}} is not valid'() {
      expectAssertion(() => {
        (0, _index.compile)('<div>{{...attributes}}</div>', {
          moduleName: 'foo-bar'
        });
      }, this.expectedMessage(`'foo-bar' @ L1:C7`));
    }

    '@test {{...attributes}} is not valid path expression'() {
      expectAssertion(() => {
        (0, _index.compile)('<div>{{...attributes}}</div>', {
          moduleName: 'foo-bar'
        });
      }, this.expectedMessage(`'foo-bar' @ L1:C7`));
    }
    '@test {{...attributes}} is not valid modifier'() {
      expectAssertion(() => {
        (0, _index.compile)('<div {{...attributes}}>Wat</div>', {
          moduleName: 'foo-bar'
        });
      }, this.expectedMessage(`'foo-bar' @ L1:C7`));
    }

    '@test {{...attributes}} is not valid attribute'() {
      expectAssertion(() => {
        (0, _index.compile)('<div class={{...attributes}}>Wat</div>', {
          moduleName: 'foo-bar'
        });
      }, this.expectedMessage(`'foo-bar' @ L1:C13`));
    }
  });
});
enifed('ember-template-compiler/tests/plugins/deprecate-send-action-test', ['ember-template-compiler/index', 'internal-test-helpers'], function (_index, _internalTestHelpers) {
  'use strict';

  const EVENTS = ['insert-newline', 'enter', 'escape-press', 'focus-in', 'focus-out', 'key-press', 'key-up', 'key-down'];

  class DeprecateSendActionTest extends _internalTestHelpers.AbstractTestCase {}

  EVENTS.forEach(function (e) {
    DeprecateSendActionTest.prototype[`@test Using \`{{input ${e}="actionName"}}\` provides a deprecation`] = function () {
      let expectedMessage = `Please refactor \`{{input ${e}="foo-bar"}}\` to \`{{input ${e}=(action "foo-bar")}}\. ('baz/foo-bar' @ L1:C0) `;

      expectDeprecation(() => {
        (0, _index.compile)(`{{input ${e}="foo-bar"}}`, { moduleName: 'baz/foo-bar' });
      }, expectedMessage);
    };
  });

  (0, _internalTestHelpers.moduleFor)('ember-template-compiler: deprecate-send-action', DeprecateSendActionTest);
});
enifed('ember-template-compiler/tests/plugins/transform-component-invocation-test', ['ember-template-compiler/index', 'internal-test-helpers'], function (_index, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('ember-template-compiler: transforms component invocation', class extends _internalTestHelpers.AbstractTestCase {
    ['@test Does not throw a compiler error for component invocations'](assert) {
      assert.expect(0);

      ['{{this.modal open}}', '{{this.modal isOpen=true}}', '{{#this.modal}}Woot{{/this.modal}}', '{{@modal open}}', // RFC#311
      '{{@modal isOpen=true}}', // RFC#311
      '{{#@modal}}Woot{{/@modal}}', // RFC#311
      '{{c.modal open}}', '{{c.modal isOpen=true}}', '{{#c.modal}}Woot{{/c.modal}}', '{{#my-component as |c|}}{{c name="Chad"}}{{/my-component}}', // RFC#311
      '{{#my-component as |c|}}{{c "Chad"}}{{/my-component}}', // RFC#311
      '{{#my-component as |c|}}{{#c}}{{/c}}{{/my-component}}', // RFC#311
      '<input disabled={{true}}>', // GH#15740
      '<td colspan={{3}}></td>'].forEach((layout, i) => {
        (0, _index.compile)(layout, { moduleName: `example-${i}` });
      });
    }
  });
});
enifed('ember-template-compiler/tests/plugins/transform-inline-link-to-test', ['ember-template-compiler/index', 'internal-test-helpers'], function (_index, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('ember-template-compiler: inline-link-to', class extends _internalTestHelpers.AbstractTestCase {
    ['@test Can transform an inline {{link-to}} without error'](assert) {
      assert.expect(0);

      (0, _index.compile)(`{{link-to 'foo' 'index'}}`, {
        moduleName: 'foo/bar/baz'
      });
    }
  });
});
enifed('ember-template-compiler/tests/plugins/transform-input-type-syntax-test', ['ember-template-compiler/index', 'internal-test-helpers'], function (_index, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('ember-template-compiler: input type syntax', class extends _internalTestHelpers.AbstractTestCase {
    ['@test Can compile an {{input}} helper that has a sub-expression value as its type'](assert) {
      assert.expect(0);

      (0, _index.compile)(`{{input type=(if true 'password' 'text')}}`);
    }

    ['@test Can compile an {{input}} helper with a string literal type'](assert) {
      assert.expect(0);

      (0, _index.compile)(`{{input type='text'}}`);
    }

    ['@test Can compile an {{input}} helper with a type stored in a var'](assert) {
      assert.expect(0);

      (0, _index.compile)(`{{input type=_type}}`);
    }
  });
});
enifed('ember-template-compiler/tests/system/bootstrap-test', ['@ember/runloop', '@ember/-internals/glimmer', 'ember-template-compiler/lib/system/bootstrap', 'internal-test-helpers'], function (_runloop, _glimmer, _bootstrap, _internalTestHelpers) {
  'use strict';

  let component, fixture;

  function checkTemplate(templateName, assert) {
    (0, _runloop.run)(() => (0, _bootstrap.default)({ context: fixture, hasTemplate: _glimmer.hasTemplate, setTemplate: _glimmer.setTemplate }));

    let template = (0, _glimmer.getTemplate)(templateName);
    let qunitFixture = document.querySelector('#qunit-fixture');

    assert.ok(template, 'template is available on Ember.TEMPLATES');
    assert.notOk(qunitFixture.querySelector('script'), 'script removed');

    let owner = (0, _internalTestHelpers.buildOwner)();
    owner.register('template:-top-level', template);
    owner.register('component:-top-level', _glimmer.Component.extend({
      layoutName: '-top-level',
      firstName: 'Tobias',
      drug: 'teamocil'
    }));

    component = owner.lookup('component:-top-level');
    (0, _internalTestHelpers.runAppend)(component);

    assert.equal(qunitFixture.textContent.trim(), 'Tobias takes teamocil', 'template works');
    (0, _internalTestHelpers.runDestroy)(owner);
  }

  (0, _internalTestHelpers.moduleFor)('ember-templates: bootstrap', class extends _internalTestHelpers.AbstractTestCase {
    constructor() {
      super();

      fixture = document.getElementById('qunit-fixture');
    }

    teardown() {
      (0, _glimmer.setTemplates)({});
      fixture = component = null;
    }

    ['@test template with data-template-name should add a new template to Ember.TEMPLATES'](assert) {
      fixture.innerHTML = '<script type="text/x-handlebars" data-template-name="funkyTemplate">{{firstName}} takes {{drug}}</script>';

      checkTemplate('funkyTemplate', assert);
    }

    ['@test template with id instead of data-template-name should add a new template to Ember.TEMPLATES'](assert) {
      fixture.innerHTML = '<script type="text/x-handlebars" id="funkyTemplate" >{{firstName}} takes {{drug}}</script>';

      checkTemplate('funkyTemplate', assert);
    }

    ['@test template without data-template-name or id should default to application'](assert) {
      fixture.innerHTML = '<script type="text/x-handlebars">{{firstName}} takes {{drug}}</script>';

      checkTemplate('application', assert);
    }

    // Add this test case, only for typeof Handlebars === 'object';
    [`${typeof Handlebars === 'object' ? '@test' : '@skip'} template with type text/x-raw-handlebars should be parsed`](assert) {
      fixture.innerHTML = '<script type="text/x-raw-handlebars" data-template-name="funkyTemplate">{{name}}</script>';

      (0, _runloop.run)(() => (0, _bootstrap.default)({ context: fixture, hasTemplate: _glimmer.hasTemplate, setTemplate: _glimmer.setTemplate }));

      let template = (0, _glimmer.getTemplate)('funkyTemplate');

      assert.ok(template, 'template with name funkyTemplate available');

      // This won't even work with Ember templates
      assert.equal(template({ name: 'Tobias' }).trim(), 'Tobias');
    }

    ['@test duplicated default application templates should throw exception'](assert) {
      fixture.innerHTML = '<script type="text/x-handlebars">first</script><script type="text/x-handlebars">second</script>';

      assert.throws(() => (0, _bootstrap.default)({ context: fixture, hasTemplate: _glimmer.hasTemplate, setTemplate: _glimmer.setTemplate }), /Template named "[^"]+" already exists\./, 'duplicate templates should not be allowed');
    }

    ['@test default default application template and id application template present should throw exception'](assert) {
      fixture.innerHTML = '<script type="text/x-handlebars">first</script><script type="text/x-handlebars" id="application">second</script>';

      assert.throws(() => (0, _bootstrap.default)({ context: fixture, hasTemplate: _glimmer.hasTemplate, setTemplate: _glimmer.setTemplate }), /Template named "[^"]+" already exists\./, 'duplicate templates should not be allowed');
    }

    ['@test default application template and data-template-name application template present should throw exception'](assert) {
      fixture.innerHTML = '<script type="text/x-handlebars">first</script><script type="text/x-handlebars" data-template-name="application">second</script>';

      assert.throws(() => (0, _bootstrap.default)({ context: fixture, hasTemplate: _glimmer.hasTemplate, setTemplate: _glimmer.setTemplate }), /Template named "[^"]+" already exists\./, 'duplicate templates should not be allowed');
    }

    ['@test duplicated template id should throw exception'](assert) {
      fixture.innerHTML = '<script type="text/x-handlebars" id="funkyTemplate">first</script><script type="text/x-handlebars" id="funkyTemplate">second</script>';

      assert.throws(() => (0, _bootstrap.default)({ context: fixture, hasTemplate: _glimmer.hasTemplate, setTemplate: _glimmer.setTemplate }), /Template named "[^"]+" already exists\./, 'duplicate templates should not be allowed');
    }

    ['@test duplicated template data-template-name should throw exception'](assert) {
      fixture.innerHTML = '<script type="text/x-handlebars" data-template-name="funkyTemplate">first</script><script type="text/x-handlebars" data-template-name="funkyTemplate">second</script>';

      assert.throws(() => (0, _bootstrap.default)({ context: fixture, hasTemplate: _glimmer.hasTemplate, setTemplate: _glimmer.setTemplate }), /Template named "[^"]+" already exists\./, 'duplicate templates should not be allowed');
    }
  });
});
enifed('ember-template-compiler/tests/system/compile_options_test', ['ember-template-compiler/index', 'internal-test-helpers'], function (_index, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('ember-template-compiler: default compile options', class extends _internalTestHelpers.AbstractTestCase {
    ['@test default options are a new copy'](assert) {
      assert.notEqual((0, _index.compileOptions)(), (0, _index.compileOptions)());
    }

    ['@test has default AST plugins'](assert) {
      assert.expect(_index.defaultPlugins.length);

      let plugins = (0, _index.compileOptions)().plugins.ast;

      for (let i = 0; i < _index.defaultPlugins.length; i++) {
        let plugin = _index.defaultPlugins[i];
        assert.ok(plugins.indexOf(plugin) > -1, `includes ${plugin}`);
      }
    }
  });

  let customTransformCounter = 0;
  class LegacyCustomTransform {
    constructor(options) {
      customTransformCounter++;
      this.options = options;
      this.syntax = null;
    }

    transform(ast) {
      let walker = new this.syntax.Walker();

      walker.visit(ast, node => {
        if (node.type !== 'ElementNode') {
          return;
        }

        for (var i = 0; i < node.attributes.length; i++) {
          let attribute = node.attributes[i];

          if (attribute.name === 'data-test') {
            node.attributes.splice(i, 1);
          }
        }
      });

      return ast;
    }
  }

  function customTransform() {
    customTransformCounter++;

    return {
      name: 'remove-data-test',

      visitor: {
        ElementNode(node) {
          for (var i = 0; i < node.attributes.length; i++) {
            let attribute = node.attributes[i];

            if (attribute.name === 'data-test') {
              node.attributes.splice(i, 1);
            }
          }
        }
      }
    };
  }

  class CustomPluginsTests extends _internalTestHelpers.RenderingTestCase {
    afterEach() {
      customTransformCounter = 0;
      return super.afterEach();
    }

    ['@test custom plugins can be used']() {
      this.render('<div data-test="foo" data-blah="derp" class="hahaha"></div>');
      this.assertElement(this.firstChild, {
        tagName: 'div',
        attrs: { class: 'hahaha', 'data-blah': 'derp' },
        content: ''
      });
    }

    ['@test wrapped plugins are only invoked once per template'](assert) {
      this.render('<div>{{#if falsey}}nope{{/if}}</div>');
      assert.equal(customTransformCounter, 1, 'transform should only be instantiated once');
    }
  }

  (0, _internalTestHelpers.moduleFor)('ember-template-compiler: registerPlugin with a custom plugins in legacy format', class extends CustomPluginsTests {
    beforeEach() {
      (0, _index.registerPlugin)('ast', LegacyCustomTransform);
    }

    afterEach() {
      (0, _index.unregisterPlugin)('ast', LegacyCustomTransform);
      return super.afterEach();
    }

    ['@test custom registered plugins are deduplicated'](assert) {
      (0, _index.registerPlugin)('ast', LegacyCustomTransform);
      this.registerTemplate('application', '<div data-test="foo" data-blah="derp" class="hahaha"></div>');
      assert.equal(customTransformCounter, 1, 'transform should only be instantiated once');
    }
  });

  (0, _internalTestHelpers.moduleFor)('ember-template-compiler: registerPlugin with a custom plugins', class extends CustomPluginsTests {
    beforeEach() {
      (0, _index.registerPlugin)('ast', customTransform);
    }

    afterEach() {
      (0, _index.unregisterPlugin)('ast', customTransform);
      return super.afterEach();
    }

    ['@test custom registered plugins are deduplicated'](assert) {
      (0, _index.registerPlugin)('ast', customTransform);
      this.registerTemplate('application', '<div data-test="foo" data-blah="derp" class="hahaha"></div>');
      assert.equal(customTransformCounter, 1, 'transform should only be instantiated once');
    }
  });

  (0, _internalTestHelpers.moduleFor)('ember-template-compiler: custom plugins in legacy format passed to compile', class extends _internalTestHelpers.RenderingTestCase {
    // override so that we can provide custom AST plugins to compile
    compile(templateString) {
      return (0, _index.compile)(templateString, {
        plugins: {
          ast: [LegacyCustomTransform]
        }
      });
    }
  });

  (0, _internalTestHelpers.moduleFor)('ember-template-compiler: custom plugins passed to compile', class extends _internalTestHelpers.RenderingTestCase {
    // override so that we can provide custom AST plugins to compile
    compile(templateString) {
      return (0, _index.compile)(templateString, {
        plugins: {
          ast: [customTransform]
        }
      });
    }
  });
});
enifed('ember-template-compiler/tests/system/dasherize-component-name-test', ['ember-template-compiler/lib/system/dasherize-component-name', 'internal-test-helpers'], function (_dasherizeComponentName, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('dasherize-component-name', class extends _internalTestHelpers.AbstractTestCase {
    ['@test names are correctly dasherized'](assert) {
      assert.equal(_dasherizeComponentName.default.get('Foo'), 'foo');
      assert.equal(_dasherizeComponentName.default.get('foo-bar'), 'foo-bar');
      assert.equal(_dasherizeComponentName.default.get('FooBar'), 'foo-bar');
      assert.equal(_dasherizeComponentName.default.get('XBlah'), 'x-blah');
      assert.equal(_dasherizeComponentName.default.get('X-Blah'), 'x-blah');
      assert.equal(_dasherizeComponentName.default.get('Foo::BarBaz'), 'foo::bar-baz');
      assert.equal(_dasherizeComponentName.default.get('Foo::Bar-Baz'), 'foo::bar-baz');
      assert.equal(_dasherizeComponentName.default.get('Foo@BarBaz'), 'foo@bar-baz');
      assert.equal(_dasherizeComponentName.default.get('Foo@Bar-Baz'), 'foo@bar-baz');
    }
  });
});
enifed('ember-testing/tests/acceptance_test', ['internal-test-helpers', '@ember/runloop', 'ember-testing/lib/test', 'ember-testing/lib/adapters/qunit', '@ember/-internals/routing', '@ember/-internals/runtime', '@ember/-internals/views', '@ember/debug'], function (_internalTestHelpers, _runloop, _test, _qunit, _routing, _runtime, _views, _debug) {
  'use strict';

  const originalDebug = (0, _debug.getDebugFunction)('debug');

  var originalConsoleError = console.error; // eslint-disable-line no-console
  let testContext;

  if (!_views.jQueryDisabled) {
    (0, _internalTestHelpers.moduleFor)('ember-testing Acceptance', class extends _internalTestHelpers.AutobootApplicationTestCase {
      constructor() {
        (0, _debug.setDebugFunction)('debug', function () {});
        super();
        this._originalAdapter = _test.default.adapter;

        testContext = this;

        this.runTask(() => {
          this.createApplication();
          this.router.map(function () {
            this.route('posts');
            this.route('comments');

            this.route('abort_transition');

            this.route('redirect');
          });

          this.indexHitCount = 0;
          this.currentRoute = 'index';

          this.add('route:index', _routing.Route.extend({
            model() {
              testContext.indexHitCount += 1;
            }
          }));

          this.add('route:posts', _routing.Route.extend({
            renderTemplate() {
              testContext.currentRoute = 'posts';
              this._super(...arguments);
            }
          }));

          this.addTemplate('posts', `
          <div class="posts-view">
            <a class="dummy-link"></a>
            <div id="comments-link">
              {{#link-to \'comments\'}}Comments{{/link-to}}
            </div>
          </div>
        `);

          this.add('route:comments', _routing.Route.extend({
            renderTemplate() {
              testContext.currentRoute = 'comments';
              this._super(...arguments);
            }
          }));

          this.addTemplate('comments', `<div>{{input type="text"}}</div>`);

          this.add('route:abort_transition', _routing.Route.extend({
            beforeModel(transition) {
              transition.abort();
            }
          }));

          this.add('route:redirect', _routing.Route.extend({
            beforeModel() {
              this.transitionTo('comments');
            }
          }));

          this.application.setupForTesting();

          _test.default.registerAsyncHelper('slowHelper', () => {
            return new _runtime.RSVP.Promise(resolve => (0, _runloop.later)(resolve, 10));
          });

          this.application.injectTestHelpers();
        });
      }
      afterEach() {
        console.error = originalConsoleError; // eslint-disable-line no-console
        super.afterEach();
      }

      teardown() {
        (0, _debug.setDebugFunction)('debug', originalDebug);
        _test.default.adapter = this._originalAdapter;
        _test.default.unregisterHelper('slowHelper');
        window.slowHelper = undefined;
        testContext = undefined;
        super.teardown();
      }

      [`@test helpers can be chained with then`](assert) {
        assert.expect(6);

        window.visit('/posts').then(() => {
          assert.equal(this.currentRoute, 'posts', 'Successfully visited posts route');
          assert.equal(window.currentURL(), '/posts', 'posts URL is correct');
          return window.click('a:contains("Comments")');
        }).then(() => {
          assert.equal(this.currentRoute, 'comments', 'visit chained with click');
          return window.fillIn('.ember-text-field', 'yeah');
        }).then(() => {
          assert.equal(document.querySelector('.ember-text-field').value, 'yeah', 'chained with fillIn');
          return window.fillIn('.ember-text-field', '#qunit-fixture', 'context working');
        }).then(() => {
          assert.equal(document.querySelector('.ember-text-field').value, 'context working', 'chained with fillIn');
          return window.click('.does-not-exist');
        }).catch(e => {
          assert.equal(e.message, 'Element .does-not-exist not found.', 'Non-existent click exception caught');
        });
      }

      [`@test helpers can be chained to each other (legacy)`](assert) {
        assert.expect(7);

        window.visit('/posts').click('a:first', '#comments-link').fillIn('.ember-text-field', 'hello').then(() => {
          assert.equal(this.currentRoute, 'comments', 'Successfully visited comments route');
          assert.equal(window.currentURL(), '/comments', 'Comments URL is correct');
          assert.equal(document.querySelector('.ember-text-field').value, 'hello', 'Fillin successfully works');
          window.find('.ember-text-field').one('keypress', e => {
            assert.equal(e.keyCode, 13, 'keyevent chained with correct keyCode.');
            assert.equal(e.which, 13, 'keyevent chained with correct which.');
          });
        }).keyEvent('.ember-text-field', 'keypress', 13).visit('/posts').then(() => {
          assert.equal(this.currentRoute, 'posts', 'Thens can also be chained to helpers');
          assert.equal(window.currentURL(), '/posts', 'URL is set correct on chained helpers');
        });
      }

      [`@test helpers don't need to be chained`](assert) {
        assert.expect(5);

        window.visit('/posts');

        window.click('a:first', '#comments-link');

        window.fillIn('.ember-text-field', 'hello');

        window.andThen(() => {
          assert.equal(this.currentRoute, 'comments', 'Successfully visited comments route');
          assert.equal(window.currentURL(), '/comments', 'Comments URL is correct');
          assert.equal(window.find('.ember-text-field').val(), 'hello', 'Fillin successfully works');
        });

        window.visit('/posts');

        window.andThen(() => {
          assert.equal(this.currentRoute, 'posts');
          assert.equal(window.currentURL(), '/posts');
        });
      }

      [`@test Nested async helpers`](assert) {
        assert.expect(5);

        window.visit('/posts');

        window.andThen(() => {
          window.click('a:first', '#comments-link');
          window.fillIn('.ember-text-field', 'hello');
        });

        window.andThen(() => {
          assert.equal(this.currentRoute, 'comments', 'Successfully visited comments route');
          assert.equal(window.currentURL(), '/comments', 'Comments URL is correct');
          assert.equal(window.find('.ember-text-field').val(), 'hello', 'Fillin successfully works');
        });

        window.visit('/posts');

        window.andThen(() => {
          assert.equal(this.currentRoute, 'posts');
          assert.equal(window.currentURL(), '/posts');
        });
      }

      [`@test Multiple nested async helpers`](assert) {
        assert.expect(3);

        window.visit('/posts');

        window.andThen(() => {
          window.click('a:first', '#comments-link');

          window.fillIn('.ember-text-field', 'hello');
          window.fillIn('.ember-text-field', 'goodbye');
        });

        window.andThen(() => {
          assert.equal(window.find('.ember-text-field').val(), 'goodbye', 'Fillin successfully works');
          assert.equal(this.currentRoute, 'comments', 'Successfully visited comments route');
          assert.equal(window.currentURL(), '/comments', 'Comments URL is correct');
        });
      }

      [`@test Helpers nested in thens`](assert) {
        assert.expect(5);

        window.visit('/posts').then(() => {
          window.click('a:first', '#comments-link');
        });

        window.andThen(() => {
          window.fillIn('.ember-text-field', 'hello');
        });

        window.andThen(() => {
          assert.equal(this.currentRoute, 'comments', 'Successfully visited comments route');
          assert.equal(window.currentURL(), '/comments', 'Comments URL is correct');
          assert.equal(window.find('.ember-text-field').val(), 'hello', 'Fillin successfully works');
        });

        window.visit('/posts');

        window.andThen(() => {
          assert.equal(this.currentRoute, 'posts');
          assert.equal(window.currentURL(), '/posts', 'Posts URL is correct');
        });
      }

      [`@test Aborted transitions are not logged via Ember.Test.adapter#exception`](assert) {
        assert.expect(0);

        _test.default.adapter = _qunit.default.create({
          exception() {
            assert.ok(false, 'aborted transitions are not logged');
          }
        });

        window.visit('/abort_transition');
      }

      [`@test Unhandled exceptions are logged via Ember.Test.adapter#exception`](assert) {
        assert.expect(2);

        console.error = () => {}; // eslint-disable-line no-console
        let asyncHandled;
        _test.default.adapter = _qunit.default.create({
          exception(error) {
            assert.equal(error.message, 'Element .does-not-exist not found.', 'Exception successfully caught and passed to Ember.Test.adapter.exception');
            // handle the rejection so it doesn't leak later.
            asyncHandled.catch(() => {});
          }
        });

        window.visit('/posts');

        window.click('.invalid-element').catch(error => {
          assert.equal(error.message, 'Element .invalid-element not found.', 'Exception successfully handled in the rejection handler');
        });

        asyncHandled = window.click('.does-not-exist');
      }

      [`@test Unhandled exceptions in 'andThen' are logged via Ember.Test.adapter#exception`](assert) {
        assert.expect(1);

        console.error = () => {}; // eslint-disable-line no-console
        _test.default.adapter = _qunit.default.create({
          exception(error) {
            assert.equal(error.message, 'Catch me', 'Exception successfully caught and passed to Ember.Test.adapter.exception');
          }
        });

        window.visit('/posts');

        window.andThen(() => {
          throw new Error('Catch me');
        });
      }

      [`@test should not start routing on the root URL when visiting another`](assert) {
        assert.expect(4);

        window.visit('/posts');

        window.andThen(() => {
          assert.ok(window.find('#comments-link'), 'found comments-link');
          assert.equal(this.currentRoute, 'posts', 'Successfully visited posts route');
          assert.equal(window.currentURL(), '/posts', 'Posts URL is correct');
          assert.equal(this.indexHitCount, 0, 'should not hit index route when visiting another route');
        });
      }

      [`@test only enters the index route once when visiting `](assert) {
        assert.expect(1);

        window.visit('/');

        window.andThen(() => {
          assert.equal(this.indexHitCount, 1, 'should hit index once when visiting /');
        });
      }

      [`@test test must not finish while asyncHelpers are pending`](assert) {
        assert.expect(2);

        let async = 0;
        let innerRan = false;

        _test.default.adapter = _qunit.default.extend({
          asyncStart() {
            async++;
            this._super();
          },
          asyncEnd() {
            async--;
            this._super();
          }
        }).create();

        this.application.testHelpers.slowHelper();

        window.andThen(() => {
          innerRan = true;
        });

        assert.equal(innerRan, false, 'should not have run yet');
        assert.ok(async > 0, 'should have told the adapter to pause');

        if (async === 0) {
          // If we failed the test, prevent zalgo from escaping and breaking
          // our other tests.
          _test.default.adapter.asyncStart();
          _test.default.resolve().then(() => {
            _test.default.adapter.asyncEnd();
          });
        }
      }

      [`@test visiting a URL that causes another transition should yield the correct URL`](assert) {
        assert.expect(1);

        window.visit('/redirect');

        window.andThen(() => {
          assert.equal(window.currentURL(), '/comments', 'Redirected to Comments URL');
        });
      }

      [`@test visiting a URL and then visiting a second URL with a transition should yield the correct URL`](assert) {
        assert.expect(2);

        window.visit('/posts');

        window.andThen(function () {
          assert.equal(window.currentURL(), '/posts', 'First visited URL is correct');
        });

        window.visit('/redirect');

        window.andThen(() => {
          assert.equal(window.currentURL(), '/comments', 'Redirected to Comments URL');
        });
      }
    });

    (0, _internalTestHelpers.moduleFor)('ember-testing Acceptance - teardown', class extends _internalTestHelpers.AutobootApplicationTestCase {
      [`@test that the setup/teardown happens correctly`](assert) {
        assert.expect(2);

        this.runTask(() => {
          this.createApplication();
        });
        this.application.injectTestHelpers();

        assert.ok(typeof _test.default.Promise.prototype.click === 'function');

        this.runTask(() => {
          this.application.destroy();
        });

        assert.equal(_test.default.Promise.prototype.click, undefined);
      }
    });
  }
});
enifed('ember-testing/tests/adapters/adapter_test', ['@ember/runloop', 'ember-testing/lib/adapters/adapter', 'internal-test-helpers'], function (_runloop, _adapter, _internalTestHelpers) {
  'use strict';

  var adapter;

  (0, _internalTestHelpers.moduleFor)('ember-testing Adapter', class extends _internalTestHelpers.AbstractTestCase {
    constructor() {
      super();
      adapter = _adapter.default.create();
    }

    teardown() {
      (0, _runloop.run)(adapter, adapter.destroy);
    }

    ['@test exception throws'](assert) {
      var error = 'Hai';
      var thrown;

      try {
        adapter.exception(error);
      } catch (e) {
        thrown = e;
      }
      assert.equal(thrown, error);
    }
  });
});
enifed('ember-testing/tests/adapters/qunit_test', ['@ember/runloop', 'ember-testing/lib/adapters/qunit', 'internal-test-helpers'], function (_runloop, _qunit, _internalTestHelpers) {
  'use strict';

  var adapter;

  (0, _internalTestHelpers.moduleFor)('ember-testing QUnitAdapter: QUnit 2.x', class extends _internalTestHelpers.AbstractTestCase {
    constructor() {
      super();
      this.originalStart = QUnit.start;
      this.originalStop = QUnit.stop;

      delete QUnit.start;
      delete QUnit.stop;

      adapter = _qunit.default.create();
    }

    teardown() {
      (0, _runloop.run)(adapter, adapter.destroy);

      QUnit.start = this.originalStart;
      QUnit.stop = this.originalStop;
    }

    ['@test asyncStart waits for asyncEnd to finish a test'](assert) {
      adapter.asyncStart();

      setTimeout(function () {
        assert.ok(true);
        adapter.asyncEnd();
      }, 50);
    }

    ['@test asyncStart waits for equal numbers of asyncEnd to finish a test'](assert) {
      let adapter = _qunit.default.create();

      adapter.asyncStart();
      adapter.asyncStart();
      adapter.asyncEnd();

      setTimeout(function () {
        assert.ok(true);
        adapter.asyncEnd();
      }, 50);
    }
  });
});
enifed('ember-testing/tests/adapters_test', ['@ember/runloop', '@ember/-internals/error-handling', 'ember-testing/lib/test', 'ember-testing/lib/adapters/adapter', 'ember-testing/lib/adapters/qunit', '@ember/application', 'internal-test-helpers', '@ember/-internals/runtime', '@ember/debug'], function (_runloop, _errorHandling, _test, _adapter, _qunit, _application, _internalTestHelpers, _runtime, _debug) {
  'use strict';

  const originalDebug = (0, _debug.getDebugFunction)('debug');
  const noop = function () {};

  var App, originalAdapter, originalQUnit, originalWindowOnerror;

  var originalConsoleError = console.error; // eslint-disable-line no-console

  function runThatThrowsSync(message = 'Error for testing error handling') {
    return (0, _runloop.run)(() => {
      throw new Error(message);
    });
  }

  function runThatThrowsAsync(message = 'Error for testing error handling') {
    return (0, _runloop.next)(() => {
      throw new Error(message);
    });
  }

  class AdapterSetupAndTearDown extends _internalTestHelpers.AbstractTestCase {
    constructor() {
      (0, _debug.setDebugFunction)('debug', noop);
      super();
      originalAdapter = _test.default.adapter;
      originalQUnit = window.QUnit;
      originalWindowOnerror = window.onerror;
    }

    afterEach() {
      console.error = originalConsoleError; // eslint-disable-line no-console
    }

    teardown() {
      (0, _debug.setDebugFunction)('debug', originalDebug);
      if (App) {
        (0, _runloop.run)(App, App.destroy);
        App.removeTestHelpers();
        App = null;
      }

      _test.default.adapter = originalAdapter;
      window.QUnit = originalQUnit;
      window.onerror = originalWindowOnerror;
      (0, _errorHandling.setOnerror)(undefined);
    }
  }

  (0, _internalTestHelpers.moduleFor)('ember-testing Adapters', class extends AdapterSetupAndTearDown {
    ['@test Setting a test adapter manually'](assert) {
      assert.expect(1);
      var CustomAdapter;

      CustomAdapter = _adapter.default.extend({
        asyncStart() {
          assert.ok(true, 'Correct adapter was used');
        }
      });

      (0, _runloop.run)(function () {
        App = _application.default.create();
        _test.default.adapter = CustomAdapter.create();
        App.setupForTesting();
      });

      _test.default.adapter.asyncStart();
    }

    ['@test QUnitAdapter is used by default (if QUnit is available)'](assert) {
      assert.expect(1);

      _test.default.adapter = null;

      (0, _runloop.run)(function () {
        App = _application.default.create();
        App.setupForTesting();
      });

      assert.ok(_test.default.adapter instanceof _qunit.default);
    }

    ['@test Adapter is used by default (if QUnit is not available)'](assert) {
      assert.expect(2);

      delete window.QUnit;

      _test.default.adapter = null;

      (0, _runloop.run)(function () {
        App = _application.default.create();
        App.setupForTesting();
      });

      assert.ok(_test.default.adapter instanceof _adapter.default);
      assert.ok(!(_test.default.adapter instanceof _qunit.default));
    }

    ['@test With Ember.Test.adapter set, errors in synchronous Ember.run are bubbled out'](assert) {
      let thrown = new Error('Boom!');

      let caughtInAdapter, caughtInCatch;
      _test.default.adapter = _qunit.default.create({
        exception(error) {
          caughtInAdapter = error;
        }
      });

      try {
        (0, _runloop.run)(() => {
          throw thrown;
        });
      } catch (e) {
        caughtInCatch = e;
      }

      assert.equal(caughtInAdapter, undefined, 'test adapter should never receive synchronous errors');
      assert.equal(caughtInCatch, thrown, 'a "normal" try/catch should catch errors in sync run');
    }

    ['@test when both Ember.onerror (which rethrows) and TestAdapter are registered - sync run'](assert) {
      assert.expect(2);

      _test.default.adapter = {
        exception() {
          assert.notOk(true, 'adapter is not called for errors thrown in sync run loops');
        }
      };

      (0, _errorHandling.setOnerror)(function (error) {
        assert.ok(true, 'onerror is called for sync errors even if TestAdapter is setup');
        throw error;
      });

      assert.throws(runThatThrowsSync, Error, 'error is thrown');
    }

    ['@test when both Ember.onerror (which does not rethrow) and TestAdapter are registered - sync run'](assert) {
      assert.expect(2);

      _test.default.adapter = {
        exception() {
          assert.notOk(true, 'adapter is not called for errors thrown in sync run loops');
        }
      };

      (0, _errorHandling.setOnerror)(function () {
        assert.ok(true, 'onerror is called for sync errors even if TestAdapter is setup');
      });

      runThatThrowsSync();
      assert.ok(true, 'no error was thrown, Ember.onerror can intercept errors');
    }

    ['@test when TestAdapter is registered and error is thrown - async run'](assert) {
      assert.expect(3);
      let done = assert.async();

      let caughtInAdapter, caughtInCatch, caughtByWindowOnerror;
      _test.default.adapter = {
        exception(error) {
          caughtInAdapter = error;
        }
      };

      window.onerror = function (message) {
        caughtByWindowOnerror = message;
        // prevent "bubbling" and therefore failing the test
        return true;
      };

      try {
        runThatThrowsAsync();
      } catch (e) {
        caughtInCatch = e;
      }

      setTimeout(() => {
        assert.equal(caughtInAdapter, undefined, 'test adapter should never catch errors in run loops');
        assert.equal(caughtInCatch, undefined, 'a "normal" try/catch should never catch errors in an async run');

        assert.pushResult({
          result: /Error for testing error handling/.test(caughtByWindowOnerror),
          actual: caughtByWindowOnerror,
          expected: 'to include `Error for testing error handling`',
          message: 'error should bubble out to window.onerror, and therefore fail tests (due to QUnit implementing window.onerror)'
        });

        done();
      }, 20);
    }

    ['@test when both Ember.onerror and TestAdapter are registered - async run'](assert) {
      assert.expect(1);
      let done = assert.async();

      _test.default.adapter = {
        exception() {
          assert.notOk(true, 'Adapter.exception is not called for errors thrown in next');
        }
      };

      (0, _errorHandling.setOnerror)(function () {
        assert.ok(true, 'onerror is invoked for errors thrown in next/later');
      });

      runThatThrowsAsync();
      setTimeout(done, 10);
    }
  });

  function testAdapter(message, generatePromise, timeout = 10) {
    return class PromiseFailureTests extends AdapterSetupAndTearDown {
      [`@test ${message} when TestAdapter without \`exception\` method is present - rsvp`](assert) {
        assert.expect(1);

        let thrown = new Error('the error');
        _test.default.adapter = _qunit.default.create({
          exception: undefined
        });

        window.onerror = function (message) {
          assert.pushResult({
            result: /the error/.test(message),
            actual: message,
            expected: 'to include `the error`',
            message: 'error should bubble out to window.onerror, and therefore fail tests (due to QUnit implementing window.onerror)'
          });

          // prevent "bubbling" and therefore failing the test
          return true;
        };

        generatePromise(thrown);

        // RSVP.Promise's are configured to settle within the run loop, this
        // ensures that run loop has completed
        return new _runtime.RSVP.Promise(resolve => setTimeout(resolve, timeout));
      }

      [`@test ${message} when both Ember.onerror and TestAdapter without \`exception\` method are present - rsvp`](assert) {
        assert.expect(1);

        let thrown = new Error('the error');
        _test.default.adapter = _qunit.default.create({
          exception: undefined
        });

        (0, _errorHandling.setOnerror)(function (error) {
          assert.pushResult({
            result: /the error/.test(error.message),
            actual: error.message,
            expected: 'to include `the error`',
            message: 'error should bubble out to window.onerror, and therefore fail tests (due to QUnit implementing window.onerror)'
          });
        });

        generatePromise(thrown);

        // RSVP.Promise's are configured to settle within the run loop, this
        // ensures that run loop has completed
        return new _runtime.RSVP.Promise(resolve => setTimeout(resolve, timeout));
      }

      [`@test ${message} when TestAdapter is present - rsvp`](assert) {
        assert.expect(1);

        console.error = () => {}; // eslint-disable-line no-console
        let thrown = new Error('the error');
        _test.default.adapter = _qunit.default.create({
          exception(error) {
            assert.strictEqual(error, thrown, 'Adapter.exception is called for errors thrown in RSVP promises');
          }
        });

        generatePromise(thrown);

        // RSVP.Promise's are configured to settle within the run loop, this
        // ensures that run loop has completed
        return new _runtime.RSVP.Promise(resolve => setTimeout(resolve, timeout));
      }

      [`@test ${message} when both Ember.onerror and TestAdapter are present - rsvp`](assert) {
        assert.expect(1);

        let thrown = new Error('the error');
        _test.default.adapter = _qunit.default.create({
          exception(error) {
            assert.strictEqual(error, thrown, 'Adapter.exception is called for errors thrown in RSVP promises');
          }
        });

        (0, _errorHandling.setOnerror)(function () {
          assert.notOk(true, 'Ember.onerror is not called if Test.adapter does not rethrow');
        });

        generatePromise(thrown);

        // RSVP.Promise's are configured to settle within the run loop, this
        // ensures that run loop has completed
        return new _runtime.RSVP.Promise(resolve => setTimeout(resolve, timeout));
      }

      [`@test ${message} when both Ember.onerror and TestAdapter are present - rsvp`](assert) {
        assert.expect(2);

        let thrown = new Error('the error');
        _test.default.adapter = _qunit.default.create({
          exception(error) {
            assert.strictEqual(error, thrown, 'Adapter.exception is called for errors thrown in RSVP promises');
            throw error;
          }
        });

        (0, _errorHandling.setOnerror)(function (error) {
          assert.strictEqual(error, thrown, 'Ember.onerror is called for errors thrown in RSVP promises if Test.adapter rethrows');
        });

        generatePromise(thrown);

        // RSVP.Promise's are configured to settle within the run loop, this
        // ensures that run loop has completed
        return new _runtime.RSVP.Promise(resolve => setTimeout(resolve, timeout));
      }
    };
  }

  (0, _internalTestHelpers.moduleFor)('Adapter Errors: .then callback', testAdapter('errors in promise constructor', error => {
    new _runtime.RSVP.Promise(() => {
      throw error;
    });
  }));

  (0, _internalTestHelpers.moduleFor)('Adapter Errors: Promise Contructor', testAdapter('errors in promise constructor', error => {
    _runtime.RSVP.resolve().then(() => {
      throw error;
    });
  }));

  (0, _internalTestHelpers.moduleFor)('Adapter Errors: Promise chain .then callback', testAdapter('errors in promise constructor', error => {
    new _runtime.RSVP.Promise(resolve => setTimeout(resolve, 10)).then(() => {
      throw error;
    });
  }, 20));
});
enifed('ember-testing/tests/ext/rsvp_test', ['ember-testing/lib/ext/rsvp', 'ember-testing/lib/test/adapter', 'ember-testing/lib/test/promise', '@ember/runloop', '@ember/debug', 'internal-test-helpers'], function (_rsvp, _adapter, _promise, _runloop, _debug, _internalTestHelpers) {
  'use strict';

  const originalTestAdapter = (0, _adapter.getAdapter)();
  const originalTestingFlag = (0, _debug.isTesting)();

  let asyncStarted = 0;
  let asyncEnded = 0;

  (0, _internalTestHelpers.moduleFor)('ember-testing RSVP', class extends _internalTestHelpers.AbstractTestCase {
    constructor() {
      super();
      (0, _debug.setTesting)(true);
      (0, _adapter.setAdapter)({
        asyncStart() {
          asyncStarted++;
        },
        asyncEnd() {
          asyncEnded++;
        }
      });
    }

    teardown() {
      asyncStarted = 0;
      asyncEnded = 0;
      (0, _adapter.setAdapter)(originalTestAdapter);
      (0, _debug.setTesting)(originalTestingFlag);
    }

    ['@test given `Ember.testing = true`, correctly informs the test suite about async steps'](assert) {
      let done = assert.async();
      assert.expect(19);

      assert.ok(!(0, _runloop.getCurrentRunLoop)(), 'expect no run-loop');

      (0, _debug.setTesting)(true);

      assert.equal(asyncStarted, 0);
      assert.equal(asyncEnded, 0);

      let user = _rsvp.default.Promise.resolve({ name: 'tomster' });

      assert.equal(asyncStarted, 0);
      assert.equal(asyncEnded, 0);

      user.then(function (user) {
        assert.equal(asyncStarted, 1);
        assert.equal(asyncEnded, 1);

        assert.equal(user.name, 'tomster');

        return _rsvp.default.Promise.resolve(1).then(function () {
          assert.equal(asyncStarted, 1);
          assert.equal(asyncEnded, 1);
        });
      }).then(function () {
        assert.equal(asyncStarted, 1);
        assert.equal(asyncEnded, 1);

        return new _rsvp.default.Promise(function (resolve) {
          setTimeout(function () {
            assert.equal(asyncStarted, 1);
            assert.equal(asyncEnded, 1);

            resolve({ name: 'async tomster' });

            assert.equal(asyncStarted, 2);
            assert.equal(asyncEnded, 1);
          }, 0);
        });
      }).then(function (user) {
        assert.equal(user.name, 'async tomster');
        assert.equal(asyncStarted, 2);
        assert.equal(asyncEnded, 2);
        done();
      });
    }
  });

  (0, _internalTestHelpers.moduleFor)('TestPromise', class extends _internalTestHelpers.AbstractTestCase {
    ['does not throw error when falsy value passed to then'](assert) {
      assert.expect(1);
      return new _promise.default(function (resolve) {
        resolve();
      }).then(null).then(function () {
        assert.ok(true);
      });
    }

    ['able to get last Promise'](assert) {
      assert.expect(2);

      var p1 = new _promise.default(function (resolve) {
        resolve();
      }).then(function () {
        assert.ok(true);
      });

      var p2 = new _promise.default(function (resolve) {
        resolve();
      });

      assert.deepEqual((0, _promise.getLastPromise)(), p2);
      return p1;
    }
  });
});
enifed('ember-testing/tests/helper_registration_test', ['@ember/runloop', 'ember-testing/lib/test', '@ember/application', 'internal-test-helpers'], function (_runloop, _test, _application, _internalTestHelpers) {
  'use strict';

  var App, appBooted, helperContainer;

  function registerHelper() {
    _test.default.registerHelper('boot', function (app) {
      (0, _runloop.run)(app, app.advanceReadiness);
      appBooted = true;
      return app.testHelpers.wait();
    });
  }

  function unregisterHelper() {
    _test.default.unregisterHelper('boot');
  }

  var originalAdapter = _test.default.adapter;

  function setupApp() {
    appBooted = false;
    helperContainer = {};

    (0, _runloop.run)(function () {
      App = _application.default.create();
      App.setupForTesting();
      App.injectTestHelpers(helperContainer);
    });
  }

  function destroyApp() {
    if (App) {
      (0, _runloop.run)(App, 'destroy');
      App = null;
      helperContainer = null;
    }
  }

  (0, _internalTestHelpers.moduleFor)('Test - registerHelper/unregisterHelper', class extends _internalTestHelpers.AbstractTestCase {
    teardown() {
      _test.default.adapter = originalAdapter;
      destroyApp();
    }

    ['@test Helper gets registered'](assert) {
      assert.expect(2);

      registerHelper();
      setupApp();

      assert.ok(App.testHelpers.boot);
      assert.ok(helperContainer.boot);
    }

    ['@test Helper is ran when called'](assert) {
      let done = assert.async();
      assert.expect(1);

      registerHelper();
      setupApp();

      App.testHelpers.boot().then(function () {
        assert.ok(appBooted);
      }).finally(done);
    }

    ['@test Helper can be unregistered'](assert) {
      assert.expect(4);

      registerHelper();
      setupApp();

      assert.ok(App.testHelpers.boot);
      assert.ok(helperContainer.boot);

      unregisterHelper();

      (0, _runloop.run)(App, 'destroy');
      setupApp();

      assert.ok(!App.testHelpers.boot, 'once unregistered the helper is not added to App.testHelpers');
      assert.ok(!helperContainer.boot, 'once unregistered the helper is not added to the helperContainer');
    }
  });
});
enifed('ember-testing/tests/helpers_test', ['internal-test-helpers', '@ember/-internals/routing', '@ember/controller', '@ember/-internals/runtime', '@ember/runloop', '@ember/-internals/glimmer', '@ember/-internals/views', 'ember-testing/lib/test', 'ember-testing/lib/setup_for_testing', 'ember-testing/lib/test/pending_requests', 'ember-testing/lib/test/adapter', 'ember-testing/lib/test/waiters', '@ember/debug'], function (_internalTestHelpers, _routing, _controller, _runtime, _runloop, _glimmer, _views, _test, _setup_for_testing, _pending_requests, _adapter, _waiters, _debug) {
  'use strict';

  var originalInfo = (0, _debug.getDebugFunction)('info');
  var noop = function () {};

  function registerHelper() {
    _test.default.registerHelper('LeakyMcLeakLeak', () => {});
  }

  function assertHelpers(assert, application, helperContainer, expected) {
    if (!helperContainer) {
      helperContainer = window;
    }
    if (expected === undefined) {
      expected = true;
    }

    function checkHelperPresent(helper, expected) {
      var presentInHelperContainer = !!helperContainer[helper];
      var presentInTestHelpers = !!application.testHelpers[helper];

      assert.ok(presentInHelperContainer === expected, "Expected '" + helper + "' to be present in the helper container (defaults to window).");
      assert.ok(presentInTestHelpers === expected, "Expected '" + helper + "' to be present in App.testHelpers.");
    }

    checkHelperPresent('visit', expected);
    checkHelperPresent('click', expected);
    checkHelperPresent('keyEvent', expected);
    checkHelperPresent('fillIn', expected);
    checkHelperPresent('wait', expected);
    checkHelperPresent('triggerEvent', expected);
  }

  function assertNoHelpers(assert, application, helperContainer) {
    assertHelpers(assert, application, helperContainer, false);
  }

  class HelpersTestCase extends _internalTestHelpers.AutobootApplicationTestCase {
    constructor() {
      super();
      this._originalAdapter = (0, _adapter.getAdapter)();
    }

    teardown() {
      (0, _adapter.setAdapter)(this._originalAdapter);
      document.removeEventListener('ajaxSend', _pending_requests.incrementPendingRequests);
      document.removeEventListener('ajaxComplete', _pending_requests.decrementPendingRequests);
      (0, _pending_requests.clearPendingRequests)();
      if (this.application) {
        this.application.removeTestHelpers();
      }
      super.teardown();
    }
  }

  class HelpersApplicationTestCase extends HelpersTestCase {
    constructor() {
      super();
      this.runTask(() => {
        this.createApplication();
        this.application.setupForTesting();
        this.application.injectTestHelpers();
      });
    }
  }

  if (!_views.jQueryDisabled) {
    (0, _internalTestHelpers.moduleFor)('ember-testing: Helper setup', class extends HelpersTestCase {
      [`@test Ember.Application#injectTestHelpers/#removeTestHelper`](assert) {
        this.runTask(() => {
          this.createApplication();
        });

        assertNoHelpers(assert, this.application);

        registerHelper();

        this.application.injectTestHelpers();

        assertHelpers(assert, this.application);

        assert.ok(_test.default.Promise.prototype.LeakyMcLeakLeak, 'helper in question SHOULD be present');

        this.application.removeTestHelpers();

        assertNoHelpers(assert, this.application);

        assert.equal(_test.default.Promise.prototype.LeakyMcLeakLeak, undefined, 'should NOT leak test promise extensions');
      }

      [`@test Ember.Application#setupForTesting`](assert) {
        this.runTask(() => {
          this.createApplication();
          this.application.setupForTesting();
        });

        let routerInstance = this.applicationInstance.lookup('router:main');
        assert.equal(routerInstance.location, 'none');
      }

      [`@test Ember.Application.setupForTesting sets the application to 'testing'`](assert) {
        this.runTask(() => {
          this.createApplication();
          this.application.setupForTesting();
        });

        assert.equal(this.application.testing, true, 'Application instance is set to testing.');
      }

      [`@test Ember.Application.setupForTesting leaves the system in a deferred state.`](assert) {
        this.runTask(() => {
          this.createApplication();
          this.application.setupForTesting();
        });

        assert.equal(this.application._readinessDeferrals, 1, 'App is in deferred state after setupForTesting.');
      }

      [`@test App.reset() after Application.setupForTesting leaves the system in a deferred state.`](assert) {
        this.runTask(() => {
          this.createApplication();
          this.application.setupForTesting();
        });

        assert.equal(this.application._readinessDeferrals, 1, 'App is in deferred state after setupForTesting.');

        this.application.reset();

        assert.equal(this.application._readinessDeferrals, 1, 'App is in deferred state after setupForTesting.');
      }

      [`@test Ember.Application#injectTestHelpers calls callbacks registered with onInjectHelpers`](assert) {
        let injected = 0;

        _test.default.onInjectHelpers(() => {
          injected++;
        });

        // bind(this) so Babel doesn't leak _this
        // into the context onInjectHelpers.
        this.runTask(function () {
          this.createApplication();
          this.application.setupForTesting();
        }.bind(this));

        assert.equal(injected, 0, 'onInjectHelpers are not called before injectTestHelpers');

        this.application.injectTestHelpers();

        assert.equal(injected, 1, 'onInjectHelpers are called after injectTestHelpers');
      }

      [`@test Ember.Application#injectTestHelpers adds helpers to provided object.`](assert) {
        let helpers = {};

        this.runTask(() => {
          this.createApplication();
          this.application.setupForTesting();
        });

        this.application.injectTestHelpers(helpers);

        assertHelpers(assert, this.application, helpers);

        this.application.removeTestHelpers();

        assertNoHelpers(assert, this.application, helpers);
      }

      [`@test Ember.Application#removeTestHelpers resets the helperContainer\'s original values`](assert) {
        let helpers = { visit: 'snazzleflabber' };

        this.runTask(() => {
          this.createApplication();
          this.application.setupForTesting();
        });

        this.application.injectTestHelpers(helpers);

        assert.notEqual(helpers.visit, 'snazzleflabber', 'helper added to container');
        this.application.removeTestHelpers();

        assert.equal(helpers.visit, 'snazzleflabber', 'original value added back to container');
      }
    });

    (0, _internalTestHelpers.moduleFor)('ember-testing: Helper methods', class extends HelpersApplicationTestCase {
      [`@test 'wait' respects registerWaiters`](assert) {
        assert.expect(3);

        let counter = 0;
        function waiter() {
          return ++counter > 2;
        }

        let other = 0;
        function otherWaiter() {
          return ++other > 2;
        }

        this.runTask(() => {
          this.application.advanceReadiness();
        });

        (0, _waiters.registerWaiter)(waiter);
        (0, _waiters.registerWaiter)(otherWaiter);

        let { application: { testHelpers } } = this;
        return testHelpers.wait().then(() => {
          assert.equal(waiter(), true, 'should not resolve until our waiter is ready');
          (0, _waiters.unregisterWaiter)(waiter);
          counter = 0;
          return testHelpers.wait();
        }).then(() => {
          assert.equal(counter, 0, 'unregistered waiter was not checked');
          assert.equal(otherWaiter(), true, 'other waiter is still registered');
        }).finally(() => {
          (0, _waiters.unregisterWaiter)(otherWaiter);
        });
      }

      [`@test 'visit' advances readiness.`](assert) {
        assert.expect(2);

        assert.equal(this.application._readinessDeferrals, 1, 'App is in deferred state after setupForTesting.');

        return this.application.testHelpers.visit('/').then(() => {
          assert.equal(this.application._readinessDeferrals, 0, `App's readiness was advanced by visit.`);
        });
      }

      [`@test 'wait' helper can be passed a resolution value`](assert) {
        assert.expect(4);

        this.runTask(() => {
          this.application.advanceReadiness();
        });

        let promiseObjectValue = {};
        let objectValue = {};
        let { application: { testHelpers } } = this;
        return testHelpers.wait('text').then(val => {
          assert.equal(val, 'text', 'can resolve to a string');
          return testHelpers.wait(1);
        }).then(val => {
          assert.equal(val, 1, 'can resolve to an integer');
          return testHelpers.wait(objectValue);
        }).then(val => {
          assert.equal(val, objectValue, 'can resolve to an object');
          return testHelpers.wait(_runtime.RSVP.resolve(promiseObjectValue));
        }).then(val => {
          assert.equal(val, promiseObjectValue, 'can resolve to a promise resolution value');
        });
      }

      [`@test 'click' triggers appropriate events in order`](assert) {
        assert.expect(5);

        this.add('component:index-wrapper', _glimmer.Component.extend({
          classNames: 'index-wrapper',

          didInsertElement() {
            let wrapper = document.querySelector('.index-wrapper');
            wrapper.addEventListener('mousedown', e => events.push(e.type));
            wrapper.addEventListener('mouseup', e => events.push(e.type));
            wrapper.addEventListener('click', e => events.push(e.type));
            wrapper.addEventListener('focusin', e => {
              // IE11 _sometimes_ triggers focusin **twice** in a row
              // (we believe this is when it is under higher load)
              //
              // the goal here is to only push a single focusin when running on
              // IE11
              if (_internalTestHelpers.isIE11) {
                if (events[events.length - 1] !== 'focusin') {
                  events.push(e.type);
                }
              } else {
                events.push(e.type);
              }
            });
          }
        }));

        this.add('component:x-checkbox', _glimmer.Component.extend({
          tagName: 'input',
          attributeBindings: ['type'],
          type: 'checkbox',
          click() {
            events.push('click:' + this.get('checked'));
          },
          change() {
            events.push('change:' + this.get('checked'));
          }
        }));

        this.addTemplate('index', `
        {{#index-wrapper}}
          {{input type="text"}}
          {{x-checkbox type="checkbox"}}
          {{textarea}}
          <div contenteditable="true"> </div>
        {{/index-wrapper}}'));
      `);

        this.runTask(() => {
          this.application.advanceReadiness();
        });

        let events;
        let { application: { testHelpers } } = this;
        return testHelpers.wait().then(() => {
          events = [];
          return testHelpers.click('.index-wrapper');
        }).then(() => {
          assert.deepEqual(events, ['mousedown', 'mouseup', 'click'], 'fires events in order');
        }).then(() => {
          events = [];
          return testHelpers.click('.index-wrapper input[type=text]');
        }).then(() => {
          assert.deepEqual(events, ['mousedown', 'focusin', 'mouseup', 'click'], 'fires focus events on inputs');
        }).then(() => {
          events = [];
          return testHelpers.click('.index-wrapper textarea');
        }).then(() => {
          assert.deepEqual(events, ['mousedown', 'focusin', 'mouseup', 'click'], 'fires focus events on textareas');
        }).then(() => {
          events = [];
          return testHelpers.click('.index-wrapper div');
        }).then(() => {
          assert.deepEqual(events, ['mousedown', 'focusin', 'mouseup', 'click'], 'fires focus events on contenteditable');
        }).then(() => {
          events = [];
          return testHelpers.click('.index-wrapper input[type=checkbox]');
        }).then(() => {
          // i.e. mousedown, mouseup, change:true, click, click:true
          // Firefox differs so we can't assert the exact ordering here.
          // See https://bugzilla.mozilla.org/show_bug.cgi?id=843554.
          assert.equal(events.length, 5, 'fires click and change on checkboxes');
        });
      }

      [`@test 'click' triggers native events with simulated X/Y coordinates`](assert) {
        assert.expect(15);

        this.add('component:index-wrapper', _glimmer.Component.extend({
          classNames: 'index-wrapper',

          didInsertElement() {
            let pushEvent = e => events.push(e);
            this.element.addEventListener('mousedown', pushEvent);
            this.element.addEventListener('mouseup', pushEvent);
            this.element.addEventListener('click', pushEvent);
          }
        }));

        this.addTemplate('index', `
        {{#index-wrapper}}some text{{/index-wrapper}}
      `);

        this.runTask(() => {
          this.application.advanceReadiness();
        });

        let events;
        let { application: { testHelpers: { wait, click } } } = this;
        return wait().then(() => {
          events = [];
          return click('.index-wrapper');
        }).then(() => {
          events.forEach(e => {
            assert.ok(e instanceof window.Event, 'The event is an instance of MouseEvent');
            assert.ok(typeof e.screenX === 'number', 'screenX is correct');
            assert.ok(typeof e.screenY === 'number', 'screenY is correct');
            assert.ok(typeof e.clientX === 'number', 'clientX is correct');
            assert.ok(typeof e.clientY === 'number', 'clientY is correct');
          });
        });
      }

      [`@test 'triggerEvent' with mouseenter triggers native events with simulated X/Y coordinates`](assert) {
        assert.expect(5);

        let evt;
        this.add('component:index-wrapper', _glimmer.Component.extend({
          classNames: 'index-wrapper',
          didInsertElement() {
            this.element.addEventListener('mouseenter', e => evt = e);
          }
        }));

        this.addTemplate('index', `{{#index-wrapper}}some text{{/index-wrapper}}`);

        this.runTask(() => {
          this.application.advanceReadiness();
        });

        let { application: { testHelpers: { wait, triggerEvent } } } = this;
        return wait().then(() => {
          return triggerEvent('.index-wrapper', 'mouseenter');
        }).then(() => {
          assert.ok(evt instanceof window.Event, 'The event is an instance of MouseEvent');
          assert.ok(typeof evt.screenX === 'number', 'screenX is correct');
          assert.ok(typeof evt.screenY === 'number', 'screenY is correct');
          assert.ok(typeof evt.clientX === 'number', 'clientX is correct');
          assert.ok(typeof evt.clientY === 'number', 'clientY is correct');
        });
      }

      [`@test 'wait' waits for outstanding timers`](assert) {
        assert.expect(1);

        this.runTask(() => {
          this.application.advanceReadiness();
        });

        let waitDone = false;
        (0, _runloop.later)(() => {
          waitDone = true;
        }, 20);

        return this.application.testHelpers.wait().then(() => {
          assert.equal(waitDone, true, 'should wait for the timer to be fired.');
        });
      }

      [`@test 'wait' respects registerWaiters with optional context`](assert) {
        assert.expect(3);

        let obj = {
          counter: 0,
          ready() {
            return ++this.counter > 2;
          }
        };

        let other = 0;
        function otherWaiter() {
          return ++other > 2;
        }

        this.runTask(() => {
          this.application.advanceReadiness();
        });

        (0, _waiters.registerWaiter)(obj, obj.ready);
        (0, _waiters.registerWaiter)(otherWaiter);

        let { application: { testHelpers: { wait } } } = this;
        return wait().then(() => {
          assert.equal(obj.ready(), true, 'should not resolve until our waiter is ready');
          (0, _waiters.unregisterWaiter)(obj, obj.ready);
          obj.counter = 0;
          return wait();
        }).then(() => {
          assert.equal(obj.counter, 0, 'the unregistered waiter should still be at 0');
          assert.equal(otherWaiter(), true, 'other waiter should still be registered');
        }).finally(() => {
          (0, _waiters.unregisterWaiter)(otherWaiter);
        });
      }

      [`@test 'wait' does not error if routing has not begun`](assert) {
        assert.expect(1);

        return this.application.testHelpers.wait().then(() => {
          assert.ok(true, 'should not error without `visit`');
        });
      }

      [`@test 'triggerEvent' accepts an optional options hash without context`](assert) {
        assert.expect(3);

        let event;
        this.add('component:index-wrapper', _glimmer.Component.extend({
          didInsertElement() {
            let domElem = document.querySelector('.input');
            domElem.addEventListener('change', e => event = e);
            domElem.addEventListener('keydown', e => event = e);
          }
        }));

        this.addTemplate('index', `{{index-wrapper}}`);
        this.addTemplate('components/index-wrapper', `
        {{input type="text" id="scope" class="input"}}
      `);

        this.runTask(() => {
          this.application.advanceReadiness();
        });

        let { application: { testHelpers: { wait, triggerEvent } } } = this;
        return wait().then(() => {
          return triggerEvent('.input', 'keydown', { keyCode: 13 });
        }).then(() => {
          assert.equal(event.keyCode, 13, 'options were passed');
          assert.equal(event.type, 'keydown', 'correct event was triggered');
          assert.equal(event.target.getAttribute('id'), 'scope', 'triggered on the correct element');
        });
      }

      [`@test 'triggerEvent' can limit searching for a selector to a scope`](assert) {
        assert.expect(2);

        let event;
        this.add('component:index-wrapper', _glimmer.Component.extend({
          didInsertElement() {
            let firstInput = document.querySelector('.input');
            firstInput.addEventListener('blur', e => event = e);
            firstInput.addEventListener('change', e => event = e);
            let secondInput = document.querySelector('#limited .input');
            secondInput.addEventListener('blur', e => event = e);
            secondInput.addEventListener('change', e => event = e);
          }
        }));

        this.addTemplate('components/index-wrapper', `
        {{input type="text" id="outside-scope" class="input"}}
        <div id="limited">
          {{input type="text" id="inside-scope" class="input"}}
        </div>
      `);
        this.addTemplate('index', `{{index-wrapper}}`);

        this.runTask(() => {
          this.application.advanceReadiness();
        });

        let { application: { testHelpers: { wait, triggerEvent } } } = this;
        return wait().then(() => {
          return triggerEvent('.input', '#limited', 'blur');
        }).then(() => {
          assert.equal(event.type, 'blur', 'correct event was triggered');
          assert.equal(event.target.getAttribute('id'), 'inside-scope', 'triggered on the correct element');
        });
      }

      [`@test 'triggerEvent' can be used to trigger arbitrary events`](assert) {
        assert.expect(2);

        let event;
        this.add('component:index-wrapper', _glimmer.Component.extend({
          didInsertElement() {
            let foo = document.getElementById('foo');
            foo.addEventListener('blur', e => event = e);
            foo.addEventListener('change', e => event = e);
          }
        }));

        this.addTemplate('components/index-wrapper', `
        {{input type="text" id="foo"}}
      `);
        this.addTemplate('index', `{{index-wrapper}}`);

        this.runTask(() => {
          this.application.advanceReadiness();
        });

        let { application: { testHelpers: { wait, triggerEvent } } } = this;
        return wait().then(() => {
          return triggerEvent('#foo', 'blur');
        }).then(() => {
          assert.equal(event.type, 'blur', 'correct event was triggered');
          assert.equal(event.target.getAttribute('id'), 'foo', 'triggered on the correct element');
        });
      }

      [`@test 'fillIn' takes context into consideration`](assert) {
        assert.expect(2);

        this.addTemplate('index', `
        <div id="parent">
          {{input type="text" id="first" class="current"}}
        </div>
        {{input type="text" id="second" class="current"}}
      `);

        this.runTask(() => {
          this.application.advanceReadiness();
        });

        let { application: { testHelpers: { visit, fillIn, andThen, find } } } = this;
        visit('/');
        fillIn('.current', '#parent', 'current value');

        return andThen(() => {
          assert.equal(find('#first')[0].value, 'current value');
          assert.equal(find('#second')[0].value, '');
        });
      }

      [`@test 'fillIn' focuses on the element`](assert) {
        let wasFocused = false;

        this.add('controller:index', _controller.default.extend({
          actions: {
            wasFocused() {
              wasFocused = true;
            }
          }
        }));

        this.addTemplate('index', `
        <div id="parent">
          {{input type="text" id="first" focus-in=(action "wasFocused")}}
        </div>'
      `);

        this.runTask(() => {
          this.application.advanceReadiness();
        });

        let { application: { testHelpers: { visit, fillIn, andThen, find, wait } } } = this;
        visit('/');
        fillIn('#first', 'current value');
        andThen(() => {
          assert.ok(wasFocused, 'focusIn event was triggered');

          assert.equal(find('#first')[0].value, 'current value');
        });

        return wait();
      }

      [`@test 'fillIn' fires 'input' and 'change' events in the proper order`](assert) {
        assert.expect(1);

        let events = [];
        this.add('controller:index', _controller.default.extend({
          actions: {
            oninputHandler(e) {
              events.push(e.type);
            },
            onchangeHandler(e) {
              events.push(e.type);
            }
          }
        }));

        this.addTemplate('index', `
        <input type="text" id="first"
            oninput={{action "oninputHandler"}}
            onchange={{action "onchangeHandler"}}>
      `);

        this.runTask(() => {
          this.application.advanceReadiness();
        });

        let { application: { testHelpers: { visit, fillIn, andThen, wait } } } = this;

        visit('/');
        fillIn('#first', 'current value');
        andThen(() => {
          assert.deepEqual(events, ['input', 'change'], '`input` and `change` events are fired in the proper order');
        });

        return wait();
      }

      [`@test 'fillIn' only sets the value in the first matched element`](assert) {
        this.addTemplate('index', `
        <input type="text" id="first" class="in-test">
        <input type="text" id="second" class="in-test">
      `);

        this.runTask(() => {
          this.application.advanceReadiness();
        });

        let { application: { testHelpers: { visit, fillIn, find, andThen, wait } } } = this;

        visit('/');
        fillIn('input.in-test', 'new value');
        andThen(() => {
          assert.equal(find('#first')[0].value, 'new value');
          assert.equal(find('#second')[0].value, '');
        });

        return wait();
      }

      [`@test 'triggerEvent' accepts an optional options hash and context`](assert) {
        assert.expect(3);

        let event;
        this.add('component:index-wrapper', _glimmer.Component.extend({
          didInsertElement() {
            let firstInput = document.querySelector('.input');
            firstInput.addEventListener('keydown', e => event = e, false);
            firstInput.addEventListener('change', e => event = e, false);
            let secondInput = document.querySelector('#limited .input');
            secondInput.addEventListener('keydown', e => event = e, false);
            secondInput.addEventListener('change', e => event = e, false);
          }
        }));

        this.addTemplate('components/index-wrapper', `
        {{input type="text" id="outside-scope" class="input"}}
        <div id="limited">
          {{input type="text" id="inside-scope" class="input"}}
        </div>
      `);
        this.addTemplate('index', `{{index-wrapper}}`);

        this.runTask(() => {
          this.application.advanceReadiness();
        });

        let { application: { testHelpers: { wait, triggerEvent } } } = this;
        return wait().then(() => {
          return triggerEvent('.input', '#limited', 'keydown', {
            keyCode: 13
          });
        }).then(() => {
          assert.equal(event.keyCode, 13, 'options were passed');
          assert.equal(event.type, 'keydown', 'correct event was triggered');
          assert.equal(event.target.getAttribute('id'), 'inside-scope', 'triggered on the correct element');
        });
      }
    });

    (0, _internalTestHelpers.moduleFor)('ember-testing: debugging helpers', class extends HelpersApplicationTestCase {
      afterEach() {
        super.afterEach();
        (0, _debug.setDebugFunction)('info', originalInfo);
      }

      constructor() {
        super();
        this.runTask(() => {
          this.application.advanceReadiness();
        });
      }

      [`@test pauseTest pauses`](assert) {
        assert.expect(1);
        // overwrite info to supress the console output (see https://github.com/emberjs/ember.js/issues/16391)
        (0, _debug.setDebugFunction)('info', noop);

        let { andThen, pauseTest } = this.application.testHelpers;

        andThen(() => {
          _test.default.adapter.asyncStart = () => {
            assert.ok(true, 'Async start should be called after waiting for other helpers');
          };
        });

        pauseTest();
      }

      [`@test resumeTest resumes paused tests`](assert) {
        assert.expect(1);
        // overwrite info to supress the console output (see https://github.com/emberjs/ember.js/issues/16391)
        (0, _debug.setDebugFunction)('info', noop);

        let { application: { testHelpers: { pauseTest, resumeTest } } } = this;

        (0, _runloop.later)(() => resumeTest(), 20);
        return pauseTest().then(() => {
          assert.ok(true, 'pauseTest promise was resolved');
        });
      }

      [`@test resumeTest throws if nothing to resume`](assert) {
        assert.expect(1);

        assert.throws(() => {
          this.application.testHelpers.resumeTest();
        }, /Testing has not been paused. There is nothing to resume./);
      }
    });

    (0, _internalTestHelpers.moduleFor)('ember-testing: routing helpers', class extends HelpersTestCase {
      constructor() {
        super();
        this.runTask(() => {
          this.createApplication();
          this.application.setupForTesting();
          this.application.injectTestHelpers();
          this.router.map(function () {
            this.route('posts', { resetNamespace: true }, function () {
              this.route('new');
              this.route('edit', { resetNamespace: true });
            });
          });
        });
        this.runTask(() => {
          this.application.advanceReadiness();
        });
      }

      [`@test currentRouteName for '/'`](assert) {
        assert.expect(3);

        let { application: { testHelpers } } = this;
        return testHelpers.visit('/').then(() => {
          assert.equal(testHelpers.currentRouteName(), 'index', `should equal 'index'.`);
          assert.equal(testHelpers.currentPath(), 'index', `should equal 'index'.`);
          assert.equal(testHelpers.currentURL(), '/', `should equal '/'.`);
        });
      }

      [`@test currentRouteName for '/posts'`](assert) {
        assert.expect(3);

        let { application: { testHelpers } } = this;
        return testHelpers.visit('/posts').then(() => {
          assert.equal(testHelpers.currentRouteName(), 'posts.index', `should equal 'posts.index'.`);
          assert.equal(testHelpers.currentPath(), 'posts.index', `should equal 'posts.index'.`);
          assert.equal(testHelpers.currentURL(), '/posts', `should equal '/posts'.`);
        });
      }

      [`@test currentRouteName for '/posts/new'`](assert) {
        assert.expect(3);

        let { application: { testHelpers } } = this;
        return testHelpers.visit('/posts/new').then(() => {
          assert.equal(testHelpers.currentRouteName(), 'posts.new', `should equal 'posts.new'.`);
          assert.equal(testHelpers.currentPath(), 'posts.new', `should equal 'posts.new'.`);
          assert.equal(testHelpers.currentURL(), '/posts/new', `should equal '/posts/new'.`);
        });
      }

      [`@test currentRouteName for '/posts/edit'`](assert) {
        assert.expect(3);

        let { application: { testHelpers } } = this;
        return testHelpers.visit('/posts/edit').then(() => {
          assert.equal(testHelpers.currentRouteName(), 'edit', `should equal 'edit'.`);
          assert.equal(testHelpers.currentPath(), 'posts.edit', `should equal 'posts.edit'.`);
          assert.equal(testHelpers.currentURL(), '/posts/edit', `should equal '/posts/edit'.`);
        });
      }
    });

    (0, _internalTestHelpers.moduleFor)('ember-testing: pendingRequests', class extends HelpersApplicationTestCase {
      trigger(type, xhr) {
        (0, _views.jQuery)(document).trigger(type, xhr);
      }

      [`@test pendingRequests is maintained for ajaxSend and ajaxComplete events`](assert) {
        let done = assert.async();
        assert.equal((0, _pending_requests.pendingRequests)(), 0);

        let xhr = { some: 'xhr' };

        this.trigger('ajaxSend', xhr);
        assert.equal((0, _pending_requests.pendingRequests)(), 1, 'Ember.Test.pendingRequests was incremented');

        this.trigger('ajaxComplete', xhr);
        setTimeout(function () {
          assert.equal((0, _pending_requests.pendingRequests)(), 0, 'Ember.Test.pendingRequests was decremented');
          done();
        }, 0);
      }

      [`@test pendingRequests is ignores ajaxComplete events from past setupForTesting calls`](assert) {
        assert.equal((0, _pending_requests.pendingRequests)(), 0);

        let xhr = { some: 'xhr' };

        this.trigger('ajaxSend', xhr);
        assert.equal((0, _pending_requests.pendingRequests)(), 1, 'Ember.Test.pendingRequests was incremented');

        (0, _setup_for_testing.default)();

        assert.equal((0, _pending_requests.pendingRequests)(), 0, 'Ember.Test.pendingRequests was reset');

        let altXhr = { some: 'more xhr' };

        this.trigger('ajaxSend', altXhr);
        assert.equal((0, _pending_requests.pendingRequests)(), 1, 'Ember.Test.pendingRequests was incremented');

        this.trigger('ajaxComplete', xhr);
        assert.equal((0, _pending_requests.pendingRequests)(), 1, 'Ember.Test.pendingRequests is not impressed with your unexpected complete');
      }

      [`@test pendingRequests is reset by setupForTesting`](assert) {
        (0, _pending_requests.incrementPendingRequests)();

        (0, _setup_for_testing.default)();

        assert.equal((0, _pending_requests.pendingRequests)(), 0, 'pendingRequests is reset');
      }
    });

    (0, _internalTestHelpers.moduleFor)('ember-testing: async router', class extends HelpersTestCase {
      constructor() {
        super();

        this.runTask(() => {
          this.createApplication();

          this.router.map(function () {
            this.route('user', { resetNamespace: true }, function () {
              this.route('profile');
              this.route('edit');
            });
          });

          // Emulate a long-running unscheduled async operation.
          let resolveLater = () => new _runtime.RSVP.Promise(resolve => {
            /*
            * The wait() helper has a 10ms tick. We should resolve() after
            * at least one tick to test whether wait() held off while the
            * async router was still loading. 20ms should be enough.
            */
            (0, _runloop.later)(resolve, { firstName: 'Tom' }, 20);
          });

          this.add('route:user', _routing.Route.extend({
            model() {
              return resolveLater();
            }
          }));

          this.add('route:user.profile', _routing.Route.extend({
            beforeModel() {
              return resolveLater().then(() => this.transitionTo('user.edit'));
            }
          }));

          this.application.setupForTesting();
        });

        this.application.injectTestHelpers();
        this.runTask(() => {
          this.application.advanceReadiness();
        });
      }

      [`@test currentRouteName for '/user'`](assert) {
        assert.expect(4);

        let { application: { testHelpers } } = this;
        return testHelpers.visit('/user').then(() => {
          assert.equal(testHelpers.currentRouteName(), 'user.index', `should equal 'user.index'.`);
          assert.equal(testHelpers.currentPath(), 'user.index', `should equal 'user.index'.`);
          assert.equal(testHelpers.currentURL(), '/user', `should equal '/user'.`);
          let userRoute = this.applicationInstance.lookup('route:user');
          assert.equal(userRoute.get('controller.model.firstName'), 'Tom', `should equal 'Tom'.`);
        });
      }

      [`@test currentRouteName for '/user/profile'`](assert) {
        assert.expect(4);

        let { application: { testHelpers } } = this;
        return testHelpers.visit('/user/profile').then(() => {
          assert.equal(testHelpers.currentRouteName(), 'user.edit', `should equal 'user.edit'.`);
          assert.equal(testHelpers.currentPath(), 'user.edit', `should equal 'user.edit'.`);
          assert.equal(testHelpers.currentURL(), '/user/edit', `should equal '/user/edit'.`);
          let userRoute = this.applicationInstance.lookup('route:user');
          assert.equal(userRoute.get('controller.model.firstName'), 'Tom', `should equal 'Tom'.`);
        });
      }
    });

    (0, _internalTestHelpers.moduleFor)('ember-testing: can override built-in helpers', class extends HelpersTestCase {
      constructor() {
        super();
        this.runTask(() => {
          this.createApplication();
          this.application.setupForTesting();
        });
        this._originalVisitHelper = _test.default._helpers.visit;
        this._originalFindHelper = _test.default._helpers.find;
      }

      teardown() {
        _test.default._helpers.visit = this._originalVisitHelper;
        _test.default._helpers.find = this._originalFindHelper;
        super.teardown();
      }

      [`@test can override visit helper`](assert) {
        assert.expect(1);

        _test.default.registerHelper('visit', () => {
          assert.ok(true, 'custom visit helper was called');
        });

        this.application.injectTestHelpers();

        return this.application.testHelpers.visit();
      }

      [`@test can override find helper`](assert) {
        assert.expect(1);

        _test.default.registerHelper('find', () => {
          assert.ok(true, 'custom find helper was called');

          return ['not empty array'];
        });

        this.application.injectTestHelpers();

        return this.application.testHelpers.findWithAssert('.who-cares');
      }
    });
  }
});
enifed('ember-testing/tests/integration_test', ['internal-test-helpers', 'ember-testing/lib/test', '@ember/-internals/runtime', '@ember/-internals/routing', '@ember/-internals/views'], function (_internalTestHelpers, _test, _runtime, _routing, _views) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('ember-testing Integration tests of acceptance', class extends _internalTestHelpers.AutobootApplicationTestCase {
    constructor() {
      super();

      this.modelContent = [];
      this._originalAdapter = _test.default.adapter;

      this.runTask(() => {
        this.createApplication();

        this.addTemplate('people', `
        <div>
          {{#each model as |person|}}
            <div class="name">{{person.firstName}}</div>
          {{/each}}
        </div>
      `);

        this.router.map(function () {
          this.route('people', { path: '/' });
        });

        this.add('route:people', _routing.Route.extend({
          model: () => this.modelContent
        }));

        this.application.setupForTesting();
      });

      this.runTask(() => {
        this.application.reset();
      });

      this.application.injectTestHelpers();
    }

    teardown() {
      super.teardown();
      _test.default.adapter = this._originalAdapter;
    }

    [`@test template is bound to empty array of people`](assert) {
      if (!_views.jQueryDisabled) {
        this.runTask(() => this.application.advanceReadiness());
        window.visit('/').then(() => {
          let rows = window.find('.name').length;
          assert.equal(rows, 0, 'successfully stubbed an empty array of people');
        });
      } else {
        this.runTask(() => this.application.advanceReadiness());
        window.visit('/').then(() => {
          expectAssertion(() => window.find('.name'), 'If jQuery is disabled, please import and use helpers from @ember/test-helpers [https://github.com/emberjs/ember-test-helpers]. Note: `find` is not an available helper.');
        });
      }
    }

    [`@test template is bound to array of 2 people`](assert) {
      if (!_views.jQueryDisabled) {
        this.modelContent = (0, _runtime.A)([]);
        this.modelContent.pushObject({ firstName: 'x' });
        this.modelContent.pushObject({ firstName: 'y' });

        this.runTask(() => this.application.advanceReadiness());
        window.visit('/').then(() => {
          let rows = window.find('.name').length;
          assert.equal(rows, 2, 'successfully stubbed a non empty array of people');
        });
      } else {
        assert.expect(0);
      }
    }

    [`@test 'visit' can be called without advanceReadiness.`](assert) {
      if (!_views.jQueryDisabled) {
        window.visit('/').then(() => {
          let rows = window.find('.name').length;
          assert.equal(rows, 0, 'stubbed an empty array of people without calling advanceReadiness.');
        });
      } else {
        assert.expect(0);
      }
    }
  });
});
enifed('ember-testing/tests/reexports_test', ['ember', 'internal-test-helpers'], function (_ember, _internalTestHelpers) {
  'use strict';

  class ReexportsTestCase extends _internalTestHelpers.AbstractTestCase {}

  [
  // ember-testing
  ['Test', 'ember-testing'], ['Test.Adapter', 'ember-testing', 'Adapter'], ['Test.QUnitAdapter', 'ember-testing', 'QUnitAdapter'], ['setupForTesting', 'ember-testing']].forEach(reexport => {
    let [path, moduleId, exportName] = reexport;

    // default path === exportName if none present
    if (!exportName) {
      exportName = path;
    }

    ReexportsTestCase.prototype[`@test Ember.${path} exports correctly`] = function (assert) {
      (0, _internalTestHelpers.confirmExport)(_ember.default, assert, path, moduleId, exportName);
    };
  });

  (0, _internalTestHelpers.moduleFor)('ember-testing reexports', ReexportsTestCase);
});
enifed('ember-testing/tests/test/waiters-test', ['ember-testing/lib/test/waiters', 'internal-test-helpers'], function (_waiters, _internalTestHelpers) {
  'use strict';

  class Waiters {
    constructor() {
      this._waiters = [];
    }

    add() {
      this._waiters.push([...arguments]);
    }

    register() {
      this.forEach((...args) => {
        (0, _waiters.registerWaiter)(...args);
      });
    }

    unregister() {
      this.forEach((...args) => {
        (0, _waiters.unregisterWaiter)(...args);
      });
    }

    forEach(callback) {
      for (let i = 0; i < this._waiters.length; i++) {
        let args = this._waiters[i];

        callback(...args);
      }
    }

    check() {
      this.register();
      let result = (0, _waiters.checkWaiters)();
      this.unregister();

      return result;
    }
  }

  (0, _internalTestHelpers.moduleFor)('ember-testing: waiters', class extends _internalTestHelpers.AbstractTestCase {
    constructor() {
      super();
      this.waiters = new Waiters();
    }

    teardown() {
      this.waiters.unregister();
    }

    ['@test registering a waiter'](assert) {
      assert.expect(2);

      let obj = { foo: true };

      this.waiters.add(obj, function () {
        assert.ok(this.foo, 'has proper `this` context');
        return true;
      });

      this.waiters.add(function () {
        assert.ok(true, 'is called');
        return true;
      });

      this.waiters.check();
    }

    ['@test unregistering a waiter'](assert) {
      assert.expect(2);

      let obj = { foo: true };

      this.waiters.add(obj, function () {
        assert.ok(true, 'precond - waiter with context is registered');
        return true;
      });

      this.waiters.add(function () {
        assert.ok(true, 'precond - waiter without context is registered');
        return true;
      });

      this.waiters.check();
      this.waiters.unregister();

      (0, _waiters.checkWaiters)();
    }

    ['@test checkWaiters returns false if all waiters return true'](assert) {
      assert.expect(3);

      this.waiters.add(function () {
        assert.ok(true, 'precond - waiter is registered');

        return true;
      });

      this.waiters.add(function () {
        assert.ok(true, 'precond - waiter is registered');

        return true;
      });

      assert.notOk(this.waiters.check(), 'checkWaiters returns true if all waiters return true');
    }

    ['@test checkWaiters returns true if any waiters return false'](assert) {
      assert.expect(3);

      this.waiters.add(function () {
        assert.ok(true, 'precond - waiter is registered');

        return true;
      });

      this.waiters.add(function () {
        assert.ok(true, 'precond - waiter is registered');

        return false;
      });

      assert.ok(this.waiters.check(), 'checkWaiters returns false if any waiters return false');
    }

    ['@test checkWaiters short circuits after first falsey waiter'](assert) {
      assert.expect(2);

      this.waiters.add(function () {
        assert.ok(true, 'precond - waiter is registered');

        return false;
      });

      this.waiters.add(function () {
        assert.notOk(true, 'waiter should not be called');
      });

      assert.ok(this.waiters.check(), 'checkWaiters returns false if any waiters return false');
    }
  });
});
enifed('ember/tests/application_lifecycle_test', ['internal-test-helpers', '@ember/application', '@ember/-internals/routing', '@ember/-internals/glimmer', '@ember/debug'], function (_internalTestHelpers, _application, _routing, _glimmer, _debug) {
  'use strict';

  const originalDebug = (0, _debug.getDebugFunction)('debug');
  const noop = function () {};

  (0, _internalTestHelpers.moduleFor)('Application Lifecycle - route hooks', class extends _internalTestHelpers.AutobootApplicationTestCase {
    createApplication() {
      let application = super.createApplication(...arguments);
      this.add('router:main', _routing.Router.extend({
        location: 'none'
      }));
      return application;
    }

    constructor() {
      (0, _debug.setDebugFunction)('debug', noop);
      super();
      let menuItem = this.menuItem = {};

      this.runTask(() => {
        this.createApplication();

        let SettingRoute = _routing.Route.extend({
          setupController() {
            this.controller.set('selectedMenuItem', menuItem);
          },
          deactivate() {
            this.controller.set('selectedMenuItem', null);
          }
        });
        this.add('route:index', SettingRoute);
        this.add('route:application', SettingRoute);
      });
    }

    teardown() {
      (0, _debug.setDebugFunction)('debug', originalDebug);
    }

    get indexController() {
      return this.applicationInstance.lookup('controller:index');
    }

    get applicationController() {
      return this.applicationInstance.lookup('controller:application');
    }

    [`@test Resetting the application allows controller properties to be set when a route deactivates`](assert) {
      let { indexController, applicationController } = this;
      assert.equal(indexController.get('selectedMenuItem'), this.menuItem);
      assert.equal(applicationController.get('selectedMenuItem'), this.menuItem);

      this.application.reset();

      assert.equal(indexController.get('selectedMenuItem'), null);
      assert.equal(applicationController.get('selectedMenuItem'), null);
    }

    [`@test Destroying the application resets the router before the appInstance is destroyed`](assert) {
      let { indexController, applicationController } = this;
      assert.equal(indexController.get('selectedMenuItem'), this.menuItem);
      assert.equal(applicationController.get('selectedMenuItem'), this.menuItem);

      this.runTask(() => {
        this.application.destroy();
      });

      assert.equal(indexController.get('selectedMenuItem'), null);
      assert.equal(applicationController.get('selectedMenuItem'), null);
    }
  });

  (0, _internalTestHelpers.moduleFor)('Application Lifecycle', class extends _internalTestHelpers.AutobootApplicationTestCase {
    createApplication() {
      let application = super.createApplication(...arguments);
      this.add('router:main', _routing.Router.extend({
        location: 'none'
      }));
      return application;
    }

    [`@test Destroying a route after the router does create an undestroyed 'toplevelView'`](assert) {
      this.runTask(() => {
        this.createApplication();
        this.addTemplate('index', `Index!`);
        this.addTemplate('application', `Application! {{outlet}}`);
      });

      let router = this.applicationInstance.lookup('router:main');
      let route = this.applicationInstance.lookup('route:index');

      this.runTask(() => router.destroy());
      assert.equal(router._toplevelView, null, 'the toplevelView was cleared');

      this.runTask(() => route.destroy());
      assert.equal(router._toplevelView, null, 'the toplevelView was not reinitialized');

      this.runTask(() => this.application.destroy());
      assert.equal(router._toplevelView, null, 'the toplevelView was not reinitialized');
    }

    [`@test initializers can augment an applications customEvents hash`](assert) {
      assert.expect(1);

      let MyApplication = _application.default.extend();

      MyApplication.initializer({
        name: 'customize-things',
        initialize(application) {
          application.customEvents = {
            wowza: 'wowza'
          };
        }
      });

      this.runTask(() => {
        this.createApplication({}, MyApplication);

        this.add('component:foo-bar', _glimmer.Component.extend({
          wowza() {
            assert.ok(true, 'fired the event!');
          }
        }));

        this.addTemplate('application', `{{foo-bar}}`);
        this.addTemplate('components/foo-bar', `<div id='wowza-thingy'></div>`);
      });

      this.$('#wowza-thingy').trigger('wowza');
    }

    [`@test instanceInitializers can augment an the customEvents hash`](assert) {
      assert.expect(1);

      let MyApplication = _application.default.extend();

      MyApplication.instanceInitializer({
        name: 'customize-things',
        initialize(application) {
          application.customEvents = {
            herky: 'jerky'
          };
        }
      });
      this.runTask(() => {
        this.createApplication({}, MyApplication);

        this.add('component:foo-bar', _glimmer.Component.extend({
          jerky() {
            assert.ok(true, 'fired the event!');
          }
        }));

        this.addTemplate('application', `{{foo-bar}}`);
        this.addTemplate('components/foo-bar', `<div id='herky-thingy'></div>`);
      });

      this.$('#herky-thingy').trigger('herky');
    }
  });
});
enifed('ember/tests/component_context_test', ['@ember/controller', '@ember/-internals/glimmer', 'internal-test-helpers'], function (_controller, _glimmer, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Application Lifecycle - Component Context', class extends _internalTestHelpers.ApplicationTestCase {
    ['@test Components with a block should have the proper content when a template is provided'](assert) {
      this.addTemplate('application', `
      <div id='wrapper'>
        {{#my-component}}{{text}}{{/my-component}}
      </div>
    `);

      this.add('controller:application', _controller.default.extend({
        text: 'outer'
      }));
      this.addComponent('my-component', {
        ComponentClass: _glimmer.Component.extend({
          text: 'inner'
        }),
        template: `{{text}}-{{yield}}`
      });

      return this.visit('/').then(() => {
        let text = (0, _internalTestHelpers.getTextOf)(this.element.querySelector('#wrapper'));
        assert.equal(text, 'inner-outer', 'The component is composed correctly');
      });
    }

    ['@test Components with a block should yield the proper content without a template provided'](assert) {
      this.addTemplate('application', `
      <div id='wrapper'>
        {{#my-component}}{{text}}{{/my-component}}
      </div>
    `);

      this.add('controller:application', _controller.default.extend({
        text: 'outer'
      }));
      this.addComponent('my-component', {
        ComponentClass: _glimmer.Component.extend({
          text: 'inner'
        })
      });

      return this.visit('/').then(() => {
        let text = (0, _internalTestHelpers.getTextOf)(this.element.querySelector('#wrapper'));
        assert.equal(text, 'outer', 'The component is composed correctly');
      });
    }
    ['@test Components without a block should have the proper content when a template is provided'](assert) {
      this.addTemplate('application', `
      <div id='wrapper'>{{my-component}}</div>
    `);

      this.add('controller:application', _controller.default.extend({
        text: 'outer'
      }));
      this.addComponent('my-component', {
        ComponentClass: _glimmer.Component.extend({
          text: 'inner'
        }),
        template: '{{text}}'
      });

      return this.visit('/').then(() => {
        let text = (0, _internalTestHelpers.getTextOf)(this.element.querySelector('#wrapper'));
        assert.equal(text, 'inner', 'The component is composed correctly');
      });
    }

    ['@test Components without a block should have the proper content'](assert) {
      this.addTemplate('application', `
      <div id='wrapper'>{{my-component}}</div>
    `);

      this.add('controller:application', _controller.default.extend({
        text: 'outer'
      }));
      this.addComponent('my-component', {
        ComponentClass: _glimmer.Component.extend({
          didInsertElement() {
            this.element.innerHTML = 'Some text inserted';
          }
        })
      });

      return this.visit('/').then(() => {
        let text = (0, _internalTestHelpers.getTextOf)(this.element.querySelector('#wrapper'));
        assert.equal(text, 'Some text inserted', 'The component is composed correctly');
      });
    }

    ['@test properties of a component without a template should not collide with internal structures [DEPRECATED]'](assert) {
      this.addTemplate('application', `
      <div id='wrapper'>{{my-component data=foo}}</div>`);

      this.add('controller:application', _controller.default.extend({
        text: 'outer',
        foo: 'Some text inserted'
      }));
      this.addComponent('my-component', {
        ComponentClass: _glimmer.Component.extend({
          didInsertElement() {
            this.element.innerHTML = this.get('data');
          }
        })
      });

      return this.visit('/').then(() => {
        let text = (0, _internalTestHelpers.getTextOf)(this.element.querySelector('#wrapper'));
        assert.equal(text, 'Some text inserted', 'The component is composed correctly');
      });
    }

    ['@test attrs property of a component without a template should not collide with internal structures'](assert) {
      this.addTemplate('application', `
      <div id='wrapper'>{{my-component attrs=foo}}</div>
    `);

      this.add('controller:application', _controller.default.extend({
        text: 'outer',
        foo: 'Some text inserted'
      }));
      this.addComponent('my-component', {
        ComponentClass: _glimmer.Component.extend({
          didInsertElement() {
            this.element.innerHTML = this.get('attrs.attrs.value');
          }
        })
      });

      return this.visit('/').then(() => {
        let text = (0, _internalTestHelpers.getTextOf)(this.element.querySelector('#wrapper'));
        assert.equal(text, 'Some text inserted', 'The component is composed correctly');
      });
    }

    ['@test Components trigger actions in the parents context when called from within a block'](assert) {
      this.addTemplate('application', `
      <div id='wrapper'>
        {{#my-component}}
          <a href='#' id='fizzbuzz' {{action 'fizzbuzz'}}>Fizzbuzz</a>
        {{/my-component}}
      </div>
    `);

      this.add('controller:application', _controller.default.extend({
        actions: {
          fizzbuzz() {
            assert.ok(true, 'action triggered on parent');
          }
        }
      }));
      this.addComponent('my-component', {
        ComponentClass: _glimmer.Component.extend({})
      });

      return this.visit('/').then(() => {
        this.$('#fizzbuzz', '#wrapper').click();
      });
    }

    ['@test Components trigger actions in the components context when called from within its template'](assert) {
      this.addTemplate('application', `
      <div id='wrapper'>{{#my-component}}{{text}}{{/my-component}}</div>
    `);

      this.add('controller:application', _controller.default.extend({
        actions: {
          fizzbuzz() {
            assert.ok(false, 'action on the wrong context');
          }
        }
      }));
      this.addComponent('my-component', {
        ComponentClass: _glimmer.Component.extend({
          actions: {
            fizzbuzz() {
              assert.ok(true, 'action triggered on component');
            }
          }
        }),
        template: `<a href='#' id='fizzbuzz' {{action 'fizzbuzz'}}>Fizzbuzz</a>`
      });

      return this.visit('/').then(() => {
        this.$('#fizzbuzz', '#wrapper').click();
      });
    }
  });
});
enifed('ember/tests/component_registration_test', ['@ember/application', '@ember/controller', '@ember/-internals/glimmer', 'ember-template-compiler', 'internal-test-helpers', '@ember/-internals/environment'], function (_application, _controller, _glimmer, _emberTemplateCompiler, _internalTestHelpers, _environment) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Application Lifecycle - Component Registration', class extends _internalTestHelpers.ApplicationTestCase {
    // This is necessary for this.application.instanceInitializer to not leak between tests
    createApplication(options) {
      return super.createApplication(options, _application.default.extend());
    }

    ['@test The helper becomes the body of the component']() {
      this.addTemplate('components/expand-it', '<p>hello {{yield}}</p>');
      this.addTemplate('application', 'Hello world {{#expand-it}}world{{/expand-it}}');

      return this.visit('/').then(() => {
        this.assertText('Hello world hello world');
        this.assertComponentElement(this.element.firstElementChild, {
          tagName: 'div',
          content: '<p>hello world</p>'
        });
      });
    }

    ['@test The helper becomes the body of the component (ENV._TEMPLATE_ONLY_GLIMMER_COMPONENTS = true;)']() {
      _environment.ENV._TEMPLATE_ONLY_GLIMMER_COMPONENTS = true;
      this.addTemplate('components/expand-it', '<p>hello {{yield}}</p>');
      this.addTemplate('application', 'Hello world {{#expand-it}}world{{/expand-it}}');

      return this.visit('/').then(() => {
        this.assertInnerHTML('Hello world <p>hello world</p>');
        _environment.ENV._TEMPLATE_ONLY_GLIMMER_COMPONENTS = false;
      });
    }

    ['@test If a component is registered, it is used'](assert) {
      this.addTemplate('components/expand-it', '<p>hello {{yield}}</p>');
      this.addTemplate('application', `Hello world {{#expand-it}}world{{/expand-it}}`);

      this.application.instanceInitializer({
        name: 'expand-it-component',
        initialize(applicationInstance) {
          applicationInstance.register('component:expand-it', _glimmer.Component.extend({
            classNames: 'testing123'
          }));
        }
      });

      return this.visit('/').then(() => {
        let text = this.$('div.testing123').text().trim();
        assert.equal(text, 'hello world', 'The component is composed correctly');
      });
    }

    ['@test Late-registered components can be rendered with custom `layout` property'](assert) {
      this.addTemplate('application', `<div id='wrapper'>there goes {{my-hero}}</div>`);

      this.application.instanceInitializer({
        name: 'my-hero-component',
        initialize(applicationInstance) {
          applicationInstance.register('component:my-hero', _glimmer.Component.extend({
            classNames: 'testing123',
            layout: (0, _emberTemplateCompiler.compile)('watch him as he GOES')
          }));
        }
      });

      return this.visit('/').then(() => {
        let text = this.$('#wrapper').text().trim();
        assert.equal(text, 'there goes watch him as he GOES', 'The component is composed correctly');
      });
    }

    ['@test Late-registered components can be rendered with template registered on the container'](assert) {
      this.addTemplate('application', `<div id='wrapper'>hello world {{sally-rutherford}}-{{#sally-rutherford}}!!!{{/sally-rutherford}}</div>`);

      this.application.instanceInitializer({
        name: 'sally-rutherford-component-template',
        initialize(applicationInstance) {
          applicationInstance.register('template:components/sally-rutherford', (0, _emberTemplateCompiler.compile)('funkytowny{{yield}}'));
        }
      });
      this.application.instanceInitializer({
        name: 'sally-rutherford-component',
        initialize(applicationInstance) {
          applicationInstance.register('component:sally-rutherford', _glimmer.Component);
        }
      });

      return this.visit('/').then(() => {
        let text = this.$('#wrapper').text().trim();
        assert.equal(text, 'hello world funkytowny-funkytowny!!!', 'The component is composed correctly');
      });
    }

    ['@test Late-registered components can be rendered with ONLY the template registered on the container'](assert) {
      this.addTemplate('application', `<div id='wrapper'>hello world {{borf-snorlax}}-{{#borf-snorlax}}!!!{{/borf-snorlax}}</div>`);

      this.application.instanceInitializer({
        name: 'borf-snorlax-component-template',
        initialize(applicationInstance) {
          applicationInstance.register('template:components/borf-snorlax', (0, _emberTemplateCompiler.compile)('goodfreakingTIMES{{yield}}'));
        }
      });

      return this.visit('/').then(() => {
        let text = this.$('#wrapper').text().trim();
        assert.equal(text, 'hello world goodfreakingTIMES-goodfreakingTIMES!!!', 'The component is composed correctly');
      });
    }

    ['@test Assigning layoutName to a component should setup the template as a layout'](assert) {
      assert.expect(1);

      this.addTemplate('application', `<div id='wrapper'>{{#my-component}}{{text}}{{/my-component}}</div>`);
      this.addTemplate('foo-bar-baz', '{{text}}-{{yield}}');

      this.application.instanceInitializer({
        name: 'application-controller',
        initialize(applicationInstance) {
          applicationInstance.register('controller:application', _controller.default.extend({
            text: 'outer'
          }));
        }
      });
      this.application.instanceInitializer({
        name: 'my-component-component',
        initialize(applicationInstance) {
          applicationInstance.register('component:my-component', _glimmer.Component.extend({
            text: 'inner',
            layoutName: 'foo-bar-baz'
          }));
        }
      });

      return this.visit('/').then(() => {
        let text = this.$('#wrapper').text().trim();
        assert.equal(text, 'inner-outer', 'The component is composed correctly');
      });
    }

    ['@test Assigning layoutName and layout to a component should use the `layout` value'](assert) {
      assert.expect(1);

      this.addTemplate('application', `<div id='wrapper'>{{#my-component}}{{text}}{{/my-component}}</div>`);
      this.addTemplate('foo-bar-baz', 'No way!');

      this.application.instanceInitializer({
        name: 'application-controller-layout',
        initialize(applicationInstance) {
          applicationInstance.register('controller:application', _controller.default.extend({
            text: 'outer'
          }));
        }
      });
      this.application.instanceInitializer({
        name: 'my-component-component-layout',
        initialize(applicationInstance) {
          applicationInstance.register('component:my-component', _glimmer.Component.extend({
            text: 'inner',
            layoutName: 'foo-bar-baz',
            layout: (0, _emberTemplateCompiler.compile)('{{text}}-{{yield}}')
          }));
        }
      });

      return this.visit('/').then(() => {
        let text = this.$('#wrapper').text().trim();
        assert.equal(text, 'inner-outer', 'The component is composed correctly');
      });
    }

    ['@test Using name of component that does not exist']() {
      this.addTemplate('application', `<div id='wrapper'>{{#no-good}} {{/no-good}}</div>`);

      // TODO: Use the async form of expectAssertion here when it is available
      expectAssertion(() => {
        this.visit('/');
      }, /.* named "no-good" .*/);

      return this.runLoopSettled();
    }
  });
});
enifed('ember/tests/controller_test', ['@ember/controller', 'internal-test-helpers', '@ember/-internals/glimmer'], function (_controller, _internalTestHelpers, _glimmer) {
  'use strict';

  /*
   In Ember 1.x, controllers subtly affect things like template scope
   and action targets in exciting and often inscrutable ways. This test
   file contains integration tests that verify the correct behavior of
   the many parts of the system that change and rely upon controller scope,
   from the runtime up to the templating layer.
  */

  (0, _internalTestHelpers.moduleFor)('Template scoping examples', class extends _internalTestHelpers.ApplicationTestCase {
    ['@test Actions inside an outlet go to the associated controller'](assert) {
      this.add('controller:index', _controller.default.extend({
        actions: {
          componentAction() {
            assert.ok(true, 'controller received the action');
          }
        }
      }));

      this.addComponent('component-with-action', {
        ComponentClass: _glimmer.Component.extend({
          classNames: ['component-with-action'],
          click() {
            this.action();
          }
        })
      });

      this.addTemplate('index', '{{component-with-action action=(action "componentAction")}}');

      return this.visit('/').then(() => {
        this.runTask(() => this.$('.component-with-action').click());
      });
    }
  });
});
enifed('ember/tests/error_handler_test', ['@ember/debug', '@ember/runloop', '@ember/-internals/error-handling', 'rsvp', 'internal-test-helpers'], function (_debug, _runloop, _errorHandling, _rsvp, _internalTestHelpers) {
  'use strict';

  let WINDOW_ONERROR;

  function runThatThrowsSync(message = 'Error for testing error handling') {
    return (0, _runloop.run)(() => {
      throw new Error(message);
    });
  }

  (0, _internalTestHelpers.moduleFor)('error_handler', class extends _internalTestHelpers.AbstractTestCase {
    beforeEach() {
      // capturing this outside of module scope to ensure we grab
      // the test frameworks own window.onerror to reset it
      WINDOW_ONERROR = window.onerror;
    }

    afterEach() {
      (0, _debug.setTesting)(_debug.isTesting);
      window.onerror = WINDOW_ONERROR;

      (0, _errorHandling.setOnerror)(undefined);
    }

    ['@test by default there is no onerror - sync run'](assert) {
      assert.strictEqual((0, _errorHandling.getOnerror)(), undefined, 'precond - there should be no Ember.onerror set by default');
      assert.throws(runThatThrowsSync, Error, 'errors thrown sync are catchable');
    }

    ['@test when Ember.onerror (which rethrows) is registered - sync run'](assert) {
      assert.expect(2);
      (0, _errorHandling.setOnerror)(function (error) {
        assert.ok(true, 'onerror called');
        throw error;
      });
      assert.throws(runThatThrowsSync, Error, 'error is thrown');
    }

    ['@test when Ember.onerror (which does not rethrow) is registered - sync run'](assert) {
      assert.expect(2);
      (0, _errorHandling.setOnerror)(function () {
        assert.ok(true, 'onerror called');
      });
      runThatThrowsSync();
      assert.ok(true, 'no error was thrown, Ember.onerror can intercept errors');
    }

    ['@test does not swallow exceptions by default (Ember.testing = true, no Ember.onerror) - sync run'](assert) {
      (0, _debug.setTesting)(true);

      let error = new Error('the error');
      assert.throws(() => {
        (0, _runloop.run)(() => {
          throw error;
        });
      }, error);
    }

    ['@test does not swallow exceptions by default (Ember.testing = false, no Ember.onerror) - sync run'](assert) {
      (0, _debug.setTesting)(false);
      let error = new Error('the error');
      assert.throws(() => {
        (0, _runloop.run)(() => {
          throw error;
        });
      }, error);
    }

    ['@test does not swallow exceptions (Ember.testing = false, Ember.onerror which rethrows) - sync run'](assert) {
      assert.expect(2);
      (0, _debug.setTesting)(false);

      (0, _errorHandling.setOnerror)(function (error) {
        assert.ok(true, 'Ember.onerror was called');
        throw error;
      });

      let error = new Error('the error');
      assert.throws(() => {
        (0, _runloop.run)(() => {
          throw error;
        });
      }, error);
    }

    ['@test Ember.onerror can intercept errors (aka swallow) by not rethrowing (Ember.testing = false) - sync run'](assert) {
      assert.expect(1);
      (0, _debug.setTesting)(false);

      (0, _errorHandling.setOnerror)(function () {
        assert.ok(true, 'Ember.onerror was called');
      });

      let error = new Error('the error');
      try {
        (0, _runloop.run)(() => {
          throw error;
        });
      } catch (e) {
        assert.notOk(true, 'Ember.onerror that does not rethrow is intentionally swallowing errors, try / catch wrapping does not see error');
      }
    }

    ['@test does not swallow exceptions by default (Ember.testing = true, no Ember.onerror) - async run'](assert) {
      let done = assert.async();
      let caughtByWindowOnerror;

      (0, _debug.setTesting)(true);

      window.onerror = function (message) {
        caughtByWindowOnerror = message;
        // prevent "bubbling" and therefore failing the test
        return true;
      };

      (0, _runloop.later)(() => {
        throw new Error('the error');
      }, 10);

      setTimeout(() => {
        assert.pushResult({
          result: /the error/.test(caughtByWindowOnerror),
          actual: caughtByWindowOnerror,
          expected: 'to include `the error`',
          message: 'error should bubble out to window.onerror, and therefore fail tests (due to QUnit implementing window.onerror)'
        });

        done();
      }, 20);
    }

    ['@test does not swallow exceptions by default (Ember.testing = false, no Ember.onerror) - async run'](assert) {
      let done = assert.async();
      let caughtByWindowOnerror;

      (0, _debug.setTesting)(false);

      window.onerror = function (message) {
        caughtByWindowOnerror = message;
        // prevent "bubbling" and therefore failing the test
        return true;
      };

      (0, _runloop.later)(() => {
        throw new Error('the error');
      }, 10);

      setTimeout(() => {
        assert.pushResult({
          result: /the error/.test(caughtByWindowOnerror),
          actual: caughtByWindowOnerror,
          expected: 'to include `the error`',
          message: 'error should bubble out to window.onerror, and therefore fail tests (due to QUnit implementing window.onerror)'
        });

        done();
      }, 20);
    }

    ['@test Ember.onerror can intercept errors (aka swallow) by not rethrowing (Ember.testing = false) - async run'](assert) {
      let done = assert.async();

      (0, _debug.setTesting)(false);

      window.onerror = function () {
        assert.notOk(true, 'window.onerror is never invoked when Ember.onerror intentionally swallows errors');
        // prevent "bubbling" and therefore failing the test
        return true;
      };

      let thrown = new Error('the error');
      (0, _errorHandling.setOnerror)(function (error) {
        assert.strictEqual(error, thrown, 'Ember.onerror is called with the error');
      });

      (0, _runloop.later)(() => {
        throw thrown;
      }, 10);

      setTimeout(done, 20);
    }

    [`@test errors in promise constructor when Ember.onerror which does not rethrow is present - rsvp`](assert) {
      assert.expect(1);

      let thrown = new Error('the error');
      (0, _errorHandling.setOnerror)(function (error) {
        assert.strictEqual(error, thrown, 'Ember.onerror is called for errors thrown in RSVP promises');
      });

      new _rsvp.default.Promise(() => {
        throw thrown;
      });

      // RSVP.Promise's are configured to settle within the run loop, this
      // ensures that run loop has completed
      return new _rsvp.default.Promise(resolve => setTimeout(resolve, 10));
    }

    [`@test errors in promise constructor when Ember.onerror which does rethrow is present - rsvp`](assert) {
      assert.expect(2);

      let thrown = new Error('the error');
      (0, _errorHandling.setOnerror)(function (error) {
        assert.strictEqual(error, thrown, 'Ember.onerror is called for errors thrown in RSVP promises');
        throw error;
      });

      window.onerror = function (message) {
        assert.pushResult({
          result: /the error/.test(message),
          actual: message,
          expected: 'to include `the error`',
          message: 'error should bubble out to window.onerror, and therefore fail tests (due to QUnit implementing window.onerror)'
        });

        // prevent "bubbling" and therefore failing the test
        return true;
      };

      new _rsvp.default.Promise(() => {
        throw thrown;
      });

      // RSVP.Promise's are configured to settle within the run loop, this
      // ensures that run loop has completed
      return new _rsvp.default.Promise(resolve => setTimeout(resolve, 10));
    }

    [`@test errors in promise constructor when Ember.onerror which does not rethrow is present (Ember.testing = false) - rsvp`](assert) {
      assert.expect(1);

      (0, _debug.setTesting)(false);
      let thrown = new Error('the error');
      (0, _errorHandling.setOnerror)(function (error) {
        assert.strictEqual(error, thrown, 'Ember.onerror is called for errors thrown in RSVP promises');
      });

      new _rsvp.default.Promise(() => {
        throw thrown;
      });

      // RSVP.Promise's are configured to settle within the run loop, this
      // ensures that run loop has completed
      return new _rsvp.default.Promise(resolve => setTimeout(resolve, 10));
    }

    [`@test errors in promise constructor when Ember.onerror which does rethrow is present (Ember.testing = false) - rsvp`](assert) {
      assert.expect(2);

      (0, _debug.setTesting)(false);
      let thrown = new Error('the error');
      (0, _errorHandling.setOnerror)(function (error) {
        assert.strictEqual(error, thrown, 'Ember.onerror is called for errors thrown in RSVP promises');
        throw error;
      });

      window.onerror = function (message) {
        assert.pushResult({
          result: /the error/.test(message),
          actual: message,
          expected: 'to include `the error`',
          message: 'error should bubble out to window.onerror, and therefore fail tests (due to QUnit implementing window.onerror)'
        });

        // prevent "bubbling" and therefore failing the test
        return true;
      };

      new _rsvp.default.Promise(() => {
        throw thrown;
      });

      // RSVP.Promise's are configured to settle within the run loop, this
      // ensures that run loop has completed
      return new _rsvp.default.Promise(resolve => setTimeout(resolve, 10));
    }

    [`@test errors in promise .then callback when Ember.onerror which does not rethrow is present - rsvp`](assert) {
      assert.expect(1);

      let thrown = new Error('the error');
      (0, _errorHandling.setOnerror)(function (error) {
        assert.strictEqual(error, thrown, 'Ember.onerror is called for errors thrown in RSVP promises');
      });

      _rsvp.default.resolve().then(() => {
        throw thrown;
      });

      // RSVP.Promise's are configured to settle within the run loop, this
      // ensures that run loop has completed
      return new _rsvp.default.Promise(resolve => setTimeout(resolve, 10));
    }

    [`@test errors in promise .then callback when Ember.onerror which does rethrow is present - rsvp`](assert) {
      assert.expect(2);

      let thrown = new Error('the error');
      (0, _errorHandling.setOnerror)(function (error) {
        assert.strictEqual(error, thrown, 'Ember.onerror is called for errors thrown in RSVP promises');
        throw error;
      });

      window.onerror = function (message) {
        assert.pushResult({
          result: /the error/.test(message),
          actual: message,
          expected: 'to include `the error`',
          message: 'error should bubble out to window.onerror, and therefore fail tests (due to QUnit implementing window.onerror)'
        });

        // prevent "bubbling" and therefore failing the test
        return true;
      };

      _rsvp.default.resolve().then(() => {
        throw thrown;
      });

      // RSVP.Promise's are configured to settle within the run loop, this
      // ensures that run loop has completed
      return new _rsvp.default.Promise(resolve => setTimeout(resolve, 10));
    }

    [`@test errors in promise .then callback when Ember.onerror which does not rethrow is present (Ember.testing = false) - rsvp`](assert) {
      assert.expect(1);

      (0, _debug.setTesting)(false);
      let thrown = new Error('the error');
      (0, _errorHandling.setOnerror)(function (error) {
        assert.strictEqual(error, thrown, 'Ember.onerror is called for errors thrown in RSVP promises');
      });

      _rsvp.default.resolve().then(() => {
        throw thrown;
      });

      // RSVP.Promise's are configured to settle within the run loop, this
      // ensures that run loop has completed
      return new _rsvp.default.Promise(resolve => setTimeout(resolve, 10));
    }

    [`@test errors in promise .then callback when Ember.onerror which does rethrow is present (Ember.testing = false) - rsvp`](assert) {
      assert.expect(2);

      (0, _debug.setTesting)(false);
      let thrown = new Error('the error');
      (0, _errorHandling.setOnerror)(function (error) {
        assert.strictEqual(error, thrown, 'Ember.onerror is called for errors thrown in RSVP promises');
        throw error;
      });

      window.onerror = function (message) {
        assert.pushResult({
          result: /the error/.test(message),
          actual: message,
          expected: 'to include `the error`',
          message: 'error should bubble out to window.onerror, and therefore fail tests (due to QUnit implementing window.onerror)'
        });

        // prevent "bubbling" and therefore failing the test
        return true;
      };

      _rsvp.default.resolve().then(() => {
        throw thrown;
      });

      // RSVP.Promise's are configured to settle within the run loop, this
      // ensures that run loop has completed
      return new _rsvp.default.Promise(resolve => setTimeout(resolve, 10));
    }

    [`@test errors in async promise .then callback when Ember.onerror which does not rethrow is present - rsvp`](assert) {
      assert.expect(1);

      let thrown = new Error('the error');
      (0, _errorHandling.setOnerror)(function (error) {
        assert.strictEqual(error, thrown, 'Ember.onerror is called for errors thrown in RSVP promises');
      });

      new _rsvp.default.Promise(resolve => setTimeout(resolve, 10)).then(() => {
        throw thrown;
      });

      // RSVP.Promise's are configured to settle within the run loop, this
      // ensures that run loop has completed
      return new _rsvp.default.Promise(resolve => setTimeout(resolve, 20));
    }

    [`@test errors in async promise .then callback when Ember.onerror which does rethrow is present - rsvp`](assert) {
      assert.expect(2);

      let thrown = new Error('the error');
      (0, _errorHandling.setOnerror)(function (error) {
        assert.strictEqual(error, thrown, 'Ember.onerror is called for errors thrown in RSVP promises');
        throw error;
      });

      window.onerror = function (message) {
        assert.pushResult({
          result: /the error/.test(message),
          actual: message,
          expected: 'to include `the error`',
          message: 'error should bubble out to window.onerror, and therefore fail tests (due to QUnit implementing window.onerror)'
        });

        // prevent "bubbling" and therefore failing the test
        return true;
      };

      new _rsvp.default.Promise(resolve => setTimeout(resolve, 10)).then(() => {
        throw thrown;
      });

      // RSVP.Promise's are configured to settle within the run loop, this
      // ensures that run loop has completed
      return new _rsvp.default.Promise(resolve => setTimeout(resolve, 20));
    }

    [`@test errors in async promise .then callback when Ember.onerror which does not rethrow is present (Ember.testing = false) - rsvp`](assert) {
      assert.expect(1);

      (0, _debug.setTesting)(false);
      let thrown = new Error('the error');
      (0, _errorHandling.setOnerror)(function (error) {
        assert.strictEqual(error, thrown, 'Ember.onerror is called for errors thrown in RSVP promises');
      });

      new _rsvp.default.Promise(resolve => setTimeout(resolve, 10)).then(() => {
        throw thrown;
      });

      // RSVP.Promise's are configured to settle within the run loop, this
      // ensures that run loop has completed
      return new _rsvp.default.Promise(resolve => setTimeout(resolve, 20));
    }

    [`@test errors in async promise .then callback when Ember.onerror which does rethrow is present (Ember.testing = false) - rsvp`](assert) {
      assert.expect(2);

      (0, _debug.setTesting)(false);
      let thrown = new Error('the error');
      (0, _errorHandling.setOnerror)(function (error) {
        assert.strictEqual(error, thrown, 'Ember.onerror is called for errors thrown in RSVP promises');
        throw error;
      });

      window.onerror = function (message) {
        assert.pushResult({
          result: /the error/.test(message),
          actual: message,
          expected: 'to include `the error`',
          message: 'error should bubble out to window.onerror, and therefore fail tests (due to QUnit implementing window.onerror)'
        });

        // prevent "bubbling" and therefore failing the test
        return true;
      };

      new _rsvp.default.Promise(resolve => setTimeout(resolve, 10)).then(() => {
        throw thrown;
      });

      // RSVP.Promise's are configured to settle within the run loop, this
      // ensures that run loop has completed
      return new _rsvp.default.Promise(resolve => setTimeout(resolve, 20));
    }
  });
});
enifed('ember/tests/helpers/helper_registration_test', ['internal-test-helpers', '@ember/controller', '@ember/service', '@ember/-internals/glimmer'], function (_internalTestHelpers, _controller, _service, _glimmer) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Application Lifecycle - Helper Registration', class extends _internalTestHelpers.ApplicationTestCase {
    ['@test Unbound dashed helpers registered on the container can be late-invoked'](assert) {
      this.addTemplate('application', `<div id='wrapper'>{{x-borf}} {{x-borf 'YES'}}</div>`);

      let myHelper = (0, _glimmer.helper)(params => params[0] || 'BORF');
      this.application.register('helper:x-borf', myHelper);

      return this.visit('/').then(() => {
        assert.equal(this.$('#wrapper').text(), 'BORF YES', 'The helper was invoked from the container');
      });
    }

    ['@test Bound helpers registered on the container can be late-invoked'](assert) {
      this.addTemplate('application', `<div id='wrapper'>{{x-reverse}} {{x-reverse foo}}</div>`);

      this.add('controller:application', _controller.default.extend({
        foo: 'alex'
      }));

      this.application.register('helper:x-reverse', (0, _glimmer.helper)(function ([value]) {
        return value ? value.split('').reverse().join('') : '--';
      }));

      return this.visit('/').then(() => {
        assert.equal(this.$('#wrapper').text(), '-- xela', 'The bound helper was invoked from the container');
      });
    }

    ['@test Undashed helpers registered on the container can be invoked'](assert) {
      this.addTemplate('application', `<div id='wrapper'>{{omg}}|{{yorp 'boo'}}|{{yorp 'ya'}}</div>`);

      this.application.register('helper:omg', (0, _glimmer.helper)(() => 'OMG'));

      this.application.register('helper:yorp', (0, _glimmer.helper)(([value]) => value));

      return this.visit('/').then(() => {
        assert.equal(this.$('#wrapper').text(), 'OMG|boo|ya', 'The helper was invoked from the container');
      });
    }

    ['@test Helpers can receive injections'](assert) {
      this.addTemplate('application', `<div id='wrapper'>{{full-name}}</div>`);

      let serviceCalled = false;

      this.add('service:name-builder', _service.default.extend({
        build() {
          serviceCalled = true;
        }
      }));

      this.add('helper:full-name', _glimmer.Helper.extend({
        nameBuilder: (0, _service.inject)('name-builder'),
        compute() {
          this.get('nameBuilder').build();
        }
      }));

      return this.visit('/').then(() => {
        assert.ok(serviceCalled, 'service was injected, method called');
      });
    }
  });
});
enifed('ember/tests/helpers/link_to_test', ['internal-test-helpers', '@ember/controller', '@ember/-internals/runtime', '@ember/-internals/metal', '@ember/instrumentation', '@ember/-internals/routing'], function (_internalTestHelpers, _controller, _runtime, _metal, _instrumentation, _routing) {
  'use strict';

  // IE includes the host name
  function normalizeUrl(url) {
    return url.replace(/https?:\/\/[^\/]+/, '');
  }

  function shouldNotBeActive(assert, element) {
    checkActive(assert, element, false);
  }

  function shouldBeActive(assert, element) {
    checkActive(assert, element, true);
  }

  function checkActive(assert, element, active) {
    let classList = element.attr('class');
    assert.equal(classList.indexOf('active') > -1, active, `${element} active should be ${active}`);
  }

  (0, _internalTestHelpers.moduleFor)('The {{link-to}} helper - basic tests', class extends _internalTestHelpers.ApplicationTestCase {
    constructor() {
      super();

      this.router.map(function () {
        this.route('about');
      });

      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      {{#link-to 'about' id='about-link'}}About{{/link-to}}
      {{#link-to 'index' id='self-link'}}Self{{/link-to}}
    `);
      this.addTemplate('about', `
      <h3 class="about">About</h3>
      {{#link-to 'index' id='home-link'}}Home{{/link-to}}
      {{#link-to 'about' id='self-link'}}Self{{/link-to}}
    `);
    }

    ['@test The {{link-to}} helper moves into the named route'](assert) {
      return this.visit('/').then(() => {
        assert.equal(this.$('h3.home').length, 1, 'The home template was rendered');
        assert.equal(this.$('#self-link.active').length, 1, 'The self-link was rendered with active class');
        assert.equal(this.$('#about-link:not(.active)').length, 1, 'The other link was rendered without active class');

        return this.click('#about-link');
      }).then(() => {
        assert.equal(this.$('h3.about').length, 1, 'The about template was rendered');
        assert.equal(this.$('#self-link.active').length, 1, 'The self-link was rendered with active class');
        assert.equal(this.$('#home-link:not(.active)').length, 1, 'The other link was rendered without active class');
      });
    }

    [`@test the {{link-to}} helper doesn't add an href when the tagName isn't 'a'`](assert) {
      this.addTemplate('index', `
      {{#link-to 'about' id='about-link' tagName='div'}}About{{/link-to}}
    `);

      return this.visit('/').then(() => {
        assert.equal(this.$('#about-link').attr('href'), undefined, 'there is no href attribute');
      });
    }

    [`@test the {{link-to}} applies a 'disabled' class when disabled`](assert) {
      this.addTemplate('index', `
      {{#link-to "about" id="about-link-static" disabledWhen="shouldDisable"}}About{{/link-to}}
      {{#link-to "about" id="about-link-dynamic" disabledWhen=dynamicDisabledWhen}}About{{/link-to}}
    `);

      this.add('controller:index', _controller.default.extend({
        shouldDisable: true,
        dynamicDisabledWhen: 'shouldDisable'
      }));

      return this.visit('/').then(() => {
        assert.equal(this.$('#about-link-static.disabled').length, 1, 'The static link is disabled when its disabledWhen is true');
        assert.equal(this.$('#about-link-dynamic.disabled').length, 1, 'The dynamic link is disabled when its disabledWhen is true');

        let controller = this.applicationInstance.lookup('controller:index');
        this.runTask(() => controller.set('dynamicDisabledWhen', false));

        assert.equal(this.$('#about-link-dynamic.disabled').length, 0, 'The dynamic link is re-enabled when its disabledWhen becomes false');
      });
    }

    [`@test the {{link-to}} doesn't apply a 'disabled' class if disabledWhen is not provided`](assert) {
      this.addTemplate('index', `{{#link-to "about" id="about-link"}}About{{/link-to}}`);

      return this.visit('/').then(() => {
        assert.ok(!this.$('#about-link').hasClass('disabled'), 'The link is not disabled if disabledWhen not provided');
      });
    }

    [`@test the {{link-to}} helper supports a custom disabledClass`](assert) {
      this.addTemplate('index', `
      {{#link-to "about" id="about-link" disabledWhen=true disabledClass="do-not-want"}}About{{/link-to}}
    `);

      return this.visit('/').then(() => {
        assert.equal(this.$('#about-link.do-not-want').length, 1, 'The link can apply a custom disabled class');
      });
    }

    [`@test the {{link-to}} helper supports a custom disabledClass set via bound param`](assert) {
      this.addTemplate('index', `
      {{#link-to "about" id="about-link" disabledWhen=true disabledClass=disabledClass}}About{{/link-to}}
    `);

      this.add('controller:index', _controller.default.extend({
        disabledClass: 'do-not-want'
      }));

      return this.visit('/').then(() => {
        assert.equal(this.$('#about-link.do-not-want').length, 1, 'The link can apply a custom disabled class via bound param');
      });
    }

    [`@test the {{link-to}} helper does not respond to clicks when disabledWhen`](assert) {
      this.addTemplate('index', `
      {{#link-to "about" id="about-link" disabledWhen=true}}About{{/link-to}}
    `);

      return this.visit('/').then(() => {
        return this.click('#about-link');
      }).then(() => {
        assert.equal(this.$('h3.about').length, 0, 'Transitioning did not occur');
      });
    }

    [`@test the {{link-to}} helper does not respond to clicks when disabled`](assert) {
      this.addTemplate('index', `
      {{#link-to "about" id="about-link" disabled=true}}About{{/link-to}}
    `);

      return this.visit('/').then(() => {
        return this.click('#about-link');
      }).then(() => {
        assert.equal(this.$('h3.about').length, 0, 'Transitioning did not occur');
      });
    }

    [`@test the {{link-to}} helper responds to clicks according to its disabledWhen bound param`](assert) {
      this.addTemplate('index', `
      {{#link-to "about" id="about-link" disabledWhen=disabledWhen}}About{{/link-to}}
    `);

      this.add('controller:index', _controller.default.extend({
        disabledWhen: true
      }));

      return this.visit('/').then(() => {
        return this.click('#about-link');
      }).then(() => {
        assert.equal(this.$('h3.about').length, 0, 'Transitioning did not occur');

        let controller = this.applicationInstance.lookup('controller:index');
        controller.set('disabledWhen', false);

        return this.runLoopSettled();
      }).then(() => {
        return this.click('#about-link');
      }).then(() => {
        assert.equal(this.$('h3.about').length, 1, 'Transitioning did occur when disabledWhen became false');
      });
    }

    [`@test The {{link-to}} helper supports a custom activeClass`](assert) {
      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      {{#link-to 'about' id='about-link'}}About{{/link-to}}
      {{#link-to 'index' id='self-link' activeClass='zomg-active'}}Self{{/link-to}}
    `);

      return this.visit('/').then(() => {
        assert.equal(this.$('h3.home').length, 1, 'The home template was rendered');
        assert.equal(this.$('#self-link.zomg-active').length, 1, 'The self-link was rendered with active class');
        assert.equal(this.$('#about-link:not(.active)').length, 1, 'The other link was rendered without active class');
      });
    }

    [`@test The {{link-to}} helper supports a custom activeClass from a bound param`](assert) {
      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      {{#link-to 'about' id='about-link'}}About{{/link-to}}
      {{#link-to 'index' id='self-link' activeClass=activeClass}}Self{{/link-to}}
    `);

      this.add('controller:index', _controller.default.extend({
        activeClass: 'zomg-active'
      }));

      return this.visit('/').then(() => {
        assert.equal(this.$('h3.home').length, 1, 'The home template was rendered');
        assert.equal(this.$('#self-link.zomg-active').length, 1, 'The self-link was rendered with active class');
        assert.equal(this.$('#about-link:not(.active)').length, 1, 'The other link was rendered without active class');
      });
    }

    [`@test The {{link-to}} helper supports 'classNameBindings' with custom values [GH #11699]`](assert) {
      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      {{#link-to 'about' id='about-link' classNameBindings='foo:foo-is-true:foo-is-false'}}About{{/link-to}}
    `);

      this.add('controller:index', _controller.default.extend({
        foo: false
      }));

      return this.visit('/').then(() => {
        assert.equal(this.$('#about-link.foo-is-false').length, 1, 'The about-link was rendered with the falsy class');

        let controller = this.applicationInstance.lookup('controller:index');
        this.runTask(() => controller.set('foo', true));

        assert.equal(this.$('#about-link.foo-is-true').length, 1, 'The about-link was rendered with the truthy class after toggling the property');
      });
    }
  });

  (0, _internalTestHelpers.moduleFor)('The {{link-to}} helper - location hooks', class extends _internalTestHelpers.ApplicationTestCase {
    constructor() {
      super();

      this.updateCount = 0;
      this.replaceCount = 0;

      let testContext = this;
      this.add('location:none', _routing.NoneLocation.extend({
        setURL() {
          testContext.updateCount++;
          return this._super(...arguments);
        },
        replaceURL() {
          testContext.replaceCount++;
          return this._super(...arguments);
        }
      }));

      this.router.map(function () {
        this.route('about');
      });

      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      {{#link-to 'about' id='about-link'}}About{{/link-to}}
      {{#link-to 'index' id='self-link'}}Self{{/link-to}}
    `);
      this.addTemplate('about', `
      <h3 class="about">About</h3>
      {{#link-to 'index' id='home-link'}}Home{{/link-to}}
      {{#link-to 'about' id='self-link'}}Self{{/link-to}}
    `);
    }

    visit() {
      return super.visit(...arguments).then(() => {
        this.updateCountAfterVisit = this.updateCount;
        this.replaceCountAfterVisit = this.replaceCount;
      });
    }

    ['@test The {{link-to}} helper supports URL replacement'](assert) {
      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      {{#link-to 'about' id='about-link' replace=true}}About{{/link-to}}
    `);

      return this.visit('/').then(() => {
        return this.click('#about-link');
      }).then(() => {
        assert.equal(this.updateCount, this.updateCountAfterVisit, 'setURL should not be called');
        assert.equal(this.replaceCount, this.replaceCountAfterVisit + 1, 'replaceURL should be called once');
      });
    }

    ['@test The {{link-to}} helper supports URL replacement via replace=boundTruthyThing'](assert) {
      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      {{#link-to 'about' id='about-link' replace=boundTruthyThing}}About{{/link-to}}
    `);

      this.add('controller:index', _controller.default.extend({
        boundTruthyThing: true
      }));

      return this.visit('/').then(() => {
        return this.click('#about-link');
      }).then(() => {
        assert.equal(this.updateCount, this.updateCountAfterVisit, 'setURL should not be called');
        assert.equal(this.replaceCount, this.replaceCountAfterVisit + 1, 'replaceURL should be called once');
      });
    }

    ['@test The {{link-to}} helper supports setting replace=boundFalseyThing'](assert) {
      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      {{#link-to 'about' id='about-link' replace=boundFalseyThing}}About{{/link-to}}
    `);

      this.add('controller:index', _controller.default.extend({
        boundFalseyThing: false
      }));

      return this.visit('/').then(() => {
        return this.click('#about-link');
      }).then(() => {
        assert.equal(this.updateCount, this.updateCountAfterVisit + 1, 'setURL should be called');
        assert.equal(this.replaceCount, this.replaceCountAfterVisit, 'replaceURL should not be called');
      });
    }
  });

  if (false /* EMBER_IMPROVED_INSTRUMENTATION */) {
      (0, _internalTestHelpers.moduleFor)('The {{link-to}} helper with EMBER_IMPROVED_INSTRUMENTATION', class extends _internalTestHelpers.ApplicationTestCase {
        constructor() {
          super();

          this.router.map(function () {
            this.route('about');
          });

          this.addTemplate('index', `
        <h3 class="home">Home</h3>
        {{#link-to 'about' id='about-link'}}About{{/link-to}}
        {{#link-to 'index' id='self-link'}}Self{{/link-to}}
      `);
          this.addTemplate('about', `
        <h3 class="about">About</h3>
        {{#link-to 'index' id='home-link'}}Home{{/link-to}}
        {{#link-to 'about' id='self-link'}}Self{{/link-to}}
      `);
        }

        beforeEach() {
          return this.visit('/');
        }

        afterEach() {
          (0, _instrumentation.reset)();

          return super.afterEach();
        }

        ['@test The {{link-to}} helper fires an interaction event'](assert) {
          assert.expect(2);

          (0, _instrumentation.subscribe)('interaction.link-to', {
            before() {
              assert.ok(true, 'instrumentation subscriber was called');
            },
            after() {
              assert.ok(true, 'instrumentation subscriber was called');
            }
          });

          return this.click('#about-link');
        }

        ['@test The {{link-to}} helper interaction event includes the route name'](assert) {
          assert.expect(2);

          (0, _instrumentation.subscribe)('interaction.link-to', {
            before(name, timestamp, { routeName }) {
              assert.equal(routeName, 'about', 'instrumentation subscriber was passed route name');
            },
            after(name, timestamp, { routeName }) {
              assert.equal(routeName, 'about', 'instrumentation subscriber was passed route name');
            }
          });

          return this.click('#about-link');
        }

        ['@test The {{link-to}} helper interaction event includes the transition in the after hook'](assert) {
          assert.expect(1);

          (0, _instrumentation.subscribe)('interaction.link-to', {
            before() {},
            after(name, timestamp, { transition }) {
              assert.equal(transition.targetName, 'about', 'instrumentation subscriber was passed route name');
            }
          });

          return this.click('#about-link');
        }
      });
    }

  (0, _internalTestHelpers.moduleFor)('The {{link-to}} helper - nested routes and link-to arguments', class extends _internalTestHelpers.ApplicationTestCase {
    ['@test The {{link-to}} helper supports leaving off .index for nested routes'](assert) {
      this.router.map(function () {
        this.route('about', function () {
          this.route('item');
        });
      });

      this.addTemplate('about', `<h1>About</h1>{{outlet}}`);
      this.addTemplate('about.index', `<div id='index'>Index</div>`);
      this.addTemplate('about.item', `<div id='item'>{{#link-to 'about'}}About{{/link-to}}</div>`);

      return this.visit('/about/item').then(() => {
        assert.equal(normalizeUrl(this.$('#item a').attr('href')), '/about');
      });
    }

    [`@test The {{link-to}} helper supports custom, nested, current-when`](assert) {
      this.router.map(function () {
        this.route('index', { path: '/' }, function () {
          this.route('about');
        });

        this.route('item');
      });

      this.addTemplate('index', `<h3 class="home">Home</h3>{{outlet}}`);
      this.addTemplate('index.about', `
      {{#link-to 'item' id='other-link' current-when='index'}}ITEM{{/link-to}}
    `);

      return this.visit('/about').then(() => {
        assert.equal(this.$('#other-link.active').length, 1, 'The link is active since current-when is a parent route');
      });
    }

    [`@test The {{link-to}} helper does not disregard current-when when it is given explicitly for a route`](assert) {
      this.router.map(function () {
        this.route('index', { path: '/' }, function () {
          this.route('about');
        });

        this.route('items', function () {
          this.route('item');
        });
      });

      this.addTemplate('index', `<h3 class="home">Home</h3>{{outlet}}`);
      this.addTemplate('index.about', `
      {{#link-to 'items' id='other-link' current-when='index'}}ITEM{{/link-to}}
    `);

      return this.visit('/about').then(() => {
        assert.equal(this.$('#other-link.active').length, 1, 'The link is active when current-when is given for explicitly for a route');
      });
    }

    ['@test The {{link-to}} helper does not disregard current-when when it is set via a bound param'](assert) {
      this.router.map(function () {
        this.route('index', { path: '/' }, function () {
          this.route('about');
        });

        this.route('items', function () {
          this.route('item');
        });
      });

      this.add('controller:index.about', _controller.default.extend({
        currentWhen: 'index'
      }));

      this.addTemplate('index', `<h3 class="home">Home</h3>{{outlet}}`);
      this.addTemplate('index.about', `{{#link-to 'items' id='other-link' current-when=currentWhen}}ITEM{{/link-to}}`);

      return this.visit('/about').then(() => {
        assert.equal(this.$('#other-link.active').length, 1, 'The link is active when current-when is given for explicitly for a route');
      });
    }

    ['@test The {{link-to}} helper supports multiple current-when routes'](assert) {
      this.router.map(function () {
        this.route('index', { path: '/' }, function () {
          this.route('about');
        });
        this.route('item');
        this.route('foo');
      });

      this.addTemplate('index', `<h3 class="home">Home</h3>{{outlet}}`);
      this.addTemplate('index.about', `{{#link-to 'item' id='link1' current-when='item index'}}ITEM{{/link-to}}`);
      this.addTemplate('item', `{{#link-to 'item' id='link2' current-when='item index'}}ITEM{{/link-to}}`);
      this.addTemplate('foo', `{{#link-to 'item' id='link3' current-when='item index'}}ITEM{{/link-to}}`);

      return this.visit('/about').then(() => {
        assert.equal(this.$('#link1.active').length, 1, 'The link is active since current-when contains the parent route');

        return this.visit('/item');
      }).then(() => {
        assert.equal(this.$('#link2.active').length, 1, 'The link is active since you are on the active route');

        return this.visit('/foo');
      }).then(() => {
        assert.equal(this.$('#link3.active').length, 0, 'The link is not active since current-when does not contain the active route');
      });
    }

    ['@test The {{link-to}} helper supports boolean values for current-when'](assert) {
      this.router.map(function () {
        this.route('index', { path: '/' }, function () {
          this.route('about');
        });
        this.route('item');
      });

      this.addTemplate('index.about', `
      {{#link-to 'index' id='index-link' current-when=isCurrent}}index{{/link-to}}
      {{#link-to 'item' id='about-link' current-when=true}}ITEM{{/link-to}}
    `);

      this.add('controller:index.about', _controller.default.extend({ isCurrent: false }));

      return this.visit('/about').then(() => {
        assert.ok(this.$('#about-link').hasClass('active'), 'The link is active since current-when is true');
        assert.notOk(this.$('#index-link').hasClass('active'), 'The link is not active since current-when is false');

        let controller = this.applicationInstance.lookup('controller:index.about');
        this.runTask(() => controller.set('isCurrent', true));

        assert.ok(this.$('#index-link').hasClass('active'), 'The link is active since current-when is true');
      });
    }

    ['@test The {{link-to}} helper defaults to bubbling'](assert) {
      this.addTemplate('about', `
      <div {{action 'hide'}}>
        {{#link-to 'about.contact' id='about-contact'}}About{{/link-to}}
      </div>
      {{outlet}}
    `);
      this.addTemplate('about.contact', `
      <h1 id='contact'>Contact</h1>
    `);

      this.router.map(function () {
        this.route('about', function () {
          this.route('contact');
        });
      });

      let hidden = 0;

      this.add('route:about', _routing.Route.extend({
        actions: {
          hide() {
            hidden++;
          }
        }
      }));

      return this.visit('/about').then(() => {
        return this.click('#about-contact');
      }).then(() => {
        assert.equal(this.$('#contact').text(), 'Contact', 'precond - the link worked');

        assert.equal(hidden, 1, 'The link bubbles');
      });
    }

    [`@test The {{link-to}} helper supports bubbles=false`](assert) {
      this.addTemplate('about', `
      <div {{action 'hide'}}>
        {{#link-to 'about.contact' id='about-contact' bubbles=false}}
          About
        {{/link-to}}
      </div>
      {{outlet}}
    `);
      this.addTemplate('about.contact', `<h1 id='contact'>Contact</h1>`);

      this.router.map(function () {
        this.route('about', function () {
          this.route('contact');
        });
      });

      let hidden = 0;

      this.add('route:about', _routing.Route.extend({
        actions: {
          hide() {
            hidden++;
          }
        }
      }));

      return this.visit('/about').then(() => {
        return this.click('#about-contact');
      }).then(() => {
        assert.equal(this.$('#contact').text(), 'Contact', 'precond - the link worked');

        assert.equal(hidden, 0, "The link didn't bubble");
      });
    }

    [`@test The {{link-to}} helper supports bubbles=boundFalseyThing`](assert) {
      this.addTemplate('about', `
      <div {{action 'hide'}}>
        {{#link-to 'about.contact' id='about-contact' bubbles=boundFalseyThing}}
          About
        {{/link-to}}
      </div>
      {{outlet}}
    `);
      this.addTemplate('about.contact', `<h1 id='contact'>Contact</h1>`);

      this.add('controller:about', _controller.default.extend({
        boundFalseyThing: false
      }));

      this.router.map(function () {
        this.route('about', function () {
          this.route('contact');
        });
      });

      let hidden = 0;

      this.add('route:about', _routing.Route.extend({
        actions: {
          hide() {
            hidden++;
          }
        }
      }));

      return this.visit('/about').then(() => {
        return this.click('#about-contact');
      }).then(() => {
        assert.equal(this.$('#contact').text(), 'Contact', 'precond - the link worked');
        assert.equal(hidden, 0, "The link didn't bubble");
      });
    }

    [`@test The {{link-to}} helper moves into the named route with context`](assert) {
      this.router.map(function () {
        this.route('about');
        this.route('item', { path: '/item/:id' });
      });

      this.addTemplate('about', `
      <h3 class="list">List</h3>
      <ul>
        {{#each model as |person|}}
          <li>
            {{#link-to 'item' person id=person.id}}
              {{person.name}}
            {{/link-to}}
          </li>
        {{/each}}
      </ul>
      {{#link-to 'index' id='home-link'}}Home{{/link-to}}
    `);

      this.addTemplate('item', `
      <h3 class="item">Item</h3>
      <p>{{model.name}}</p>
      {{#link-to 'index' id='home-link'}}Home{{/link-to}}
    `);

      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      {{#link-to 'about' id='about-link'}}About{{/link-to}}
    `);

      this.add('route:about', _routing.Route.extend({
        model() {
          return [{ id: 'yehuda', name: 'Yehuda Katz' }, { id: 'tom', name: 'Tom Dale' }, { id: 'erik', name: 'Erik Brynroflsson' }];
        }
      }));

      return this.visit('/about').then(() => {
        assert.equal(this.$('h3.list').length, 1, 'The home template was rendered');
        assert.equal(normalizeUrl(this.$('#home-link').attr('href')), '/', 'The home link points back at /');

        return this.click('#yehuda');
      }).then(() => {
        assert.equal(this.$('h3.item').length, 1, 'The item template was rendered');
        assert.equal(this.$('p').text(), 'Yehuda Katz', 'The name is correct');

        return this.click('#home-link');
      }).then(() => {
        return this.click('#about-link');
      }).then(() => {
        assert.equal(normalizeUrl(this.$('li a#yehuda').attr('href')), '/item/yehuda');
        assert.equal(normalizeUrl(this.$('li a#tom').attr('href')), '/item/tom');
        assert.equal(normalizeUrl(this.$('li a#erik').attr('href')), '/item/erik');

        return this.click('#erik');
      }).then(() => {
        assert.equal(this.$('h3.item').length, 1, 'The item template was rendered');
        assert.equal(this.$('p').text(), 'Erik Brynroflsson', 'The name is correct');
      });
    }

    [`@test The {{link-to}} helper binds some anchor html tag common attributes`](assert) {
      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      {{#link-to 'index' id='self-link' title='title-attr' rel='rel-attr' tabindex='-1'}}
        Self
      {{/link-to}}
    `);

      return this.visit('/').then(() => {
        let link = this.$('#self-link');
        assert.equal(link.attr('title'), 'title-attr', 'The self-link contains title attribute');
        assert.equal(link.attr('rel'), 'rel-attr', 'The self-link contains rel attribute');
        assert.equal(link.attr('tabindex'), '-1', 'The self-link contains tabindex attribute');
      });
    }

    [`@test The {{link-to}} helper supports 'target' attribute`](assert) {
      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      {{#link-to 'index' id='self-link' target='_blank'}}Self{{/link-to}}
    `);

      return this.visit('/').then(() => {
        let link = this.$('#self-link');
        assert.equal(link.attr('target'), '_blank', 'The self-link contains `target` attribute');
      });
    }

    [`@test The {{link-to}} helper supports 'target' attribute specified as a bound param`](assert) {
      this.addTemplate('index', `<h3 class="home">Home</h3>{{#link-to 'index' id='self-link' target=boundLinkTarget}}Self{{/link-to}}`);

      this.add('controller:index', _controller.default.extend({
        boundLinkTarget: '_blank'
      }));

      return this.visit('/').then(() => {
        let link = this.$('#self-link');
        assert.equal(link.attr('target'), '_blank', 'The self-link contains `target` attribute');
      });
    }

    [`@test the {{link-to}} helper calls preventDefault`](assert) {
      this.router.map(function () {
        this.route('about');
      });

      this.addTemplate('index', `
      {{#link-to 'about' id='about-link'}}About{{/link-to}}
    `);

      return this.visit('/').then(() => {
        assertNav({ prevented: true }, () => this.$('#about-link').click(), assert);
      });
    }

    [`@test the {{link-to}} helper does not call preventDefault if 'preventDefault=false' is passed as an option`](assert) {
      this.router.map(function () {
        this.route('about');
      });

      this.addTemplate('index', `
      {{#link-to 'about' id='about-link' preventDefault=false}}About{{/link-to}}
    `);

      return this.visit('/').then(() => {
        assertNav({ prevented: false }, () => this.$('#about-link').trigger('click'), assert);
      });
    }

    [`@test the {{link-to}} helper does not call preventDefault if 'preventDefault=boundFalseyThing' is passed as an option`](assert) {
      this.router.map(function () {
        this.route('about');
      });

      this.addTemplate('index', `
      {{#link-to 'about' id='about-link' preventDefault=boundFalseyThing}}About{{/link-to}}
    `);

      this.add('controller:index', _controller.default.extend({
        boundFalseyThing: false
      }));

      return this.visit('/').then(() => {
        assertNav({ prevented: false }, () => this.$('#about-link').trigger('click'), assert);
      });
    }

    [`@test The {{link-to}} helper does not call preventDefault if 'target' attribute is provided`](assert) {
      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      {{#link-to 'index' id='self-link' target='_blank'}}Self{{/link-to}}
    `);

      return this.visit('/').then(() => {
        assertNav({ prevented: false }, () => this.$('#self-link').click(), assert);
      });
    }

    [`@test The {{link-to}} helper should preventDefault when 'target = _self'`](assert) {
      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      {{#link-to 'index' id='self-link' target='_self'}}Self{{/link-to}}
    `);

      return this.visit('/').then(() => {
        assertNav({ prevented: true }, () => this.$('#self-link').click(), assert);
      });
    }

    [`@test The {{link-to}} helper should not transition if target is not equal to _self or empty`](assert) {
      this.addTemplate('index', `
      {{#link-to 'about' id='about-link' replace=true target='_blank'}}
        About
      {{/link-to}}
    `);

      this.router.map(function () {
        this.route('about');
      });

      return this.visit('/').then(() => this.click('#about-link')).then(() => {
        let currentRouteName = this.applicationInstance.lookup('controller:application').get('currentRouteName');
        assert.notEqual(currentRouteName, 'about', 'link-to should not transition if target is not equal to _self or empty');
      });
    }

    [`@test The {{link-to}} helper accepts string/numeric arguments`](assert) {
      this.router.map(function () {
        this.route('filter', { path: '/filters/:filter' });
        this.route('post', { path: '/post/:post_id' });
        this.route('repo', { path: '/repo/:owner/:name' });
      });

      this.add('controller:filter', _controller.default.extend({
        filter: 'unpopular',
        repo: { owner: 'ember', name: 'ember.js' },
        post_id: 123
      }));

      this.addTemplate('filter', `
      <p>{{filter}}</p>
      {{#link-to "filter" "unpopular" id="link"}}Unpopular{{/link-to}}
      {{#link-to "filter" filter id="path-link"}}Unpopular{{/link-to}}
      {{#link-to "post" post_id id="post-path-link"}}Post{{/link-to}}
      {{#link-to "post" 123 id="post-number-link"}}Post{{/link-to}}
      {{#link-to "repo" repo id="repo-object-link"}}Repo{{/link-to}}
    `);

      return this.visit('/filters/popular').then(() => {
        assert.equal(normalizeUrl(this.$('#link').attr('href')), '/filters/unpopular');
        assert.equal(normalizeUrl(this.$('#path-link').attr('href')), '/filters/unpopular');
        assert.equal(normalizeUrl(this.$('#post-path-link').attr('href')), '/post/123');
        assert.equal(normalizeUrl(this.$('#post-number-link').attr('href')), '/post/123');
        assert.equal(normalizeUrl(this.$('#repo-object-link').attr('href')), '/repo/ember/ember.js');
      });
    }

    [`@test Issue 4201 - Shorthand for route.index shouldn't throw errors about context arguments`](assert) {
      assert.expect(2);
      this.router.map(function () {
        this.route('lobby', function () {
          this.route('index', { path: ':lobby_id' });
          this.route('list');
        });
      });

      this.add('route:lobby.index', _routing.Route.extend({
        model(params) {
          assert.equal(params.lobby_id, 'foobar');
          return params.lobby_id;
        }
      }));

      this.addTemplate('lobby.index', `
      {{#link-to 'lobby' 'foobar' id='lobby-link'}}Lobby{{/link-to}}
    `);
      this.addTemplate('lobby.list', `
      {{#link-to 'lobby' 'foobar' id='lobby-link'}}Lobby{{/link-to}}
    `);

      return this.visit('/lobby/list').then(() => this.click('#lobby-link')).then(() => shouldBeActive(assert, this.$('#lobby-link')));
    }

    [`@test Quoteless route param performs property lookup`](assert) {
      this.router.map(function () {
        this.route('about');
      });

      this.addTemplate('index', `
      {{#link-to 'index' id='string-link'}}string{{/link-to}}
      {{#link-to foo id='path-link'}}path{{/link-to}}
    `);

      this.add('controller:index', _controller.default.extend({
        foo: 'index'
      }));

      let assertEquality = href => {
        assert.equal(normalizeUrl(this.$('#string-link').attr('href')), '/');
        assert.equal(normalizeUrl(this.$('#path-link').attr('href')), href);
      };

      return this.visit('/').then(() => {
        assertEquality('/');

        let controller = this.applicationInstance.lookup('controller:index');
        this.runTask(() => controller.set('foo', 'about'));

        assertEquality('/about');
      });
    }

    [`@test The {{link-to}} helper refreshes href element when one of params changes`](assert) {
      this.router.map(function () {
        this.route('post', { path: '/posts/:post_id' });
      });

      let post = { id: '1' };
      let secondPost = { id: '2' };

      this.addTemplate('index', `
      {{#link-to "post" post id="post"}}post{{/link-to}}
    `);

      this.add('controller:index', _controller.default.extend());

      return this.visit('/').then(() => {
        let indexController = this.applicationInstance.lookup('controller:index');
        this.runTask(() => indexController.set('post', post));

        assert.equal(normalizeUrl(this.$('#post').attr('href')), '/posts/1', 'precond - Link has rendered href attr properly');

        this.runTask(() => indexController.set('post', secondPost));

        assert.equal(this.$('#post').attr('href'), '/posts/2', 'href attr was updated after one of the params had been changed');

        this.runTask(() => indexController.set('post', null));

        assert.equal(this.$('#post').attr('href'), '#', 'href attr becomes # when one of the arguments in nullified');
      });
    }

    [`@test The {{link-to}} helper is active when a route is active`](assert) {
      this.router.map(function () {
        this.route('about', function () {
          this.route('item');
        });
      });

      this.addTemplate('about', `
      <div id='about'>
        {{#link-to 'about' id='about-link'}}About{{/link-to}}
        {{#link-to 'about.item' id='item-link'}}Item{{/link-to}}
        {{outlet}}
      </div>
    `);

      return this.visit('/about').then(() => {
        assert.equal(this.$('#about-link.active').length, 1, 'The about route link is active');
        assert.equal(this.$('#item-link.active').length, 0, 'The item route link is inactive');

        return this.visit('/about/item');
      }).then(() => {
        assert.equal(this.$('#about-link.active').length, 1, 'The about route link is active');
        assert.equal(this.$('#item-link.active').length, 1, 'The item route link is active');
      });
    }

    [`@test The {{link-to}} helper works in an #each'd array of string route names`](assert) {
      this.router.map(function () {
        this.route('foo');
        this.route('bar');
        this.route('rar');
      });

      this.add('controller:index', _controller.default.extend({
        routeNames: (0, _runtime.A)(['foo', 'bar', 'rar']),
        route1: 'bar',
        route2: 'foo'
      }));

      this.addTemplate('index', `
      {{#each routeNames as |routeName|}}
        {{#link-to routeName}}{{routeName}}{{/link-to}}
      {{/each}}
      {{#each routeNames as |r|}}
        {{#link-to r}}{{r}}{{/link-to}}
      {{/each}}
      {{#link-to route1}}a{{/link-to}}
      {{#link-to route2}}b{{/link-to}}
    `);

      let linksEqual = (links, expected) => {
        assert.equal(links.length, expected.length, 'Has correct number of links');

        let idx;
        for (idx = 0; idx < links.length; idx++) {
          let href = this.$(links[idx]).attr('href');
          // Old IE includes the whole hostname as well
          assert.equal(href.slice(-expected[idx].length), expected[idx], `Expected link to be '${expected[idx]}', but was '${href}'`);
        }
      };

      return this.visit('/').then(() => {
        linksEqual(this.$('a'), ['/foo', '/bar', '/rar', '/foo', '/bar', '/rar', '/bar', '/foo']);

        let indexController = this.applicationInstance.lookup('controller:index');
        this.runTask(() => indexController.set('route1', 'rar'));

        linksEqual(this.$('a'), ['/foo', '/bar', '/rar', '/foo', '/bar', '/rar', '/rar', '/foo']);

        this.runTask(() => indexController.routeNames.shiftObject());

        linksEqual(this.$('a'), ['/bar', '/rar', '/bar', '/rar', '/rar', '/foo']);
      });
    }

    [`@test The non-block form {{link-to}} helper moves into the named route`](assert) {
      assert.expect(3);
      this.router.map(function () {
        this.route('contact');
      });

      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      {{link-to 'Contact us' 'contact' id='contact-link'}}
      {{#link-to 'index' id='self-link'}}Self{{/link-to}}
    `);
      this.addTemplate('contact', `
      <h3 class="contact">Contact</h3>
      {{link-to 'Home' 'index' id='home-link'}}
      {{link-to 'Self' 'contact' id='self-link'}}
    `);

      return this.visit('/').then(() => {
        return this.click('#contact-link');
      }).then(() => {
        assert.equal(this.$('h3.contact').length, 1, 'The contact template was rendered');
        assert.equal(this.$('#self-link.active').length, 1, 'The self-link was rendered with active class');
        assert.equal(this.$('#home-link:not(.active)').length, 1, 'The other link was rendered without active class');
      });
    }

    [`@test The non-block form {{link-to}} helper updates the link text when it is a binding`](assert) {
      assert.expect(8);
      this.router.map(function () {
        this.route('contact');
      });

      this.add('controller:index', _controller.default.extend({
        contactName: 'Jane'
      }));

      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      {{link-to contactName 'contact' id='contact-link'}}
      {{#link-to 'index' id='self-link'}}Self{{/link-to}}
    `);
      this.addTemplate('contact', `
      <h3 class="contact">Contact</h3>
      {{link-to 'Home' 'index' id='home-link'}}
      {{link-to 'Self' 'contact' id='self-link'}}
    `);

      return this.visit('/').then(() => {
        assert.equal(this.$('#contact-link').text(), 'Jane', 'The link title is correctly resolved');

        let controller = this.applicationInstance.lookup('controller:index');
        this.runTask(() => controller.set('contactName', 'Joe'));

        assert.equal(this.$('#contact-link').text(), 'Joe', 'The link title is correctly updated when the bound property changes');

        this.runTask(() => controller.set('contactName', 'Robert'));

        assert.equal(this.$('#contact-link').text(), 'Robert', 'The link title is correctly updated when the bound property changes a second time');

        return this.click('#contact-link');
      }).then(() => {
        assert.equal(this.$('h3.contact').length, 1, 'The contact template was rendered');
        assert.equal(this.$('#self-link.active').length, 1, 'The self-link was rendered with active class');
        assert.equal(this.$('#home-link:not(.active)').length, 1, 'The other link was rendered without active class');

        return this.click('#home-link');
      }).then(() => {
        assert.equal(this.$('h3.home').length, 1, 'The index template was rendered');
        assert.equal(this.$('#contact-link').text(), 'Robert', 'The link title is correctly updated when the route changes');
      });
    }

    [`@test The non-block form {{link-to}} helper moves into the named route with context`](assert) {
      assert.expect(5);

      this.router.map(function () {
        this.route('item', { path: '/item/:id' });
      });

      this.add('route:index', _routing.Route.extend({
        model() {
          return [{ id: 'yehuda', name: 'Yehuda Katz' }, { id: 'tom', name: 'Tom Dale' }, { id: 'erik', name: 'Erik Brynroflsson' }];
        }
      }));

      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      <ul>
        {{#each model as |person|}}
          <li>
            {{link-to person.name 'item' person id=person.id}}
          </li>
        {{/each}}
      </ul>
    `);
      this.addTemplate('item', `
      <h3 class="item">Item</h3>
      <p>{{model.name}}</p>
      {{#link-to 'index' id='home-link'}}Home{{/link-to}}
    `);

      return this.visit('/').then(() => {
        return this.click('#yehuda');
      }).then(() => {
        assert.equal(this.$('h3.item').length, 1, 'The item template was rendered');
        assert.equal(this.$('p').text(), 'Yehuda Katz', 'The name is correct');

        return this.click('#home-link');
      }).then(() => {
        assert.equal(normalizeUrl(this.$('li a#yehuda').attr('href')), '/item/yehuda');
        assert.equal(normalizeUrl(this.$('li a#tom').attr('href')), '/item/tom');
        assert.equal(normalizeUrl(this.$('li a#erik').attr('href')), '/item/erik');
      });
    }

    [`@test The non-block form {{link-to}} performs property lookup`](assert) {
      this.router.map(function () {
        this.route('about');
      });

      this.addTemplate('index', `
      {{link-to 'string' 'index' id='string-link'}}
      {{link-to path foo id='path-link'}}
    `);

      this.add('controller:index', _controller.default.extend({
        foo: 'index'
      }));

      return this.visit('/').then(() => {
        let assertEquality = href => {
          assert.equal(normalizeUrl(this.$('#string-link').attr('href')), '/');
          assert.equal(normalizeUrl(this.$('#path-link').attr('href')), href);
        };

        assertEquality('/');

        let controller = this.applicationInstance.lookup('controller:index');
        this.runTask(() => controller.set('foo', 'about'));

        assertEquality('/about');
      });
    }

    [`@test The non-block form {{link-to}} protects against XSS`](assert) {
      this.addTemplate('application', `{{link-to display 'index' id='link'}}`);

      this.add('controller:application', _controller.default.extend({
        display: 'blahzorz'
      }));

      return this.visit('/').then(() => {
        assert.equal(this.$('#link').text(), 'blahzorz');

        let controller = this.applicationInstance.lookup('controller:application');
        this.runTask(() => controller.set('display', '<b>BLAMMO</b>'));

        assert.equal(this.$('#link').text(), '<b>BLAMMO</b>');
        assert.equal(this.$('b').length, 0);
      });
    }

    [`@test the {{link-to}} helper throws a useful error if you invoke it wrong`](assert) {
      assert.expect(1);

      this.router.map(function () {
        this.route('post', { path: 'post/:post_id' });
      });

      this.addTemplate('application', `{{#link-to 'post'}}Post{{/link-to}}`);

      assert.throws(() => {
        this.visit('/');
      }, /(You attempted to define a `\{\{link-to "post"\}\}` but did not pass the parameters required for generating its dynamic segments.|You must provide param `post_id` to `generate`)/);

      return this.runLoopSettled();
    }

    [`@test the {{link-to}} helper does not throw an error if its route has exited`](assert) {
      assert.expect(0);

      this.router.map(function () {
        this.route('post', { path: 'post/:post_id' });
      });

      this.addTemplate('application', `
      {{#link-to 'index' id='home-link'}}Home{{/link-to}}
      {{#link-to 'post' defaultPost id='default-post-link'}}Default Post{{/link-to}}
      {{#if currentPost}}
        {{#link-to 'post' currentPost id='current-post-link'}}Current Post{{/link-to}}
      {{/if}}
    `);

      this.add('controller:application', _controller.default.extend({
        defaultPost: { id: 1 },
        postController: (0, _controller.inject)('post'),
        currentPost: (0, _metal.alias)('postController.model')
      }));

      this.add('controller:post', _controller.default.extend());

      this.add('route:post', _routing.Route.extend({
        model() {
          return { id: 2 };
        },
        serialize(model) {
          return { post_id: model.id };
        }
      }));

      return this.visit('/').then(() => this.click('#default-post-link')).then(() => this.click('#home-link')).then(() => this.click('#current-post-link')).then(() => this.click('#home-link'));
    }

    [`@test {{link-to}} active property respects changing parent route context`](assert) {
      this.router.map(function () {
        this.route('things', { path: '/things/:name' }, function () {
          this.route('other');
        });
      });

      this.addTemplate('application', `
      {{link-to 'OMG' 'things' 'omg' id='omg-link'}}
      {{link-to 'LOL' 'things' 'lol' id='lol-link'}}
    `);

      return this.visit('/things/omg').then(() => {
        shouldBeActive(assert, this.$('#omg-link'));
        shouldNotBeActive(assert, this.$('#lol-link'));

        return this.visit('/things/omg/other');
      }).then(() => {
        shouldBeActive(assert, this.$('#omg-link'));
        shouldNotBeActive(assert, this.$('#lol-link'));
      });
    }

    [`@test {{link-to}} populates href with default query param values even without query-params object`](assert) {
      this.add('controller:index', _controller.default.extend({
        queryParams: ['foo'],
        foo: '123'
      }));

      this.addTemplate('index', `{{#link-to 'index' id='the-link'}}Index{{/link-to}}`);

      return this.visit('/').then(() => {
        assert.equal(this.$('#the-link').attr('href'), '/', 'link has right href');
      });
    }

    [`@test {{link-to}} populates href with default query param values with empty query-params object`](assert) {
      this.add('controller:index', _controller.default.extend({
        queryParams: ['foo'],
        foo: '123'
      }));

      this.addTemplate('index', `
      {{#link-to 'index' (query-params) id='the-link'}}Index{{/link-to}}
    `);

      return this.visit('/').then(() => {
        assert.equal(this.$('#the-link').attr('href'), '/', 'link has right href');
      });
    }

    [`@test {{link-to}} with only query-params and a block updates when route changes`](assert) {
      this.router.map(function () {
        this.route('about');
      });

      this.add('controller:application', _controller.default.extend({
        queryParams: ['foo', 'bar'],
        foo: '123',
        bar: 'yes'
      }));

      this.addTemplate('application', `
      {{#link-to (query-params foo='456' bar='NAW') id='the-link'}}Index{{/link-to}}
    `);

      return this.visit('/').then(() => {
        assert.equal(this.$('#the-link').attr('href'), '/?bar=NAW&foo=456', 'link has right href');

        return this.visit('/about');
      }).then(() => {
        assert.equal(this.$('#the-link').attr('href'), '/about?bar=NAW&foo=456', 'link has right href');
      });
    }

    [`@test Block-less {{link-to}} with only query-params updates when route changes`](assert) {
      this.router.map(function () {
        this.route('about');
      });

      this.add('controller:application', _controller.default.extend({
        queryParams: ['foo', 'bar'],
        foo: '123',
        bar: 'yes'
      }));

      this.addTemplate('application', `
      {{link-to "Index" (query-params foo='456' bar='NAW') id='the-link'}}
    `);

      return this.visit('/').then(() => {
        assert.equal(this.$('#the-link').attr('href'), '/?bar=NAW&foo=456', 'link has right href');

        return this.visit('/about');
      }).then(() => {
        assert.equal(this.$('#the-link').attr('href'), '/about?bar=NAW&foo=456', 'link has right href');
      });
    }

    [`@test The {{link-to}} helper can use dynamic params`](assert) {
      this.router.map(function () {
        this.route('foo', { path: 'foo/:some/:thing' });
        this.route('bar', { path: 'bar/:some/:thing/:else' });
      });

      this.add('controller:index', _controller.default.extend({
        init() {
          this._super(...arguments);
          this.dynamicLinkParams = ['foo', 'one', 'two'];
        }
      }));

      this.addTemplate('index', `
      <h3 class="home">Home</h3>
      {{#link-to params=dynamicLinkParams id="dynamic-link"}}Dynamic{{/link-to}}
    `);

      return this.visit('/').then(() => {
        let link = this.$('#dynamic-link');

        assert.equal(link.attr('href'), '/foo/one/two');

        let controller = this.applicationInstance.lookup('controller:index');
        this.runTask(() => {
          controller.set('dynamicLinkParams', ['bar', 'one', 'two', 'three']);
        });

        assert.equal(link.attr('href'), '/bar/one/two/three');
      });
    }

    [`@test GJ: {{link-to}} to a parent root model hook which performs a 'transitionTo' has correct active class #13256`](assert) {
      assert.expect(1);

      this.router.map(function () {
        this.route('parent', function () {
          this.route('child');
        });
      });

      this.add('route:parent', _routing.Route.extend({
        afterModel() {
          this.transitionTo('parent.child');
        }
      }));

      this.addTemplate('application', `
      {{link-to 'Parent' 'parent' id='parent-link'}}
    `);

      return this.visit('/').then(() => {
        return this.click('#parent-link');
      }).then(() => {
        shouldBeActive(assert, this.$('#parent-link'));
      });
    }
  });

  (0, _internalTestHelpers.moduleFor)('The {{link-to}} helper - loading states and warnings', class extends _internalTestHelpers.ApplicationTestCase {
    [`@test link-to with null/undefined dynamic parameters are put in a loading state`](assert) {
      assert.expect(19);
      let warningMessage = 'This link-to is in an inactive loading state because at least one of its parameters presently has a null/undefined value, or the provided route name is invalid.';

      this.router.map(function () {
        this.route('thing', { path: '/thing/:thing_id' });
        this.route('about');
      });

      this.addTemplate('index', `
      {{#link-to destinationRoute routeContext loadingClass='i-am-loading' id='context-link'}}
        string
      {{/link-to}}
      {{#link-to secondRoute loadingClass=loadingClass id='static-link'}}
        string
      {{/link-to}}
    `);

      this.add('controller:index', _controller.default.extend({
        destinationRoute: null,
        routeContext: null,
        loadingClass: 'i-am-loading'
      }));

      this.add('route:about', _routing.Route.extend({
        activate() {
          assert.ok(true, 'About was entered');
        }
      }));

      function assertLinkStatus(link, url) {
        if (url) {
          assert.equal(normalizeUrl(link.attr('href')), url, 'loaded link-to has expected href');
          assert.ok(!link.hasClass('i-am-loading'), 'loaded linkComponent has no loadingClass');
        } else {
          assert.equal(normalizeUrl(link.attr('href')), '#', "unloaded link-to has href='#'");
          assert.ok(link.hasClass('i-am-loading'), 'loading linkComponent has loadingClass');
        }
      }

      let contextLink, staticLink, controller;

      return this.visit('/').then(() => {
        contextLink = this.$('#context-link');
        staticLink = this.$('#static-link');
        controller = this.applicationInstance.lookup('controller:index');

        assertLinkStatus(contextLink);
        assertLinkStatus(staticLink);

        return expectWarning(() => {
          return this.click(contextLink[0]);
        }, warningMessage);
      }).then(() => {
        // Set the destinationRoute (context is still null).
        this.runTask(() => controller.set('destinationRoute', 'thing'));
        assertLinkStatus(contextLink);

        // Set the routeContext to an id
        this.runTask(() => controller.set('routeContext', '456'));
        assertLinkStatus(contextLink, '/thing/456');

        // Test that 0 isn't interpreted as falsy.
        this.runTask(() => controller.set('routeContext', 0));
        assertLinkStatus(contextLink, '/thing/0');

        // Set the routeContext to an object
        this.runTask(() => {
          controller.set('routeContext', { id: 123 });
        });
        assertLinkStatus(contextLink, '/thing/123');

        // Set the destinationRoute back to null.
        this.runTask(() => controller.set('destinationRoute', null));
        assertLinkStatus(contextLink);

        return expectWarning(() => {
          return this.click(staticLink[0]);
        }, warningMessage);
      }).then(() => {
        this.runTask(() => controller.set('secondRoute', 'about'));
        assertLinkStatus(staticLink, '/about');

        // Click the now-active link
        return this.click(staticLink[0]);
      });
    }
  });

  function assertNav(options, callback, assert) {
    let nav = false;

    function check(event) {
      assert.equal(event.defaultPrevented, options.prevented, `expected defaultPrevented=${options.prevented}`);
      nav = true;
      event.preventDefault();
    }

    try {
      document.addEventListener('click', check);
      callback();
    } finally {
      document.removeEventListener('click', check);
      assert.ok(nav, 'Expected a link to be clicked');
    }
  }
});
enifed('ember/tests/helpers/link_to_test/link_to_transitioning_classes_test', ['@ember/-internals/runtime', '@ember/-internals/routing', 'internal-test-helpers'], function (_runtime, _routing, _internalTestHelpers) {
  'use strict';

  function assertHasClass(assert, selector, label) {
    let testLabel = `${selector.attr('id')} should have class ${label}`;

    assert.equal(selector.hasClass(label), true, testLabel);
  }

  function assertHasNoClass(assert, selector, label) {
    let testLabel = `${selector.attr('id')} should not have class ${label}`;

    assert.equal(selector.hasClass(label), false, testLabel);
  }

  (0, _internalTestHelpers.moduleFor)('The {{link-to}} helper: .transitioning-in .transitioning-out CSS classes', class extends _internalTestHelpers.ApplicationTestCase {
    constructor() {
      super();

      this.aboutDefer = _runtime.RSVP.defer();
      this.otherDefer = _runtime.RSVP.defer();
      this.newsDefer = _runtime.RSVP.defer();
      let _this = this;

      this.router.map(function () {
        this.route('about');
        this.route('other');
        this.route('news');
      });

      this.add('route:about', _routing.Route.extend({
        model() {
          return _this.aboutDefer.promise;
        }
      }));

      this.add('route:other', _routing.Route.extend({
        model() {
          return _this.otherDefer.promise;
        }
      }));

      this.add('route:news', _routing.Route.extend({
        model() {
          return _this.newsDefer.promise;
        }
      }));

      this.addTemplate('application', `
      {{outlet}}
      {{link-to 'Index' 'index' id='index-link'}}
      {{link-to 'About' 'about' id='about-link'}}
      {{link-to 'Other' 'other' id='other-link'}}
      {{link-to 'News' 'news' activeClass=false id='news-link'}}
    `);
    }

    beforeEach() {
      return this.visit('/');
    }

    afterEach() {
      super.afterEach();
      this.aboutDefer = null;
      this.otherDefer = null;
      this.newsDefer = null;
    }

    ['@test while a transition is underway'](assert) {
      let $index = this.$('#index-link');
      let $about = this.$('#about-link');
      let $other = this.$('#other-link');

      $about.click();

      assertHasClass(assert, $index, 'active');
      assertHasNoClass(assert, $about, 'active');
      assertHasNoClass(assert, $other, 'active');

      assertHasNoClass(assert, $index, 'ember-transitioning-in');
      assertHasClass(assert, $about, 'ember-transitioning-in');
      assertHasNoClass(assert, $other, 'ember-transitioning-in');

      assertHasClass(assert, $index, 'ember-transitioning-out');
      assertHasNoClass(assert, $about, 'ember-transitioning-out');
      assertHasNoClass(assert, $other, 'ember-transitioning-out');

      this.runTask(() => this.aboutDefer.resolve());

      assertHasNoClass(assert, $index, 'active');
      assertHasClass(assert, $about, 'active');
      assertHasNoClass(assert, $other, 'active');

      assertHasNoClass(assert, $index, 'ember-transitioning-in');
      assertHasNoClass(assert, $about, 'ember-transitioning-in');
      assertHasNoClass(assert, $other, 'ember-transitioning-in');

      assertHasNoClass(assert, $index, 'ember-transitioning-out');
      assertHasNoClass(assert, $about, 'ember-transitioning-out');
      assertHasNoClass(assert, $other, 'ember-transitioning-out');
    }

    ['@test while a transition is underway with activeClass is false'](assert) {
      let $index = this.$('#index-link');
      let $news = this.$('#news-link');
      let $other = this.$('#other-link');

      $news.click();

      assertHasClass(assert, $index, 'active');
      assertHasNoClass(assert, $news, 'active');
      assertHasNoClass(assert, $other, 'active');

      assertHasNoClass(assert, $index, 'ember-transitioning-in');
      assertHasClass(assert, $news, 'ember-transitioning-in');
      assertHasNoClass(assert, $other, 'ember-transitioning-in');

      assertHasClass(assert, $index, 'ember-transitioning-out');
      assertHasNoClass(assert, $news, 'ember-transitioning-out');
      assertHasNoClass(assert, $other, 'ember-transitioning-out');

      this.runTask(() => this.newsDefer.resolve());

      assertHasNoClass(assert, $index, 'active');
      assertHasNoClass(assert, $news, 'active');
      assertHasNoClass(assert, $other, 'active');

      assertHasNoClass(assert, $index, 'ember-transitioning-in');
      assertHasNoClass(assert, $news, 'ember-transitioning-in');
      assertHasNoClass(assert, $other, 'ember-transitioning-in');

      assertHasNoClass(assert, $index, 'ember-transitioning-out');
      assertHasNoClass(assert, $news, 'ember-transitioning-out');
      assertHasNoClass(assert, $other, 'ember-transitioning-out');
    }
  });

  (0, _internalTestHelpers.moduleFor)(`The {{link-to}} helper: .transitioning-in .transitioning-out CSS classes - nested link-to's`, class extends _internalTestHelpers.ApplicationTestCase {
    constructor() {
      super();
      this.aboutDefer = _runtime.RSVP.defer();
      this.otherDefer = _runtime.RSVP.defer();
      let _this = this;

      this.router.map(function () {
        this.route('parent-route', function () {
          this.route('about');
          this.route('other');
        });
      });
      this.add('route:parent-route.about', _routing.Route.extend({
        model() {
          return _this.aboutDefer.promise;
        }
      }));

      this.add('route:parent-route.other', _routing.Route.extend({
        model() {
          return _this.otherDefer.promise;
        }
      }));

      this.addTemplate('application', `
      {{outlet}}
      {{#link-to 'index' tagName='li'}}
        {{link-to 'Index' 'index' id='index-link'}}
      {{/link-to}}
      {{#link-to 'parent-route.about' tagName='li'}}
        {{link-to 'About' 'parent-route.about' id='about-link'}}
      {{/link-to}}
      {{#link-to 'parent-route.other' tagName='li'}}
        {{link-to 'Other' 'parent-route.other' id='other-link'}}
      {{/link-to}}
    `);
    }

    beforeEach() {
      return this.visit('/');
    }

    resolveAbout() {
      return this.runTask(() => {
        this.aboutDefer.resolve();
        this.aboutDefer = _runtime.RSVP.defer();
      });
    }

    resolveOther() {
      return this.runTask(() => {
        this.otherDefer.resolve();
        this.otherDefer = _runtime.RSVP.defer();
      });
    }

    teardown() {
      super.teardown();
      this.aboutDefer = null;
      this.otherDefer = null;
    }

    [`@test while a transition is underway with nested link-to's`](assert) {
      // TODO undo changes to this test but currently this test navigates away if navigation
      // outlet is not stable and the second $about.click() is triggered.
      let $about = this.$('#about-link');

      $about.click();

      let $index = this.$('#index-link');
      $about = this.$('#about-link');
      let $other = this.$('#other-link');

      assertHasClass(assert, $index, 'active');
      assertHasNoClass(assert, $about, 'active');
      assertHasNoClass(assert, $about, 'active');

      assertHasNoClass(assert, $index, 'ember-transitioning-in');
      assertHasClass(assert, $about, 'ember-transitioning-in');
      assertHasNoClass(assert, $other, 'ember-transitioning-in');

      assertHasClass(assert, $index, 'ember-transitioning-out');
      assertHasNoClass(assert, $about, 'ember-transitioning-out');
      assertHasNoClass(assert, $other, 'ember-transitioning-out');

      this.resolveAbout();

      $index = this.$('#index-link');
      $about = this.$('#about-link');
      $other = this.$('#other-link');

      assertHasNoClass(assert, $index, 'active');
      assertHasClass(assert, $about, 'active');
      assertHasNoClass(assert, $other, 'active');

      assertHasNoClass(assert, $index, 'ember-transitioning-in');
      assertHasNoClass(assert, $about, 'ember-transitioning-in');
      assertHasNoClass(assert, $other, 'ember-transitioning-in');

      assertHasNoClass(assert, $index, 'ember-transitioning-out');
      assertHasNoClass(assert, $about, 'ember-transitioning-out');
      assertHasNoClass(assert, $other, 'ember-transitioning-out');

      $other.click();

      $index = this.$('#index-link');
      $about = this.$('#about-link');
      $other = this.$('#other-link');

      assertHasNoClass(assert, $index, 'active');
      assertHasClass(assert, $about, 'active');
      assertHasNoClass(assert, $other, 'active');

      assertHasNoClass(assert, $index, 'ember-transitioning-in');
      assertHasNoClass(assert, $about, 'ember-transitioning-in');
      assertHasClass(assert, $other, 'ember-transitioning-in');

      assertHasNoClass(assert, $index, 'ember-transitioning-out');
      assertHasClass(assert, $about, 'ember-transitioning-out');
      assertHasNoClass(assert, $other, 'ember-transitioning-out');

      this.resolveOther();

      $index = this.$('#index-link');
      $about = this.$('#about-link');
      $other = this.$('#other-link');

      assertHasNoClass(assert, $index, 'active');
      assertHasNoClass(assert, $about, 'active');
      assertHasClass(assert, $other, 'active');

      assertHasNoClass(assert, $index, 'ember-transitioning-in');
      assertHasNoClass(assert, $about, 'ember-transitioning-in');
      assertHasNoClass(assert, $other, 'ember-transitioning-in');

      assertHasNoClass(assert, $index, 'ember-transitioning-out');
      assertHasNoClass(assert, $about, 'ember-transitioning-out');
      assertHasNoClass(assert, $other, 'ember-transitioning-out');

      $about.click();

      $index = this.$('#index-link');
      $about = this.$('#about-link');
      $other = this.$('#other-link');

      assertHasNoClass(assert, $index, 'active');
      assertHasNoClass(assert, $about, 'active');
      assertHasClass(assert, $other, 'active');

      assertHasNoClass(assert, $index, 'ember-transitioning-in');
      assertHasClass(assert, $about, 'ember-transitioning-in');
      assertHasNoClass(assert, $other, 'ember-transitioning-in');

      assertHasNoClass(assert, $index, 'ember-transitioning-out');
      assertHasNoClass(assert, $about, 'ember-transitioning-out');
      assertHasClass(assert, $other, 'ember-transitioning-out');

      this.resolveAbout();

      $index = this.$('#index-link');
      $about = this.$('#about-link');
      $other = this.$('#other-link');

      assertHasNoClass(assert, $index, 'active');
      assertHasClass(assert, $about, 'active');
      assertHasNoClass(assert, $other, 'active');

      assertHasNoClass(assert, $index, 'ember-transitioning-in');
      assertHasNoClass(assert, $about, 'ember-transitioning-in');
      assertHasNoClass(assert, $other, 'ember-transitioning-in');

      assertHasNoClass(assert, $index, 'ember-transitioning-out');
      assertHasNoClass(assert, $about, 'ember-transitioning-out');
      assertHasNoClass(assert, $other, 'ember-transitioning-out');
    }
  });
});
enifed('ember/tests/helpers/link_to_test/link_to_with_query_params_test', ['@ember/controller', '@ember/-internals/runtime', '@ember/-internals/routing', 'internal-test-helpers'], function (_controller, _runtime, _routing, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('The {{link-to}} helper: invoking with query params', class extends _internalTestHelpers.ApplicationTestCase {
    constructor() {
      super();
      let indexProperties = {
        foo: '123',
        bar: 'abc'
      };
      this.add('controller:index', _controller.default.extend({
        queryParams: ['foo', 'bar', 'abool'],
        foo: indexProperties.foo,
        bar: indexProperties.bar,
        boundThing: 'OMG',
        abool: true
      }));
      this.add('controller:about', _controller.default.extend({
        queryParams: ['baz', 'bat'],
        baz: 'alex',
        bat: 'borf'
      }));
      this.indexProperties = indexProperties;
    }

    shouldNotBeActive(assert, selector) {
      this.checkActive(assert, selector, false);
    }

    shouldBeActive(assert, selector) {
      this.checkActive(assert, selector, true);
    }

    getController(name) {
      return this.applicationInstance.lookup(`controller:${name}`);
    }

    checkActive(assert, selector, active) {
      let classList = this.$(selector)[0].className;
      assert.equal(classList.indexOf('active') > -1, active, selector + ' active should be ' + active.toString());
    }

    [`@test doesn't update controller QP properties on current route when invoked`](assert) {
      this.addTemplate('index', `
      {{#link-to 'index' id='the-link'}}Index{{/link-to}}
    `);

      return this.visit('/').then(() => {
        this.click('#the-link');
        let indexController = this.getController('index');

        assert.deepEqual(indexController.getProperties('foo', 'bar'), this.indexProperties, 'controller QP properties do not update');
      });
    }

    [`@test doesn't update controller QP properties on current route when invoked (empty query-params obj)`](assert) {
      this.addTemplate('index', `
      {{#link-to 'index' (query-params) id='the-link'}}Index{{/link-to}}
    `);

      return this.visit('/').then(() => {
        this.click('#the-link');
        let indexController = this.getController('index');

        assert.deepEqual(indexController.getProperties('foo', 'bar'), this.indexProperties, 'controller QP properties do not update');
      });
    }

    [`@test doesn't update controller QP properties on current route when invoked (empty query-params obj, inferred route)`](assert) {
      this.addTemplate('index', `
      {{#link-to (query-params) id='the-link'}}Index{{/link-to}}
    `);

      return this.visit('/').then(() => {
        this.click('#the-link');
        let indexController = this.getController('index');

        assert.deepEqual(indexController.getProperties('foo', 'bar'), this.indexProperties, 'controller QP properties do not update');
      });
    }

    ['@test updates controller QP properties on current route when invoked'](assert) {
      this.addTemplate('index', `
      {{#link-to 'index' (query-params foo='456') id="the-link"}}
        Index
      {{/link-to}}
    `);

      return this.visit('/').then(() => {
        this.click('#the-link');
        let indexController = this.getController('index');

        assert.deepEqual(indexController.getProperties('foo', 'bar'), { foo: '456', bar: 'abc' }, 'controller QP properties updated');
      });
    }

    ['@test updates controller QP properties on current route when invoked (inferred route)'](assert) {
      this.addTemplate('index', `
      {{#link-to (query-params foo='456') id="the-link"}}
        Index
      {{/link-to}}
    `);

      return this.visit('/').then(() => {
        this.click('#the-link');
        let indexController = this.getController('index');

        assert.deepEqual(indexController.getProperties('foo', 'bar'), { foo: '456', bar: 'abc' }, 'controller QP properties updated');
      });
    }

    ['@test updates controller QP properties on other route after transitioning to that route'](assert) {
      this.router.map(function () {
        this.route('about');
      });

      this.addTemplate('index', `
      {{#link-to 'about' (query-params baz='lol') id='the-link'}}
        About
      {{/link-to}}
    `);

      return this.visit('/').then(() => {
        let theLink = this.$('#the-link');
        assert.equal(theLink.attr('href'), '/about?baz=lol');

        this.runTask(() => this.click('#the-link'));

        let aboutController = this.getController('about');

        assert.deepEqual(aboutController.getProperties('baz', 'bat'), { baz: 'lol', bat: 'borf' }, 'about controller QP properties updated');
      });
    }

    ['@test supplied QP properties can be bound'](assert) {
      this.addTemplate('index', `
      {{#link-to (query-params foo=boundThing) id='the-link'}}Index{{/link-to}}
    `);

      return this.visit('/').then(() => {
        let indexController = this.getController('index');
        let theLink = this.$('#the-link');

        assert.equal(theLink.attr('href'), '/?foo=OMG');

        this.runTask(() => indexController.set('boundThing', 'ASL'));

        assert.equal(theLink.attr('href'), '/?foo=ASL');
      });
    }

    ['@test supplied QP properties can be bound (booleans)'](assert) {
      this.addTemplate('index', `
      {{#link-to (query-params abool=boundThing) id='the-link'}}
        Index
      {{/link-to}}
    `);

      return this.visit('/').then(() => {
        let indexController = this.getController('index');
        let theLink = this.$('#the-link');

        assert.equal(theLink.attr('href'), '/?abool=OMG');

        this.runTask(() => indexController.set('boundThing', false));

        assert.equal(theLink.attr('href'), '/?abool=false');

        this.click('#the-link');

        assert.deepEqual(indexController.getProperties('foo', 'bar', 'abool'), { foo: '123', bar: 'abc', abool: false }, 'bound bool QP properties update');
      });
    }
    ['@test href updates when unsupplied controller QP props change'](assert) {
      this.addTemplate('index', `
      {{#link-to (query-params foo='lol') id='the-link'}}Index{{/link-to}}
    `);

      return this.visit('/').then(() => {
        let indexController = this.getController('index');
        let theLink = this.$('#the-link');

        assert.equal(theLink.attr('href'), '/?foo=lol');

        this.runTask(() => indexController.set('bar', 'BORF'));

        assert.equal(theLink.attr('href'), '/?bar=BORF&foo=lol');

        this.runTask(() => indexController.set('foo', 'YEAH'));

        assert.equal(theLink.attr('href'), '/?bar=BORF&foo=lol');
      });
    }

    ['@test The {{link-to}} with only query params always transitions to the current route with the query params applied'](assert) {
      // Test harness for bug #12033
      this.addTemplate('cars', `
      {{#link-to 'cars.create' id='create-link'}}Create new car{{/link-to}}
      {{#link-to (query-params page='2') id='page2-link'}}Page 2{{/link-to}}
      {{outlet}}
    `);
      this.addTemplate('cars.create', `{{#link-to 'cars' id='close-link'}}Close create form{{/link-to}}`);

      this.router.map(function () {
        this.route('cars', function () {
          this.route('create');
        });
      });

      this.add('controller:cars', _controller.default.extend({
        queryParams: ['page'],
        page: 1
      }));

      return this.visit('/cars/create').then(() => {
        let router = this.appRouter;
        let carsController = this.getController('cars');

        assert.equal(router.currentRouteName, 'cars.create');

        this.runTask(() => this.click('#close-link'));

        assert.equal(router.currentRouteName, 'cars.index');
        assert.equal(router.get('url'), '/cars');
        assert.equal(carsController.get('page'), 1, 'The page query-param is 1');

        this.runTask(() => this.click('#page2-link'));

        assert.equal(router.currentRouteName, 'cars.index', 'The active route is still cars');
        assert.equal(router.get('url'), '/cars?page=2', 'The url has been updated');
        assert.equal(carsController.get('page'), 2, 'The query params have been updated');
      });
    }

    ['@test the {{link-to}} applies activeClass when query params are not changed'](assert) {
      this.addTemplate('index', `
      {{#link-to (query-params foo='cat') id='cat-link'}}Index{{/link-to}}
      {{#link-to (query-params foo='dog') id='dog-link'}}Index{{/link-to}}
      {{#link-to 'index' id='change-nothing'}}Index{{/link-to}}
    `);
      this.addTemplate('search', `
      {{#link-to (query-params search='same') id='same-search'}}Index{{/link-to}}
      {{#link-to (query-params search='change') id='change-search'}}Index{{/link-to}}
      {{#link-to (query-params search='same' archive=true) id='same-search-add-archive'}}Index{{/link-to}}
      {{#link-to (query-params archive=true) id='only-add-archive'}}Index{{/link-to}}
      {{#link-to (query-params search='same' archive=true) id='both-same'}}Index{{/link-to}}
      {{#link-to (query-params search='different' archive=true) id='change-one'}}Index{{/link-to}}
      {{#link-to (query-params search='different' archive=false) id='remove-one'}}Index{{/link-to}}
      {{outlet}}
    `);
      this.addTemplate('search.results', `
      {{#link-to (query-params sort='title') id='same-sort-child-only'}}Index{{/link-to}}
      {{#link-to (query-params search='same') id='same-search-parent-only'}}Index{{/link-to}}
      {{#link-to (query-params search='change') id='change-search-parent-only'}}Index{{/link-to}}
      {{#link-to (query-params search='same' sort='title') id='same-search-same-sort-child-and-parent'}}Index{{/link-to}}
      {{#link-to (query-params search='same' sort='author') id='same-search-different-sort-child-and-parent'}}Index{{/link-to}}
      {{#link-to (query-params search='change' sort='title') id='change-search-same-sort-child-and-parent'}}Index{{/link-to}}
      {{#link-to (query-params foo='dog') id='dog-link'}}Index{{/link-to}}
    `);

      this.router.map(function () {
        this.route('search', function () {
          this.route('results');
        });
      });

      this.add('controller:search', _controller.default.extend({
        queryParams: ['search', 'archive'],
        search: '',
        archive: false
      }));

      this.add('controller:search.results', _controller.default.extend({
        queryParams: ['sort', 'showDetails'],
        sort: 'title',
        showDetails: true
      }));

      return this.visit('/').then(() => {
        this.shouldNotBeActive(assert, '#cat-link');
        this.shouldNotBeActive(assert, '#dog-link');

        return this.visit('/?foo=cat');
      }).then(() => {
        this.shouldBeActive(assert, '#cat-link');
        this.shouldNotBeActive(assert, '#dog-link');

        return this.visit('/?foo=dog');
      }).then(() => {
        this.shouldBeActive(assert, '#dog-link');
        this.shouldNotBeActive(assert, '#cat-link');
        this.shouldBeActive(assert, '#change-nothing');

        return this.visit('/search?search=same');
      }).then(() => {
        this.shouldBeActive(assert, '#same-search');
        this.shouldNotBeActive(assert, '#change-search');
        this.shouldNotBeActive(assert, '#same-search-add-archive');
        this.shouldNotBeActive(assert, '#only-add-archive');
        this.shouldNotBeActive(assert, '#remove-one');

        return this.visit('/search?search=same&archive=true');
      }).then(() => {
        this.shouldBeActive(assert, '#both-same');
        this.shouldNotBeActive(assert, '#change-one');

        return this.visit('/search/results?search=same&sort=title&showDetails=true');
      }).then(() => {
        this.shouldBeActive(assert, '#same-sort-child-only');
        this.shouldBeActive(assert, '#same-search-parent-only');
        this.shouldNotBeActive(assert, '#change-search-parent-only');
        this.shouldBeActive(assert, '#same-search-same-sort-child-and-parent');
        this.shouldNotBeActive(assert, '#same-search-different-sort-child-and-parent');
        this.shouldNotBeActive(assert, '#change-search-same-sort-child-and-parent');
      });
    }

    ['@test the {{link-to}} applies active class when query-param is a number'](assert) {
      this.addTemplate('index', `
      {{#link-to (query-params page=pageNumber) id='page-link'}}
        Index
      {{/link-to}}
    `);
      this.add('controller:index', _controller.default.extend({
        queryParams: ['page'],
        page: 1,
        pageNumber: 5
      }));

      return this.visit('/').then(() => {
        this.shouldNotBeActive(assert, '#page-link');
        return this.visit('/?page=5');
      }).then(() => {
        this.shouldBeActive(assert, '#page-link');
      });
    }

    ['@test the {{link-to}} applies active class when query-param is an array'](assert) {
      this.addTemplate('index', `
      {{#link-to (query-params pages=pagesArray) id='array-link'}}Index{{/link-to}}
      {{#link-to (query-params pages=biggerArray) id='bigger-link'}}Index{{/link-to}}
      {{#link-to (query-params pages=emptyArray) id='empty-link'}}Index{{/link-to}}
    `);

      this.add('controller:index', _controller.default.extend({
        queryParams: ['pages'],
        pages: [],
        pagesArray: [1, 2],
        biggerArray: [1, 2, 3],
        emptyArray: []
      }));

      return this.visit('/').then(() => {
        this.shouldNotBeActive(assert, '#array-link');

        return this.visit('/?pages=%5B1%2C2%5D');
      }).then(() => {
        this.shouldBeActive(assert, '#array-link');
        this.shouldNotBeActive(assert, '#bigger-link');
        this.shouldNotBeActive(assert, '#empty-link');

        return this.visit('/?pages=%5B2%2C1%5D');
      }).then(() => {
        this.shouldNotBeActive(assert, '#array-link');
        this.shouldNotBeActive(assert, '#bigger-link');
        this.shouldNotBeActive(assert, '#empty-link');

        return this.visit('/?pages=%5B1%2C2%2C3%5D');
      }).then(() => {
        this.shouldBeActive(assert, '#bigger-link');
        this.shouldNotBeActive(assert, '#array-link');
        this.shouldNotBeActive(assert, '#empty-link');
      });
    }
    ['@test the {{link-to}} helper applies active class to the parent route'](assert) {
      this.router.map(function () {
        this.route('parent', function () {
          this.route('child');
        });
      });

      this.addTemplate('application', `
      {{#link-to 'parent' id='parent-link'}}Parent{{/link-to}}
      {{#link-to 'parent.child' id='parent-child-link'}}Child{{/link-to}}
      {{#link-to 'parent' (query-params foo=cat) id='parent-link-qp'}}Parent{{/link-to}}
      {{outlet}}
    `);

      this.add('controller:parent.child', _controller.default.extend({
        queryParams: ['foo'],
        foo: 'bar'
      }));

      return this.visit('/').then(() => {
        this.shouldNotBeActive(assert, '#parent-link');
        this.shouldNotBeActive(assert, '#parent-child-link');
        this.shouldNotBeActive(assert, '#parent-link-qp');
        return this.visit('/parent/child?foo=dog');
      }).then(() => {
        this.shouldBeActive(assert, '#parent-link');
        this.shouldNotBeActive(assert, '#parent-link-qp');
      });
    }

    ['@test The {{link-to}} helper disregards query-params in activeness computation when current-when is specified'](assert) {
      let appLink;

      this.router.map(function () {
        this.route('parent');
      });
      this.addTemplate('application', `
      {{#link-to 'parent' (query-params page=1) current-when='parent' id='app-link'}}
        Parent
      {{/link-to}}
      {{outlet}}
    `);
      this.addTemplate('parent', `
      {{#link-to 'parent' (query-params page=1) current-when='parent' id='parent-link'}}
        Parent
      {{/link-to}}
      {{outlet}}
    `);
      this.add('controller:parent', _controller.default.extend({
        queryParams: ['page'],
        page: 1
      }));

      return this.visit('/').then(() => {
        appLink = this.$('#app-link');

        assert.equal(appLink.attr('href'), '/parent');
        this.shouldNotBeActive(assert, '#app-link');

        return this.visit('/parent?page=2');
      }).then(() => {
        appLink = this.$('#app-link');
        let router = this.appRouter;

        assert.equal(appLink.attr('href'), '/parent');
        this.shouldBeActive(assert, '#app-link');
        assert.equal(this.$('#parent-link').attr('href'), '/parent');
        this.shouldBeActive(assert, '#parent-link');

        let parentController = this.getController('parent');

        assert.equal(parentController.get('page'), 2);

        this.runTask(() => parentController.set('page', 3));

        assert.equal(router.get('location.path'), '/parent?page=3');
        this.shouldBeActive(assert, '#app-link');
        this.shouldBeActive(assert, '#parent-link');

        this.runTask(() => this.click('#app-link'));

        assert.equal(router.get('location.path'), '/parent');
      });
    }

    ['@test link-to default query params while in active transition regression test'](assert) {
      this.router.map(function () {
        this.route('foos');
        this.route('bars');
      });
      let foos = _runtime.RSVP.defer();
      let bars = _runtime.RSVP.defer();

      this.addTemplate('application', `
      {{link-to 'Foos' 'foos' id='foos-link'}}
      {{link-to 'Baz Foos' 'foos' (query-params baz=true) id='baz-foos-link'}}
      {{link-to 'Quux Bars' 'bars' (query-params quux=true) id='bars-link'}}
    `);
      this.add('controller:foos', _controller.default.extend({
        queryParams: ['status'],
        baz: false
      }));
      this.add('route:foos', _routing.Route.extend({
        model() {
          return foos.promise;
        }
      }));
      this.add('controller:bars', _controller.default.extend({
        queryParams: ['status'],
        quux: false
      }));
      this.add('route:bars', _routing.Route.extend({
        model() {
          return bars.promise;
        }
      }));

      return this.visit('/').then(() => {
        let router = this.appRouter;
        let foosLink = this.$('#foos-link');
        let barsLink = this.$('#bars-link');
        let bazLink = this.$('#baz-foos-link');

        assert.equal(foosLink.attr('href'), '/foos');
        assert.equal(bazLink.attr('href'), '/foos?baz=true');
        assert.equal(barsLink.attr('href'), '/bars?quux=true');
        assert.equal(router.get('location.path'), '/');
        this.shouldNotBeActive(assert, '#foos-link');
        this.shouldNotBeActive(assert, '#baz-foos-link');
        this.shouldNotBeActive(assert, '#bars-link');

        this.runTask(() => barsLink.click());
        this.shouldNotBeActive(assert, '#bars-link');

        this.runTask(() => foosLink.click());
        this.shouldNotBeActive(assert, '#foos-link');

        this.runTask(() => foos.resolve());

        assert.equal(router.get('location.path'), '/foos');
        this.shouldBeActive(assert, '#foos-link');
      });
    }

    [`@test the {{link-to}} helper throws a useful error if you invoke it wrong`](assert) {
      assert.expect(1);

      this.addTemplate('application', `{{#link-to id='the-link'}}Index{{/link-to}}`);

      expectAssertion(() => {
        this.visit('/');
      }, /You must provide one or more parameters to the link-to component/);

      return this.runLoopSettled();
    }
  });
});
enifed('ember/tests/homepage_example_test', ['@ember/-internals/routing', '@ember/-internals/metal', '@ember/-internals/runtime', 'internal-test-helpers'], function (_routing, _metal, _runtime, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('The example renders correctly', class extends _internalTestHelpers.ApplicationTestCase {
    ['@test Render index template into application outlet'](assert) {
      this.addTemplate('application', '{{outlet}}');
      this.addTemplate('index', '<h1>People</h1><ul>{{#each model as |person|}}<li>Hello, <b>{{person.fullName}}</b>!</li>{{/each}}</ul>');

      let Person = _runtime.Object.extend({
        firstName: null,
        lastName: null,
        fullName: (0, _metal.computed)('firstName', 'lastName', function () {
          return `${this.get('firstName')} ${this.get('lastName')}`;
        })
      });

      this.add('route:index', _routing.Route.extend({
        model() {
          return (0, _runtime.A)([Person.create({ firstName: 'Tom', lastName: 'Dale' }), Person.create({ firstName: 'Yehuda', lastName: 'Katz' })]);
        }
      }));

      return this.visit('/').then(() => {
        let $ = this.$();

        assert.equal($.findAll('h1').text(), 'People');
        assert.equal($.findAll('li').length, 2);
        assert.equal($.findAll('li:nth-of-type(1)').text(), 'Hello, Tom Dale!');
        assert.equal($.findAll('li:nth-of-type(2)').text(), 'Hello, Yehuda Katz!');
      });
    }
  });
});
enifed('ember/tests/integration/multiple-app-test', ['internal-test-helpers', '@ember/application', '@ember/-internals/glimmer', '@ember/-internals/owner', '@ember/polyfills', 'rsvp'], function (_internalTestHelpers, _application, _glimmer, _owner, _polyfills, _rsvp) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('View Integration', class extends _internalTestHelpers.ApplicationTestCase {
    constructor() {
      document.getElementById('qunit-fixture').innerHTML = `
      <div id="one"></div>
      <div id="two"></div>
    `;
      super();
      this.runTask(() => {
        this.createSecondApplication();
      });
    }

    get applicationOptions() {
      return (0, _polyfills.assign)(super.applicationOptions, {
        rootElement: '#one',
        router: null
      });
    }

    createSecondApplication(options) {
      let { applicationOptions } = this;
      let secondApplicationOptions = { rootElement: '#two' };
      let myOptions = (0, _polyfills.assign)(applicationOptions, secondApplicationOptions, options);
      this.secondApp = _application.default.create(myOptions);
      this.secondResolver = this.secondApp.__registry__.resolver;
      return this.secondApp;
    }

    teardown() {
      super.teardown();

      if (this.secondApp) {
        this.runTask(() => {
          this.secondApp.destroy();
        });
      }
    }

    addFactoriesToResolver(actions, resolver) {
      resolver.add('component:special-button', _glimmer.Component.extend({
        actions: {
          doStuff() {
            let rootElement = (0, _owner.getOwner)(this).application.rootElement;
            actions.push(rootElement);
          }
        }
      }));

      resolver.add('template:index', this.compile(`
        <h1>Node 1</h1>{{special-button}}
      `, {
        moduleName: 'my-app/templates/index.hbs'
      }));
      resolver.add('template:components/special-button', this.compile(`
        <button class='do-stuff' {{action 'doStuff'}}>Button</button>
      `, {
        moduleName: 'my-app/templates/components/special-button.hbs'
      }));
    }

    [`@test booting multiple applications can properly handle events`](assert) {
      let actions = [];
      this.addFactoriesToResolver(actions, this.resolver);
      this.addFactoriesToResolver(actions, this.secondResolver);

      return (0, _rsvp.resolve)().then(() => this.application.visit('/')).then(() => this.secondApp.visit('/')).then(() => {
        document.querySelector('#two .do-stuff').click();
        document.querySelector('#one .do-stuff').click();

        assert.deepEqual(actions, ['#two', '#one']);
      });
    }
  });
});
enifed('ember/tests/production_build_test', ['@ember/debug', 'internal-test-helpers'], function (_debug, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('production builds', class extends _internalTestHelpers.AbstractTestCase {
    ['@test assert does not throw in production builds'](assert) {
      if (!false /* DEBUG */) {
          assert.expect(1);

          try {
            false && !false && (0, _debug.assert)('Should not throw');

            assert.ok(true, 'Ember.assert did not throw');
          } catch (e) {
            assert.ok(false, `Expected assert not to throw but it did: ${e.message}`);
          }
        } else {
        assert.expect(0);
      }
    }

    ['@test runInDebug does not run the callback in production builds'](assert) {
      if (!false /* DEBUG */) {
          let fired = false;
          (0, _debug.runInDebug)(() => fired = true);

          assert.equal(fired, false, 'runInDebug callback should not be ran');
        } else {
        assert.expect(0);
      }
    }
  });
});
enifed('ember/tests/reexports_test', ['ember/index', '@ember/canary-features', 'internal-test-helpers', '@ember/-internals/views'], function (_index, _canaryFeatures, _internalTestHelpers, _views) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('ember reexports', class extends _internalTestHelpers.AbstractTestCase {
    [`@test Ember exports correctly`](assert) {
      allExports.forEach(reexport => {
        let [path, moduleId, exportName] = reexport;

        // default path === exportName if none present
        if (!exportName) {
          exportName = path;
        }

        (0, _internalTestHelpers.confirmExport)(_index.default, assert, path, moduleId, exportName, `Ember.${path} exports correctly`);
      });
    }

    ['@test Ember.String.isHTMLSafe exports correctly'](assert) {
      (0, _internalTestHelpers.confirmExport)(_index.default, assert, 'String.isHTMLSafe', '@ember/-internals/glimmer', 'isHTMLSafe');
    }

    ['@test Ember.EXTEND_PROTOTYPES is present (but deprecated)'](assert) {
      expectDeprecation(() => {
        assert.strictEqual(_index.default.ENV.EXTEND_PROTOTYPES, _index.default.EXTEND_PROTOTYPES, 'Ember.EXTEND_PROTOTYPES exists');
      }, /EXTEND_PROTOTYPES is deprecated/);
    }

    '@test Ember.FEATURES is exported'(assert) {
      for (let feature in _canaryFeatures.FEATURES) {
        assert.equal(_index.default.FEATURES[feature], _canaryFeatures.FEATURES[feature], 'Ember.FEATURES contains ${feature} with correct value');
      }
    }
  });

  let allExports = [
  // @ember/-internals/environment
  ['ENV', '@ember/-internals/environment', { get: 'getENV' }], ['lookup', '@ember/-internals/environment', { get: 'getLookup', set: 'setLookup' }], ['getOwner', '@ember/application', 'getOwner'], ['setOwner', '@ember/application', 'setOwner'], ['assign', '@ember/polyfills'],

  // @ember/-internals/utils
  ['GUID_KEY', '@ember/-internals/utils'], ['uuid', '@ember/-internals/utils'], ['generateGuid', '@ember/-internals/utils'], ['guidFor', '@ember/-internals/utils'], ['inspect', '@ember/-internals/utils'], ['makeArray', '@ember/-internals/utils'], ['canInvoke', '@ember/-internals/utils'], ['tryInvoke', '@ember/-internals/utils'], ['wrap', '@ember/-internals/utils'], ['NAME_KEY', '@ember/-internals/utils'],

  // @ember/-internals/container
  ['Registry', '@ember/-internals/container', 'Registry'], ['Container', '@ember/-internals/container', 'Container'],

  // @ember/debug
  ['deprecateFunc', '@ember/debug'], ['deprecate', '@ember/debug'], ['assert', '@ember/debug'], ['warn', '@ember/debug'], ['debug', '@ember/debug'], ['runInDebug', '@ember/debug'], ['Debug.registerDeprecationHandler', '@ember/debug', 'registerDeprecationHandler'], ['Debug.registerWarnHandler', '@ember/debug', 'registerWarnHandler'], ['Error', '@ember/error', 'default'],

  // @ember/-internals/metal
  ['computed', '@ember/-internals/metal', '_globalsComputed'], ['computed.alias', '@ember/-internals/metal', 'alias'], ['ComputedProperty', '@ember/-internals/metal'], ['cacheFor', '@ember/-internals/metal', 'getCachedValueFor'], ['merge', '@ember/polyfills'], ['instrument', '@ember/instrumentation'], ['subscribe', '@ember/instrumentation', 'subscribe'], ['Instrumentation.instrument', '@ember/instrumentation', 'instrument'], ['Instrumentation.subscribe', '@ember/instrumentation', 'subscribe'], ['Instrumentation.unsubscribe', '@ember/instrumentation', 'unsubscribe'], ['Instrumentation.reset', '@ember/instrumentation', 'reset'], ['testing', '@ember/debug', { get: 'isTesting', set: 'setTesting' }], ['onerror', '@ember/-internals/error-handling', { get: 'getOnerror', set: 'setOnerror' }], ['FEATURES.isEnabled', '@ember/canary-features', 'isEnabled'], ['meta', '@ember/-internals/meta'], ['get', '@ember/-internals/metal'], ['set', '@ember/-internals/metal'], ['_getPath', '@ember/-internals/metal'], ['getWithDefault', '@ember/-internals/metal'], ['trySet', '@ember/-internals/metal'], ['_Cache', '@ember/-internals/utils', 'Cache'], ['on', '@ember/-internals/metal'], ['addListener', '@ember/-internals/metal'], ['removeListener', '@ember/-internals/metal'], ['sendEvent', '@ember/-internals/metal'], ['hasListeners', '@ember/-internals/metal'], ['isNone', '@ember/-internals/metal'], ['isEmpty', '@ember/-internals/metal'], ['isBlank', '@ember/-internals/metal'], ['isPresent', '@ember/-internals/metal'], ['_Backburner', 'backburner', 'default'], ['run', '@ember/runloop', '_globalsRun'], ['run.backburner', '@ember/runloop', 'backburner'], ['run.begin', '@ember/runloop', 'begin'], ['run.bind', '@ember/runloop', 'bind'], ['run.cancel', '@ember/runloop', 'cancel'], ['run.debounce', '@ember/runloop', 'debounce'], ['run.end', '@ember/runloop', 'end'], ['run.hasScheduledTimers', '@ember/runloop', 'hasScheduledTimers'], ['run.join', '@ember/runloop', 'join'], ['run.later', '@ember/runloop', 'later'], ['run.next', '@ember/runloop', 'next'], ['run.once', '@ember/runloop', 'once'], ['run.schedule', '@ember/runloop', 'schedule'], ['run.scheduleOnce', '@ember/runloop', 'scheduleOnce'], ['run.throttle', '@ember/runloop', 'throttle'], ['run.currentRunLoop', '@ember/runloop', { get: 'getCurrentRunLoop' }], ['run.cancelTimers', '@ember/runloop', 'cancelTimers'], ['notifyPropertyChange', '@ember/-internals/metal'], ['overrideChains', '@ember/-internals/metal'], ['beginPropertyChanges', '@ember/-internals/metal'], ['endPropertyChanges', '@ember/-internals/metal'], ['changeProperties', '@ember/-internals/metal'], ['platform.defineProperty', null, { value: true }], ['platform.hasPropertyAccessors', null, { value: true }], ['defineProperty', '@ember/-internals/metal'], ['watchKey', '@ember/-internals/metal'], ['unwatchKey', '@ember/-internals/metal'], ['removeChainWatcher', '@ember/-internals/metal'], ['_ChainNode', '@ember/-internals/metal', 'ChainNode'], ['finishChains', '@ember/-internals/metal'], ['watchPath', '@ember/-internals/metal'], ['unwatchPath', '@ember/-internals/metal'], ['watch', '@ember/-internals/metal'], ['isWatching', '@ember/-internals/metal'], ['unwatch', '@ember/-internals/metal'], ['destroy', '@ember/-internals/meta', 'deleteMeta'], ['libraries', '@ember/-internals/metal'], ['OrderedSet', '@ember/map/lib/ordered-set', 'default'], ['Map', '@ember/map', 'default'], ['MapWithDefault', '@ember/map/with-default', 'default'], ['getProperties', '@ember/-internals/metal'], ['setProperties', '@ember/-internals/metal'], ['expandProperties', '@ember/-internals/metal'], ['addObserver', '@ember/-internals/metal'], ['removeObserver', '@ember/-internals/metal'], ['aliasMethod', '@ember/-internals/metal'], ['observer', '@ember/-internals/metal'], ['mixin', '@ember/-internals/metal'], ['Mixin', '@ember/-internals/metal'],

  // @ember/-internals/console
  ['Logger', '@ember/-internals/console', 'default'],

  // @ember/-internals/views
  !_views.jQueryDisabled && ['$', '@ember/-internals/views', 'jQuery'], ['ViewUtils.isSimpleClick', '@ember/-internals/views', 'isSimpleClick'], ['ViewUtils.getViewElement', '@ember/-internals/views', 'getViewElement'], ['ViewUtils.getViewBounds', '@ember/-internals/views', 'getViewBounds'], ['ViewUtils.getViewClientRects', '@ember/-internals/views', 'getViewClientRects'], ['ViewUtils.getViewBoundingClientRect', '@ember/-internals/views', 'getViewBoundingClientRect'], ['ViewUtils.getRootViews', '@ember/-internals/views', 'getRootViews'], ['ViewUtils.getChildViews', '@ember/-internals/views', 'getChildViews'], ['ViewUtils.isSerializationFirstNode', '@ember/-internals/glimmer', 'isSerializationFirstNode'], ['TextSupport', '@ember/-internals/views'], ['ComponentLookup', '@ember/-internals/views'], ['EventDispatcher', '@ember/-internals/views'],

  // @ember/-internals/glimmer
  ['Component', '@ember/-internals/glimmer', 'Component'], ['Helper', '@ember/-internals/glimmer', 'Helper'], ['Helper.helper', '@ember/-internals/glimmer', 'helper'], ['Checkbox', '@ember/-internals/glimmer', 'Checkbox'], ['LinkComponent', '@ember/-internals/glimmer', 'LinkComponent'], ['TextArea', '@ember/-internals/glimmer', 'TextArea'], ['TextField', '@ember/-internals/glimmer', 'TextField'], ['TEMPLATES', '@ember/-internals/glimmer', { get: 'getTemplates', set: 'setTemplates' }], ['Handlebars.template', '@ember/-internals/glimmer', 'template'], ['HTMLBars.template', '@ember/-internals/glimmer', 'template'], ['Handlebars.Utils.escapeExpression', '@ember/-internals/glimmer', 'escapeExpression'], ['String.htmlSafe', '@ember/-internals/glimmer', 'htmlSafe'], ['_setComponentManager', '@ember/-internals/glimmer', 'setComponentManager'], ['_componentManagerCapabilities', '@ember/-internals/glimmer', 'capabilities'],

  // @ember/-internals/runtime
  ['A', '@ember/-internals/runtime'], ['_RegistryProxyMixin', '@ember/-internals/runtime', 'RegistryProxyMixin'], ['_ContainerProxyMixin', '@ember/-internals/runtime', 'ContainerProxyMixin'], ['Object', '@ember/-internals/runtime'], ['String.loc', '@ember/string', 'loc'], ['String.w', '@ember/string', 'w'], ['String.dasherize', '@ember/string', 'dasherize'], ['String.decamelize', '@ember/string', 'decamelize'], ['String.camelize', '@ember/string', 'camelize'], ['String.classify', '@ember/string', 'classify'], ['String.underscore', '@ember/string', 'underscore'], ['String.capitalize', '@ember/string', 'capitalize'], ['compare', '@ember/-internals/runtime'], ['copy', '@ember/-internals/runtime'], ['isEqual', '@ember/-internals/runtime'], ['inject.controller', '@ember/controller', 'inject'], ['inject.service', '@ember/service', 'inject'], ['Array', '@ember/-internals/runtime'], ['Comparable', '@ember/-internals/runtime'], ['Namespace', '@ember/-internals/runtime'], ['Enumerable', '@ember/-internals/runtime'], ['ArrayProxy', '@ember/-internals/runtime'], ['ObjectProxy', '@ember/-internals/runtime'], ['ActionHandler', '@ember/-internals/runtime'], ['CoreObject', '@ember/-internals/runtime'], ['NativeArray', '@ember/-internals/runtime'], ['Copyable', '@ember/-internals/runtime'], ['MutableEnumerable', '@ember/-internals/runtime'], ['MutableArray', '@ember/-internals/runtime'], ['TargetActionSupport', '@ember/-internals/runtime'], ['Evented', '@ember/-internals/runtime'], ['PromiseProxyMixin', '@ember/-internals/runtime'], ['Observable', '@ember/-internals/runtime'], ['typeOf', '@ember/-internals/runtime'], ['isArray', '@ember/-internals/runtime'], ['Object', '@ember/-internals/runtime'], ['onLoad', '@ember/application'], ['runLoadHooks', '@ember/application'], ['Controller', '@ember/controller', 'default'], ['ControllerMixin', '@ember/controller/lib/controller_mixin', 'default'], ['Service', '@ember/service', 'default'], ['_ProxyMixin', '@ember/-internals/runtime'], ['RSVP', '@ember/-internals/runtime'], ['STRINGS', '@ember/string', { get: '_getStrings', set: '_setStrings' }], ['BOOTED', '@ember/-internals/metal', { get: 'isNamespaceSearchDisabled', set: 'setNamespaceSearchDisabled' }], ['computed.empty', '@ember/object/computed', 'empty'], ['computed.notEmpty', '@ember/object/computed', 'notEmpty'], ['computed.none', '@ember/object/computed', 'none'], ['computed.not', '@ember/object/computed', 'not'], ['computed.bool', '@ember/object/computed', 'bool'], ['computed.match', '@ember/object/computed', 'match'], ['computed.equal', '@ember/object/computed', 'equal'], ['computed.gt', '@ember/object/computed', 'gt'], ['computed.gte', '@ember/object/computed', 'gte'], ['computed.lt', '@ember/object/computed', 'lt'], ['computed.lte', '@ember/object/computed', 'lte'], ['computed.oneWay', '@ember/object/computed', 'oneWay'], ['computed.reads', '@ember/object/computed', 'oneWay'], ['computed.readOnly', '@ember/object/computed', 'readOnly'], ['computed.deprecatingAlias', '@ember/object/computed', 'deprecatingAlias'], ['computed.and', '@ember/object/computed', 'and'], ['computed.or', '@ember/object/computed', 'or'], ['computed.sum', '@ember/object/computed', 'sum'], ['computed.min', '@ember/object/computed', 'min'], ['computed.max', '@ember/object/computed', 'max'], ['computed.map', '@ember/object/computed', 'map'], ['computed.sort', '@ember/object/computed', 'sort'], ['computed.setDiff', '@ember/object/computed', 'setDiff'], ['computed.mapBy', '@ember/object/computed', 'mapBy'], ['computed.filter', '@ember/object/computed', 'filter'], ['computed.filterBy', '@ember/object/computed', 'filterBy'], ['computed.uniq', '@ember/object/computed', 'uniq'], ['computed.uniqBy', '@ember/object/computed', 'uniqBy'], ['computed.union', '@ember/object/computed', 'union'], ['computed.intersect', '@ember/object/computed', 'intersect'], ['computed.collect', '@ember/object/computed', 'collect'],

  // @ember/-internals/routing
  ['Location', '@ember/-internals/routing'], ['AutoLocation', '@ember/-internals/routing'], ['HashLocation', '@ember/-internals/routing'], ['HistoryLocation', '@ember/-internals/routing'], ['NoneLocation', '@ember/-internals/routing'], ['controllerFor', '@ember/-internals/routing'], ['generateControllerFactory', '@ember/-internals/routing'], ['generateController', '@ember/-internals/routing'], ['RouterDSL', '@ember/-internals/routing'], ['Router', '@ember/-internals/routing'], ['Route', '@ember/-internals/routing'],

  // ember-application
  ['Application', '@ember/application', 'default'], ['ApplicationInstance', '@ember/application/instance', 'default'], ['Engine', '@ember/engine', 'default'], ['EngineInstance', '@ember/engine/instance', 'default'], ['Resolver', '@ember/application/globals-resolver', 'default'], ['DefaultResolver', '@ember/application/globals-resolver', 'default'],

  // @ember/-internals/extension-support
  ['DataAdapter', '@ember/-internals/extension-support'], ['ContainerDebugAdapter', '@ember/-internals/extension-support']].filter(Boolean);
});
enifed('ember/tests/routing/decoupled_basic_test', ['@ember/-internals/owner', 'rsvp', 'ember-template-compiler', '@ember/-internals/routing', '@ember/controller', '@ember/-internals/runtime', 'internal-test-helpers', '@ember/runloop', '@ember/-internals/metal', '@ember/-internals/glimmer', '@ember/engine', 'router_js'], function (_owner, _rsvp, _emberTemplateCompiler, _routing, _controller, _runtime, _internalTestHelpers, _runloop, _metal, _glimmer, _engine, _router_js) {
  'use strict';

  let originalConsoleError; /* eslint-disable no-console */


  (0, _internalTestHelpers.moduleFor)('Basic Routing - Decoupled from global resolver', class extends _internalTestHelpers.ApplicationTestCase {
    constructor() {
      super(...arguments);
      this.addTemplate('home', '<h3 class="hours">Hours</h3>');
      this.addTemplate('camelot', '<section id="camelot"><h3>Is a silly place</h3></section>');
      this.addTemplate('homepage', '<h3 id="troll">Megatroll</h3><p>{{model.home}}</p>');

      this.router.map(function () {
        this.route('home', { path: '/' });
      });

      originalConsoleError = console.error;
    }

    teardown() {
      super.teardown();
      console.error = originalConsoleError;
    }

    getController(name) {
      return this.applicationInstance.lookup(`controller:${name}`);
    }

    handleURLAborts(assert, path) {
      (0, _runloop.run)(() => {
        let router = this.applicationInstance.lookup('router:main');
        router.handleURL(path).then(function () {
          assert.ok(false, 'url: `' + path + '` was NOT to be handled');
        }, function (reason) {
          assert.ok(reason && reason.message === 'TransitionAborted', 'url: `' + path + '` was to be aborted');
        });
      });
    }

    get currentPath() {
      return this.getController('application').get('currentPath');
    }

    get currentURL() {
      return this.appRouter.get('currentURL');
    }

    handleURLRejectsWith(context, assert, path, expectedReason) {
      return context.visit(path).then(() => {
        assert.ok(false, 'expected handleURLing: `' + path + '` to fail');
      }).catch(reason => {
        assert.equal(reason.message, expectedReason);
      });
    }

    ['@test warn on URLs not included in the route set']() {
      return this.visit('/').then(() => {
        expectAssertion(() => {
          this.visit('/what-is-this-i-dont-even');
        }, /'\/what-is-this-i-dont-even' did not match any routes/);
      });
    }

    ['@test The Homepage'](assert) {
      return this.visit('/').then(() => {
        assert.equal(this.currentPath, 'home', 'currently on the home route');

        let text = this.$('.hours').text();
        assert.equal(text, 'Hours', 'the home template was rendered');
      });
    }

    [`@test The Homepage and the Camelot page with multiple Router.map calls`](assert) {
      this.router.map(function () {
        this.route('camelot', { path: '/camelot' });
      });

      return this.visit('/camelot').then(() => {
        assert.equal(this.currentPath, 'camelot');

        let text = this.$('#camelot').text();
        assert.equal(text, 'Is a silly place', 'the camelot template was rendered');

        return this.visit('/');
      }).then(() => {
        assert.equal(this.currentPath, 'home');

        let text = this.$('.hours').text();
        assert.equal(text, 'Hours', 'the home template was rendered');
      });
    }

    [`@test The Homepage with explicit template name in renderTemplate`](assert) {
      this.add('route:home', _routing.Route.extend({
        renderTemplate() {
          this.render('homepage');
        }
      }));

      return this.visit('/').then(() => {
        let text = this.$('#troll').text();
        assert.equal(text, 'Megatroll', 'the homepage template was rendered');
      });
    }

    [`@test an alternate template will pull in an alternate controller`](assert) {
      this.add('route:home', _routing.Route.extend({
        renderTemplate() {
          this.render('homepage');
        }
      }));
      this.add('controller:homepage', _controller.default.extend({
        model: {
          home: 'Comes from homepage'
        }
      }));

      return this.visit('/').then(() => {
        let text = this.$('p').text();

        assert.equal(text, 'Comes from homepage', 'the homepage template was rendered');
      });
    }

    [`@test An alternate template will pull in an alternate controller instead of controllerName`](assert) {
      this.add('route:home', _routing.Route.extend({
        controllerName: 'foo',
        renderTemplate() {
          this.render('homepage');
        }
      }));
      this.add('controller:foo', _controller.default.extend({
        model: {
          home: 'Comes from foo'
        }
      }));
      this.add('controller:homepage', _controller.default.extend({
        model: {
          home: 'Comes from homepage'
        }
      }));

      return this.visit('/').then(() => {
        let text = this.$('p').text();

        assert.equal(text, 'Comes from homepage', 'the homepage template was rendered');
      });
    }

    [`@test The template will pull in an alternate controller via key/value`](assert) {
      this.router.map(function () {
        this.route('homepage', { path: '/' });
      });

      this.add('route:homepage', _routing.Route.extend({
        renderTemplate() {
          this.render({ controller: 'home' });
        }
      }));
      this.add('controller:home', _controller.default.extend({
        model: {
          home: 'Comes from home.'
        }
      }));

      return this.visit('/').then(() => {
        let text = this.$('p').text();

        assert.equal(text, 'Comes from home.', 'the homepage template was rendered from data from the HomeController');
      });
    }

    [`@test The Homepage with explicit template name in renderTemplate and controller`](assert) {
      this.add('controller:home', _controller.default.extend({
        model: {
          home: 'YES I AM HOME'
        }
      }));
      this.add('route:home', _routing.Route.extend({
        renderTemplate() {
          this.render('homepage');
        }
      }));

      return this.visit('/').then(() => {
        let text = this.$('p').text();

        assert.equal(text, 'YES I AM HOME', 'The homepage template was rendered');
      });
    }

    [`@test Model passed via renderTemplate model is set as controller's model`](assert) {
      this.addTemplate('bio', '<p>{{model.name}}</p>');
      this.add('route:home', _routing.Route.extend({
        renderTemplate() {
          this.render('bio', {
            model: { name: 'emberjs' }
          });
        }
      }));

      return this.visit('/').then(() => {
        let text = this.$('p').text();

        assert.equal(text, 'emberjs', `Passed model was set as controller's model`);
      });
    }

    ['@test render uses templateName from route'](assert) {
      this.addTemplate('the_real_home_template', '<p>THIS IS THE REAL HOME</p>');
      this.add('route:home', _routing.Route.extend({
        templateName: 'the_real_home_template'
      }));

      return this.visit('/').then(() => {
        let text = this.$('p').text();

        assert.equal(text, 'THIS IS THE REAL HOME', 'the homepage template was rendered');
      });
    }

    ['@test defining templateName allows other templates to be rendered'](assert) {
      this.addTemplate('alert', `<div class='alert-box'>Invader!</div>`);
      this.addTemplate('the_real_home_template', `<p>THIS IS THE REAL HOME</p>{{outlet 'alert'}}`);
      this.add('route:home', _routing.Route.extend({
        templateName: 'the_real_home_template',
        actions: {
          showAlert() {
            this.render('alert', {
              into: 'home',
              outlet: 'alert'
            });
          }
        }
      }));

      return this.visit('/').then(() => {
        let text = this.$('p').text();
        assert.equal(text, 'THIS IS THE REAL HOME', 'the homepage template was rendered');

        return this.runTask(() => this.appRouter.send('showAlert'));
      }).then(() => {
        let text = this.$('.alert-box').text();

        assert.equal(text, 'Invader!', 'Template for alert was rendered into the outlet');
      });
    }

    ['@test templateName is still used when calling render with no name and options'](assert) {
      this.addTemplate('alert', `<div class='alert-box'>Invader!</div>`);
      this.addTemplate('home', `<p>THIS IS THE REAL HOME</p>{{outlet 'alert'}}`);

      this.add('route:home', _routing.Route.extend({
        templateName: 'alert',
        renderTemplate() {
          this.render({});
        }
      }));

      return this.visit('/').then(() => {
        let text = this.$('.alert-box').text();

        assert.equal(text, 'Invader!', 'default templateName was rendered into outlet');
      });
    }

    ['@test The Homepage with a `setupController` hook'](assert) {
      this.addTemplate('home', `<ul>{{#each hours as |entry|}}
        <li>{{entry}}</li>
      {{/each}}
      </ul>
    `);

      this.add('route:home', _routing.Route.extend({
        setupController(controller) {
          controller.set('hours', ['Monday through Friday: 9am to 5pm', 'Saturday: Noon to Midnight', 'Sunday: Noon to 6pm']);
        }
      }));
      return this.visit('/').then(() => {
        let text = this.$('ul li:nth-child(3)').text();

        assert.equal(text, 'Sunday: Noon to 6pm', 'The template was rendered with the hours context');
      });
    }

    [`@test The route controller is still set when overriding the setupController hook`](assert) {
      this.add('route:home', _routing.Route.extend({
        setupController() {
          // no-op
          // importantly, we are not calling this._super
        }
      }));

      this.add('controller:home', _controller.default.extend());

      return this.visit('/').then(() => {
        let homeRoute = this.applicationInstance.lookup('route:home');
        let homeController = this.applicationInstance.lookup('controller:home');

        assert.equal(homeRoute.controller, homeController, 'route controller is the home controller');
      });
    }

    ['@test the route controller can be specified via controllerName'](assert) {
      this.addTemplate('home', '<p>{{myValue}}</p>');
      this.add('route:home', _routing.Route.extend({
        controllerName: 'myController'
      }));
      this.add('controller:myController', _controller.default.extend({
        myValue: 'foo'
      }));

      return this.visit('/').then(() => {
        let homeRoute = this.applicationInstance.lookup('route:home');
        let myController = this.applicationInstance.lookup('controller:myController');
        let text = this.$('p').text();

        assert.equal(homeRoute.controller, myController, 'route controller is set by controllerName');
        assert.equal(text, 'foo', 'The homepage template was rendered with data from the custom controller');
      });
    }

    [`@test The route controller specified via controllerName is used in render`](assert) {
      this.router.map(function () {
        this.route('home', { path: '/' });
      });

      this.add('route:home', _routing.Route.extend({
        controllerName: 'myController',
        renderTemplate() {
          this.render('alternative_home');
        }
      }));

      this.add('controller:myController', _controller.default.extend({
        myValue: 'foo'
      }));

      this.addTemplate('alternative_home', '<p>alternative home: {{myValue}}</p>');

      return this.visit('/').then(() => {
        let homeRoute = this.applicationInstance.lookup('route:home');
        let myController = this.applicationInstance.lookup('controller:myController');
        let text = this.$('p').text();

        assert.equal(homeRoute.controller, myController, 'route controller is set by controllerName');

        assert.equal(text, 'alternative home: foo', 'The homepage template was rendered with data from the custom controller');
      });
    }

    [`@test The route controller specified via controllerName is used in render even when a controller with the routeName is available`](assert) {
      this.router.map(function () {
        this.route('home', { path: '/' });
      });

      this.addTemplate('home', '<p>home: {{myValue}}</p>');

      this.add('route:home', _routing.Route.extend({
        controllerName: 'myController'
      }));

      this.add('controller:home', _controller.default.extend({
        myValue: 'home'
      }));

      this.add('controller:myController', _controller.default.extend({
        myValue: 'myController'
      }));

      return this.visit('/').then(() => {
        let homeRoute = this.applicationInstance.lookup('route:home');
        let myController = this.applicationInstance.lookup('controller:myController');
        let text = this.$('p').text();

        assert.equal(homeRoute.controller, myController, 'route controller is set by controllerName');

        assert.equal(text, 'home: myController', 'The homepage template was rendered with data from the custom controller');
      });
    }

    [`@test The Homepage with a 'setupController' hook modifying other controllers`](assert) {
      this.router.map(function () {
        this.route('home', { path: '/' });
      });

      this.add('route:home', _routing.Route.extend({
        setupController() /* controller */{
          this.controllerFor('home').set('hours', ['Monday through Friday: 9am to 5pm', 'Saturday: Noon to Midnight', 'Sunday: Noon to 6pm']);
        }
      }));

      this.addTemplate('home', '<ul>{{#each hours as |entry|}}<li>{{entry}}</li>{{/each}}</ul>');

      return this.visit('/').then(() => {
        let text = this.$('ul li:nth-child(3)').text();

        assert.equal(text, 'Sunday: Noon to 6pm', 'The template was rendered with the hours context');
      });
    }

    [`@test The Homepage with a computed model that does not get overridden`](assert) {
      this.router.map(function () {
        this.route('home', { path: '/' });
      });

      this.add('controller:home', _controller.default.extend({
        model: (0, _metal.computed)(function () {
          return ['Monday through Friday: 9am to 5pm', 'Saturday: Noon to Midnight', 'Sunday: Noon to 6pm'];
        })
      }));

      this.addTemplate('home', '<ul>{{#each model as |passage|}}<li>{{passage}}</li>{{/each}}</ul>');

      return this.visit('/').then(() => {
        let text = this.$('ul li:nth-child(3)').text();

        assert.equal(text, 'Sunday: Noon to 6pm', 'The template was rendered with the context intact');
      });
    }

    [`@test The Homepage getting its controller context via model`](assert) {
      this.router.map(function () {
        this.route('home', { path: '/' });
      });

      this.add('route:home', _routing.Route.extend({
        model() {
          return ['Monday through Friday: 9am to 5pm', 'Saturday: Noon to Midnight', 'Sunday: Noon to 6pm'];
        },

        setupController(controller, model) {
          assert.equal(this.controllerFor('home'), controller);

          this.controllerFor('home').set('hours', model);
        }
      }));

      this.addTemplate('home', '<ul>{{#each hours as |entry|}}<li>{{entry}}</li>{{/each}}</ul>');

      return this.visit('/').then(() => {
        let text = this.$('ul li:nth-child(3)').text();

        assert.equal(text, 'Sunday: Noon to 6pm', 'The template was rendered with the hours context');
      });
    }

    [`@test The Specials Page getting its controller context by deserializing the params hash`](assert) {
      this.router.map(function () {
        this.route('home', { path: '/' });
        this.route('special', { path: '/specials/:menu_item_id' });
      });

      this.add('route:special', _routing.Route.extend({
        model(params) {
          return _runtime.Object.create({
            menuItemId: params.menu_item_id
          });
        }
      }));

      this.addTemplate('special', '<p>{{model.menuItemId}}</p>');

      return this.visit('/specials/1').then(() => {
        let text = this.$('p').text();

        assert.equal(text, '1', 'The model was used to render the template');
      });
    }

    ['@test The Specials Page defaults to looking models up via `find`']() {
      let MenuItem = _runtime.Object.extend();
      MenuItem.reopenClass({
        find(id) {
          return MenuItem.create({ id });
        }
      });
      this.add('model:menu_item', MenuItem);

      this.router.map(function () {
        this.route('home', { path: '/' });
        this.route('special', { path: '/specials/:menu_item_id' });
      });

      this.addTemplate('special', '{{model.id}}');

      return this.visit('/specials/1').then(() => {
        this.assertText('1', 'The model was used to render the template');
      });
    }

    ['@test The Special Page returning a promise puts the app into a loading state until the promise is resolved']() {
      this.router.map(function () {
        this.route('home', { path: '/' });
        this.route('special', { path: '/specials/:menu_item_id' });
      });

      let menuItem, resolve;

      let MenuItem = _runtime.Object.extend();
      MenuItem.reopenClass({
        find(id) {
          menuItem = MenuItem.create({ id: id });

          return new _rsvp.default.Promise(function (res) {
            resolve = res;
          });
        }
      });

      this.add('model:menu_item', MenuItem);

      this.addTemplate('special', '<p>{{model.id}}</p>');
      this.addTemplate('loading', '<p>LOADING!</p>');

      let visited = this.visit('/specials/1');
      this.assertText('LOADING!', 'The app is in the loading state');

      resolve(menuItem);

      return visited.then(() => {
        this.assertText('1', 'The app is now in the specials state');
      });
    }

    [`@test The loading state doesn't get entered for promises that resolve on the same run loop`](assert) {
      this.router.map(function () {
        this.route('home', { path: '/' });
        this.route('special', { path: '/specials/:menu_item_id' });
      });

      let MenuItem = _runtime.Object.extend();
      MenuItem.reopenClass({
        find(id) {
          return { id: id };
        }
      });

      this.add('model:menu_item', MenuItem);

      this.add('route:loading', _routing.Route.extend({
        enter() {
          assert.ok(false, "LoadingRoute shouldn't have been entered.");
        }
      }));

      this.addTemplate('special', '<p>{{model.id}}</p>');
      this.addTemplate('loading', '<p>LOADING!</p>');

      return this.visit('/specials/1').then(() => {
        let text = this.$('p').text();

        assert.equal(text, '1', 'The app is now in the specials state');
      });
    }

    ["@test The Special page returning an error invokes SpecialRoute's error handler"](assert) {
      this.router.map(function () {
        this.route('home', { path: '/' });
        this.route('special', { path: '/specials/:menu_item_id' });
      });

      let menuItem, promise, resolve;

      let MenuItem = _runtime.Object.extend();
      MenuItem.reopenClass({
        find(id) {
          menuItem = MenuItem.create({ id: id });
          promise = new _rsvp.default.Promise(res => resolve = res);

          return promise;
        }
      });

      this.add('model:menu_item', MenuItem);

      this.add('route:special', _routing.Route.extend({
        setup() {
          throw new Error('Setup error');
        },
        actions: {
          error(reason) {
            assert.equal(reason.message, 'Setup error', 'SpecialRoute#error received the error thrown from setup');
            return true;
          }
        }
      }));

      this.handleURLRejectsWith(this, assert, 'specials/1', 'Setup error');

      (0, _runloop.run)(() => resolve(menuItem));
    }

    ["@test ApplicationRoute's default error handler can be overridden"](assert) {
      assert.expect(2);

      this.router.map(function () {
        this.route('home', { path: '/' });
        this.route('special', { path: '/specials/:menu_item_id' });
      });

      let menuItem, resolve;

      let MenuItem = _runtime.Object.extend();

      MenuItem.reopenClass({
        find(id) {
          menuItem = MenuItem.create({ id: id });
          return new _rsvp.default.Promise(res => resolve = res);
        }
      });
      this.add('model:menu_item', MenuItem);

      this.add('route:application', _routing.Route.extend({
        actions: {
          error(reason) {
            assert.equal(reason.message, 'Setup error', 'error was correctly passed to custom ApplicationRoute handler');
            return true;
          }
        }
      }));

      this.add('route:special', _routing.Route.extend({
        setup() {
          throw new Error('Setup error');
        }
      }));

      this.handleURLRejectsWith(this, assert, '/specials/1', 'Setup error');

      (0, _runloop.run)(() => resolve(menuItem));
    }

    ['@test Moving from one page to another triggers the correct callbacks'](assert) {
      assert.expect(3);

      this.router.map(function () {
        this.route('home', { path: '/' });
        this.route('special', { path: '/specials/:menu_item_id' });
      });

      let MenuItem = _runtime.Object.extend();
      MenuItem.reopenClass({
        find(id) {
          return MenuItem.create({ id: id });
        }
      });
      this.add('model:menu_item', MenuItem);

      this.addTemplate('home', '<h3>Home</h3>');
      this.addTemplate('special', '<p>{{model.id}}</p>');

      return this.visit('/').then(() => {
        this.assertText('Home', 'The app is now in the initial state');

        let promiseContext = MenuItem.create({ id: 1 });

        return this.visit('/specials/1', promiseContext);
      }).then(() => {
        assert.equal(this.currentURL, '/specials/1');
        this.assertText('1', 'The app is now transitioned');
      });
    }

    ['@test Nested callbacks are not exited when moving to siblings'](assert) {
      let rootSetup = 0;
      let rootRender = 0;
      let rootModel = 0;
      let rootSerialize = 0;
      let menuItem;
      let rootElement;

      let MenuItem = _runtime.Object.extend();
      MenuItem.reopenClass({
        find(id) {
          menuItem = MenuItem.create({ id: id });
          return menuItem;
        }
      });

      this.router.map(function () {
        this.route('root', { path: '/' }, function () {
          this.route('special', {
            path: '/specials/:menu_item_id',
            resetNamespace: true
          });
        });
      });

      this.add('route:root', _routing.Route.extend({
        model() {
          rootModel++;
          return this._super(...arguments);
        },

        setupController() {
          rootSetup++;
        },

        renderTemplate() {
          rootRender++;
        },

        serialize() {
          rootSerialize++;
          return this._super(...arguments);
        }
      }));

      this.add('route:loading', _routing.Route.extend({}));
      this.add('route:home', _routing.Route.extend({}));
      this.add('route:special', _routing.Route.extend({
        model({ menu_item_id }) {
          return MenuItem.find(menu_item_id);
        },
        setupController(controller, model) {
          (0, _metal.set)(controller, 'model', model);
        }
      }));

      this.addTemplate('root.index', '<h3>Home</h3>');
      this.addTemplate('special', '<p>{{model.id}}</p>');
      this.addTemplate('loading', '<p>LOADING!</p>');

      return this.visit('/').then(() => {
        rootElement = document.getElementById('qunit-fixture');

        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('h3')), 'Home', 'The app is now in the initial state');
        assert.equal(rootSetup, 1, 'The root setup was triggered');
        assert.equal(rootRender, 1, 'The root render was triggered');
        assert.equal(rootSerialize, 0, 'The root serialize was not called');
        assert.equal(rootModel, 1, 'The root model was called');

        let router = this.applicationInstance.lookup('router:main');
        let menuItem = MenuItem.create({ id: 1 });

        return router.transitionTo('special', menuItem).then(function () {
          assert.equal(rootSetup, 1, 'The root setup was not triggered again');
          assert.equal(rootRender, 1, 'The root render was not triggered again');
          assert.equal(rootSerialize, 0, 'The root serialize was not called');

          // TODO: Should this be changed?
          assert.equal(rootModel, 1, 'The root model was called again');

          assert.deepEqual(router.location.path, '/specials/1');
          assert.equal(router.currentPath, 'root.special');
        });
      });
    }

    ['@test Events are triggered on the controller if a matching action name is implemented'](assert) {
      let done = assert.async();

      this.router.map(function () {
        this.route('home', { path: '/' });
      });

      let model = { name: 'Tom Dale' };
      let stateIsNotCalled = true;

      this.add('route:home', _routing.Route.extend({
        model() {
          return model;
        },

        actions: {
          showStuff() {
            stateIsNotCalled = false;
          }
        }
      }));

      this.addTemplate('home', '<a {{action "showStuff" model}}>{{name}}</a>');
      this.add('controller:home', _controller.default.extend({
        actions: {
          showStuff(context) {
            assert.ok(stateIsNotCalled, 'an event on the state is not triggered');
            assert.deepEqual(context, { name: 'Tom Dale' }, 'an event with context is passed');
            done();
          }
        }
      }));

      this.visit('/').then(() => {
        document.getElementById('qunit-fixture').querySelector('a').click();
      });
    }

    ['@test Events are triggered on the current state when defined in `actions` object'](assert) {
      let done = assert.async();

      this.router.map(function () {
        this.route('home', { path: '/' });
      });

      let model = { name: 'Tom Dale' };
      let HomeRoute = _routing.Route.extend({
        model() {
          return model;
        },

        actions: {
          showStuff(obj) {
            assert.ok(this instanceof HomeRoute, 'the handler is an App.HomeRoute');
            assert.deepEqual(Object.assign({}, obj), { name: 'Tom Dale' }, 'the context is correct');
            done();
          }
        }
      });

      this.add('route:home', HomeRoute);
      this.addTemplate('home', '<a {{action "showStuff" model}}>{{model.name}}</a>');

      this.visit('/').then(() => {
        document.getElementById('qunit-fixture').querySelector('a').click();
      });
    }

    ['@test Events defined in `actions` object are triggered on the current state when routes are nested'](assert) {
      let done = assert.async();

      this.router.map(function () {
        this.route('root', { path: '/' }, function () {
          this.route('index', { path: '/' });
        });
      });

      let model = { name: 'Tom Dale' };

      let RootRoute = _routing.Route.extend({
        actions: {
          showStuff(obj) {
            assert.ok(this instanceof RootRoute, 'the handler is an App.HomeRoute');
            assert.deepEqual(Object.assign({}, obj), { name: 'Tom Dale' }, 'the context is correct');
            done();
          }
        }
      });
      this.add('route:root', RootRoute);
      this.add('route:root.index', _routing.Route.extend({
        model() {
          return model;
        }
      }));

      this.addTemplate('root.index', '<a {{action "showStuff" model}}>{{model.name}}</a>');

      this.visit('/').then(() => {
        document.getElementById('qunit-fixture').querySelector('a').click();
      });
    }

    ['@test Events can be handled by inherited event handlers'](assert) {
      assert.expect(4);

      let SuperRoute = _routing.Route.extend({
        actions: {
          foo() {
            assert.ok(true, 'foo');
          },
          bar(msg) {
            assert.equal(msg, 'HELLO', 'bar hander in super route');
          }
        }
      });

      let RouteMixin = _metal.Mixin.create({
        actions: {
          bar(msg) {
            assert.equal(msg, 'HELLO', 'bar handler in mixin');
            this._super(msg);
          }
        }
      });

      this.add('route:home', SuperRoute.extend(RouteMixin, {
        actions: {
          baz() {
            assert.ok(true, 'baz', 'baz hander in route');
          }
        }
      }));
      this.addTemplate('home', `
      <a class="do-foo" {{action "foo"}}>Do foo</a>
      <a class="do-bar-with-arg" {{action "bar" "HELLO"}}>Do bar with arg</a>
      <a class="do-baz" {{action "baz"}}>Do bar</a>
    `);

      return this.visit('/').then(() => {
        let rootElement = document.getElementById('qunit-fixture');
        rootElement.querySelector('.do-foo').click();
        rootElement.querySelector('.do-bar-with-arg').click();
        rootElement.querySelector('.do-baz').click();
      });
    }

    ['@test Actions are not triggered on the controller if a matching action name is implemented as a method'](assert) {
      let done = assert.async();

      this.router.map(function () {
        this.route('home', { path: '/' });
      });

      let model = { name: 'Tom Dale' };
      let stateIsNotCalled = true;

      this.add('route:home', _routing.Route.extend({
        model() {
          return model;
        },

        actions: {
          showStuff(context) {
            assert.ok(stateIsNotCalled, 'an event on the state is not triggered');
            assert.deepEqual(context, { name: 'Tom Dale' }, 'an event with context is passed');
            done();
          }
        }
      }));

      this.addTemplate('home', '<a {{action "showStuff" model}}>{{name}}</a>');

      this.add('controller:home', _controller.default.extend({
        showStuff() {
          stateIsNotCalled = false;
          assert.ok(stateIsNotCalled, 'an event on the state is not triggered');
        }
      }));

      this.visit('/').then(() => {
        document.getElementById('qunit-fixture').querySelector('a').click();
      });
    }

    ['@test actions can be triggered with multiple arguments'](assert) {
      let done = assert.async();
      this.router.map(function () {
        this.route('root', { path: '/' }, function () {
          this.route('index', { path: '/' });
        });
      });

      let model1 = { name: 'Tilde' };
      let model2 = { name: 'Tom Dale' };

      let RootRoute = _routing.Route.extend({
        actions: {
          showStuff(obj1, obj2) {
            assert.ok(this instanceof RootRoute, 'the handler is an App.HomeRoute');
            assert.deepEqual(Object.assign({}, obj1), { name: 'Tilde' }, 'the first context is correct');
            assert.deepEqual(Object.assign({}, obj2), { name: 'Tom Dale' }, 'the second context is correct');
            done();
          }
        }
      });

      this.add('route:root', RootRoute);

      this.add('controller:root.index', _controller.default.extend({
        model1: model1,
        model2: model2
      }));

      this.addTemplate('root.index', '<a {{action "showStuff" model1 model2}}>{{model1.name}}</a>');

      this.visit('/').then(() => {
        document.getElementById('qunit-fixture').querySelector('a').click();
      });
    }

    ['@test transitioning multiple times in a single run loop only sets the URL once'](assert) {
      this.router.map(function () {
        this.route('root', { path: '/' });
        this.route('foo');
        this.route('bar');
      });

      return this.visit('/').then(() => {
        let urlSetCount = 0;
        let router = this.applicationInstance.lookup('router:main');

        router.get('location').setURL = function (path) {
          urlSetCount++;
          (0, _metal.set)(this, 'path', path);
        };

        assert.equal(urlSetCount, 0);

        (0, _runloop.run)(function () {
          router.transitionTo('foo');
          router.transitionTo('bar');
        });

        assert.equal(urlSetCount, 1);
        assert.equal(router.get('location').getURL(), '/bar');
      });
    }

    ['@test navigating away triggers a url property change'](assert) {
      assert.expect(3);

      this.router.map(function () {
        this.route('root', { path: '/' });
        this.route('foo', { path: '/foo' });
        this.route('bar', { path: '/bar' });
      });

      return this.visit('/').then(() => {
        let router = this.applicationInstance.lookup('router:main');

        (0, _metal.addObserver)(router, 'url', function () {
          assert.ok(true, 'url change event was fired');
        });
        ['foo', 'bar', '/foo'].forEach(destination => (0, _runloop.run)(router, 'transitionTo', destination));
      });
    }

    ['@test using replaceWith calls location.replaceURL if available'](assert) {
      let setCount = 0;
      let replaceCount = 0;
      this.router.reopen({
        location: _routing.NoneLocation.create({
          setURL(path) {
            setCount++;
            (0, _metal.set)(this, 'path', path);
          },

          replaceURL(path) {
            replaceCount++;
            (0, _metal.set)(this, 'path', path);
          }
        })
      });

      this.router.map(function () {
        this.route('root', { path: '/' });
        this.route('foo');
      });

      return this.visit('/').then(() => {
        let router = this.applicationInstance.lookup('router:main');
        assert.equal(setCount, 1);
        assert.equal(replaceCount, 0);

        (0, _runloop.run)(() => router.replaceWith('foo'));

        assert.equal(setCount, 1, 'should not call setURL');
        assert.equal(replaceCount, 1, 'should call replaceURL once');
        assert.equal(router.get('location').getURL(), '/foo');
      });
    }

    ['@test using replaceWith calls setURL if location.replaceURL is not defined'](assert) {
      let setCount = 0;

      this.router.reopen({
        location: _routing.NoneLocation.create({
          setURL(path) {
            setCount++;
            (0, _metal.set)(this, 'path', path);
          }
        })
      });

      this.router.map(function () {
        this.route('root', { path: '/' });
        this.route('foo');
      });

      return this.visit('/').then(() => {
        let router = this.applicationInstance.lookup('router:main');

        assert.equal(setCount, 1);
        (0, _runloop.run)(() => router.replaceWith('foo'));
        assert.equal(setCount, 2, 'should call setURL once');
        assert.equal(router.get('location').getURL(), '/foo');
      });
    }

    ['@test Route inherits model from parent route'](assert) {
      assert.expect(9);

      this.router.map(function () {
        this.route('the-post', { path: '/posts/:post_id' }, function () {
          this.route('comments');

          this.route('shares', { path: '/shares/:share_id', resetNamespace: true }, function () {
            this.route('share');
          });
        });
      });

      let post1 = {};
      let post2 = {};
      let post3 = {};
      let share1 = {};
      let share2 = {};
      let share3 = {};

      let posts = {
        1: post1,
        2: post2,
        3: post3
      };
      let shares = {
        1: share1,
        2: share2,
        3: share3
      };

      this.add('route:the-post', _routing.Route.extend({
        model(params) {
          return posts[params.post_id];
        }
      }));

      this.add('route:the-post.comments', _routing.Route.extend({
        afterModel(post /*, transition */) {
          let parent_model = this.modelFor('the-post');

          assert.equal(post, parent_model);
        }
      }));

      this.add('route:shares', _routing.Route.extend({
        model(params) {
          return shares[params.share_id];
        }
      }));

      this.add('route:shares.share', _routing.Route.extend({
        afterModel(share /*, transition */) {
          let parent_model = this.modelFor('shares');

          assert.equal(share, parent_model);
        }
      }));

      return this.visit('/posts/1/comments').then(() => {
        assert.ok(true, 'url: /posts/1/comments was handled');
        return this.visit('/posts/1/shares/1');
      }).then(() => {
        assert.ok(true, 'url: /posts/1/shares/1 was handled');
        return this.visit('/posts/2/comments');
      }).then(() => {
        assert.ok(true, 'url: /posts/2/comments was handled');
        return this.visit('/posts/2/shares/2');
      }).then(() => {
        assert.ok(true, 'url: /posts/2/shares/2 was handled');
        return this.visit('/posts/3/comments');
      }).then(() => {
        assert.ok(true, 'url: /posts/3/shares was handled');
        return this.visit('/posts/3/shares/3');
      }).then(() => {
        assert.ok(true, 'url: /posts/3/shares/3 was handled');
      });
    }

    ['@test Routes with { resetNamespace: true } inherits model from parent route'](assert) {
      assert.expect(6);

      this.router.map(function () {
        this.route('the-post', { path: '/posts/:post_id' }, function () {
          this.route('comments', { resetNamespace: true }, function () {});
        });
      });

      let post1 = {};
      let post2 = {};
      let post3 = {};

      let posts = {
        1: post1,
        2: post2,
        3: post3
      };

      this.add('route:the-post', _routing.Route.extend({
        model(params) {
          return posts[params.post_id];
        }
      }));

      this.add('route:comments', _routing.Route.extend({
        afterModel(post /*, transition */) {
          let parent_model = this.modelFor('the-post');

          assert.equal(post, parent_model);
        }
      }));

      return this.visit('/posts/1/comments').then(() => {
        assert.ok(true, '/posts/1/comments');
        return this.visit('/posts/2/comments');
      }).then(() => {
        assert.ok(true, '/posts/2/comments');
        return this.visit('/posts/3/comments');
      }).then(() => {
        assert.ok(true, '/posts/3/comments');
      });
    }

    ['@test It is possible to get the model from a parent route'](assert) {
      assert.expect(6);

      this.router.map(function () {
        this.route('the-post', { path: '/posts/:post_id' }, function () {
          this.route('comments', { resetNamespace: true });
        });
      });

      let post1 = {};
      let post2 = {};
      let post3 = {};
      let currentPost;

      let posts = {
        1: post1,
        2: post2,
        3: post3
      };

      this.add('route:the-post', _routing.Route.extend({
        model(params) {
          return posts[params.post_id];
        }
      }));

      this.add('route:comments', _routing.Route.extend({
        model() {
          assert.equal(this.modelFor('the-post'), currentPost);
        }
      }));

      currentPost = post1;
      return this.visit('/posts/1/comments').then(() => {
        assert.ok(true, '/posts/1/comments has been handled');
        currentPost = post2;
        return this.visit('/posts/2/comments');
      }).then(() => {
        assert.ok(true, '/posts/2/comments has been handled');
        currentPost = post3;
        return this.visit('/posts/3/comments');
      }).then(() => {
        assert.ok(true, '/posts/3/comments has been handled');
      });
    }

    ['@test A redirection hook is provided'](assert) {
      this.router.map(function () {
        this.route('choose', { path: '/' });
        this.route('home');
      });

      let chooseFollowed = 0;
      let destination = 'home';

      this.add('route:choose', _routing.Route.extend({
        redirect() {
          if (destination) {
            this.transitionTo(destination);
          }
        },

        setupController() {
          chooseFollowed++;
        }
      }));

      return this.visit('/').then(() => {
        let rootElement = document.getElementById('qunit-fixture');
        assert.equal(chooseFollowed, 0, "The choose route wasn't entered since a transition occurred");
        assert.equal(rootElement.querySelectorAll('h3.hours').length, 1, 'The home template was rendered');
        assert.equal(this.applicationInstance.lookup('controller:application').get('currentPath'), 'home');
      });
    }

    ['@test Redirecting from the middle of a route aborts the remainder of the routes'](assert) {
      assert.expect(3);

      this.router.map(function () {
        this.route('home');
        this.route('foo', function () {
          this.route('bar', { resetNamespace: true }, function () {
            this.route('baz');
          });
        });
      });

      this.add('route:bar', _routing.Route.extend({
        redirect() {
          this.transitionTo('home');
        },
        setupController() {
          assert.ok(false, 'Should transition before setupController');
        }
      }));

      this.add('route:bar-baz', _routing.Route.extend({
        enter() {
          assert.ok(false, 'Should abort transition getting to next route');
        }
      }));

      return this.visit('/').then(() => {
        let router = this.applicationInstance.lookup('router:main');
        this.handleURLAborts(assert, '/foo/bar/baz');
        assert.equal(this.applicationInstance.lookup('controller:application').get('currentPath'), 'home');
        assert.equal(router.get('location').getURL(), '/home');
      });
    }

    ['@test Redirecting to the current target in the middle of a route does not abort initial routing'](assert) {
      assert.expect(5);

      this.router.map(function () {
        this.route('home');
        this.route('foo', function () {
          this.route('bar', { resetNamespace: true }, function () {
            this.route('baz');
          });
        });
      });

      let successCount = 0;

      this.add('route:bar', _routing.Route.extend({
        redirect() {
          return this.transitionTo('bar.baz').then(function () {
            successCount++;
          });
        },

        setupController() {
          assert.ok(true, "Should still invoke bar's setupController");
        }
      }));

      this.add('route:bar.baz', _routing.Route.extend({
        setupController() {
          assert.ok(true, "Should still invoke bar.baz's setupController");
        }
      }));

      return this.visit('/foo/bar/baz').then(() => {
        assert.ok(true, '/foo/bar/baz has been handled');
        assert.equal(this.applicationInstance.lookup('controller:application').get('currentPath'), 'foo.bar.baz');
        assert.equal(successCount, 1, 'transitionTo success handler was called once');
      });
    }

    ['@test Redirecting to the current target with a different context aborts the remainder of the routes'](assert) {
      assert.expect(4);

      this.router.map(function () {
        this.route('home');
        this.route('foo', function () {
          this.route('bar', { path: 'bar/:id', resetNamespace: true }, function () {
            this.route('baz');
          });
        });
      });

      let model = { id: 2 };

      let count = 0;

      this.add('route:bar', _routing.Route.extend({
        afterModel() {
          if (count++ > 10) {
            assert.ok(false, 'infinite loop');
          } else {
            this.transitionTo('bar.baz', model);
          }
        }
      }));

      this.add('route:bar.baz', _routing.Route.extend({
        setupController() {
          assert.ok(true, 'Should still invoke setupController');
        }
      }));

      return this.visit('/').then(() => {
        this.handleURLAborts(assert, '/foo/bar/1/baz');
        assert.equal(this.applicationInstance.lookup('controller:application').get('currentPath'), 'foo.bar.baz');
        assert.equal(this.applicationInstance.lookup('router:main').get('location').getURL(), '/foo/bar/2/baz');
      });
    }

    ['@test Transitioning from a parent event does not prevent currentPath from being set'](assert) {
      this.router.map(function () {
        this.route('foo', function () {
          this.route('bar', { resetNamespace: true }, function () {
            this.route('baz');
          });
          this.route('qux');
        });
      });

      this.add('route:foo', _routing.Route.extend({
        actions: {
          goToQux() {
            this.transitionTo('foo.qux');
          }
        }
      }));

      return this.visit('/foo/bar/baz').then(() => {
        assert.ok(true, '/foo/bar/baz has been handled');
        let applicationController = this.applicationInstance.lookup('controller:application');
        let router = this.applicationInstance.lookup('router:main');
        assert.equal(applicationController.get('currentPath'), 'foo.bar.baz');
        (0, _runloop.run)(() => router.send('goToQux'));
        assert.equal(applicationController.get('currentPath'), 'foo.qux');
        assert.equal(router.get('location').getURL(), '/foo/qux');
      });
    }

    ['@test Generated names can be customized when providing routes with dot notation'](assert) {
      assert.expect(4);

      this.addTemplate('index', '<div>Index</div>');
      this.addTemplate('application', "<h1>Home</h1><div class='main'>{{outlet}}</div>");
      this.addTemplate('foo', "<div class='middle'>{{outlet}}</div>");
      this.addTemplate('bar', "<div class='bottom'>{{outlet}}</div>");
      this.addTemplate('bar.baz', '<p>{{name}}Bottom!</p>');

      this.router.map(function () {
        this.route('foo', { path: '/top' }, function () {
          this.route('bar', { path: '/middle', resetNamespace: true }, function () {
            this.route('baz', { path: '/bottom' });
          });
        });
      });

      this.add('route:foo', _routing.Route.extend({
        renderTemplate() {
          assert.ok(true, 'FooBarRoute was called');
          return this._super(...arguments);
        }
      }));

      this.add('route:bar.baz', _routing.Route.extend({
        renderTemplate() {
          assert.ok(true, 'BarBazRoute was called');
          return this._super(...arguments);
        }
      }));

      this.add('controller:bar', _controller.default.extend({
        name: 'Bar'
      }));

      this.add('controller:bar.baz', _controller.default.extend({
        name: 'BarBaz'
      }));

      return this.visit('/top/middle/bottom').then(() => {
        assert.ok(true, '/top/middle/bottom has been handled');
        let rootElement = document.getElementById('qunit-fixture');
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('.main .middle .bottom p')), 'BarBazBottom!', 'The templates were rendered into their appropriate parents');
      });
    }

    ["@test Child routes render into their parent route's template by default"](assert) {
      this.addTemplate('index', '<div>Index</div>');
      this.addTemplate('application', "<h1>Home</h1><div class='main'>{{outlet}}</div>");
      this.addTemplate('top', "<div class='middle'>{{outlet}}</div>");
      this.addTemplate('middle', "<div class='bottom'>{{outlet}}</div>");
      this.addTemplate('middle.bottom', '<p>Bottom!</p>');

      this.router.map(function () {
        this.route('top', function () {
          this.route('middle', { resetNamespace: true }, function () {
            this.route('bottom');
          });
        });
      });

      return this.visit('/top/middle/bottom').then(() => {
        assert.ok(true, '/top/middle/bottom has been handled');
        let rootElement = document.getElementById('qunit-fixture');
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('.main .middle .bottom p')), 'Bottom!', 'The templates were rendered into their appropriate parents');
      });
    }

    ['@test Child routes render into specified template'](assert) {
      this.addTemplate('index', '<div>Index</div>');
      this.addTemplate('application', "<h1>Home</h1><div class='main'>{{outlet}}</div>");
      this.addTemplate('top', "<div class='middle'>{{outlet}}</div>");
      this.addTemplate('middle', "<div class='bottom'>{{outlet}}</div>");
      this.addTemplate('middle.bottom', '<p>Bottom!</p>');

      this.router.map(function () {
        this.route('top', function () {
          this.route('middle', { resetNamespace: true }, function () {
            this.route('bottom');
          });
        });
      });

      this.add('route:middle.bottom', _routing.Route.extend({
        renderTemplate() {
          this.render('middle/bottom', { into: 'top' });
        }
      }));

      return this.visit('/top/middle/bottom').then(() => {
        assert.ok(true, '/top/middle/bottom has been handled');
        let rootElement = document.getElementById('qunit-fixture');
        assert.equal(rootElement.querySelectorAll('.main .middle .bottom p').length, 0, 'should not render into the middle template');
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('.main .middle > p')), 'Bottom!', 'The template was rendered into the top template');
      });
    }

    ['@test Rendering into specified template with slash notation'](assert) {
      this.addTemplate('person.profile', 'profile {{outlet}}');
      this.addTemplate('person.details', 'details!');

      this.router.map(function () {
        this.route('home', { path: '/' });
      });

      this.add('route:home', _routing.Route.extend({
        renderTemplate() {
          this.render('person/profile');
          this.render('person/details', { into: 'person/profile' });
        }
      }));

      return this.visit('/').then(() => {
        let rootElement = document.getElementById('qunit-fixture');
        assert.equal(rootElement.textContent.trim(), 'profile details!', 'The templates were rendered');
      });
    }

    ['@test Parent route context change'](assert) {
      let editCount = 0;
      let editedPostIds = (0, _runtime.A)();

      this.addTemplate('application', '{{outlet}}');
      this.addTemplate('posts', '{{outlet}}');
      this.addTemplate('post', '{{outlet}}');
      this.addTemplate('post/index', 'showing');
      this.addTemplate('post/edit', 'editing');

      this.router.map(function () {
        this.route('posts', function () {
          this.route('post', { path: '/:postId', resetNamespace: true }, function () {
            this.route('edit');
          });
        });
      });

      this.add('route:posts', _routing.Route.extend({
        actions: {
          showPost(context) {
            this.transitionTo('post', context);
          }
        }
      }));

      this.add('route:post', _routing.Route.extend({
        model(params) {
          return { id: params.postId };
        },

        serialize(model) {
          return { postId: model.id };
        },

        actions: {
          editPost() {
            this.transitionTo('post.edit');
          }
        }
      }));

      this.add('route:post.edit', _routing.Route.extend({
        model() {
          let postId = this.modelFor('post').id;
          editedPostIds.push(postId);
          return null;
        },
        setup() {
          this._super(...arguments);
          editCount++;
        }
      }));

      return this.visit('/posts/1').then(() => {
        assert.ok(true, '/posts/1 has been handled');
        let router = this.applicationInstance.lookup('router:main');
        (0, _runloop.run)(() => router.send('editPost'));
        (0, _runloop.run)(() => router.send('showPost', { id: '2' }));
        (0, _runloop.run)(() => router.send('editPost'));
        assert.equal(editCount, 2, 'set up the edit route twice without failure');
        assert.deepEqual(editedPostIds, ['1', '2'], 'modelFor posts.post returns the right context');
      });
    }

    ['@test Router accounts for rootURL on page load when using history location'](assert) {
      let rootURL = window.location.pathname + '/app';
      let postsTemplateRendered = false;
      let setHistory;

      setHistory = function (obj, path) {
        obj.set('history', { state: { path: path } });
      };

      let location = _routing.HistoryLocation.create({
        initState() {
          let path = rootURL + '/posts';

          setHistory(this, path);
          this.set('location', {
            pathname: path,
            href: 'http://localhost/' + path
          });
        },

        replaceState(path) {
          setHistory(this, path);
        },

        pushState(path) {
          setHistory(this, path);
        }
      });

      this.router.reopen({
        // location: 'historyTest',
        location,
        rootURL: rootURL
      });

      this.router.map(function () {
        this.route('posts', { path: '/posts' });
      });

      this.add('route:posts', _routing.Route.extend({
        model() {},
        renderTemplate() {
          postsTemplateRendered = true;
        }
      }));

      return this.visit('/').then(() => {
        assert.ok(postsTemplateRendered, 'Posts route successfully stripped from rootURL');

        (0, _internalTestHelpers.runDestroy)(location);
        location = null;
      });
    }

    ['@test The rootURL is passed properly to the location implementation'](assert) {
      assert.expect(1);
      let rootURL = '/blahzorz';
      this.add('location:history-test', _routing.HistoryLocation.extend({
        rootURL: 'this is not the URL you are looking for',
        history: {
          pushState() {}
        },
        initState() {
          assert.equal(this.get('rootURL'), rootURL);
        }
      }));

      this.router.reopen({
        location: 'history-test',
        rootURL: rootURL,
        // if we transition in this test we will receive failures
        // if the tests are run from a static file
        _doURLTransition() {
          return _rsvp.default.resolve('');
        }
      });

      return this.visit('/');
    }

    ['@test Only use route rendered into main outlet for default into property on child'](assert) {
      this.addTemplate('application', "{{outlet 'menu'}}{{outlet}}");
      this.addTemplate('posts', '{{outlet}}');
      this.addTemplate('posts.index', '<p class="posts-index">postsIndex</p>');
      this.addTemplate('posts.menu', '<div class="posts-menu">postsMenu</div>');

      this.router.map(function () {
        this.route('posts', function () {});
      });

      this.add('route:posts', _routing.Route.extend({
        renderTemplate() {
          this.render();
          this.render('posts/menu', {
            into: 'application',
            outlet: 'menu'
          });
        }
      }));

      return this.visit('/posts').then(() => {
        assert.ok(true, '/posts has been handled');
        let rootElement = document.getElementById('qunit-fixture');
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('div.posts-menu')), 'postsMenu', 'The posts/menu template was rendered');
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('p.posts-index')), 'postsIndex', 'The posts/index template was rendered');
      });
    }

    ['@test Generating a URL should not affect currentModel'](assert) {
      this.router.map(function () {
        this.route('post', { path: '/posts/:post_id' });
      });

      let posts = {
        1: { id: 1 },
        2: { id: 2 }
      };

      this.add('route:post', _routing.Route.extend({
        model(params) {
          return posts[params.post_id];
        }
      }));

      return this.visit('/posts/1').then(() => {
        assert.ok(true, '/posts/1 has been handled');

        let route = this.applicationInstance.lookup('route:post');
        assert.equal(route.modelFor('post'), posts[1]);

        let url = this.applicationInstance.lookup('router:main').generate('post', posts[2]);
        assert.equal(url, '/posts/2');
        assert.equal(route.modelFor('post'), posts[1]);
      });
    }

    ["@test Nested index route is not overridden by parent's implicit index route"](assert) {
      this.router.map(function () {
        this.route('posts', function () {
          this.route('index', { path: ':category' });
        });
      });

      return this.visit('/').then(() => {
        let router = this.applicationInstance.lookup('router:main');
        return router.transitionTo('posts', { category: 'emberjs' });
      }).then(() => {
        let router = this.applicationInstance.lookup('router:main');
        assert.deepEqual(router.location.path, '/posts/emberjs');
      });
    }

    ['@test Application template does not duplicate when re-rendered'](assert) {
      this.addTemplate('application', '<h3 class="render-once">I render once</h3>{{outlet}}');

      this.router.map(function () {
        this.route('posts');
      });

      this.add('route:application', _routing.Route.extend({
        model() {
          return (0, _runtime.A)();
        }
      }));

      return this.visit('/posts').then(() => {
        assert.ok(true, '/posts has been handled');
        let rootElement = document.getElementById('qunit-fixture');
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('h3.render-once')), 'I render once');
      });
    }

    ['@test Child routes should render inside the application template if the application template causes a redirect'](assert) {
      this.addTemplate('application', '<h3>App</h3> {{outlet}}');
      this.addTemplate('posts', 'posts');

      this.router.map(function () {
        this.route('posts');
        this.route('photos');
      });

      this.add('route:application', _routing.Route.extend({
        afterModel() {
          this.transitionTo('posts');
        }
      }));

      return this.visit('/posts').then(() => {
        let rootElement = document.getElementById('qunit-fixture');
        assert.equal(rootElement.textContent.trim(), 'App posts');
      });
    }

    ["@test The template is not re-rendered when the route's context changes"](assert) {
      this.router.map(function () {
        this.route('page', { path: '/page/:name' });
      });

      this.add('route:page', _routing.Route.extend({
        model(params) {
          return _runtime.Object.create({ name: params.name });
        }
      }));

      let insertionCount = 0;
      this.add('component:foo-bar', _glimmer.Component.extend({
        didInsertElement() {
          insertionCount += 1;
        }
      }));

      this.addTemplate('page', '<p>{{model.name}}{{foo-bar}}</p>');

      let rootElement = document.getElementById('qunit-fixture');
      return this.visit('/page/first').then(() => {
        assert.ok(true, '/page/first has been handled');
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('p')), 'first');
        assert.equal(insertionCount, 1);
        return this.visit('/page/second');
      }).then(() => {
        assert.ok(true, '/page/second has been handled');
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('p')), 'second');
        assert.equal(insertionCount, 1, 'view should have inserted only once');
        let router = this.applicationInstance.lookup('router:main');
        return (0, _runloop.run)(() => router.transitionTo('page', _runtime.Object.create({ name: 'third' })));
      }).then(() => {
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('p')), 'third');
        assert.equal(insertionCount, 1, 'view should still have inserted only once');
      });
    }

    ['@test The template is not re-rendered when two routes present the exact same template & controller'](assert) {
      this.router.map(function () {
        this.route('first');
        this.route('second');
        this.route('third');
        this.route('fourth');
      });

      // Note add a component to test insertion

      let insertionCount = 0;
      this.add('component:x-input', _glimmer.Component.extend({
        didInsertElement() {
          insertionCount += 1;
        }
      }));

      let SharedRoute = _routing.Route.extend({
        setupController() {
          this.controllerFor('shared').set('message', 'This is the ' + this.routeName + ' message');
        },

        renderTemplate() {
          this.render('shared', { controller: 'shared' });
        }
      });

      this.add('route:shared', SharedRoute);
      this.add('route:first', SharedRoute.extend());
      this.add('route:second', SharedRoute.extend());
      this.add('route:third', SharedRoute.extend());
      this.add('route:fourth', SharedRoute.extend());

      this.add('controller:shared', _controller.default.extend());

      this.addTemplate('shared', '<p>{{message}}{{x-input}}</p>');

      let rootElement = document.getElementById('qunit-fixture');
      return this.visit('/first').then(() => {
        assert.ok(true, '/first has been handled');
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('p')), 'This is the first message');
        assert.equal(insertionCount, 1, 'expected one assertion');
        return this.visit('/second');
      }).then(() => {
        assert.ok(true, '/second has been handled');
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('p')), 'This is the second message');
        assert.equal(insertionCount, 1, 'expected one assertion');
        return (0, _runloop.run)(() => {
          this.applicationInstance.lookup('router:main').transitionTo('third').then(function () {
            assert.ok(true, 'expected transition');
          }, function (reason) {
            assert.ok(false, 'unexpected transition failure: ', QUnit.jsDump.parse(reason));
          });
        });
      }).then(() => {
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('p')), 'This is the third message');
        assert.equal(insertionCount, 1, 'expected one assertion');
        return this.visit('fourth');
      }).then(() => {
        assert.ok(true, '/fourth has been handled');
        assert.equal(insertionCount, 1, 'expected one assertion');
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('p')), 'This is the fourth message');
      });
    }

    ['@test ApplicationRoute with model does not proxy the currentPath'](assert) {
      let model = {};
      let currentPath;

      this.router.map(function () {
        this.route('index', { path: '/' });
      });

      this.add('route:application', _routing.Route.extend({
        model() {
          return model;
        }
      }));

      this.add('controller:application', _controller.default.extend({
        currentPathDidChange: (0, _metal.observer)('currentPath', function () {
          currentPath = this.currentPath;
        })
      }));

      return this.visit('/').then(() => {
        assert.equal(currentPath, 'index', 'currentPath is index');
        assert.equal('currentPath' in model, false, 'should have defined currentPath on controller');
      });
    }

    ['@test Promises encountered on app load put app into loading state until resolved'](assert) {
      assert.expect(2);

      let deferred = _rsvp.default.defer();
      this.router.map(function () {
        this.route('index', { path: '/' });
      });

      this.add('route:index', _routing.Route.extend({
        model() {
          return deferred.promise;
        }
      }));

      this.addTemplate('index', '<p>INDEX</p>');
      this.addTemplate('loading', '<p>LOADING</p>');

      (0, _runloop.run)(() => this.visit('/'));
      let rootElement = document.getElementById('qunit-fixture');
      assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('p')), 'LOADING', 'The loading state is displaying.');
      (0, _runloop.run)(deferred.resolve);
      assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('p')), 'INDEX', 'The index route is display.');
    }

    ['@test Route should tear down multiple outlets'](assert) {
      this.addTemplate('application', "{{outlet 'menu'}}{{outlet}}{{outlet 'footer'}}");
      this.addTemplate('posts', '{{outlet}}');
      this.addTemplate('users', 'users');
      this.addTemplate('posts.index', '<p class="posts-index">postsIndex</p>');
      this.addTemplate('posts.menu', '<div class="posts-menu">postsMenu</div>');
      this.addTemplate('posts.footer', '<div class="posts-footer">postsFooter</div>');

      this.router.map(function () {
        this.route('posts', function () {});
        this.route('users', function () {});
      });

      this.add('route:posts', _routing.Route.extend({
        renderTemplate() {
          this.render('posts/menu', {
            into: 'application',
            outlet: 'menu'
          });

          this.render();

          this.render('posts/footer', {
            into: 'application',
            outlet: 'footer'
          });
        }
      }));

      let rootElement = document.getElementById('qunit-fixture');
      return this.visit('/posts').then(() => {
        assert.ok(true, '/posts has been handled');
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('div.posts-menu')), 'postsMenu', 'The posts/menu template was rendered');
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('p.posts-index')), 'postsIndex', 'The posts/index template was rendered');
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('div.posts-footer')), 'postsFooter', 'The posts/footer template was rendered');

        return this.visit('/users');
      }).then(() => {
        assert.ok(true, '/users has been handled');
        assert.equal(rootElement.querySelector('div.posts-menu'), null, 'The posts/menu template was removed');
        assert.equal(rootElement.querySelector('p.posts-index'), null, 'The posts/index template was removed');
        assert.equal(rootElement.querySelector('div.posts-footer'), null, 'The posts/footer template was removed');
      });
    }

    ['@test Route supports clearing outlet explicitly'](assert) {
      this.addTemplate('application', "{{outlet}}{{outlet 'modal'}}");
      this.addTemplate('posts', '{{outlet}}');
      this.addTemplate('users', 'users');
      this.addTemplate('posts.index', '<div class="posts-index">postsIndex {{outlet}}</div>');
      this.addTemplate('posts.modal', '<div class="posts-modal">postsModal</div>');
      this.addTemplate('posts.extra', '<div class="posts-extra">postsExtra</div>');

      this.router.map(function () {
        this.route('posts', function () {});
        this.route('users', function () {});
      });

      this.add('route:posts', _routing.Route.extend({
        actions: {
          showModal() {
            this.render('posts/modal', {
              into: 'application',
              outlet: 'modal'
            });
          },
          hideModal() {
            this.disconnectOutlet({
              outlet: 'modal',
              parentView: 'application'
            });
          }
        }
      }));

      this.add('route:posts.index', _routing.Route.extend({
        actions: {
          showExtra() {
            this.render('posts/extra', {
              into: 'posts/index'
            });
          },
          hideExtra() {
            this.disconnectOutlet({ parentView: 'posts/index' });
          }
        }
      }));

      let rootElement = document.getElementById('qunit-fixture');

      return this.visit('/posts').then(() => {
        let router = this.applicationInstance.lookup('router:main');

        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('div.posts-index')), 'postsIndex', 'The posts/index template was rendered');
        (0, _runloop.run)(() => router.send('showModal'));
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('div.posts-modal')), 'postsModal', 'The posts/modal template was rendered');
        (0, _runloop.run)(() => router.send('showExtra'));

        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('div.posts-extra')), 'postsExtra', 'The posts/extra template was rendered');
        (0, _runloop.run)(() => router.send('hideModal'));

        assert.equal(rootElement.querySelector('div.posts-modal'), null, 'The posts/modal template was removed');
        (0, _runloop.run)(() => router.send('hideExtra'));

        assert.equal(rootElement.querySelector('div.posts-extra'), null, 'The posts/extra template was removed');
        (0, _runloop.run)(function () {
          router.send('showModal');
        });
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('div.posts-modal')), 'postsModal', 'The posts/modal template was rendered');
        (0, _runloop.run)(function () {
          router.send('showExtra');
        });
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('div.posts-extra')), 'postsExtra', 'The posts/extra template was rendered');
        return this.visit('/users');
      }).then(() => {
        assert.equal(rootElement.querySelector('div.posts-index'), null, 'The posts/index template was removed');
        assert.equal(rootElement.querySelector('div.posts-modal'), null, 'The posts/modal template was removed');
        assert.equal(rootElement.querySelector('div.posts-extra'), null, 'The posts/extra template was removed');
      });
    }

    ['@test Route supports clearing outlet using string parameter'](assert) {
      this.addTemplate('application', "{{outlet}}{{outlet 'modal'}}");
      this.addTemplate('posts', '{{outlet}}');
      this.addTemplate('users', 'users');
      this.addTemplate('posts.index', '<div class="posts-index">postsIndex {{outlet}}</div>');
      this.addTemplate('posts.modal', '<div class="posts-modal">postsModal</div>');

      this.router.map(function () {
        this.route('posts', function () {});
        this.route('users', function () {});
      });

      this.add('route:posts', _routing.Route.extend({
        actions: {
          showModal() {
            this.render('posts/modal', {
              into: 'application',
              outlet: 'modal'
            });
          },
          hideModal() {
            this.disconnectOutlet('modal');
          }
        }
      }));

      let rootElement = document.getElementById('qunit-fixture');
      return this.visit('/posts').then(() => {
        let router = this.applicationInstance.lookup('router:main');
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('div.posts-index')), 'postsIndex', 'The posts/index template was rendered');
        (0, _runloop.run)(() => router.send('showModal'));
        assert.equal((0, _internalTestHelpers.getTextOf)(rootElement.querySelector('div.posts-modal')), 'postsModal', 'The posts/modal template was rendered');
        (0, _runloop.run)(() => router.send('hideModal'));
        assert.equal(rootElement.querySelector('div.posts-modal'), null, 'The posts/modal template was removed');
        return this.visit('/users');
      }).then(() => {
        assert.equal(rootElement.querySelector('div.posts-index'), null, 'The posts/index template was removed');
        assert.equal(rootElement.querySelector('div.posts-modal'), null, 'The posts/modal template was removed');
      });
    }

    ['@test Route silently fails when cleaning an outlet from an inactive view'](assert) {
      assert.expect(1); // handleURL

      this.addTemplate('application', '{{outlet}}');
      this.addTemplate('posts', "{{outlet 'modal'}}");
      this.addTemplate('modal', 'A Yo.');

      this.router.map(function () {
        this.route('posts');
      });

      this.add('route:posts', _routing.Route.extend({
        actions: {
          hideSelf() {
            this.disconnectOutlet({
              outlet: 'main',
              parentView: 'application'
            });
          },
          showModal() {
            this.render('modal', { into: 'posts', outlet: 'modal' });
          },
          hideModal() {
            this.disconnectOutlet({ outlet: 'modal', parentView: 'posts' });
          }
        }
      }));

      return this.visit('/posts').then(() => {
        assert.ok(true, '/posts has been handled');
        let router = this.applicationInstance.lookup('router:main');
        (0, _runloop.run)(() => router.send('showModal'));
        (0, _runloop.run)(() => router.send('hideSelf'));
        (0, _runloop.run)(() => router.send('hideModal'));
      });
    }

    ['@test Router `willTransition` hook passes in cancellable transition'](assert) {
      // Should hit willTransition 3 times, once for the initial route, and then 2 more times
      // for the two handleURL calls below
      if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
          assert.expect(7);

          this.router.reopen({
            init() {
              this._super(...arguments);
              this.on('routeWillChange', transition => {
                assert.ok(true, 'routeWillChange was called');
                if (transition.intent && transition.intent.url !== '/') {
                  transition.abort();
                }
              });
            }
          });
        } else {
        assert.expect(5);
        this.router.reopen({
          willTransition(_, _2, transition) {
            assert.ok(true, 'willTransition was called');
            if (transition.intent.url !== '/') {
              transition.abort();
            }
          }
        });
      }

      this.router.map(function () {
        this.route('nork');
        this.route('about');
      });

      this.add('route:loading', _routing.Route.extend({
        activate() {
          assert.ok(false, 'LoadingRoute was not entered');
        }
      }));

      this.add('route:nork', _routing.Route.extend({
        activate() {
          assert.ok(false, 'NorkRoute was not entered');
        }
      }));

      this.add('route:about', _routing.Route.extend({
        activate() {
          assert.ok(false, 'AboutRoute was not entered');
        }
      }));

      return this.visit('/').then(() => {
        this.handleURLAborts(assert, '/nork');
        this.handleURLAborts(assert, '/about');
      });
    }

    ['@test Aborting/redirecting the transition in `willTransition` prevents LoadingRoute from being entered'](assert) {
      assert.expect(5);

      this.router.map(function () {
        this.route('index');
        this.route('nork');
        this.route('about');
      });

      let redirect = false;

      this.add('route:index', _routing.Route.extend({
        actions: {
          willTransition(transition) {
            assert.ok(true, 'willTransition was called');
            if (redirect) {
              // router.js won't refire `willTransition` for this redirect
              this.transitionTo('about');
            } else {
              transition.abort();
            }
          }
        }
      }));

      let deferred = null;

      this.add('route:loading', _routing.Route.extend({
        activate() {
          assert.ok(deferred, 'LoadingRoute should be entered at this time');
        },
        deactivate() {
          assert.ok(true, 'LoadingRoute was exited');
        }
      }));

      this.add('route:nork', _routing.Route.extend({
        activate() {
          assert.ok(true, 'NorkRoute was entered');
        }
      }));

      this.add('route:about', _routing.Route.extend({
        activate() {
          assert.ok(true, 'AboutRoute was entered');
        },
        model() {
          if (deferred) {
            return deferred.promise;
          }
        }
      }));

      return this.visit('/').then(() => {
        let router = this.applicationInstance.lookup('router:main');
        // Attempted transitions out of index should abort.
        (0, _runloop.run)(router, 'transitionTo', 'nork');
        (0, _runloop.run)(router, 'handleURL', '/nork');

        // Attempted transitions out of index should redirect to about
        redirect = true;
        (0, _runloop.run)(router, 'transitionTo', 'nork');
        (0, _runloop.run)(router, 'transitionTo', 'index');

        // Redirected transitions out of index to a route with a
        // promise model should pause the transition and
        // activate LoadingRoute
        deferred = _rsvp.default.defer();
        (0, _runloop.run)(router, 'transitionTo', 'nork');
        (0, _runloop.run)(deferred.resolve);
      });
    }

    ['@test `didTransition` event fires on the router'](assert) {
      assert.expect(3);

      this.router.map(function () {
        this.route('nork');
      });

      return this.visit('/').then(() => {
        let router = this.applicationInstance.lookup('router:main');
        router.one('didTransition', function () {
          assert.ok(true, 'didTransition fired on initial routing');
        });
        this.visit('/');
      }).then(() => {
        let router = this.applicationInstance.lookup('router:main');
        router.one('didTransition', function () {
          assert.ok(true, 'didTransition fired on the router');
          assert.equal(router.get('url'), '/nork', 'The url property is updated by the time didTransition fires');
        });

        return this.visit('/nork');
      });
    }

    ['@test `didTransition` can be reopened'](assert) {
      assert.expect(1);

      this.router.map(function () {
        this.route('nork');
      });
      if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
          assert.ok(true, 'no longer a valid test');
          return;
        } else {
        this.router.reopen({
          didTransition() {
            this._super(...arguments);
            assert.ok(true, 'reopened didTransition was called');
          }
        });
      }

      return this.visit('/');
    }

    ['@test `activate` event fires on the route'](assert) {
      assert.expect(2);

      let eventFired = 0;

      this.router.map(function () {
        this.route('nork');
      });

      this.add('route:nork', _routing.Route.extend({
        init() {
          this._super(...arguments);

          this.on('activate', function () {
            assert.equal(++eventFired, 1, 'activate event is fired once');
          });
        },

        activate() {
          assert.ok(true, 'activate hook is called');
        }
      }));

      return this.visit('/nork');
    }

    ['@test `deactivate` event fires on the route'](assert) {
      assert.expect(2);

      let eventFired = 0;

      this.router.map(function () {
        this.route('nork');
        this.route('dork');
      });

      this.add('route:nork', _routing.Route.extend({
        init() {
          this._super(...arguments);

          this.on('deactivate', function () {
            assert.equal(++eventFired, 1, 'deactivate event is fired once');
          });
        },

        deactivate() {
          assert.ok(true, 'deactivate hook is called');
        }
      }));

      return this.visit('/nork').then(() => this.visit('/dork'));
    }

    ['@test Actions can be handled by inherited action handlers'](assert) {
      assert.expect(4);

      let SuperRoute = _routing.Route.extend({
        actions: {
          foo() {
            assert.ok(true, 'foo');
          },
          bar(msg) {
            assert.equal(msg, 'HELLO');
          }
        }
      });

      let RouteMixin = _metal.Mixin.create({
        actions: {
          bar(msg) {
            assert.equal(msg, 'HELLO');
            this._super(msg);
          }
        }
      });

      this.add('route:home', SuperRoute.extend(RouteMixin, {
        actions: {
          baz() {
            assert.ok(true, 'baz');
          }
        }
      }));

      this.addTemplate('home', `
      <a class="do-foo" {{action "foo"}}>Do foo</a>
      <a class="do-bar-with-arg" {{action "bar" "HELLO"}}>Do bar with arg</a>
      <a class="do-baz" {{action "baz"}}>Do bar</a>
    `);

      return this.visit('/').then(() => {
        let rootElement = document.getElementById('qunit-fixture');
        rootElement.querySelector('.do-foo').click();
        rootElement.querySelector('.do-bar-with-arg').click();
        rootElement.querySelector('.do-baz').click();
      });
    }

    ['@test transitionTo returns Transition when passed a route name'](assert) {
      assert.expect(1);

      this.router.map(function () {
        this.route('root', { path: '/' });
        this.route('bar');
      });

      return this.visit('/').then(() => {
        let router = this.applicationInstance.lookup('router:main');
        let transition = (0, _runloop.run)(() => router.transitionTo('bar'));
        assert.equal(transition instanceof _router_js.InternalTransition, true);
      });
    }

    ['@test transitionTo returns Transition when passed a url'](assert) {
      assert.expect(1);

      this.router.map(function () {
        this.route('root', { path: '/' });
        this.route('bar', function () {
          this.route('baz');
        });
      });

      return this.visit('/').then(() => {
        let router = this.applicationInstance.lookup('router:main');
        let transition = (0, _runloop.run)(() => router.transitionTo('/bar/baz'));
        assert.equal(transition instanceof _router_js.InternalTransition, true);
      });
    }

    ['@test currentRouteName is a property installed on ApplicationController that can be used in transitionTo'](assert) {
      assert.expect(24);

      this.router.map(function () {
        this.route('index', { path: '/' });
        this.route('be', function () {
          this.route('excellent', { resetNamespace: true }, function () {
            this.route('to', { resetNamespace: true }, function () {
              this.route('each', { resetNamespace: true }, function () {
                this.route('other');
              });
            });
          });
        });
      });

      return this.visit('/').then(() => {
        let appController = this.applicationInstance.lookup('controller:application');
        let router = this.applicationInstance.lookup('router:main');

        function transitionAndCheck(path, expectedPath, expectedRouteName) {
          if (path) {
            (0, _runloop.run)(router, 'transitionTo', path);
          }
          assert.equal(appController.get('currentPath'), expectedPath);
          assert.equal(appController.get('currentRouteName'), expectedRouteName);
        }

        transitionAndCheck(null, 'index', 'index');
        transitionAndCheck('/be', 'be.index', 'be.index');
        transitionAndCheck('/be/excellent', 'be.excellent.index', 'excellent.index');
        transitionAndCheck('/be/excellent/to', 'be.excellent.to.index', 'to.index');
        transitionAndCheck('/be/excellent/to/each', 'be.excellent.to.each.index', 'each.index');
        transitionAndCheck('/be/excellent/to/each/other', 'be.excellent.to.each.other', 'each.other');

        transitionAndCheck('index', 'index', 'index');
        transitionAndCheck('be', 'be.index', 'be.index');
        transitionAndCheck('excellent', 'be.excellent.index', 'excellent.index');
        transitionAndCheck('to.index', 'be.excellent.to.index', 'to.index');
        transitionAndCheck('each', 'be.excellent.to.each.index', 'each.index');
        transitionAndCheck('each.other', 'be.excellent.to.each.other', 'each.other');
      });
    }

    ['@test Route model hook finds the same model as a manual find'](assert) {
      let post;
      let Post = _runtime.Object.extend();
      this.add('model:post', Post);
      Post.reopenClass({
        find() {
          post = this;
          return {};
        }
      });

      this.router.map(function () {
        this.route('post', { path: '/post/:post_id' });
      });

      return this.visit('/post/1').then(() => {
        assert.equal(Post, post);
      });
    }

    ['@test Routes can refresh themselves causing their model hooks to be re-run'](assert) {
      this.router.map(function () {
        this.route('parent', { path: '/parent/:parent_id' }, function () {
          this.route('child');
        });
      });

      let appcount = 0;
      this.add('route:application', _routing.Route.extend({
        model() {
          ++appcount;
        }
      }));

      let parentcount = 0;
      this.add('route:parent', _routing.Route.extend({
        model(params) {
          assert.equal(params.parent_id, '123');
          ++parentcount;
        },
        actions: {
          refreshParent() {
            this.refresh();
          }
        }
      }));

      let childcount = 0;
      this.add('route:parent.child', _routing.Route.extend({
        model() {
          ++childcount;
        }
      }));

      let router;
      return this.visit('/').then(() => {
        router = this.applicationInstance.lookup('router:main');
        assert.equal(appcount, 1);
        assert.equal(parentcount, 0);
        assert.equal(childcount, 0);
        return (0, _runloop.run)(router, 'transitionTo', 'parent.child', '123');
      }).then(() => {
        assert.equal(appcount, 1);
        assert.equal(parentcount, 1);
        assert.equal(childcount, 1);
        return (0, _runloop.run)(router, 'send', 'refreshParent');
      }).then(() => {
        assert.equal(appcount, 1);
        assert.equal(parentcount, 2);
        assert.equal(childcount, 2);
      });
    }

    ['@test Specifying non-existent controller name in route#render throws'](assert) {
      assert.expect(1);

      this.router.map(function () {
        this.route('home', { path: '/' });
      });

      this.add('route:home', _routing.Route.extend({
        renderTemplate() {
          expectAssertion(() => {
            this.render('homepage', {
              controller: 'stefanpenneristhemanforme'
            });
          }, "You passed `controller: 'stefanpenneristhemanforme'` into the `render` method, but no such controller could be found.");
        }
      }));

      return this.visit('/');
    }

    ["@test Redirecting with null model doesn't error out"](assert) {
      this.router.map(function () {
        this.route('home', { path: '/' });
        this.route('about', { path: '/about/:hurhurhur' });
      });

      this.add('route:about', _routing.Route.extend({
        serialize: function (model) {
          if (model === null) {
            return { hurhurhur: 'TreeklesMcGeekles' };
          }
        }
      }));

      this.add('route:home', _routing.Route.extend({
        beforeModel() {
          this.transitionTo('about', null);
        }
      }));

      return this.visit('/').then(() => {
        let router = this.applicationInstance.lookup('router:main');
        assert.equal(router.get('location.path'), '/about/TreeklesMcGeekles');
      });
    }

    ['@test rejecting the model hooks promise with a non-error prints the `message` property'](assert) {
      assert.expect(5);

      let rejectedMessage = 'OMG!! SOOOOOO BAD!!!!';
      let rejectedStack = 'Yeah, buddy: stack gets printed too.';

      this.router.map(function () {
        this.route('yippie', { path: '/' });
      });

      console.error = function (initialMessage, errorMessage, errorStack) {
        assert.equal(initialMessage, 'Error while processing route: yippie', 'a message with the current route name is printed');
        assert.equal(errorMessage, rejectedMessage, "the rejected reason's message property is logged");
        assert.equal(errorStack, rejectedStack, "the rejected reason's stack property is logged");
      };

      this.add('route:yippie', _routing.Route.extend({
        model() {
          return _rsvp.default.reject({
            message: rejectedMessage,
            stack: rejectedStack
          });
        }
      }));

      return assert.throws(() => {
        return this.visit('/');
      }, function (err) {
        assert.equal(err.message, rejectedMessage);
        return true;
      }, 'expected an exception');
    }

    ['@test rejecting the model hooks promise with an error with `errorThrown` property prints `errorThrown.message` property'](assert) {
      assert.expect(5);
      let rejectedMessage = 'OMG!! SOOOOOO BAD!!!!';
      let rejectedStack = 'Yeah, buddy: stack gets printed too.';

      this.router.map(function () {
        this.route('yippie', { path: '/' });
      });

      console.error = function (initialMessage, errorMessage, errorStack) {
        assert.equal(initialMessage, 'Error while processing route: yippie', 'a message with the current route name is printed');
        assert.equal(errorMessage, rejectedMessage, "the rejected reason's message property is logged");
        assert.equal(errorStack, rejectedStack, "the rejected reason's stack property is logged");
      };

      this.add('route:yippie', _routing.Route.extend({
        model() {
          return _rsvp.default.reject({
            errorThrown: { message: rejectedMessage, stack: rejectedStack }
          });
        }
      }));

      assert.throws(() => this.visit('/'), function (err) {
        assert.equal(err.message, rejectedMessage);
        return true;
      }, 'expected an exception');
    }

    ['@test rejecting the model hooks promise with no reason still logs error'](assert) {
      assert.expect(2);
      this.router.map(function () {
        this.route('wowzers', { path: '/' });
      });

      console.error = function (initialMessage) {
        assert.equal(initialMessage, 'Error while processing route: wowzers', 'a message with the current route name is printed');
      };

      this.add('route:wowzers', _routing.Route.extend({
        model() {
          return _rsvp.default.reject();
        }
      }));

      return assert.throws(() => this.visit('/'));
    }

    ['@test rejecting the model hooks promise with a string shows a good error'](assert) {
      assert.expect(3);
      let rejectedMessage = 'Supercalifragilisticexpialidocious';

      this.router.map(function () {
        this.route('yondo', { path: '/' });
      });

      console.error = function (initialMessage, errorMessage) {
        assert.equal(initialMessage, 'Error while processing route: yondo', 'a message with the current route name is printed');
        assert.equal(errorMessage, rejectedMessage, "the rejected reason's message property is logged");
      };

      this.add('route:yondo', _routing.Route.extend({
        model() {
          return _rsvp.default.reject(rejectedMessage);
        }
      }));

      assert.throws(() => this.visit('/'), new RegExp(rejectedMessage), 'expected an exception');
    }

    ["@test willLeave, willChangeContext, willChangeModel actions don't fire unless feature flag enabled"](assert) {
      assert.expect(1);

      this.router.map(function () {
        this.route('about');
      });

      function shouldNotFire() {
        assert.ok(false, "this action shouldn't have been received");
      }

      this.add('route:index', _routing.Route.extend({
        actions: {
          willChangeModel: shouldNotFire,
          willChangeContext: shouldNotFire,
          willLeave: shouldNotFire
        }
      }));

      this.add('route:about', _routing.Route.extend({
        setupController() {
          assert.ok(true, 'about route was entered');
        }
      }));

      return this.visit('/about');
    }

    ['@test Errors in transitionTo within redirect hook are logged'](assert) {
      assert.expect(4);
      let actual = [];

      this.router.map(function () {
        this.route('yondo', { path: '/' });
        this.route('stink-bomb');
      });

      this.add('route:yondo', _routing.Route.extend({
        redirect() {
          this.transitionTo('stink-bomb', { something: 'goes boom' });
        }
      }));

      console.error = function () {
        // push the arguments onto an array so we can detect if the error gets logged twice
        actual.push(arguments);
      };

      assert.throws(() => this.visit('/'), /More context objects were passed/);

      assert.equal(actual.length, 1, 'the error is only logged once');
      assert.equal(actual[0][0], 'Error while processing route: yondo', 'source route is printed');
      assert.ok(actual[0][1].match(/More context objects were passed than there are dynamic segments for the route: stink-bomb/), 'the error is printed');
    }

    ['@test Errors in transition show error template if available'](assert) {
      this.addTemplate('error', "<div id='error'>Error!</div>");

      this.router.map(function () {
        this.route('yondo', { path: '/' });
        this.route('stink-bomb');
      });

      this.add('route:yondo', _routing.Route.extend({
        redirect() {
          this.transitionTo('stink-bomb', { something: 'goes boom' });
        }
      }));
      console.error = () => {};

      return this.visit('/').then(() => {
        let rootElement = document.querySelector('#qunit-fixture');
        assert.equal(rootElement.querySelectorAll('#error').length, 1, 'Error template was rendered.');
      });
    }

    ['@test Route#resetController gets fired when changing models and exiting routes'](assert) {
      assert.expect(4);

      this.router.map(function () {
        this.route('a', function () {
          this.route('b', { path: '/b/:id', resetNamespace: true }, function () {});
          this.route('c', { path: '/c/:id', resetNamespace: true }, function () {});
        });
        this.route('out');
      });

      let calls = [];

      let SpyRoute = _routing.Route.extend({
        setupController() /* controller, model, transition */{
          calls.push(['setup', this.routeName]);
        },

        resetController() /* controller */{
          calls.push(['reset', this.routeName]);
        }
      });

      this.add('route:a', SpyRoute.extend());
      this.add('route:b', SpyRoute.extend());
      this.add('route:c', SpyRoute.extend());
      this.add('route:out', SpyRoute.extend());

      let router;
      return this.visit('/').then(() => {
        router = this.applicationInstance.lookup('router:main');
        assert.deepEqual(calls, []);
        return (0, _runloop.run)(router, 'transitionTo', 'b', 'b-1');
      }).then(() => {
        assert.deepEqual(calls, [['setup', 'a'], ['setup', 'b']]);
        calls.length = 0;
        return (0, _runloop.run)(router, 'transitionTo', 'c', 'c-1');
      }).then(() => {
        assert.deepEqual(calls, [['reset', 'b'], ['setup', 'c']]);
        calls.length = 0;
        return (0, _runloop.run)(router, 'transitionTo', 'out');
      }).then(() => {
        assert.deepEqual(calls, [['reset', 'c'], ['reset', 'a'], ['setup', 'out']]);
      });
    }

    ['@test Exception during initialization of non-initial route is not swallowed'](assert) {
      this.router.map(function () {
        this.route('boom');
      });
      this.add('route:boom', _routing.Route.extend({
        init() {
          throw new Error('boom!');
        }
      }));

      return assert.throws(() => this.visit('/boom'), /\bboom\b/);
    }

    ['@test Exception during initialization of initial route is not swallowed'](assert) {
      this.router.map(function () {
        this.route('boom', { path: '/' });
      });
      this.add('route:boom', _routing.Route.extend({
        init() {
          throw new Error('boom!');
        }
      }));
      return assert.throws(() => this.visit('/'), /\bboom\b/);
    }

    ['@test {{outlet}} works when created after initial render'](assert) {
      this.addTemplate('sample', 'Hi{{#if showTheThing}}{{outlet}}{{/if}}Bye');
      this.addTemplate('sample.inner', 'Yay');
      this.addTemplate('sample.inner2', 'Boo');
      this.router.map(function () {
        this.route('sample', { path: '/' }, function () {
          this.route('inner', { path: '/' });
          this.route('inner2', { path: '/2' });
        });
      });

      let rootElement;
      return this.visit('/').then(() => {
        rootElement = document.getElementById('qunit-fixture');
        assert.equal(rootElement.textContent.trim(), 'HiBye', 'initial render');

        (0, _runloop.run)(() => this.applicationInstance.lookup('controller:sample').set('showTheThing', true));

        assert.equal(rootElement.textContent.trim(), 'HiYayBye', 'second render');
        return this.visit('/2');
      }).then(() => {
        assert.equal(rootElement.textContent.trim(), 'HiBooBye', 'third render');
      });
    }

    ['@test Can render into a named outlet at the top level'](assert) {
      this.addTemplate('application', 'A-{{outlet}}-B-{{outlet "other"}}-C');
      this.addTemplate('modal', 'Hello world');
      this.addTemplate('index', 'The index');
      this.router.map(function () {
        this.route('index', { path: '/' });
      });
      this.add('route:application', _routing.Route.extend({
        renderTemplate() {
          this.render();
          this.render('modal', {
            into: 'application',
            outlet: 'other'
          });
        }
      }));

      return this.visit('/').then(() => {
        let rootElement = document.getElementById('qunit-fixture');
        assert.equal(rootElement.textContent.trim(), 'A-The index-B-Hello world-C', 'initial render');
      });
    }

    ['@test Can disconnect a named outlet at the top level'](assert) {
      this.addTemplate('application', 'A-{{outlet}}-B-{{outlet "other"}}-C');
      this.addTemplate('modal', 'Hello world');
      this.addTemplate('index', 'The index');
      this.router.map(function () {
        this.route('index', { path: '/' });
      });
      this.add('route:application', _routing.Route.extend({
        renderTemplate() {
          this.render();
          this.render('modal', {
            into: 'application',
            outlet: 'other'
          });
        },
        actions: {
          banish() {
            this.disconnectOutlet({
              parentView: 'application',
              outlet: 'other'
            });
          }
        }
      }));

      return this.visit('/').then(() => {
        let rootElement = document.getElementById('qunit-fixture');
        assert.equal(rootElement.textContent.trim(), 'A-The index-B-Hello world-C', 'initial render');

        (0, _runloop.run)(this.applicationInstance.lookup('router:main'), 'send', 'banish');

        assert.equal(rootElement.textContent.trim(), 'A-The index-B--C', 'second render');
      });
    }

    ['@test Can render into a named outlet at the top level, with empty main outlet'](assert) {
      this.addTemplate('application', 'A-{{outlet}}-B-{{outlet "other"}}-C');
      this.addTemplate('modal', 'Hello world');

      this.router.map(function () {
        this.route('hasNoTemplate', { path: '/' });
      });

      this.add('route:application', _routing.Route.extend({
        renderTemplate() {
          this.render();
          this.render('modal', {
            into: 'application',
            outlet: 'other'
          });
        }
      }));

      return this.visit('/').then(() => {
        let rootElement = document.getElementById('qunit-fixture');
        assert.equal(rootElement.textContent.trim(), 'A--B-Hello world-C', 'initial render');
      });
    }

    ['@test Can render into a named outlet at the top level, later'](assert) {
      this.addTemplate('application', 'A-{{outlet}}-B-{{outlet "other"}}-C');
      this.addTemplate('modal', 'Hello world');
      this.addTemplate('index', 'The index');
      this.router.map(function () {
        this.route('index', { path: '/' });
      });
      this.add('route:application', _routing.Route.extend({
        actions: {
          launch() {
            this.render('modal', {
              into: 'application',
              outlet: 'other'
            });
          }
        }
      }));

      return this.visit('/').then(() => {
        let rootElement = document.getElementById('qunit-fixture');
        assert.equal(rootElement.textContent.trim(), 'A-The index-B--C', 'initial render');
        (0, _runloop.run)(this.applicationInstance.lookup('router:main'), 'send', 'launch');
        assert.equal(rootElement.textContent.trim(), 'A-The index-B-Hello world-C', 'second render');
      });
    }

    ["@test Can render routes with no 'main' outlet and their children"](assert) {
      this.addTemplate('application', '<div id="application">{{outlet "app"}}</div>');
      this.addTemplate('app', '<div id="app-common">{{outlet "common"}}</div><div id="app-sub">{{outlet "sub"}}</div>');
      this.addTemplate('common', '<div id="common"></div>');
      this.addTemplate('sub', '<div id="sub"></div>');

      this.router.map(function () {
        this.route('app', { path: '/app' }, function () {
          this.route('sub', { path: '/sub', resetNamespace: true });
        });
      });

      this.add('route:app', _routing.Route.extend({
        renderTemplate() {
          this.render('app', {
            outlet: 'app',
            into: 'application'
          });
          this.render('common', {
            outlet: 'common',
            into: 'app'
          });
        }
      }));

      this.add('route:sub', _routing.Route.extend({
        renderTemplate() {
          this.render('sub', {
            outlet: 'sub',
            into: 'app'
          });
        }
      }));

      let rootElement;
      return this.visit('/app').then(() => {
        rootElement = document.getElementById('qunit-fixture');
        assert.equal(rootElement.querySelectorAll('#app-common #common').length, 1, 'Finds common while viewing /app');
        return this.visit('/app/sub');
      }).then(() => {
        assert.equal(rootElement.querySelectorAll('#app-common #common').length, 1, 'Finds common while viewing /app/sub');
        assert.equal(rootElement.querySelectorAll('#app-sub #sub').length, 1, 'Finds sub while viewing /app/sub');
      });
    }

    ['@test Tolerates stacked renders'](assert) {
      this.addTemplate('application', '{{outlet}}{{outlet "modal"}}');
      this.addTemplate('index', 'hi');
      this.addTemplate('layer', 'layer');
      this.router.map(function () {
        this.route('index', { path: '/' });
      });
      this.add('route:application', _routing.Route.extend({
        actions: {
          openLayer() {
            this.render('layer', {
              into: 'application',
              outlet: 'modal'
            });
          },
          close() {
            this.disconnectOutlet({
              outlet: 'modal',
              parentView: 'application'
            });
          }
        }
      }));

      return this.visit('/').then(() => {
        let rootElement = document.getElementById('qunit-fixture');
        let router = this.applicationInstance.lookup('router:main');
        assert.equal(rootElement.textContent.trim(), 'hi');
        (0, _runloop.run)(router, 'send', 'openLayer');
        assert.equal(rootElement.textContent.trim(), 'hilayer');
        (0, _runloop.run)(router, 'send', 'openLayer');
        assert.equal(rootElement.textContent.trim(), 'hilayer');
        (0, _runloop.run)(router, 'send', 'close');
        assert.equal(rootElement.textContent.trim(), 'hi');
      });
    }

    ['@test Renders child into parent with non-default template name'](assert) {
      this.addTemplate('application', '<div class="a">{{outlet}}</div>');
      this.addTemplate('exports.root', '<div class="b">{{outlet}}</div>');
      this.addTemplate('exports.index', '<div class="c"></div>');

      this.router.map(function () {
        this.route('root', function () {});
      });

      this.add('route:root', _routing.Route.extend({
        renderTemplate() {
          this.render('exports/root');
        }
      }));

      this.add('route:root.index', _routing.Route.extend({
        renderTemplate() {
          this.render('exports/index');
        }
      }));

      return this.visit('/root').then(() => {
        let rootElement = document.getElementById('qunit-fixture');
        assert.equal(rootElement.querySelectorAll('.a .b .c').length, 1);
      });
    }

    ["@test Allows any route to disconnectOutlet another route's templates"](assert) {
      this.addTemplate('application', '{{outlet}}{{outlet "modal"}}');
      this.addTemplate('index', 'hi');
      this.addTemplate('layer', 'layer');
      this.router.map(function () {
        this.route('index', { path: '/' });
      });
      this.add('route:application', _routing.Route.extend({
        actions: {
          openLayer() {
            this.render('layer', {
              into: 'application',
              outlet: 'modal'
            });
          }
        }
      }));
      this.add('route:index', _routing.Route.extend({
        actions: {
          close() {
            this.disconnectOutlet({
              parentView: 'application',
              outlet: 'modal'
            });
          }
        }
      }));

      return this.visit('/').then(() => {
        let rootElement = document.getElementById('qunit-fixture');
        let router = this.applicationInstance.lookup('router:main');
        assert.equal(rootElement.textContent.trim(), 'hi');
        (0, _runloop.run)(router, 'send', 'openLayer');
        assert.equal(rootElement.textContent.trim(), 'hilayer');
        (0, _runloop.run)(router, 'send', 'close');
        assert.equal(rootElement.textContent.trim(), 'hi');
      });
    }

    ['@test Components inside an outlet have their didInsertElement hook invoked when the route is displayed'](assert) {
      this.addTemplate('index', '{{#if showFirst}}{{my-component}}{{else}}{{other-component}}{{/if}}');

      let myComponentCounter = 0;
      let otherComponentCounter = 0;
      let indexController;

      this.router.map(function () {
        this.route('index', { path: '/' });
      });

      this.add('controller:index', _controller.default.extend({
        showFirst: true
      }));

      this.add('route:index', _routing.Route.extend({
        setupController(controller) {
          indexController = controller;
        }
      }));

      this.add('component:my-component', _glimmer.Component.extend({
        didInsertElement() {
          myComponentCounter++;
        }
      }));

      this.add('component:other-component', _glimmer.Component.extend({
        didInsertElement() {
          otherComponentCounter++;
        }
      }));

      return this.visit('/').then(() => {
        assert.strictEqual(myComponentCounter, 1, 'didInsertElement invoked on displayed component');
        assert.strictEqual(otherComponentCounter, 0, 'didInsertElement not invoked on displayed component');

        (0, _runloop.run)(() => indexController.set('showFirst', false));

        assert.strictEqual(myComponentCounter, 1, 'didInsertElement not invoked on displayed component');
        assert.strictEqual(otherComponentCounter, 1, 'didInsertElement invoked on displayed component');
      });
    }

    ['@test Doesnt swallow exception thrown from willTransition'](assert) {
      assert.expect(1);
      this.addTemplate('application', '{{outlet}}');
      this.addTemplate('index', 'index');
      this.addTemplate('other', 'other');

      this.router.map(function () {
        this.route('index', { path: '/' });
        this.route('other', function () {});
      });

      this.add('route:index', _routing.Route.extend({
        actions: {
          willTransition() {
            throw new Error('boom');
          }
        }
      }));

      return this.visit('/').then(() => {
        return assert.throws(() => {
          return this.visit('/other');
        }, /boom/, 'expected an exception but none was thrown');
      });
    }

    ['@test Exception if outlet name is undefined in render and disconnectOutlet']() {
      this.add('route:application', _routing.Route.extend({
        actions: {
          showModal() {
            this.render({
              outlet: undefined,
              parentView: 'application'
            });
          },
          hideModal() {
            this.disconnectOutlet({
              outlet: undefined,
              parentView: 'application'
            });
          }
        }
      }));

      return this.visit('/').then(() => {
        let router = this.applicationInstance.lookup('router:main');
        expectAssertion(() => {
          (0, _runloop.run)(() => router.send('showModal'));
        }, /You passed undefined as the outlet name/);

        expectAssertion(() => {
          (0, _runloop.run)(() => router.send('hideModal'));
        }, /You passed undefined as the outlet name/);
      });
    }

    ['@test Route serializers work for Engines'](assert) {
      assert.expect(2);

      // Register engine
      let BlogEngine = _engine.default.extend();
      this.add('engine:blog', BlogEngine);

      // Register engine route map
      let postSerialize = function (params) {
        assert.ok(true, 'serialize hook runs');
        return {
          post_id: params.id
        };
      };
      let BlogMap = function () {
        this.route('post', {
          path: '/post/:post_id',
          serialize: postSerialize
        });
      };
      this.add('route-map:blog', BlogMap);

      this.router.map(function () {
        this.mount('blog');
      });

      return this.visit('/').then(() => {
        let router = this.applicationInstance.lookup('router:main');
        assert.equal(router._routerMicrolib.generate('blog.post', { id: '13' }), '/blog/post/13', 'url is generated properly');
      });
    }

    ['@test Defining a Route#serialize method in an Engine throws an error'](assert) {
      assert.expect(1);

      // Register engine
      let BlogEngine = _engine.default.extend();
      this.add('engine:blog', BlogEngine);

      // Register engine route map
      let BlogMap = function () {
        this.route('post');
      };
      this.add('route-map:blog', BlogMap);

      this.router.map(function () {
        this.mount('blog');
      });

      return this.visit('/').then(() => {
        let router = this.applicationInstance.lookup('router:main');
        let PostRoute = _routing.Route.extend({ serialize() {} });
        this.applicationInstance.lookup('engine:blog').register('route:post', PostRoute);

        assert.throws(() => router.transitionTo('blog.post'), /Defining a custom serialize method on an Engine route is not supported/);
      });
    }

    ['@test App.destroy does not leave undestroyed views after clearing engines'](assert) {
      assert.expect(4);

      let engineInstance;
      // Register engine
      let BlogEngine = _engine.default.extend();
      this.add('engine:blog', BlogEngine);
      let EngineIndexRoute = _routing.Route.extend({
        init() {
          this._super(...arguments);
          engineInstance = (0, _owner.getOwner)(this);
        }
      });

      // Register engine route map
      let BlogMap = function () {
        this.route('post');
      };
      this.add('route-map:blog', BlogMap);

      this.router.map(function () {
        this.mount('blog');
      });

      return this.visit('/').then(() => {
        let engine = this.applicationInstance.lookup('engine:blog');
        engine.register('route:index', EngineIndexRoute);
        engine.register('template:index', (0, _emberTemplateCompiler.compile)('Engine Post!'));
        return this.visit('/blog');
      }).then(() => {
        assert.ok(true, '/blog has been handled');
        let route = engineInstance.lookup('route:index');
        let router = this.applicationInstance.lookup('router:main');

        (0, _runloop.run)(router, 'destroy');
        assert.equal(router._toplevelView, null, 'the toplevelView was cleared');

        (0, _runloop.run)(route, 'destroy');
        assert.equal(router._toplevelView, null, 'the toplevelView was not reinitialized');

        (0, _runloop.run)(this.applicationInstance, 'destroy');
        assert.equal(router._toplevelView, null, 'the toplevelView was not reinitialized');
      });
    }

    ["@test Generated route should be an instance of App's default route if provided"](assert) {
      let generatedRoute;

      this.router.map(function () {
        this.route('posts');
      });

      let AppRoute = _routing.Route.extend();
      this.add('route:basic', AppRoute);

      return this.visit('/posts').then(() => {
        generatedRoute = this.applicationInstance.lookup('route:posts');

        assert.ok(generatedRoute instanceof AppRoute, 'should extend the correct route');
      });
    }
  });
});
enifed('ember/tests/routing/deprecated_handler_infos_test', ['internal-test-helpers'], function (_internalTestHelpers) {
  'use strict';

  if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
      (0, _internalTestHelpers.moduleFor)('Deprecated HandlerInfos', class extends _internalTestHelpers.ApplicationTestCase {
        constructor() {
          super(...arguments);
          this.router.map(function () {
            this.route('parent', function () {
              this.route('child');
              this.route('sibling');
            });
          });
        }

        get routerOptions() {
          return {
            willTransition(oldHandlers, newHandlers, transition) {
              expectDeprecation(() => {
                this._routerMicrolib.currentHandlerInfos;
              }, 'You attempted to use "_routerMicrolib.currentHandlerInfos" which is a private API that will be removed.');

              expectDeprecation(() => {
                this._routerMicrolib.getHandler('parent');
              }, 'You attempted to use "_routerMicrolib.getHandler" which is a private API that will be removed.');

              oldHandlers.forEach(handler => {
                expectDeprecation(() => {
                  handler.handler;
                }, 'You attempted to read "handlerInfo.handler" which is a private API that will be removed.');
              });
              newHandlers.forEach(handler => {
                expectDeprecation(() => {
                  handler.handler;
                }, 'You attempted to read "handlerInfo.handler" which is a private API that will be removed.');
              });

              expectDeprecation(() => {
                transition.handlerInfos;
              }, 'You attempted to use "transition.handlerInfos" which is a private API that will be removed.');

              expectDeprecation(() => {
                transition.state.handlerInfos;
              }, 'You attempted to use "transition.state.handlerInfos" which is a private API that will be removed.');
              QUnit.assert.ok(true, 'willTransition');
            },

            didTransition(newHandlers) {
              newHandlers.forEach(handler => {
                expectDeprecation(() => {
                  handler.handler;
                }, 'You attempted to read "handlerInfo.handler" which is a private API that will be removed.');
              });
              QUnit.assert.ok(true, 'didTransition');
            }
          };
        }

        '@test handlerInfos are deprecated and associated private apis'(assert) {
          let done = assert.async();
          expectDeprecation(() => {
            return this.visit('/parent').then(() => {
              done();
            });
          }, /You attempted to override the \"(willTransition|didTransition)\" method which is deprecated. Please inject the router service and listen to the \"(routeWillChange|routeDidChange)\" event\./);
        }
      });
    }
});
enifed('ember/tests/routing/deprecated_transition_state_test', ['internal-test-helpers'], function (_internalTestHelpers) {
  'use strict';

  if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
      (0, _internalTestHelpers.moduleFor)('Deprecated Transition State', class extends _internalTestHelpers.RouterTestCase {
        '@test touching transition.state is deprecated'(assert) {
          assert.expect(1);
          return this.visit('/').then(() => {
            this.routerService.on('routeWillChange', transition => {
              expectDeprecation(() => {
                transition.state;
              }, 'You attempted to read "transition.state" which is a private API. You should read the `RouteInfo` object on "transition.to" or "transition.from" which has the public state on it.');
            });
            return this.routerService.transitionTo('/child');
          });
        }

        '@test touching transition.queryParams is deprecated'(assert) {
          assert.expect(1);
          return this.visit('/').then(() => {
            this.routerService.on('routeWillChange', transition => {
              expectDeprecation(() => {
                transition.queryParams;
              }, 'You attempted to read "transition.queryParams" which is a private API. You should read the `RouteInfo` object on "transition.to" or "transition.from" which has the queryParams on it.');
            });
            return this.routerService.transitionTo('/child');
          });
        }

        '@test touching transition.params is deprecated'(assert) {
          assert.expect(1);
          return this.visit('/').then(() => {
            this.routerService.on('routeWillChange', transition => {
              expectDeprecation(() => {
                transition.params;
              }, 'You attempted to read "transition.params" which is a private API. You should read the `RouteInfo` object on "transition.to" or "transition.from" which has the params on it.');
            });
            return this.routerService.transitionTo('/child');
          });
        }
      });
    }
});
enifed('ember/tests/routing/query_params_test', ['@ember/controller', '@ember/string', '@ember/-internals/runtime', '@ember/runloop', '@ember/-internals/meta', '@ember/-internals/metal', '@ember/-internals/routing', 'router_js', 'internal-test-helpers'], function (_controller, _string, _runtime, _runloop, _meta, _metal, _routing, _router_js, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Query Params - main', class extends _internalTestHelpers.QueryParamTestCase {
    refreshModelWhileLoadingTest(loadingReturn) {
      let assert = this.assert;

      assert.expect(9);

      let appModelCount = 0;
      let promiseResolve;

      this.add('route:application', _routing.Route.extend({
        queryParams: {
          appomg: {
            defaultValue: 'applol'
          }
        },
        model() /* params */{
          appModelCount++;
        }
      }));

      this.setSingleQPController('index', 'omg', undefined, {
        omg: undefined
      });

      let actionName = typeof loadingReturn !== 'undefined' ? 'loading' : 'ignore';
      let indexModelCount = 0;
      this.add('route:index', _routing.Route.extend({
        queryParams: {
          omg: {
            refreshModel: true
          }
        },
        actions: {
          [actionName]: function () {
            return loadingReturn;
          }
        },
        model(params) {
          indexModelCount++;
          if (indexModelCount === 2) {
            assert.deepEqual(params, { omg: 'lex' });
            return new _runtime.RSVP.Promise(function (resolve) {
              promiseResolve = resolve;
              return;
            });
          } else if (indexModelCount === 3) {
            assert.deepEqual(params, { omg: 'hello' }, "Model hook reruns even if the previous one didn't finish");
          }
        }
      }));

      return this.visit('/').then(() => {
        assert.equal(appModelCount, 1, 'appModelCount is 1');
        assert.equal(indexModelCount, 1);

        let indexController = this.getController('index');
        this.setAndFlush(indexController, 'omg', 'lex');

        assert.equal(appModelCount, 1, 'appModelCount is 1');
        assert.equal(indexModelCount, 2);

        this.setAndFlush(indexController, 'omg', 'hello');
        assert.equal(appModelCount, 1, 'appModelCount is 1');
        assert.equal(indexModelCount, 3);

        (0, _runloop.run)(function () {
          promiseResolve();
        });

        assert.equal((0, _metal.get)(indexController, 'omg'), 'hello', 'At the end last value prevails');
      });
    }

    ["@test No replaceURL occurs on startup because default values don't show up in URL"](assert) {
      assert.expect(1);

      this.setSingleQPController('index');

      return this.visitAndAssert('/');
    }

    ['@test Calling transitionTo does not lose query params already on the activeTransition'](assert) {
      assert.expect(2);

      this.router.map(function () {
        this.route('parent', function () {
          this.route('child');
          this.route('sibling');
        });
      });

      this.add('route:parent.child', _routing.Route.extend({
        afterModel() {
          this.transitionTo('parent.sibling');
        }
      }));

      this.setSingleQPController('parent');

      return this.visit('/parent/child?foo=lol').then(() => {
        this.assertCurrentPath('/parent/sibling?foo=lol', 'redirected to the sibling route, instead of child route');
        assert.equal(this.getController('parent').get('foo'), 'lol', 'controller has value from the active transition');
      });
    }

    ['@test Single query params can be set on the controller and reflected in the url'](assert) {
      assert.expect(3);

      this.router.map(function () {
        this.route('home', { path: '/' });
      });

      this.setSingleQPController('home');

      return this.visitAndAssert('/').then(() => {
        let controller = this.getController('home');

        this.setAndFlush(controller, 'foo', '456');
        this.assertCurrentPath('/?foo=456');

        this.setAndFlush(controller, 'foo', '987');
        this.assertCurrentPath('/?foo=987');
      });
    }

    ['@test Query params can map to different url keys configured on the controller'](assert) {
      assert.expect(6);

      this.add('controller:index', _controller.default.extend({
        queryParams: [{ foo: 'other_foo', bar: { as: 'other_bar' } }],
        foo: 'FOO',
        bar: 'BAR'
      }));

      return this.visitAndAssert('/').then(() => {
        let controller = this.getController('index');

        this.setAndFlush(controller, 'foo', 'LEX');
        this.assertCurrentPath('/?other_foo=LEX', "QP mapped correctly without 'as'");

        this.setAndFlush(controller, 'foo', 'WOO');
        this.assertCurrentPath('/?other_foo=WOO', "QP updated correctly without 'as'");

        this.transitionTo('/?other_foo=NAW');
        assert.equal(controller.get('foo'), 'NAW', 'QP managed correctly on URL transition');

        this.setAndFlush(controller, 'bar', 'NERK');
        this.assertCurrentPath('/?other_bar=NERK&other_foo=NAW', "QP mapped correctly with 'as'");

        this.setAndFlush(controller, 'bar', 'NUKE');
        this.assertCurrentPath('/?other_bar=NUKE&other_foo=NAW', "QP updated correctly with 'as'");
      });
    }

    ['@test Routes have a private overridable serializeQueryParamKey hook'](assert) {
      assert.expect(2);

      this.add('route:index', _routing.Route.extend({
        serializeQueryParamKey: _string.dasherize
      }));

      this.setSingleQPController('index', 'funTimes', '');

      return this.visitAndAssert('/').then(() => {
        let controller = this.getController('index');

        this.setAndFlush(controller, 'funTimes', 'woot');
        this.assertCurrentPath('/?fun-times=woot');
      });
    }

    ['@test Can override inherited QP behavior by specifying queryParams as a computed property'](assert) {
      assert.expect(3);

      this.setSingleQPController('index', 'a', 0, {
        queryParams: (0, _metal.computed)(function () {
          return ['c'];
        }),
        c: true
      });

      return this.visitAndAssert('/').then(() => {
        let indexController = this.getController('index');

        this.setAndFlush(indexController, 'a', 1);
        this.assertCurrentPath('/', 'QP did not update due to being overriden');

        this.setAndFlush(indexController, 'c', false);
        this.assertCurrentPath('/?c=false', 'QP updated with overridden param');
      });
    }

    ['@test Can concatenate inherited QP behavior by specifying queryParams as an array'](assert) {
      assert.expect(3);

      this.setSingleQPController('index', 'a', 0, {
        queryParams: ['c'],
        c: true
      });

      return this.visitAndAssert('/').then(() => {
        let indexController = this.getController('index');

        this.setAndFlush(indexController, 'a', 1);
        this.assertCurrentPath('/?a=1', 'Inherited QP did update');

        this.setAndFlush(indexController, 'c', false);
        this.assertCurrentPath('/?a=1&c=false', 'New QP did update');
      });
    }

    ['@test model hooks receives query params'](assert) {
      assert.expect(2);

      this.setSingleQPController('index');

      this.add('route:index', _routing.Route.extend({
        model(params) {
          assert.deepEqual(params, { foo: 'bar' });
        }
      }));

      return this.visitAndAssert('/');
    }

    ['@test model hooks receives query params with dynamic segment params'](assert) {
      assert.expect(2);

      this.router.map(function () {
        this.route('index', { path: '/:id' });
      });

      this.setSingleQPController('index');

      this.add('route:index', _routing.Route.extend({
        model(params) {
          assert.deepEqual(params, { foo: 'bar', id: 'baz' });
        }
      }));

      return this.visitAndAssert('/baz');
    }

    ['@test model hooks receives query params (overridden by incoming url value)'](assert) {
      assert.expect(2);

      this.router.map(function () {
        this.route('index', { path: '/:id' });
      });

      this.setSingleQPController('index');

      this.add('route:index', _routing.Route.extend({
        model(params) {
          assert.deepEqual(params, { foo: 'baz', id: 'boo' });
        }
      }));

      return this.visitAndAssert('/boo?foo=baz');
    }

    ['@test error is thrown if dynamic segment and query param have same name'](assert) {
      assert.expect(1);

      this.router.map(function () {
        this.route('index', { path: '/:foo' });
      });

      this.setSingleQPController('index');

      expectAssertion(() => {
        this.visitAndAssert('/boo?foo=baz');
      }, `The route 'index' has both a dynamic segment and query param with name 'foo'. Please rename one to avoid collisions.`);
    }

    ['@test query params have been set by the time setupController is called'](assert) {
      assert.expect(2);

      this.setSingleQPController('application');

      this.add('route:application', _routing.Route.extend({
        setupController(controller) {
          assert.equal(controller.get('foo'), 'YEAH', "controller's foo QP property set before setupController called");
        }
      }));

      return this.visitAndAssert('/?foo=YEAH');
    }

    ['@test mapped query params have been set by the time setupController is called'](assert) {
      assert.expect(2);

      this.setSingleQPController('application', { faz: 'foo' });

      this.add('route:application', _routing.Route.extend({
        setupController(controller) {
          assert.equal(controller.get('faz'), 'YEAH', "controller's foo QP property set before setupController called");
        }
      }));

      return this.visitAndAssert('/?foo=YEAH');
    }

    ['@test Route#paramsFor fetches query params with default value'](assert) {
      assert.expect(2);

      this.router.map(function () {
        this.route('index', { path: '/:something' });
      });

      this.setSingleQPController('index');

      this.add('route:index', _routing.Route.extend({
        model() /* params, transition */{
          assert.deepEqual(this.paramsFor('index'), { something: 'baz', foo: 'bar' }, 'could retrieve params for index');
        }
      }));

      return this.visitAndAssert('/baz');
    }

    ['@test Route#paramsFor fetches query params with non-default value'](assert) {
      assert.expect(2);

      this.router.map(function () {
        this.route('index', { path: '/:something' });
      });

      this.setSingleQPController('index');

      this.add('route:index', _routing.Route.extend({
        model() /* params, transition */{
          assert.deepEqual(this.paramsFor('index'), { something: 'baz', foo: 'boo' }, 'could retrieve params for index');
        }
      }));

      return this.visitAndAssert('/baz?foo=boo');
    }

    ['@test Route#paramsFor fetches default falsy query params'](assert) {
      assert.expect(2);

      this.router.map(function () {
        this.route('index', { path: '/:something' });
      });

      this.setSingleQPController('index', 'foo', false);

      this.add('route:index', _routing.Route.extend({
        model() /* params, transition */{
          assert.deepEqual(this.paramsFor('index'), { something: 'baz', foo: false }, 'could retrieve params for index');
        }
      }));

      return this.visitAndAssert('/baz');
    }

    ['@test Route#paramsFor fetches non-default falsy query params'](assert) {
      assert.expect(2);

      this.router.map(function () {
        this.route('index', { path: '/:something' });
      });

      this.setSingleQPController('index', 'foo', true);

      this.add('route:index', _routing.Route.extend({
        model() /* params, transition */{
          assert.deepEqual(this.paramsFor('index'), { something: 'baz', foo: false }, 'could retrieve params for index');
        }
      }));

      return this.visitAndAssert('/baz?foo=false');
    }

    ['@test model hook can query prefix-less application params'](assert) {
      assert.expect(4);

      this.setSingleQPController('application', 'appomg', 'applol');
      this.setSingleQPController('index', 'omg', 'lol');

      this.add('route:application', _routing.Route.extend({
        model(params) {
          assert.deepEqual(params, { appomg: 'applol' });
        }
      }));

      this.add('route:index', _routing.Route.extend({
        model(params) {
          assert.deepEqual(params, { omg: 'lol' });
          assert.deepEqual(this.paramsFor('application'), {
            appomg: 'applol'
          });
        }
      }));

      return this.visitAndAssert('/');
    }

    ['@test model hook can query prefix-less application params (overridden by incoming url value)'](assert) {
      assert.expect(4);

      this.setSingleQPController('application', 'appomg', 'applol');
      this.setSingleQPController('index', 'omg', 'lol');

      this.add('route:application', _routing.Route.extend({
        model(params) {
          assert.deepEqual(params, { appomg: 'appyes' });
        }
      }));

      this.add('route:index', _routing.Route.extend({
        model(params) {
          assert.deepEqual(params, { omg: 'yes' });
          assert.deepEqual(this.paramsFor('application'), {
            appomg: 'appyes'
          });
        }
      }));

      return this.visitAndAssert('/?appomg=appyes&omg=yes');
    }

    ['@test can opt into full transition by setting refreshModel in route queryParams'](assert) {
      assert.expect(7);

      this.setSingleQPController('application', 'appomg', 'applol');
      this.setSingleQPController('index', 'omg', 'lol');

      let appModelCount = 0;
      this.add('route:application', _routing.Route.extend({
        model() /* params, transition */{
          appModelCount++;
        }
      }));

      let indexModelCount = 0;
      this.add('route:index', _routing.Route.extend({
        queryParams: {
          omg: {
            refreshModel: true
          }
        },
        model(params) {
          indexModelCount++;

          if (indexModelCount === 1) {
            assert.deepEqual(params, { omg: 'lol' }, 'params are correct on first pass');
          } else if (indexModelCount === 2) {
            assert.deepEqual(params, { omg: 'lex' }, 'params are correct on second pass');
          }
        }
      }));

      return this.visitAndAssert('/').then(() => {
        assert.equal(appModelCount, 1, 'app model hook ran');
        assert.equal(indexModelCount, 1, 'index model hook ran');

        let indexController = this.getController('index');
        this.setAndFlush(indexController, 'omg', 'lex');

        assert.equal(appModelCount, 1, 'app model hook did not run again');
        assert.equal(indexModelCount, 2, 'index model hook ran again due to refreshModel');
      });
    }

    ['@test refreshModel and replace work together'](assert) {
      assert.expect(8);

      this.setSingleQPController('application', 'appomg', 'applol');
      this.setSingleQPController('index', 'omg', 'lol');

      let appModelCount = 0;
      this.add('route:application', _routing.Route.extend({
        model() /* params */{
          appModelCount++;
        }
      }));

      let indexModelCount = 0;
      this.add('route:index', _routing.Route.extend({
        queryParams: {
          omg: {
            refreshModel: true,
            replace: true
          }
        },
        model(params) {
          indexModelCount++;

          if (indexModelCount === 1) {
            assert.deepEqual(params, { omg: 'lol' }, 'params are correct on first pass');
          } else if (indexModelCount === 2) {
            assert.deepEqual(params, { omg: 'lex' }, 'params are correct on second pass');
          }
        }
      }));

      return this.visitAndAssert('/').then(() => {
        assert.equal(appModelCount, 1, 'app model hook ran');
        assert.equal(indexModelCount, 1, 'index model hook ran');

        let indexController = this.getController('index');
        this.expectedReplaceURL = '/?omg=lex';
        this.setAndFlush(indexController, 'omg', 'lex');

        assert.equal(appModelCount, 1, 'app model hook did not run again');
        assert.equal(indexModelCount, 2, 'index model hook ran again due to refreshModel');
      });
    }

    ['@test multiple QP value changes only cause a single model refresh'](assert) {
      assert.expect(2);

      this.setSingleQPController('index', 'alex', 'lol');
      this.setSingleQPController('index', 'steely', 'lel');

      let refreshCount = 0;
      this.add('route:index', _routing.Route.extend({
        queryParams: {
          alex: {
            refreshModel: true
          },
          steely: {
            refreshModel: true
          }
        },
        refresh() {
          refreshCount++;
        }
      }));

      return this.visitAndAssert('/').then(() => {
        let indexController = this.getController('index');
        (0, _runloop.run)(indexController, 'setProperties', {
          alex: 'fran',
          steely: 'david'
        });
        assert.equal(refreshCount, 1, 'index refresh hook only run once');
      });
    }

    ['@test refreshModel does not cause a second transition during app boot '](assert) {
      assert.expect(1);

      this.setSingleQPController('application', 'appomg', 'applol');
      this.setSingleQPController('index', 'omg', 'lol');

      this.add('route:index', _routing.Route.extend({
        queryParams: {
          omg: {
            refreshModel: true
          }
        },
        refresh() {
          assert.ok(false);
        }
      }));

      return this.visitAndAssert('/?appomg=hello&omg=world');
    }

    ['@test queryParams are updated when a controller property is set and the route is refreshed. Issue #13263  '](assert) {
      this.addTemplate('application', '<button id="test-button" {{action \'increment\'}}>Increment</button><span id="test-value">{{foo}}</span>{{outlet}}');

      this.setSingleQPController('application', 'foo', 1, {
        actions: {
          increment() {
            this.incrementProperty('foo');
            this.send('refreshRoute');
          }
        }
      });

      this.add('route:application', _routing.Route.extend({
        actions: {
          refreshRoute() {
            this.refresh();
          }
        }
      }));

      return this.visitAndAssert('/').then(() => {
        assert.equal((0, _internalTestHelpers.getTextOf)(document.getElementById('test-value')), '1');

        (0, _runloop.run)(document.getElementById('test-button'), 'click');
        assert.equal((0, _internalTestHelpers.getTextOf)(document.getElementById('test-value')), '2');
        this.assertCurrentPath('/?foo=2');

        (0, _runloop.run)(document.getElementById('test-button'), 'click');
        assert.equal((0, _internalTestHelpers.getTextOf)(document.getElementById('test-value')), '3');
        this.assertCurrentPath('/?foo=3');
      });
    }

    ["@test Use Ember.get to retrieve query params 'refreshModel' configuration"](assert) {
      assert.expect(7);

      this.setSingleQPController('application', 'appomg', 'applol');
      this.setSingleQPController('index', 'omg', 'lol');

      let appModelCount = 0;
      this.add('route:application', _routing.Route.extend({
        model() /* params */{
          appModelCount++;
        }
      }));

      let indexModelCount = 0;
      this.add('route:index', _routing.Route.extend({
        queryParams: _runtime.Object.create({
          unknownProperty() {
            return { refreshModel: true };
          }
        }),
        model(params) {
          indexModelCount++;

          if (indexModelCount === 1) {
            assert.deepEqual(params, { omg: 'lol' });
          } else if (indexModelCount === 2) {
            assert.deepEqual(params, { omg: 'lex' });
          }
        }
      }));

      return this.visitAndAssert('/').then(() => {
        assert.equal(appModelCount, 1);
        assert.equal(indexModelCount, 1);

        let indexController = this.getController('index');
        this.setAndFlush(indexController, 'omg', 'lex');

        assert.equal(appModelCount, 1);
        assert.equal(indexModelCount, 2);
      });
    }

    ['@test can use refreshModel even with URL changes that remove QPs from address bar'](assert) {
      assert.expect(4);

      this.setSingleQPController('index', 'omg', 'lol');

      let indexModelCount = 0;
      this.add('route:index', _routing.Route.extend({
        queryParams: {
          omg: {
            refreshModel: true
          }
        },
        model(params) {
          indexModelCount++;

          let data;
          if (indexModelCount === 1) {
            data = 'foo';
          } else if (indexModelCount === 2) {
            data = 'lol';
          }

          assert.deepEqual(params, { omg: data }, 'index#model receives right data');
        }
      }));

      return this.visitAndAssert('/?omg=foo').then(() => {
        this.transitionTo('/');

        let indexController = this.getController('index');
        assert.equal(indexController.get('omg'), 'lol');
      });
    }

    ['@test can opt into a replace query by specifying replace:true in the Route config hash'](assert) {
      assert.expect(2);

      this.setSingleQPController('application', 'alex', 'matchneer');

      this.add('route:application', _routing.Route.extend({
        queryParams: {
          alex: {
            replace: true
          }
        }
      }));

      return this.visitAndAssert('/').then(() => {
        let appController = this.getController('application');
        this.expectedReplaceURL = '/?alex=wallace';
        this.setAndFlush(appController, 'alex', 'wallace');
      });
    }

    ['@test Route query params config can be configured using property name instead of URL key'](assert) {
      assert.expect(2);

      this.add('controller:application', _controller.default.extend({
        queryParams: [{ commitBy: 'commit_by' }]
      }));

      this.add('route:application', _routing.Route.extend({
        queryParams: {
          commitBy: {
            replace: true
          }
        }
      }));

      return this.visitAndAssert('/').then(() => {
        let appController = this.getController('application');
        this.expectedReplaceURL = '/?commit_by=igor_seb';
        this.setAndFlush(appController, 'commitBy', 'igor_seb');
      });
    }

    ['@test An explicit replace:false on a changed QP always wins and causes a pushState'](assert) {
      assert.expect(3);

      this.add('controller:application', _controller.default.extend({
        queryParams: ['alex', 'steely'],
        alex: 'matchneer',
        steely: 'dan'
      }));

      this.add('route:application', _routing.Route.extend({
        queryParams: {
          alex: {
            replace: true
          },
          steely: {
            replace: false
          }
        }
      }));

      return this.visit('/').then(() => {
        let appController = this.getController('application');
        this.expectedPushURL = '/?alex=wallace&steely=jan';
        (0, _runloop.run)(appController, 'setProperties', { alex: 'wallace', steely: 'jan' });

        this.expectedPushURL = '/?alex=wallace&steely=fran';
        (0, _runloop.run)(appController, 'setProperties', { steely: 'fran' });

        this.expectedReplaceURL = '/?alex=sriracha&steely=fran';
        (0, _runloop.run)(appController, 'setProperties', { alex: 'sriracha' });
      });
    }

    ['@test can opt into full transition by setting refreshModel in route queryParams when transitioning from child to parent'](assert) {
      this.addTemplate('parent', '{{outlet}}');
      this.addTemplate('parent.child', "{{link-to 'Parent' 'parent' (query-params foo='change') id='parent-link'}}");

      this.router.map(function () {
        this.route('parent', function () {
          this.route('child');
        });
      });

      let parentModelCount = 0;
      this.add('route:parent', _routing.Route.extend({
        model() {
          parentModelCount++;
        },
        queryParams: {
          foo: {
            refreshModel: true
          }
        }
      }));

      this.setSingleQPController('parent', 'foo', 'abc');

      return this.visit('/parent/child?foo=lol').then(() => {
        assert.equal(parentModelCount, 1);

        (0, _runloop.run)(document.getElementById('parent-link'), 'click');
        assert.equal(parentModelCount, 2);
      });
    }

    ["@test Use Ember.get to retrieve query params 'replace' configuration"](assert) {
      assert.expect(2);

      this.setSingleQPController('application', 'alex', 'matchneer');

      this.add('route:application', _routing.Route.extend({
        queryParams: _runtime.Object.create({
          unknownProperty() /* keyName */{
            // We are simulating all qps requiring refresh
            return { replace: true };
          }
        })
      }));

      return this.visitAndAssert('/').then(() => {
        let appController = this.getController('application');
        this.expectedReplaceURL = '/?alex=wallace';
        this.setAndFlush(appController, 'alex', 'wallace');
      });
    }

    ['@test can override incoming QP values in setupController'](assert) {
      assert.expect(3);

      this.router.map(function () {
        this.route('about');
      });

      this.setSingleQPController('index', 'omg', 'lol');

      this.add('route:index', _routing.Route.extend({
        setupController(controller) {
          assert.ok(true, 'setupController called');
          controller.set('omg', 'OVERRIDE');
        },
        actions: {
          queryParamsDidChange() {
            assert.ok(false, "queryParamsDidChange shouldn't fire");
          }
        }
      }));

      return this.visitAndAssert('/about').then(() => {
        this.transitionTo('index');
        this.assertCurrentPath('/?omg=OVERRIDE');
      });
    }

    ['@test can override incoming QP array values in setupController'](assert) {
      assert.expect(3);

      this.router.map(function () {
        this.route('about');
      });

      this.setSingleQPController('index', 'omg', ['lol']);

      this.add('route:index', _routing.Route.extend({
        setupController(controller) {
          assert.ok(true, 'setupController called');
          controller.set('omg', ['OVERRIDE']);
        },
        actions: {
          queryParamsDidChange() {
            assert.ok(false, "queryParamsDidChange shouldn't fire");
          }
        }
      }));

      return this.visitAndAssert('/about').then(() => {
        this.transitionTo('index');
        this.assertCurrentPath('/?omg=' + encodeURIComponent(JSON.stringify(['OVERRIDE'])));
      });
    }

    ['@test URL transitions that remove QPs still register as QP changes'](assert) {
      assert.expect(2);

      this.setSingleQPController('index', 'omg', 'lol');

      return this.visit('/?omg=borf').then(() => {
        let indexController = this.getController('index');
        assert.equal(indexController.get('omg'), 'borf');

        this.transitionTo('/');
        assert.equal(indexController.get('omg'), 'lol');
      });
    }

    ['@test Subresource naming style is supported'](assert) {
      assert.expect(5);

      this.router.map(function () {
        this.route('abc.def', { path: '/abcdef' }, function () {
          this.route('zoo');
        });
      });

      this.addTemplate('application', "{{link-to 'A' 'abc.def' (query-params foo='123') id='one'}}{{link-to 'B' 'abc.def.zoo' (query-params foo='123' bar='456') id='two'}}{{outlet}}");

      this.setSingleQPController('abc.def', 'foo', 'lol');
      this.setSingleQPController('abc.def.zoo', 'bar', 'haha');

      return this.visitAndAssert('/').then(() => {
        assert.equal(this.$('#one').attr('href'), '/abcdef?foo=123');
        assert.equal(this.$('#two').attr('href'), '/abcdef/zoo?bar=456&foo=123');

        (0, _runloop.run)(this.$('#one'), 'click');
        this.assertCurrentPath('/abcdef?foo=123');

        (0, _runloop.run)(this.$('#two'), 'click');
        this.assertCurrentPath('/abcdef/zoo?bar=456&foo=123');
      });
    }

    ['@test transitionTo supports query params']() {
      this.setSingleQPController('index', 'foo', 'lol');

      return this.visitAndAssert('/').then(() => {
        this.transitionTo({ queryParams: { foo: 'borf' } });
        this.assertCurrentPath('/?foo=borf', 'shorthand supported');

        this.transitionTo({ queryParams: { 'index:foo': 'blaf' } });
        this.assertCurrentPath('/?foo=blaf', 'longform supported');

        this.transitionTo({ queryParams: { 'index:foo': false } });
        this.assertCurrentPath('/?foo=false', 'longform supported (bool)');

        this.transitionTo({ queryParams: { foo: false } });
        this.assertCurrentPath('/?foo=false', 'shorhand supported (bool)');
      });
    }

    ['@test transitionTo supports query params (multiple)']() {
      this.add('controller:index', _controller.default.extend({
        queryParams: ['foo', 'bar'],
        foo: 'lol',
        bar: 'wat'
      }));

      return this.visitAndAssert('/').then(() => {
        this.transitionTo({ queryParams: { foo: 'borf' } });
        this.assertCurrentPath('/?foo=borf', 'shorthand supported');

        this.transitionTo({ queryParams: { 'index:foo': 'blaf' } });
        this.assertCurrentPath('/?foo=blaf', 'longform supported');

        this.transitionTo({ queryParams: { 'index:foo': false } });
        this.assertCurrentPath('/?foo=false', 'longform supported (bool)');

        this.transitionTo({ queryParams: { foo: false } });
        this.assertCurrentPath('/?foo=false', 'shorhand supported (bool)');
      });
    }

    ["@test setting controller QP to empty string doesn't generate null in URL"](assert) {
      assert.expect(1);

      this.setSingleQPController('index', 'foo', '123');

      return this.visit('/').then(() => {
        let controller = this.getController('index');

        this.expectedPushURL = '/?foo=';
        this.setAndFlush(controller, 'foo', '');
      });
    }

    ["@test setting QP to empty string doesn't generate null in URL"](assert) {
      assert.expect(1);

      this.add('route:index', _routing.Route.extend({
        queryParams: {
          foo: {
            defaultValue: '123'
          }
        }
      }));

      return this.visit('/').then(() => {
        let controller = this.getController('index');

        this.expectedPushURL = '/?foo=';
        this.setAndFlush(controller, 'foo', '');
      });
    }

    ['@test A default boolean value deserializes QPs as booleans rather than strings'](assert) {
      assert.expect(3);

      this.setSingleQPController('index', 'foo', false);

      this.add('route:index', _routing.Route.extend({
        model(params) {
          assert.equal(params.foo, true, 'model hook received foo as boolean true');
        }
      }));

      return this.visit('/?foo=true').then(() => {
        let controller = this.getController('index');
        assert.equal(controller.get('foo'), true);

        this.transitionTo('/?foo=false');
        assert.equal(controller.get('foo'), false);
      });
    }

    ['@test Query param without value are empty string'](assert) {
      assert.expect(1);

      this.add('controller:index', _controller.default.extend({
        queryParams: ['foo'],
        foo: ''
      }));

      return this.visit('/?foo=').then(() => {
        let controller = this.getController('index');
        assert.equal(controller.get('foo'), '');
      });
    }

    ['@test Array query params can be set'](assert) {
      assert.expect(2);

      this.router.map(function () {
        this.route('home', { path: '/' });
      });

      this.setSingleQPController('home', 'foo', []);

      return this.visit('/').then(() => {
        let controller = this.getController('home');

        this.setAndFlush(controller, 'foo', [1, 2]);
        this.assertCurrentPath('/?foo=%5B1%2C2%5D');

        this.setAndFlush(controller, 'foo', [3, 4]);
        this.assertCurrentPath('/?foo=%5B3%2C4%5D');
      });
    }

    ['@test (de)serialization: arrays'](assert) {
      assert.expect(4);

      this.setSingleQPController('index', 'foo', [1]);

      return this.visitAndAssert('/').then(() => {
        this.transitionTo({ queryParams: { foo: [2, 3] } });
        this.assertCurrentPath('/?foo=%5B2%2C3%5D', 'shorthand supported');
        this.transitionTo({ queryParams: { 'index:foo': [4, 5] } });
        this.assertCurrentPath('/?foo=%5B4%2C5%5D', 'longform supported');
        this.transitionTo({ queryParams: { foo: [] } });
        this.assertCurrentPath('/?foo=%5B%5D', 'longform supported');
      });
    }

    ['@test Url with array query param sets controller property to array'](assert) {
      assert.expect(1);

      this.setSingleQPController('index', 'foo', '');

      return this.visit('/?foo[]=1&foo[]=2&foo[]=3').then(() => {
        let controller = this.getController('index');
        assert.deepEqual(controller.get('foo'), ['1', '2', '3']);
      });
    }

    ['@test Array query params can be pushed/popped'](assert) {
      assert.expect(17);

      this.router.map(function () {
        this.route('home', { path: '/' });
      });

      this.setSingleQPController('home', 'foo', (0, _runtime.A)());

      return this.visitAndAssert('/').then(() => {
        let controller = this.getController('home');

        (0, _runloop.run)(controller.foo, 'pushObject', 1);
        this.assertCurrentPath('/?foo=%5B1%5D');
        assert.deepEqual(controller.foo, [1]);

        (0, _runloop.run)(controller.foo, 'popObject');
        this.assertCurrentPath('/');
        assert.deepEqual(controller.foo, []);

        (0, _runloop.run)(controller.foo, 'pushObject', 1);
        this.assertCurrentPath('/?foo=%5B1%5D');
        assert.deepEqual(controller.foo, [1]);

        (0, _runloop.run)(controller.foo, 'popObject');
        this.assertCurrentPath('/');
        assert.deepEqual(controller.foo, []);

        (0, _runloop.run)(controller.foo, 'pushObject', 1);
        this.assertCurrentPath('/?foo=%5B1%5D');
        assert.deepEqual(controller.foo, [1]);

        (0, _runloop.run)(controller.foo, 'pushObject', 2);
        this.assertCurrentPath('/?foo=%5B1%2C2%5D');
        assert.deepEqual(controller.foo, [1, 2]);

        (0, _runloop.run)(controller.foo, 'popObject');
        this.assertCurrentPath('/?foo=%5B1%5D');
        assert.deepEqual(controller.foo, [1]);

        (0, _runloop.run)(controller.foo, 'unshiftObject', 'lol');
        this.assertCurrentPath('/?foo=%5B%22lol%22%2C1%5D');
        assert.deepEqual(controller.foo, ['lol', 1]);
      });
    }

    ["@test Overwriting with array with same content shouldn't refire update"](assert) {
      assert.expect(4);

      this.router.map(function () {
        this.route('home', { path: '/' });
      });

      let modelCount = 0;
      this.add('route:home', _routing.Route.extend({
        model() {
          modelCount++;
        }
      }));

      this.setSingleQPController('home', 'foo', (0, _runtime.A)([1]));

      return this.visitAndAssert('/').then(() => {
        assert.equal(modelCount, 1);

        let controller = this.getController('home');
        this.setAndFlush(controller, 'model', (0, _runtime.A)([1]));

        assert.equal(modelCount, 1);
        this.assertCurrentPath('/');
      });
    }

    ['@test Defaulting to params hash as the model should not result in that params object being watched'](assert) {
      assert.expect(1);

      this.router.map(function () {
        this.route('other');
      });

      // This causes the params hash, which is returned as a route's
      // model if no other model could be resolved given the provided
      // params (and no custom model hook was defined), to be watched,
      // unless we return a copy of the params hash.
      this.setSingleQPController('application', 'woot', 'wat');

      this.add('route:other', _routing.Route.extend({
        model(p, trans) {
          let m = (0, _meta.peekMeta)(trans[_router_js.PARAMS_SYMBOL].application);
          assert.ok(m === undefined, "A meta object isn't constructed for this params POJO");
        }
      }));

      return this.visit('/').then(() => {
        this.transitionTo('other');
      });
    }

    ['@test Setting bound query param property to null or undefined does not serialize to url'](assert) {
      assert.expect(9);

      this.router.map(function () {
        this.route('home');
      });

      this.setSingleQPController('home', 'foo', [1, 2]);

      return this.visitAndAssert('/home').then(() => {
        var controller = this.getController('home');

        assert.deepEqual(controller.get('foo'), [1, 2]);
        this.assertCurrentPath('/home');

        this.setAndFlush(controller, 'foo', (0, _runtime.A)([1, 3]));
        this.assertCurrentPath('/home?foo=%5B1%2C3%5D');

        return this.transitionTo('/home').then(() => {
          assert.deepEqual(controller.get('foo'), [1, 2]);
          this.assertCurrentPath('/home');

          this.setAndFlush(controller, 'foo', null);
          this.assertCurrentPath('/home', 'Setting property to null');

          this.setAndFlush(controller, 'foo', (0, _runtime.A)([1, 3]));
          this.assertCurrentPath('/home?foo=%5B1%2C3%5D');

          this.setAndFlush(controller, 'foo', undefined);
          this.assertCurrentPath('/home', 'Setting property to undefined');
        });
      });
    }

    ['@test {{link-to}} with null or undefined QPs does not get serialized into url'](assert) {
      assert.expect(3);

      this.addTemplate('home', "{{link-to 'Home' 'home' (query-params foo=nullValue) id='null-link'}}{{link-to 'Home' 'home' (query-params foo=undefinedValue) id='undefined-link'}}");

      this.router.map(function () {
        this.route('home');
      });

      this.setSingleQPController('home', 'foo', [], {
        nullValue: null,
        undefinedValue: undefined
      });

      return this.visitAndAssert('/home').then(() => {
        assert.equal(this.$('#null-link').attr('href'), '/home');
        assert.equal(this.$('#undefined-link').attr('href'), '/home');
      });
    }

    ["@test A child of a resource route still defaults to parent route's model even if the child route has a query param"](assert) {
      assert.expect(2);

      this.setSingleQPController('index', 'woot', undefined, {
        woot: undefined
      });

      this.add('route:application', _routing.Route.extend({
        model() /* p, trans */{
          return { woot: true };
        }
      }));

      this.add('route:index', _routing.Route.extend({
        setupController(controller, model) {
          assert.deepEqual(model, { woot: true }, 'index route inherited model route from parent route');
        }
      }));

      return this.visitAndAssert('/');
    }

    ['@test opting into replace does not affect transitions between routes'](assert) {
      assert.expect(5);

      this.addTemplate('application', "{{link-to 'Foo' 'foo' id='foo-link'}}{{link-to 'Bar' 'bar' id='bar-no-qp-link'}}{{link-to 'Bar' 'bar' (query-params raytiley='isthebest') id='bar-link'}}{{outlet}}");

      this.router.map(function () {
        this.route('foo');
        this.route('bar');
      });

      this.setSingleQPController('bar', 'raytiley', 'israd');

      this.add('route:bar', _routing.Route.extend({
        queryParams: {
          raytiley: {
            replace: true
          }
        }
      }));

      return this.visit('/').then(() => {
        let controller = this.getController('bar');

        this.expectedPushURL = '/foo';
        (0, _runloop.run)(document.getElementById('foo-link'), 'click');

        this.expectedPushURL = '/bar';
        (0, _runloop.run)(document.getElementById('bar-no-qp-link'), 'click');

        this.expectedReplaceURL = '/bar?raytiley=woot';
        this.setAndFlush(controller, 'raytiley', 'woot');

        this.expectedPushURL = '/foo';
        (0, _runloop.run)(document.getElementById('foo-link'), 'click');

        this.expectedPushURL = '/bar?raytiley=isthebest';
        (0, _runloop.run)(document.getElementById('bar-link'), 'click');
      });
    }

    ["@test undefined isn't serialized or deserialized into a string"](assert) {
      assert.expect(4);

      this.router.map(function () {
        this.route('example');
      });

      this.addTemplate('application', "{{link-to 'Example' 'example' (query-params foo=undefined) id='the-link'}}");

      this.setSingleQPController('example', 'foo', undefined, {
        foo: undefined
      });

      this.add('route:example', _routing.Route.extend({
        model(params) {
          assert.deepEqual(params, { foo: undefined });
        }
      }));

      return this.visitAndAssert('/').then(() => {
        assert.equal(this.$('#the-link').attr('href'), '/example', 'renders without undefined qp serialized');

        return this.transitionTo('example', {
          queryParams: { foo: undefined }
        }).then(() => {
          this.assertCurrentPath('/example');
        });
      });
    }

    ['@test when refreshModel is true and loading hook is undefined, model hook will rerun when QPs change even if previous did not finish']() {
      return this.refreshModelWhileLoadingTest();
    }

    ['@test when refreshModel is true and loading hook returns false, model hook will rerun when QPs change even if previous did not finish']() {
      return this.refreshModelWhileLoadingTest(false);
    }

    ['@test when refreshModel is true and loading hook returns true, model hook will rerun when QPs change even if previous did not finish']() {
      return this.refreshModelWhileLoadingTest(true);
    }

    ["@test warn user that Route's queryParams configuration must be an Object, not an Array"](assert) {
      assert.expect(1);

      this.add('route:application', _routing.Route.extend({
        queryParams: [{ commitBy: { replace: true } }]
      }));

      expectAssertion(() => {
        this.visit('/');
      }, 'You passed in `[{"commitBy":{"replace":true}}]` as the value for `queryParams` but `queryParams` cannot be an Array');
    }

    ['@test handle route names that clash with Object.prototype properties'](assert) {
      assert.expect(1);

      this.router.map(function () {
        this.route('constructor');
      });

      this.add('route:constructor', _routing.Route.extend({
        queryParams: {
          foo: {
            defaultValue: '123'
          }
        }
      }));

      return this.visit('/').then(() => {
        this.transitionTo('constructor', { queryParams: { foo: '999' } });
        let controller = this.getController('constructor');
        assert.equal((0, _metal.get)(controller, 'foo'), '999');
      });
    }
  });
});
enifed('ember/tests/routing/query_params_test/model_dependent_state_with_query_params_test', ['@ember/controller', '@ember/-internals/runtime', '@ember/-internals/routing', '@ember/runloop', '@ember/-internals/metal', 'internal-test-helpers'], function (_controller, _runtime, _routing, _runloop, _metal, _internalTestHelpers) {
  'use strict';

  class ModelDependentQPTestCase extends _internalTestHelpers.QueryParamTestCase {
    boot() {
      this.setupApplication();
      return this.visitApplication();
    }

    teardown() {
      super.teardown(...arguments);
      this.assert.ok(!this.expectedModelHookParams, 'there should be no pending expectation of expected model hook params');
    }

    reopenController(name, options) {
      this.application.resolveRegistration(`controller:${name}`).reopen(options);
    }

    reopenRoute(name, options) {
      this.application.resolveRegistration(`route:${name}`).reopen(options);
    }

    queryParamsStickyTest1(urlPrefix) {
      let assert = this.assert;

      assert.expect(14);

      return this.boot().then(() => {
        (0, _runloop.run)(this.$link1, 'click');
        this.assertCurrentPath(`${urlPrefix}/a-1`);

        this.setAndFlush(this.controller, 'q', 'lol');

        assert.equal(this.$link1.getAttribute('href'), `${urlPrefix}/a-1?q=lol`);
        assert.equal(this.$link2.getAttribute('href'), `${urlPrefix}/a-2`);
        assert.equal(this.$link3.getAttribute('href'), `${urlPrefix}/a-3`);

        (0, _runloop.run)(this.$link2, 'click');

        assert.equal(this.controller.get('q'), 'wat');
        assert.equal(this.controller.get('z'), 0);
        assert.deepEqual(this.controller.get('model'), { id: 'a-2' });
        assert.equal(this.$link1.getAttribute('href'), `${urlPrefix}/a-1?q=lol`);
        assert.equal(this.$link2.getAttribute('href'), `${urlPrefix}/a-2`);
        assert.equal(this.$link3.getAttribute('href'), `${urlPrefix}/a-3`);
      });
    }

    queryParamsStickyTest2(urlPrefix) {
      let assert = this.assert;

      assert.expect(24);

      return this.boot().then(() => {
        this.expectedModelHookParams = { id: 'a-1', q: 'lol', z: 0 };
        this.transitionTo(`${urlPrefix}/a-1?q=lol`);

        assert.deepEqual(this.controller.get('model'), { id: 'a-1' });
        assert.equal(this.controller.get('q'), 'lol');
        assert.equal(this.controller.get('z'), 0);
        assert.equal(this.$link1.getAttribute('href'), `${urlPrefix}/a-1?q=lol`);
        assert.equal(this.$link2.getAttribute('href'), `${urlPrefix}/a-2`);
        assert.equal(this.$link3.getAttribute('href'), `${urlPrefix}/a-3`);

        this.expectedModelHookParams = { id: 'a-2', q: 'lol', z: 0 };
        this.transitionTo(`${urlPrefix}/a-2?q=lol`);

        assert.deepEqual(this.controller.get('model'), { id: 'a-2' }, "controller's model changed to a-2");
        assert.equal(this.controller.get('q'), 'lol');
        assert.equal(this.controller.get('z'), 0);
        assert.equal(this.$link1.getAttribute('href'), `${urlPrefix}/a-1?q=lol`);
        assert.equal(this.$link2.getAttribute('href'), `${urlPrefix}/a-2?q=lol`);
        assert.equal(this.$link3.getAttribute('href'), `${urlPrefix}/a-3`);

        this.expectedModelHookParams = { id: 'a-3', q: 'lol', z: 123 };
        this.transitionTo(`${urlPrefix}/a-3?q=lol&z=123`);

        assert.equal(this.controller.get('q'), 'lol');
        assert.equal(this.controller.get('z'), 123);
        assert.equal(this.$link1.getAttribute('href'), `${urlPrefix}/a-1?q=lol`);
        assert.equal(this.$link2.getAttribute('href'), `${urlPrefix}/a-2?q=lol`);
        assert.equal(this.$link3.getAttribute('href'), `${urlPrefix}/a-3?q=lol&z=123`);
      });
    }

    queryParamsStickyTest3(urlPrefix, articleLookup) {
      let assert = this.assert;

      assert.expect(32);

      this.addTemplate('application', `{{#each articles as |a|}} {{link-to 'Article' '${articleLookup}' a.id id=a.id}} {{/each}}`);

      return this.boot().then(() => {
        this.expectedModelHookParams = { id: 'a-1', q: 'wat', z: 0 };
        this.transitionTo(articleLookup, 'a-1');

        assert.deepEqual(this.controller.get('model'), { id: 'a-1' });
        assert.equal(this.controller.get('q'), 'wat');
        assert.equal(this.controller.get('z'), 0);
        assert.equal(this.$link1.getAttribute('href'), `${urlPrefix}/a-1`);
        assert.equal(this.$link2.getAttribute('href'), `${urlPrefix}/a-2`);
        assert.equal(this.$link3.getAttribute('href'), `${urlPrefix}/a-3`);

        this.expectedModelHookParams = { id: 'a-2', q: 'lol', z: 0 };
        this.transitionTo(articleLookup, 'a-2', { queryParams: { q: 'lol' } });

        assert.deepEqual(this.controller.get('model'), { id: 'a-2' });
        assert.equal(this.controller.get('q'), 'lol');
        assert.equal(this.controller.get('z'), 0);
        assert.equal(this.$link1.getAttribute('href'), `${urlPrefix}/a-1`);
        assert.equal(this.$link2.getAttribute('href'), `${urlPrefix}/a-2?q=lol`);
        assert.equal(this.$link3.getAttribute('href'), `${urlPrefix}/a-3`);

        this.expectedModelHookParams = { id: 'a-3', q: 'hay', z: 0 };
        this.transitionTo(articleLookup, 'a-3', { queryParams: { q: 'hay' } });

        assert.deepEqual(this.controller.get('model'), { id: 'a-3' });
        assert.equal(this.controller.get('q'), 'hay');
        assert.equal(this.controller.get('z'), 0);
        assert.equal(this.$link1.getAttribute('href'), `${urlPrefix}/a-1`);
        assert.equal(this.$link2.getAttribute('href'), `${urlPrefix}/a-2?q=lol`);
        assert.equal(this.$link3.getAttribute('href'), `${urlPrefix}/a-3?q=hay`);

        this.expectedModelHookParams = { id: 'a-2', q: 'lol', z: 1 };
        this.transitionTo(articleLookup, 'a-2', { queryParams: { z: 1 } });

        assert.deepEqual(this.controller.get('model'), { id: 'a-2' });
        assert.equal(this.controller.get('q'), 'lol');
        assert.equal(this.controller.get('z'), 1);
        assert.equal(this.$link1.getAttribute('href'), `${urlPrefix}/a-1`);
        assert.equal(this.$link2.getAttribute('href'), `${urlPrefix}/a-2?q=lol&z=1`);
        assert.equal(this.$link3.getAttribute('href'), `${urlPrefix}/a-3?q=hay`);
      });
    }

    queryParamsStickyTest4(urlPrefix, articleLookup) {
      let assert = this.assert;

      assert.expect(24);

      this.setupApplication();

      this.reopenController(articleLookup, {
        queryParams: { q: { scope: 'controller' } }
      });

      return this.visitApplication().then(() => {
        (0, _runloop.run)(this.$link1, 'click');
        this.assertCurrentPath(`${urlPrefix}/a-1`);

        this.setAndFlush(this.controller, 'q', 'lol');

        assert.equal(this.$link1.getAttribute('href'), `${urlPrefix}/a-1?q=lol`);
        assert.equal(this.$link2.getAttribute('href'), `${urlPrefix}/a-2?q=lol`);
        assert.equal(this.$link3.getAttribute('href'), `${urlPrefix}/a-3?q=lol`);

        (0, _runloop.run)(this.$link2, 'click');

        assert.equal(this.controller.get('q'), 'lol');
        assert.equal(this.controller.get('z'), 0);
        assert.deepEqual(this.controller.get('model'), { id: 'a-2' });

        assert.equal(this.$link1.getAttribute('href'), `${urlPrefix}/a-1?q=lol`);
        assert.equal(this.$link2.getAttribute('href'), `${urlPrefix}/a-2?q=lol`);
        assert.equal(this.$link3.getAttribute('href'), `${urlPrefix}/a-3?q=lol`);

        this.expectedModelHookParams = { id: 'a-3', q: 'haha', z: 123 };
        this.transitionTo(`${urlPrefix}/a-3?q=haha&z=123`);

        assert.deepEqual(this.controller.get('model'), { id: 'a-3' });
        assert.equal(this.controller.get('q'), 'haha');
        assert.equal(this.controller.get('z'), 123);

        assert.equal(this.$link1.getAttribute('href'), `${urlPrefix}/a-1?q=haha`);
        assert.equal(this.$link2.getAttribute('href'), `${urlPrefix}/a-2?q=haha`);
        assert.equal(this.$link3.getAttribute('href'), `${urlPrefix}/a-3?q=haha&z=123`);

        this.setAndFlush(this.controller, 'q', 'woot');

        assert.equal(this.$link1.getAttribute('href'), `${urlPrefix}/a-1?q=woot`);
        assert.equal(this.$link2.getAttribute('href'), `${urlPrefix}/a-2?q=woot`);
        assert.equal(this.$link3.getAttribute('href'), `${urlPrefix}/a-3?q=woot&z=123`);
      });
    }

    queryParamsStickyTest5(urlPrefix, commentsLookupKey) {
      let assert = this.assert;

      assert.expect(12);

      return this.boot().then(() => {
        this.transitionTo(commentsLookupKey, 'a-1');

        let commentsCtrl = this.getController(commentsLookupKey);
        assert.equal(commentsCtrl.get('page'), 1);
        this.assertCurrentPath(`${urlPrefix}/a-1/comments`);

        this.setAndFlush(commentsCtrl, 'page', 2);
        this.assertCurrentPath(`${urlPrefix}/a-1/comments?page=2`);

        this.setAndFlush(commentsCtrl, 'page', 3);
        this.assertCurrentPath(`${urlPrefix}/a-1/comments?page=3`);

        this.transitionTo(commentsLookupKey, 'a-2');
        assert.equal(commentsCtrl.get('page'), 1);
        this.assertCurrentPath(`${urlPrefix}/a-2/comments`);

        this.transitionTo(commentsLookupKey, 'a-1');
        assert.equal(commentsCtrl.get('page'), 3);
        this.assertCurrentPath(`${urlPrefix}/a-1/comments?page=3`);
      });
    }

    queryParamsStickyTest6(urlPrefix, articleLookup, commentsLookup) {
      let assert = this.assert;

      assert.expect(13);

      this.setupApplication();

      this.reopenRoute(articleLookup, {
        resetController(controller, isExiting) {
          this.controllerFor(commentsLookup).set('page', 1);
          if (isExiting) {
            controller.set('q', 'imdone');
          }
        }
      });

      this.addTemplate('about', `{{link-to 'A' '${commentsLookup}' 'a-1' id='one'}} {{link-to 'B' '${commentsLookup}' 'a-2' id='two'}}`);

      return this.visitApplication().then(() => {
        this.transitionTo(commentsLookup, 'a-1');

        let commentsCtrl = this.getController(commentsLookup);
        assert.equal(commentsCtrl.get('page'), 1);
        this.assertCurrentPath(`${urlPrefix}/a-1/comments`);

        this.setAndFlush(commentsCtrl, 'page', 2);
        this.assertCurrentPath(`${urlPrefix}/a-1/comments?page=2`);

        this.transitionTo(commentsLookup, 'a-2');
        assert.equal(commentsCtrl.get('page'), 1);
        assert.equal(this.controller.get('q'), 'wat');

        this.transitionTo(commentsLookup, 'a-1');

        this.assertCurrentPath(`${urlPrefix}/a-1/comments`);
        assert.equal(commentsCtrl.get('page'), 1);

        this.transitionTo('about');
        assert.equal(document.getElementById('one').getAttribute('href'), `${urlPrefix}/a-1/comments?q=imdone`);
        assert.equal(document.getElementById('two').getAttribute('href'), `${urlPrefix}/a-2/comments`);
      });
    }
  }

  (0, _internalTestHelpers.moduleFor)('Query Params - model-dependent state', class extends ModelDependentQPTestCase {
    setupApplication() {
      this.router.map(function () {
        this.route('article', { path: '/a/:id' }, function () {
          this.route('comments', { resetNamespace: true });
        });
        this.route('about');
      });

      let articles = (0, _runtime.A)([{ id: 'a-1' }, { id: 'a-2' }, { id: 'a-3' }]);

      this.add('controller:application', _controller.default.extend({
        articles
      }));

      let self = this;
      let assert = this.assert;
      this.add('route:article', _routing.Route.extend({
        model(params) {
          if (self.expectedModelHookParams) {
            assert.deepEqual(params, self.expectedModelHookParams, 'the ArticleRoute model hook received the expected merged dynamic segment + query params hash');
            self.expectedModelHookParams = null;
          }
          return articles.findBy('id', params.id);
        }
      }));

      this.add('controller:article', _controller.default.extend({
        queryParams: ['q', 'z'],
        q: 'wat',
        z: 0
      }));

      this.add('controller:comments', _controller.default.extend({
        queryParams: 'page',
        page: 1
      }));

      this.addTemplate('application', "{{#each articles as |a|}} 1{{link-to 'Article' 'article' a id=a.id}} {{/each}} {{outlet}}");
    }

    visitApplication() {
      return this.visit('/').then(() => {
        let assert = this.assert;

        this.$link1 = document.getElementById('a-1');
        this.$link2 = document.getElementById('a-2');
        this.$link3 = document.getElementById('a-3');

        assert.equal(this.$link1.getAttribute('href'), '/a/a-1');
        assert.equal(this.$link2.getAttribute('href'), '/a/a-2');
        assert.equal(this.$link3.getAttribute('href'), '/a/a-3');

        this.controller = this.getController('article');
      });
    }

    ["@test query params have 'model' stickiness by default"]() {
      return this.queryParamsStickyTest1('/a');
    }

    ["@test query params have 'model' stickiness by default (url changes)"]() {
      return this.queryParamsStickyTest2('/a');
    }

    ["@test query params have 'model' stickiness by default (params-based transitions)"]() {
      return this.queryParamsStickyTest3('/a', 'article');
    }

    ["@test 'controller' stickiness shares QP state between models"]() {
      return this.queryParamsStickyTest4('/a', 'article');
    }

    ["@test 'model' stickiness is scoped to current or first dynamic parent route"]() {
      return this.queryParamsStickyTest5('/a', 'comments');
    }

    ['@test can reset query params using the resetController hook']() {
      return this.queryParamsStickyTest6('/a', 'article', 'comments');
    }
  });

  (0, _internalTestHelpers.moduleFor)('Query Params - model-dependent state (nested)', class extends ModelDependentQPTestCase {
    setupApplication() {
      this.router.map(function () {
        this.route('site', function () {
          this.route('article', { path: '/a/:id' }, function () {
            this.route('comments');
          });
        });
        this.route('about');
      });

      let site_articles = (0, _runtime.A)([{ id: 'a-1' }, { id: 'a-2' }, { id: 'a-3' }]);

      this.add('controller:application', _controller.default.extend({
        articles: site_articles
      }));

      let self = this;
      let assert = this.assert;
      this.add('route:site.article', _routing.Route.extend({
        model(params) {
          if (self.expectedModelHookParams) {
            assert.deepEqual(params, self.expectedModelHookParams, 'the ArticleRoute model hook received the expected merged dynamic segment + query params hash');
            self.expectedModelHookParams = null;
          }
          return site_articles.findBy('id', params.id);
        }
      }));

      this.add('controller:site.article', _controller.default.extend({
        queryParams: ['q', 'z'],
        q: 'wat',
        z: 0
      }));

      this.add('controller:site.article.comments', _controller.default.extend({
        queryParams: 'page',
        page: 1
      }));

      this.addTemplate('application', "{{#each articles as |a|}} {{link-to 'Article' 'site.article' a id=a.id}} {{/each}} {{outlet}}");
    }

    visitApplication() {
      return this.visit('/').then(() => {
        let assert = this.assert;

        this.$link1 = document.getElementById('a-1');
        this.$link2 = document.getElementById('a-2');
        this.$link3 = document.getElementById('a-3');

        assert.equal(this.$link1.getAttribute('href'), '/site/a/a-1');
        assert.equal(this.$link2.getAttribute('href'), '/site/a/a-2');
        assert.equal(this.$link3.getAttribute('href'), '/site/a/a-3');

        this.controller = this.getController('site.article');
      });
    }

    ["@test query params have 'model' stickiness by default"]() {
      return this.queryParamsStickyTest1('/site/a');
    }

    ["@test query params have 'model' stickiness by default (url changes)"]() {
      return this.queryParamsStickyTest2('/site/a');
    }

    ["@test query params have 'model' stickiness by default (params-based transitions)"]() {
      return this.queryParamsStickyTest3('/site/a', 'site.article');
    }

    ["@test 'controller' stickiness shares QP state between models"]() {
      return this.queryParamsStickyTest4('/site/a', 'site.article');
    }

    ["@test 'model' stickiness is scoped to current or first dynamic parent route"]() {
      return this.queryParamsStickyTest5('/site/a', 'site.article.comments');
    }

    ['@test can reset query params using the resetController hook']() {
      return this.queryParamsStickyTest6('/site/a', 'site.article', 'site.article.comments');
    }
  });

  (0, _internalTestHelpers.moduleFor)('Query Params - model-dependent state (nested & more than 1 dynamic segment)', class extends ModelDependentQPTestCase {
    setupApplication() {
      this.router.map(function () {
        this.route('site', { path: '/site/:site_id' }, function () {
          this.route('article', { path: '/a/:article_id' }, function () {
            this.route('comments');
          });
        });
      });

      let sites = (0, _runtime.A)([{ id: 's-1' }, { id: 's-2' }, { id: 's-3' }]);
      let site_articles = (0, _runtime.A)([{ id: 'a-1' }, { id: 'a-2' }, { id: 'a-3' }]);

      this.add('controller:application', _controller.default.extend({
        siteArticles: site_articles,
        sites,
        allSitesAllArticles: (0, _metal.computed)({
          get() {
            let ret = [];
            let siteArticles = this.siteArticles;
            let sites = this.sites;
            sites.forEach(site => {
              ret = ret.concat(siteArticles.map(article => {
                return {
                  id: `${site.id}-${article.id}`,
                  site_id: site.id,
                  article_id: article.id
                };
              }));
            });
            return ret;
          }
        })
      }));

      let self = this;
      let assert = this.assert;
      this.add('route:site', _routing.Route.extend({
        model(params) {
          if (self.expectedSiteModelHookParams) {
            assert.deepEqual(params, self.expectedSiteModelHookParams, 'the SiteRoute model hook received the expected merged dynamic segment + query params hash');
            self.expectedSiteModelHookParams = null;
          }
          return sites.findBy('id', params.site_id);
        }
      }));

      this.add('route:site.article', _routing.Route.extend({
        model(params) {
          if (self.expectedArticleModelHookParams) {
            assert.deepEqual(params, self.expectedArticleModelHookParams, 'the SiteArticleRoute model hook received the expected merged dynamic segment + query params hash');
            self.expectedArticleModelHookParams = null;
          }
          return site_articles.findBy('id', params.article_id);
        }
      }));

      this.add('controller:site', _controller.default.extend({
        queryParams: ['country'],
        country: 'au'
      }));

      this.add('controller:site.article', _controller.default.extend({
        queryParams: ['q', 'z'],
        q: 'wat',
        z: 0
      }));

      this.add('controller:site.article.comments', _controller.default.extend({
        queryParams: ['page'],
        page: 1
      }));

      this.addTemplate('application', "{{#each allSitesAllArticles as |a|}} {{#link-to 'site.article' a.site_id a.article_id id=a.id}}Article [{{a.site_id}}] [{{a.article_id}}]{{/link-to}} {{/each}} {{outlet}}");
    }

    visitApplication() {
      return this.visit('/').then(() => {
        let assert = this.assert;

        this.links = {};
        this.links['s-1-a-1'] = document.getElementById('s-1-a-1');
        this.links['s-1-a-2'] = document.getElementById('s-1-a-2');
        this.links['s-1-a-3'] = document.getElementById('s-1-a-3');
        this.links['s-2-a-1'] = document.getElementById('s-2-a-1');
        this.links['s-2-a-2'] = document.getElementById('s-2-a-2');
        this.links['s-2-a-3'] = document.getElementById('s-2-a-3');
        this.links['s-3-a-1'] = document.getElementById('s-3-a-1');
        this.links['s-3-a-2'] = document.getElementById('s-3-a-2');
        this.links['s-3-a-3'] = document.getElementById('s-3-a-3');

        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3');

        this.site_controller = this.getController('site');
        this.article_controller = this.getController('site.article');
      });
    }

    ["@test query params have 'model' stickiness by default"](assert) {
      assert.expect(59);

      return this.boot().then(() => {
        (0, _runloop.run)(this.links['s-1-a-1'], 'click');
        assert.deepEqual(this.site_controller.get('model'), { id: 's-1' });
        assert.deepEqual(this.article_controller.get('model'), { id: 'a-1' });
        this.assertCurrentPath('/site/s-1/a/a-1');

        this.setAndFlush(this.article_controller, 'q', 'lol');

        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1?q=lol');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1?q=lol');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1?q=lol');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3');

        this.setAndFlush(this.site_controller, 'country', 'us');

        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1?country=us&q=lol');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2?country=us');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3?country=us');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1?q=lol');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1?q=lol');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3');

        (0, _runloop.run)(this.links['s-1-a-2'], 'click');

        assert.equal(this.site_controller.get('country'), 'us');
        assert.equal(this.article_controller.get('q'), 'wat');
        assert.equal(this.article_controller.get('z'), 0);
        assert.deepEqual(this.site_controller.get('model'), { id: 's-1' });
        assert.deepEqual(this.article_controller.get('model'), { id: 'a-2' });
        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1?country=us&q=lol');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2?country=us');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3?country=us');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1?q=lol');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1?q=lol');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3');

        (0, _runloop.run)(this.links['s-2-a-2'], 'click');

        assert.equal(this.site_controller.get('country'), 'au');
        assert.equal(this.article_controller.get('q'), 'wat');
        assert.equal(this.article_controller.get('z'), 0);
        assert.deepEqual(this.site_controller.get('model'), { id: 's-2' });
        assert.deepEqual(this.article_controller.get('model'), { id: 'a-2' });
        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1?country=us&q=lol');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2?country=us');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3?country=us');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1?q=lol');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1?q=lol');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3');
      });
    }

    ["@test query params have 'model' stickiness by default (url changes)"](assert) {
      assert.expect(88);

      return this.boot().then(() => {
        this.expectedSiteModelHookParams = { site_id: 's-1', country: 'au' };
        this.expectedArticleModelHookParams = {
          article_id: 'a-1',
          q: 'lol',
          z: 0
        };
        this.transitionTo('/site/s-1/a/a-1?q=lol');

        assert.deepEqual(this.site_controller.get('model'), { id: 's-1' }, "site controller's model is s-1");
        assert.deepEqual(this.article_controller.get('model'), { id: 'a-1' }, "article controller's model is a-1");
        assert.equal(this.site_controller.get('country'), 'au');
        assert.equal(this.article_controller.get('q'), 'lol');
        assert.equal(this.article_controller.get('z'), 0);
        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1?q=lol');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1?q=lol');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1?q=lol');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3');

        this.expectedSiteModelHookParams = { site_id: 's-2', country: 'us' };
        this.expectedArticleModelHookParams = {
          article_id: 'a-1',
          q: 'lol',
          z: 0
        };
        this.transitionTo('/site/s-2/a/a-1?country=us&q=lol');

        assert.deepEqual(this.site_controller.get('model'), { id: 's-2' }, "site controller's model is s-2");
        assert.deepEqual(this.article_controller.get('model'), { id: 'a-1' }, "article controller's model is a-1");
        assert.equal(this.site_controller.get('country'), 'us');
        assert.equal(this.article_controller.get('q'), 'lol');
        assert.equal(this.article_controller.get('z'), 0);
        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1?q=lol');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1?country=us&q=lol');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2?country=us');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3?country=us');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1?q=lol');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3');

        this.expectedSiteModelHookParams = { site_id: 's-2', country: 'us' };
        this.expectedArticleModelHookParams = {
          article_id: 'a-2',
          q: 'lol',
          z: 0
        };
        this.transitionTo('/site/s-2/a/a-2?country=us&q=lol');

        assert.deepEqual(this.site_controller.get('model'), { id: 's-2' }, "site controller's model is s-2");
        assert.deepEqual(this.article_controller.get('model'), { id: 'a-2' }, "article controller's model is a-2");
        assert.equal(this.site_controller.get('country'), 'us');
        assert.equal(this.article_controller.get('q'), 'lol');
        assert.equal(this.article_controller.get('z'), 0);
        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1?q=lol');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2?q=lol');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1?country=us&q=lol');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2?country=us&q=lol');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3?country=us');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1?q=lol');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2?q=lol');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3');

        this.expectedSiteModelHookParams = { site_id: 's-2', country: 'us' };
        this.expectedArticleModelHookParams = {
          article_id: 'a-3',
          q: 'lol',
          z: 123
        };
        this.transitionTo('/site/s-2/a/a-3?country=us&q=lol&z=123');

        assert.deepEqual(this.site_controller.get('model'), { id: 's-2' }, "site controller's model is s-2");
        assert.deepEqual(this.article_controller.get('model'), { id: 'a-3' }, "article controller's model is a-3");
        assert.equal(this.site_controller.get('country'), 'us');
        assert.equal(this.article_controller.get('q'), 'lol');
        assert.equal(this.article_controller.get('z'), 123);
        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1?q=lol');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2?q=lol');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3?q=lol&z=123');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1?country=us&q=lol');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2?country=us&q=lol');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3?country=us&q=lol&z=123');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1?q=lol');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2?q=lol');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3?q=lol&z=123');

        this.expectedSiteModelHookParams = { site_id: 's-3', country: 'nz' };
        this.expectedArticleModelHookParams = {
          article_id: 'a-3',
          q: 'lol',
          z: 123
        };
        this.transitionTo('/site/s-3/a/a-3?country=nz&q=lol&z=123');

        assert.deepEqual(this.site_controller.get('model'), { id: 's-3' }, "site controller's model is s-3");
        assert.deepEqual(this.article_controller.get('model'), { id: 'a-3' }, "article controller's model is a-3");
        assert.equal(this.site_controller.get('country'), 'nz');
        assert.equal(this.article_controller.get('q'), 'lol');
        assert.equal(this.article_controller.get('z'), 123);
        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1?q=lol');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2?q=lol');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3?q=lol&z=123');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1?country=us&q=lol');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2?country=us&q=lol');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3?country=us&q=lol&z=123');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1?country=nz&q=lol');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2?country=nz&q=lol');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3?country=nz&q=lol&z=123');
      });
    }

    ["@test query params have 'model' stickiness by default (params-based transitions)"](assert) {
      assert.expect(118);

      return this.boot().then(() => {
        this.expectedSiteModelHookParams = { site_id: 's-1', country: 'au' };
        this.expectedArticleModelHookParams = {
          article_id: 'a-1',
          q: 'wat',
          z: 0
        };
        this.transitionTo('site.article', 's-1', 'a-1');

        assert.deepEqual(this.site_controller.get('model'), { id: 's-1' });
        assert.deepEqual(this.article_controller.get('model'), { id: 'a-1' });
        assert.equal(this.site_controller.get('country'), 'au');
        assert.equal(this.article_controller.get('q'), 'wat');
        assert.equal(this.article_controller.get('z'), 0);
        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3');

        this.expectedSiteModelHookParams = { site_id: 's-1', country: 'au' };
        this.expectedArticleModelHookParams = {
          article_id: 'a-2',
          q: 'lol',
          z: 0
        };
        this.transitionTo('site.article', 's-1', 'a-2', {
          queryParams: { q: 'lol' }
        });

        assert.deepEqual(this.site_controller.get('model'), { id: 's-1' });
        assert.deepEqual(this.article_controller.get('model'), { id: 'a-2' });
        assert.equal(this.site_controller.get('country'), 'au');
        assert.equal(this.article_controller.get('q'), 'lol');
        assert.equal(this.article_controller.get('z'), 0);
        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2?q=lol');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2?q=lol');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2?q=lol');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3');

        this.expectedSiteModelHookParams = { site_id: 's-1', country: 'au' };
        this.expectedArticleModelHookParams = {
          article_id: 'a-3',
          q: 'hay',
          z: 0
        };
        this.transitionTo('site.article', 's-1', 'a-3', {
          queryParams: { q: 'hay' }
        });

        assert.deepEqual(this.site_controller.get('model'), { id: 's-1' });
        assert.deepEqual(this.article_controller.get('model'), { id: 'a-3' });
        assert.equal(this.site_controller.get('country'), 'au');
        assert.equal(this.article_controller.get('q'), 'hay');
        assert.equal(this.article_controller.get('z'), 0);
        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2?q=lol');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3?q=hay');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2?q=lol');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3?q=hay');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2?q=lol');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3?q=hay');

        this.expectedSiteModelHookParams = { site_id: 's-1', country: 'au' };
        this.expectedArticleModelHookParams = {
          article_id: 'a-2',
          q: 'lol',
          z: 1
        };
        this.transitionTo('site.article', 's-1', 'a-2', {
          queryParams: { z: 1 }
        });

        assert.deepEqual(this.site_controller.get('model'), { id: 's-1' });
        assert.deepEqual(this.article_controller.get('model'), { id: 'a-2' });
        assert.equal(this.site_controller.get('country'), 'au');
        assert.equal(this.article_controller.get('q'), 'lol');
        assert.equal(this.article_controller.get('z'), 1);
        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2?q=lol&z=1');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3?q=hay');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2?q=lol&z=1');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3?q=hay');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2?q=lol&z=1');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3?q=hay');

        this.expectedSiteModelHookParams = { site_id: 's-2', country: 'us' };
        this.expectedArticleModelHookParams = {
          article_id: 'a-2',
          q: 'lol',
          z: 1
        };
        this.transitionTo('site.article', 's-2', 'a-2', {
          queryParams: { country: 'us' }
        });

        assert.deepEqual(this.site_controller.get('model'), { id: 's-2' });
        assert.deepEqual(this.article_controller.get('model'), { id: 'a-2' });
        assert.equal(this.site_controller.get('country'), 'us');
        assert.equal(this.article_controller.get('q'), 'lol');
        assert.equal(this.article_controller.get('z'), 1);
        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2?q=lol&z=1');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3?q=hay');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1?country=us');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2?country=us&q=lol&z=1');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3?country=us&q=hay');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2?q=lol&z=1');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3?q=hay');

        this.expectedSiteModelHookParams = { site_id: 's-2', country: 'us' };
        this.expectedArticleModelHookParams = {
          article_id: 'a-1',
          q: 'yeah',
          z: 0
        };
        this.transitionTo('site.article', 's-2', 'a-1', {
          queryParams: { q: 'yeah' }
        });

        assert.deepEqual(this.site_controller.get('model'), { id: 's-2' });
        assert.deepEqual(this.article_controller.get('model'), { id: 'a-1' });
        assert.equal(this.site_controller.get('country'), 'us');
        assert.equal(this.article_controller.get('q'), 'yeah');
        assert.equal(this.article_controller.get('z'), 0);
        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1?q=yeah');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2?q=lol&z=1');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3?q=hay');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1?country=us&q=yeah');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2?country=us&q=lol&z=1');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3?country=us&q=hay');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1?q=yeah');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2?q=lol&z=1');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3?q=hay');

        this.expectedSiteModelHookParams = { site_id: 's-3', country: 'nz' };
        this.expectedArticleModelHookParams = {
          article_id: 'a-3',
          q: 'hay',
          z: 3
        };
        this.transitionTo('site.article', 's-3', 'a-3', {
          queryParams: { country: 'nz', z: 3 }
        });

        assert.deepEqual(this.site_controller.get('model'), { id: 's-3' });
        assert.deepEqual(this.article_controller.get('model'), { id: 'a-3' });
        assert.equal(this.site_controller.get('country'), 'nz');
        assert.equal(this.article_controller.get('q'), 'hay');
        assert.equal(this.article_controller.get('z'), 3);
        assert.equal(this.links['s-1-a-1'].getAttribute('href'), '/site/s-1/a/a-1?q=yeah');
        assert.equal(this.links['s-1-a-2'].getAttribute('href'), '/site/s-1/a/a-2?q=lol&z=1');
        assert.equal(this.links['s-1-a-3'].getAttribute('href'), '/site/s-1/a/a-3?q=hay&z=3');
        assert.equal(this.links['s-2-a-1'].getAttribute('href'), '/site/s-2/a/a-1?country=us&q=yeah');
        assert.equal(this.links['s-2-a-2'].getAttribute('href'), '/site/s-2/a/a-2?country=us&q=lol&z=1');
        assert.equal(this.links['s-2-a-3'].getAttribute('href'), '/site/s-2/a/a-3?country=us&q=hay&z=3');
        assert.equal(this.links['s-3-a-1'].getAttribute('href'), '/site/s-3/a/a-1?country=nz&q=yeah');
        assert.equal(this.links['s-3-a-2'].getAttribute('href'), '/site/s-3/a/a-2?country=nz&q=lol&z=1');
        assert.equal(this.links['s-3-a-3'].getAttribute('href'), '/site/s-3/a/a-3?country=nz&q=hay&z=3');
      });
    }
  });
});
enifed('ember/tests/routing/query_params_test/overlapping_query_params_test', ['@ember/controller', '@ember/-internals/routing', '@ember/runloop', '@ember/-internals/metal', 'internal-test-helpers'], function (_controller, _routing, _runloop, _metal, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Query Params - overlapping query param property names', class extends _internalTestHelpers.QueryParamTestCase {
    setupBase() {
      this.router.map(function () {
        this.route('parent', function () {
          this.route('child');
        });
      });

      return this.visit('/parent/child');
    }

    ['@test can remap same-named qp props'](assert) {
      assert.expect(7);

      this.setMappedQPController('parent');
      this.setMappedQPController('parent.child', 'page', 'childPage');

      return this.setupBase().then(() => {
        this.assertCurrentPath('/parent/child');

        let parentController = this.getController('parent');
        let parentChildController = this.getController('parent.child');

        this.setAndFlush(parentController, 'page', 2);
        this.assertCurrentPath('/parent/child?parentPage=2');
        this.setAndFlush(parentController, 'page', 1);
        this.assertCurrentPath('/parent/child');

        this.setAndFlush(parentChildController, 'page', 2);
        this.assertCurrentPath('/parent/child?childPage=2');
        this.setAndFlush(parentChildController, 'page', 1);
        this.assertCurrentPath('/parent/child');

        (0, _runloop.run)(() => {
          parentController.set('page', 2);
          parentChildController.set('page', 2);
        });

        this.assertCurrentPath('/parent/child?childPage=2&parentPage=2');

        (0, _runloop.run)(() => {
          parentController.set('page', 1);
          parentChildController.set('page', 1);
        });

        this.assertCurrentPath('/parent/child');
      });
    }

    ['@test query params can be either controller property or url key'](assert) {
      assert.expect(3);

      this.setMappedQPController('parent');

      return this.setupBase().then(() => {
        this.assertCurrentPath('/parent/child');

        this.transitionTo('parent.child', { queryParams: { page: 2 } });
        this.assertCurrentPath('/parent/child?parentPage=2');

        this.transitionTo('parent.child', { queryParams: { parentPage: 3 } });
        this.assertCurrentPath('/parent/child?parentPage=3');
      });
    }

    ['@test query param matching a url key and controller property'](assert) {
      assert.expect(3);

      this.setMappedQPController('parent', 'page', 'parentPage');
      this.setMappedQPController('parent.child', 'index', 'page');

      return this.setupBase().then(() => {
        this.transitionTo('parent.child', { queryParams: { page: 2 } });
        this.assertCurrentPath('/parent/child?parentPage=2');

        this.transitionTo('parent.child', { queryParams: { parentPage: 3 } });
        this.assertCurrentPath('/parent/child?parentPage=3');

        this.transitionTo('parent.child', {
          queryParams: { index: 2, page: 2 }
        });
        this.assertCurrentPath('/parent/child?page=2&parentPage=2');
      });
    }

    ['@test query param matching same property on two controllers use the urlKey higher in the chain'](assert) {
      assert.expect(4);

      this.setMappedQPController('parent', 'page', 'parentPage');
      this.setMappedQPController('parent.child', 'page', 'childPage');

      return this.setupBase().then(() => {
        this.transitionTo('parent.child', { queryParams: { page: 2 } });
        this.assertCurrentPath('/parent/child?parentPage=2');

        this.transitionTo('parent.child', { queryParams: { parentPage: 3 } });
        this.assertCurrentPath('/parent/child?parentPage=3');

        this.transitionTo('parent.child', {
          queryParams: { childPage: 2, page: 2 }
        });
        this.assertCurrentPath('/parent/child?childPage=2&parentPage=2');

        this.transitionTo('parent.child', {
          queryParams: { childPage: 3, parentPage: 4 }
        });
        this.assertCurrentPath('/parent/child?childPage=3&parentPage=4');
      });
    }

    ['@test query params does not error when a query parameter exists for route instances that share a controller'](assert) {
      assert.expect(1);

      let parentController = _controller.default.extend({
        queryParams: { page: 'page' }
      });
      this.add('controller:parent', parentController);
      this.add('route:parent.child', _routing.Route.extend({ controllerName: 'parent' }));

      return this.setupBase('/parent').then(() => {
        this.transitionTo('parent.child', { queryParams: { page: 2 } });
        this.assertCurrentPath('/parent/child?page=2');
      });
    }
    ['@test query params in the same route hierarchy with the same url key get auto-scoped'](assert) {
      assert.expect(1);

      this.setMappedQPController('parent');
      this.setMappedQPController('parent.child');

      expectAssertion(() => {
        this.setupBase();
      }, "You're not allowed to have more than one controller property map to the same query param key, but both `parent:page` and `parent.child:page` map to `parentPage`. You can fix this by mapping one of the controller properties to a different query param key via the `as` config option, e.g. `page: { as: 'other-page' }`");
    }

    ['@test Support shared but overridable mixin pattern'](assert) {
      assert.expect(7);

      let HasPage = _metal.Mixin.create({
        queryParams: 'page',
        page: 1
      });

      this.add('controller:parent', _controller.default.extend(HasPage, {
        queryParams: { page: 'yespage' }
      }));

      this.add('controller:parent.child', _controller.default.extend(HasPage));

      return this.setupBase().then(() => {
        this.assertCurrentPath('/parent/child');

        let parentController = this.getController('parent');
        let parentChildController = this.getController('parent.child');

        this.setAndFlush(parentChildController, 'page', 2);
        this.assertCurrentPath('/parent/child?page=2');
        assert.equal(parentController.get('page'), 1);
        assert.equal(parentChildController.get('page'), 2);

        this.setAndFlush(parentController, 'page', 2);
        this.assertCurrentPath('/parent/child?page=2&yespage=2');
        assert.equal(parentController.get('page'), 2);
        assert.equal(parentChildController.get('page'), 2);
      });
    }
  });
});
enifed('ember/tests/routing/query_params_test/query_param_async_get_handler_test', ['@ember/-internals/metal', '@ember/-internals/runtime', '@ember/-internals/routing', 'internal-test-helpers'], function (_metal, _runtime, _routing, _internalTestHelpers) {
  'use strict';

  // These tests mimic what happens with lazily loaded Engines.
  (0, _internalTestHelpers.moduleFor)('Query Params - async get handler', class extends _internalTestHelpers.QueryParamTestCase {
    get routerOptions() {
      let fetchedHandlers = this.fetchedHandlers = [];

      return {
        location: 'test',

        init() {
          this._super(...arguments);
          this._seenHandlers = Object.create(null);
          this._handlerPromises = Object.create(null);
        },

        setupRouter() {
          this._super(...arguments);
          let { _handlerPromises: handlerPromises, _seenHandlers: seenHandlers } = this;
          let getRoute = this._routerMicrolib.getRoute;

          this._routerMicrolib.getRoute = function (routeName) {
            fetchedHandlers.push(routeName);

            // Cache the returns so we don't have more than one Promise for a
            // given handler.
            return handlerPromises[routeName] || (handlerPromises[routeName] = new _runtime.RSVP.Promise(resolve => {
              setTimeout(() => {
                let handler = getRoute(routeName);

                seenHandlers[routeName] = handler;

                resolve(handler);
              }, 10);
            }));
          };
        },

        _getQPMeta(routeInfo) {
          let handler = this._seenHandlers[routeInfo.name];
          if (handler) {
            return (0, _metal.get)(handler, '_qp');
          }
        }
      };
    }

    ['@test can render a link to an asynchronously loaded route without fetching the route'](assert) {
      assert.expect(4);

      this.router.map(function () {
        this.route('post', { path: '/post/:id' });
      });

      this.setSingleQPController('post');

      let setupAppTemplate = () => {
        this.addTemplate('application', `
        {{link-to 'Post' 'post' 1337 (query-params foo='bar') class='post-link is-1337'}}
        {{link-to 'Post' 'post' 7331 (query-params foo='boo') class='post-link is-7331'}}
        {{outlet}}
      `);
      };

      setupAppTemplate();

      return this.visitAndAssert('/').then(() => {
        assert.equal(this.$('.post-link.is-1337').attr('href'), '/post/1337?foo=bar', 'renders correctly with default QP value');
        assert.equal(this.$('.post-link.is-7331').attr('href'), '/post/7331?foo=boo', 'renders correctly with non-default QP value');
        assert.deepEqual(this.fetchedHandlers, ['application', 'index'], `only fetched the handlers for the route we're on`);
      });
    }

    ['@test can transitionTo to an asynchronously loaded route with simple query params'](assert) {
      assert.expect(6);

      this.router.map(function () {
        this.route('post', { path: '/post/:id' });
        this.route('posts');
      });

      this.setSingleQPController('post');

      let postController;
      return this.visitAndAssert('/').then(() => {
        postController = this.getController('post');

        return this.transitionTo('posts').then(() => {
          this.assertCurrentPath('/posts');
        });
      }).then(() => {
        return this.transitionTo('post', 1337, {
          queryParams: { foo: 'boo' }
        }).then(() => {
          assert.equal(postController.get('foo'), 'boo', 'simple QP is correctly set on controller');
          this.assertCurrentPath('/post/1337?foo=boo');
        });
      }).then(() => {
        return this.transitionTo('post', 1337, {
          queryParams: { foo: 'bar' }
        }).then(() => {
          assert.equal(postController.get('foo'), 'bar', 'simple QP is correctly set with default value');
          this.assertCurrentPath('/post/1337');
        });
      });
    }

    ['@test can transitionTo to an asynchronously loaded route with array query params'](assert) {
      assert.expect(5);

      this.router.map(function () {
        this.route('post', { path: '/post/:id' });
      });

      this.setSingleQPController('post', 'comments', []);

      let postController;
      return this.visitAndAssert('/').then(() => {
        postController = this.getController('post');
        return this.transitionTo('post', 1337, {
          queryParams: { comments: [1, 2] }
        }).then(() => {
          assert.deepEqual(postController.get('comments'), [1, 2], 'array QP is correctly set with default value');
          this.assertCurrentPath('/post/1337?comments=%5B1%2C2%5D');
        });
      }).then(() => {
        return this.transitionTo('post', 1338).then(() => {
          assert.deepEqual(postController.get('comments'), [], 'array QP is correctly set on controller');
          this.assertCurrentPath('/post/1338');
        });
      });
    }

    ['@test can transitionTo to an asynchronously loaded route with mapped query params'](assert) {
      assert.expect(7);

      this.router.map(function () {
        this.route('post', { path: '/post/:id' }, function () {
          this.route('index', { path: '/' });
        });
      });

      this.setSingleQPController('post');
      this.setMappedQPController('post.index', 'comment', 'note');

      let postController;
      let postIndexController;

      return this.visitAndAssert('/').then(() => {
        postController = this.getController('post');
        postIndexController = this.getController('post.index');

        return this.transitionTo('post.index', 1337, {
          queryParams: { note: 6, foo: 'boo' }
        }).then(() => {
          assert.equal(postController.get('foo'), 'boo', 'simple QP is correctly set on controller');
          assert.equal(postIndexController.get('comment'), 6, 'mapped QP is correctly set on controller');
          this.assertCurrentPath('/post/1337?foo=boo&note=6');
        });
      }).then(() => {
        return this.transitionTo('post', 1337, {
          queryParams: { foo: 'bar' }
        }).then(() => {
          assert.equal(postController.get('foo'), 'bar', 'simple QP is correctly set with default value');
          assert.equal(postIndexController.get('comment'), 6, 'mapped QP retains value scoped to model');
          this.assertCurrentPath('/post/1337?note=6');
        });
      });
    }

    ['@test can transitionTo with a URL'](assert) {
      assert.expect(7);

      this.router.map(function () {
        this.route('post', { path: '/post/:id' }, function () {
          this.route('index', { path: '/' });
        });
      });

      this.setSingleQPController('post');
      this.setMappedQPController('post.index', 'comment', 'note');

      let postController;
      let postIndexController;

      return this.visitAndAssert('/').then(() => {
        postController = this.getController('post');
        postIndexController = this.getController('post.index');

        return this.transitionTo('/post/1337?foo=boo&note=6').then(() => {
          assert.equal(postController.get('foo'), 'boo', 'simple QP is correctly deserialized on controller');
          assert.equal(postIndexController.get('comment'), 6, 'mapped QP is correctly deserialized on controller');
          this.assertCurrentPath('/post/1337?foo=boo&note=6');
        });
      }).then(() => {
        return this.transitionTo('/post/1337?note=6').then(() => {
          assert.equal(postController.get('foo'), 'bar', 'simple QP is correctly deserialized with default value');
          assert.equal(postIndexController.get('comment'), 6, 'mapped QP retains value scoped to model');
          this.assertCurrentPath('/post/1337?note=6');
        });
      });
    }

    ["@test undefined isn't serialized or deserialized into a string"](assert) {
      assert.expect(4);

      this.router.map(function () {
        this.route('example');
      });

      this.addTemplate('application', "{{link-to 'Example' 'example' (query-params foo=undefined) id='the-link'}}");

      this.setSingleQPController('example', 'foo', undefined, {
        foo: undefined
      });

      this.add('route:example', _routing.Route.extend({
        model(params) {
          assert.deepEqual(params, { foo: undefined });
        }
      }));

      return this.visitAndAssert('/').then(() => {
        assert.equal(this.$('#the-link').attr('href'), '/example', 'renders without undefined qp serialized');

        return this.transitionTo('example', {
          queryParams: { foo: undefined }
        }).then(() => {
          this.assertCurrentPath('/example');
        });
      });
    }
  });
});
enifed('ember/tests/routing/query_params_test/query_params_paramless_link_to_test', ['@ember/controller', 'internal-test-helpers'], function (_controller, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Query Params - paramless link-to', class extends _internalTestHelpers.QueryParamTestCase {
    testParamlessLinks(assert, routeName) {
      assert.expect(1);

      this.addTemplate(routeName, "{{link-to 'index' 'index' id='index-link'}}");

      this.add(`controller:${routeName}`, _controller.default.extend({
        queryParams: ['foo'],
        foo: 'wat'
      }));

      return this.visit('/?foo=YEAH').then(() => {
        assert.equal(document.getElementById('index-link').getAttribute('href'), '/?foo=YEAH');
      });
    }

    ["@test param-less links in an app booted with query params in the URL don't reset the query params: application"](assert) {
      return this.testParamlessLinks(assert, 'application');
    }

    ["@test param-less links in an app booted with query params in the URL don't reset the query params: index"](assert) {
      return this.testParamlessLinks(assert, 'index');
    }
  });
});
enifed('ember/tests/routing/query_params_test/shared_state_test', ['@ember/controller', '@ember/service', '@ember/runloop', 'internal-test-helpers'], function (_controller, _service, _runloop, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Query Params - shared service state', class extends _internalTestHelpers.QueryParamTestCase {
    boot() {
      this.setupApplication();
      return this.visitApplication();
    }

    setupApplication() {
      this.router.map(function () {
        this.route('home', { path: '/' });
        this.route('dashboard');
      });

      this.add('service:filters', _service.default.extend({
        shared: true
      }));

      this.add('controller:home', _controller.default.extend({
        filters: (0, _service.inject)()
      }));

      this.add('controller:dashboard', _controller.default.extend({
        filters: (0, _service.inject)(),
        queryParams: [{ 'filters.shared': 'shared' }]
      }));

      this.addTemplate('application', `{{link-to 'Home' 'home' }} <div> {{outlet}} </div>`);
      this.addTemplate('home', `{{link-to 'Dashboard' 'dashboard' }}{{input type="checkbox" id='filters-checkbox' checked=(mut filters.shared) }}`);
      this.addTemplate('dashboard', `{{link-to 'Home' 'home' }}`);
    }
    visitApplication() {
      return this.visit('/');
    }

    ['@test can modify shared state before transition'](assert) {
      assert.expect(1);

      return this.boot().then(() => {
        this.$input = document.getElementById('filters-checkbox');

        // click the checkbox once to set filters.shared to false
        (0, _runloop.run)(this.$input, 'click');

        return this.visit('/dashboard').then(() => {
          assert.ok(true, 'expecting navigating to dashboard to succeed');
        });
      });
    }

    ['@test can modify shared state back to the default value before transition'](assert) {
      assert.expect(1);

      return this.boot().then(() => {
        this.$input = document.getElementById('filters-checkbox');

        // click the checkbox twice to set filters.shared to false and back to true
        (0, _runloop.run)(this.$input, 'click');
        (0, _runloop.run)(this.$input, 'click');

        return this.visit('/dashboard').then(() => {
          assert.ok(true, 'expecting navigating to dashboard to succeed');
        });
      });
    }
  });
});
enifed('ember/tests/routing/router_map_test', ['internal-test-helpers', '@ember/runloop', '@ember/-internals/routing'], function (_internalTestHelpers, _runloop, _routing) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Router.map', class extends _internalTestHelpers.ApplicationTestCase {
    ['@test Router.map returns an Ember Router class'](assert) {
      assert.expect(1);

      let ret = this.router.map(function () {
        this.route('hello');
      });

      assert.ok(_routing.Router.detect(ret));
    }

    ['@test Router.map can be called multiple times'](assert) {
      assert.expect(2);

      this.addTemplate('hello', 'Hello!');
      this.addTemplate('goodbye', 'Goodbye!');

      this.router.map(function () {
        this.route('hello');
      });

      this.router.map(function () {
        this.route('goodbye');
      });

      return (0, _runloop.run)(() => {
        return this.visit('/hello').then(() => {
          this.assertText('Hello!');
        }).then(() => {
          return this.visit('/goodbye');
        }).then(() => {
          this.assertText('Goodbye!');
        });
      });
    }
  });
});
enifed('ember/tests/routing/router_service_test/basic_test', ['@ember/-internals/routing', '@ember/-internals/metal', 'internal-test-helpers'], function (_routing, _metal, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Router Service - main', class extends _internalTestHelpers.RouterTestCase {
    ['@test RouterService#currentRouteName is correctly set for top level route'](assert) {
      if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
          assert.expect(6);
        } else {
        assert.expect(1);
      }

      return this.visit('/').then(() => {
        if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
            let currentRoute = this.routerService.currentRoute;
            let { name, localName, params, paramNames, queryParams } = currentRoute;
            assert.equal(name, 'parent.index');
            assert.equal(localName, 'index');
            assert.deepEqual(params, {});
            assert.deepEqual(queryParams, {});
            assert.deepEqual(paramNames, []);
          }

        assert.equal(this.routerService.get('currentRouteName'), 'parent.index');
      });
    }

    ['@test RouterService#currentRouteName is correctly set for child route'](assert) {
      if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
          assert.expect(6);
        } else {
        assert.expect(1);
      }

      return this.visit('/child').then(() => {
        if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
            let currentRoute = this.routerService.currentRoute;
            let { name, localName, params, paramNames, queryParams } = currentRoute;
            assert.equal(name, 'parent.child');
            assert.equal(localName, 'child');
            assert.deepEqual(params, {});
            assert.deepEqual(queryParams, {});
            assert.deepEqual(paramNames, []);
          }

        assert.equal(this.routerService.get('currentRouteName'), 'parent.child');
      });
    }

    ['@test RouterService#currentRouteName is correctly set after transition'](assert) {
      if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
          assert.expect(5);
        } else {
        assert.expect(1);
      }

      return this.visit('/child').then(() => {
        if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
            let currentRoute = this.routerService.currentRoute;
            let { name, localName } = currentRoute;
            assert.equal(name, 'parent.child');
            assert.equal(localName, 'child');
          }

        return this.routerService.transitionTo('parent.sister');
      }).then(() => {
        if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
            let currentRoute = this.routerService.currentRoute;
            let { name, localName } = currentRoute;
            assert.equal(name, 'parent.sister');
            assert.equal(localName, 'sister');
          }
        assert.equal(this.routerService.get('currentRouteName'), 'parent.sister');
      });
    }

    ['@test RouterService#currentRouteName is correctly set on each transition'](assert) {
      if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
          assert.expect(9);
        } else {
        assert.expect(3);
      }

      return this.visit('/child').then(() => {
        if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
            let currentRoute = this.routerService.currentRoute;
            let { name, localName } = currentRoute;
            assert.equal(name, 'parent.child');
            assert.equal(localName, 'child');
          }
        assert.equal(this.routerService.get('currentRouteName'), 'parent.child');

        return this.visit('/sister');
      }).then(() => {
        if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
            let currentRoute = this.routerService.currentRoute;
            let { name, localName } = currentRoute;
            assert.equal(name, 'parent.sister');
            assert.equal(localName, 'sister');
          }
        assert.equal(this.routerService.get('currentRouteName'), 'parent.sister');

        return this.visit('/brother');
      }).then(() => {
        if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
            let currentRoute = this.routerService.currentRoute;
            let { name, localName } = currentRoute;
            assert.equal(name, 'parent.brother');
            assert.equal(localName, 'brother');
          }
        assert.equal(this.routerService.get('currentRouteName'), 'parent.brother');
      });
    }

    ['@test RouterService#rootURL is correctly set to the default value'](assert) {
      assert.expect(1);

      return this.visit('/').then(() => {
        assert.equal(this.routerService.get('rootURL'), '/');
      });
    }

    ['@test RouterService#rootURL is correctly set to a custom value'](assert) {
      assert.expect(1);

      this.add('route:parent.index', _routing.Route.extend({
        init() {
          this._super();
          (0, _metal.set)(this._router, 'rootURL', '/homepage');
        }
      }));

      return this.visit('/').then(() => {
        assert.equal(this.routerService.get('rootURL'), '/homepage');
      });
    }

    ['@test RouterService#location is correctly delegated from router:main'](assert) {
      assert.expect(2);

      return this.visit('/').then(() => {
        let location = this.routerService.get('location');
        assert.ok(location);
        assert.ok(location instanceof _routing.NoneLocation);
      });
    }
  });
});
enifed('ember/tests/routing/router_service_test/currenturl_lifecycle_test', ['@ember/service', '@ember/object/computed', '@ember/-internals/glimmer', '@ember/-internals/routing', '@ember/-internals/metal', 'internal-test-helpers', '@ember/-internals/runtime'], function (_service, _computed, _glimmer, _routing, _metal, _internalTestHelpers, _runtime) {
  'use strict';

  let results = [];
  let ROUTE_NAMES = ['index', 'child', 'sister', 'brother', 'loading'];

  let InstrumentedRoute = _routing.Route.extend({
    routerService: (0, _service.inject)('router'),

    beforeModel() {
      let service = (0, _metal.get)(this, 'routerService');
      results.push([service.get('currentRouteName'), 'beforeModel', service.get('currentURL')]);
    },

    model() {
      let service = (0, _metal.get)(this, 'routerService');
      results.push([service.get('currentRouteName'), 'model', service.get('currentURL')]);
      return new _runtime.RSVP.Promise(resolve => {
        setTimeout(resolve, 200);
      });
    },

    afterModel() {
      let service = (0, _metal.get)(this, 'routerService');
      results.push([service.get('currentRouteName'), 'afterModel', service.get('currentURL')]);
    }
  });

  (0, _internalTestHelpers.moduleFor)('Router Service - currentURL | currentRouteName', class extends _internalTestHelpers.RouterTestCase {
    constructor() {
      super(...arguments);

      results = [];

      ROUTE_NAMES.forEach(name => {
        let routeName = `parent.${name}`;
        this.add(`route:${routeName}`, InstrumentedRoute.extend());
        this.addTemplate(routeName, '{{current-url}}');
      });

      let CurrenURLComponent = _glimmer.Component.extend({
        routerService: (0, _service.inject)('router'),
        currentURL: (0, _computed.readOnly)('routerService.currentURL'),
        currentRouteName: (0, _computed.readOnly)('routerService.currentRouteName')
      });

      if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
          CurrenURLComponent.reopen({
            currentRoute: (0, _computed.readOnly)('routerService.currentRoute')
          });
        }

      this.addComponent('current-url', {
        ComponentClass: CurrenURLComponent,
        template: true /* EMBER_ROUTING_ROUTER_SERVICE */ ? '{{currentURL}}-{{currentRouteName}}-{{currentRoute.name}}' : '{{currentURL}}-{{currentRouteName}}'
      });
    }

    ['@test RouterService#currentURL is correctly set for top level route'](assert) {
      assert.expect(1);

      return this.visit('/').then(() => {
        assert.equal(this.routerService.get('currentURL'), '/');
      });
    }

    ['@test RouterService#currentURL is correctly set for child route'](assert) {
      assert.expect(1);

      return this.visit('/child').then(() => {
        assert.equal(this.routerService.get('currentURL'), '/child');
      });
    }

    ['@test RouterService#currentURL is correctly set after transition'](assert) {
      assert.expect(1);

      return this.visit('/child').then(() => {
        return this.routerService.transitionTo('parent.sister');
      }).then(() => {
        assert.equal(this.routerService.get('currentURL'), '/sister');
      });
    }

    ['@test RouterService#currentURL is correctly set on each transition'](assert) {
      assert.expect(3);

      return this.visit('/child').then(() => {
        assert.equal(this.routerService.get('currentURL'), '/child');

        return this.visit('/sister');
      }).then(() => {
        assert.equal(this.routerService.get('currentURL'), '/sister');

        return this.visit('/brother');
      }).then(() => {
        assert.equal(this.routerService.get('currentURL'), '/brother');
      });
    }

    ['@test RouterService#currentURL is not set during lifecycle hooks'](assert) {
      assert.expect(2);

      return this.visit('/').then(() => {
        assert.deepEqual(results, [[null, 'beforeModel', null], [null, 'model', null], ['parent.loading', 'afterModel', '/']]);

        results = [];

        return this.visit('/child');
      }).then(() => {
        assert.deepEqual(results, [['parent.index', 'beforeModel', '/'], ['parent.index', 'model', '/'], ['parent.loading', 'afterModel', '/child']]);
      });
    }

    ['@test RouterService#currentURL is correctly set with component after consecutive visits'](assert) {
      assert.expect(3);

      return this.visit('/').then(() => {
        let text = '/-parent.index';
        if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
            text = '/-parent.index-parent.index';
          }
        this.assertText(text);

        return this.visit('/child');
      }).then(() => {
        let text = '/child-parent.child';
        if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
            text = '/child-parent.child-parent.child';
          }
        this.assertText(text);

        return this.visit('/');
      }).then(() => {
        let text = '/-parent.index';
        if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
            text = '/-parent.index-parent.index';
          }
        this.assertText(text);
      });
    }
  });
});
enifed('ember/tests/routing/router_service_test/events_test', ['internal-test-helpers', '@ember/service', '@ember/-internals/routing', '@ember/runloop'], function (_internalTestHelpers, _service, _routing, _runloop) {
  'use strict';

  if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
      (0, _internalTestHelpers.moduleFor)('Router Service - events', class extends _internalTestHelpers.RouterTestCase {
        '@test initial render'(assert) {
          assert.expect(12);
          this.add(`route:application`, _routing.Route.extend({
            router: (0, _service.inject)('router'),
            init() {
              this._super(...arguments);
              this.router.on('routeWillChange', transition => {
                assert.ok(transition);
                assert.equal(transition.from, undefined);
                assert.equal(transition.to.name, 'parent.index');
                assert.equal(transition.to.localName, 'index');
              });

              this.router.on('routeDidChange', transition => {
                assert.ok(transition);
                assert.ok(this.router.currentURL, `has URL ${this.router.currentURL}`);
                assert.equal(this.router.currentURL, '/');
                assert.ok(this.router.currentRouteName, `has route name ${this.router.currentRouteName}`);
                assert.equal(this.router.currentRouteName, 'parent.index');
                assert.equal(transition.from, undefined);
                assert.equal(transition.to.name, 'parent.index');
                assert.equal(transition.to.localName, 'index');
              });
            }
          }));
          return this.visit('/');
        }

        '@test subsequent visits'(assert) {
          assert.expect(24);
          let toParent = true;

          this.add(`route:application`, _routing.Route.extend({
            router: (0, _service.inject)('router'),
            init() {
              this._super(...arguments);
              this.router.on('routeWillChange', transition => {
                if (toParent) {
                  assert.equal(this.router.currentURL, null, 'starts as null');
                  assert.equal(transition.from, undefined);
                  assert.equal(transition.to.name, 'parent.child');
                  assert.equal(transition.to.localName, 'child');
                  assert.equal(transition.to.parent.name, 'parent', 'parent node');
                  assert.equal(transition.to.parent.child, transition.to, 'parents child node is the `to`');
                  assert.equal(transition.to.parent.parent.name, 'application', 'top level');
                  assert.equal(transition.to.parent.parent.parent, null, 'top level');
                } else {
                  assert.equal(this.router.currentURL, '/child', 'not changed until transition');
                  assert.notEqual(transition.from, undefined);
                  assert.equal(transition.from.name, 'parent.child');
                  assert.equal(transition.from.localName, 'child');
                  assert.equal(transition.to.localName, 'sister');
                  assert.equal(transition.to.name, 'parent.sister');
                }
              });

              this.router.on('routeDidChange', transition => {
                if (toParent) {
                  assert.equal(this.router.currentURL, '/child');
                  assert.equal(transition.from, undefined);
                  assert.equal(transition.to.name, 'parent.child');
                  assert.equal(transition.to.localName, 'child');
                } else {
                  assert.equal(this.router.currentURL, '/sister');
                  assert.notEqual(transition.from, undefined);
                  assert.equal(transition.from.name, 'parent.child');
                  assert.equal(transition.from.localName, 'child');
                  assert.equal(transition.to.localName, 'sister');
                  assert.equal(transition.to.name, 'parent.sister');
                }
              });
            }
          }));
          return this.visit('/child').then(() => {
            toParent = false;
            return this.routerService.transitionTo('parent.sister');
          });
        }

        '@test transitions can be retried async'(assert) {
          let done = assert.async();
          this.add(`route:parent.child`, _routing.Route.extend({
            actions: {
              willTransition(transition) {
                transition.abort();
                this.intermediateTransitionTo('parent.sister');
                (0, _runloop.later)(() => {
                  transition.retry();
                  done();
                }, 500);
              }
            }
          }));

          return this.visit('/child').then(() => {
            return this.visit('/');
          }).catch(e => {
            assert.equal(e.message, 'TransitionAborted');
          });
        }

        '@test redirection with `transitionTo`'(assert) {
          assert.expect(8);
          let toChild = false;
          let toSister = false;

          this.add(`route:parent`, _routing.Route.extend({
            model() {
              this.transitionTo('parent.child');
            }
          }));

          this.add(`route:parent.child`, _routing.Route.extend({
            model() {
              this.transitionTo('parent.sister');
            }
          }));

          this.add(`route:application`, _routing.Route.extend({
            router: (0, _service.inject)('router'),
            init() {
              this._super(...arguments);

              this.router.on('routeWillChange', transition => {
                assert.equal(transition.from, undefined, 'initial');
                if (toChild) {
                  if (toSister) {
                    assert.equal(transition.to.name, 'parent.sister', 'going to /sister');
                  } else {
                    assert.equal(transition.to.name, 'parent.child', 'going to /child');
                    toSister = true;
                  }
                } else {
                  // Going to `/`
                  assert.equal(transition.to.name, 'parent.index', 'going to /');
                  toChild = true;
                }
              });

              this.router.on('routeDidChange', transition => {
                assert.equal(transition.from, undefined, 'initial');
                assert.equal(transition.to.name, 'parent.sister', 'landed on /sister');
              });
            }
          }));
          return this.visit('/');
        }

        '@test redirection with `replaceWith`'(assert) {
          assert.expect(8);
          let toChild = false;
          let toSister = false;

          this.add(`route:parent`, _routing.Route.extend({
            model() {
              this.replaceWith('parent.child');
            }
          }));

          this.add(`route:parent.child`, _routing.Route.extend({
            model() {
              this.replaceWith('parent.sister');
            }
          }));

          this.add(`route:application`, _routing.Route.extend({
            router: (0, _service.inject)('router'),
            init() {
              this._super(...arguments);

              this.router.on('routeWillChange', transition => {
                assert.equal(transition.from, undefined, 'initial');
                if (toChild) {
                  if (toSister) {
                    assert.equal(transition.to.name, 'parent.sister', 'going to /sister');
                  } else {
                    assert.equal(transition.to.name, 'parent.child', 'going to /child');
                    toSister = true;
                  }
                } else {
                  // Going to `/`
                  assert.equal(transition.to.name, 'parent.index', 'going to /');
                  toChild = true;
                }
              });

              this.router.on('routeDidChange', transition => {
                assert.equal(transition.from, undefined, 'initial');
                assert.equal(transition.to.name, 'parent.sister', 'landed on /sister');
              });
            }
          }));
          return this.visit('/');
        }

        '@test nested redirection with `transitionTo`'(assert) {
          assert.expect(11);
          let toChild = false;
          let toSister = false;

          this.add(`route:parent.child`, _routing.Route.extend({
            model() {
              this.transitionTo('parent.sister');
            }
          }));

          this.add(`route:application`, _routing.Route.extend({
            router: (0, _service.inject)('router'),
            init() {
              this._super(...arguments);

              this.router.on('routeWillChange', transition => {
                if (toChild) {
                  assert.equal(transition.from.name, 'parent.index');
                  if (toSister) {
                    assert.equal(transition.to.name, 'parent.sister', 'going to /sister');
                  } else {
                    assert.equal(transition.to.name, 'parent.child', 'going to /child');
                    toSister = true;
                  }
                } else {
                  // Going to `/`
                  assert.equal(transition.to.name, 'parent.index', 'going to /');
                  assert.equal(transition.from, undefined, 'initial');
                }
              });

              this.router.on('routeDidChange', transition => {
                if (toSister) {
                  assert.equal(transition.from.name, 'parent.index', 'initial');
                  assert.equal(transition.to.name, 'parent.sister', 'landed on /sister');
                } else {
                  assert.equal(transition.from, undefined, 'initial');
                  assert.equal(transition.to.name, 'parent.index', 'landed on /');
                }
              });
            }
          }));
          return this.visit('/').then(() => {
            toChild = true;
            return this.routerService.transitionTo('/child').catch(e => {
              assert.equal(e.name, 'TransitionAborted', 'Transition aborted');
            });
          });
        }

        '@test nested redirection with `replaceWith`'(assert) {
          assert.expect(11);
          let toChild = false;
          let toSister = false;

          this.add(`route:parent.child`, _routing.Route.extend({
            model() {
              this.replaceWith('parent.sister');
            }
          }));

          this.add(`route:application`, _routing.Route.extend({
            router: (0, _service.inject)('router'),
            init() {
              this._super(...arguments);

              this.router.on('routeWillChange', transition => {
                if (toChild) {
                  assert.equal(transition.from.name, 'parent.index');
                  if (toSister) {
                    assert.equal(transition.to.name, 'parent.sister', 'going to /sister');
                  } else {
                    assert.equal(transition.to.name, 'parent.child', 'going to /child');
                    toSister = true;
                  }
                } else {
                  // Going to `/`
                  assert.equal(transition.to.name, 'parent.index', 'going to /');
                  assert.equal(transition.from, undefined, 'initial');
                }
              });

              this.router.on('routeDidChange', transition => {
                if (toSister) {
                  assert.equal(transition.from.name, 'parent.index', 'initial');
                  assert.equal(transition.to.name, 'parent.sister', 'landed on /sister');
                } else {
                  assert.equal(transition.from, undefined, 'initial');
                  assert.equal(transition.to.name, 'parent.index', 'landed on /');
                }
              });
            }
          }));
          return this.visit('/').then(() => {
            toChild = true;
            return this.routerService.transitionTo('/child').catch(e => {
              assert.equal(e.name, 'TransitionAborted', 'Transition aborted');
            });
          });
        }

        '@test aborted transition'(assert) {
          assert.expect(11);
          let didAbort = false;
          let toChild = false;

          this.add(`route:parent.child`, _routing.Route.extend({
            model(_model, transition) {
              didAbort = true;
              transition.abort();
            }
          }));

          this.add(`route:application`, _routing.Route.extend({
            router: (0, _service.inject)('router'),
            init() {
              this._super(...arguments);

              this.router.on('routeWillChange', transition => {
                if (didAbort) {
                  assert.equal(transition.to.name, 'parent.index', 'transition aborted');
                  assert.equal(transition.from.name, 'parent.index', 'transition aborted');
                } else if (toChild) {
                  assert.equal(transition.from.name, 'parent.index', 'from /');
                  assert.equal(transition.to.name, 'parent.child', 'to /child');
                } else {
                  assert.equal(transition.to.name, 'parent.index', 'going to /');
                  assert.equal(transition.from, undefined, 'initial');
                }
              });

              this.router.on('routeDidChange', transition => {
                if (didAbort) {
                  assert.equal(transition.to.name, 'parent.index', 'landed on /');
                  assert.equal(transition.from.name, 'parent.index', 'initial');
                } else {
                  assert.equal(transition.to.name, 'parent.index', 'transition aborted');
                  assert.equal(transition.from, undefined, 'transition aborted');
                }
              });
            }
          }));
          return this.visit('/').then(() => {
            toChild = true;
            return this.routerService.transitionTo('/child').catch(e => {
              assert.equal(e.name, 'TransitionAborted', 'Transition aborted');
            });
          });
        }

        '@test query param transitions'(assert) {
          assert.expect(15);
          let initial = true;
          let addQP = false;
          let removeQP = false;

          this.add(`route:application`, _routing.Route.extend({
            router: (0, _service.inject)('router'),
            init() {
              this._super(...arguments);

              this.router.on('routeWillChange', transition => {
                assert.equal(transition.to.name, 'parent.index');
                if (initial) {
                  assert.equal(transition.from, null);
                  assert.deepEqual(transition.to.queryParams, { a: 'true' });
                } else if (addQP) {
                  assert.deepEqual(transition.from.queryParams, { a: 'true' });
                  assert.deepEqual(transition.to.queryParams, { a: 'false', b: 'b' });
                } else if (removeQP) {
                  assert.deepEqual(transition.from.queryParams, { a: 'false', b: 'b' });
                  assert.deepEqual(transition.to.queryParams, { a: 'false' });
                } else {
                  assert.ok(false, 'never');
                }
              });

              this.router.on('routeDidChange', transition => {
                if (initial) {
                  assert.equal(transition.from, null);
                  assert.deepEqual(transition.to.queryParams, { a: 'true' });
                } else if (addQP) {
                  assert.deepEqual(transition.from.queryParams, { a: 'true' });
                  assert.deepEqual(transition.to.queryParams, { a: 'false', b: 'b' });
                } else if (removeQP) {
                  assert.deepEqual(transition.from.queryParams, { a: 'false', b: 'b' });
                  assert.deepEqual(transition.to.queryParams, { a: 'false' });
                } else {
                  assert.ok(false, 'never');
                }
              });
            }
          }));

          return this.visit('/?a=true').then(() => {
            addQP = true;
            initial = false;
            return this.routerService.transitionTo('/?a=false&b=b');
          }).then(() => {
            removeQP = true;
            addQP = false;
            return this.routerService.transitionTo('/?a=false');
          });
        }

        '@test query param redirects with `transitionTo`'(assert) {
          assert.expect(6);
          let toSister = false;

          this.add(`route:parent.child`, _routing.Route.extend({
            model() {
              toSister = true;
              this.transitionTo('/sister?a=a');
            }
          }));

          this.add(`route:application`, _routing.Route.extend({
            router: (0, _service.inject)('router'),
            init() {
              this._super(...arguments);

              this.router.on('routeWillChange', transition => {
                if (toSister) {
                  assert.equal(transition.to.name, 'parent.sister');
                  assert.deepEqual(transition.to.queryParams, { a: 'a' });
                } else {
                  assert.equal(transition.to.name, 'parent.child');
                  assert.deepEqual(transition.to.queryParams, {});
                }
              });

              this.router.on('routeDidChange', transition => {
                assert.equal(transition.to.name, 'parent.sister');
                assert.deepEqual(transition.to.queryParams, { a: 'a' });
              });
            }
          }));

          return this.visit('/child');
        }
        '@test query param redirects with `replaceWith`'(assert) {
          assert.expect(6);
          let toSister = false;

          this.add(`route:parent.child`, _routing.Route.extend({
            model() {
              toSister = true;
              this.replaceWith('/sister?a=a');
            }
          }));

          this.add(`route:application`, _routing.Route.extend({
            router: (0, _service.inject)('router'),
            init() {
              this._super(...arguments);

              this.router.on('routeWillChange', transition => {
                if (toSister) {
                  assert.equal(transition.to.name, 'parent.sister');
                  assert.deepEqual(transition.to.queryParams, { a: 'a' });
                } else {
                  assert.equal(transition.to.name, 'parent.child');
                  assert.deepEqual(transition.to.queryParams, {});
                }
              });

              this.router.on('routeDidChange', transition => {
                assert.equal(transition.to.name, 'parent.sister');
                assert.deepEqual(transition.to.queryParams, { a: 'a' });
              });
            }
          }));

          return this.visit('/child');
        }

        '@test params'(assert) {
          assert.expect(14);

          let inital = true;

          this.add('route:dynamic', _routing.Route.extend({
            model(params) {
              if (inital) {
                assert.deepEqual(params, { dynamic_id: '123' });
              } else {
                assert.deepEqual(params, { dynamic_id: '1' });
              }
              return params;
            }
          }));

          this.add(`route:application`, _routing.Route.extend({
            router: (0, _service.inject)('router'),
            init() {
              this._super(...arguments);

              this.router.on('routeWillChange', transition => {
                assert.equal(transition.to.name, 'dynamic');
                if (inital) {
                  assert.deepEqual(transition.to.paramNames, ['dynamic_id']);
                  assert.deepEqual(transition.to.params, { dynamic_id: '123' });
                } else {
                  assert.deepEqual(transition.to.paramNames, ['dynamic_id']);
                  assert.deepEqual(transition.to.params, { dynamic_id: '1' });
                }
              });

              this.router.on('routeDidChange', transition => {
                assert.equal(transition.to.name, 'dynamic');
                assert.deepEqual(transition.to.paramNames, ['dynamic_id']);
                if (inital) {
                  assert.deepEqual(transition.to.params, { dynamic_id: '123' });
                } else {
                  assert.deepEqual(transition.to.params, { dynamic_id: '1' });
                }
              });
            }
          }));

          return this.visit('/dynamic/123').then(() => {
            inital = false;
            return this.routerService.transitionTo('dynamic', 1);
          });
        }

        '@test nested params'(assert) {
          assert.expect(30);
          let initial = true;

          this.add('route:dynamicWithChild', _routing.Route.extend({
            model(params) {
              if (initial) {
                assert.deepEqual(params, { dynamic_id: '123' });
              } else {
                assert.deepEqual(params, { dynamic_id: '456' });
              }
              return params.dynamic_id;
            }
          }));

          this.add('route:dynamicWithChild.child', _routing.Route.extend({
            model(params) {
              assert.deepEqual(params, { child_id: '456' });
              return params.child_id;
            }
          }));

          this.add(`route:application`, _routing.Route.extend({
            router: (0, _service.inject)('router'),
            init() {
              this._super(...arguments);

              this.router.on('routeWillChange', transition => {
                assert.equal(transition.to.name, 'dynamicWithChild.child');
                assert.deepEqual(transition.to.paramNames, ['child_id']);
                assert.deepEqual(transition.to.params, { child_id: '456' });
                assert.deepEqual(transition.to.parent.paramNames, ['dynamic_id']);
                if (initial) {
                  assert.deepEqual(transition.to.parent.params, { dynamic_id: '123' });
                } else {
                  assert.deepEqual(transition.from.attributes, '456');
                  assert.deepEqual(transition.from.parent.attributes, '123');
                  assert.deepEqual(transition.to.parent.params, { dynamic_id: '456' });
                }
              });

              this.router.on('routeDidChange', transition => {
                assert.equal(transition.to.name, 'dynamicWithChild.child');
                assert.deepEqual(transition.to.paramNames, ['child_id']);
                assert.deepEqual(transition.to.params, { child_id: '456' });
                assert.deepEqual(transition.to.parent.paramNames, ['dynamic_id']);
                if (initial) {
                  assert.deepEqual(transition.to.parent.params, { dynamic_id: '123' });
                } else {
                  assert.deepEqual(transition.from.attributes, '456');
                  assert.deepEqual(transition.from.parent.attributes, '123');
                  assert.deepEqual(transition.to.attributes, '456');
                  assert.deepEqual(transition.to.parent.attributes, '456');
                  assert.deepEqual(transition.to.parent.params, { dynamic_id: '456' });
                }
              });
            }
          }));

          return this.visit('/dynamic-with-child/123/456').then(() => {
            initial = false;
            return this.routerService.transitionTo('/dynamic-with-child/456/456');
          });
        }
      });

      (0, _internalTestHelpers.moduleFor)('Router Service - deprecated events', class extends _internalTestHelpers.RouterTestCase {
        '@test willTransition events are deprecated'() {
          return this.visit('/').then(() => {
            expectDeprecation(() => {
              this.routerService['_router'].on('willTransition', () => {});
            }, 'You attempted to listen to the "willTransition" event which is deprecated. Please inject the router service and listen to the "routeWillChange" event.');
          });
        }

        '@test willTransition events are deprecated on routes'() {
          this.add('route:application', _routing.Route.extend({
            init() {
              this._super(...arguments);
              this.on('willTransition', () => {});
            }
          }));
          expectDeprecation(() => {
            return this.visit('/');
          }, 'You attempted to listen to the "willTransition" event which is deprecated. Please inject the router service and listen to the "routeWillChange" event.');
        }

        '@test didTransition events are deprecated on routes'() {
          this.add('route:application', _routing.Route.extend({
            init() {
              this._super(...arguments);
              this.on('didTransition', () => {});
            }
          }));
          expectDeprecation(() => {
            return this.visit('/');
          }, 'You attempted to listen to the "didTransition" event which is deprecated. Please inject the router service and listen to the "routeDidChange" event.');
        }

        '@test other events are not deprecated on routes'() {
          this.add('route:application', _routing.Route.extend({
            init() {
              this._super(...arguments);
              this.on('fixx', () => {});
            }
          }));
          expectNoDeprecation(() => {
            return this.visit('/');
          });
        }

        '@test didTransition events are deprecated'() {
          return this.visit('/').then(() => {
            expectDeprecation(() => {
              this.routerService['_router'].on('didTransition', () => {});
            }, 'You attempted to listen to the "didTransition" event which is deprecated. Please inject the router service and listen to the "routeDidChange" event.');
          });
        }

        '@test other events are not deprecated'() {
          return this.visit('/').then(() => {
            expectNoDeprecation(() => {
              this.routerService['_router'].on('wat', () => {});
            });
          });
        }
      });

      (0, _internalTestHelpers.moduleFor)('Router Service: deprecated willTransition hook', class extends _internalTestHelpers.RouterTestCase {
        get routerOptions() {
          return {
            willTransition() {
              this._super(...arguments);
              // Overrides
            }
          };
        }

        '@test willTransition hook is deprecated'() {
          expectDeprecation(() => {
            return this.visit('/');
          }, 'You attempted to override the "willTransition" method which is deprecated. Please inject the router service and listen to the "routeWillChange" event.');
        }
      });
      (0, _internalTestHelpers.moduleFor)('Router Service: deprecated didTransition hook', class extends _internalTestHelpers.RouterTestCase {
        get routerOptions() {
          return {
            didTransition() {
              this._super(...arguments);
              // Overrides
            }
          };
        }

        '@test didTransition hook is deprecated'() {
          expectDeprecation(() => {
            return this.visit('/');
          }, 'You attempted to override the "didTransition" method which is deprecated. Please inject the router service and listen to the "routeDidChange" event.');
        }
      });
    }
});
enifed('ember/tests/routing/router_service_test/isActive_test', ['@ember/controller', 'internal-test-helpers'], function (_controller, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Router Service - isActive', class extends _internalTestHelpers.RouterTestCase {
    ['@test RouterService#isActive returns true for simple route'](assert) {
      assert.expect(1);

      return this.visit('/').then(() => {
        return this.routerService.transitionTo('parent.child');
      }).then(() => {
        return this.routerService.transitionTo('parent.sister');
      }).then(() => {
        assert.ok(this.routerService.isActive('parent.sister'));
      });
    }

    ['@test RouterService#isActive returns true for simple route with dynamic segments'](assert) {
      assert.expect(1);

      let dynamicModel = { id: 1 };

      return this.visit('/').then(() => {
        return this.routerService.transitionTo('dynamic', dynamicModel);
      }).then(() => {
        assert.ok(this.routerService.isActive('dynamic', dynamicModel));
      });
    }

    ['@test RouterService#isActive does not eagerly instantiate controller for query params'](assert) {
      assert.expect(1);

      let queryParams = this.buildQueryParams({ sort: 'ASC' });

      this.add('controller:parent.sister', _controller.default.extend({
        queryParams: ['sort'],
        sort: 'ASC',

        init() {
          assert.ok(false, 'should never create');
          this._super(...arguments);
        }
      }));

      return this.visit('/').then(() => {
        return this.routerService.transitionTo('parent.brother');
      }).then(() => {
        assert.notOk(this.routerService.isActive('parent.sister', queryParams));
      });
    }

    ['@test RouterService#isActive is correct for simple route with basic query params'](assert) {
      assert.expect(2);

      let queryParams = this.buildQueryParams({ sort: 'ASC' });

      this.add('controller:parent.child', _controller.default.extend({
        queryParams: ['sort'],
        sort: 'ASC'
      }));

      return this.visit('/').then(() => {
        return this.routerService.transitionTo('parent.child', queryParams);
      }).then(() => {
        assert.ok(this.routerService.isActive('parent.child', queryParams));
        assert.notOk(this.routerService.isActive('parent.child', this.buildQueryParams({ sort: 'DESC' })));
      });
    }

    ['@test RouterService#isActive for simple route with array as query params'](assert) {
      assert.expect(1);

      let queryParams = this.buildQueryParams({ sort: ['ascending'] });

      return this.visit('/').then(() => {
        return this.routerService.transitionTo('parent.child', queryParams);
      }).then(() => {
        assert.notOk(this.routerService.isActive('parent.child', this.buildQueryParams({ sort: 'descending' })));
      });
    }
  });
});
enifed('ember/tests/routing/router_service_test/recognize_test', ['internal-test-helpers', '@ember/-internals/routing'], function (_internalTestHelpers, _routing) {
  'use strict';

  if (true /* EMBER_ROUTING_ROUTER_SERVICE */) {
      (0, _internalTestHelpers.moduleFor)('Router Service - recognize', class extends _internalTestHelpers.RouterTestCase {
        '@test returns a RouteInfo for recognized URL'(assert) {
          return this.visit('/').then(() => {
            let routeInfo = this.routerService.recognize('/dynamic-with-child/123/1?a=b');
            assert.ok(routeInfo);
            let { name, localName, parent, child, params, queryParams, paramNames } = routeInfo;
            assert.equal(name, 'dynamicWithChild.child');
            assert.equal(localName, 'child');
            assert.ok(parent);
            assert.equal(parent.name, 'dynamicWithChild');
            assert.notOk(child);
            assert.deepEqual(params, { child_id: '1' });
            assert.deepEqual(queryParams, { a: 'b' });
            assert.deepEqual(paramNames, ['child_id']);
          });
        }

        '@test does not transition'(assert) {
          this.addTemplate('parent', 'Parent');
          this.addTemplate('dynamic-with-child.child', 'Dynamic Child');

          return this.visit('/').then(() => {
            this.routerService.recognize('/dynamic-with-child/123/1?a=b');
            this.assertText('Parent', 'Did not transition and cause render');
            assert.equal(this.routerService.currentURL, '/', 'Did not transition');
          });
        }

        '@test respects the usage of a different rootURL'(assert) {
          this.router.reopen({
            rootURL: '/app/'
          });

          return this.visit('/app').then(() => {
            let routeInfo = this.routerService.recognize('/app/child/');
            assert.ok(routeInfo);
            let { name, localName, parent } = routeInfo;
            assert.equal(name, 'parent.child');
            assert.equal(localName, 'child');
            assert.equal(parent.name, 'parent');
          });
        }

        '@test must include rootURL'() {
          this.addTemplate('parent', 'Parent');
          this.addTemplate('dynamic-with-child.child', 'Dynamic Child');

          this.router.reopen({
            rootURL: '/app/'
          });

          return this.visit('/app').then(() => {
            expectAssertion(() => {
              this.routerService.recognize('/dynamic-with-child/123/1?a=b');
            }, 'You must pass a url that begins with the application\'s rootURL "/app/"');
          });
        }

        '@test returns `null` if URL is not recognized'(assert) {
          return this.visit('/').then(() => {
            let routeInfo = this.routerService.recognize('/foo');
            assert.equal(routeInfo, null);
          });
        }
      });

      (0, _internalTestHelpers.moduleFor)('Router Service - recognizeAndLoad', class extends _internalTestHelpers.RouterTestCase {
        '@test returns a RouteInfoWithAttributes for recognized URL'(assert) {
          this.add('route:dynamicWithChild', _routing.Route.extend({
            model(params) {
              return { name: 'dynamicWithChild', data: params.dynamic_id };
            }
          }));
          this.add('route:dynamicWithChild.child', _routing.Route.extend({
            model(params) {
              return { name: 'dynamicWithChild.child', data: params.child_id };
            }
          }));

          return this.visit('/').then(() => {
            return this.routerService.recognizeAndLoad('/dynamic-with-child/123/1?a=b');
          }).then(routeInfoWithAttributes => {
            assert.ok(routeInfoWithAttributes);
            let {
              name,
              localName,
              parent,
              attributes,
              paramNames,
              params,
              queryParams
            } = routeInfoWithAttributes;
            assert.equal(name, 'dynamicWithChild.child');
            assert.equal(localName, 'child');
            assert.equal(parent.name, 'dynamicWithChild');
            assert.deepEqual(params, { child_id: '1' });
            assert.deepEqual(queryParams, { a: 'b' });
            assert.deepEqual(paramNames, ['child_id']);
            assert.deepEqual(attributes, { name: 'dynamicWithChild.child', data: '1' });
            assert.deepEqual(parent.attributes, { name: 'dynamicWithChild', data: '123' });
            assert.deepEqual(parent.paramNames, ['dynamic_id']);
            assert.deepEqual(parent.params, { dynamic_id: '123' });
          });
        }

        '@test does not transition'(assert) {
          this.addTemplate('parent', 'Parent{{outlet}}');
          this.addTemplate('parent.child', 'Child');

          this.add('route:parent.child', _routing.Route.extend({
            model() {
              return { name: 'child', data: ['stuff'] };
            }
          }));
          return this.visit('/').then(() => {
            this.routerService.on('routeWillChange', () => assert.ok(false));
            this.routerService.on('routeDidChange', () => assert.ok(false));
            return this.routerService.recognizeAndLoad('/child');
          }).then(() => {
            assert.equal(this.routerService.currentURL, '/');
            this.assertText('Parent');
          });
        }

        '@test respects the usage of a different rootURL'(assert) {
          this.router.reopen({
            rootURL: '/app/'
          });

          return this.visit('/app').then(() => {
            return this.routerService.recognizeAndLoad('/app/child/');
          }).then(routeInfoWithAttributes => {
            assert.ok(routeInfoWithAttributes);
            let { name, localName, parent } = routeInfoWithAttributes;
            assert.equal(name, 'parent.child');
            assert.equal(localName, 'child');
            assert.equal(parent.name, 'parent');
          });
        }

        '@test must include rootURL'() {
          this.router.reopen({
            rootURL: '/app/'
          });

          return this.visit('/app').then(() => {
            expectAssertion(() => {
              this.routerService.recognizeAndLoad('/dynamic-with-child/123/1?a=b');
            }, 'You must pass a url that begins with the application\'s rootURL "/app/"');
          });
        }

        '@test rejects if url is not recognized'(assert) {
          this.addTemplate('parent', 'Parent{{outlet}}');
          this.addTemplate('parent.child', 'Child');

          this.add('route:parent.child', _routing.Route.extend({
            model() {
              return { name: 'child', data: ['stuff'] };
            }
          }));
          return this.visit('/').then(() => {
            return this.routerService.recognizeAndLoad('/foo');
          }).then(() => {
            assert.ok(false, 'never');
          }, reason => {
            assert.equal(reason, 'URL /foo was not recognized');
          });
        }

        '@test rejects if there is an unhandled error'(assert) {
          this.addTemplate('parent', 'Parent{{outlet}}');
          this.addTemplate('parent.child', 'Child');

          this.add('route:parent.child', _routing.Route.extend({
            model() {
              throw Error('Unhandled');
            }
          }));
          return this.visit('/').then(() => {
            return this.routerService.recognizeAndLoad('/child');
          }).then(() => {
            assert.ok(false, 'never');
          }, err => {
            assert.equal(err.message, 'Unhandled');
          });
        }
      });
    }
});
enifed('ember/tests/routing/router_service_test/replaceWith_test', ['@ember/-internals/routing', 'internal-test-helpers', 'router_js', '@ember/controller'], function (_routing, _internalTestHelpers, _router_js, _controller) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Router Service - replaceWith', class extends _internalTestHelpers.RouterTestCase {
    constructor() {
      super(...arguments);

      let testCase = this;
      testCase.state = [];

      this.add('location:test', _routing.NoneLocation.extend({
        setURL(path) {
          testCase.state.push(path);
          this.set('path', path);
        },

        replaceURL(path) {
          testCase.state.splice(testCase.state.length - 1, 1, path);
          this.set('path', path);
        }
      }));
    }

    get routerOptions() {
      return {
        location: 'test'
      };
    }

    ['@test RouterService#replaceWith returns a Transition'](assert) {
      assert.expect(1);

      let transition;

      return this.visit('/').then(() => {
        transition = this.routerService.replaceWith('parent.child');

        assert.ok(transition instanceof _router_js.InternalTransition);

        return transition;
      });
    }

    ['@test RouterService#replaceWith with basic route replaces location'](assert) {
      assert.expect(1);

      return this.visit('/').then(() => {
        return this.routerService.transitionTo('parent.child');
      }).then(() => {
        return this.routerService.transitionTo('parent.sister');
      }).then(() => {
        return this.routerService.replaceWith('parent.brother');
      }).then(() => {
        assert.deepEqual(this.state, ['/', '/child', '/brother']);
      });
    }

    ['@test RouterService#replaceWith with basic route using URLs replaces location'](assert) {
      assert.expect(1);

      return this.visit('/').then(() => {
        return this.routerService.transitionTo('/child');
      }).then(() => {
        return this.routerService.transitionTo('/sister');
      }).then(() => {
        return this.routerService.replaceWith('/brother');
      }).then(() => {
        assert.deepEqual(this.state, ['/', '/child', '/brother']);
      });
    }

    ['@test RouterService#replaceWith transitioning back to previously visited route replaces location'](assert) {
      assert.expect(1);

      return this.visit('/').then(() => {
        return this.routerService.transitionTo('parent.child');
      }).then(() => {
        return this.routerService.transitionTo('parent.sister');
      }).then(() => {
        return this.routerService.transitionTo('parent.brother');
      }).then(() => {
        return this.routerService.replaceWith('parent.sister');
      }).then(() => {
        assert.deepEqual(this.state, ['/', '/child', '/sister', '/sister']);
      });
    }

    ['@test RouterService#replaceWith with basic query params does not remove query param defaults'](assert) {
      assert.expect(1);

      this.add('controller:parent.child', _controller.default.extend({
        queryParams: ['sort'],
        sort: 'ASC'
      }));

      let queryParams = this.buildQueryParams({ sort: 'ASC' });

      return this.visit('/').then(() => {
        return this.routerService.transitionTo('parent.brother');
      }).then(() => {
        return this.routerService.replaceWith('parent.sister');
      }).then(() => {
        return this.routerService.replaceWith('parent.child', queryParams);
      }).then(() => {
        assert.deepEqual(this.state, ['/', '/child?sort=ASC']);
      });
    }
  });
});
enifed('ember/tests/routing/router_service_test/transitionTo_test', ['@ember/service', '@ember/-internals/glimmer', '@ember/-internals/routing', '@ember/controller', '@ember/runloop', '@ember/-internals/metal', 'internal-test-helpers', 'router_js'], function (_service, _glimmer, _routing, _controller, _runloop, _metal, _internalTestHelpers, _router_js) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Router Service - transitionTo', class extends _internalTestHelpers.RouterTestCase {
    constructor() {
      super(...arguments);

      let testCase = this;
      testCase.state = [];

      this.add('location:test', _routing.NoneLocation.extend({
        setURL(path) {
          testCase.state.push(path);
          this.set('path', path);
        },

        replaceURL(path) {
          testCase.state.splice(testCase.state.length - 1, 1, path);
          this.set('path', path);
        }
      }));
    }

    get routerOptions() {
      return {
        location: 'test'
      };
    }

    ['@test RouterService#transitionTo returns a Transition'](assert) {
      assert.expect(1);

      let transition;

      return this.visit('/').then(() => {
        transition = this.routerService.transitionTo('parent.child');

        assert.ok(transition instanceof _router_js.InternalTransition);

        return transition;
      });
    }

    ['@test RouterService#transitionTo with basic route updates location'](assert) {
      assert.expect(1);

      return this.visit('/').then(() => {
        return this.routerService.transitionTo('parent.child');
      }).then(() => {
        return this.routerService.transitionTo('parent.sister');
      }).then(() => {
        return this.routerService.transitionTo('parent.brother');
      }).then(() => {
        assert.deepEqual(this.state, ['/', '/child', '/sister', '/brother']);
      });
    }

    ['@test RouterService#transitionTo transitioning back to previously visited route updates location'](assert) {
      assert.expect(1);

      return this.visit('/').then(() => {
        return this.routerService.transitionTo('parent.child');
      }).then(() => {
        return this.routerService.transitionTo('parent.sister');
      }).then(() => {
        return this.routerService.transitionTo('parent.brother');
      }).then(() => {
        return this.routerService.transitionTo('parent.sister');
      }).then(() => {
        assert.deepEqual(this.state, ['/', '/child', '/sister', '/brother', '/sister']);
      });
    }

    ['@test RouterService#transitionTo with basic route'](assert) {
      assert.expect(1);

      let componentInstance;

      this.addTemplate('parent.index', '{{foo-bar}}');

      this.addComponent('foo-bar', {
        ComponentClass: _glimmer.Component.extend({
          routerService: (0, _service.inject)('router'),
          init() {
            this._super();
            componentInstance = this;
          },
          actions: {
            transitionToSister() {
              (0, _metal.get)(this, 'routerService').transitionTo('parent.sister');
            }
          }
        }),
        template: `foo-bar`
      });

      return this.visit('/').then(() => {
        (0, _runloop.run)(function () {
          componentInstance.send('transitionToSister');
        });

        assert.equal(this.routerService.get('currentRouteName'), 'parent.sister');
      });
    }

    ['@test RouterService#transitionTo with basic route using URL'](assert) {
      assert.expect(1);

      let componentInstance;

      this.addTemplate('parent.index', '{{foo-bar}}');

      this.addComponent('foo-bar', {
        ComponentClass: _glimmer.Component.extend({
          routerService: (0, _service.inject)('router'),
          init() {
            this._super();
            componentInstance = this;
          },
          actions: {
            transitionToSister() {
              (0, _metal.get)(this, 'routerService').transitionTo('/sister');
            }
          }
        }),
        template: `foo-bar`
      });

      return this.visit('/').then(() => {
        (0, _runloop.run)(function () {
          componentInstance.send('transitionToSister');
        });

        assert.equal(this.routerService.get('currentRouteName'), 'parent.sister');
      });
    }

    ['@test RouterService#transitionTo with dynamic segment'](assert) {
      assert.expect(3);

      let componentInstance;
      let dynamicModel = { id: 1, contents: 'much dynamicism' };

      this.addTemplate('parent.index', '{{foo-bar}}');
      this.addTemplate('dynamic', '{{model.contents}}');

      this.addComponent('foo-bar', {
        ComponentClass: _glimmer.Component.extend({
          routerService: (0, _service.inject)('router'),
          init() {
            this._super();
            componentInstance = this;
          },
          actions: {
            transitionToDynamic() {
              (0, _metal.get)(this, 'routerService').transitionTo('dynamic', dynamicModel);
            }
          }
        }),
        template: `foo-bar`
      });

      return this.visit('/').then(() => {
        (0, _runloop.run)(function () {
          componentInstance.send('transitionToDynamic');
        });

        assert.equal(this.routerService.get('currentRouteName'), 'dynamic');
        assert.equal(this.routerService.get('currentURL'), '/dynamic/1');
        this.assertText('much dynamicism');
      });
    }

    ['@test RouterService#transitionTo with dynamic segment and model hook'](assert) {
      assert.expect(3);

      let componentInstance;
      let dynamicModel = { id: 1, contents: 'much dynamicism' };

      this.add('route:dynamic', _routing.Route.extend({
        model() {
          return dynamicModel;
        }
      }));

      this.addTemplate('parent.index', '{{foo-bar}}');
      this.addTemplate('dynamic', '{{model.contents}}');

      this.addComponent('foo-bar', {
        ComponentClass: _glimmer.Component.extend({
          routerService: (0, _service.inject)('router'),
          init() {
            this._super();
            componentInstance = this;
          },
          actions: {
            transitionToDynamic() {
              (0, _metal.get)(this, 'routerService').transitionTo('dynamic', 1);
            }
          }
        }),
        template: `foo-bar`
      });

      return this.visit('/').then(() => {
        (0, _runloop.run)(function () {
          componentInstance.send('transitionToDynamic');
        });

        assert.equal(this.routerService.get('currentRouteName'), 'dynamic');
        assert.equal(this.routerService.get('currentURL'), '/dynamic/1');
        this.assertText('much dynamicism');
      });
    }

    ['@test RouterService#transitionTo with basic query params does not remove query param defaults'](assert) {
      assert.expect(1);

      this.add('controller:parent.child', _controller.default.extend({
        queryParams: ['sort'],
        sort: 'ASC'
      }));

      let queryParams = this.buildQueryParams({ sort: 'ASC' });

      return this.visit('/').then(() => {
        return this.routerService.transitionTo('parent.child', queryParams);
      }).then(() => {
        assert.equal(this.routerService.get('currentURL'), '/child?sort=ASC');
      });
    }

    ['@test RouterService#transitionTo passing only queryParams works'](assert) {
      assert.expect(2);

      this.add('controller:parent.child', _controller.default.extend({
        queryParams: ['sort']
      }));

      let queryParams = this.buildQueryParams({ sort: 'DESC' });

      return this.visit('/').then(() => {
        return this.routerService.transitionTo('parent.child');
      }).then(() => {
        assert.equal(this.routerService.get('currentURL'), '/child');
      }).then(() => {
        return this.routerService.transitionTo(queryParams);
      }).then(() => {
        assert.equal(this.routerService.get('currentURL'), '/child?sort=DESC');
      });
    }

    ['@test RouterService#transitionTo with unspecified query params'](assert) {
      assert.expect(1);

      this.add('controller:parent.child', _controller.default.extend({
        queryParams: ['sort', 'page', 'category', 'extra'],
        sort: 'ASC',
        page: null,
        category: undefined
      }));

      let queryParams = this.buildQueryParams({ sort: 'ASC' });

      return this.visit('/').then(() => {
        return this.routerService.transitionTo('parent.child', queryParams);
      }).then(() => {
        assert.equal(this.routerService.get('currentURL'), '/child?sort=ASC');
      });
    }

    ['@test RouterService#transitionTo with aliased query params uses the original provided key'](assert) {
      assert.expect(1);

      this.add('controller:parent.child', _controller.default.extend({
        queryParams: {
          cont_sort: 'url_sort'
        },
        cont_sort: 'ASC'
      }));

      let queryParams = this.buildQueryParams({ url_sort: 'ASC' });

      return this.visit('/').then(() => {
        return this.routerService.transitionTo('parent.child', queryParams);
      }).then(() => {
        assert.equal(this.routerService.get('currentURL'), '/child?url_sort=ASC');
      });
    }

    ['@test RouterService#transitionTo with aliased query params uses the original provided key when controller property name'](assert) {
      assert.expect(1);

      this.add('controller:parent.child', _controller.default.extend({
        queryParams: {
          cont_sort: 'url_sort'
        },
        cont_sort: 'ASC'
      }));

      let queryParams = this.buildQueryParams({ cont_sort: 'ASC' });

      return this.visit('/').then(() => {
        expectAssertion(() => {
          return this.routerService.transitionTo('parent.child', queryParams);
        }, 'You passed the `cont_sort` query parameter during a transition into parent.child, please update to url_sort');
      });
    }
  });
});
enifed('ember/tests/routing/router_service_test/urlFor_test', ['@ember/controller', '@ember/string', '@ember/-internals/routing', '@ember/-internals/metal', 'internal-test-helpers'], function (_controller, _string, _routing, _metal, _internalTestHelpers) {
  'use strict';

  function setupController(app, name) {
    let controllerName = `${(0, _string.capitalize)(name)}Controller`;

    Object.defineProperty(app, controllerName, {
      get() {
        throw new Error(`Generating a URL should not require instantiation of a ${controllerName}.`);
      }
    });
  }

  (0, _internalTestHelpers.moduleFor)('Router Service - urlFor', class extends _internalTestHelpers.RouterTestCase {
    ['@test RouterService#urlFor returns URL for simple route'](assert) {
      assert.expect(1);

      return this.visit('/').then(() => {
        let expectedURL = this.routerService.urlFor('parent.child');

        assert.equal('/child', expectedURL);
      });
    }

    ['@test RouterService#urlFor returns URL for simple route with dynamic segments'](assert) {
      assert.expect(1);

      setupController(this.application, 'dynamic');

      let dynamicModel = { id: 1, contents: 'much dynamicism' };

      return this.visit('/').then(() => {
        let expectedURL = this.routerService.urlFor('dynamic', dynamicModel);

        assert.equal('/dynamic/1', expectedURL);
      });
    }

    ['@test RouterService#urlFor returns URL for simple route with basic query params'](assert) {
      assert.expect(1);

      let queryParams = this.buildQueryParams({ foo: 'bar' });

      return this.visit('/').then(() => {
        let expectedURL = this.routerService.urlFor('parent.child', queryParams);

        assert.equal('/child?foo=bar', expectedURL);
      });
    }

    ['@test RouterService#urlFor returns URL for simple route with basic query params and default value'](assert) {
      assert.expect(1);

      this.add('controller:parent.child', _controller.default.extend({
        queryParams: ['sort'],
        sort: 'ASC'
      }));

      let queryParams = this.buildQueryParams({ sort: 'ASC' });

      return this.visit('/').then(() => {
        let expectedURL = this.routerService.urlFor('parent.child', queryParams);

        assert.equal('/child?sort=ASC', expectedURL);
      });
    }

    ['@test RouterService#urlFor returns URL for simple route with basic query params and default value with stickyness'](assert) {
      assert.expect(2);

      this.add('controller:parent.child', _controller.default.extend({
        queryParams: ['sort', 'foo'],
        sort: 'ASC'
      }));

      return this.visit('/child/?sort=DESC').then(() => {
        let controller = this.applicationInstance.lookup('controller:parent.child');
        assert.equal((0, _metal.get)(controller, 'sort'), 'DESC', 'sticky is set');

        let queryParams = this.buildQueryParams({ foo: 'derp' });
        let actual = this.routerService.urlFor('parent.child', queryParams);

        assert.equal(actual, '/child?foo=derp', 'does not use "stickiness"');
      });
    }

    ['@test RouterService#urlFor returns URL for simple route with array as query params'](assert) {
      assert.expect(1);

      let queryParams = this.buildQueryParams({
        selectedItems: ['a', 'b', 'c']
      });

      return this.visit('/').then(() => {
        let expectedURL = this.routerService.urlFor('parent.child', queryParams);

        assert.equal('/child?selectedItems[]=a&selectedItems[]=b&selectedItems[]=c', expectedURL);
      });
    }

    ['@test RouterService#urlFor returns URL for simple route with null query params'](assert) {
      assert.expect(1);

      let queryParams = this.buildQueryParams({ foo: null });

      return this.visit('/').then(() => {
        let expectedURL = this.routerService.urlFor('parent.child', queryParams);

        assert.equal('/child', expectedURL);
      });
    }

    ['@test RouterService#urlFor returns URL for simple route with undefined query params'](assert) {
      assert.expect(1);

      let queryParams = this.buildQueryParams({ foo: undefined });

      return this.visit('/').then(() => {
        let expectedURL = this.routerService.urlFor('parent.child', queryParams);

        assert.equal('/child', expectedURL);
      });
    }

    ['@test RouterService#urlFor returns URL for simple route with dynamic segments and basic query params'](assert) {
      assert.expect(1);

      let queryParams = this.buildQueryParams({ foo: 'bar' });

      return this.visit('/').then(() => {
        let expectedURL = this.routerService.urlFor('dynamic', { id: 1 }, queryParams);

        assert.equal('/dynamic/1?foo=bar', expectedURL);
      });
    }

    ['@test RouterService#urlFor returns URL for simple route with dynamic segments and array as query params'](assert) {
      assert.expect(1);

      let queryParams = this.buildQueryParams({
        selectedItems: ['a', 'b', 'c']
      });

      return this.visit('/').then(() => {
        let expectedURL = this.routerService.urlFor('dynamic', { id: 1 }, queryParams);

        assert.equal('/dynamic/1?selectedItems[]=a&selectedItems[]=b&selectedItems[]=c', expectedURL);
      });
    }

    ['@test RouterService#urlFor returns URL for simple route with dynamic segments and null query params'](assert) {
      assert.expect(1);

      let queryParams = this.buildQueryParams({ foo: null });

      return this.visit('/').then(() => {
        let expectedURL = this.routerService.urlFor('dynamic', { id: 1 }, queryParams);

        assert.equal('/dynamic/1', expectedURL);
      });
    }

    ['@test RouterService#urlFor returns URL for simple route with dynamic segments and undefined query params'](assert) {
      assert.expect(1);

      let queryParams = this.buildQueryParams({ foo: undefined });

      return this.visit('/').then(() => {
        let expectedURL = this.routerService.urlFor('dynamic', { id: 1 }, queryParams);

        assert.equal('/dynamic/1', expectedURL);
      });
    }

    ['@test RouterService#urlFor correctly transitions to route via generated path'](assert) {
      assert.expect(1);

      let expectedURL;

      return this.visit('/').then(() => {
        expectedURL = this.routerService.urlFor('parent.child');

        return this.routerService.transitionTo(expectedURL);
      }).then(() => {
        assert.equal(expectedURL, this.routerService.get('currentURL'));
      });
    }

    ['@test RouterService#urlFor correctly transitions to route via generated path with dynamic segments'](assert) {
      assert.expect(1);

      let expectedURL;
      let dynamicModel = { id: 1 };

      this.add('route:dynamic', _routing.Route.extend({
        model() {
          return dynamicModel;
        }
      }));

      return this.visit('/').then(() => {
        expectedURL = this.routerService.urlFor('dynamic', dynamicModel);

        return this.routerService.transitionTo(expectedURL);
      }).then(() => {
        assert.equal(expectedURL, this.routerService.get('currentURL'));
      });
    }

    ['@test RouterService#urlFor correctly transitions to route via generated path with query params'](assert) {
      assert.expect(1);

      let expectedURL;
      let actualURL;
      let queryParams = this.buildQueryParams({ foo: 'bar' });

      return this.visit('/').then(() => {
        expectedURL = this.routerService.urlFor('parent.child', queryParams);

        return this.routerService.transitionTo(expectedURL);
      }).then(() => {
        actualURL = `${this.routerService.get('currentURL')}?foo=bar`;

        assert.equal(expectedURL, actualURL);
      });
    }

    ['@test RouterService#urlFor correctly transitions to route via generated path with dynamic segments and query params'](assert) {
      assert.expect(1);

      let expectedURL;
      let actualURL;
      let queryParams = this.buildQueryParams({ foo: 'bar' });
      let dynamicModel = { id: 1 };

      this.add('route:dynamic', _routing.Route.extend({
        model() {
          return dynamicModel;
        }
      }));

      return this.visit('/').then(() => {
        expectedURL = this.routerService.urlFor('dynamic', dynamicModel, queryParams);

        return this.routerService.transitionTo(expectedURL);
      }).then(() => {
        actualURL = `${this.routerService.get('currentURL')}?foo=bar`;

        assert.equal(expectedURL, actualURL);
      });
    }
  });
});
enifed('ember/tests/routing/substates_test', ['@ember/-internals/runtime', '@ember/-internals/routing', 'internal-test-helpers'], function (_runtime, _routing, _internalTestHelpers) {
  'use strict';

  let counter;

  function step(assert, expectedValue, description) {
    assert.equal(counter, expectedValue, 'Step ' + expectedValue + ': ' + description);
    counter++;
  }

  (0, _internalTestHelpers.moduleFor)('Loading/Error Substates', class extends _internalTestHelpers.ApplicationTestCase {
    constructor() {
      super(...arguments);
      counter = 1;

      this.addTemplate('application', `<div id="app">{{outlet}}</div>`);
      this.addTemplate('index', 'INDEX');
    }

    getController(name) {
      return this.applicationInstance.lookup(`controller:${name}`);
    }

    get currentPath() {
      return this.getController('application').get('currentPath');
    }

    ['@test Slow promise from a child route of application enters nested loading state'](assert) {
      let turtleDeferred = _runtime.RSVP.defer();

      this.router.map(function () {
        this.route('turtle');
      });

      this.add('route:application', _routing.Route.extend({
        setupController() {
          step(assert, 2, 'ApplicationRoute#setupController');
        }
      }));

      this.add('route:turtle', _routing.Route.extend({
        model() {
          step(assert, 1, 'TurtleRoute#model');
          return turtleDeferred.promise;
        }
      }));
      this.addTemplate('turtle', 'TURTLE');
      this.addTemplate('loading', 'LOADING');

      let promise = this.visit('/turtle').then(() => {
        text = this.$('#app').text();
        assert.equal(text, 'TURTLE', `turtle template has loaded and replaced the loading template`);
      });

      let text = this.$('#app').text();
      assert.equal(text, 'LOADING', `The Loading template is nested in application template's outlet`);

      turtleDeferred.resolve();
      return promise;
    }

    [`@test Slow promises returned from ApplicationRoute#model don't enter LoadingRoute`](assert) {
      let appDeferred = _runtime.RSVP.defer();

      this.add('route:application', _routing.Route.extend({
        model() {
          return appDeferred.promise;
        }
      }));
      this.add('route:loading', _routing.Route.extend({
        setupController() {
          assert.ok(false, `shouldn't get here`);
        }
      }));

      let promise = this.visit('/').then(() => {
        let text = this.$('#app').text();

        assert.equal(text, 'INDEX', `index template has been rendered`);
      });

      if (this.element) {
        assert.equal(this.element.textContent, '');
      }

      appDeferred.resolve();

      return promise;
    }

    [`@test Don't enter loading route unless either route or template defined`](assert) {
      let deferred = _runtime.RSVP.defer();

      this.router.map(function () {
        this.route('dummy');
      });
      this.add('route:dummy', _routing.Route.extend({
        model() {
          return deferred.promise;
        }
      }));
      this.addTemplate('dummy', 'DUMMY');

      return this.visit('/').then(() => {
        let promise = this.visit('/dummy').then(() => {
          let text = this.$('#app').text();

          assert.equal(text, 'DUMMY', `dummy template has been rendered`);
        });

        assert.ok(this.currentPath !== 'loading', `
        loading state not entered
      `);
        deferred.resolve();

        return promise;
      });
    }

    ['@test Enter loading route only if loadingRoute is defined'](assert) {
      let deferred = _runtime.RSVP.defer();

      this.router.map(function () {
        this.route('dummy');
      });

      this.add('route:dummy', _routing.Route.extend({
        model() {
          step(assert, 1, 'DummyRoute#model');
          return deferred.promise;
        }
      }));
      this.add('route:loading', _routing.Route.extend({
        setupController() {
          step(assert, 2, 'LoadingRoute#setupController');
        }
      }));
      this.addTemplate('dummy', 'DUMMY');

      return this.visit('/').then(() => {
        let promise = this.visit('/dummy').then(() => {
          let text = this.$('#app').text();

          assert.equal(text, 'DUMMY', `dummy template has been rendered`);
        });

        assert.equal(this.currentPath, 'loading', `loading state entered`);
        deferred.resolve();

        return promise;
      });
    }

    ['@test Slow promises returned from ApplicationRoute#model enter ApplicationLoadingRoute if present'](assert) {
      let appDeferred = _runtime.RSVP.defer();

      this.add('route:application', _routing.Route.extend({
        model() {
          return appDeferred.promise;
        }
      }));
      let loadingRouteEntered = false;
      this.add('route:application_loading', _routing.Route.extend({
        setupController() {
          loadingRouteEntered = true;
        }
      }));

      let promise = this.visit('/').then(() => {
        assert.equal(this.$('#app').text(), 'INDEX', 'index route loaded');
      });
      assert.ok(loadingRouteEntered, 'ApplicationLoadingRoute was entered');
      appDeferred.resolve();

      return promise;
    }

    ['@test Slow promises returned from ApplicationRoute#model enter application_loading if template present'](assert) {
      let appDeferred = _runtime.RSVP.defer();

      this.addTemplate('application_loading', `
      <div id="toplevel-loading">TOPLEVEL LOADING</div>
    `);
      this.add('route:application', _routing.Route.extend({
        model() {
          return appDeferred.promise;
        }
      }));

      let promise = this.visit('/').then(() => {
        let length = this.$('#toplevel-loading').length;
        text = this.$('#app').text();

        assert.equal(length, 0, `top-level loading view has been entirely removed from the DOM`);
        assert.equal(text, 'INDEX', 'index has fully rendered');
      });
      let text = this.$('#toplevel-loading').text();

      assert.equal(text, 'TOPLEVEL LOADING', 'still loading the top level');
      appDeferred.resolve();

      return promise;
    }

    ['@test Prioritized substate entry works with preserved-namespace nested routes'](assert) {
      let deferred = _runtime.RSVP.defer();

      this.addTemplate('foo.bar_loading', 'FOOBAR LOADING');
      this.addTemplate('foo.bar.index', 'YAY');

      this.router.map(function () {
        this.route('foo', function () {
          this.route('bar', { path: '/bar' }, function () {});
        });
      });

      this.add('route:foo.bar', _routing.Route.extend({
        model() {
          return deferred.promise;
        }
      }));

      return this.visit('/').then(() => {
        let promise = this.visit('/foo/bar').then(() => {
          text = this.$('#app').text();

          assert.equal(text, 'YAY', 'foo.bar.index fully loaded');
        });
        let text = this.$('#app').text();

        assert.equal(text, 'FOOBAR LOADING', `foo.bar_loading was entered (as opposed to something like foo/foo/bar_loading)`);
        deferred.resolve();

        return promise;
      });
    }

    ['@test Prioritized substate entry works with reset-namespace nested routes'](assert) {
      let deferred = _runtime.RSVP.defer();

      this.addTemplate('bar_loading', 'BAR LOADING');
      this.addTemplate('bar.index', 'YAY');

      this.router.map(function () {
        this.route('foo', function () {
          this.route('bar', { path: '/bar', resetNamespace: true }, function () {});
        });
      });

      this.add('route:bar', _routing.Route.extend({
        model() {
          return deferred.promise;
        }
      }));

      return this.visit('/').then(() => {
        let promise = this.visit('/foo/bar').then(() => {
          text = this.$('#app').text();

          assert.equal(text, 'YAY', 'bar.index fully loaded');
        });

        let text = this.$('#app').text();

        assert.equal(text, 'BAR LOADING', `foo.bar_loading was entered (as opposed to something likefoo/foo/bar_loading)`);
        deferred.resolve();

        return promise;
      });
    }

    ['@test Prioritized loading substate entry works with preserved-namespace nested routes'](assert) {
      let deferred = _runtime.RSVP.defer();

      this.addTemplate('foo.bar_loading', 'FOOBAR LOADING');
      this.addTemplate('foo.bar', 'YAY');

      this.router.map(function () {
        this.route('foo', function () {
          this.route('bar');
        });
      });

      this.add('route:foo.bar', _routing.Route.extend({
        model() {
          return deferred.promise;
        }
      }));

      let promise = this.visit('/foo/bar').then(() => {
        text = this.$('#app').text();

        assert.equal(text, 'YAY', 'foo.bar has rendered');
      });
      let text = this.$('#app').text();

      assert.equal(text, 'FOOBAR LOADING', `foo.bar_loading was entered (as opposed to something like foo/foo/bar_loading)`);
      deferred.resolve();

      return promise;
    }

    ['@test Prioritized error substate entry works with preserved-namespaec nested routes'](assert) {
      this.addTemplate('foo.bar_error', 'FOOBAR ERROR: {{model.msg}}');
      this.addTemplate('foo.bar', 'YAY');

      this.router.map(function () {
        this.route('foo', function () {
          this.route('bar');
        });
      });

      this.add('route:foo.bar', _routing.Route.extend({
        model() {
          return _runtime.RSVP.reject({
            msg: 'did it broke?'
          });
        }
      }));

      return this.visit('/').then(() => {
        return this.visit('/foo/bar').then(() => {
          let text = this.$('#app').text();
          assert.equal(text, 'FOOBAR ERROR: did it broke?', `foo.bar_error was entered (as opposed to something like foo/foo/bar_error)`);
        });
      });
    }
    ['@test Prioritized loading substate entry works with auto-generated index routes'](assert) {
      let deferred = _runtime.RSVP.defer();
      this.addTemplate('foo.index_loading', 'FOO LOADING');
      this.addTemplate('foo.index', 'YAY');
      this.addTemplate('foo', '{{outlet}}');

      this.router.map(function () {
        this.route('foo', function () {
          this.route('bar');
        });
      });

      this.add('route:foo.index', _routing.Route.extend({
        model() {
          return deferred.promise;
        }
      }));
      this.add('route:foo', _routing.Route.extend({
        model() {
          return true;
        }
      }));

      let promise = this.visit('/foo').then(() => {
        text = this.$('#app').text();

        assert.equal(text, 'YAY', 'foo.index was rendered');
      });
      let text = this.$('#app').text();
      assert.equal(text, 'FOO LOADING', 'foo.index_loading was entered');

      deferred.resolve();

      return promise;
    }

    ['@test Prioritized error substate entry works with auto-generated index routes'](assert) {
      this.addTemplate('foo.index_error', 'FOO ERROR: {{model.msg}}');
      this.addTemplate('foo.index', 'YAY');
      this.addTemplate('foo', '{{outlet}}');

      this.router.map(function () {
        this.route('foo', function () {
          this.route('bar');
        });
      });

      this.add('route:foo.index', _routing.Route.extend({
        model() {
          return _runtime.RSVP.reject({
            msg: 'did it broke?'
          });
        }
      }));
      this.add('route:foo', _routing.Route.extend({
        model() {
          return true;
        }
      }));

      return this.visit('/').then(() => {
        return this.visit('/foo').then(() => {
          let text = this.$('#app').text();

          assert.equal(text, 'FOO ERROR: did it broke?', 'foo.index_error was entered');
        });
      });
    }

    ['@test Rejected promises returned from ApplicationRoute transition into top-level application_error'](assert) {
      let reject = true;

      this.addTemplate('index', '<div id="index">INDEX</div>');
      this.add('route:application', _routing.Route.extend({
        init() {
          this._super(...arguments);
        },
        model() {
          if (reject) {
            return _runtime.RSVP.reject({ msg: 'BAD NEWS BEARS' });
          } else {
            return {};
          }
        }
      }));

      this.addTemplate('application_error', `
      <p id="toplevel-error">TOPLEVEL ERROR: {{model.msg}}</p>
    `);

      return this.visit('/').then(() => {
        let text = this.$('#toplevel-error').text();
        assert.equal(text, 'TOPLEVEL ERROR: BAD NEWS BEARS', 'toplevel error rendered');
        reject = false;
      }).then(() => {
        return this.visit('/');
      }).then(() => {
        let text = this.$('#index').text();
        assert.equal(text, 'INDEX', 'the index route resolved');
      });
    }
  });

  (0, _internalTestHelpers.moduleFor)('Loading/Error Substates - nested routes', class extends _internalTestHelpers.ApplicationTestCase {
    constructor() {
      super(...arguments);

      counter = 1;

      this.addTemplate('application', `<div id="app">{{outlet}}</div>`);
      this.addTemplate('index', 'INDEX');
      this.addTemplate('grandma', 'GRANDMA {{outlet}}');
      this.addTemplate('mom', 'MOM');

      this.router.map(function () {
        this.route('grandma', function () {
          this.route('mom', { resetNamespace: true }, function () {
            this.route('sally');
            this.route('this-route-throws');
          });
          this.route('puppies');
        });
        this.route('memere', { path: '/memere/:seg' }, function () {});
      });

      this.visit('/');
    }

    getController(name) {
      return this.applicationInstance.lookup(`controller:${name}`);
    }

    get currentPath() {
      return this.getController('application').get('currentPath');
    }

    ['@test ApplicationRoute#currentPath reflects loading state path'](assert) {
      let momDeferred = _runtime.RSVP.defer();

      this.addTemplate('grandma.loading', 'GRANDMALOADING');

      this.add('route:mom', _routing.Route.extend({
        model() {
          return momDeferred.promise;
        }
      }));

      let promise = this.visit('/grandma/mom').then(() => {
        text = this.$('#app').text();

        assert.equal(text, 'GRANDMA MOM', `Grandma.mom loaded text is displayed`);
        assert.equal(this.currentPath, 'grandma.mom.index', `currentPath reflects final state`);
      });
      let text = this.$('#app').text();

      assert.equal(text, 'GRANDMA GRANDMALOADING', `Grandma.mom loading text displayed`);

      assert.equal(this.currentPath, 'grandma.loading', `currentPath reflects loading state`);

      momDeferred.resolve();

      return promise;
    }

    [`@test Loading actions bubble to root but don't enter substates above pivot `](assert) {
      let sallyDeferred = _runtime.RSVP.defer();
      let puppiesDeferred = _runtime.RSVP.defer();

      this.add('route:application', _routing.Route.extend({
        actions: {
          loading() {
            assert.ok(true, 'loading action received on ApplicationRoute');
          }
        }
      }));

      this.add('route:mom.sally', _routing.Route.extend({
        model() {
          return sallyDeferred.promise;
        }
      }));

      this.add('route:grandma.puppies', _routing.Route.extend({
        model() {
          return puppiesDeferred.promise;
        }
      }));

      let promise = this.visit('/grandma/mom/sally');
      assert.equal(this.currentPath, 'index', 'Initial route fully loaded');

      sallyDeferred.resolve();

      promise.then(() => {
        assert.equal(this.currentPath, 'grandma.mom.sally', 'transition completed');

        let visit = this.visit('/grandma/puppies');
        assert.equal(this.currentPath, 'grandma.mom.sally', 'still in initial state because the only loading state is above the pivot route');

        return visit;
      }).then(() => {
        this.runTask(() => puppiesDeferred.resolve());

        assert.equal(this.currentPath, 'grandma.puppies', 'Finished transition');
      });

      return promise;
    }

    ['@test Default error event moves into nested route'](assert) {
      this.addTemplate('grandma.error', 'ERROR: {{model.msg}}');

      this.add('route:mom.sally', _routing.Route.extend({
        model() {
          step(assert, 1, 'MomSallyRoute#model');
          return _runtime.RSVP.reject({
            msg: 'did it broke?'
          });
        },
        actions: {
          error() {
            step(assert, 2, 'MomSallyRoute#actions.error');
            return true;
          }
        }
      }));

      return this.visit('/grandma/mom/sally').then(() => {
        step(assert, 3, 'App finished loading');

        let text = this.$('#app').text();

        assert.equal(text, 'GRANDMA ERROR: did it broke?', 'error bubbles');
        assert.equal(this.currentPath, 'grandma.error', 'Initial route fully loaded');
      });
    }

    [`@test Non-bubbled errors that re-throw aren't swallowed`](assert) {
      this.add('route:mom.sally', _routing.Route.extend({
        model() {
          return _runtime.RSVP.reject({
            msg: 'did it broke?'
          });
        },
        actions: {
          error(err) {
            // returns undefined which is falsey
            throw err;
          }
        }
      }));

      assert.throws(() => {
        this.visit('/grandma/mom/sally');
      }, function (err) {
        return err.msg === 'did it broke?';
      }, 'it broke');

      return this.runLoopSettled();
    }

    [`@test Handled errors that re-throw aren't swallowed`](assert) {
      let handledError;

      this.add('route:mom.sally', _routing.Route.extend({
        model() {
          step(assert, 1, 'MomSallyRoute#model');
          return _runtime.RSVP.reject({
            msg: 'did it broke?'
          });
        },
        actions: {
          error(err) {
            step(assert, 2, 'MomSallyRoute#actions.error');
            handledError = err;
            this.transitionTo('mom.this-route-throws');

            return false;
          }
        }
      }));

      this.add('route:mom.this-route-throws', _routing.Route.extend({
        model() {
          step(assert, 3, 'MomThisRouteThrows#model');
          throw handledError;
        }
      }));

      assert.throws(() => {
        this.visit('/grandma/mom/sally');
      }, function (err) {
        return err.msg === 'did it broke?';
      }, `it broke`);

      return this.runLoopSettled();
    }

    ['@test errors that are bubbled are thrown at a higher level if not handled'](assert) {
      this.add('route:mom.sally', _routing.Route.extend({
        model() {
          step(assert, 1, 'MomSallyRoute#model');
          return _runtime.RSVP.reject({
            msg: 'did it broke?'
          });
        },
        actions: {
          error() {
            step(assert, 2, 'MomSallyRoute#actions.error');
            return true;
          }
        }
      }));

      assert.throws(() => {
        this.visit('/grandma/mom/sally');
      }, function (err) {
        return err.msg == 'did it broke?';
      }, 'Correct error was thrown');

      return this.runLoopSettled();
    }

    [`@test Handled errors that are thrown through rejection aren't swallowed`](assert) {
      let handledError;

      this.add('route:mom.sally', _routing.Route.extend({
        model() {
          step(assert, 1, 'MomSallyRoute#model');
          return _runtime.RSVP.reject({
            msg: 'did it broke?'
          });
        },
        actions: {
          error(err) {
            step(assert, 2, 'MomSallyRoute#actions.error');
            handledError = err;
            this.transitionTo('mom.this-route-throws');

            return false;
          }
        }
      }));

      this.add('route:mom.this-route-throws', _routing.Route.extend({
        model() {
          step(assert, 3, 'MomThisRouteThrows#model');
          return _runtime.RSVP.reject(handledError);
        }
      }));

      assert.throws(() => {
        this.visit('/grandma/mom/sally');
      }, function (err) {
        return err.msg === 'did it broke?';
      }, 'it broke');

      return this.runLoopSettled();
    }

    ['@test Default error events move into nested route, prioritizing more specifically named error routes - NEW'](assert) {
      this.addTemplate('grandma.error', 'ERROR: {{model.msg}}');
      this.addTemplate('mom_error', 'MOM ERROR: {{model.msg}}');

      this.add('route:mom.sally', _routing.Route.extend({
        model() {
          step(assert, 1, 'MomSallyRoute#model');
          return _runtime.RSVP.reject({
            msg: 'did it broke?'
          });
        },
        actions: {
          error() {
            step(assert, 2, 'MomSallyRoute#actions.error');
            return true;
          }
        }
      }));

      return this.visit('/grandma/mom/sally').then(() => {
        step(assert, 3, 'Application finished booting');

        assert.equal(this.$('#app').text(), 'GRANDMA MOM ERROR: did it broke?', 'the more specifically named mome error substate was entered over the other error route');

        assert.equal(this.currentPath, 'grandma.mom_error', 'Initial route fully loaded');
      });
    }

    ['@test Slow promises waterfall on startup'](assert) {
      let grandmaDeferred = _runtime.RSVP.defer();
      let sallyDeferred = _runtime.RSVP.defer();

      this.addTemplate('loading', 'LOADING');
      this.addTemplate('mom', 'MOM {{outlet}}');
      this.addTemplate('mom.loading', 'MOMLOADING');
      this.addTemplate('mom.sally', 'SALLY');

      this.add('route:grandma', _routing.Route.extend({
        model() {
          step(assert, 1, 'GrandmaRoute#model');
          return grandmaDeferred.promise;
        }
      }));

      this.add('route:mom', _routing.Route.extend({
        model() {
          step(assert, 2, 'MomRoute#model');
          return {};
        }
      }));

      this.add('route:mom.sally', _routing.Route.extend({
        model() {
          step(assert, 3, 'SallyRoute#model');
          return sallyDeferred.promise;
        },
        setupController() {
          step(assert, 4, 'SallyRoute#setupController');
        }
      }));

      let promise = this.visit('/grandma/mom/sally').then(() => {
        text = this.$('#app').text();

        assert.equal(text, 'GRANDMA MOM SALLY', `Sally template displayed`);
      });
      let text = this.$('#app').text();

      assert.equal(text, 'LOADING', `The loading template is nested in application template's outlet`);

      this.runTask(() => grandmaDeferred.resolve());
      text = this.$('#app').text();

      assert.equal(text, 'GRANDMA MOM MOMLOADING', `Mom's child loading route is displayed due to sally's slow promise`);

      sallyDeferred.resolve();

      return promise;
    }
    ['@test Enter child loading state of pivot route'](assert) {
      let deferred = _runtime.RSVP.defer();
      this.addTemplate('grandma.loading', 'GMONEYLOADING');

      this.add('route:mom.sally', _routing.Route.extend({
        setupController() {
          step(assert, 1, 'SallyRoute#setupController');
        }
      }));

      this.add('route:grandma.puppies', _routing.Route.extend({
        model() {
          return deferred.promise;
        }
      }));

      return this.visit('/grandma/mom/sally').then(() => {
        assert.equal(this.currentPath, 'grandma.mom.sally', 'Initial route fully loaded');

        let promise = this.visit('/grandma/puppies').then(() => {
          assert.equal(this.currentPath, 'grandma.puppies', 'Finished transition');
        });

        assert.equal(this.currentPath, 'grandma.loading', `in pivot route's child loading state`);
        deferred.resolve();

        return promise;
      });
    }

    [`@test Error events that aren't bubbled don't throw application assertions`](assert) {
      this.add('route:mom.sally', _routing.Route.extend({
        model() {
          step(assert, 1, 'MomSallyRoute#model');
          return _runtime.RSVP.reject({
            msg: 'did it broke?'
          });
        },
        actions: {
          error(err) {
            step(assert, 2, 'MomSallyRoute#actions.error');
            assert.equal(err.msg, 'did it broke?', `it didn't break`);
            return false;
          }
        }
      }));

      return this.visit('/grandma/mom/sally');
    }

    ['@test Handled errors that bubble can be handled at a higher level'](assert) {
      let handledError;

      this.add('route:mom', _routing.Route.extend({
        actions: {
          error(err) {
            step(assert, 3, 'MomRoute#actions.error');
            assert.equal(err, handledError, `error handled and rebubbled is handleable at higher route`);
          }
        }
      }));

      this.add('route:mom.sally', _routing.Route.extend({
        model() {
          step(assert, 1, 'MomSallyRoute#model');
          return _runtime.RSVP.reject({
            msg: 'did it broke?'
          });
        },
        actions: {
          error(err) {
            step(assert, 2, 'MomSallyRoute#actions.error');
            handledError = err;

            return true;
          }
        }
      }));

      return this.visit('/grandma/mom/sally');
    }

    ['@test Setting a query param during a slow transition should work'](assert) {
      let deferred = _runtime.RSVP.defer();
      this.addTemplate('memere.loading', 'MMONEYLOADING');

      this.add('route:grandma', _routing.Route.extend({
        beforeModel: function () {
          this.transitionTo('memere', 1);
        }
      }));

      this.add('route:memere', _routing.Route.extend({
        queryParams: {
          test: { defaultValue: 1 }
        }
      }));

      this.add('route:memere.index', _routing.Route.extend({
        model() {
          return deferred.promise;
        }
      }));

      let promise = this.visit('/grandma').then(() => {
        assert.equal(this.currentPath, 'memere.index', 'Transition should be complete');
      });
      let memereController = this.getController('memere');

      assert.equal(this.currentPath, 'memere.loading', 'Initial route should be loading');

      memereController.set('test', 3);

      assert.equal(this.currentPath, 'memere.loading', 'Initial route should still be loading');

      assert.equal(memereController.get('test'), 3, 'Controller query param value should have changed');
      deferred.resolve();

      return promise;
    }
  });
});
enifed('ember/tests/routing/toplevel_dom_test', ['@ember/-internals/environment', 'internal-test-helpers'], function (_environment, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Top Level DOM Structure', class extends _internalTestHelpers.ApplicationTestCase {
    constructor() {
      super(...arguments);
      this._APPLICATION_TEMPLATE_WRAPPER = _environment.ENV._APPLICATION_TEMPLATE_WRAPPER;
    }

    teardown() {
      super.teardown();
      _environment.ENV._APPLICATION_TEMPLATE_WRAPPER = this._APPLICATION_TEMPLATE_WRAPPER;
    }

    ['@test topmost template with wrapper']() {
      _environment.ENV._APPLICATION_TEMPLATE_WRAPPER = true;

      this.addTemplate('application', 'hello world');

      return this.visit('/').then(() => {
        this.assertComponentElement(this.element, { content: 'hello world' });
      });
    }

    ['@test topmost template without wrapper']() {
      _environment.ENV._APPLICATION_TEMPLATE_WRAPPER = false;

      this.addTemplate('application', 'hello world');

      return this.visit('/').then(() => {
        this.assertInnerHTML('hello world');
      });
    }
  });
});
enifed('ember/tests/service_injection_test', ['@ember/-internals/owner', '@ember/controller', '@ember/service', '@ember/-internals/runtime', 'internal-test-helpers', '@ember/-internals/metal'], function (_owner, _controller, _service, _runtime, _internalTestHelpers, _metal) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('Service Injection', class extends _internalTestHelpers.ApplicationTestCase {
    ['@test Service can be injected and is resolved'](assert) {
      this.add('controller:application', _controller.default.extend({
        myService: (0, _service.inject)('my-service')
      }));
      let MyService = _service.default.extend();
      this.add('service:my-service', MyService);
      this.addTemplate('application', '');

      this.visit('/').then(() => {
        let controller = this.applicationInstance.lookup('controller:application');
        assert.ok(controller.get('myService') instanceof MyService);
      });
    }

    ['@test Service can be an object proxy and access owner in init GH#16484'](assert) {
      let serviceOwner;

      this.add('controller:application', _controller.default.extend({
        myService: (0, _service.inject)('my-service')
      }));
      let MyService = _service.default.extend(_runtime._ProxyMixin, {
        init() {
          this._super(...arguments);

          serviceOwner = (0, _owner.getOwner)(this);
        }
      });
      this.add('service:my-service', MyService);
      this.addTemplate('application', '');

      this.visit('/').then(instance => {
        let controller = this.applicationInstance.lookup('controller:application');
        assert.ok(controller.get('myService') instanceof MyService);
        assert.equal(serviceOwner, instance, 'should be able to `getOwner` in init');
      });
    }
  });

  (0, _internalTestHelpers.moduleFor)('Service Injection with ES5 Getters', class extends _internalTestHelpers.ApplicationTestCase {
    ['@test Service can be injected and is resolved without calling `get`'](assert) {
      this.add('controller:application', _controller.default.extend({
        myService: (0, _service.inject)('my-service')
      }));
      let MyService = _service.default.extend({
        name: (0, _metal.computed)(function () {
          return 'The service name';
        })
      });
      this.add('service:my-service', MyService);
      this.addTemplate('application', '');

      this.visit('/').then(() => {
        let controller = this.applicationInstance.lookup('controller:application');
        assert.ok(controller.myService instanceof MyService);
        assert.equal(controller.myService.name, 'The service name', 'service property accessible');
      });
    }
  });

  if (false /* EMBER_MODULE_UNIFICATION */) {
      (0, _internalTestHelpers.moduleFor)('Service Injection (MU)', class extends _internalTestHelpers.ApplicationTestCase {
        ['@test Service can be injected with source and is resolved'](assert) {
          let source = 'controller:src/ui/routes/application/controller';
          this.add('controller:application', _controller.default.extend({
            myService: (0, _service.inject)('my-service', { source })
          }));
          let MyService = _service.default.extend();
          this.add({
            specifier: 'service:my-service',
            source
          }, MyService);

          return this.visit('/').then(() => {
            let controller = this.applicationInstance.lookup('controller:application');

            assert.ok(controller.get('myService') instanceof MyService);
          });
        }

        ['@test Services can be injected with same name, different source, and resolve different instances'](assert) {
          // This test implies that there is a file src/ui/routes/route-a/-services/my-service
          let routeASource = 'controller:src/ui/routes/route-a/controller';
          // This test implies that there is a file src/ui/routes/route-b/-services/my-service
          let routeBSource = 'controller:src/ui/routes/route-b/controller';

          this.add('controller:route-a', _controller.default.extend({
            myService: (0, _service.inject)('my-service', { source: routeASource })
          }));

          this.add('controller:route-b', _controller.default.extend({
            myService: (0, _service.inject)('my-service', { source: routeBSource })
          }));

          let LocalLookupService = _service.default.extend();
          this.add({
            specifier: 'service:my-service',
            source: routeASource
          }, LocalLookupService);

          let MyService = _service.default.extend();
          this.add({
            specifier: 'service:my-service',
            source: routeBSource
          }, MyService);

          return this.visit('/').then(() => {
            let controllerA = this.applicationInstance.lookup('controller:route-a');
            let serviceFromControllerA = controllerA.get('myService');
            assert.ok(serviceFromControllerA instanceof LocalLookupService, 'local lookup service is returned');

            let controllerB = this.applicationInstance.lookup('controller:route-b');
            let serviceFromControllerB = controllerB.get('myService');
            assert.ok(serviceFromControllerB instanceof MyService, 'global service is returned');

            assert.notStrictEqual(serviceFromControllerA, serviceFromControllerB);
          });
        }

        ['@test Services can be injected with same name, different source, but same resolution result, and share an instance'](assert) {
          let routeASource = 'controller:src/ui/routes/route-a/controller';
          let routeBSource = 'controller:src/ui/routes/route-b/controller';

          this.add('controller:route-a', _controller.default.extend({
            myService: (0, _service.inject)('my-service', { source: routeASource })
          }));

          this.add('controller:route-b', _controller.default.extend({
            myService: (0, _service.inject)('my-service', { source: routeBSource })
          }));

          let MyService = _service.default.extend();
          this.add({
            specifier: 'service:my-service'
          }, MyService);

          return this.visit('/').then(() => {
            let controllerA = this.applicationInstance.lookup('controller:route-a');
            let serviceFromControllerA = controllerA.get('myService');
            assert.ok(serviceFromControllerA instanceof MyService);

            let controllerB = this.applicationInstance.lookup('controller:route-b');
            assert.strictEqual(serviceFromControllerA, controllerB.get('myService'));
          });
        }

        /*
        * This test demonstrates a failure in the caching system of ember's
        * container around singletons and and local lookup. The local lookup
        * is cached and the global injection is then looked up incorrectly.
        *
        * The paractical rules of Ember's module unification config are such
        * that services cannot be locally looked up, thus this case is really
        * just a demonstration of what could go wrong if we permit arbitrary
        * configuration (such as a singleton type that has local lookup).
        */
        ['@test Services can be injected with same name, one with source one without, and share an instance'](assert) {
          let routeASource = 'controller:src/ui/routes/route-a/controller';
          this.add('controller:route-a', _controller.default.extend({
            myService: (0, _service.inject)('my-service', { source: routeASource })
          }));

          this.add('controller:route-b', _controller.default.extend({
            myService: (0, _service.inject)('my-service')
          }));

          let MyService = _service.default.extend();
          this.add({
            specifier: 'service:my-service'
          }, MyService);

          return this.visit('/').then(() => {
            let controllerA = this.applicationInstance.lookup('controller:route-a');
            let serviceFromControllerA = controllerA.get('myService');
            assert.ok(serviceFromControllerA instanceof MyService, 'global service is returned');

            let controllerB = this.applicationInstance.lookup('controller:route-b');
            let serviceFromControllerB = controllerB.get('myService');
            assert.ok(serviceFromControllerB instanceof MyService, 'global service is returned');

            assert.strictEqual(serviceFromControllerA, serviceFromControllerB);
          });
        }

        ['@test Service with namespace can be injected and is resolved'](assert) {
          this.add('controller:application', _controller.default.extend({
            myService: (0, _service.inject)('my-namespace::my-service')
          }));
          let MyService = _service.default.extend();
          this.add({
            specifier: 'service:my-service',
            namespace: 'my-namespace'
          }, MyService);

          this.visit('/').then(() => {
            let controller = this.applicationInstance.lookup('controller:application');
            assert.ok(controller.get('myService') instanceof MyService);
          });
        }
      });
    }
});
enifed('ember/tests/view_instrumentation_test', ['@ember/instrumentation', 'internal-test-helpers'], function (_instrumentation, _internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('View Instrumentation', class extends _internalTestHelpers.ApplicationTestCase {
    constructor() {
      super();
      this.addTemplate('application', `{{outlet}}`);
      this.addTemplate('index', `<h1>Index</h1>`);
      this.addTemplate('posts', `<h1>Posts</h1>`);

      this.router.map(function () {
        this.route('posts');
      });
    }
    teardown() {
      (0, _instrumentation.reset)();
      super.teardown();
    }

    ['@test Nodes without view instances are instrumented'](assert) {
      let called = false;

      (0, _instrumentation.subscribe)('render', {
        before() {
          called = true;
        },
        after() {}
      });

      return this.visit('/').then(() => {
        assert.equal(this.textValue(), 'Index', 'It rendered the correct template');

        assert.ok(called, 'Instrumentation called on first render');
        called = false;

        return this.visit('/posts');
      }).then(() => {
        assert.equal(this.textValue(), 'Posts', 'It rendered the correct template');
        assert.ok(called, 'Instrumentation called on transition to non-view backed route');
      });
    }
  });
});
enifed('internal-test-helpers/index', ['exports', 'internal-test-helpers/lib/factory', 'internal-test-helpers/lib/build-owner', 'internal-test-helpers/lib/confirm-export', 'internal-test-helpers/lib/equal-inner-html', 'internal-test-helpers/lib/equal-tokens', 'internal-test-helpers/lib/module-for', 'internal-test-helpers/lib/strip', 'internal-test-helpers/lib/apply-mixins', 'internal-test-helpers/lib/get-text-of', 'internal-test-helpers/lib/matchers', 'internal-test-helpers/lib/run', 'internal-test-helpers/lib/test-cases/abstract', 'internal-test-helpers/lib/test-cases/abstract-application', 'internal-test-helpers/lib/test-cases/application', 'internal-test-helpers/lib/test-cases/query-param', 'internal-test-helpers/lib/test-cases/abstract-rendering', 'internal-test-helpers/lib/test-cases/rendering', 'internal-test-helpers/lib/test-cases/router', 'internal-test-helpers/lib/test-cases/autoboot-application', 'internal-test-helpers/lib/test-cases/default-resolver-application', 'internal-test-helpers/lib/test-resolver', 'internal-test-helpers/lib/browser-detect', 'internal-test-helpers/lib/registry-check'], function (exports, _factory, _buildOwner, _confirmExport, _equalInnerHtml, _equalTokens, _moduleFor, _strip, _applyMixins, _getTextOf, _matchers, _run, _abstract, _abstractApplication, _application, _queryParam, _abstractRendering, _rendering, _router, _autobootApplication, _defaultResolverApplication, _testResolver, _browserDetect, _registryCheck) {
  'use strict';

  Object.defineProperty(exports, 'factory', {
    enumerable: true,
    get: function () {
      return _factory.default;
    }
  });
  Object.defineProperty(exports, 'buildOwner', {
    enumerable: true,
    get: function () {
      return _buildOwner.default;
    }
  });
  Object.defineProperty(exports, 'confirmExport', {
    enumerable: true,
    get: function () {
      return _confirmExport.default;
    }
  });
  Object.defineProperty(exports, 'equalInnerHTML', {
    enumerable: true,
    get: function () {
      return _equalInnerHtml.default;
    }
  });
  Object.defineProperty(exports, 'equalTokens', {
    enumerable: true,
    get: function () {
      return _equalTokens.default;
    }
  });
  Object.defineProperty(exports, 'moduleFor', {
    enumerable: true,
    get: function () {
      return _moduleFor.default;
    }
  });
  Object.defineProperty(exports, 'strip', {
    enumerable: true,
    get: function () {
      return _strip.default;
    }
  });
  Object.defineProperty(exports, 'applyMixins', {
    enumerable: true,
    get: function () {
      return _applyMixins.default;
    }
  });
  Object.defineProperty(exports, 'getTextOf', {
    enumerable: true,
    get: function () {
      return _getTextOf.default;
    }
  });
  Object.defineProperty(exports, 'equalsElement', {
    enumerable: true,
    get: function () {
      return _matchers.equalsElement;
    }
  });
  Object.defineProperty(exports, 'classes', {
    enumerable: true,
    get: function () {
      return _matchers.classes;
    }
  });
  Object.defineProperty(exports, 'styles', {
    enumerable: true,
    get: function () {
      return _matchers.styles;
    }
  });
  Object.defineProperty(exports, 'regex', {
    enumerable: true,
    get: function () {
      return _matchers.regex;
    }
  });
  Object.defineProperty(exports, 'runAppend', {
    enumerable: true,
    get: function () {
      return _run.runAppend;
    }
  });
  Object.defineProperty(exports, 'runDestroy', {
    enumerable: true,
    get: function () {
      return _run.runDestroy;
    }
  });
  Object.defineProperty(exports, 'AbstractTestCase', {
    enumerable: true,
    get: function () {
      return _abstract.default;
    }
  });
  Object.defineProperty(exports, 'AbstractApplicationTestCase', {
    enumerable: true,
    get: function () {
      return _abstractApplication.default;
    }
  });
  Object.defineProperty(exports, 'ApplicationTestCase', {
    enumerable: true,
    get: function () {
      return _application.default;
    }
  });
  Object.defineProperty(exports, 'QueryParamTestCase', {
    enumerable: true,
    get: function () {
      return _queryParam.default;
    }
  });
  Object.defineProperty(exports, 'AbstractRenderingTestCase', {
    enumerable: true,
    get: function () {
      return _abstractRendering.default;
    }
  });
  Object.defineProperty(exports, 'RenderingTestCase', {
    enumerable: true,
    get: function () {
      return _rendering.default;
    }
  });
  Object.defineProperty(exports, 'RouterTestCase', {
    enumerable: true,
    get: function () {
      return _router.default;
    }
  });
  Object.defineProperty(exports, 'AutobootApplicationTestCase', {
    enumerable: true,
    get: function () {
      return _autobootApplication.default;
    }
  });
  Object.defineProperty(exports, 'DefaultResolverApplicationTestCase', {
    enumerable: true,
    get: function () {
      return _defaultResolverApplication.default;
    }
  });
  Object.defineProperty(exports, 'TestResolver', {
    enumerable: true,
    get: function () {
      return _testResolver.default;
    }
  });
  Object.defineProperty(exports, 'ModuleBasedTestResolver', {
    enumerable: true,
    get: function () {
      return _testResolver.ModuleBasedResolver;
    }
  });
  Object.defineProperty(exports, 'isIE11', {
    enumerable: true,
    get: function () {
      return _browserDetect.isIE11;
    }
  });
  Object.defineProperty(exports, 'isEdge', {
    enumerable: true,
    get: function () {
      return _browserDetect.isEdge;
    }
  });
  Object.defineProperty(exports, 'verifyInjection', {
    enumerable: true,
    get: function () {
      return _registryCheck.verifyInjection;
    }
  });
  Object.defineProperty(exports, 'verifyRegistration', {
    enumerable: true,
    get: function () {
      return _registryCheck.verifyRegistration;
    }
  });
});
enifed('internal-test-helpers/lib/apply-mixins', ['exports', '@ember/polyfills', 'internal-test-helpers/lib/get-all-property-names'], function (exports, _polyfills, _getAllPropertyNames) {
  'use strict';

  exports.default = applyMixins;


  function isGenerator(mixin) {
    return Array.isArray(mixin.cases) && typeof mixin.generate === 'function';
  }

  function applyMixins(TestClass, ...mixins) {
    mixins.forEach(mixinOrGenerator => {
      let mixin;

      if (isGenerator(mixinOrGenerator)) {
        let generator = mixinOrGenerator;
        mixin = {};

        generator.cases.forEach((value, idx) => {
          (0, _polyfills.assign)(mixin, generator.generate(value, idx));
        });

        (0, _polyfills.assign)(TestClass.prototype, mixin);
      } else if (typeof mixinOrGenerator === 'function') {
        let properties = (0, _getAllPropertyNames.default)(mixinOrGenerator);
        mixin = new mixinOrGenerator();

        properties.forEach(name => {
          TestClass.prototype[name] = function () {
            return mixin[name].apply(mixin, arguments);
          };
        });
      } else {
        mixin = mixinOrGenerator;
        (0, _polyfills.assign)(TestClass.prototype, mixin);
      }
    });

    return TestClass;
  }
});
enifed('internal-test-helpers/lib/browser-detect', ['exports'], function (exports) {
  'use strict';

  // `window.ActiveXObject` is "falsey" in IE11 (but not `undefined` or `false`)
  // `"ActiveXObject" in window` returns `true` in all IE versions
  // only IE11 will pass _both_ of these conditions
  const isIE11 = exports.isIE11 = !window.ActiveXObject && 'ActiveXObject' in window;
  const isEdge = exports.isEdge = /Edge/.test(navigator.userAgent);
});
enifed('internal-test-helpers/lib/build-owner', ['exports', '@ember/-internals/container', '@ember/-internals/routing', '@ember/application/instance', '@ember/application', '@ember/-internals/runtime'], function (exports, _container, _routing, _instance, _application, _runtime) {
  'use strict';

  exports.default = buildOwner;


  class ResolverWrapper {
    constructor(resolver) {
      this.resolver = resolver;
    }

    create() {
      return this.resolver;
    }
  }

  function buildOwner(options = {}) {
    let ownerOptions = options.ownerOptions || {};
    let resolver = options.resolver;
    let bootOptions = options.bootOptions || {};

    let Owner = _runtime.Object.extend(_runtime.RegistryProxyMixin, _runtime.ContainerProxyMixin);

    let namespace = _runtime.Object.create({
      Resolver: new ResolverWrapper(resolver)
    });

    let fallbackRegistry = _application.default.buildRegistry(namespace);
    fallbackRegistry.register('router:main', _routing.Router);

    let registry = new _container.Registry({
      fallback: fallbackRegistry
    });

    _instance.default.setupRegistry(registry, bootOptions);

    let owner = Owner.create({
      __registry__: registry,
      __container__: null
    }, ownerOptions);

    let container = registry.container({ owner });
    owner.__container__ = container;

    return owner;
  }
});
enifed('internal-test-helpers/lib/confirm-export', ['exports', 'require'], function (exports, _require2) {
  'use strict';

  exports.default = confirmExport;


  function getDescriptor(obj, path) {
    let parts = path.split('.');
    let value = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      let part = parts[i];
      value = value[part];
      if (!value) {
        return undefined;
      }
    }
    let last = parts[parts.length - 1];
    return Object.getOwnPropertyDescriptor(value, last);
  }

  function confirmExport(Ember, assert, path, moduleId, exportName) {
    try {
      let desc = getDescriptor(Ember, path);
      assert.ok(desc, `the ${path} property exists on the Ember global`);

      if (typeof exportName === 'string') {
        let mod = (0, _require2.default)(moduleId);
        assert.equal(desc.value, mod[exportName], `Ember.${path} is exported correctly`);
        assert.notEqual(mod[exportName], undefined, `Ember.${path} is not \`undefined\``);
      } else if ('value' in desc) {
        assert.equal(desc.value, exportName.value, `Ember.${path} is exported correctly`);
      } else {
        let mod = (0, _require2.default)(moduleId);
        assert.equal(desc.get, mod[exportName.get], `Ember.${path} getter is exported correctly`);
        assert.notEqual(desc.get, undefined, `Ember.${path} getter is not undefined`);

        if (exportName.set) {
          assert.equal(desc.set, mod[exportName.set], `Ember.${path} setter is exported correctly`);
          assert.notEqual(desc.set, undefined, `Ember.${path} setter is not undefined`);
        }
      }
    } catch (error) {
      assert.pushResult({
        result: false,
        message: `An error occured while testing ${path} is exported from ${moduleId}.`,
        source: error
      });
    }
  }
});
enifed('internal-test-helpers/lib/ember-dev/assertion', ['exports', 'internal-test-helpers/lib/ember-dev/utils'], function (exports, _utils) {
    'use strict';

    const BREAK = {};
    /*
      This assertion class is used to test assertions made using Ember.assert.
      It injects two helpers onto `window`:
    
      - expectAssertion(func: Function, [expectedMessage: String | RegExp])
    
      This function calls `func` and asserts that `Ember.assert` is invoked during
      the execution. Moreover, it takes a String or a RegExp as a second optional
      argument that can be used to test if a specific assertion message was
      generated.
    
      - ignoreAssertion(func: Function)
    
      This function calls `func` and disables `Ember.assert` during the execution.
      In particular, this prevents `Ember.assert` from throw errors that would
      disrupt the control flow.
    */
    class AssertionAssert {
        constructor(env) {
            this.env = env;
        }
        reset() {}
        assert() {}
        inject() {
            let expectAssertion = (func, expectedMessage) => {
                let { assert } = QUnit.config.current;
                if (this.env.runningProdBuild) {
                    assert.ok(true, 'Assertions disabled in production builds.');
                    return;
                }
                let sawCall = false;
                let actualMessage = undefined;
                // The try-catch statement is used to "exit" `func` as soon as
                // the first useful assertion has been produced.
                try {
                    (0, _utils.callWithStub)(this.env, 'assert', func, (message, test) => {
                        sawCall = true;
                        if ((0, _utils.checkTest)(test)) {
                            return;
                        }
                        actualMessage = message;
                        throw BREAK;
                    });
                } catch (e) {
                    if (e !== BREAK) {
                        throw e;
                    }
                }
                check(assert, sawCall, actualMessage, expectedMessage);
            };
            let ignoreAssertion = func => {
                (0, _utils.callWithStub)(this.env, 'assert', func);
            };
            window.expectAssertion = expectAssertion;
            window.ignoreAssertion = ignoreAssertion;
        }
        restore() {
            window.expectAssertion = null;
            window.ignoreAssertion = null;
        }
    }
    exports.default = AssertionAssert;
    function check(assert, sawCall, actualMessage, expectedMessage) {
        // Run assertions in an order that is useful when debugging a test failure.
        if (!sawCall) {
            assert.ok(false, `Expected Ember.assert to be called (Not called with any value).`);
        } else if (!actualMessage) {
            assert.ok(false, `Expected a failing Ember.assert (Ember.assert called, but without a failing test).`);
        } else {
            if (expectedMessage) {
                if (expectedMessage instanceof RegExp) {
                    assert.ok(expectedMessage.test(actualMessage), `Expected failing Ember.assert: '${expectedMessage}', but got '${actualMessage}'.`);
                } else {
                    assert.equal(actualMessage, expectedMessage, `Expected failing Ember.assert: '${expectedMessage}', but got '${actualMessage}'.`);
                }
            } else {
                // Positive assertion that assert was called
                assert.ok(true, 'Expected a failing Ember.assert.');
            }
        }
    }
});
enifed('internal-test-helpers/lib/ember-dev/containers', ['exports', '@ember/-internals/container'], function (exports, _container) {
  'use strict';

  function ContainersAssert(env) {
    this.env = env;
  }

  const { _leakTracking: containerLeakTracking } = _container.Container;

  ContainersAssert.prototype = {
    reset: function () {},
    inject: function () {},
    assert: function () {
      if (containerLeakTracking === undefined) return;
      let { config } = QUnit;
      let { testName, testId, module: { name: moduleName }, finish: originalFinish } = config.current;
      config.current.finish = function () {
        originalFinish.call(this);
        originalFinish = undefined;
        config.queue.unshift(function () {
          if (containerLeakTracking.hasContainers()) {
            containerLeakTracking.reset();
            // eslint-disable-next-line no-console
            console.assert(false, `Leaked container after test ${moduleName}: ${testName} testId=${testId}`);
          }
        });
      };
    },
    restore: function () {}
  };

  exports.default = ContainersAssert;
});
enifed('internal-test-helpers/lib/ember-dev/debug', ['exports', 'internal-test-helpers/lib/ember-dev/method-call-tracker'], function (exports, _methodCallTracker) {
    'use strict';

    class DebugAssert {
        constructor(methodName, env) {
            this.methodName = methodName;
            this.env = env;
            this.tracker = null;
        }
        inject() {}
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
        runExpectation(func, callback) {
            let originalTracker = null;
            // When helpers are passed a callback, they get a new tracker context
            if (func) {
                originalTracker = this.tracker;
                this.tracker = null;
            }
            if (!this.tracker) {
                this.tracker = new _methodCallTracker.default(this.env, this.methodName);
            }
            // Yield to caller with tracker instance
            callback(this.tracker);
            // Once the given callback is invoked, the pending assertions should be
            // flushed immediately
            if (func) {
                func();
                this.assert();
                this.reset();
                this.tracker = originalTracker;
            }
        }
    }
    exports.default = DebugAssert;
});
enifed('internal-test-helpers/lib/ember-dev/deprecation', ['exports', 'internal-test-helpers/lib/ember-dev/debug', 'internal-test-helpers/lib/ember-dev/utils'], function (exports, _debug, _utils) {
    'use strict';

    class DeprecationAssert extends _debug.default {
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
                } else {
                    actualFunc = func;
                }
                this.runExpectation(actualFunc, tracker => {
                    if (tracker.isExpectingNoCalls()) {
                        throw new Error('expectDeprecation was called after expectNoDeprecation was called!');
                    }
                    tracker.expectCall(message, ['id', 'until']);
                });
            };
            let ignoreDeprecation = func => {
                (0, _utils.callWithStub)(this.env, 'deprecate', func);
            };
            window.expectNoDeprecation = expectNoDeprecation;
            window.expectDeprecation = expectDeprecation;
            window.ignoreDeprecation = ignoreDeprecation;
        }
        restore() {
            super.restore();
            window.expectDeprecation = null;
            window.expectNoDeprecation = null;
            window.ignoreDeprecation = null;
        }
    }
    exports.default = DeprecationAssert;
});
enifed('internal-test-helpers/lib/ember-dev/index', ['exports', 'internal-test-helpers/lib/ember-dev/deprecation', 'internal-test-helpers/lib/ember-dev/warning', 'internal-test-helpers/lib/ember-dev/assertion', 'internal-test-helpers/lib/ember-dev/run-loop', 'internal-test-helpers/lib/ember-dev/namespaces', 'internal-test-helpers/lib/ember-dev/containers', 'internal-test-helpers/lib/ember-dev/utils'], function (exports, _deprecation, _warning, _assertion, _runLoop, _namespaces, _containers, _utils) {
  'use strict';

  var EmberDevTestHelperAssert = (0, _utils.buildCompositeAssert)([_deprecation.default, _warning.default, _assertion.default, _runLoop.default, _namespaces.default, _containers.default]);

  exports.default = EmberDevTestHelperAssert;
});
enifed('internal-test-helpers/lib/ember-dev/method-call-tracker', ['exports', 'internal-test-helpers/lib/ember-dev/utils'], function (exports, _utils) {
    'use strict';

    class MethodCallTracker {
        constructor(env, methodName) {
            this._env = env;
            this._methodName = methodName;
            this._isExpectingNoCalls = false;
            this._expectedMessages = [];
            this._expectedOptionLists = [];
            this._actuals = [];
            this._originalMethod = undefined;
        }
        stubMethod() {
            if (this._originalMethod) {
                // Method is already stubbed
                return;
            }
            let env = this._env;
            let methodName = this._methodName;
            this._originalMethod = env.getDebugFunction(methodName);
            env.setDebugFunction(methodName, (message, test, options) => {
                let resultOfTest = (0, _utils.checkTest)(test);
                this._actuals.push([message, resultOfTest, options]);
            });
        }
        restoreMethod() {
            if (this._originalMethod) {
                this._env.setDebugFunction(this._methodName, this._originalMethod);
            }
        }
        expectCall(message, options) {
            this.stubMethod();
            this._expectedMessages.push(message || /.*/);
            this._expectedOptionLists.push(options);
        }
        expectNoCalls() {
            this.stubMethod();
            this._isExpectingNoCalls = true;
        }
        isExpectingNoCalls() {
            return this._isExpectingNoCalls;
        }
        isExpectingCalls() {
            return !this._isExpectingNoCalls && this._expectedMessages.length;
        }
        assert() {
            let { assert } = QUnit.config.current;
            let env = this._env;
            let methodName = this._methodName;
            let isExpectingNoCalls = this._isExpectingNoCalls;
            let expectedMessages = this._expectedMessages;
            let expectedOptionLists = this._expectedOptionLists;
            let actuals = this._actuals;
            let o, i, j;
            if (!isExpectingNoCalls && expectedMessages.length === 0 && actuals.length === 0) {
                return;
            }
            if (env.runningProdBuild) {
                assert.ok(true, `calls to Ember.${methodName} disabled in production builds.`);
                return;
            }
            if (isExpectingNoCalls) {
                let actualMessages = [];
                for (i = 0; i < actuals.length; i++) {
                    if (!actuals[i][1]) {
                        actualMessages.push(actuals[i][0]);
                    }
                }
                assert.ok(actualMessages.length === 0, `Expected no Ember.${methodName} calls, got ${actuals.length}: ${actualMessages.join(', ')}`);
                return;
            }
            let actual;
            let match = undefined;
            for (o = 0; o < expectedMessages.length; o++) {
                const expectedMessage = expectedMessages[o];
                const expectedOptionList = expectedOptionLists[o];
                for (i = 0; i < actuals.length; i++) {
                    let matchesMessage = false;
                    let matchesOptionList = false;
                    actual = actuals[i];
                    if (actual[1] === true) {
                        continue;
                    }
                    if (expectedMessage instanceof RegExp && expectedMessage.test(actual[0])) {
                        matchesMessage = true;
                    } else if (expectedMessage === actual[0]) {
                        matchesMessage = true;
                    }
                    if (expectedOptionList === undefined) {
                        matchesOptionList = true;
                    } else if (actual[2]) {
                        matchesOptionList = true;
                        for (j = 0; j < expectedOptionList.length; j++) {
                            matchesOptionList = matchesOptionList && actual[2].hasOwnProperty(expectedOptionList[j]);
                        }
                    }
                    if (matchesMessage && matchesOptionList) {
                        match = actual;
                        break;
                    }
                }
                const expectedOptionsMessage = expectedOptionList ? `and options: { ${expectedOptionList.join(', ')} }` : 'and no options';
                const actualOptionsMessage = actual && actual[2] ? `and options: { ${Object.keys(actual[2]).join(', ')} }` : 'and no options';
                if (!actual) {
                    assert.ok(false, `Received no Ember.${methodName} calls at all, expecting: ${expectedMessage}`);
                } else if (match && !match[1]) {
                    assert.ok(true, `Received failing Ember.${methodName} call with message: ${match[0]}`);
                } else if (match && match[1]) {
                    assert.ok(false, `Expected failing Ember.${methodName} call, got succeeding with message: ${match[0]}`);
                } else if (actual[1]) {
                    assert.ok(false, `Did not receive failing Ember.${methodName} call matching '${expectedMessage}' ${expectedOptionsMessage}, last was success with '${actual[0]}' ${actualOptionsMessage}`);
                } else if (!actual[1]) {
                    assert.ok(false, `Did not receive failing Ember.${methodName} call matching '${expectedMessage}' ${expectedOptionsMessage}, last was failure with '${actual[0]}' ${actualOptionsMessage}`);
                }
            }
        }
    }
    exports.default = MethodCallTracker;
});
enifed('internal-test-helpers/lib/ember-dev/namespaces', ['exports', '@ember/runloop', '@ember/-internals/metal'], function (exports, _runloop, _metal) {
  'use strict';

  function NamespacesAssert(env) {
    this.env = env;
  }

  NamespacesAssert.prototype = {
    reset: function () {},
    inject: function () {},
    assert: function () {
      let { assert } = QUnit.config.current;

      if (_metal.NAMESPACES.length > 0) {
        assert.ok(false, 'Should not have any NAMESPACES after tests');
        (0, _runloop.run)(() => {
          let namespaces = _metal.NAMESPACES.slice();
          for (let i = 0; i < namespaces.length; i++) {
            namespaces[i].destroy();
          }
        });
      }
      let keys = Object.keys(_metal.NAMESPACES_BY_ID);
      if (keys.length > 0) {
        assert.ok(false, 'Should not have any NAMESPACES_BY_ID after tests');
        for (let i = 0; i < keys.length; i++) {
          delete _metal.NAMESPACES_BY_ID[keys[i]];
        }
      }
    },
    restore: function () {}
  };

  exports.default = NamespacesAssert;
});
enifed('internal-test-helpers/lib/ember-dev/run-loop', ['exports', '@ember/runloop'], function (exports, _runloop) {
  'use strict';

  function RunLoopAssertion(env) {
    this.env = env;
  }

  RunLoopAssertion.prototype = {
    reset: function () {},
    inject: function () {},
    assert: function () {
      let { assert } = QUnit.config.current;

      if ((0, _runloop.getCurrentRunLoop)()) {
        assert.ok(false, 'Should not be in a run loop at end of test');
        while ((0, _runloop.getCurrentRunLoop)()) {
          (0, _runloop.end)();
        }
      }

      if ((0, _runloop.hasScheduledTimers)()) {
        assert.ok(false, 'Ember run should not have scheduled timers at end of test');
        (0, _runloop.cancelTimers)();
      }
    },
    restore: function () {}
  };

  exports.default = RunLoopAssertion;
});
enifed("internal-test-helpers/lib/ember-dev/setup-qunit", ["exports"], function (exports) {
    "use strict";

    exports.default = setupQUnit;
    function setupQUnit(assertion, _qunitGlobal) {
        let qunitGlobal = QUnit;
        if (_qunitGlobal) {
            qunitGlobal = _qunitGlobal;
        }
        let originalModule = qunitGlobal.module;
        qunitGlobal.module = function (name, _options) {
            let options = _options || {};
            let originalSetup = options.setup || options.beforeEach || function () {};
            let originalTeardown = options.teardown || options.afterEach || function () {};
            delete options.setup;
            delete options.teardown;
            options.beforeEach = function () {
                assertion.reset();
                assertion.inject();
                return originalSetup.apply(this, arguments);
            };
            options.afterEach = function () {
                let result = originalTeardown.apply(this, arguments);
                assertion.assert();
                assertion.restore();
                return result;
            };
            return originalModule(name, options);
        };
    }
});
enifed('internal-test-helpers/lib/ember-dev/utils', ['exports'], function (exports) {
    'use strict';

    exports.buildCompositeAssert = buildCompositeAssert;
    exports.callWithStub = callWithStub;
    exports.checkTest = checkTest;
    function callForEach(prop, func) {
        return function () {
            for (let i = 0, l = this[prop].length; i < l; i++) {
                this[prop][i][func]();
            }
        };
    }
    function buildCompositeAssert(assertClasses) {
        function Composite(env) {
            this.asserts = assertClasses.map(Assert => new Assert(env));
        }
        Composite.prototype = {
            reset: callForEach('asserts', 'reset'),
            inject: callForEach('asserts', 'inject'),
            assert: callForEach('asserts', 'assert'),
            restore: callForEach('asserts', 'restore')
        };
        return Composite;
    }
    function noop() {}
    function callWithStub(env, name, func, debugStub = noop) {
        let originalFunc = env.getDebugFunction(name);
        try {
            env.setDebugFunction(name, debugStub);
            func();
        } finally {
            env.setDebugFunction(name, originalFunc);
        }
    }
    function checkTest(test) {
        return typeof test === 'function' ? test() : test;
    }
});
enifed('internal-test-helpers/lib/ember-dev/warning', ['exports', 'internal-test-helpers/lib/ember-dev/debug', 'internal-test-helpers/lib/ember-dev/utils'], function (exports, _debug, _utils) {
    'use strict';

    class WarningAssert extends _debug.default {
        constructor(env) {
            super('warn', env);
        }
        inject() {
            // Expects no warning to happen within a function, or if no function is
            // passed, from the time of calling until the end of the test.
            //
            // expectNoWarning(function() {
            //   fancyNewThing();
            // });
            //
            // expectNoWarning();
            // Ember.warn("Oh snap, didn't expect that");
            //
            let expectNoWarning = func => {
                if (typeof func !== 'function') {
                    func = undefined;
                }
                this.runExpectation(func, tracker => {
                    if (tracker.isExpectingCalls()) {
                        throw new Error('expectNoWarning was called after expectWarning was called!');
                    }
                    tracker.expectNoCalls();
                });
            };
            // Expect a warning to happen within a function, or if no function is
            // passed, from the time of calling until the end of the test. Can be called
            // multiple times to assert warnings with different specific messages
            // happened.
            //
            // expectWarning(function() {
            //   Ember.warn("Times they are a-changin'");
            // }, /* optionalStringOrRegex */);
            //
            // expectWarning(/* optionalStringOrRegex */);
            // Ember.warn("Times definitely be changin'");
            //
            let expectWarning = (func, message) => {
                let actualFunc;
                if (typeof func !== 'function') {
                    message = func;
                    actualFunc = undefined;
                } else {
                    actualFunc = func;
                }
                this.runExpectation(actualFunc, tracker => {
                    if (tracker.isExpectingNoCalls()) {
                        throw new Error('expectWarning was called after expectNoWarning was called!');
                    }
                    tracker.expectCall(message);
                });
            };
            let ignoreWarning = func => {
                (0, _utils.callWithStub)(this.env, 'warn', func);
            };
            window.expectNoWarning = expectNoWarning;
            window.expectWarning = expectWarning;
            window.ignoreWarning = ignoreWarning;
        }
        restore() {
            super.restore();
            window.expectWarning = null;
            window.expectNoWarning = null;
            window.ignoreWarning = null;
        }
    }
    exports.default = WarningAssert;
});
enifed('internal-test-helpers/lib/equal-inner-html', ['exports'], function (exports) {
  'use strict';

  exports.default = equalInnerHTML;
  // detect side-effects of cloning svg elements in IE9-11
  let ieSVGInnerHTML = (() => {
    if (!document.createElementNS) {
      return false;
    }
    let div = document.createElement('div');
    let node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    div.appendChild(node);
    let clone = div.cloneNode(true);
    return clone.innerHTML === '<svg xmlns="http://www.w3.org/2000/svg" />';
  })();

  function normalizeInnerHTML(actualHTML) {
    if (ieSVGInnerHTML) {
      // Replace `<svg xmlns="http://www.w3.org/2000/svg" height="50%" />` with `<svg height="50%"></svg>`, etc.
      // drop namespace attribute
      // replace self-closing elements
      actualHTML = actualHTML.replace(/ xmlns="[^"]+"/, '').replace(/<([^ >]+) [^\/>]*\/>/gi, (tag, tagName) => `${tag.slice(0, tag.length - 3)}></${tagName}>`);
    }

    return actualHTML;
  }

  function equalInnerHTML(assert, fragment, html) {
    let actualHTML = normalizeInnerHTML(fragment.innerHTML);

    assert.pushResult({
      result: actualHTML === html,
      actual: actualHTML,
      expected: html
    });
  }
});
enifed('internal-test-helpers/lib/equal-tokens', ['exports', 'simple-html-tokenizer'], function (exports, _simpleHtmlTokenizer) {
  'use strict';

  exports.default = equalTokens;


  function generateTokens(containerOrHTML) {
    if (typeof containerOrHTML === 'string') {
      return {
        tokens: (0, _simpleHtmlTokenizer.tokenize)(containerOrHTML),
        html: containerOrHTML
      };
    } else {
      return {
        tokens: (0, _simpleHtmlTokenizer.tokenize)(containerOrHTML.innerHTML),
        html: containerOrHTML.innerHTML
      };
    }
  }

  function normalizeTokens(tokens) {
    tokens.forEach(token => {
      if (token.type === 'StartTag') {
        token.attributes = token.attributes.sort((a, b) => {
          if (a[0] > b[0]) {
            return 1;
          }
          if (a[0] < b[0]) {
            return -1;
          }
          return 0;
        });
      }
    });
  }

  function equalTokens(actualContainer, expectedHTML, message = null) {
    let actual = generateTokens(actualContainer);
    let expected = generateTokens(expectedHTML);

    normalizeTokens(actual.tokens);
    normalizeTokens(expected.tokens);

    let { assert } = QUnit.config.current;
    let equiv = QUnit.equiv(actual.tokens, expected.tokens);

    if (equiv && expected.html !== actual.html) {
      assert.deepEqual(actual.tokens, expected.tokens, message);
    } else {
      assert.pushResult({
        result: QUnit.equiv(actual.tokens, expected.tokens),
        actual: actual.html,
        expected: expected.html,
        message
      });
    }
  }
});
enifed('internal-test-helpers/lib/factory', ['exports'], function (exports) {
  'use strict';

  exports.default = factory;
  function setProperties(object, properties) {
    for (let key in properties) {
      if (properties.hasOwnProperty(key)) {
        object[key] = properties[key];
      }
    }
  }

  let guids = 0;

  function factory() {
    function Klass(options) {
      setProperties(this, options);
      this._guid = guids++;
      this.isDestroyed = false;
    }

    Klass.prototype.constructor = Klass;
    Klass.prototype.destroy = function () {
      this.isDestroyed = true;
    };

    Klass.prototype.toString = function () {
      return '<Factory:' + this._guid + '>';
    };

    Klass.create = create;
    Klass.extend = extend;
    Klass.reopen = extend;
    Klass.reopenClass = reopenClass;

    return Klass;

    function create(options) {
      return new this.prototype.constructor(options);
    }

    function reopenClass(options) {
      setProperties(this, options);
    }

    function extend(options) {
      function Child(options) {
        Klass.call(this, options);
      }

      let Parent = this;

      Child.prototype = new Parent();
      Child.prototype.constructor = Child;

      setProperties(Child, Klass);
      setProperties(Child.prototype, options);

      Child.create = create;
      Child.extend = extend;
      Child.reopen = extend;

      Child.reopenClass = reopenClass;

      return Child;
    }
  }
});
enifed("internal-test-helpers/lib/get-all-property-names", ["exports"], function (exports) {
  "use strict";

  exports.default = getAllPropertyNames;
  function getAllPropertyNames(Klass) {
    let proto = Klass.prototype;
    let properties = new Set();

    while (proto !== Object.prototype) {
      let names = Object.getOwnPropertyNames(proto);
      names.forEach(name => properties.add(name));
      proto = Object.getPrototypeOf(proto);
    }

    return properties;
  }
});
enifed("internal-test-helpers/lib/get-text-of", ["exports"], function (exports) {
    "use strict";

    exports.default = getTextOf;
    function getTextOf(elem) {
        return elem.textContent.trim();
    }
});
enifed('internal-test-helpers/lib/matchers', ['exports'], function (exports) {
  'use strict';

  exports.regex = regex;
  exports.classes = classes;
  exports.styles = styles;
  exports.equalsElement = equalsElement;
  const HTMLElement = window.HTMLElement;
  const MATCHER_BRAND = '3d4ef194-13be-4ccf-8dc7-862eea02c93e';

  function isMatcher(obj) {
    return typeof obj === 'object' && obj !== null && MATCHER_BRAND in obj;
  }

  function equalsAttr(expected) {
    return {
      [MATCHER_BRAND]: true,

      match(actual) {
        return expected === actual;
      },

      expected() {
        return expected;
      },

      message() {
        return `should equal ${this.expected()}`;
      }
    };
  }

  function regex(r) {
    return {
      [MATCHER_BRAND]: true,

      match(v) {
        return r.test(v);
      },

      expected() {
        return r.toString();
      },

      message() {
        return `should match ${this.expected()}`;
      }
    };
  }

  function classes(expected) {
    return {
      [MATCHER_BRAND]: true,

      match(actual) {
        actual = actual.trim();
        return actual && expected.split(/\s+/).sort().join(' ') === actual.trim().split(/\s+/).sort().join(' ');
      },

      expected() {
        return expected;
      },

      message() {
        return `should match ${this.expected()}`;
      }
    };
  }

  function styles(expected) {
    return {
      [MATCHER_BRAND]: true,

      match(actual) {
        // coerce `null` or `undefined` to an empty string
        // needed for matching empty styles on IE9 - IE11
        actual = actual || '';
        actual = actual.trim();

        return expected.split(';').map(s => s.trim()).filter(s => s).sort().join('; ') === actual.split(';').map(s => s.trim()).filter(s => s).sort().join('; ');
      },

      expected() {
        return expected;
      },

      message() {
        return `should match ${this.expected()}`;
      }
    };
  }

  function equalsElement(assert, element, tagName, attributes, content) {
    assert.pushResult({
      result: element.tagName === tagName.toUpperCase(),
      actual: element.tagName.toLowerCase(),
      expected: tagName,
      message: `expect tagName to be ${tagName}`
    });

    let expectedAttrs = {};
    let expectedCount = 0;

    for (let name in attributes) {
      let expected = attributes[name];
      if (expected !== null) {
        expectedCount++;
      }

      let matcher = isMatcher(expected) ? expected : equalsAttr(expected);

      expectedAttrs[name] = matcher;

      assert.pushResult({
        result: expectedAttrs[name].match(element.getAttribute(name)),
        actual: element.getAttribute(name),
        expected: matcher.expected(),
        message: `Element's ${name} attribute ${matcher.message()}`
      });
    }

    let actualAttributes = {};

    for (let i = 0, l = element.attributes.length; i < l; i++) {
      actualAttributes[element.attributes[i].name] = element.attributes[i].value;
    }

    if (!(element instanceof HTMLElement)) {
      assert.pushResult({
        result: element instanceof HTMLElement,
        message: 'Element must be an HTML Element, not an SVG Element'
      });
    } else {
      assert.pushResult({
        result: element.attributes.length === expectedCount || !attributes,
        actual: element.attributes.length,
        expected: expectedCount,
        message: `Expected ${expectedCount} attributes; got ${element.outerHTML}`
      });

      if (content !== null) {
        assert.pushResult({
          result: element.innerHTML === content,
          actual: element.innerHTML,
          expected: content,
          message: `The element had '${content}' as its content`
        });
      }
    }
  }
});
enifed('internal-test-helpers/lib/module-for', ['exports', '@ember/canary-features', 'internal-test-helpers/lib/apply-mixins', 'internal-test-helpers/lib/get-all-property-names', 'rsvp'], function (exports, _canaryFeatures, _applyMixins, _getAllPropertyNames, _rsvp) {
  'use strict';

  exports.default = moduleFor;
  function moduleFor(description, TestClass, ...mixins) {
    QUnit.module(description, {
      beforeEach: function (...args) {
        let instance = new TestClass(...args);
        this.instance = instance;
        if (instance.beforeEach) {
          return instance.beforeEach(...args);
        }
      },

      afterEach: function () {
        let promises = [];
        let instance = this.instance;
        this.instance = null;
        if (instance.teardown) {
          promises.push(instance.teardown());
        }
        if (instance.afterEach) {
          promises.push(instance.afterEach());
        }

        // this seems odd, but actually saves significant time
        // in the test suite
        //
        // returning a promise from a QUnit test always adds a 13ms
        // delay to the test, this filtering prevents returning a
        // promise when it is not needed
        //
        // Remove after we can update to QUnit that includes
        // https://github.com/qunitjs/qunit/pull/1246
        let filteredPromises = promises.filter(Boolean);
        if (filteredPromises.length > 0) {
          return (0, _rsvp.all)(filteredPromises);
        }
      }
    });

    if (mixins.length > 0) {
      (0, _applyMixins.default)(TestClass, ...mixins);
    }

    let properties = (0, _getAllPropertyNames.default)(TestClass);
    properties.forEach(generateTest);

    function shouldTest(features) {
      return features.every(feature => {
        if (feature[0] === '!' && (0, _canaryFeatures.isEnabled)(feature.slice(1))) {
          return false;
        } else if (!(0, _canaryFeatures.isEnabled)(feature)) {
          return false;
        } else {
          return true;
        }
      });
    }

    function generateTest(name) {
      if (name.indexOf('@test ') === 0) {
        QUnit.test(name.slice(5), function (assert) {
          return this.instance[name](assert);
        });
      } else if (name.indexOf('@only ') === 0) {
        QUnit.only(name.slice(5), function (assert) {
          return this.instance[name](assert);
        });
      } else if (name.indexOf('@skip ') === 0) {
        QUnit.skip(name.slice(5), function (assert) {
          return this.instance[name](assert);
        });
      } else {
        let match = /^@feature\(([A-Z_a-z-!]+)\) /.exec(name);

        if (match) {
          let features = match[1].replace(/ /g, '').split(',');

          if (shouldTest(features)) {
            QUnit.test(name.slice(match[0].length), function (assert) {
              return this.instance[name](assert);
            });
          }
        }
      }
    }
  }
});
enifed('internal-test-helpers/lib/registry-check', ['exports'], function (exports) {
  'use strict';

  exports.verifyRegistration = verifyRegistration;
  exports.verifyInjection = verifyInjection;
  function verifyRegistration(assert, owner, fullName) {
    assert.ok(owner.resolveRegistration(fullName), `has registration: ${fullName}`);
  }

  function verifyInjection(assert, owner, fullName, property, injectionName) {
    let registry = owner.__registry__;
    let injections;

    if (fullName.indexOf(':') === -1) {
      injections = registry.getTypeInjections(fullName);
    } else {
      injections = registry.getInjections(registry.normalize(fullName));
    }

    let normalizedName = registry.normalize(injectionName);
    let hasInjection = false;
    let injection;

    for (let i = 0, l = injections.length; i < l; i++) {
      injection = injections[i];
      if (injection.property === property && injection.specifier === normalizedName) {
        hasInjection = true;
        break;
      }
    }

    assert.ok(hasInjection, `has injection: ${fullName}.${property} = ${injectionName}`);
  }
});
enifed('internal-test-helpers/lib/run', ['exports', '@ember/runloop'], function (exports, _runloop) {
  'use strict';

  exports.runAppend = runAppend;
  exports.runDestroy = runDestroy;
  function runAppend(view) {
    (0, _runloop.run)(view, 'appendTo', document.getElementById('qunit-fixture'));
  }

  function runDestroy(toDestroy) {
    if (toDestroy) {
      (0, _runloop.run)(toDestroy, 'destroy');
    }
  }
});
enifed('internal-test-helpers/lib/strip', ['exports'], function (exports) {
  'use strict';

  exports.default = strip;
  function strip([...strings], ...values) {
    let str = strings.map((string, index) => {
      let interpolated = values[index];
      return string + (interpolated !== undefined ? interpolated : '');
    }).join('');
    return str.split('\n').map(s => s.trim()).join('');
  }
});
enifed('internal-test-helpers/lib/system/synthetic-events', ['exports', '@ember/runloop', '@ember/polyfills'], function (exports, _runloop, _polyfills) {
  'use strict';

  exports.elMatches = undefined;
  exports.matches = matches;
  exports.click = click;
  exports.focus = focus;
  exports.blur = blur;
  exports.fireEvent = fireEvent;


  const DEFAULT_EVENT_OPTIONS = { canBubble: true, cancelable: true };
  /* globals Element */

  const KEYBOARD_EVENT_TYPES = ['keydown', 'keypress', 'keyup'];
  const MOUSE_EVENT_TYPES = ['click', 'mousedown', 'mouseup', 'dblclick', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover'];

  const elMatches = exports.elMatches = typeof Element !== 'undefined' && (Element.prototype.matches || Element.prototype.matchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector || Element.prototype.webkitMatchesSelector);

  function matches(el, selector) {
    return elMatches.call(el, selector);
  }

  function isFocusable(el) {
    let focusableTags = ['INPUT', 'BUTTON', 'LINK', 'SELECT', 'A', 'TEXTAREA'];
    let { tagName, type } = el;

    if (type === 'hidden') {
      return false;
    }

    return focusableTags.indexOf(tagName) > -1 || el.contentEditable === 'true';
  }

  function click(el, options = {}) {
    (0, _runloop.run)(() => fireEvent(el, 'mousedown', options));
    focus(el);
    (0, _runloop.run)(() => fireEvent(el, 'mouseup', options));
    (0, _runloop.run)(() => fireEvent(el, 'click', options));
  }

  function focus(el) {
    if (!el) {
      return;
    }
    if (isFocusable(el)) {
      (0, _runloop.run)(null, function () {
        let browserIsNotFocused = document.hasFocus && !document.hasFocus();

        // Firefox does not trigger the `focusin` event if the window
        // does not have focus. If the document doesn't have focus just
        // use trigger('focusin') instead.
        if (browserIsNotFocused) {
          fireEvent(el, 'focusin');
        }

        // makes `document.activeElement` be `el`. If the browser is focused, it also fires a focus event
        el.focus();

        // if the browser is not focused the previous `el.focus()` didn't fire an event, so we simulate it
        if (browserIsNotFocused) {
          fireEvent(el, 'focus');
        }
      });
    }
  }

  function blur(el) {
    if (isFocusable(el)) {
      (0, _runloop.run)(null, function () {
        let browserIsNotFocused = document.hasFocus && !document.hasFocus();

        fireEvent(el, 'focusout');

        // makes `document.activeElement` be `body`.
        // If the browser is focused, it also fires a blur event
        el.blur();

        // Chrome/Firefox does not trigger the `blur` event if the window
        // does not have focus. If the document does not have focus then
        // fire `blur` event via native event.
        if (browserIsNotFocused) {
          fireEvent(el, 'blur');
        }
      });
    }
  }

  function fireEvent(element, type, options = {}) {
    if (!element) {
      return;
    }
    let event;
    if (KEYBOARD_EVENT_TYPES.indexOf(type) > -1) {
      event = buildKeyboardEvent(type, options);
    } else if (MOUSE_EVENT_TYPES.indexOf(type) > -1) {
      let rect = element.getBoundingClientRect();
      let x = rect.left + 1;
      let y = rect.top + 1;
      let simulatedCoordinates = {
        screenX: x + 5,
        screenY: y + 95,
        clientX: x,
        clientY: y
      };
      event = buildMouseEvent(type, (0, _polyfills.assign)(simulatedCoordinates, options));
    } else {
      event = buildBasicEvent(type, options);
    }
    element.dispatchEvent(event);

    return event;
  }

  function buildBasicEvent(type, options = {}) {
    let event = document.createEvent('Events');
    event.initEvent(type, true, true);
    (0, _polyfills.assign)(event, options);
    return event;
  }

  function buildMouseEvent(type, options = {}) {
    let event;
    try {
      event = document.createEvent('MouseEvents');
      let eventOpts = (0, _polyfills.assign)({}, DEFAULT_EVENT_OPTIONS, options);

      event.initMouseEvent(type, eventOpts.canBubble, eventOpts.cancelable, window, eventOpts.detail, eventOpts.screenX, eventOpts.screenY, eventOpts.clientX, eventOpts.clientY, eventOpts.ctrlKey, eventOpts.altKey, eventOpts.shiftKey, eventOpts.metaKey, eventOpts.button, eventOpts.relatedTarget);
    } catch (e) {
      event = buildBasicEvent(type, options);
    }
    return event;
  }

  function buildKeyboardEvent(type, options = {}) {
    let event;
    try {
      event = document.createEvent('KeyEvents');
      let eventOpts = (0, _polyfills.assign)({}, DEFAULT_EVENT_OPTIONS, options);
      event.initKeyEvent(type, eventOpts.canBubble, eventOpts.cancelable, window, eventOpts.ctrlKey, eventOpts.altKey, eventOpts.shiftKey, eventOpts.metaKey, eventOpts.keyCode, eventOpts.charCode);
    } catch (e) {
      event = buildBasicEvent(type, options);
    }
    return event;
  }
});
enifed('internal-test-helpers/lib/test-cases/abstract-application', ['exports', 'ember-template-compiler', '@ember/-internals/environment', 'internal-test-helpers/lib/test-cases/abstract', 'internal-test-helpers/lib/run'], function (exports, _emberTemplateCompiler, _environment, _abstract, _run) {
  'use strict';

  class AbstractApplicationTestCase extends _abstract.default {
    _ensureInstance(bootOptions) {
      if (this._applicationInstancePromise) {
        return this._applicationInstancePromise;
      }

      return this._applicationInstancePromise = this.runTask(() => this.application.boot()).then(app => {
        this.applicationInstance = app.buildInstance();

        return this.applicationInstance.boot(bootOptions);
      });
    }

    visit(url, options) {
      // TODO: THIS IS HORRIBLE
      // the promise returned by `ApplicationInstance.protoype.visit` does **not**
      // currently guarantee rendering is completed
      return this.runTask(() => {
        return this._ensureInstance(options).then(instance => instance.visit(url));
      });
    }

    get element() {
      if (this._element) {
        return this._element;
      } else if (_environment.ENV._APPLICATION_TEMPLATE_WRAPPER) {
        return this._element = document.querySelector('#qunit-fixture > div.ember-view');
      } else {
        return this._element = document.querySelector('#qunit-fixture');
      }
    }

    set element(element) {
      this._element = element;
    }

    afterEach() {
      (0, _run.runDestroy)(this.applicationInstance);
      (0, _run.runDestroy)(this.application);

      super.teardown();
    }

    get applicationOptions() {
      return {
        rootElement: '#qunit-fixture'
      };
    }

    get routerOptions() {
      return {
        location: 'none'
      };
    }

    get router() {
      return this.application.resolveRegistration('router:main');
    }

    compile() /* string, options */{
      return (0, _emberTemplateCompiler.compile)(...arguments);
    }
  }
  exports.default = AbstractApplicationTestCase;
});
enifed('internal-test-helpers/lib/test-cases/abstract-rendering', ['exports', '@ember/polyfills', 'ember-template-compiler', '@ember/-internals/views', '@ember/-internals/glimmer', 'internal-test-helpers/lib/test-resolver', 'internal-test-helpers/lib/test-cases/abstract', 'internal-test-helpers/lib/build-owner', 'internal-test-helpers/lib/run'], function (exports, _polyfills, _emberTemplateCompiler, _views, _glimmer, _testResolver, _abstract, _buildOwner, _run) {
  'use strict';

  const TextNode = window.Text;

  class AbstractRenderingTestCase extends _abstract.default {
    constructor() {
      super(...arguments);
      let bootOptions = this.getBootOptions();

      let owner = this.owner = (0, _buildOwner.default)({
        ownerOptions: this.getOwnerOptions(),
        resolver: this.getResolver(),
        bootOptions
      });

      this.renderer = this.owner.lookup('renderer:-dom');
      this.element = document.querySelector('#qunit-fixture');
      this.component = null;

      owner.register('event_dispatcher:main', _views.EventDispatcher);
      owner.inject('event_dispatcher:main', '_viewRegistry', '-view-registry:main');
      if (!bootOptions || bootOptions.isInteractive !== false) {
        owner.lookup('event_dispatcher:main').setup(this.getCustomDispatcherEvents(), this.element);
      }
    }

    compile() {
      return (0, _emberTemplateCompiler.compile)(...arguments);
    }

    getCustomDispatcherEvents() {
      return {};
    }

    getOwnerOptions() {}
    getBootOptions() {}

    get resolver() {
      return this.owner.__registry__.fallback.resolver;
    }

    getResolver() {
      return new _testResolver.ModuleBasedResolver();
    }

    add(specifier, factory) {
      this.resolver.add(specifier, factory);
    }

    addTemplate(templateName, templateString) {
      if (typeof templateName === 'string') {
        this.resolver.add(`template:${templateName}`, this.compile(templateString, {
          moduleName: templateName
        }));
      } else {
        this.resolver.add(templateName, this.compile(templateString, {
          moduleName: templateName.moduleName
        }));
      }
    }

    addComponent(name, { ComponentClass = null, template = null }) {
      if (ComponentClass) {
        this.resolver.add(`component:${name}`, ComponentClass);
      }

      if (typeof template === 'string') {
        this.resolver.add(`template:components/${name}`, this.compile(template, {
          moduleName: `components/${name}`
        }));
      }
    }

    afterEach() {
      try {
        if (this.component) {
          (0, _run.runDestroy)(this.component);
        }
        if (this.owner) {
          (0, _run.runDestroy)(this.owner);
        }
      } finally {
        (0, _glimmer._resetRenderers)();
      }
    }

    get context() {
      return this.component;
    }

    render(templateStr, context = {}) {
      let { owner } = this;

      owner.register('template:-top-level', this.compile(templateStr, {
        moduleName: '-top-level'
      }));

      let attrs = (0, _polyfills.assign)({}, context, {
        tagName: '',
        layoutName: '-top-level'
      });

      owner.register('component:-top-level', _glimmer.Component.extend(attrs));

      this.component = owner.lookup('component:-top-level');

      (0, _run.runAppend)(this.component);
    }

    rerender() {
      this.component.rerender();
    }

    registerHelper(name, funcOrClassBody) {
      let type = typeof funcOrClassBody;

      if (type === 'function') {
        this.owner.register(`helper:${name}`, (0, _glimmer.helper)(funcOrClassBody));
      } else if (type === 'object' && type !== null) {
        this.owner.register(`helper:${name}`, _glimmer.Helper.extend(funcOrClassBody));
      } else {
        throw new Error(`Cannot register ${funcOrClassBody} as a helper`);
      }
    }

    registerPartial(name, template) {
      let owner = this.env.owner || this.owner;
      if (typeof template === 'string') {
        owner.register(`template:${name}`, this.compile(template, { moduleName: `my-app/templates/-${name}.hbs` }));
      }
    }

    registerComponent(name, { ComponentClass = _glimmer.Component, template = null }) {
      let { owner } = this;

      if (ComponentClass) {
        owner.register(`component:${name}`, ComponentClass);
      }

      if (typeof template === 'string') {
        owner.register(`template:components/${name}`, this.compile(template, {
          moduleName: `my-app/templates/components/${name}.hbs`
        }));
      }
    }

    registerModifier(name, ModifierClass) {
      let { owner } = this;

      owner.register(`modifier:${name}`, ModifierClass);
    }

    registerComponentManager(name, manager) {
      let owner = this.env.owner || this.owner;
      owner.register(`component-manager:${name}`, manager);
    }

    registerTemplate(name, template) {
      let { owner } = this;
      if (typeof template === 'string') {
        owner.register(`template:${name}`, this.compile(template, {
          moduleName: `my-app/templates/${name}.hbs`
        }));
      } else {
        throw new Error(`Registered template "${name}" must be a string`);
      }
    }

    registerService(name, klass) {
      this.owner.register(`service:${name}`, klass);
    }

    assertTextNode(node, text) {
      if (!(node instanceof TextNode)) {
        throw new Error(`Expecting a text node, but got ${node}`);
      }

      this.assert.strictEqual(node.textContent, text, 'node.textContent');
    }
  }
  exports.default = AbstractRenderingTestCase;
});
enifed('internal-test-helpers/lib/test-cases/abstract', ['exports', '@ember/polyfills', '@ember/runloop', 'internal-test-helpers/lib/test-cases/node-query', 'internal-test-helpers/lib/equal-inner-html', 'internal-test-helpers/lib/equal-tokens', 'internal-test-helpers/lib/matchers', 'rsvp'], function (exports, _polyfills, _runloop, _nodeQuery, _equalInnerHtml, _equalTokens, _matchers, _rsvp) {
  'use strict';

  const TextNode = window.Text; /* global Element */

  const HTMLElement = window.HTMLElement;
  const Comment = window.Comment;

  function isMarker(node) {
    if (node instanceof Comment && node.textContent === '') {
      return true;
    }

    if (node instanceof TextNode && node.textContent === '') {
      return true;
    }

    return false;
  }

  class AbstractTestCase {
    constructor(assert) {
      this.element = null;
      this.snapshot = null;
      this.assert = assert;

      let { fixture } = this;
      if (fixture) {
        this.setupFixture(fixture);
      }
    }

    teardown() {}
    afterEach() {}

    runTask(callback) {
      return (0, _runloop.run)(callback);
    }

    runTaskNext() {
      return new _rsvp.Promise(resolve => {
        return (0, _runloop.next)(resolve);
      });
    }

    setupFixture(innerHTML) {
      let fixture = document.getElementById('qunit-fixture');
      fixture.innerHTML = innerHTML;
    }

    // The following methods require `this.element` to work

    get firstChild() {
      return this.nthChild(0);
    }

    nthChild(n) {
      let i = 0;
      let node = this.element.firstChild;

      while (node) {
        if (!isMarker(node)) {
          i++;
        }

        if (i > n) {
          break;
        } else {
          node = node.nextSibling;
        }
      }

      return node;
    }

    get nodesCount() {
      let count = 0;
      let node = this.element.firstChild;

      while (node) {
        if (!isMarker(node)) {
          count++;
        }

        node = node.nextSibling;
      }

      return count;
    }

    $(sel) {
      if (sel instanceof Element) {
        return _nodeQuery.default.element(sel);
      } else if (typeof sel === 'string') {
        return _nodeQuery.default.query(sel, this.element);
      } else if (sel !== undefined) {
        throw new Error(`Invalid this.$(${sel})`);
      } else {
        return _nodeQuery.default.element(this.element);
      }
    }

    wrap(element) {
      return _nodeQuery.default.element(element);
    }

    click(selector) {
      let element;
      if (typeof selector === 'string') {
        element = this.element.querySelector(selector);
      } else {
        element = selector;
      }

      let event = element.click();

      return this.runLoopSettled(event);
    }

    // TODO: Find a better name 😎
    runLoopSettled(value) {
      return new _rsvp.Promise(function (resolve) {
        // Every 5ms, poll for the async thing to have finished
        let watcher = setInterval(() => {
          // If there are scheduled timers or we are inside of a run loop, keep polling
          if ((0, _runloop.hasScheduledTimers)() || (0, _runloop.getCurrentRunLoop)()) {
            return;
          }

          // Stop polling
          clearInterval(watcher);

          // Synchronously resolve the promise
          resolve(value);
        }, 5);
      });
    }

    textValue() {
      return this.element.textContent;
    }

    takeSnapshot() {
      let snapshot = this.snapshot = [];

      let node = this.element.firstChild;

      while (node) {
        if (!isMarker(node)) {
          snapshot.push(node);
        }

        node = node.nextSibling;
      }

      return snapshot;
    }

    assertText(text) {
      this.assert.strictEqual(this.textValue(), text, `#qunit-fixture content should be: \`${text}\``);
    }

    assertInnerHTML(html) {
      (0, _equalInnerHtml.default)(this.assert, this.element, html);
    }

    assertHTML(html) {
      (0, _equalTokens.default)(this.element, html, `#qunit-fixture content should be: \`${html}\``);
    }

    assertElement(node, { ElementType = HTMLElement, tagName, attrs = null, content = null }) {
      if (!(node instanceof ElementType)) {
        throw new Error(`Expecting a ${ElementType.name}, but got ${node}`);
      }

      (0, _matchers.equalsElement)(this.assert, node, tagName, attrs, content);
    }

    assertComponentElement(node, { ElementType = HTMLElement, tagName = 'div', attrs = null, content = null }) {
      attrs = (0, _polyfills.assign)({}, { id: (0, _matchers.regex)(/^ember\d*$/), class: (0, _matchers.classes)('ember-view') }, attrs || {});
      this.assertElement(node, { ElementType, tagName, attrs, content });
    }

    assertSameNode(actual, expected) {
      this.assert.strictEqual(actual, expected, 'DOM node stability');
    }

    assertInvariants(oldSnapshot, newSnapshot) {
      oldSnapshot = oldSnapshot || this.snapshot;
      newSnapshot = newSnapshot || this.takeSnapshot();

      this.assert.strictEqual(newSnapshot.length, oldSnapshot.length, 'Same number of nodes');

      for (let i = 0; i < oldSnapshot.length; i++) {
        this.assertSameNode(newSnapshot[i], oldSnapshot[i]);
      }
    }

    assertPartialInvariants(start, end) {
      this.assertInvariants(this.snapshot, this.takeSnapshot().slice(start, end));
    }

    assertStableRerender() {
      this.takeSnapshot();
      this.runTask(() => this.rerender());
      this.assertInvariants();
    }
  }
  exports.default = AbstractTestCase;
});
enifed('internal-test-helpers/lib/test-cases/application', ['exports', 'internal-test-helpers/lib/test-cases/test-resolver-application', '@ember/application', '@ember/-internals/routing', '@ember/polyfills'], function (exports, _testResolverApplication, _application, _routing, _polyfills) {
  'use strict';

  class ApplicationTestCase extends _testResolverApplication.default {
    constructor() {
      super(...arguments);

      let { applicationOptions } = this;
      this.application = this.runTask(this.createApplication.bind(this, applicationOptions));

      this.resolver = this.application.__registry__.resolver;

      if (this.resolver) {
        this.resolver.add('router:main', _routing.Router.extend(this.routerOptions));
      }
    }

    createApplication(myOptions = {}, MyApplication = _application.default) {
      return MyApplication.create(myOptions);
    }

    get applicationOptions() {
      return (0, _polyfills.assign)(super.applicationOptions, {
        autoboot: false
      });
    }

    get appRouter() {
      return this.applicationInstance.lookup('router:main');
    }

    transitionTo() {
      return this.runTask(() => {
        return this.appRouter.transitionTo(...arguments);
      });
    }
  }
  exports.default = ApplicationTestCase;
});
enifed('internal-test-helpers/lib/test-cases/autoboot-application', ['exports', 'internal-test-helpers/lib/test-cases/test-resolver-application', '@ember/application', '@ember/polyfills', '@ember/-internals/routing'], function (exports, _testResolverApplication, _application, _polyfills, _routing) {
  'use strict';

  class AutobootApplicationTestCase extends _testResolverApplication.default {
    createApplication(options, MyApplication = _application.default) {
      let myOptions = (0, _polyfills.assign)(this.applicationOptions, options);
      let application = this.application = MyApplication.create(myOptions);
      this.resolver = application.__registry__.resolver;

      if (this.resolver) {
        this.resolver.add('router:main', _routing.Router.extend(this.routerOptions));
      }

      return application;
    }

    visit(url) {
      return this.application.boot().then(() => {
        return this.applicationInstance.visit(url);
      });
    }

    get applicationInstance() {
      let { application } = this;

      if (!application) {
        return undefined;
      }

      return application.__deprecatedInstance__;
    }
  }
  exports.default = AutobootApplicationTestCase;
});
enifed('internal-test-helpers/lib/test-cases/default-resolver-application', ['exports', 'internal-test-helpers/lib/test-cases/abstract-application', '@ember/application/globals-resolver', '@ember/application', '@ember/-internals/glimmer', '@ember/polyfills', '@ember/-internals/routing'], function (exports, _abstractApplication, _globalsResolver, _application, _glimmer, _polyfills, _routing) {
  'use strict';

  class ApplicationTestCase extends _abstractApplication.default {
    createApplication() {
      let application = this.application = _application.default.create(this.applicationOptions);
      application.Router = _routing.Router.extend(this.routerOptions);
      return application;
    }

    get applicationOptions() {
      return (0, _polyfills.assign)(super.applicationOptions, {
        name: 'TestApp',
        autoboot: false,
        Resolver: _globalsResolver.default
      });
    }

    afterEach() {
      (0, _glimmer.setTemplates)({});
      return super.afterEach();
    }

    get appRouter() {
      return this.applicationInstance.lookup('router:main');
    }

    transitionTo() {
      return this.runTask(() => {
        return this.appRouter.transitionTo(...arguments);
      });
    }

    addTemplate(name, templateString) {
      let compiled = this.compile(templateString);
      (0, _glimmer.setTemplate)(name, compiled);
      return compiled;
    }
  }
  exports.default = ApplicationTestCase;
});
enifed('internal-test-helpers/lib/test-cases/node-query', ['exports', '@ember/debug', 'internal-test-helpers/lib/system/synthetic-events'], function (exports, _debug, _syntheticEvents) {
  'use strict';

  /* global Node */

  class NodeQuery {
    static query(selector, context = document) {
      false && !(context && context instanceof Node) && (0, _debug.assert)(`Invalid second parameter to NodeQuery.query`, context && context instanceof Node);

      return new NodeQuery(toArray(context.querySelectorAll(selector)));
    }

    static element(element) {
      return new NodeQuery([element]);
    }

    constructor(nodes) {
      false && !Array.isArray(nodes) && (0, _debug.assert)('NodeQuery must be initialized with a literal array', Array.isArray(nodes));

      this.nodes = nodes;

      for (let i = 0; i < nodes.length; i++) {
        this[i] = nodes[i];
      }

      this.length = nodes.length;

      Object.freeze(this);
    }

    find(selector) {
      assertSingle(this);

      return this[0].querySelector(selector);
    }

    findAll(selector) {
      let nodes = [];

      this.nodes.forEach(node => {
        nodes.push(...node.querySelectorAll(selector));
      });

      return new NodeQuery(nodes);
    }

    trigger(eventName, options) {
      return this.nodes.map(node => (0, _syntheticEvents.fireEvent)(node, eventName, options));
    }

    click() {
      return this.trigger('click');
    }

    focus() {
      this.nodes.forEach(_syntheticEvents.focus);
    }

    text() {
      return this.nodes.map(node => node.textContent).join('');
    }

    attr(name) {
      if (arguments.length !== 1) {
        throw new Error('not implemented');
      }

      assertSingle(this);

      return this.nodes[0].getAttribute(name);
    }

    prop(name, value) {
      if (arguments.length > 1) {
        return this.setProp(name, value);
      }

      assertSingle(this);

      return this.nodes[0][name];
    }

    setProp(name, value) {
      this.nodes.forEach(node => node[name] = value);

      return this;
    }

    val(value) {
      if (arguments.length === 1) {
        return this.setProp('value', value);
      }

      return this.prop('value');
    }

    is(selector) {
      return this.nodes.every(node => (0, _syntheticEvents.matches)(node, selector));
    }

    hasClass(className) {
      return this.is(`.${className}`);
    }
  }

  exports.default = NodeQuery;
  function assertSingle(nodeQuery) {
    if (nodeQuery.length !== 1) {
      throw new Error(`attr(name) called on a NodeQuery with ${this.nodes.length} elements. Expected one element.`);
    }
  }

  function toArray(nodes) {
    let out = [];

    for (let i = 0; i < nodes.length; i++) {
      out.push(nodes[i]);
    }

    return out;
  }
});
enifed('internal-test-helpers/lib/test-cases/query-param', ['exports', '@ember/controller', '@ember/-internals/routing', '@ember/runloop', 'internal-test-helpers/lib/test-cases/application'], function (exports, _controller, _routing, _runloop, _application) {
  'use strict';

  class QueryParamTestCase extends _application.default {
    constructor() {
      super(...arguments);

      let testCase = this;
      testCase.expectedPushURL = null;
      testCase.expectedReplaceURL = null;

      this.add('location:test', _routing.NoneLocation.extend({
        setURL(path) {
          if (testCase.expectedReplaceURL) {
            testCase.assert.ok(false, 'pushState occurred but a replaceState was expected');
          }

          if (testCase.expectedPushURL) {
            testCase.assert.equal(path, testCase.expectedPushURL, 'an expected pushState occurred');
            testCase.expectedPushURL = null;
          }

          this.set('path', path);
        },

        replaceURL(path) {
          if (testCase.expectedPushURL) {
            testCase.assert.ok(false, 'replaceState occurred but a pushState was expected');
          }

          if (testCase.expectedReplaceURL) {
            testCase.assert.equal(path, testCase.expectedReplaceURL, 'an expected replaceState occurred');
            testCase.expectedReplaceURL = null;
          }

          this.set('path', path);
        }
      }));
    }

    visitAndAssert(path) {
      return this.visit(...arguments).then(() => {
        this.assertCurrentPath(path);
      });
    }

    getController(name) {
      return this.applicationInstance.lookup(`controller:${name}`);
    }

    getRoute(name) {
      return this.applicationInstance.lookup(`route:${name}`);
    }

    get routerOptions() {
      return {
        location: 'test'
      };
    }

    setAndFlush(obj, prop, value) {
      return (0, _runloop.run)(obj, 'set', prop, value);
    }

    assertCurrentPath(path, message = `current path equals '${path}'`) {
      this.assert.equal(this.appRouter.get('location.path'), path, message);
    }

    /**
      Sets up a Controller for a given route with a single query param and default
      value. Can optionally extend the controller with an object.
       @public
      @method setSingleQPController
    */
    setSingleQPController(routeName, param = 'foo', defaultValue = 'bar', options = {}) {
      this.add(`controller:${routeName}`, _controller.default.extend({
        queryParams: [param],
        [param]: defaultValue
      }, options));
    }

    /**
      Sets up a Controller for a given route with a custom property/url key mapping.
       @public
      @method setMappedQPController
    */
    setMappedQPController(routeName, prop = 'page', urlKey = 'parentPage', defaultValue = 1, options = {}) {
      this.add(`controller:${routeName}`, _controller.default.extend({
        queryParams: {
          [prop]: urlKey
        },
        [prop]: defaultValue
      }, options));
    }
  }
  exports.default = QueryParamTestCase;
});
enifed('internal-test-helpers/lib/test-cases/rendering', ['exports', 'internal-test-helpers/lib/test-cases/abstract-rendering', '@ember/-internals/container'], function (exports, _abstractRendering, _container) {
  'use strict';

  class RenderingTestCase extends _abstractRendering.default {
    constructor() {
      super(...arguments);
      let { owner } = this;

      this.env = owner.lookup('service:-glimmer-environment');
      this.templateOptions = owner.lookup(_container.privatize`template-compiler:main`);
      this.compileTimeLookup = this.templateOptions.resolver;
      this.runtimeResolver = this.compileTimeLookup.resolver;
    }
  }
  exports.default = RenderingTestCase;
});
enifed('internal-test-helpers/lib/test-cases/router', ['exports', 'internal-test-helpers/lib/test-cases/application'], function (exports, _application) {
  'use strict';

  class RouterTestCase extends _application.default {
    constructor() {
      super(...arguments);

      this.router.map(function () {
        this.route('parent', { path: '/' }, function () {
          this.route('child');
          this.route('sister');
          this.route('brother');
        });
        this.route('dynamic', { path: '/dynamic/:dynamic_id' });
        this.route('dynamicWithChild', { path: '/dynamic-with-child/:dynamic_id' }, function () {
          this.route('child', { path: '/:child_id' });
        });
      });
    }

    get routerService() {
      return this.applicationInstance.lookup('service:router');
    }

    buildQueryParams(queryParams) {
      return {
        queryParams
      };
    }
  }
  exports.default = RouterTestCase;
});
enifed('internal-test-helpers/lib/test-cases/test-resolver-application', ['exports', 'internal-test-helpers/lib/test-cases/abstract-application', 'internal-test-helpers/lib/test-resolver', '@ember/-internals/glimmer', '@ember/polyfills'], function (exports, _abstractApplication, _testResolver, _glimmer, _polyfills) {
  'use strict';

  class TestResolverApplicationTestCase extends _abstractApplication.default {
    get applicationOptions() {
      return (0, _polyfills.assign)(super.applicationOptions, {
        Resolver: _testResolver.ModuleBasedResolver
      });
    }

    add(specifier, factory) {
      this.resolver.add(specifier, factory);
    }

    addTemplate(templateName, templateString) {
      this.resolver.add(`template:${templateName}`, this.compile(templateString, {
        moduleName: `my-app/templates/${templateName}.hbs`
      }));
    }

    addComponent(name, { ComponentClass = _glimmer.Component, template = null }) {
      if (ComponentClass) {
        this.resolver.add(`component:${name}`, ComponentClass);
      }

      if (typeof template === 'string') {
        this.resolver.add(`template:components/${name}`, this.compile(template, {
          moduleName: `my-app/templates/components/${name}.hbs`
        }));
      }
    }
  }
  exports.default = TestResolverApplicationTestCase;
});
enifed('internal-test-helpers/lib/test-resolver', ['exports', 'ember-template-compiler'], function (exports, _emberTemplateCompiler) {
  'use strict';

  exports.ModuleBasedResolver = undefined;


  const DELIMITER = '%';

  function serializeKey(specifier, source, namespace) {
    let [type, name] = specifier.split(':');
    return `${type}://${[name, namespace ? '[source invalid due to namespace]' : source, namespace].join(DELIMITER)}`;
  }

  class Resolver {
    constructor() {
      this._registered = {};
    }
    resolve(specifier) {
      return this._registered[specifier] || this._registered[serializeKey(specifier)];
    }
    expandLocalLookup(specifier, source, namespace) {
      if (specifier.indexOf('://') !== -1) {
        return specifier; // an already expanded specifier
      }

      if (source || namespace) {
        let key = serializeKey(specifier, source, namespace);
        if (this._registered[key]) {
          return key; // like local lookup
        }

        key = serializeKey(specifier);
        if (this._registered[key]) {
          return specifier; // top level resolution despite source/namespace
        }
      }

      return specifier; // didn't know how to expand it
    }
    add(lookup, factory) {
      let key;
      switch (typeof lookup) {
        case 'string':
          if (lookup.indexOf(':') === -1) {
            throw new Error('Specifiers added to the resolver must be in the format of type:name');
          }
          key = serializeKey(lookup);
          break;
        case 'object':
          key = serializeKey(lookup.specifier, lookup.source, lookup.namespace);
          break;
        default:
          throw new Error('Specifier string has an unknown type');
      }

      return this._registered[key] = factory;
    }
    addTemplate(templateName, template) {
      let templateType = typeof template;
      if (templateType !== 'string') {
        throw new Error(`You called addTemplate for "${templateName}" with a template argument of type of '${templateType}'. addTemplate expects an argument of an uncompiled template as a string.`);
      }
      return this._registered[serializeKey(`template:${templateName}`)] = (0, _emberTemplateCompiler.compile)(template, {
        moduleName: `my-app/templates/${templateName}.hbs`
      });
    }
    static create() {
      return new this();
    }
  }

  exports.default = Resolver;


  /*
   * A resolver with moduleBasedResolver = true handles error and loading
   * substates differently than a standard resolver.
   */
  class ModuleBasedResolver extends Resolver {
    get moduleBasedResolver() {
      return true;
    }
  }

  exports.ModuleBasedResolver = ModuleBasedResolver;
});
enifed('internal-test-helpers/tests/index-test', ['internal-test-helpers'], function (_internalTestHelpers) {
  'use strict';

  (0, _internalTestHelpers.moduleFor)('internal-test-helpers', class extends _internalTestHelpers.AbstractTestCase {
    ['@test module present'](assert) {
      assert.ok(true, 'each package needs at least one test to be able to run through `npm test`');
    }
  });
});
/*global enifed, module */
enifed('node-module', ['exports'], function(_exports) {
  var IS_NODE = typeof module === 'object' && typeof module.require === 'function';
  if (IS_NODE) {
    _exports.require = module.require;
    _exports.module = module;
    _exports.IS_NODE = IS_NODE;
  } else {
    _exports.require = null;
    _exports.module = null;
    _exports.IS_NODE = IS_NODE;
  }
});



}());
//# sourceMappingURL=ember-tests.prod.map
