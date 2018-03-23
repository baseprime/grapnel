"use strict";
/****
 * Grapnel
 * https://github.com/baseprime/grapnel
 *
 * @author Greg Sabia Tucker <greg@narrowlabs.com>
 * @link http://basepri.me
 *
 * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT
*/
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class Grapnel extends events_1.EventEmitter {
    constructor(opts) {
        super();
        this._maxListeners = Infinity;
        this.options = {};
        this.defaults = {
            env: 'client',
            pushState: false
        };
        this.options = Object.assign({}, this.defaults, opts);
        if ('object' === typeof window && 'function' === typeof window.addEventListener) {
            window.addEventListener('hashchange', () => {
                this.emit('hashchange');
            });
            window.addEventListener('popstate', (e) => {
                // Make sure popstate doesn't run on init -- this is a common issue with Safari and old versions of Chrome
                if (this.state && this.state.previousState === null)
                    return false;
                this.emit('navigate');
            });
        }
    }
    static regexRoute(path, keys, sensitive, strict) {
        if (path instanceof RegExp)
            return path;
        if (path instanceof Array)
            path = '(' + path.join('|') + ')';
        // Build route RegExp
        let newPath = path.concat(strict ? '' : '/?')
            .replace(/\/\(/g, '(?:/')
            .replace(/\+/g, '__plus__')
            .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function (_, slash, format, key, capture, optional) {
            keys.push({
                name: key,
                optional: !!optional
            });
            slash = slash || '';
            return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' + (optional || '');
        })
            .replace(/([\/.])/g, '\\$1')
            .replace(/__plus__/g, '(.+)')
            .replace(/\*/g, '(.*)');
        return new RegExp('^' + newPath + '$', sensitive ? '' : 'i');
    }
    static listen(...args) {
        var opts;
        var routes;
        if (args[0] && args[1]) {
            opts = args[0];
            routes = args[1];
        }
        else {
            routes = args[0];
        }
        // Return a new Grapnel instance
        return (function () {
            // TODO: Accept multi-level routes
            for (var key in routes) {
                this.add.call(this, key, routes[key]);
            }
            return this;
        }).call(new Grapnel(opts || {}));
    }
    add(route) {
        var self = this, middleware = Array.prototype.slice.call(arguments, 1, -1), handler = Array.prototype.slice.call(arguments, -1)[0], request = new Request(route);
        var invoke = function RouteHandler() {
            // Build request parameters
            var req = request.parse(self.path());
            // Check if matches are found
            if (req.match) {
                // Match found
                var extra = {
                    route: route,
                    params: req.params,
                    req: req,
                    regex: req.match
                };
                // Create call stack -- add middleware first, then handler
                var stack = new CallStack(self, extra).enqueue(middleware.concat(handler));
                // emit main event
                self.emit('match', stack, req);
                // Continue?
                if (!stack.runCallback)
                    return self;
                // Previous state becomes current state
                stack.previousState = self.state;
                // Save new state
                self.state = stack;
                // Prevent this handler from being called if parent handler in stack has instructed not to propagate any more events
                if (stack.parent() && stack.parent().propagateEvent === false) {
                    stack.propagateEvent = false;
                    return self;
                }
                // Call handler
                stack.callback();
            }
            // Returns self
            return self;
        };
        // Event name
        var eventName = (!self.options.pushState && self.options.env !== 'server') ? 'hashchange' : 'navigate';
        // Invoke when route is defined, and once again when app navigates
        return invoke().on(eventName, invoke);
    }
    get() {
        return this.add.apply(this, arguments);
    }
    trigger() {
        return this.emit.apply(this, arguments);
    }
    bind() {
        return this.on.apply(this, arguments);
    }
    context(context) {
        var self = this, middleware = Array.prototype.slice.call(arguments, 1);
        return function () {
            var value = arguments[0], submiddleware = (arguments.length > 2) ? Array.prototype.slice.call(arguments, 1, -1) : [], handler = Array.prototype.slice.call(arguments, -1)[0], prefix = (context.slice(-1) !== '/' && value !== '/' && value !== '') ? context + '/' : context, path = (value.substr(0, 1) !== '/') ? value : value.substr(1), pattern = prefix + path;
            return self.add.apply(self, [pattern].concat(middleware).concat(submiddleware).concat([handler]));
        };
    }
    navigate(path) {
        return this.path(path).emit('navigate');
    }
    path(pathname) {
        let self = this;
        let root = this.constructor._rootTarget;
        let frag;
        if ('string' === typeof pathname) {
            // Set path
            if (self.options.pushState) {
                frag = (self.options.root) ? (self.options.root + pathname) : pathname;
                root.history.pushState({}, null, frag);
            }
            else if (root.location) {
                root.location.hash = (self.options.hashBang ? '!' : '') + pathname;
            }
            else {
                root._pathname = pathname || '';
            }
            return this;
        }
        else if ('undefined' === typeof pathname) {
            // Get path
            if (self.options.pushState) {
                frag = root.location.pathname.replace(self.options.root, '');
            }
            else if (!self.options.pushState && root.location) {
                frag = (root.location.hash) ? root.location.hash.split((self.options.hashBang ? '#!' : '#'))[1] : '';
            }
            else {
                frag = root._pathname || '';
            }
            return frag;
        }
        else if (pathname === false) {
            // Clear path
            if (self.options.pushState) {
                root.history.pushState({}, null, self.options.root || '/');
            }
            else if (root.location) {
                root.location.hash = (self.options.hashBang) ? '!' : '';
            }
            return self;
        }
    }
}
Grapnel._rootTarget = (window || { history: {}, location: {} });
exports.default = Grapnel;
class CallStack {
    constructor(router, extendObj) {
        this.runCallback = true;
        this.callbackRan = true;
        this.propagateEvent = true;
        this.stack = CallStack.global.slice(0);
        this.router = router;
        this.runCallback = true;
        this.callbackRan = false;
        this.propagateEvent = true;
        this.value = router.path();
        Object.assign(this, extendObj);
        return this;
    }
    preventDefault() {
        this.runCallback = false;
    }
    stopPropagation() {
        this.propagateEvent = false;
    }
    parent() {
        var hasParentEvents = !!(this.previousState && this.previousState.value && this.previousState.value == this.value);
        return (hasParentEvents) ? this.previousState : false;
    }
    callback() {
        this.callbackRan = true;
        this.timeStamp = Date.now();
        this.next();
    }
    enqueue(handler, atIndex) {
        var handlers = (!Array.isArray(handler)) ? [handler] : ((atIndex < handler.length) ? handler.reverse() : handler);
        while (handlers.length) {
            this.stack.splice(atIndex || this.stack.length + 1, 0, handlers.shift());
        }
        return this;
    }
    next() {
        var self = this;
        return this.stack.shift().call(this.router, this.req, this, function next() {
            self.next.call(self);
        });
    }
}
CallStack.global = [];
exports.CallStack = CallStack;
class Request {
    constructor(route) {
        this.route = route;
        this.keys = [];
        this.regex = Grapnel.regexRoute(route, this.keys);
    }
    parse(path) {
        let match = path.match(this.regex);
        let req = {
            params: {},
            keys: this.keys,
            matches: (match || []).slice(1),
            match: match
        };
        // Build parameters
        req.matches.forEach((value, i) => {
            var key = (this.keys[i] && this.keys[i].name) ? this.keys[i].name : i;
            // Parameter key will be its key or the iteration index. This is useful if a wildcard (*) is matched
            req.params[key] = (value) ? decodeURIComponent(value) : undefined;
        });
        return req;
    }
}
exports.Request = Request;
//# sourceMappingURL=grapnel.js.map