"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Route {
    constructor(pathname, keys, sensitive, strict) {
        this.keys = [];
        this.strict = false;
        this.sensitive = false;
        this.path = pathname;
        this.regex = this.create();
    }
    parse(pathname) {
        let match = pathname.match(this.regex);
        let req = {
            match,
            params: {},
            keys: this.keys,
            matches: (match || []).slice(1),
        };
        // Build parameters
        req.matches.forEach((value, i) => {
            var key = (this.keys[i] && this.keys[i].name) ? this.keys[i].name : i;
            // Parameter key will be its key or the iteration index. This is useful if a wildcard (*) is matched
            req.params[key] = (value) ? decodeURIComponent(value) : undefined;
        });
        return req;
    }
    create() {
        if (this.path instanceof RegExp)
            return this.path;
        if (this.path instanceof Array)
            this.path = '(' + this.path.join('|') + ')';
        // Build route RegExp
        let newPath = this.path.concat(this.strict ? '' : '/?')
            .replace(/\/\(/g, '(?:/')
            .replace(/\+/g, '__plus__')
            .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, (_, slash, format, key, capture, optional) => {
            this.keys.push({
                name: key,
                optional: !!optional
            });
            slash = slash || '';
            return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' + (optional || '');
        })
            .replace(/([\/.])/g, '\\$1')
            .replace(/__plus__/g, '(.+)')
            .replace(/\*/g, '(.*)');
        return new RegExp('^' + newPath + '$', this.sensitive ? '' : 'i');
    }
}
exports.default = Route;
//# sourceMappingURL=route.js.map