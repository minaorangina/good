
var routes = (function(server){
    var db = require('level')('./mydb');
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
//
    server.route({
        method: 'POST',
        path: '/login',
        handler: function (request, reply) {
            request.log(request.payload.login);
            reply.view("loggedin", {name : request.payload.login});
        }
    });

    server.route({
        method: 'GET',
        path: '/login',
        handler: function (request, reply) {
            reply.file("./public/login.html");
        }
    });
//
    server.route({
        // used by good-http
        method: 'POST',
        path: '/analytics',
        handler : function (request, reply){
            var object = request.payload.events.request[0];
            db.get(object.tags[0], function (err, value) {
                if (err) {
                    if (err.notFound) {
                        db.put(object.tags[0], object.timestamp, function(err){
                            if (err){
                                console.log("darn");
                            }
                        });
                        return;
                    }
                    // I/O or other error, pass it up the callback chain
                    return callback(err);
                }
                else {
                    db.put(object.tags[0], (value + "," + object.timestamp), function(err){
                        if(err){
                            console.log("that didn't work.");
                            console.log(err);
                        }
                    });
                }
});
        }
    });

    server.route({
        // used by good
        method: 'GET',
        path: '/analytics',
        handler: function (request, reply) {
            var result = [];

            db.createReadStream()
            .on('data', function (data) {
                result.push(data);
            })
            .on('end', function () {
                console.log(result);
                var final = {};
                result.forEach(function(e){
                    console.log(e.key);
                    final[e.key] = e.value;
                });
                console.log(final);
                var counter = 1;
                for (var key in final){
                    var split = final[key].split(",");
                    counter = split.length;

                    final[key] = counter;
                }
                console.log(final);
                reply.view("analytics", {data : final});
            });


        }
    });

});

module.exports = routes;
