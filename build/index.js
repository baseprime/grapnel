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
const route_1 = require("./route");
class Grapnel extends events_1.EventEmitter {
    constructor(options) {
        super();
        this._maxListeners = Infinity;
        this.options = {};
        this.defaults = {
            root: '',
            target: ('object' === typeof window) ? window : {},
            isWindow: ('object' === typeof window),
            pushState: false,
            hashBang: false
        };
        this.options = Object.assign({}, this.defaults, options);
        if ('object' === typeof this.options.target && 'function' === typeof this.options.target.addEventListener) {
            this.options.target.addEventListener('hashchange', () => {
                this.emit('hashchange');
            });
            this.options.target.addEventListener('popstate', (e) => {
                // Make sure popstate doesn't run on init -- this is a common issue with Safari and old versions of Chrome
                if (this.state && this.state.previousState === null)
                    return false;
                this.emit('navigate');
            });
        }
    }
    add(routePath) {
        let middleware = Array.prototype.slice.call(arguments, 1, -1);
        let handler = Array.prototype.slice.call(arguments, -1)[0];
        let fullPath = this.options.root + routePath;
        let route = new route_1.default(fullPath);
        let routeHandler = (function () {
            // Build request parameters
            let req = route.parse(this.path());
            // Check if matches are found
            if (req.match) {
                // Match found
                let extra = {
                    req,
                    route: fullPath,
                    params: req.params,
                    regex: req.match
                };
                // Create call stack -- add middleware first, then handler
                let stack = new MiddlewareStack(this, extra).enqueue(middleware.concat(handler));
                // emit main event
                this.emit('match', stack, req);
                // Continue?
                if (!stack.runCallback)
                    return this;
                // Previous state becomes current state
                stack.previousState = this.state;
                // Save new state
                this.state = stack;
                // Prevent this handler from being called if parent handler in stack has instructed not to propagate any more events
                if (stack.parent() && stack.parent().propagateEvent === false) {
                    stack.propagateEvent = false;
                    return this;
                }
                // Call handler
                stack.callback();
            }
            // Returns self
            return this;
        }).bind(this);
        // Event name
        let eventName = (!this.options.pushState && this.options.isWindow) ? 'hashchange' : 'navigate';
        // Invoke when route is defined, and once again when app navigates
        return routeHandler().on(eventName, routeHandler);
    }
    get() {
        return this.add.apply(this, arguments);
    }
    trigger() {
        return this.emit.apply(this, arguments);
    }
    bind() {
        // Backwards compatibility with older versions which mimed jQuery's bind()
        return this.on.apply(this, arguments);
    }
    context(context) {
        let middleware = Array.prototype.slice.call(arguments, 1);
        return (...args) => {
            let value = args[0];
            let subMiddleware = (args.length > 2) ? Array.prototype.slice.call(args, 1, -1) : [];
            let handler = Array.prototype.slice.call(args, -1)[0];
            let prefix = (context.slice(-1) !== '/' && value !== '/' && value !== '') ? context + '/' : context;
            let path = (value.substr(0, 1) !== '/') ? value : value.substr(1);
            let pattern = prefix + path;
            return this.add.apply(this, [pattern].concat(middleware).concat(subMiddleware).concat([handler]));
        };
    }
    navigate(path, options) {
        this.path(path, options).emit('navigate');
        return this;
    }
    path(pathname, options = {}) {
        let root = this.options.target;
        let frag = undefined;
        let pageName = options.title;
        if ('string' === typeof pathname) {
            // Set path
            if (this.options.pushState && 'function' === typeof root.history.pushState) {
                let state = options.state || root.history.state;
                frag = (this.options.root) ? (this.options.root + pathname) : pathname;
                root.history.pushState(state, pageName, frag);
            }
            else if (root.location) {
                let _frag = (this.options.root) ? (this.options.root + pathname) : pathname;
                root.location.hash = (this.options.hashBang ? '!' : '') + _frag;
            }
            else {
                root.pathname = pathname || '';
            }
            return this;
        }
        else if ('undefined' === typeof pathname) {
            // Get path
            return (root.location && root.location.pathname) ? root.location.pathname : (root.pathname || '');
        }
        else if (pathname === false) {
            // Clear path
            if (this.options.pushState && 'function' === typeof root.history.pushState) {
                let state = options.state || root.history.state;
                root.history.pushState(state, pageName, this.options.root || '/');
            }
            else if (root.location) {
                root.location.hash = (this.options.hashBang) ? '!' : '';
            }
            return this;
        }
    }
    static listen(...args) {
        let opts;
        let routes;
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
            for (let key in routes) {
                this.add.call(this, key, routes[key]);
            }
            return this;
        }).call(new Grapnel(opts || {}));
    }
    static toString() {
        return this.name;
    }
}
class MiddlewareStack {
    constructor(router, extendObj) {
        this.runCallback = true;
        this.callbackRan = true;
        this.propagateEvent = true;
        this.stack = MiddlewareStack.global.slice(0);
        this.router = router;
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
        let hasParentEvents = !!(this.previousState && this.previousState.value && this.previousState.value == this.value);
        return (hasParentEvents) ? this.previousState : false;
    }
    callback() {
        this.callbackRan = true;
        this.timeStamp = Date.now();
        this.next();
    }
    enqueue(handler, atIndex) {
        let handlers = (!Array.isArray(handler)) ? [handler] : ((atIndex < handler.length) ? handler.reverse() : handler);
        while (handlers.length) {
            this.stack.splice(atIndex || this.stack.length + 1, 0, handlers.shift());
        }
        return this;
    }
    next() {
        return this.stack.shift().call(this.router, this.req, this, () => this.next());
    }
}
MiddlewareStack.global = [];
Grapnel.MiddlewareStack = MiddlewareStack;
Grapnel.Route = route_1.default;
exports = module.exports = Grapnel;
//# sourceMappingURL=index.js.map