Grapnel.js
==========

Simple, lightweight JavaScript Router

## Features &amp; Basic Usage

#### Router

```javascript
var router = new Grapnel.Router();

router.get('products/:id?', function(req){
    var id = req.params.id;
    // GET http://mysite.com/#products/134
    console.log(id);
    // => 134
});
```

#### Basic URL Hook

```javascript
var hook = new Grapnel(':');

hook.add('show', function(value, params, event){
    // GET http://mysite.com/products#show:widgets
    console.log('Showing: %s', this.value);
    // => "Showing: widgets"
});
```

#### Named Parameters
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

#### RegEx

Grapnel.js allows RegEx when defining a route, a hook, or a new action:

```javascript
var expression = /are/gi;
var hook = new Grapnel(expression);

hook.add(/tacos/gi, function(value, params, event){
    // GET http://mysite.com/page#tacosaregood
    console.log('Someone thinks %s are %s.', this.action, this.value);
    // => "Someone thinks tacos are good."
});
```

&nbsp;

***

# Documentation

## Creating an instance
```javascript
// First argument can be a String or RegEx (Default: ":")
var hook = new Grapnel();
```
This is the basic configuration for Grapnel.js which allows for basic hash key/value event handling. Routing can be enabled by calling the `router()` method when creating an instance.

## Routing
Grapnel.js allows URL hash routing. This also enables `get` method
```javascript
var router = new Grapnel.Router();
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

##### `add` Adds a new basic key/value hook
```javascript
/**
 * @param {String|RegExp} action
 * @param {Function} callback
*/
hook.add('find', function(value, action, event){
    // this.matches();
    // this.anchor.set('something');
    // this.anchor.clear();
    console.log('Finding %s', this.value);
});
```

##### `on` Adds a new event listener
```javascript
/**
 * @param {String|Array} event
 * @param {Function} callback
*/
hook.on('change', function(event){
    console.log('Grapnel.js works!');
});
```
##### `matches` Return array of matching action listeners
##### `parse` Reparse URL
##### `anchor`
* `defaultHash` Static anchor during initialization
* `set` Sets a new absolute anchor
* `get` Get absolute anchor
* `clear` Clears the anchor

## Events
##### `change` Fires when state changes, before a new matched route/action handler is called
##### `hashchange` Fires when hashtag is changed
##### `parse` Fires when a URL is parsed

## License
##### [MIT License](http://opensource.org/licenses/MIT)

