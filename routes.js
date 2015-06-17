
var routes = (function(server){
    var db = [];

    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            reply('Hello, world!');
        }
    });

    // could use this for user auth
    server.route({
        method: 'GET',
        path: '/{name}',
        handler: function (request, reply) {
                                                                                    console.log("routes.js says: We got a request!");
            request.log('getting something...');
            reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
                                                                                    //console.log("frog");
        }
    });

    server.route({
        method: 'GET',
        path: '/login/{name}',
        handler: function (request, reply) {
                                                                                    console.log("routes.js says: login/{name}");
            request.log(request.params.name);
            reply("welcome, " + request.params.name);
        }
    });

    server.route({
        // used by good-http
        method: 'POST',
        path: '/analytics',
        handler: function (request, reply) {
            db.push(request.payload.events.request[0]);
            db.push(request.payload.events.request[1]);
        }
    });

    server.route({
        // used by good
        method: 'GET',
        path: '/analytics',
        handler: function (request, reply) {
            var result = "";
            db.forEach(function(e){                                                                        console.log(e);
                for (var key in e){
                    result += key + " " + e[key] + "\n";
                }
            });
            reply(result);
        }
    });

});

module.exports = routes;
