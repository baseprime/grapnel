/****
 * Grapnel.js
 * https://github.com/EngineeringMode/Grapnel.js
 *
 * @author Greg Sabia Tucker <greg@artificer.io>
 * @link http://artificer.io
 * @version 0.5.3
 *
 * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT
*/

;(function(root){

    function Grapnel(opts){
        "use strict";

        var self = this; // Scope reference
        this.events = {}; // Event Listeners
        this.params = []; // Named parameters
        this.state = null; // Event state
        this.options = opts || {}; // Options
        this.options.usePushState = !!(self.options.pushState && root.history && root.history.pushState); // Enable pushState?
        this.version = '0.5.3'; // Version
        /**
         * ForEach workaround utility
         *
         * @param {Array} to iterate
         * @param {Function} callback
        */
        this._forEach = function(a, callback){
            if(typeof Array.prototype.forEach === 'function') return Array.prototype.forEach.call(a, callback);
            // Replicate forEach()
            return function(c, next){
                for(var i=0, n = this.length; i<n; ++i){
                    c.call(next, this[i], i, this);
                }
            }.call(a, callback);
        }
        // Fragment/Anchor
        this.fragment = this.anchor = this.hash = {
            get : function(){
                var frag;

                if(self.options.usePushState){
                    frag = root.location.pathname.replace(self.options.root, '');
                }else{
                    frag = (root.location.hash) ? root.location.hash.split((self.options.hashBang ? '#!' : '#'))[1] : '';
                }

                return frag;
            },
            set : function(frag){
                if(self.options.usePushState){
                    frag = (self.options.root) ? (self.options.root + frag) : frag;
                    root.history.pushState({}, null, frag);
                }else{
                    root.location.hash = (self.options.hashBang ? '!' : '') + frag;
                }

                return self;
            },
            clear : function(){
                if(self.options.usePushState){
                    root.history.pushState({}, null, self.options.root || '/');
                }else{
                    root.location.hash = (self.options.hashBang) ? '!' : '';
                }

                return self;
            }
        }
        
        root.addEventListener('hashchange', function(){
            self.trigger('hashchange');
        });

        root.addEventListener('popstate', function(){
            self.trigger('navigate');
        });

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
     * Add an action and handler
     *
     * @param {String|RegExp} action name
     * @param {Function} callback
     * @return self
    */
    Grapnel.prototype.get = Grapnel.prototype.add = function(route, handler){
        var self = this,
            keys = [],
            regex = Grapnel.regexRoute(route, keys);

        var invoke = function RouteHandler(){
            // If action is instance of RegEx, match the action
            var match = self.fragment.get().match(regex);
            // Test matches against current action
            if(match){
                // Match found
                var req = { params : {}, keys : keys, matches : match.slice(1) };
                // Build parameters
                self._forEach(req.matches, function(value, i){
                    var key = (keys[i] && keys[i].name) ? keys[i].name : i;
                    // Parameter key will be its key or the iteration index. This is useful if a wildcard (*) is matched
                    req.params[key] = (value) ? decodeURIComponent(value) : undefined;
                });
                // Route events should have an object detailing the event -- route events also change the state of the router
                var event = {
                    route : route,
                    value : self.fragment.get(),
                    params : req.params,
                    regex : match,
                    runCallback : true,
                    callbackRan : false,
                    propagateEvent : true,
                    preventDefault : function(){
                        this.runCallback = false;
                    },
                    stopPropagation : function(){
                        this.propagateEvent = false;
                    },
                    parent : function(){
                        var hasParentEvents = !!(this.previousState && this.previousState.value && this.previousState.value == this.value);
                        return (hasParentEvents) ? this.previousState : false;
                    },
                    callback : function(){
                        event.callbackRan = true;
                        event.timeStamp = Date.now();
                        // Handle event
                        handler.call(self, req, event);
                    }
                }
                // Trigger main event
                self.trigger('match', event);
                // Continue?
                if(!event.runCallback) return self;
                // Previous state becomes current state
                event.previousState = self.state;
                // Save new state
                self.state = event;
                // Prevent this handler from being called if parent handler in stack has instructed not to propagate any more events
                if(event.parent() && event.parent().propagateEvent === false){
                    event.propagateEvent = false;
                    return self;
                }
                // Call handler
                event.callback();
            }
            // Returns self
            return self;
        }
        // Event name
        var eventName = (self.options.usePushState) ? 'navigate' : 'hashchange';
        // Invoke when route is defined, and once again when app navigates
        return invoke().on(eventName, invoke);
    }
    /**
     * Fire an event listener
     *
     * @param {String} event name (multiple events can be called when seperated by a space " ")
     * @param {Mixed} [attributes] Parameters that will be applied to event handler
     * @return self
    */
    Grapnel.prototype.trigger = function(event){
        var params = Array.prototype.slice.call(arguments, 1);
        // Call matching events
        if(this.events[event]){
            this._forEach(this.events[event], function(fn){
                fn.apply(self, params);
            });
        }

        return this;
    }
    /**
     * Add an event listener
     *
     * @param {String} event name (multiple events can be called when seperated by a space " ")
     * @param {Function} callback
     * @return self
    */
    Grapnel.prototype.on = Grapnel.prototype.bind = function(event, handler){
        var self = this,
            events = event.split(' ');

        this._forEach(events, function(event){
            if(self.events[event]){
                self.events[event].push(handler);
            }else{
                self.events[event] = [handler];
            }
        });

        return this;
    }
    /**
     * Call Grapnel().router constructor for backwards compatibility
     *
     * @return {self} Router
    */
    Grapnel.Router = Grapnel.prototype.router = Grapnel;
    /**
     * Allow context
     *
     * @param {String} Route context
     * @return {Function} Adds route to context
    */
    Grapnel.prototype.context = function(context){
        var self = this;

        return function(value, callback){
            var prefix = (context.slice(-1) !== '/') ? context + '/' : context,
                pattern = prefix + value;

            return self.get.call(self, pattern, callback);
        }
    }
    /**
     * Navigate through history API
     *
     * @param {Object} Fragment
     * @return {self} Router
    */
    Grapnel.prototype.navigate = function(frag){
        this.fragment.set(frag);
        return this.trigger('navigate');
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
                this.get.call(this, key, routes[key]);
            }

            return this;
        }).call(new Grapnel(opts || {}));
    }
    // Window or module?
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

}).call({}, this);
