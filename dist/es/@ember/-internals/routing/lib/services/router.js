import { Evented } from '@ember/-internals/runtime';
import { assert } from '@ember/debug';
import { readOnly } from '@ember/object/computed';
import Service from '@ember/service';
import { DEBUG } from '@glimmer/env';
import { extractRouteArgs, resemblesURL, shallowEqual } from '../utils';
let freezeRouteInfo;
if (DEBUG) {
    freezeRouteInfo = (transition) => {
        if (transition.from !== null && !Object.isFrozen(transition.from)) {
            Object.freeze(transition.from);
        }
        if (transition.to !== null && !Object.isFrozen(transition.to)) {
            Object.freeze(transition.to);
        }
    };
}
function cleanURL(url, rootURL) {
    if (rootURL === '/') {
        return url;
    }
    return url.substr(rootURL.length, url.length);
}
/**
   The Router service is the public API that provides access to the router.

   The immediate benefit of the Router service is that you can inject it into components,
   giving them a friendly way to initiate transitions and ask questions about the current
   global router state.

   In this example, the Router service is injected into a component to initiate a transition
   to a dedicated route:
   ```javascript
   import Component from '@ember/component';
   import { inject as service } from '@ember/service';

   export default Component.extend({
     router: service(),

     actions: {
       next() {
         this.get('router').transitionTo('other.route');
       }
     }
   });
   ```

   Like any service, it can also be injected into helpers, routes, etc.

   @public
   @class RouterService
 */
export default class RouterService extends Service {
    init() {
        super.init(...arguments);
        this._router.on('routeWillChange', (transition) => {
            if (DEBUG) {
                freezeRouteInfo(transition);
            }
            this.trigger('routeWillChange', transition);
        });
        this._router.on('routeDidChange', (transition) => {
            if (DEBUG) {
                freezeRouteInfo(transition);
            }
            this.trigger('routeDidChange', transition);
        });
    }
    /**
       Transition the application into another route. The route may
       be either a single route or route path:
  
       See [transitionTo](/api/ember/release/classes/Route/methods/transitionTo?anchor=transitionTo) for more info.
  
       Calling `transitionTo` from the Router service will cause default query parameter values to be included in the URL.
       This behavior is different from calling `transitionTo` on a route or `transitionToRoute` on a controller.
       See the [Router Service RFC](https://github.com/emberjs/rfcs/blob/master/text/0095-router-service.md#query-parameter-semantics) for more info.
  
       @method transitionTo
       @param {String} routeNameOrUrl the name of the route or a URL
       @param {...Object} models the model(s) or identifier(s) to be used while
         transitioning to the route.
       @param {Object} [options] optional hash with a queryParams property
         containing a mapping of query parameters
       @return {Transition} the transition object associated with this
         attempted transition
       @public
     */
    transitionTo(...args) {
        if (resemblesURL(args[0])) {
            return this._router._doURLTransition('transitionTo', args[0]);
        }
        let { routeName, models, queryParams } = extractRouteArgs(args);
        let transition = this._router._doTransition(routeName, models, queryParams, true);
        transition['_keepDefaultQueryParamValues'] = true;
        return transition;
    }
    /**
       Transition into another route while replacing the current URL, if possible.
       The route may be either a single route or route path:
  
       See [replaceWith](/api/ember/release/classes/Route/methods/replaceWith?anchor=replaceWith) for more info.
  
       Calling `replaceWith` from the Router service will cause default query parameter values to be included in the URL.
       This behavior is different from calling `replaceWith` on a route.
       See the [Router Service RFC](https://github.com/emberjs/rfcs/blob/master/text/0095-router-service.md#query-parameter-semantics) for more info.
  
       @method replaceWith
       @param {String} routeNameOrUrl the name of the route or a URL
       @param {...Object} models the model(s) or identifier(s) to be used while
         transitioning to the route.
       @param {Object} [options] optional hash with a queryParams property
         containing a mapping of query parameters
       @return {Transition} the transition object associated with this
         attempted transition
       @public
     */
    replaceWith( /* routeNameOrUrl, ...models, options */) {
        return this.transitionTo(...arguments).method('replace');
    }
    /**
      Generate a URL based on the supplied route name and optionally a model. The
      URL is returned as a string that can be used for any purpose.
  
      In this example, the URL for the `author.books` route for a given author
      is copied to the clipboard.
  
      ```app/components/copy-link.js
      import Component from '@ember/component';
      import {inject as service} from '@ember/service';
  
      export default Component.extend({
        router: service('router'),
        clipboard: service('clipboard')
  
        // Provided in the template
        // { id: 'tomster', name: 'Tomster' }
        author: null,
  
        copyBooksURL() {
          if (this.author) {
            const url = this.router.urlFor('author.books', this.author);
            this.clipboard.set(url);
            // Clipboard now has /author/tomster/books
          }
        }
      });
      ```
  
      Just like with `transitionTo` and `replaceWith`, `urlFor` can also handle
      query parameters.
  
      ```app/components/copy-link.js
      import Component from '@ember/component';
      import {inject as service} from '@ember/service';
  
      export default Component.extend({
        router: service('router'),
        clipboard: service('clipboard')
  
        // Provided in the template
        // { id: 'tomster', name: 'Tomster' }
        author: null,
  
        copyOnlyEmberBooksURL() {
          if (this.author) {
            const url = this.router.urlFor('author.books', this.author, {
              queryParams: { filter: 'emberjs' }
            });
            this.clipboard.set(url);
            // Clipboard now has /author/tomster/books?filter=emberjs
          }
        }
      });
      ```
  
       @method urlFor
       @param {String} routeName the name of the route
       @param {...Object} models the model(s) or identifier(s) to be used while
         transitioning to the route.
       @param {Object} [options] optional hash with a queryParams property
         containing a mapping of query parameters
       @return {String} the string representing the generated URL
       @public
     */
    urlFor(routeName, ...args) {
        return this._router.generate(routeName, ...args);
    }
    /**
       Determines whether a route is active.
  
       @method isActive
       @param {String} routeName the name of the route
       @param {...Object} models the model(s) or identifier(s) to be used while
         transitioning to the route.
       @param {Object} [options] optional hash with a queryParams property
         containing a mapping of query parameters
       @return {boolean} true if the provided routeName/models/queryParams are active
       @public
     */
    isActive(...args) {
        let { routeName, models, queryParams } = extractRouteArgs(args);
        let routerMicrolib = this._router._routerMicrolib;
        if (!routerMicrolib.isActiveIntent(routeName, models)) {
            return false;
        }
        let hasQueryParams = Object.keys(queryParams).length > 0;
        if (hasQueryParams) {
            this._router._prepareQueryParams(routeName, models, queryParams, true /* fromRouterService */);
            return shallowEqual(queryParams, routerMicrolib.state.queryParams);
        }
        return true;
    }
    /**
       Takes a string URL and returns a `RouteInfo` for the leafmost route represented
       by the URL. Returns `null` if the URL is not recognized. This method expects to
       receive the actual URL as seen by the browser including the app's `rootURL`.
  
        @method recognize
        @param {String} url
        @public
      */
    recognize(url) {
        assert(`You must pass a url that begins with the application's rootURL "${this.rootURL}"`, url.indexOf(this.rootURL) === 0);
        let internalURL = cleanURL(url, this.rootURL);
        return this._router._routerMicrolib.recognize(internalURL);
    }
    /**
      Takes a string URL and returns a promise that resolves to a
      `RouteInfoWithAttributes` for the leafmost route represented by the URL.
      The promise rejects if the URL is not recognized or an unhandled exception
      is encountered. This method expects to receive the actual URL as seen by
      the browser including the app's `rootURL`.
  
        @method recognizeAndLoad
        @param {String} url
        @public
     */
    recognizeAndLoad(url) {
        assert(`You must pass a url that begins with the application's rootURL "${this.rootURL}"`, url.indexOf(this.rootURL) === 0);
        let internalURL = cleanURL(url, this.rootURL);
        return this._router._routerMicrolib.recognizeAndLoad(internalURL);
    }
}
RouterService.reopen(Evented, {
    /**
       Name of the current route.
  
       This property represents the logical name of the route,
       which is comma separated.
       For the following router:
  
       ```app/router.js
       Router.map(function() {
         this.route('about');
         this.route('blog', function () {
           this.route('post', { path: ':post_id' });
         });
       });
       ```
  
       It will return:
  
       * `index` when you visit `/`
       * `about` when you visit `/about`
       * `blog.index` when you visit `/blog`
       * `blog.post` when you visit `/blog/some-post-id`
  
       @property currentRouteName
       @type String
       @public
     */
    currentRouteName: readOnly('_router.currentRouteName'),
    /**
       Current URL for the application.
  
      This property represents the URL path for this route.
      For the following router:
  
       ```app/router.js
       Router.map(function() {
         this.route('about');
         this.route('blog', function () {
           this.route('post', { path: ':post_id' });
         });
       });
       ```
  
       It will return:
  
       * `/` when you visit `/`
       * `/about` when you visit `/about`
       * `/blog` when you visit `/blog`
       * `/blog/some-post-id` when you visit `/blog/some-post-id`
  
       @property currentURL
       @type String
       @public
     */
    currentURL: readOnly('_router.currentURL'),
    /**
      The `location` property determines the type of URLs your
      application will use.
  
      The following location types are currently available:
      * `auto`
      * `hash`
      * `history`
      * `none`
  
      You can pass a location type to force a particular `location` API
      implementation to be used in your application. For example, to set
      the `history` type:
  
      ```config/environment.js
      'use strict';
  
      module.exports = function(environment) {
        let ENV = {
          modulePrefix: 'router-service',
          environment,
          rootURL: '/',
          locationType: 'history',
          ...
        }
      }
      ```
  
      @property location
      @default 'hash'
      @see {Location}
      @public
    */
    location: readOnly('_router.location'),
    /**
      The `rootURL` property represents the URL of the root of
      the application, '/' by default.
      This prefix is assumed on all routes defined on this app.
  
      IF you change the `rootURL` in your environment configuration
      like so:
  
      ```config/environment.js
      'use strict';
  
      module.exports = function(environment) {
        let ENV = {
          modulePrefix: 'router-service',
          environment,
          rootURL: '/my-root',
        …
        }
      ]
      ```
  
      This property will return `/my-root`.
  
      @property rootURL
      @default '/'
      @public
    */
    rootURL: readOnly('_router.rootURL'),
    /**
       A `RouteInfo` that represents the current leaf route.
       It is guaranteed to change whenever a route transition
       happens (even when that transition only changes parameters
       and doesn't change the active route)
  
       @property currentRoute
       @type RouteInfo
       @public
     */
    currentRoute: readOnly('_router.currentRoute'),
});
