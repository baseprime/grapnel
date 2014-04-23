/****
 * Grapnel.js
 * https://github.com/EngineeringMode/Grapnel.js
 *
 * @author Greg Sabia Tucker
 * @link http://artificer.io
 * @version 0.3.1
 *
 * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT
*/

(function(root){

    function Grapnel(hook){
        "use strict";
        var self = this; // Scope reference
        this._actions = []; // Queued Actions
        this._events = []; // Event Listeners
        // Current action if matched (default: null)
        this.action = null;
        // Hook (default: ":")
        this.hook = hook || ':';
        // Current value if matched (default: null)
        this.value = null;
        // Named parameters
        this.params = [];
        // Anchor
        this.anchor = { defaultHash : window.location.hash };
        // Event state
        this.state = null;
        // Version
        this.version = '0.3.1';
        /**
         * Add an action and handler
         *
         * @param {String|RegExp} action name
         * @param {Function} callback
         * @return self
        */
        this.add = function(name, handler){
            var invoke = function(){
                // If action is instance of RegEx, match the action
                var regex = (self.action && name instanceof RegExp) ? self.anchor.get().match(name) : false;
                // Test matches against current action
                if(regex || name === self.action || self.anchor.get() == name){
                    // Match found
                    var event = { name : name, value : self.anchor.get(), handler : handler, params : self.params, regex : regex, previousState : self.state }
                    // Trigger main event
                    self._trigger('change', event);
                    // Push object to actions array
                    self._actions.push({ name : name, handler : handler });
                    // State
                    self.state = event;
                    // Callback
                    handler.call(self, self.value, self.params, event);
                }
                // Return self to force context
                return self;
            }
            // Invoke and add listeners
            return invoke().on(['initialized', 'hashchange'], invoke);
        }
        /**
         * Fire an event listener
         *
         * @param {String} event
         * @param {Mixed} [attributes] Parameters that will be applied to event listener
         * @return self
        */
        this._trigger = function(event){
            var params = Array.prototype.slice.call(arguments, 1);
            // Call matching events
            self._forEach(self._events, function(listener){
                // Apply callback
                if(listener.event == event) listener.handler.apply(self, params);
            });

            return self;
        }
        /**
         * ForEach workaround for compatibility issues with archaic browsers
         *
         * @param {Array} to iterate
         * @param {Function} callback
        */
        this._forEach = function(a, callback){
            if(typeof Array.prototype.forEach === 'function') return Array.prototype.forEach.call(a, callback);
            // Replicate forEach()
            return function(c, next){
                for(var i=0, n=this.length; i<n; ++i){
                    c.call(next, this[i], i, this);
                }
            }.call(a, callback);
        }
        /**
         * Create a RegExp Route
         *
         * @param {String} Path of route
         * @param {Array} Array of keys to fill
         * @param {Bool} Case sensitive comparison
         * @param {Bool} Strict mode
        */
        this._routeRegExp = function(path, keys, sensitive, strict){
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
        // Get anchor
        this.anchor.get = function(){
            return (window.location.hash) ? window.location.hash.split('#')[1] : '';
        }
        // Change anchor
        this.anchor.set = function(anchor){
            window.location.hash = (!anchor) ? '' : anchor;
            return self;
        }
        // Reset anchor
        this.anchor.clear = function(){
            return this.set(false);
        }
        // Run hook action when state changes
        this.on(['initialized', 'hashchange'], function(){
            var parsed = this.parse();
            // Parse Hashtag in URL
            this.action = parsed.action;
            this.value = parsed.value;
            this.params = parsed.params;
            // Reset actions
            this._actions = [];
        });
        // Check current hash change event
        if(typeof window.onhashchange === 'function') this.on('hashchange', window.onhashchange);
        /**
         * Hash change event
         * TODO: increase browser compatibility. "window.onhashchange" can be supplemented in older browsers with setInterval()
        */
        window.onhashchange = function(){
            self._trigger('hashchange');
        }

        return this._trigger('initialized');
    }
    /**
     * Add an event listener
     *
     * @param {String|Array} event
     * @param {Function} callback
     * @return self
    */
    Grapnel.prototype.on = Grapnel.prototype.bind = function(event, handler){
        var events = (typeof event === 'string') ? event.split() : event,
            self = this;
        // Add listeners
        this._forEach(events, function(event){
            self._events.push({ event : event, handler : handler });
        });

        return this;
    }
    /**
     * Parse URL
     *
     * @return {Object} Parsed URL
    */
    Grapnel.prototype.parse = function(){
        var anchor = this.anchor.get(),
            pieces = anchor.split(this.hook),
            glue = anchor.match(this.hook),
            action = pieces[0], // First index is the action
            params = [],
            value;

        if(this.anchor.get().match(this.hook)){
            params = pieces.slice(1);
            value = params.join(glue[0]);
        }

        // Event
        var event = { pieces : pieces }
        // Trigger successfully parsed URL
        this._trigger('parse', event);

        return {
            value : value,
            action : action,
            params : params
        };
    }
    /**
     * Return matching actions
     *
     * @return {Array} Matching actions
    */
    Grapnel.prototype.matches = function(){
        var matches = [],
            self = this;

        this._forEach(this._actions, function(action){
            // If action is instance of RegEx, match the action
            var regex = (action.name instanceof RegExp && self.action.match(action.name));
            // Test matches against current action
            if(regex || action.name === self.action){
                // Match found
                matches.push(action);
            }
        });

        return matches;
    }
    /**
     * Call Grapnel().router constructor for backwards compatibility
     *
     * @return {self} Router
    */
    Grapnel.prototype.router = function(){
        return Grapnel.Router();
    }
    /**
     * Router - Enables get() method
     * Parses matches in the URL and builds a list of parameters
     *
     * @return {self} Router
    */
    Grapnel.Router = function(){
        // Create a new instance
        var router = new Grapnel(/\//gi);
        // Add GET method callable through API
        router.get = function(path, handler){
            var keys = [];
            var regex = new this._routeRegExp(path, keys);
            // Add listener
            router.add(regex, function(_v, _p, event){
                var req = { params : {}, keys : keys, matches : event.regex.slice(1) };
                // Build parameters
                router._forEach(req.matches, function(value, i){
                    var key = (keys[i] && keys[i].name) ? keys[i].name : i;
                    // Parameter key will be its key or the iteration index. This is useful if a wildcard (*) is matched
                    req.params[key] = (value) ? decodeURIComponent(value) : undefined;
                });
                // Call handler
                // Notice how a handler for a route passes `params` as the second argument, instead of `self.value`
                handler.call(router, req, event);
            });

            return router;
        }

        return router._trigger('initialized');
    }
    // Window or module?
    if('function' === typeof root.define){
        // Set root
        root.Grapnel = Grapnel;
        // Define module
        root.define(function(require){
            return Grapnel;
        });
    }else if('object' === typeof exports){
        exports.Grapnel = Grapnel;
    }else{
        root.Grapnel = Grapnel;
    }

}).call({}, window);