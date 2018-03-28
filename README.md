Grapnel
==========

#### The first (started in 2010!) Client/Server-Side JavaScript Router with Named Parameters, HTML5 pushState, and Middleware support.

## Download/Installation

**Download Source:**

- [Production](https://raw.githubusercontent.com/baseprime/grapnel/master/dist/grapnel.min.js)
- [Development](https://raw.githubusercontent.com/baseprime/grapnel/development/dist/grapnel.js)

**Install with npm**
```bash
npm install grapnel
```
**Or by using bower:**
```bash
bower install grapnel
```
**Server only:** (with HTTP methods added, [more info](https://github.com/baseprime/grapnel-server))
```bash
npm install grapnel-server
```

# Grapnel Features

- Supports routing using `pushState` or `hashchange` concurrently
- Supports Named Parameters similar to Express, Sinatra, and Restify
- Middleware Support
- Works on the client or server side
- RegExp Support
- Supports `#` or `#!` for `hashchange` routing
- Unobtrusive, supports multiple routers on the same page
- No dependencies

## Basic Router

```javascript
const router = new Grapnel();

router.get('products/:category/:id?', function(req) {
    let id = req.params.id;
    let category = req.params.category;
    // GET http://mysite.com/#products/widgets/134
    console.log(category, id);
    // => widgets 134
});
```

## Using HTML5 pushState

```javascript
const router = new Grapnel({ pushState : true });

router.get('/products/:category/:id?', function(req) {
    let id = req.params.id;
    let category = req.params.category;

    console.log(category, id);
});

router.navigate('/products/widgets/134');
// => widgets 134
```

## Named Parameters

Grapnel supports regex style routes similar to Sinatra, Restify, and Express. The properties are mapped to the parameters in the request.
```javascript
router.get('products/:id?', function(req) {
    // GET /file.html#products/134
    console.log(req.params.id);
    // => 134
});

router.get('products/*', function(req) {
    // The wildcard/asterisk will match anything after that point in the URL
    // Parameters are provided req.params using req.params[n], where n is the nth capture
});
```

## Middleware Support

Grapnel also supports middleware:

```javascript
let auth = function(req, event, next) {
    user.auth(function(err) {
        req.user = this;
        next();
    });
}

router.get('/*', auth, function(req) {
    console.log(req.user);
});
```

## Route Context

You can add context to a route and even use it with middleware:

```javascript
let usersRoute = router.context('/user/:id', getUser, getFollowers); // Middleware can be used here

usersRoute('/', function(req, event) {
    console.log('Profile', req.params.id);
});

usersRoute('/followers', otherMiddleware, function(req, event) { // Middleware can be used here too
    console.log('Followers', req.params.id);
});

router.navigate('/user/13589');
// => Profile 13589

router.navigate('/user/13589/followers');
// => Followers 13589
```

## Works as a server-side router
```javascript
import { createServer } from 'http';
import Grapnel from 'grapnel';
const app = new Grapnel();

app.get('/', function(req, route) {
    route.res.end('Hello World!', 200);
});

createServer(function(req, res) {
    app.once('match', function(route) {
        route.res = res;
    }).navigate(req.url);
}).listen(3000);
```
**This is now simplified as a separate package** ([more info](https://github.com/baseprime/grapnel/tree/server-router))
```bash
npm install grapnel-server
```

## Declaring Multiple Routes

```javascript
let routes = {
    'products' : function(req) {
        // GET /file.html#products
    },
    'products/:category/:id?' : function(req) {
        // GET /file.html#products/widgets/35
        console.log(req.params.category);
        // => widgets
    }
}

Grapnel.listen(routes);
```

## Event Handling

```javascript
const router = new Grapnel({ pushState : true, root : '/' });

router.on('navigate', function(event){
    // GET /foo/bar
    console.log('URL changed to %s', this.path());
    // => URL changed to /foo/bar
});
```

## RegExp Support

Grapnel allows RegEx when defining a route:

```javascript
const router = new Grapnel();
let expression = /^food\/tacos\/(.*)$/i;

router.get(expression, function(req, event){
    // GET http://mysite.com/page#food/tacos/good
    console.log('I think tacos are %s.', req.params[0]);
    // => "He thinks tacos are good."
});
```

&nbsp;

***

# Usage &amp; Tips

## Basic Configuration
```javascript
const router = new Grapnel();
```

## Enabling PushState
```javascript
const router = new Grapnel({ pushState : true });
```
You can also specify a root URL by setting it as an option:

```javascript
const router = new Grapnel({ root : '/app', pushState : true });
```
The root may require a beginning slash and a trailing slash depending on how you set up your routes.

## Middleware
Grapnel uses middleware similar to how Express uses middleware. Middleware has access to the `req` object, `route` object, and the next middleware in the call stack (commonly denoted as `next`). Middleware must call `next()` to pass control to the next middleware, otherwise the router will stop.

For more information about how middleware works, see [Using Middleware](http://expressjs.com/guide/using-middleware.html).
```javascript
let user = function(req, route, next) {
    user.get(function(err) {
        req.user = this;
        next();
    });
}

router.get('/user/*', user, function(req) {
    console.log(req.user);
});
```

## Declaring your routes with an object literal:

```javascript
Grapnel.listen({
    'products/:id' : function(req) {
        // Handler
    }
});
```
When declaring routes with a literal object, router options can be passed as the first parameter:
```javascript
let opts = { pushState : true };

Grapnel.listen(opts, routes);
```

## Navigation
If pushState is enabled, you can navigate through your application with `router.navigate`:
```javascript
router.navigate('/products/123');
```

## Stopping a Route Event
```javascript
router.on('match', function(routeEvent) {
    routeEvent.preventDefault(); // Stops event handler
});
```

## Stopping Event Propagation
```javascript
router.get('/products/:id', function(req, routeEvent) {
    routeEvent.stopPropagation(); // Stops propagation of the event
});

router.get('/products/widgets', function(req, routeEvent) {
    // This will not be executed
});

router.navigate('/products/widgets');
```

## 404 Pages
You can specify a route that only uses a wildcard `*` as your final route, then use `route.parent()` which returns `false` if the call stack doesn't have any other routes to run.
```javascript
let routes = {
    '/' : function(req, route) {
        // Handle route
    },
    '/store/products/:id' : function(req, route) {
        // Handle route
    },
    '/category/:id' : function(req, route) {
        // Handle route
    },
    '/*' : function(req, route) {
        if(!route.parent()){
            // Handle 404
        }
    }
}

Grapnel.listen({ pushState : true }, routes);
```

## Setting window state
```javascript
router.navigate('/', {
    state: { ...windowState }
});
```

&nbsp;

***

# Documentation

##### `get` Adds a listeners and middleware for routes
```javascript
/**
 * @param {String|RegExp} path
 * @param {Function} [[middleware], callback]
*/
router.get('/store/:category/:id?', function(req, route){
    let category = req.params.category;
    let id = req.params.id;

    console.log('Product #%s in %s', id, category);
});
```

##### `navigate` Navigate through application
```javascript
/**
 * @param {String} path relative to root
 * @param {Object} options navigation options
*/
router.navigate('/products/123', ...options);
```

##### `on` Adds a new event listener
```javascript
/**
 * @param {String} event name (multiple events can be called when separated by a space " ")
 * @param {Function} callback
*/
router.on('myevent', function(event) {
    console.log('Grapnel works!');
});
```

##### `once` A version of `on` except its handler will only be called once
```javascript
/**
 * @param {String} event name (multiple events can be called when separated by a space " ")
 * @param {Function} callback
*/
router.once('init', function() {
    console.log('This will only be executed once');
});
```

##### `emit` Triggers an event
```javascript
/**
 * @param {String} event name
 * @param {...Mixed} attributes Parameters that will be applied to event handler
*/
router.emit('event', eventArg1, eventArg2, ...etc);
```

##### `context` Returns a function that can be called with a specific route in context.
Both the `router.context` method and the function it returns can accept middleware. **Note: when calling `route.context`, you should omit the trailing slash.**
```javascript
/**
 * @param {String} Route context (without trailing slash)
 * @param {[Function]} Middleware (optional)
 * @return {Function} Adds route to context
*/
let usersRoute = router.context('/user/:id');

usersRoute('/followers', function(req, route) {
    console.log('Followers', req.params.id);
});

router.navigate('/user/13589/followers');
// => Followers 13589
```

##### `path`
* `router.path('string')` Sets a new path or hash
* `router.path()` Gets path or hash
* `router.path(false)` Clears the path or hash

##### `bind` An alias of `on`
##### `trigger` An alias of `emit`
##### `add` An alias of `get`

## Options
* `pushState` Enable pushState, allowing manipulation of browser history instead of using the `#` and `hashchange` event
* `root` Root of your app, all navigation will be relative to this
* `target` Target object where the router will apply its changes (default: `window`)
* `hashBang` Enable `#!` as the anchor of a `hashchange` router instead of using just a `#`

## Events
* `navigate` Fires when router navigates through history
* `match` Fires when a new match is found, but before the handler is called
* `hashchange` Fires when hashtag is changed

## License
##### [MIT License](http://opensource.org/licenses/MIT)

