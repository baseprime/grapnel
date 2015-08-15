/****
 * Grapnel Server
 * https://github.com/EngineeringMode/Grapnel.js/tree/server-router
 *
 * @author Greg Sabia Tucker <greg@artificer.io>
 * @link http://artificer.io
 * @version 0.1.5
 *
 * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT
*/

var Grapnel = require('grapnel')

function Server(){
    Grapnel.apply(this, arguments);

    var self = this;

    this.version = '0.1.5';
    this.verbs = ['GET', 'POST', 'PUT', 'DELETE', 'ALL'];
    // HTTP Verbs
    this.verbs.forEach(function(verb){
        self[verb.toLowerCase()] = function(){
            var args = [].slice.call(arguments);
            // Add extra middleware to check if this method matches the requested HTTP verb
            args.splice(1, 0, self._middleware.checkMethod(verb));

            return this.add.apply(self, args);
        }
    });

    return this;
}

Server.prototype = Object.create(Grapnel.prototype);

Server.prototype.constructor = Server;

Server.prototype.context = function(){
    var fn = Grapnel.prototype.context.apply(this, arguments),
        self = this;

    this.verbs.forEach(function(verb){
        fn[verb.toLowerCase()] = function(){
            var args = [].slice.call(arguments);

            args.splice(1, 0, self._middleware.checkMethod(verb));

            return fn.apply(self, args);
        }
    });

    return fn;
}

Server.prototype.start = function(){
    var router = this;

    return function(req, res){
        // Once we're in this scope, change next()'s context to req, res, and next() instead of req, event, next()
        Grapnel.CallStack.prototype.next = function(){
            var self = this;
            // Misc. request parameters should be congruent with Grapnel's `req` parameter conventions
            for(var prop in this.req){
                req[prop] = this.req[prop];
            }
            // Event property should now be accessible through the `req` property
            req.event = this;
            // Override next -- this is the same as default event.next() functionality except the arguments are now `req`, `res`, and `next()`
            return this.stack.shift().call(router, req, res, function(){
                self.next.call(self);
            });
        }

        router.navigate(req.url);
    }
}

Server.prototype._middleware = {};

Server.prototype._middleware.checkMethod = function(verb){
    // Add extra middleware to check if this method matches the requested HTTP verb
    return function wareCheckMethod(req, res, next){
        // Call next in stack if it matches
        if(req.method === verb || verb.toLowerCase() === 'any') next();
    }
}

exports = module.exports = new Server();
exports.Server = Server;
