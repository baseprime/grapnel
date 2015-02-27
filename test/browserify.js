
var Grapnel = require('./grapnel'),
    router = new Grapnel({ pushState : true });

router.get('/browserify.html', function(){
    console.log('Hello World!');
});
