/****
 * Grapnel.js
 * https://github.com/gregsabia/Grapnel.js 
 * 
 * @author Greg Sabia
 * @link http://gregsabia.com
 * @version 0.1.3
 * 
 * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT
*/

var Grapnel = function(hook){
    "use strict";
    // Scope reference
    var self = this;
    // Current action if matched (default: null)
    this.action = null;
    // Hook (default: ":")
    this.hook = hook || ':';
    // Current value if matched (default: null)
    this.value = null;
    // Actions
    this.actionsMatching = [];
    // Listeners
    this.listeners = [];
    // Version
    this.version = '0.1.3';
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
            var regex = (self.action && name instanceof RegExp && self.action.match(name));
            // Test matches against current action
            if(regex || name === self.action){
                // Match found
                self._trigger('match', self.value, self.action);
                // Push object to actions array
                self.actionsMatching.push({ name : name, handler : handler });
                // Callback
                handler.call(self, self.value, self.action);
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
     * @return self
    */
    this._trigger = function(event){
        var params = Array.prototype.slice.call(arguments, 1);
        // Call matching events
        this.forEach(this.listeners, function(listener){
            // Apply callback
            if(listener.event == event) listener.handler.apply(self, params);
        });

        return this;
    }
    /**
     * Add an event listener
     * 
     * @param {String|Array} event
     * @param {Function} callback
     * @return self
    */
    this.on = function(event, handler){
        var events = (typeof event === 'string') ? event.split() : event;
        // Add listeners
        this.forEach(events, function(event){
            self.listeners.push({ event : event, handler : handler });
        });

        return this;
    }
    /**
     * Map Array workaround for compatibility issues with archaic browsers
     * 
     * @param {Array} to iterate
     * @param {Function} callback
    */
    this.map = this.mapArray = function(a, callback){
        if(typeof Array.prototype.map === 'function') return Array.prototype.map.call(a, callback);
        // Replicate map()
        return function(c, next){
            var other = new Array(this.length);
            for(var i=0, n=this.length; i<n; i++){
                if(i in this) other[i] = c.call(next, this[i], i, this);
            }

            return other;
        }.call(a, callback);
    }
    /**
     * ForEach workaround
     * 
     * @param {Array} to iterate
     * @param {Function} callback
    */
    this.forEach = function(a, callback){
        if(typeof Array.prototype.forEach === 'function') return Array.prototype.forEach.call(a, callback);
        // Replicate forEach()
        return function(c, next){
            for(var i=0, n = this.length; i<n; ++i){
                c.call(next, this[i], i, this);
            }
        }.call(a, callback);
    }
    // Get anchor
    this.getAnchor = function(){
        return (window.location.hash) ? window.location.hash.split('#')[1] : '';
    }
    // Change anchor
    this.setAnchor = function(anchor){
        window.location.hash = (!anchor) ? '' : anchor;
        return this;
    }
    // Reset anchor
    this.clearAnchor = function(){
        return this.setAnchor(false);
    }
    // Parse hook
    this.parse = function(){
        var action, value;

        if(this.getAnchor().match(this.hook)){
            // Found a hook!
            value = this.getAnchor().split(this.hook)[1];
            action = this.getAnchor().split(this.hook)[0];
        }

        return {
            value : value,
            action : action
        };
    }
    // Return matched actions
    this.matches = function(){
        var matches = [];

        this.forEach(this.actionsMatching, function(action){
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
    // Run hook action when state changes
    this.on(['initialized', 'hashchange'], function(){
        // Parse Hashtag in URL
        this.action = this.parse().action;
        this.value = this.parse().value;
        // Reset actions
        this.actionsMatching = [];
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
