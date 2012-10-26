Grapnel-js
==========

A lightweight library to allow hooks to be added to hashtags.

## An example:

```javascript
    var myhook = new Grapnel(':');
    
    myhook.add('eat', function(action){
        console.log('Someone just ate a %s.', this.value);
    });
```

#### URL:

A URL with a hashtag formatted below:

```bash
http://domain.com/page#eat:taco
```

Would log in console

```bash
Someone just ate a taco.
```