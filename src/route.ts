
export default class Route {
    path: string | string[] | RegExp;
    keys: ParsedRoute['keys'] = [];
    regex: RegExp;
    strict?: boolean = false;
    sensitive?: boolean = false;

    constructor(pathname: any, keys?: any[], sensitive?: boolean, strict?: boolean) {
        this.path = pathname;
        this.regex = this.create();
    }

    parse(pathname: string) {
        let match = pathname.match(this.regex);
        let req: ParsedRoute = {
            match,
            params: <any>{},
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
        if (this.path instanceof RegExp) return this.path;
        if (this.path instanceof Array) this.path = '(' + this.path.join('|') + ')';
        // Build route RegExp
        let newPath = this.path.concat(this.strict ? '' : '/?')
            .replace(/\/\(/g, '(?:/')
            .replace(/\+/g, '__plus__')
            .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, (_: any, slash: any, format: any, key: any, capture: any, optional: any) => {
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

export interface ParsedRoute {
    params: any;
    keys: { name: string; optional: boolean; }[];
    matches: string[];
    match: string[];
}