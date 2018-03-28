/*!
 * Grapnel
 * https://github.com/baseprime/grapnel.git
 * 
 * @author Greg Sabia Tucker <greg@narrowlabs.com>
 * @link http://basepri.me
 * @version 0.7.0
 * 
 * Released under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT
 */
var Grapnel =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

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
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	Object.defineProperty(exports, "__esModule", { value: true });
	var events_1 = __webpack_require__(1);
	var route_1 = __webpack_require__(2);
	
	var Grapnel = function (_events_1$EventEmitte) {
	    _inherits(Grapnel, _events_1$EventEmitte);
	
	    function Grapnel(options) {
	        _classCallCheck(this, Grapnel);
	
	        var _this = _possibleConstructorReturn(this, (Grapnel.__proto__ || Object.getPrototypeOf(Grapnel)).call(this));
	
	        _this._maxListeners = Infinity;
	        _this.options = {};
	        _this.defaults = {
	            root: '',
	            target: 'object' === (typeof window === "undefined" ? "undefined" : _typeof(window)) ? window : {},
	            isWindow: 'object' === (typeof window === "undefined" ? "undefined" : _typeof(window)),
	            pushState: false,
	            hashBang: false
	        };
	        _this.options = Object.assign({}, _this.defaults, options);
	        if ('object' === _typeof(_this.options.target) && 'function' === typeof _this.options.target.addEventListener) {
	            _this.options.target.addEventListener('hashchange', function () {
	                _this.emit('hashchange');
	            });
	            _this.options.target.addEventListener('popstate', function (e) {
	                // Make sure popstate doesn't run on init -- this is a common issue with Safari and old versions of Chrome
	                if (_this.state && _this.state.previousState === null) return false;
	                _this.emit('navigate');
	            });
	        }
	        return _this;
	    }
	
	    _createClass(Grapnel, [{
	        key: "add",
	        value: function add(routePath) {
	            var middleware = Array.prototype.slice.call(arguments, 1, -1);
	            var handler = Array.prototype.slice.call(arguments, -1)[0];
	            var fullPath = this.options.root + routePath;
	            var route = new route_1.default(fullPath);
	            var routeHandler = function () {
	                // Build request parameters
	                var req = route.parse(this.path());
	                // Check if matches are found
	                if (req.match) {
	                    // Match found
	                    var extra = {
	                        req: req,
	                        route: fullPath,
	                        params: req.params,
	                        regex: req.match
	                    };
	                    // Create call stack -- add middleware first, then handler
	                    var stack = new MiddlewareStack(this, extra).enqueue(middleware.concat(handler));
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
	            }.bind(this);
	            // Event name
	            var eventName = !this.options.pushState && this.options.isWindow ? 'hashchange' : 'navigate';
	            // Invoke when route is defined, and once again when app navigates
	            return routeHandler().on(eventName, routeHandler);
	        }
	    }, {
	        key: "get",
	        value: function get() {
	            return this.add.apply(this, arguments);
	        }
	    }, {
	        key: "trigger",
	        value: function trigger() {
	            return this.emit.apply(this, arguments);
	        }
	    }, {
	        key: "bind",
	        value: function bind() {
	            // Backwards compatibility with older versions which mimed jQuery's bind()
	            return this.on.apply(this, arguments);
	        }
	    }, {
	        key: "context",
	        value: function context(_context) {
	            var _this2 = this;
	
	            var middleware = Array.prototype.slice.call(arguments, 1);
	            return function () {
	                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	                    args[_key] = arguments[_key];
	                }
	
	                var value = args[0];
	                var subMiddleware = args.length > 2 ? Array.prototype.slice.call(args, 1, -1) : [];
	                var handler = Array.prototype.slice.call(args, -1)[0];
	                var prefix = _context.slice(-1) !== '/' && value !== '/' && value !== '' ? _context + '/' : _context;
	                var path = value.substr(0, 1) !== '/' ? value : value.substr(1);
	                var pattern = prefix + path;
	                return _this2.add.apply(_this2, [pattern].concat(middleware).concat(subMiddleware).concat([handler]));
	            };
	        }
	    }, {
	        key: "navigate",
	        value: function navigate(path, options) {
	            this.path(path, options).emit('navigate');
	            return this;
	        }
	    }, {
	        key: "path",
	        value: function path(pathname) {
	            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	
	            var root = this.options.target;
	            var frag = undefined;
	            var pageName = options.title;
	            if ('string' === typeof pathname) {
	                // Set path
	                if (this.options.pushState && 'function' === typeof root.history.pushState) {
	                    var state = options.state || root.history.state;
	                    frag = this.options.root ? this.options.root + pathname : pathname;
	                    root.history.pushState(state, pageName, frag);
	                } else if (root.location) {
	                    var _frag = this.options.root ? this.options.root + pathname : pathname;
	                    root.location.hash = (this.options.hashBang ? '!' : '') + _frag;
	                } else {
	                    root.pathname = pathname || '';
	                }
	                return this;
	            } else if ('undefined' === typeof pathname) {
	                // Get path
	                return root.location && root.location.pathname ? root.location.pathname : root.pathname || '';
	            } else if (pathname === false) {
	                // Clear path
	                if (this.options.pushState && 'function' === typeof root.history.pushState) {
	                    var _state = options.state || root.history.state;
	                    root.history.pushState(_state, pageName, this.options.root || '/');
	                } else if (root.location) {
	                    root.location.hash = this.options.hashBang ? '!' : '';
	                }
	                return this;
	            }
	        }
	    }], [{
	        key: "listen",
	        value: function listen() {
	            var opts = void 0;
	            var routes = void 0;
	            if ((arguments.length <= 0 ? undefined : arguments[0]) && (arguments.length <= 1 ? undefined : arguments[1])) {
	                opts = arguments.length <= 0 ? undefined : arguments[0];
	                routes = arguments.length <= 1 ? undefined : arguments[1];
	            } else {
	                routes = arguments.length <= 0 ? undefined : arguments[0];
	            }
	            // Return a new Grapnel instance
	            return function () {
	                // TODO: Accept multi-level routes
	                for (var key in routes) {
	                    this.add.call(this, key, routes[key]);
	                }
	                return this;
	            }.call(new Grapnel(opts || {}));
	        }
	    }, {
	        key: "toString",
	        value: function toString() {
	            return this.name;
	        }
	    }]);
	
	    return Grapnel;
	}(events_1.EventEmitter);
	
	var MiddlewareStack = function () {
	    function MiddlewareStack(router, extendObj) {
	        _classCallCheck(this, MiddlewareStack);
	
	        this.runCallback = true;
	        this.callbackRan = true;
	        this.propagateEvent = true;
	        this.stack = MiddlewareStack.global.slice(0);
	        this.router = router;
	        this.value = router.path();
	        Object.assign(this, extendObj);
	        return this;
	    }
	
	    _createClass(MiddlewareStack, [{
	        key: "preventDefault",
	        value: function preventDefault() {
	            this.runCallback = false;
	        }
	    }, {
	        key: "stopPropagation",
	        value: function stopPropagation() {
	            this.propagateEvent = false;
	        }
	    }, {
	        key: "parent",
	        value: function parent() {
	            var hasParentEvents = !!(this.previousState && this.previousState.value && this.previousState.value == this.value);
	            return hasParentEvents ? this.previousState : false;
	        }
	    }, {
	        key: "callback",
	        value: function callback() {
	            this.callbackRan = true;
	            this.timeStamp = Date.now();
	            this.next();
	        }
	    }, {
	        key: "enqueue",
	        value: function enqueue(handler, atIndex) {
	            var handlers = !Array.isArray(handler) ? [handler] : atIndex < handler.length ? handler.reverse() : handler;
	            while (handlers.length) {
	                this.stack.splice(atIndex || this.stack.length + 1, 0, handlers.shift());
	            }
	            return this;
	        }
	    }, {
	        key: "next",
	        value: function next() {
	            var _this3 = this;
	
	            return this.stack.shift().call(this.router, this.req, this, function () {
	                return _this3.next();
	            });
	        }
	    }]);
	
	    return MiddlewareStack;
	}();
	
	MiddlewareStack.global = [];
	Grapnel.MiddlewareStack = MiddlewareStack;
	Grapnel.Route = route_1.default;
	exports = module.exports = Grapnel;
	//# sourceMappingURL=index.js.map

/***/ }),
/* 1 */
/***/ (function(module, exports) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;
	
	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;
	
	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;
	
	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;
	
	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function (n) {
	  if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};
	
	EventEmitter.prototype.emit = function (type) {
	  var er, handler, len, args, i, listeners;
	
	  if (!this._events) this._events = {};
	
	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error || isObject(this._events.error) && !this._events.error.length) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      } else {
	        // At least give some kind of context to the user
	        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
	        err.context = er;
	        throw err;
	      }
	    }
	  }
	
	  handler = this._events[type];
	
	  if (isUndefined(handler)) return false;
	
	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        args = Array.prototype.slice.call(arguments, 1);
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    args = Array.prototype.slice.call(arguments, 1);
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++) {
	      listeners[i].apply(this, args);
	    }
	  }
	
	  return true;
	};
	
	EventEmitter.prototype.addListener = function (type, listener) {
	  var m;
	
	  if (!isFunction(listener)) throw TypeError('listener must be a function');
	
	  if (!this._events) this._events = {};
	
	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener) this.emit('newListener', type, isFunction(listener.listener) ? listener.listener : listener);
	
	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];
	
	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }
	
	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' + 'leak detected. %d listeners added. ' + 'Use emitter.setMaxListeners() to increase limit.', this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.on = EventEmitter.prototype.addListener;
	
	EventEmitter.prototype.once = function (type, listener) {
	  if (!isFunction(listener)) throw TypeError('listener must be a function');
	
	  var fired = false;
	
	  function g() {
	    this.removeListener(type, g);
	
	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }
	
	  g.listener = listener;
	  this.on(type, g);
	
	  return this;
	};
	
	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function (type, listener) {
	  var list, position, length, i;
	
	  if (!isFunction(listener)) throw TypeError('listener must be a function');
	
	  if (!this._events || !this._events[type]) return this;
	
	  list = this._events[type];
	  length = list.length;
	  position = -1;
	
	  if (list === listener || isFunction(list.listener) && list.listener === listener) {
	    delete this._events[type];
	    if (this._events.removeListener) this.emit('removeListener', type, listener);
	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener || list[i].listener && list[i].listener === listener) {
	        position = i;
	        break;
	      }
	    }
	
	    if (position < 0) return this;
	
	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }
	
	    if (this._events.removeListener) this.emit('removeListener', type, listener);
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.removeAllListeners = function (type) {
	  var key, listeners;
	
	  if (!this._events) return this;
	
	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0) this._events = {};else if (this._events[type]) delete this._events[type];
	    return this;
	  }
	
	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }
	
	  listeners = this._events[type];
	
	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else if (listeners) {
	    // LIFO order
	    while (listeners.length) {
	      this.removeListener(type, listeners[listeners.length - 1]);
	    }
	  }
	  delete this._events[type];
	
	  return this;
	};
	
	EventEmitter.prototype.listeners = function (type) {
	  var ret;
	  if (!this._events || !this._events[type]) ret = [];else if (isFunction(this._events[type])) ret = [this._events[type]];else ret = this._events[type].slice();
	  return ret;
	};
	
	EventEmitter.prototype.listenerCount = function (type) {
	  if (this._events) {
	    var evlistener = this._events[type];
	
	    if (isFunction(evlistener)) return 1;else if (evlistener) return evlistener.length;
	  }
	  return 0;
	};
	
	EventEmitter.listenerCount = function (emitter, type) {
	  return emitter.listenerCount(type);
	};
	
	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	
	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	
	function isObject(arg) {
	  return (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' && arg !== null;
	}
	
	function isUndefined(arg) {
	  return arg === void 0;
	}

/***/ }),
/* 2 */
/***/ (function(module, exports) {

	"use strict";
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	Object.defineProperty(exports, "__esModule", { value: true });
	
	var Route = function () {
	    function Route(pathname, keys, sensitive, strict) {
	        _classCallCheck(this, Route);
	
	        this.keys = [];
	        this.strict = false;
	        this.sensitive = false;
	        this.path = pathname;
	        this.regex = this.create();
	    }
	
	    _createClass(Route, [{
	        key: "parse",
	        value: function parse(pathname) {
	            var _this = this;
	
	            var match = pathname.match(this.regex);
	            var req = {
	                match: match,
	                params: {},
	                keys: this.keys,
	                matches: (match || []).slice(1)
	            };
	            // Build parameters
	            req.matches.forEach(function (value, i) {
	                var key = _this.keys[i] && _this.keys[i].name ? _this.keys[i].name : i;
	                // Parameter key will be its key or the iteration index. This is useful if a wildcard (*) is matched
	                req.params[key] = value ? decodeURIComponent(value) : undefined;
	            });
	            return req;
	        }
	    }, {
	        key: "create",
	        value: function create() {
	            var _this2 = this;
	
	            if (this.path instanceof RegExp) return this.path;
	            if (this.path instanceof Array) this.path = '(' + this.path.join('|') + ')';
	            // Build route RegExp
	            var newPath = this.path.concat(this.strict ? '' : '/?').replace(/\/\(/g, '(?:/').replace(/\+/g, '__plus__').replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function (_, slash, format, key, capture, optional) {
	                _this2.keys.push({
	                    name: key,
	                    optional: !!optional
	                });
	                slash = slash || '';
	                return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || format && '([^/.]+?)' || '([^/]+?)') + ')' + (optional || '');
	            }).replace(/([\/.])/g, '\\$1').replace(/__plus__/g, '(.+)').replace(/\*/g, '(.*)');
	            return new RegExp('^' + newPath + '$', this.sensitive ? '' : 'i');
	        }
	    }]);
	
	    return Route;
	}();
	
	exports.default = Route;
	//# sourceMappingURL=route.js.map

/***/ })
/******/ ]);
//# sourceMappingURL=grapnel.js.map