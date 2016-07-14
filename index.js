/****
 * Grapnel Server
 * https://github.com/baseprime/grapnel/tree/server-router
 *
 * @author Greg Sabia Tucker <greg@narrowlabs.com>
 * @link http://basepri.me
 * @version 0.2.3
 *
 * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT
*/

var Grapnel = require('grapnel');

function Server() {
    Grapnel.apply(this, arguments);

    var self = this;

    this.version = '0.2.2';
    this.running = false;
    this.verbs = ['GET', 'POST', 'PUT', 'DELETE', 'ALL'];
    // HTTP Verbs
    this.verbs.forEach(function(verb) {
        self[verb.toLowerCase()] = function() {
            var args = [].slice.call(arguments);
            // Add extra middleware to check if this method matches the requested HTTP verb
            args.splice(1, 0, shouldRun(verb));

            return this.add.apply(self, args);
        }
    });

    return this;
};

Server.prototype = Object.create(Grapnel.prototype);

Server.prototype.constructor = Server;
/**
 * Copy router's context functionality except add middleware to route callback to its respective HTTP Method
 * 
 * @param {String} Route context (without trailing slash)
 * @param {[Function]} Middleware (optional)
 * @return {Function} Adds route to context
*/
Server.prototype.context = function() {
    var fn = Grapnel.prototype.context.apply(this, arguments),
        self = this;

    this.verbs.forEach(function(verb) {
        fn[verb.toLowerCase()] = function() {
            var args = [].slice.call(arguments);

            args.splice(1, 0, shouldRun(verb));

            return fn.apply(self, args);
        }
    });

    return fn;
};
/**
 * Start listening
 *
 * @return {Function} Middleware
*/
Server.prototype.start = function() {
    var router = this;
    // Server should now allow requests
    this.running = true;
    // Return server middleware to HTTP createServer()
    return function(req, res) {
        // For every inbound request, we want to map node's req and res to middleware
        Grapnel.CallStack.global = [serverMiddleware(req, res, router)];
        // Finally, navigate router
        router.navigate(req.url);
    }
};
/**
 * Map HTTP createServer request and response to middleware
 *
 * @param {Stream} HTTP Request
 * @param {Stream} HTTP Response
 * @param {Object} Router
 * @return {Function} Middleware
*/
function serverMiddleware(req, res, router) {

    return function wareReqRes(_req, event, next) {
        // Misc. request parameters should be congruent with Grapnel's `req` parameter conventions
        for (var prop in _req) {
            if (!req.hasOwnProperty(prop)) {
                req[prop] = _req[prop];
            }
        }
        // Create a global request id
        req._id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        // Event property should now be accessible through the `req` property
        req.event = event;
        // Override next -- this is the same as default event.next() functionality except the arguments are now `req`, `res`, and `next()`
        req.event.next = function() {
            return event.stack.shift().call(router, req, res, function() {
                event.next.call(event);
            });
        }

        next();
    }
};
/**
 * Middleware to check whether or not handler should continue running
 *
 * @param {String} HTTP Method
 * @return {Function} Middleware
*/
function shouldRun(verb) {
    // Add extra middleware to check if this method matches the requested HTTP verb
    return function wareShouldRun(req, res, next) {
        var shouldRun = (this.running && (req.method === verb || verb.toLowerCase() === 'all'));
        // Call next in stack if it matches
        if (shouldRun) next();
    }
};

exports = module.exports = new Server();
exports.Server = Server;
