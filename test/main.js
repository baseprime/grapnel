
;(function(){

    require(['./grapnel'], function(Grapnel){

        var router = new Grapnel({ pushState : true }),
            hashRouter = new Grapnel(),
            routerWithRoot = new Grapnel({ pushState : true, root : '/myroot' }),
            hashBangRouter = new Grapnel({ hashBang : true });

        module('Initialization');

        test('Grapnel initializes in AMD environment', function(){
            ok(router);
            ok(hashRouter);
            ok(routerWithRoot);
            ok(hashBangRouter);
        });

        test('Does not pollute global namespace', function(){
            ok('undefined' === typeof window.Grapnel);
        });

        test('Loads into globals', function(assert){
            var done = assert.async();

            $(function(){
                $(document.createElement('script')).attr({ type : 'text/javascript', src : './grapnel.js' }).appendTo('body');
                ok('function' === typeof window.Grapnel);
                done();
            });
        });

        module('Routes');

        // Detect if second /multi/cancel handler is being called
        var paramNotRequired,
            paramWildcard,
            multiFnCalled = false,
            hashMultiFnCalled = false,
            defaultPreventedFnCalled = false,
            onceTimesRan = 0;

        router.get('/settings/regexp/:named1/:named2/:named3/:not_required?', function(req, e){
            equal(req.params.named1, 'one');
            equal(req.params.named2, 'two');
            equal(req.params.named3, 'three');
            ok((req.params.not_required === undefined || req.params.not_required === 'four'));
            paramNotRequired = req.params.not_required;
        });

        router.get('/settings/wildcard/*', function(req, e){
            paramWildcard = req.params[0];
        });

        router.get('/once', function(req, e){
            onceTimesRan++;
        });

        router.get('/multi', function(req, e){
            equal(e.parent(), false);
        });

        router.get('/multi', function(req, e){
            ok('object' === typeof e.parent());
        });

        router.get('/multi', function(req, e){
            ok('object' === typeof e.parent());
        });

        router.get('/multi/cancel', function(req, e){
            e.stopPropagation();
        });

        router.get('/multi/cancel', function(req, e){
            multiFnCalled = true;
        });

        router.get('/multi/cancel', function(req, e){
            multiFnCalled = true;
        });

        router.get('/multi/cancel', function(req, e){
            multiFnCalled = true;
        });

        hashRouter.get('/multi/cancel', function(req, e){
            e.stopPropagation();
        });

        hashRouter.get('/multi/cancel', function(req, e){
            hashMultiFnCalled = true;
        });

        hashRouter.get('/multi/cancel', function(req, e){
            hashMultiFnCalled = true;
        });

        hashRouter.get('/multi/cancel', function(req, e){
            hashMultiFnCalled = true;
        });

        router.bind('match', function(e){
            if(e.route === '/default/prevent') e.preventDefault();
        });

        router.get('/default/prevent', function(req, e){
            defaultPreventedFnCalled = true;
        });

        routerWithRoot.get('/testroot', function(req, e){
            equal(window.location.pathname, '/myroot/testroot');
        });

        router.bind('myevent', function(){
            ok(true);
        });

        router.bind('myotherevent', function(obj){
            ok(obj.test);
        });

        test('Named parameters functions correctly', function(assert){
            var done = assert.async();
            router.navigate('/settings/regexp/one/two/three');
            setTimeout(function(){
                router.navigate('/settings/regexp/one/two/three/four');
                equal(paramNotRequired, 'four');
                router.navigate('/settings/wildcard/test123');
                equal(paramWildcard, 'test123');
                router.navigate('/settings/wildcard/test123/test456');
                equal(paramWildcard, 'test123/test456');
                done();
            }, 30);
        });

        test('Multiple routes can be called', function(){
            router.navigate('/multi');
        });

        test('Prevent propagation (pushState)', function(assert){
            router.navigate('/multi/cancel');
            equal(multiFnCalled, false);
        });

        test('Prevent propagation (hashChange)', function(assert){
            hashRouter.navigate('/multi/cancel');
            equal(hashMultiFnCalled, false);
        });

        test('Prevent default handler', function(assert){
            router.navigate('/default/prevent');
            equal(defaultPreventedFnCalled, false);
        });

        test('Router only fires handler once', function(){ 
            router.navigate('/once');
            equal(onceTimesRan, 1);
        });

        test('Root is valid', function(){
            routerWithRoot.navigate('/testroot');
        });

        test('hashChange router can use #! instead of #', function(){
            hashBangRouter.navigate('hashbang/test');
            equal(window.location.hash, '#!hashbang/test');
            hashBangRouter.fragment.set('test2');
            equal(window.location.hash, '#!test2');
            hashBangRouter.fragment.clear();
            equal(window.location.hash, '#!');
        });

        test('Calls routes on window navigation', function(){
            var count = 0;

            router.get('/history/back/*', function(req, event){
                count++;
            });

            router.get('/history/forward/*', function(req, event){
                count--;
            });

            router.navigate('/history/back/' + Math.random());
            equal(count, 1);
            router.navigate('/history/forward/' + Math.random());
            equal(count, 0);
            window.history.back();
            equal(count, 1);
            window.history.forward();
            equal(count, 0);
        });

        module('Middleware');

        test('Middleware is called', function(assert){

            var middleware = function(req, event, next){
                req.fn1 = true;
                next();
            }

            router.get('/middleware', middleware, function(req, event){
                equal(req.fn1, true);
            }).navigate('/middleware');
        });

        test('Middleware next() works correctly', function(assert){

            var done = assert.async(),
                testObj = {},
                lastInStackCalled = false;

            var fn1 = function(req, event, next){
                testObj.fn1 = true;
                next();
            }

            var fn2 = function(req, event, next){
                testObj.fn2 = true;
                next();
            }

            var fn3 = function(req, event, next){
                testObj.fn3 = true;
            }

            router.get('/middleware/next', fn1, fn2, fn3, function(req, event){
                lastInStackCalled = true;
            }).navigate('/middleware/next');

            setTimeout(function(){
                equal(testObj.fn1, true);
                equal(testObj.fn2, true);
                equal(testObj.fn3, true);
                equal(lastInStackCalled, false);
                done();
            }, 500);
        });

        module('Events');

        test('Custom events fire', function(){
            router.trigger('myevent');
        });

        test('Custom events accept objects', function(){
            router.trigger('myotherevent', { test : true });
        });

        QUnit.done(function(){
            router.fragment.clear();
            hashRouter.fragment.clear();
        });
    });

})();