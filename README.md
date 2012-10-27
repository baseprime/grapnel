Grapnel.js
==========

A lightweight JavaScript library for adding action hooks in URL hashtags/anchors.

## An example:

#### Basic usage

```javascript
var myhook = new Grapnel(':');

myhook.add('eat', function(value){
    console.log('Someone just ate a %s.', this.value);
});
```

A URL with a hashtag formatted below:

```bash
http://domain.com/page#eat:taco
```

Would log in console

```bash
Someone just ate a taco.
```

#### RegEx

```javascript
var expression = /are/g;
var myhook = new Grapnel(expression);

myhook.add('tacos', function(value){
    console.log('Someone thinks %s are %s.', this.anchor, this.value);
});
```

```bash
http://domain.com/page#tacosaregood
```

Would log in console

```bash
Someone thinks tacos are good.
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
hook.add('find', function(){
    // this.value, this.action, this.hook
    // this.setAnchor('something');
    // this.clearAnchor();
    console.log('Finding %s', this.value);
});
```

##### `on` Adds a new event listener
```javascript
hook.on('hookfound', function(){
    console.log('Found hook: %s', this.hook);
});
```
##### `setAnchor` Sets a new absolute anchor
##### `getAnchor` Get absolute anchor
##### `clearAnchor` Clears the anchor (replaces URL with #! appended to it)

## Events

##### `hookfound` A matched hook is found
##### `hashchange` Anchor hashtag is changed

## Todo

##### Add support for older browsers not supporting `window.onhashchange` (IE lte 7.0)