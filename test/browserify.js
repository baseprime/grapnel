
var Grapnel = require('./grapnel'),
    router = new Grapnel();

router.get('*', function(){
    console.log('Hello World!');
});

console.log(router);