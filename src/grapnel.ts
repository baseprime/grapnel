/****
 * Grapnel
 * https://github.com/baseprime/grapnel
 *
 * @author Greg Sabia Tucker <greg@narrowlabs.com>
 * @link http://basepri.me
 *
 * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT
 */

import { EventEmitter } from 'events'
import Route, { ParsedRoute } from './route'
import MiddlewareStack from './stack'

export default class Grapnel extends EventEmitter {
    _maxListeners: number = Infinity
    state: MiddlewareStack
    options: GrapnelOptions = {}
    static MiddlewareStack: typeof MiddlewareStack
    static Route: typeof Route
    static defaults: any = {
        root: '',
        target: 'object' === typeof window ? window : {},
        isWindow: 'object' === typeof window,
        pushState: false,
        hashBang: false,
    }

    constructor(options?: GrapnelOptions) {
        super()
        this.options = Object.assign({}, Grapnel.defaults, options)

        if ('object' === typeof this.options.target && 'function' === typeof this.options.target.addEventListener) {
            this.options.target.addEventListener('hashchange', () => {
                this.emit('hashchange')
            })

            this.options.target.addEventListener('popstate', (e: any) => {
                // Make sure popstate doesn't run on init -- this is a common issue with Safari and old versions of Chrome
                if (this.state && this.state.previousState === null) return false

                this.emit('navigate')
            })
        }
    }

    add(routePath: string & RegExp): Grapnel {
        let middleware: Function[] = Array.prototype.slice.call(arguments, 1, -1)
        let handler: Function = Array.prototype.slice.call(arguments, -1)[0]
        let fullPath = this.options.root + routePath
        let route = new Route(fullPath)

        let routeHandler = function() {
            // Build request parameters
            let req: ParsedRoute = route.parse(this.path())
            // Check if matches are found
            if (req.match) {
                // Match found
                let extra = {
                    req,
                    route: fullPath,
                    params: req.params,
                    regex: req.match,
                }
                // Create call stack -- add middleware first, then handler
                let stack = new MiddlewareStack(this, extra).enqueue(middleware.concat(handler))
                // emit main event
                this.emit('match', stack, req)
                // Continue?
                if (!stack.runCallback) return this
                // Previous state becomes current state
                stack.previousState = this.state
                // Save new state
                this.state = stack
                // Prevent this handler from being called if parent handler in stack has instructed not to propagate any more events
                if (stack.parent() && stack.parent().propagateEvent === false) {
                    stack.propagateEvent = false
                    return this
                }
                // Call handler
                stack.callback()
            }
            // Returns self
            return this
        }.bind(this)
        // Event name
        let eventName = !this.options.pushState && this.options.isWindow ? 'hashchange' : 'navigate'
        // Invoke when route is defined, and once again when app navigates
        return routeHandler().on(eventName, routeHandler)
    }

    get(): Grapnel {
        return this.add.apply(this, arguments)
    }

    trigger(): Grapnel {
        return this.emit.apply(this, arguments)
    }

    bind(): Grapnel {
        // Backwards compatibility with older versions which mimed jQuery's bind()
        return this.on.apply(this, arguments)
    }

    context(context: string & RegExp): () => Grapnel {
        let middleware = Array.prototype.slice.call(arguments, 1)

        return (...args: any[]) => {
            let value = args[0]
            let subMiddleware = args.length > 2 ? Array.prototype.slice.call(args, 1, -1) : []
            let handler = Array.prototype.slice.call(args, -1)[0]
            let prefix = context.slice(-1) !== '/' && value !== '/' && value !== '' ? context + '/' : context
            let path = value.substr(0, 1) !== '/' ? value : value.substr(1)
            let pattern = prefix + path

            return this.add.apply(
                this,
                [pattern]
                    .concat(middleware)
                    .concat(subMiddleware)
                    .concat([handler])
            )
        }
    }

    navigate(path: string, options: NavigateOptions): Grapnel {
        this.path(path, options).emit('navigate')
        return this
    }

    path(pathname?: string, options: NavigateOptions = {}) {
        let root = this.options.target
        let frag = undefined
        let pageName = options.title

        if ('string' === typeof pathname) {
            // Set path
            if (this.options.pushState && 'function' === typeof root.history.pushState) {
                let state = options.state || root.history.state
                frag = this.options.root ? this.options.root + pathname : pathname
                root.history.pushState(state, pageName, frag)
            } else if (root.location) {
                let _frag = this.options.root ? this.options.root + pathname : pathname
                root.location.hash = (this.options.hashBang ? '!' : '') + _frag
            } else {
                root.pathname = pathname || ''
            }

            return this
        } else if ('undefined' === typeof pathname) {
            // Get path
            return root.location && root.location.pathname ? root.location.pathname : root.pathname || ''
        } else if (pathname === false) {
            // Clear path
            if (this.options.pushState && 'function' === typeof root.history.pushState) {
                let state = options.state || root.history.state
                root.history.pushState(state, pageName, this.options.root || '/')
            } else if (root.location) {
                root.location.hash = this.options.hashBang ? '!' : ''
            }

            return this
        }
    }

    static listen(...args: any[]): Grapnel {
        let opts: any
        let routes: any
        if (args[0] && args[1]) {
            opts = args[0]
            routes = args[1]
        } else {
            routes = args[0]
        }
        // Return a new Grapnel instance
        return function() {
            // TODO: Accept multi-level routes
            for (let key in routes) {
                this.add.call(this, key, routes[key])
            }

            return this
        }.call(new Grapnel(opts || {}))
    }

    static toString() {
        return this.name
    }
}
