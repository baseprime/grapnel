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

### RegEx

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