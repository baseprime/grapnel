(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
/****
 * Grapnel.js
 * https://github.com/EngineeringMode/Grapnel.js
 *
 * @author Greg Sabia Tucker <greg@artificer.io>
 * @link http://artificer.io
 * @version 0.5.11
 *
 * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT
*/

;(function(root){

    function Grapnel(opts){
        "use strict";

        var self = this; // Scope reference
        this.events = {}; // Event Listeners
        this.state = null; // Router state object
        this.options = opts || {}; // Options
        this.options.env = this.options.env || (!!(Object.keys(root).length === 0 && process && process.browser !== true) ? 'server' : 'client');
        this.options.mode = this.options.mode || (!!(this.options.env !== 'server' && this.options.pushState && root.history && root.history.pushState) ? 'pushState' : 'hashchange');
        this.version = '0.5.11'; // Version

        if('function' === typeof root.addEventListener){
            root.addEventListener('hashchange', function(){
                self.trigger('hashchange');
            });

            root.addEventListener('popstate', function(e){
                // Make sure popstate doesn't run on init -- this is a common issue with Safari and old versions of Chrome
                if(self.state && self.state.previousState === null) return false;
                
                self.trigger('navigate');
            });
        }
        /**
         * Deprecation warning: this.fragment may eventually be evolved into this.path(pathname) function eventually
        */
        this.fragment = {
            /**
             * Get pathname relative to root
             * @return {String} pathname
            */
            get : function(){
                var frag;

                if(self.options.mode === 'pushState'){
                    frag = root.location.pathname.replace(self.options.root, '');
                }else if(self.options.mode !== 'pushState' && root.location){
                    frag = (root.location.hash) ? root.location.hash.split((self.options.hashBang ? '#!' : '#'))[1] : '';
                }else{
                    frag = root._pathname || '';
                }

                return frag;
            },
            /**
             * Set pathname relative to root
             * @param {String} pathname
             * @return {Object} router
            */
            set : function(frag){
                if(self.options.mode === 'pushState'){
                    frag = (self.options.root) ? (self.options.root + frag) : frag;
                    root.history.pushState({}, null, frag);
                }else if(root.location){
                    root.location.hash = (self.options.hashBang ? '!' : '') + frag;
                }else{
                    root._pathname = frag || '';
                }

                return self;
            },
            clear : function(){
                if(self.options.mode === 'pushState'){
                    root.history.pushState({}, null, self.options.root || '/');
                }else if(root.location){
                    root.location.hash = (self.options.hashBang) ? '!' : '';
                }

                return self;
            }
        }

        return this;
    }
    /**
     * Create a RegExp Route from a string
     * This is the heart of the router and I've made it as small as possible!
     *
     * @param {String} Path of route
     * @param {Array} Array of keys to fill
     * @param {Bool} Case sensitive comparison
     * @param {Bool} Strict mode
    */
    Grapnel.regexRoute = function(path, keys, sensitive, strict){
        if(path instanceof RegExp) return path;
        if(path instanceof Array) path = '(' + path.join('|') + ')';
        // Build route RegExp
        path = path.concat(strict ? '' : '/?')
            .replace(/\/\(/g, '(?:/')
            .replace(/\+/g, '__plus__')
            .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
                keys.push({ name : key, optional : !!optional });
                slash = slash || '';

                return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' + (optional || '');
            })
            .replace(/([\/.])/g, '\\$1')
            .replace(/__plus__/g, '(.+)')
            .replace(/\*/g, '(.*)');

        return new RegExp('^' + path + '$', sensitive ? '' : 'i');
    }
    /**
     * ForEach workaround utility
     *
     * @param {Array} to iterate
     * @param {Function} callback
    */
    Grapnel._forEach = function(a, callback){
        if(typeof Array.prototype.forEach === 'function') return Array.prototype.forEach.call(a, callback);
        // Replicate forEach()
        return function(c, next){
            for(var i=0, n = this.length; i<n; ++i){
                c.call(next, this[i], i, this);
            }
        }.call(a, callback);
    }
    /**
     * Add an route and handler
     *
     * @param {String|RegExp} route name
     * @return {self} Router
    */
    Grapnel.prototype.get = Grapnel.prototype.add = function(route){
        var self = this,
            middleware = Array.prototype.slice.call(arguments, 1, -1),
            handler = Array.prototype.slice.call(arguments, -1)[0],
            request = new Request(route);

        var invoke = function RouteHandler(){
            // Build request parameters
            var req = request.parse(self.fragment.get());
            // Check if matches are found
            if(req.match){
                // Match found
                var extra = {
                    route : route,
                    params : req.params,
                    req : req,
                    regex : req.match
                }
                // Create call stack -- add middleware first, then handler
                var stack = new CallStack(self, extra).enqueue(middleware.concat(handler));
                // Trigger main event
                self.trigger('match', stack, req);
                // Continue?
                if(!stack.runCallback) return self;
                // Previous state becomes current state
                stack.previousState = self.state;
                // Save new state
                self.state = stack;
                // Prevent this handler from being called if parent handler in stack has instructed not to propagate any more events
                if(stack.parent() && stack.parent().propagateEvent === false){
                    stack.propagateEvent = false;
                    return self;
                }
                // Call handler
                stack.callback();
            }
            // Returns self
            return self;
        }
        // Event name
        var eventName = (self.options.mode !== 'pushState' && self.options.env !== 'server') ? 'hashchange' : 'navigate';
        // Invoke when route is defined, and once again when app navigates
        return invoke().on(eventName, invoke);
    }
    /**
     * Fire an event listener
     *
     * @param {String} event name
     * @param {Mixed} [attributes] Parameters that will be applied to event handler
     * @return {self} Router
    */
    Grapnel.prototype.trigger = function(event){
        var self = this,
            params = Array.prototype.slice.call(arguments, 1);
        // Call matching events
        if(this.events[event]){
            Grapnel._forEach(this.events[event], function(fn){
                fn.apply(self, params);
            });
        }

        return this;
    }
    /**
     * Add an event listener
     *
     * @param {String} event name (multiple events can be called when separated by a space " ")
     * @param {Function} callback
     * @return {self} Router
    */
    Grapnel.prototype.on = Grapnel.prototype.bind = function(event, handler){
        var self = this,
            events = event.split(' ');

        Grapnel._forEach(events, function(event){
            if(self.events[event]){
                self.events[event].push(handler);
            }else{
                self.events[event] = [handler];
            }
        });

        return this;
    }
    /**
     * Allow event to be called only once
     *
     * @param {String} event name(s)
     * @param {Function} callback
     * @return {self} Router
    */
    Grapnel.prototype.once = function(event, handler){
        var ran = false;

        return this.on(event, function(){
            if(ran) return false;
            ran = true;
            handler.apply(this, arguments);
            handler = null;
            return true;
        });
    }
    /**
     * @param {String} Route context (without trailing slash)
     * @param {[Function]} Middleware (optional)
     * @return {Function} Adds route to context
    */
    Grapnel.prototype.context = function(context){
        var self = this,
            middleware = Array.prototype.slice.call(arguments, 1);

        return function(){
            var value = arguments[0],
                submiddleware = (arguments.length > 2) ? Array.prototype.slice.call(arguments, 1, -1) : [],
                handler = Array.prototype.slice.call(arguments, -1)[0],
                prefix = (context.slice(-1) !== '/' && value !== '/' && value !== '') ? context + '/' : context,
                path = (value.substr(0, 1) !== '/') ? value : value.substr(1),
                pattern = prefix + path;

            return self.add.apply(self, [pattern].concat(middleware).concat(submiddleware).concat([handler]));
        }
    }
    /**
     * Navigate through history API
     *
     * @param {String} Pathname
     * @return {self} Router
    */
    Grapnel.prototype.navigate = function(path){
        return this.fragment.set(path).trigger('navigate');
    }
    /**
     * Create routes based on an object
     *
     * @param {Object} [Options, Routes]
     * @param {Object Routes}
     * @return {self} Router
    */
    Grapnel.listen = function(){
        var opts, routes;
        if(arguments[0] && arguments[1]){
            opts = arguments[0];
            routes = arguments[1];
        }else{
            routes = arguments[0];
        }
        // Return a new Grapnel instance
        return (function(){
            // TODO: Accept multi-level routes
            for(var key in routes){
                this.add.call(this, key, routes[key]);
            }

            return this;
        }).call(new Grapnel(opts || {}));
    }
    /**
     * Create a call stack that can be enqueued by handlers and middleware
     *
     * @param {Object} Router
     * @param {Object} Extend
     * @return {self} CallStack
    */
    function CallStack(router, extendObj){
        this.stack = [];
        this.router = router;
        this.runCallback = true;
        this.callbackRan = false;
        this.propagateEvent = true;
        this.value = router.fragment.get();

        for(var key in extendObj){
            this[key] = extendObj[key];
        }

        return this;
    }
    /**
     * Build request parameters and allow them to be checked against a string (usually the current path)
     *
     * @param {String} Route
     * @return {self} Request 
    */
    function Request(route){
        this.route = route;
        this.keys = [];
        this.regex = Grapnel.regexRoute(route, this.keys);
    }
    /**
     * Prevent a callback from being called
     *
     * @return {self} CallStack 
    */
    CallStack.prototype.preventDefault = function(){
        this.runCallback = false;
    }
    /**
     * Prevent any future callbacks from being called
     *
     * @return {self} CallStack 
    */
    CallStack.prototype.stopPropagation = function(){
        this.propagateEvent = false;
    }
    /**
     * Get parent state
     *
     * @return {Object} Previous state 
    */
    CallStack.prototype.parent = function(){
        var hasParentEvents = !!(this.previousState && this.previousState.value && this.previousState.value == this.value);
        return (hasParentEvents) ? this.previousState : false;
    }
    /**
     * Run a callback (calls to next)
     *
     * @return {self} CallStack 
    */
    CallStack.prototype.callback = function(){
        this.callbackRan = true;
        this.timeStamp = Date.now();
        this.next();
    }
    /**
     * Add handler or middleware to the stack
     *
     * @param {Function|Array} Handler or a list of handlers
     * @return {self} CallStack 
    */
    CallStack.prototype.enqueue = function(fn){
        if(fn instanceof Array){
            for(var key in fn){
                this.stack.push(fn[key]);
            }
        }else{
            this.stack.push(fn);
        }

        return this;
    }
    /**
     * Call to next item in stack -- this adds the `req`, `event`, and `next()` arguments to all middleware
     *
     * @return {self} CallStack 
    */
    CallStack.prototype.next = function(){
        var self = this;

        return this.stack.shift().call(this.router, this.req, this, function next(){
            self.next.call(self);
        });
    }
    /**
     * Match a path string -- returns a request object if there is a match -- returns false otherwise
     *
     * @return {Object} req
    */
    Request.prototype.parse = function(path){
        var match = path.match(this.regex),
            self = this;

        var req = { params : {}, keys : this.keys, matches : (match || []).slice(1), match : match };
        // Build parameters
        Grapnel._forEach(req.matches, function(value, i){
            var key = (self.keys[i] && self.keys[i].name) ? self.keys[i].name : i;
            // Parameter key will be its key or the iteration index. This is useful if a wildcard (*) is matched
            req.params[key] = (value) ? decodeURIComponent(value) : undefined;
        });

        return req;
    }

    Grapnel.CallStack = CallStack;
    Grapnel.Request = Request;

    if('function' === typeof root.define && !root.define.amd.grapnel){
        root.define(function(require, exports, module){
            root.define.amd.grapnel = true;
            return Grapnel;
        });
    }else if('object' === typeof module && 'object' === typeof module.exports){
        module.exports = exports = Grapnel;
    }else{
        root.Grapnel = Grapnel;
    }

}).call({}, ('object' === typeof window) ? window : this);

}).call(this,require('_process'))
},{"_process":3}],2:[function(require,module,exports){

var Grapnel = require('./grapnel'),
    router = new Grapnel();

router.get('*', function(){
    console.log('Hello World!');
});

console.log(router);
},{"./grapnel":1}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[2]);
