/****
 * Grapnel
 * https://github.com/baseprime/grapnel
 *
 * @author Greg Sabia Tucker <greg@narrowlabs.com>
 * @link http://basepri.me
 *
 * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT
*/

import { EventEmitter } from 'events';
import Route, { ParsedRoute } from './route';

class Grapnel extends EventEmitter {
    static _target: any;
    static MiddlewareStack: typeof MiddlewareStack;
    static Route: typeof Route;
    _maxListeners: number = Infinity;
    state: any | null = null;
    version: string = '0.6.4';
    options: any = {};
    defaults: any = {
        env: 'client',
        pushState: false
    }

    constructor(options?: any) {
        super();
        this.options = Object.assign({}, this.defaults, options);

        if ('object' === typeof Grapnel.target && 'function' === typeof Grapnel.target.addEventListener) {
            Grapnel.target.addEventListener('hashchange', () => {
                this.emit('hashchange');
            });

            Grapnel.target.addEventListener('popstate', (e: any) => {
                // Make sure popstate doesn't run on init -- this is a common issue with Safari and old versions of Chrome
                if (this.state && this.state.previousState === null) return false;

                this.emit('navigate');
            });
        }
    }

    static get target() {
        if (this._target) return this._target;
        return this._target = (window || { history: {}, location: {} })
    }

    static set target(target: any) {
        this._target = target;
    }

    static listen(...args: any[]): Grapnel {
        let opts: any;
        let routes: any;
        if (args[0] && args[1]) {
            opts = args[0];
            routes = args[1];
        } else {
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

    add(routePath: string & RegExp): Grapnel {
        let middleware: Function[] = Array.prototype.slice.call(arguments, 1, -1);
        let handler: Function = Array.prototype.slice.call(arguments, -1)[0];
        let route = new Route(routePath);

        let routeHandler = (function () {
            // Build request parameters
            let req: ParsedRoute = route.parse(this.path());
            // Check if matches are found
            if (req.match) {
                // Match found
                let extra = {
                    req,
                    route: routePath,
                    params: req.params,
                    regex: req.match
                };
                // Create call stack -- add middleware first, then handler
                let stack = new MiddlewareStack(this, extra).enqueue(middleware.concat(handler));
                // emit main event
                this.emit('match', stack, req);
                // Continue?
                if (!stack.runCallback) return this;
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
        let eventName = (!this.options.pushState && this.options.env !== 'server') ? 'hashchange' : 'navigate';
        // Invoke when route is defined, and once again when app navigates
        return routeHandler().on(eventName, routeHandler);
    }

    get(): Grapnel {
        return this.add.apply(this, arguments);
    }

    trigger(): Grapnel {
        return this.emit.apply(this, arguments);
    }

    bind(): Grapnel {
        // Backwards compatibility with older versions which mocked jQuery's bind()
        return this.on.apply(this, arguments);
    }

    context(context: string & RegExp): () => Grapnel {
        let middleware = Array.prototype.slice.call(arguments, 1);

        return (...args: any[]) => {
            let value = args[0];
            let subMiddleware = (args.length > 2) ? Array.prototype.slice.call(args, 1, -1) : [];
            let handler = Array.prototype.slice.call(args, -1)[0];
            let prefix = (context.slice(-1) !== '/' && value !== '/' && value !== '') ? context + '/' : context;
            let path = (value.substr(0, 1) !== '/') ? value : value.substr(1);
            let pattern = prefix + path;

            return this.add.apply(this, [pattern].concat(middleware).concat(subMiddleware).concat([handler]));
        }
    }

    navigate(path: string): Grapnel {
        return this.path(path).emit('navigate');
    }

    path(pathname?: string) {
        let root = (<typeof Grapnel>this.constructor).target;
        let frag = undefined;

        if ('string' === typeof pathname) {
            // Set path
            if (this.options.pushState) {
                frag = (this.options.root) ? (this.options.root + pathname) : pathname;
                root.history.pushState({}, null, frag);
            } else if (root.location) {
                root.location.hash = (this.options.hashBang ? '!' : '') + pathname;
            } else {
                root._pathname = pathname || '';
            }

            return this;
        } else if ('undefined' === typeof pathname) {
            // Get path
            if (this.options.pushState) {
                frag = root.location.pathname.replace(this.options.root, '');
            } else if (!this.options.pushState && root.location) {
                frag = (root.location.hash) ? root.location.hash.split((this.options.hashBang ? '#!' : '#'))[1] : '';
            } else {
                frag = root._pathname || '';
            }

            return frag;
        } else if (pathname === false) {
            // Clear path
            if (this.options.pushState) {
                root.history.pushState({}, null, this.options.root || '/');
            } else if (root.location) {
                root.location.hash = (this.options.hashBang) ? '!' : '';
            }

            return this;
        }
    }
}

class MiddlewareStack {
    stack: any[];
    router: Grapnel;
    runCallback: boolean = true;
    callbackRan: boolean = true;
    propagateEvent: boolean = true;
    value: string;
    req: any;
    previousState: any;
    timeStamp: Number;

    static global: any[] = [];

    constructor(router: Grapnel, extendObj?: any) {
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

    enqueue(handler: any, atIndex?: number) {
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

Grapnel.MiddlewareStack = MiddlewareStack;
Grapnel.Route = Route;
exports = module.exports = Grapnel;