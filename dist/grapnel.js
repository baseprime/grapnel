/****
* Grapnel
*
* @author Greg Sabia Tucker <greg@narrowlabs.com>
* @link https://github.com/baseprime/grapnel
* @version 0.7.6
*
* Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT
*/


!function(root) {
    var IS_MODULE = 'object' === typeof exports

    function Grapnel(options) {
        var _this = this
        this.options = options || {}
        this.options.env = this.options.env || (IS_MODULE ? 'server' : 'client')
        this.options.mode = this.options.mode || (!!(this.options.env !== 'server' && this.options.pushState && root.history && root.history.pushState) ? 'pushState' : 'hashchange')

        if ('function' === typeof root.addEventListener) {
            root.addEventListener('hashchange', function() {
                _this.trigger('hashchange')
            })

            root.addEventListener('popstate', function(e) {
                // Make sure popstate doesn't run on init -- this is a common issue with Safari and old versions of Chrome
                if (_this.state && _this.state.previousState === null) return false

                _this.trigger('navigate')
            })
        }
    }

    Grapnel.prototype.events = {}
    Grapnel.prototype.state = null

    /**
     * Create a RegExp Route from a string
     * This is the heart of the router and I've made it as small as possible!
     *
     * @param {String} Path of route
     * @param {Array} Array of keys to fill
     * @param {Bool} Case sensitive comparison
     * @param {Bool} Strict mode
     */
    Grapnel.regexRoute = function(path, keys, sensitive, strict) {
        if (path instanceof RegExp) return path
        if (path instanceof Array) path = '(' + path.join('|') + ')'
        // Build route RegExp
        path = path
            .concat(strict ? '' : '/?')
            .replace(/\/\(/g, '(?:/')
            .replace(/\+/g, '__plus__')
            .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional) {
                keys.push({
                    name: key,
                    optional: !!optional,
                })
                slash = slash || ''

                return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || (format && '([^/.]+?)') || '([^/]+?)') + ')' + (optional || '')
            })
            .replace(/([\/.])/g, '\\$1')
            .replace(/__plus__/g, '(.+)')
            .replace(/\*/g, '(.*)')

        return new RegExp('^' + path + '$', sensitive ? '' : 'i')
    }
    /**
     * ForEach workaround utility
     *
     * @param {Array} to iterate
     * @param {Function} callback
     */
    Grapnel._forEach = function(a, callback) {
        if (typeof Array.prototype.forEach === 'function') return Array.prototype.forEach.call(a, callback)
        // Replicate forEach()
        return function(c, next) {
            for (var i = 0, n = this.length; i < n; ++i) {
                c.call(next, this[i], i, this)
            }
        }.call(a, callback)
    }
    /**
     * Add a route and handler
     *
     * @param {String|RegExp} route name
     * @return {_this} Router
     */
    Grapnel.prototype.get = Grapnel.prototype.add = function(route) {
        var _this = this,
            middleware = Array.prototype.slice.call(arguments, 1, -1),
            handler = Array.prototype.slice.call(arguments, -1)[0],
            request = new Request(route)

        var invoke = function() {
            // Build request parameters
            var req = request.parse(_this.path())
            // Check if matches are found
            if (req.match) {
                // Match found
                var extra = {
                    route: route,
                    params: req.params,
                    req: req,
                    regex: req.match,
                }
                // Create call stack -- add middleware first, then handler
                var stack = new CallStack(_this, extra).enqueue(middleware.concat(handler))
                // Trigger main event
                _this.trigger('match', stack, req)
                // Continue?
                if (!stack.runCallback) return _this
                // Previous state becomes current state
                stack.previousState = _this.state
                // Save new state
                _this.state = stack
                // Prevent this handler from being called if parent handler in stack has instructed not to propagate any more events
                if (stack.parent() && stack.parent().propagateEvent === false) {
                    stack.propagateEvent = false
                    return _this
                }
                // Call handler
                stack.callback()
            }
            // Returns _this
            return _this
        }
        // Event name
        var eventName = _this.options.mode !== 'pushState' && _this.options.env !== 'server' ? 'hashchange' : 'navigate'
        // Invoke when route is defined, and once again when app navigates
        return invoke().on(eventName, invoke)
    }
    /**
     * Fire an event listener
     *
     * @param {String} event name
     * @param {Mixed} [attributes] Parameters that will be applied to event handler
     * @return {_this} Router
     */
    Grapnel.prototype.trigger = function(event) {
        var _this = this,
            params = Array.prototype.slice.call(arguments, 1)
        // Call matching events
        if (this.events[event]) {
            Grapnel._forEach(this.events[event], function(fn) {
                fn.apply(_this, params)
            })
        }

        return this
    }
    /**
     * Add an event listener
     *
     * @param {String} event name (multiple events can be called when separated by a space " ")
     * @param {Function} callback
     * @return {_this} Router
     */
    Grapnel.prototype.on = Grapnel.prototype.bind = function(event, handler) {
        var _this = this,
            events = event.split(' ')

        Grapnel._forEach(events, function(event) {
            if (_this.events[event]) {
                _this.events[event].push(handler)
            } else {
                _this.events[event] = [handler]
            }
        })

        return this
    }
    /**
     * Allow event to be called only once
     *
     * @param {String} event name(s)
     * @param {Function} callback
     * @return {_this} Router
     */
    Grapnel.prototype.once = function(event, handler) {
        var ran = false

        return this.on(event, function() {
            if (ran) return false
            ran = true
            handler.apply(this, arguments)
            handler = null
            return true
        })
    }
    /**
     * @param {String} Route context (without trailing slash)
     * @param {[Function]} Middleware (optional)
     * @return {Function} Adds route to context
     */
    Grapnel.prototype.context = function(context) {
        var _this = this,
            middleware = Array.prototype.slice.call(arguments, 1)

        return function() {
            var value = arguments[0],
                submiddleware = arguments.length > 2 ? Array.prototype.slice.call(arguments, 1, -1) : [],
                handler = Array.prototype.slice.call(arguments, -1)[0],
                prefix = context.slice(-1) !== '/' && value !== '/' && value !== '' ? context + '/' : context,
                path = value.substr(0, 1) !== '/' ? value : value.substr(1),
                pattern = prefix + path

            return _this.add.apply(
                _this,
                [pattern]
                    .concat(middleware)
                    .concat(submiddleware)
                    .concat([handler])
            )
        }
    }
    /**
     * Navigate through history API
     *
     * @param {String} Pathname
     * @return {_this} Router
     */
    Grapnel.prototype.navigate = function(path) {
        return this.path(path).trigger('navigate')
    }

    Grapnel.prototype.path = function(pathname) {
        var _this = this,
            frag

        if ('string' === typeof pathname) {
            // Set path
            if (_this.options.mode === 'pushState') {
                frag = _this.options.root ? _this.options.root + pathname : pathname
                root.history.pushState({}, null, frag)
            } else if (root.location) {
                root.location.hash = (_this.options.hashBang ? '!' : '') + pathname
            } else {
                root._pathname = pathname || ''
            }

            return this
        } else if ('undefined' === typeof pathname) {
            // Get path
            if (_this.options.mode === 'pushState') {
                frag = root.location.pathname.replace(_this.options.root, '')
            } else if (_this.options.mode !== 'pushState' && root.location) {
                frag = root.location.hash ? root.location.hash.split(_this.options.hashBang ? '#!' : '#')[1] : ''
            } else {
                frag = root._pathname || ''
            }

            return frag
        } else if (pathname === false) {
            // Clear path
            if (_this.options.mode === 'pushState') {
                root.history.pushState({}, null, _this.options.root || '/')
            } else if (root.location) {
                root.location.hash = _this.options.hashBang ? '!' : ''
            }

            return _this
        }
    }
    /**
     * Create routes based on an object
     *
     * @param {Object} [Options, Routes]
     * @param {Object Routes}
     * @return {_this} Router
     */
    Grapnel.listen = function() {
        var opts, routes
        if (arguments[0] && arguments[1]) {
            opts = arguments[0]
            routes = arguments[1]
        } else {
            routes = arguments[0]
        }
        // Return a new Grapnel instance
        return function() {
            // TODO: Accept multi-level routes
            for (var key in routes) {
                this.add.call(this, key, routes[key])
            }

            return this
        }.call(new Grapnel(opts || {}))
    }
    /**
     * Create a call stack that can be enqueued by handlers and middleware
     *
     * @param {Object} Router
     * @param {Object} Extend
     * @return {_this} CallStack
     */
    function CallStack(router, extendObj) {
        this.stack = CallStack.global.slice(0)
        this.router = router
        this.runCallback = true
        this.callbackRan = false
        this.propagateEvent = true
        this.value = router.path()

        for (var key in extendObj) {
            this[key] = extendObj[key]
        }

        return this
    }
    /**
     * Build request parameters and allow them to be checked against a string (usually the current path)
     *
     * @param {String} Route
     * @return {_this} Request
     */
    function Request(route) {
        this.route = route
        this.keys = []
        this.regex = Grapnel.regexRoute(route, this.keys)
    }
    // This allows global middleware
    CallStack.global = []
    /**
     * Prevent a callback from being called
     *
     * @return {_this} CallStack
     */
    CallStack.prototype.preventDefault = function() {
        this.runCallback = false
    }
    /**
     * Prevent any future callbacks from being called
     *
     * @return {_this} CallStack
     */
    CallStack.prototype.stopPropagation = function() {
        this.propagateEvent = false
    }
    /**
     * Get parent state
     *
     * @return {Object} Previous state
     */
    CallStack.prototype.parent = function() {
        var hasParentEvents = !!(this.previousState && this.previousState.value && this.previousState.value == this.value)
        return hasParentEvents ? this.previousState : false
    }
    /**
     * Run a callback (calls to next)
     *
     * @return {_this} CallStack
     */
    CallStack.prototype.callback = function() {
        this.callbackRan = true
        this.timeStamp = Date.now()
        this.next()
    }
    /**
     * Add handler or middleware to the stack
     *
     * @param {Function|Array} Handler or a array of handlers
     * @param {Int} Index to start inserting
     * @return {_this} CallStack
     */
    CallStack.prototype.enqueue = function(handler, atIndex) {
        var handlers = !Array.isArray(handler) ? [handler] : atIndex < handler.length ? handler.reverse() : handler

        while (handlers.length) {
            this.stack.splice(atIndex || this.stack.length + 1, 0, handlers.shift())
        }

        return this
    }
    /**
     * Call to next item in stack -- this adds the `req`, `event`, and `next()` arguments to all middleware
     *
     * @return {_this} CallStack
     */
    CallStack.prototype.next = function() {
        var _this = this

        return this.stack.shift().call(this.router, this.req, this, function next() {
            _this.next.call(_this)
        })
    }
    /**
     * Match a path string -- returns a request object if there is a match -- returns false otherwise
     *
     * @return {Object} req
     */
    Request.prototype.parse = function(path) {
        var match = path.match(this.regex),
            _this = this

        var req = {
            params: {},
            keys: this.keys,
            matches: (match || []).slice(1),
            match: match,
        }
        // Build parameters
        Grapnel._forEach(req.matches, function(value, i) {
            var key = _this.keys[i] && _this.keys[i].name ? _this.keys[i].name : i
            // Parameter key will be its key or the iteration index. This is useful if a wildcard (*) is matched
            req.params[key] = value ? decodeURIComponent(value) : undefined
        })

        return req
    }

    // Append utility constructors to Grapnel
    Grapnel.CallStack = CallStack
    Grapnel.Request = Request

    if (IS_MODULE) {
        exports.default = Grapnel
    } else {
        root.Grapnel = Grapnel
    }
}('object' === typeof window ? window : this)
