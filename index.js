/****
 * Grapnel Server
 * https://github.com/EngineeringMode/Grapnel.js/tree/server-router
 *
 * @author Greg Sabia Tucker <greg@artificer.io>
 * @link http://artificer.io
 * @version 0.1.2
 *
 * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT
*/

var Grapnel = require('grapnel');

function Server(){
    Grapnel.apply(this, arguments);

    var self = this;

    this.version = '0.1.2';
    this.req = {};
    this.res = {};
    // HTTP Verbs
    ['GET', 'POST', 'PUT', 'DELETE'].forEach(function(verb){
        self[verb.toLowerCase()] = function(){
            var args = Array.prototype.slice.call(arguments);
            // Add extra middleware to check if this method matches the requested HTTP verb
            args.splice(1, 0, function(req, res, next){
                // Call next in stack if it matches
                if(req.method === verb) next();
            });

            return this.add.apply(this, args);
        }
    });

    this.bind('match', function(event, _req){
        // Misc. request parameters should be congruent with Grapnel's `req` parameter conventions
        for(var prop in _req){
            self.req[prop] = _req[prop];
        }
        // Event property should now be accessible through the `req` property
        self.req.event = event;
        // Override next -- this is the same as default event.next() functionality except the arguments are now `req`, `res`, and `next()`
        event.next = function(){
            return this.stack.shift().call(event, self.req, self.res, function(){
                event.next.call(event);
            });
        }
    });

    return this;
}

Server.prototype = Grapnel.prototype;

Server.prototype.constructor = exports.constructor = Server;

Server.prototype.start = function(){
    var self = this;

    return function(req, res){
        self.req = req;
        self.res = res;
        self.navigate(req.url);
    }
}

exports = module.exports = new Server();
exports.Server = Server;
