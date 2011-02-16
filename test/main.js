;(function() {
    var router = new Grapnel({
            pushState: true,
        }),
        hashRouter = new Grapnel(),
        routerWithRoot = new Grapnel({
            pushState: true,
            root: '/myroot',
        }),
        hashBangRouter = new Grapnel({
            hashBang: true,
        })

    module('Initialization')

    test('Loads into globals', function(assert) {
        var done = assert.async()

        $(function() {
            $(document.createElement('script'))
                .attr({
                    type: 'text/javascript',
                    src: './grapnel.js',
                })
                .appendTo('body')
            ok('function' === typeof window.Grapnel)
            done()
        })
    })

    test('Environment is correct', function() {
        ok(router.options.env === 'client' && router.options.mode === 'pushState')
        ok(hashRouter.options.env === 'client' && hashRouter.options.mode === 'hashchange')
        ok(routerWithRoot.options.env === 'client' && routerWithRoot.options.mode === 'pushState')
        ok(hashBangRouter.options.env === 'client' && hashBangRouter.options.mode === 'hashchange')
    })

    module('Routes')

    // Detect if second /multi/cancel handler is being called
    var paramNotRequired,
        paramWildcard,
        multiFnCalled = false,
        hashMultiFnCalled = false,
        defaultPreventedFnCalled = false,
        onceTimesRan = 0,
        routeHandlerContextIsSelf = false,
        contextHandlerContextIsSelf = false

    router.get('/settings/regexp/:named1/:named2/:named3/:not_required?', function(req, e) {
        equal(req.params.named1, 'one')
        equal(req.params.named2, 'two')
        equal(req.params.named3, 'three')
        ok(req.params.not_required === undefined || req.params.not_required === 'four')
        paramNotRequired = req.params.not_required
    })

    router.get('/settings/wildcard/*', function(req, e) {
        paramWildcard = req.params[0]
    })

    router.get('/once', function(req, e) {
        onceTimesRan++
    })

    router.get('/multi', function(req, e) {
        equal(e.parent(), false)
    })

    router.get('/multi', function(req, e) {
        ok('object' === typeof e.parent())
    })

    router.get('/multi', function(req, e) {
        ok('object' === typeof e.parent())
    })

    router.get('/multi/cancel', function(req, e) {
        e.stopPropagation()
    })

    router.get('/multi/cancel', function(req, e) {
        multiFnCalled = true
    })

    router.get('/multi/cancel', function(req, e) {
        multiFnCalled = true
    })

    router.get('/multi/cancel', function(req, e) {
        multiFnCalled = true
    })

    hashRouter.get('/multi/cancel', function(req, e) {
        e.stopPropagation()
    })

    hashRouter.get('/multi/cancel', function(req, e) {
        hashMultiFnCalled = true
    })

    hashRouter.get('/multi/cancel', function(req, e) {
        hashMultiFnCalled = true
    })

    hashRouter.get('/multi/cancel', function(req, e) {
        hashMultiFnCalled = true
    })

    router.bind('match', function(e) {
        if (e.route === '/default/prevent') e.preventDefault()
    })

    router.get('/default/prevent', function(req, e) {
        defaultPreventedFnCalled = true
    })

    router.get('/routes/context', function() {
        routeHandlerContextIsSelf = this === router
    })

    router.context('/routes/context')('/context', function() {
        contextHandlerContextIsSelf = this === router
    })

    routerWithRoot.get('/testroot', function(req, e) {
        equal(window.location.pathname, '/myroot/testroot')
    })

    router.bind('myevent', function() {
        ok(true)
    })

    router.bind('myotherevent', function(obj) {
        ok(obj.test)
    })

    test('Named parameters functions correctly', function(assert) {
        var done = assert.async()
        router.navigate('/settings/regexp/one/two/three')
        setTimeout(function() {
            router.navigate('/settings/regexp/one/two/three/four')
            equal(paramNotRequired, 'four')
            router.navigate('/settings/wildcard/test123')
            equal(paramWildcard, 'test123')
            router.navigate('/settings/wildcard/test123/test456')
            equal(paramWildcard, 'test123/test456')
            done()
        }, 30)
    })

    test('Multiple routes can be called', function() {
        router.navigate('/multi')
    })

    test('Prevent propagation (pushState)', function(assert) {
        router.navigate('/multi/cancel')
        equal(multiFnCalled, false)
    })

    test('Prevent propagation (hashChange)', function(assert) {
        hashRouter.navigate('/multi/cancel')
        equal(hashMultiFnCalled, false)
    })

    test('Prevent default handler', function(assert) {
        router.navigate('/default/prevent')
        equal(defaultPreventedFnCalled, false)
    })

    test('Router only fires handler once', function() {
        router.navigate('/once')
        equal(onceTimesRan, 1)
    })

    test('Root is valid', function() {
        routerWithRoot.navigate('/testroot')
    })

    test('hashChange router can use #! instead of #', function() {
        hashBangRouter.navigate('hashbang/test')
        equal(window.location.hash, '#!hashbang/test')
        hashBangRouter.path('test2')
        equal(window.location.hash, '#!test2')
        hashBangRouter.path(false)
        equal(window.location.hash, '#!')
    })

    test('Calls routes in correct order on window navigation', function(assert) {
        var count = 0,
            done = assert.async()

        router.get('/history/up', function(req, event) {
            count++
        })

        router.get('/history/down', function(req, event) {
            count--
        })

        router.navigate('/history/up')
        router.navigate('/history/up')
        equal(count, 2)
        router.navigate('/history/down')
        equal(count, 1)
        done()
        // window.history.back()
        // setTimeout(function() {
        //     equal(count, 2)
        //     window.history.forward()
        //     setTimeout(function() {
        //         equal(count, 1)
        //         done()
        //     }, 1000)
        // }, 1000)
    })

    test('Routes can be created with context', function(assert) {
        var usersRoute = router.context('/context/users/:id'),
            timesRan = 0,
            val = ''

        usersRoute('/test', function(req, e) {
            timesRan++
            val = req.params.id
        })

        usersRoute('/', function(req, e) {
            // This should not run
            timesRan++
        })

        router.navigate('/context/users/5/test')

        equal(timesRan, 1)
        equal(val, '5')
    })

    test('Route handler is bound to router', function() {
        router.navigate('/routes/context')
        equal(routeHandlerContextIsSelf, true)
        router.navigate('/routes/context/context')
        equal(contextHandlerContextIsSelf, true)
    })

    module('Middleware')

    test('Middleware is called', function(assert) {
        var middleware = function(req, event, next) {
            console.log('mw1')
            req.fn1 = true
            next()
        }

        var middleware2 = function(req, event, next) {
            console.log('mw2')
            next()
        }

        router
            .get('/middleware', middleware, middleware2, function(req, event) {
                equal(req.fn1, true)
            })
            .navigate('/middleware')
    })

    test('Middleware next() works correctly', function(assert) {
        var done = assert.async(),
            testObj = {},
            lastInStackCalled = false

        var fn1 = function(req, event, next) {
            testObj.fn1 = true
            next()
        }

        var fn2 = function(req, event, next) {
            testObj.fn2 = true
            next()
        }

        var fn3 = function(req, event, next) {
            testObj.fn3 = true
        }

        router
            .get('/middleware/next', fn1, fn2, fn3, function(req, event) {
                lastInStackCalled = true
            })
            .navigate('/middleware/next')

        setTimeout(function() {
            equal(testObj.fn1, true)
            equal(testObj.fn2, true)
            equal(testObj.fn3, true)
            equal(lastInStackCalled, false)
            done()
        }, 500)
    })

    test('Global middleware works correctly', function() {
        var gmsTimesRan = 0

        Grapnel.CallStack.global.push(function(req, e, next) {
            gmsTimesRan++
            next()
        })

        router.get('/middleware/global/test', function(req, e) {
            gmsTimesRan++
        })

        router.navigate('/middleware/global/test')

        equal(gmsTimesRan, 1)
    })

    test('Context route accepts middleware', function(assert) {
        var timesRan = 0,
            val = ''

        function testMiddleWare(req, e, next) {
            timesRan++
            next()
        }

        var mwTestRoute = router.context('/context/middleware', testMiddleWare, testMiddleWare, testMiddleWare, testMiddleWare, testMiddleWare, testMiddleWare, testMiddleWare)

        mwTestRoute('/test', function(req, e) {
            timesRan++
        })

        router.navigate('/context/middleware/test')

        equal(timesRan, 8)
    })

    module('Events')

    test('Custom events fire', function() {
        router.trigger('myevent')
    })

    test('Custom events accept objects', function() {
        router.trigger('myotherevent', {
            test: true,
        })
    })

    test('Once event only fires event once', function() {
        var ran = 0

        router
            .once('eventonce', function() {
                ran++
            })
            .trigger('eventonce')
            .trigger('eventonce')
            .trigger('eventonce')

        equal(ran, 1)
    })

    QUnit.done(function() {
        router.path(false)
        hashRouter.path(false)
    })
})()
