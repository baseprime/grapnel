Grapnel.js
==========

A lightweight JavaScript library making it easy to run events based on a specific URL hashtag.

## An example:

#### Basic usage

```javascript
var hook = new Grapnel(':');

hook.add('show', function(value){
    console.log('Showing: %s', this.value);
});
```

The URL
```bash
http://mysite.com/products#show:widgets
```

Would log in console

```bash
Showing: widgets
```

#### RegEx

```javascript
var expression = /are/g;
var hook = new Grapnel(expression);

hook.add('tacos', function(value){
    console.log('Someone thinks %s are %s.', this.action, this.value);
});
```

The URL
```bash
http://domain.com/page#tacosaregood
```

Would log in console

```bash
Someone thinks tacos are good.
```

#### Simple JavaScript Router using jQuery

```html
<!DOCTYPE html>
<html>
<head>
<title>This is a static page</title>
<script type="text/javascript" src="/path/to/Grapnel.js"></script>
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js"></script>
<script type="text/javascript">
var router = new Grapnel('/');

router.add('products', function(){
    var page = this.value + '.html';
    // GET widgets.html
    $('body').load(page);
});
</script>
</head>
<body>
<h1>This is a static page</h1>
<p><a href="#products/widgets">Click Here to view my widgets</a></p>
</body>
</html>
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

## Methods
##### `add` Adds a new action listener
```javascript
/**
 * @param {String} action
 * @param {Function} callback
*/
hook.add('find', function(){
    // this.value, this.action, this.hook
    // this.matches();
    // this.setAnchor('something');
    // this.clearAnchor();
    console.log('Finding %s', this.value);
});
```

##### `on` Adds a new event listener
```javascript
/**
 * @param {String|Array} event
 * @param {Function} callback
*/
hook.on('match', function(value, action){
    console.log('Grapnel.js works! (Hook: "%s", Action: "%s", Value: "%s")', this.hook, action, value);
});
```
##### `matches` Return array of matching actions
##### `setAnchor` Sets a new absolute anchor
##### `getAnchor` Get absolute anchor
##### `clearAnchor` Clears the anchor (replaces URL with #! appended to it)

## Events

##### `match` A matched hook is found
##### `hashchange` Anchor hashtag is changed

## License
##### [MIT License](http://opensource.org/licenses/MIT)

## Todo

##### Add support for older browsers not supporting `window.onhashchange` (IE lte 7.0)

## Changelog

## 0.1.1
* Compatibility: Map Array workaround for compatibility issues with archaic browsers

## 0.1.0
* Initial release