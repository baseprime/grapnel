Grapnel.js
==========

#### The smallest (1100 bytes gzipped!) JavaScript Router with Named Parameters & Event Listening. Lots of other Features too!

# Features &amp; Basic Usage

## Router

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

## Named Parameters
Grapnel.js supports regex style routes similar to Sinatra or Express. The properties are mapped to the parameters in the request.
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
var router = new Grapnel();

router.on('hashchange', function(event){
    // GET /file.html#products
    console.log('Anchor changed to %s', this.anchor.get());
    // => Anchor changed to products
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
var router = new Grapnel();
var foodRoute = router.context('food');

foodRoute(':foodname', function(req, event){
    // GET /file.html#food/tacos
    req.params.foodname
    // => This taco thing is getting out of hand.
});
```

## RequireJS/AMD and CommonJS Compatibility

```javascript
require(['lib/grapnel'], function(Grapnel){

    var router = new Grapnel();

    router.bind('hashchange', function(){
        console.log('It works!');
    });

});
```

&nbsp;

***

# Documentation

## Basic Configuration
```javascript
var router = new Grapnel.Router();
```
Or you can declare your routes with a literal object:

```javascript
Grapnel.listen({
    'products/:id' : function(req){
        // Handler
    }
});
```

## Methods
##### `get` Adds a new route listener
```javascript
/**
 * @param {String|RegExp} path
 * @param {Function} callback
*/
router.get('store/:category/:id?', function(req, event){
    var category = req.params.category,
        id = req.params.id;

    console.log('Product #%s in %s', id, category);
});
```

##### `bind` Adds a new event listener
```javascript
/**
 * @param {String|Array} event
 * @param {Function} callback
*/
router.bind('hashchange', function(event){
    console.log('Grapnel.js works!');
});
```
##### `on` An alias of `bind`
##### `add` An alias of `get`
##### `anchor`
* `defaultHash` Static anchor during initialization
* `set` Sets a new absolute anchor
* `get` Get absolute anchor
* `clear` Clears the anchor
* `reset` Resets the anchor to its original state when it was loaded

## Events
##### `match` Fires when a new match is found, but before the handler is called
##### `hashchange` Fires when hashtag is changed
##### `initialized` Fires when object is initialized (this will likely be useless)

## Stopping a Route Event
```javascript
router.on('match', function(event){
    event.preventDefault(); // Stops propagation of the event
});
```

## License
##### [MIT License](http://opensource.org/licenses/MIT)

