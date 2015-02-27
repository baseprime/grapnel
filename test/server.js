// Simple "Hello World!" app
var http = require('http'),
    Grapnel = require('./grapnel'),
    router = new Grapnel();

['GET', 'POST', 'PUT', 'DELETE'].forEach(function(verb){
    router[verb.toLowerCase()] = function(){
        var args = Array.prototype.slice.call(arguments);
    
        args.splice(1, 0, function(req, res, next){
            if(req.method === verb) next();
        });

        return this.add.apply(this, args);
    }
});

router.post('/', function(req, event){
    var data = '';

    req.on('data', function(chunk) {
        data += chunk.toString();
    });
    
    req.on('end', function(){
        console.log(JSON.parse(data));
        req.response.end('Hello world!', 200);
    });
});

router.get('/', function(req){
    req.response.end('Hello World!', 200);
});

http.createServer(function(req, res){
    router.bind('match', function(event, _req){
        for(var prop in req){
            _req[prop] = req[prop];
            _req.response = res;
        }
    }).navigate(req.url);
}).listen(3001);
