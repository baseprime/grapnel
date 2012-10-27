
/****
 * @package Grapnel.js
 * A lightweight JavaScript library for adding action hooks in URL hashtags/anchors.
 * https://github.com/gregsabia/Grapnel-js 
 * 
 * @author Greg Sabia
 * @support http://gregsabia.com
 * 
 * Event listeners: ['hashchange', 'hookfound']
*/

var Grapnel = function(hook){
    var self = this;
    // Anchoring
    this.anchor = false;
    // Hook (default: ":")
    this.hook = hook || ':';
    // Value (default: false)
    this.value = false;
    // Actions
    this.actions = [];
    // Listeners
    this.listeners = [];
    /**
     * Add an event listener
     * 
     * @param {String} event
     * @param {Function} callback
    */
    this.on = function(event, handler){
        return this.listeners.push({ event : event, handler : handler });
    }
    // Fire a listener
    this._trigger = function(event, data){
        for(i in this.listeners){
            if(this.listeners[i].event == event){
                this.listeners[i].handler.call(this, data);
            }
        }

        return this;
    }
    // Get anchor
    this.getAnchor = function(){
        var url_anchor = document.location.toString();
        if(url_anchor.match('#')){
            return this.anchor = url_anchor.split('#')[1];
        }else{
            return false;
        }
    }
    // Change anchor
    this.setAnchor = function(anchor){
        var url_anchor = document.location.toString();
        var anchor = anchor || '!';
        // Append anchor to location
        document.location = url_anchor.split('#')[0] + '#' + anchor;

        return this;
    }
    // Reset anchor
    this.clearAnchor = function(){
        return this.setAnchor(false);
    }
    // Parse hook
    this.parseHook = function(a){
        var a = a || this.anchor;

        if(this.anchor && a.match(this.hook)){
            this.value = a.split(this.hook)[1];
            this.anchor = a.split(this.hook)[0];
            // Fire event
            this._trigger('hookfound', [this.value, this.anchor]);

            return this.anchor;
        }else{
            return a;
        }
    }
    /**
     * Add an action and handler
     * 
     * @param {String} action name
     * @param {Function} callback
    */
    this.add = function(action, handler){
        this.actions.push({ action : action, handler : handler });
        return this._run();
    }
    // Initialize
    this.getAnchor();
    this.parseHook();
    // Run hook action
    this._run = function(){
        // We've matched an anchor action
        for(i in this.actions){
            if(this.actions[i].action == this.anchor) this.actions[i].handler.call(this, this.value, this.anchor);
        }

        return this;
    }
    // Default anchor change event
    this.on('hashchange', function(){
        this.getAnchor();
        this.parseHook();
        this._run();
    });
    // Check current hash change event
    if(typeof window.onhashchange == 'function') this.on('hashchange', window.onhashchange);
    /**
     * Hash change event
     * TODO: increase browser compatibility. "window.onhashchange" can be supplemented in older browsers with setInterval()
    */
    window.onhashchange = function(){
        self._trigger('hashchange', self.anchor);
    }

    return this;
}
