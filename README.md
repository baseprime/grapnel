Grapnel Server-Side Router Framework for Node.js
==========

#### Quick and Drity JavaScript Router for Node.js with Named Parameters and Middleware support.

## Download/Installation

**Install with npm**
```bash
npm install grapnel-server
```

# Grapnel Features

- Supports Named Parameters similar to Sinatra, Restify, and Express
- Middleware Support
- RegExp Support
- No dependencies

## Server-Side Routing

```javascript
var http = require('http'),
    app = require('grapnel-server');

app.get('/products/:category/:id?', function(req, res, next){
    var id = req.params.id,
        category = req.params.category

    console.log(category, id);

    res.end('Hello World!', 200);
});

http.createServer(app.start()).listen(3000);
```

## Named Parameters

Grapnel.js supports regex style routes similar to Sinatra, Restify, and Express. The properties are mapped to the parameters in the request.
```javascript
app.get('products/:id?', function(req, res){
    // GET /products/134
    req.params.id
    // => 134
});

app.get('products/*', function(req, res){
    // The wildcard/asterisk will match anything after that point in the URL
    // Parameters are provided req.params using req.params[n], where n is the nth capture
});
```

## Middleware Support

Grapnel.js also supports middleware:

```javascript
var auth = function(req, res, next){
    user.auth(function(err){
        req.user = this;
        next();
    });
}

app.get('/*', auth, function(req, res){
    console.log(req.user);
    res.end('Hello ' + req.user.name, 200);
});
```

## Declaring Multiple Routes

```javascript
var Grapnel = require('grapnel-server').Server;

var routes = {
    'products' : function(req, res, next){
        // GET /products
    },
    'products/:category/:id?' : function(req, res, next){
        // GET /products/widgets/35
        req.params.category
        // => widgets
    }
}

Grapnel.listen(routes);
```

## Event Handling

```javascript
var app = require('grapnel-server');

app.on('navigate', function(){
    // GET /foo/bar
    console.log('URL changed to %s', this.fragment.get());
    // => URL changed to /foo/bar
});
```

## RegExp Support

Grapnel.js allows RegEx when defining a route:

```javascript
var expression = /^\/food\/tacos\/(.*)$/i;

app.get(expression, function(req, res){
    // GET /food/tacos/good
    console.log('I think tacos are %s.', req.params[0]);
    // => "He thinks tacos are good."
});
```

## Route Context

You can even add context to a route:

```javascript
var app = require('grapnel-server');
var foodRoute = app.context('/food');

foodRoute(':foodname', function(req, res){
    // GET /food/tacos
    console.log(req.params.foodname);
    // => This taco thing is getting out of hand.
});
```

&nbsp;

***

# Usage &amp; Tips

## Middleware
Grapnel uses middleware similar to how Express uses middleware. Middleware has access to the `req` object, `event` object, and the next middleware in the call stack (commonly denoted as `next`). Middleware must call `next()` to pass control to the next middleware, otherwise the router will stop.

For more information about how middleware works, see [Using Middleware](http://expressjs.com/guide/using-middleware.html).
```javascript
var user = function(req, res, next){
    user.get(function(err){
        req.user = this;
        next();
    });
}

app.get('/user/*', user, function(req, res){
    console.log(req.user);
    res.send(req.user.name);
});
```

## Stopping a Route Event
```javascript
app.on('match', function(req){
    req.event.preventDefault(); // Stops event handler
});
```

## Stopping Event Propagation
```javascript
app.get('/products/:id', function(req, res){
    req.event.stopPropagation(); // Stops propagation of the event
});

app.get('/products/widgets', function(req, res){
    // This will not be executed
});

// GET /products/35
```

## 404 Pages
You can specify a route that only uses a wildcard `*` as your final route, then use `req.event.parent()` which returns `false` if the call stack doesn't have any other routes to run.
```javascript
var routes = {
    '/' : function(req, res){
        // Handle route
    },
    '/store/products/:id' : function(req, res){
        // Handle route
    },
    '/category/:id' : function(req, res){
        // Handle route
    },
    '/*' : function(req, res){
        if(!req.event.parent()){
            // Handle 404
        }
    }
}
```

&nbsp;

***

# API Documentation

##### `get`, `post`, `put`, `delete` (HTTP verbs) Adds a listeners and middleware for routes matching its respective HTTP verb
```javascript
/**
 * @param {String|RegExp} path
 * @param {Function} [[middleware], callback]
*/
app.get('/store/:category/:id?', function(req, res){
    var category = req.params.category,
        id = req.params.id;

    console.log('Product #%s in %s', id, category);
});

app.post('/store/:category', function(req, res){
    var category = req.params.category;

    console.log('POST Product %s', category);
});

app.put('/store/:category', function(req, res){
    var category = req.params.category,
        id = req.params.id;

    console.log('PUT Product #%s in %s', id, category);
});

app.delete('/store/:category/:id', function(req, res){
    var category = req.params.category,
        id = req.params.id;

    console.log('DELETE Product #%s in %s', id, category);
});
```

##### `on` Adds a new event listener
```javascript
/**
 * @param {String} event name (multiple events can be called when separated by a space " ")
 * @param {Function} callback
*/
router.on('myevent', function(event){
    console.log('Grapnel.js works!');
});
```

##### `once` A version of `on` except its handler will only be called once
```javascript
/**
 * @param {String} event name (multiple events can be called when separated by a space " ")
 * @param {Function} callback
*/
router.once('init', function(){
    console.log('This will only be executed once');
});
```

##### `trigger` Triggers an event
```javascript
/**
 * @param {String} event name
 * @param {Mixed} [attributes] Parameters that will be applied to event handler
*/
app.trigger('event', eventArg1, eventArg2, etc);
```

##### `context` Returns a function that can be called with a specific route in context
```javascript
/**
 * @param {String} Route context
 * @return {Function} Adds route to context
*/
var searchFn = app.context('/search');

searchFn(':keyword', function(req, res){
    res.end(req.params.keyword, 200);
});
```

##### `bind` An alias of `on`
##### `add` An alias of `get`
##### `fragment`
* `set` Sets a new absolute URL or Hash
* `get` Get absolute URL or Hash
* `clear` Clears the URL or Hash

## Events
* `navigate` Fires when http module initializes a new request
* `match` Fires when a new match is found, but before the handler is called

## License
##### [MIT License](http://opensource.org/licenses/MIT)

