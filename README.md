Grapnel.js
==========

Simple, lightweight JavaScript Router with hash-based event handling

## An example:

#### Routing and Basic Usage

```javascript
var router = Grapnel.Router();

router.get('products/:id?', function(req){
    var id = req.params.id;
    // GET http://mysite.com/#products/134
    console.log(id);
    // => 134
});
```

#### Key/Value URL Hooks

```javascript
var hook = new Grapnel(':');

hook.add('show', function(value){
    // GET http://mysite.com/products#show:widgets
    console.log('Showing: %s', this.value);
    // => "Showing: widgets"
});
```

#### RegEx

Grapnel.js allows RegEx when defining a route, a hook, or a new action:

```javascript
var expression = /are/gi;
var hook = new Grapnel(expression);

hook.add(/tacos/gi, function(value){
    // GET http://mysite.com/page#tacosaregood
    console.log('Someone thinks %s are %s.', this.action, this.value);
    // => "Someone thinks tacos are good."
});
```

#### Simple JavaScript Router using jQuery

```html
<!DOCTYPE html>
<html>
<head>
<title>Grapnel.js - Simple Router</title>
</head>
<body>
<h1>This is a static page</h1>
<p><a href="#products/widgets">Click Here to view my widgets</a></p>
<script type="text/javascript" src="path/to/Grapnel.js"></script>
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js"></script>
<script type="text/javascript">
var router = new Grapnel.Router();
// Create route
router.get('products/:page?', function(req){
    var page = req.params.page + '.html';
    // GET widgets.html
    $('body').load(page);
});
</script>
</body>
</html>
```

#### Named Parameters/RegEx style routes
Grapnel.js supports regex style routes. The properties are mapped to the parameters in the request.
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

&nbsp;

***

# Documentation

## Instantiation
Initializing Grapnel.js is easy. To create an instance:
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
router.get('store/:category/:id?', function(req){
    var category = req.params.category,
        id = req.params.id;

    console.log('Product #%s in %s', id, category);
});
```

##### `add` Adds a new basic key/value action listener
```javascript
/**
 * @param {String|RegExp} action
 * @param {Function} callback
*/
hook.add('find', function(value, action, regexMatches){
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
##### `change` Fires when state changes, before matched route/action handler is called
##### `hashchange` Fires when hashtag is changed
##### `parse` Fires when a URL is parsed

## License
##### [MIT License](http://opensource.org/licenses/MIT)

## Todo
##### Add support for older browsers not supporting `window.onhashchange` (IE lte 7.0)

