/****
 * Grapnel
 * https://github.com/baseprime/grapnel
 *
 * @author Greg Sabia Tucker <greg@narrowlabs.com>
 * @link http://basepri.me
 *
 * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT
*/
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
import * as events from 'events';
export var root = window || { history: {}, location: {} };
var Grapnel = (function (_super) {
    __extends(Grapnel, _super);
    function Grapnel(opts) {
        var _this = _super.call(this) || this;
        _this._maxListeners = Infinity;
        _this.options = {};
        _this.defaults = {
            env: 'client',
            pushState: false
        };
        _this.options = Object.assign({}, _this.defaults, opts);
        if ('object' === typeof window && 'function' === typeof window.addEventListener) {
            window.addEventListener('hashchange', function () {
                _this.emit('hashchange');
            });
            window.addEventListener('popstate', function (e) {
                // Make sure popstate doesn't run on init -- this is a common issue with Safari and old versions of Chrome
                if (_this.state && _this.state.previousState === null)
                    return false;
                _this.emit('navigate');
            });
        }
        return _this;
    }
    Grapnel.regexRoute = function (path, keys, sensitive, strict) {
        if (path instanceof RegExp)
            return path;
        if (path instanceof Array)
            path = '(' + path.join('|') + ')';
        // Build route RegExp
        var newPath = path.concat(strict ? '' : '/?')
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
    };
    Grapnel.listen = function () {
        var opts;
        var routes;
        if (arguments[0] && arguments[1]) {
            opts = arguments[0];
            routes = arguments[1];
        }
        else {
            routes = arguments[0];
        }
        // Return a new Grapnel instance
        return (function () {
            // TODO: Accept multi-level routes
            for (var key in routes) {
                this.add.call(this, key, routes[key]);
            }
            return this;
        }).call(new Grapnel(opts || {}));
    };
    Grapnel.prototype.add = function (route) {
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
    };
    Grapnel.prototype.get = function () {
        return this.add.apply(this, arguments);
    };
    Grapnel.prototype.trigger = function () {
        return this.emit.apply(this, arguments);
    };
    Grapnel.prototype.bind = function () {
        return this.on.apply(this, arguments);
    };
    Grapnel.prototype.context = function (context) {
        var self = this, middleware = Array.prototype.slice.call(arguments, 1);
        return function () {
            var value = arguments[0], submiddleware = (arguments.length > 2) ? Array.prototype.slice.call(arguments, 1, -1) : [], handler = Array.prototype.slice.call(arguments, -1)[0], prefix = (context.slice(-1) !== '/' && value !== '/' && value !== '') ? context + '/' : context, path = (value.substr(0, 1) !== '/') ? value : value.substr(1), pattern = prefix + path;
            return self.add.apply(self, [pattern].concat(middleware).concat(submiddleware).concat([handler]));
        };
    };
    Grapnel.prototype.navigate = function (path) {
        return this.path(path).emit('navigate');
    };
    Grapnel.prototype.path = function (pathname) {
        var self = this, frag;
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
    };
    return Grapnel;
}(events.EventEmitter));
export default Grapnel;
var CallStack = (function () {
    function CallStack(router, extendObj) {
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
    CallStack.prototype.preventDefault = function () {
        this.runCallback = false;
    };
    CallStack.prototype.stopPropagation = function () {
        this.propagateEvent = false;
    };
    CallStack.prototype.parent = function () {
        var hasParentEvents = !!(this.previousState && this.previousState.value && this.previousState.value == this.value);
        return (hasParentEvents) ? this.previousState : false;
    };
    CallStack.prototype.callback = function () {
        this.callbackRan = true;
        this.timeStamp = Date.now();
        this.next();
    };
    CallStack.prototype.enqueue = function (handler, atIndex) {
        var handlers = (!Array.isArray(handler)) ? [handler] : ((atIndex < handler.length) ? handler.reverse() : handler);
        while (handlers.length) {
            this.stack.splice(atIndex || this.stack.length + 1, 0, handlers.shift());
        }
        return this;
    };
    CallStack.prototype.next = function () {
        var self = this;
        return this.stack.shift().call(this.router, this.req, this, function next() {
            self.next.call(self);
        });
    };
    return CallStack;
}());
export { CallStack };
CallStack.global = [];
var Request = (function () {
    function Request(route) {
        this.route = route;
        this.keys = [];
        this.regex = Grapnel.regexRoute(route, this.keys);
    }
    Request.prototype.parse = function (path) {
        var match = path.match(this.regex), self = this;
        var req = {
            params: {},
            keys: this.keys,
            matches: (match || []).slice(1),
            match: match
        };
        // Build parameters
        req.matches.forEach(function (value, i) {
            var key = (self.keys[i] && self.keys[i].name) ? self.keys[i].name : i;
            // Parameter key will be its key or the iteration index. This is useful if a wildcard (*) is matched
            req.params[key] = (value) ? decodeURIComponent(value) : undefined;
        });
        return req;
    };
    return Request;
}());
export { Request };
if ('object' === typeof window) {
    window.Grapnel = Grapnel;
}
//# sourceMappingURL=grapnel.js.map