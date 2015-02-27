Grapnel.js
==========

#### The smallest (1100 bytes gzipped!) Client/Server-Side JavaScript Router with Named Parameters, HTML5 pushState, and Middleware support.

## Download/Installation

**Download Source:**

- [Production](https://raw.githubusercontent.com/EngineeringMode/Grapnel.js/master/dist/grapnel.min.js)
- [Development](https://raw.githubusercontent.com/EngineeringMode/Grapnel.js/master/src/grapnel.js)

**Install with npm**
```bash
npm install grapnel
```
**Or by using bower:**
```bash
bower install grapnel
```

# Grapnel.js Features

- Supports routing using `pushState` or `hashchange` concurrently
- Supports Named Parameters similar to Sinatra, Restify, and Express
- Middleware Support
- Works on the client or server-side
- Event Handling Support
- RegExp Support
- RequreJS/AMD, Browserify, and CommonJS Compatibility
- Supports `#` or `#!` for `hashchange` routing
- Unobtrusive, supports multiple routers on the same page
- No dependencies

## Basic Router

```javascript
var router = new Grapnel();

router.get('products/:category/:id?', function(req){
    var id = req.params.id,
        category = req.params.category;
    // GET http://mysite.com/#products/widgets/134
    console.log(category, id);
    // => widgets 134
});
```

## Using pushState

```javascript
var router = new Grapnel({ pushState : true });

router.get('/products/:category/:id?', function(req){
    var id = req.params.id,
        category = req.params.category

    console.log(category, id);
});

router.navigate('/products/widgets/134');
// => widgets 134
```

## Named Parameters

Grapnel.js supports regex style routes similar to Sinatra, Restify, and Express. The properties are mapped to the parameters in the request.
```javascript
router.get('products/:id?', function(req){
    // GET /file.html#products/134
    req.params.id
    // => 134
});

router.get('products/*', function(req){
    // The wildcard/asterisk will match anything after that point in the URL
    // Parameters are provided req.params using req.params[n], where n is the nth capture
});
```

## Middleware Support

Grapnel.js also supports middleware:

```javascript
var auth = function(req, event, next){
    user.auth(function(err){
        req.user = this;
        next();
    });
}

router.get('/*', auth, function(req){
    console.log(req.user);
});
```

## Works as a basic server-side router

```javascript
// Simple "Hello World!" app
var http = require('http'),
    Grapnel = require('grapnel'),
    router = new Grapnel();

router.get('/', function(req, event){
    req.response.end('Hello world!')
});

http.createServer(function(req, res){
    router.bind('match', function(event, _req){
        _req.response = res;
    }).navigate(req.url);
}).listen(3000);
```

## Declaring Multiple Routes

```javascript
var routes = {
    'products' : function(req){
        // GET /file.html#products
    },
    'products/:category/:id?' : function(req){
        // GET /file.html#products/widgets/35
        req.params.category
        // => widgets
    }
}

Grapnel.listen(routes);
```

## Event Handling

```javascript
var router = new Grapnel({ pushState : true, root : '/' });

router.on('navigate', function(event){
    // GET /foo/bar
    console.log('URL changed to %s', this.fragment.get());
    // => URL changed to /foo/bar
});
```

## RegExp Support

Grapnel.js allows RegEx when defining a route:

```javascript
var expression = /^food\/tacos\/(.*)$/i;
var router = new Grapnel();

router.get(expression, function(req, event){
    // GET http://mysite.com/page#food/tacos/good
    console.log('I think tacos are %s.', req.params[0]);
    // => "He thinks tacos are good."
});
```

## Route Context

You can even add context to a route:

```javascript
var router = new Grapnel({ pushState : true });
var foodRoute = router.context('/food');

foodRoute(':foodname', function(req, event){
    console.log(req.params.foodname);
});

router.navigate('/food/tacos');
// => This taco thing is getting out of hand.
```

## RequireJS/AMD, Browserify, and CommonJS Compatibility

```javascript
require(['lib/grapnel'], function(Grapnel){

    var router = new Grapnel({ pushState : true });

    router.bind('navigate', function(){
        console.log('It works!');
    });

    router.navigate('/');

});
```

&nbsp;

***

# Usage &amp; Tips

## Basic Configuration
```javascript
var router = new Grapnel();
```
Or you can declare your routes with a literal object:

```javascript
Grapnel.listen({
    'products/:id' : function(req){
        // Handler
    }
});
```
When declaring routes with a literal object, router options can be passed as the first parameter:
```javascript
var opts = { pushState : true };

Grapnel.listen(opts, routes);
```

## Enabling PushState
```javascript
var router = new Grapnel({ pushState : true });
```
You can also specify a root URL by setting it as an option:

```javascript
var router = new Grapnel({ root : '/public/search/', pushState : true });
```
The root may require a beginning slash and a trailing slash depending on how your application utilizes the router.

## Middleware
Grapnel uses middleware similar to how Express uses middleware. Middleware has access to the `req` object, `event` object, and the next middleware in the call stack (commonly denoted as `next`). Middleware must call `next()` to pass control to the next middleware, otherwise the router will stop.

For more information about how middleware works, see [Using Middleware](http://expressjs.com/guide/using-middleware.html).
```javascript
var user = function(req, event, next){
    user.get(function(err){
        req.user = this;
        next();
    });
}

router.get('/user/*', user, function(req){
    console.log(req.user);
});
```

## Navigation
If pushState is enabled, you can navigate through your application with `router.navigate`:
```javascript
router.navigate('/products/123');
```

## Stopping a Route Event
```javascript
router.on('match', function(event){
    event.preventDefault(); // Stops event handler
});
```

## Stopping Event Propagation
```javascript
router.get('/products/:id', function(req, event){
    event.stopPropagation(); // Stops propagation of the event
});

router.get('/products/widgets', function(req, event){
    // This will not be executed
});

router.navigate('/products/widgets');
```

## 404 Pages
You can specify a route that only uses a wildcard `*` as your final route, then use `event.parent()` which returns `false` if the call stack doesn't have any other routes to run.
```javascript
var routes = {
    '/' : function(req, e){
        // Handle route
    },
    '/store/products/:id' : function(req, e){
        // Handle route
    },
    '/category/:id' : function(req, e){
        // Handle route
    },
    '/*' : function(req, e){
        if(!e.parent()){
            // Handle 404
        }
    }
}

Grapnel.listen({ pushState : true }, routes);
```

## Adding HTTP verb support for client-side routers
You can add HTTP verb (GET, POST, PUT, DELETE) support to a router by adding middleware to a router.verb() method.
```javascript
var http = require('http'),
    Grapnel = require('grapnel'),
    router = new Grapnel();

// Adds middleware to each router.verb() method
['GET', 'POST', 'PUT', 'DELETE'].forEach(function(verb){
    router[verb.toLowerCase()] = function(){
        var args = Array.prototype.slice.call(arguments);
    
        args.splice(1, 0, function(req, res, next){
            if(req.method === verb) next();
        });

        return this.add.apply(this, args);
    }
});

router.post('/', function(req, event){
    req.response.end('Hello world!');
});

http.createServer(function(req, res){
    router.bind('match', function(event, _req){
        _req.response = res;
        for(var prop in req){
            _req[prop] = req[prop];
        }
    }).navigate(req.url);
}).listen(3000);
```

&nbsp;

***

# API Documentation

##### `get` Adds a listeners and middleware for routes
```javascript
/**
 * @param {String|RegExp} path
 * @param {Function} [[middleware], callback]
*/
router.get('/store/:category/:id?', function(req, event){
    var category = req.params.category,
        id = req.params.id;

    console.log('Product #%s in %s', id, category);
});
```

##### `navigate` Navigate through application
```javascript
/**
 * @param {String} path relative to root
*/
router.navigate('/products/123');
```

##### `bind` Adds a new event listener
```javascript
/**
 * @param {String} event name (multiple events can be called when seperated by a space " ")
 * @param {Function} callback
*/
router.bind('myevent', function(event){
    console.log('Grapnel.js works!');
});
```

##### `trigger` Triggers an event
```javascript
/**
 * @param {String} event name (multiple events can be called when seperated by a space " ")
 * @param {Mixed} [attributes] Parameters that will be applied to event handler
*/
router.trigger('event otherevent', eventArg1, eventArg2);
```

##### `context` Returns a function that can be called with a specific route in context
```javascript
/**
 * @param {String} Route context
 * @return {Function} Adds route to context
*/
var searchFn = router.context('/search');

searchFn(':keyword', function(req, event){
    console.log(req.params.keyword);
});

router.navigate('/search/widgets');
// => widgets
```

##### `on` An alias of `bind`
##### `add` An alias of `get`
##### `fragment`
* `set` Sets a new absolute URL or Hash
* `get` Get absolute URL or Hash
* `clear` Clears the URL or Hash

## Options
* `pushState` Enable pushState, allowing manipulation of browser history instead of using the `#` and `hashchange` event
* `root` Root of your app, all navigation will be relative to this
* `hashBang` Enable `#!` as the anchor of a `hashchange` router instead of using just a `#`

## Events
* `navigate` Fires when router navigates through history
* `match` Fires when a new match is found, but before the handler is called
* `hashchange` Fires when hashtag is changed

## License
##### [MIT License](http://opensource.org/licenses/MIT)

