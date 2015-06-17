
var routes = (function(server){
    var db = {};

    // server.route({
    //     method: 'GET',
    //     path: '/',
    //     handler: function (request, reply) {
    //         reply('Hello, world!');
    //     }
    // });

    // could use this for user auth
    server.route({
        method: 'GET',
        path: '/{name?}',
        handler: function (request, reply) {
            var name = request.params.name ? encodeURIComponent(request.params.name) : "world";
            console.log("routes.js says: We got a request!");
            reply.view("index", {data : name});

        }
    });

    server.route({
        method: 'POST',
        path: '/login',
        handler: function (request, reply) {
            request.log(request.payload.login);
            // request.log(request.params.name);
            // reply("welcome, " + request.params.name);
            reply(request.payload.login);
        }
    });

    server.route({
        method: 'GET',
        path: '/login',
        handler: function (request, reply) {
                                                                                    console.log("routes.js says: login/{name}");
            // request.log(request.params.name);
            // reply("welcome, " + request.params.name);
            reply.file("./public/login.html");
        }
    });

    server.route({
        // used by good-http
        method: 'POST',
        path: '/analytics',
        handler: function (request, reply) {
            var obj = request.payload.events.request[0];
            if (obj.path !== "/favicon.ico"){
                console.log(request.payload.events.request[0]);

                if (db.hasOwnProperty(obj.tags[0])){
                    db[obj.tags[0]].push(obj.timestamp);
                }
                else{
                    db[obj.tags[0]] = [obj.timestamp];
                }
            }

        }
    });

    server.route({
        // used by good
        method: 'GET',
        path: '/analytics',
        handler: function (request, reply) {
            var obj = {};

            for (var key in db){
                obj.key = db[key].toString();
            }



            reply.view("analytics", {users : db});
        }
    });

});

module.exports = routes;
