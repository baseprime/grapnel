Grapnel.js
==========

#### The smallest (1100 bytes gzipped!) JavaScript Router with Named Parameters & pushState support.

## Download

- [Production](https://raw.githubusercontent.com/EngineeringMode/Grapnel.js/master/dist/grapnel.min.js)
- [Development](https://raw.githubusercontent.com/EngineeringMode/Grapnel.js/master/src/grapnel.js)

# Grapnel.js Features

- Supports routing using `pushState` or `hashchange` concurrently
- Supports Named Parameters similar to Sinatra, Restify, and Express
- Event Handling Support
- RegExp Support
- RequreJS/AMD and CommonJS Compatibility
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

## Advanced Routing using pushState

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

## RequireJS/AMD and CommonJS Compatibility

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

## Installation

```bash
bower install grapnel
```

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

## Navigation
If pushState is enabled, you can navigate through your application with `router.navigate`:
```javascript
router.navigate('/products/123');
```

## Stopping a Route Event
```javascript
router.on('match', function(event){
    event.preventDefault(); // Stops propagation of the event
});
```

&nbsp;

***

# API Documentation

##### `get` Adds a new route listener
```javascript
/**
 * @param {String|RegExp} path
 * @param {Function} callback
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
##### `fragment` or `hash` or `anchor` (aliased to reduce confusion in different routing modes)
* `set` Sets a new absolute URL or Hash
* `get` Get absolute URL or Hash
* `clear` Clears the URL or Hash

## Events
##### `navigate` Fires when router navigates through history
##### `match` Fires when a new match is found, but before the handler is called
##### `hashchange` Fires when hashtag is changed

## License
##### [MIT License](http://opensource.org/licenses/MIT)

