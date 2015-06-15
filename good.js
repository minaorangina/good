// var Hapi = require('hapi');
// var server = new Hapi.Server();
//
// server.connection({host: 'localhost'});
//
// var options = {
//     opsInterval: 1000,
//     reporters: [{
//         reporter: require('good-console'),
//         events: { log: '*', response: '*' }
//     }, {
//         reporter: require('good-file'),
//         events: { ops: '*' },
//         config: './test/fixtures/awesome_log'
//     }, {
//         reporter: 'good-http',
//         events: { error: '*' },
//         config: {
//             endpoint: 'http://prod.logs:3000',
//             wreck: {
//                 headers: { 'x-api-key' : 12345 }
//             }
//         }
//     }]
// };
//
// server.register({
//     register: require('good'),
//     options: options
// }, function (err) {
//
//     if (err) {
//         console.error(err);
//     }
//     else {
//         server.start(function () {
//
//             console.info('Server started at ' + server.info.uri);
//         });
//     }
// });
//
var Hapi = require('hapi');
var Good = require('good');

var server = new Hapi.Server();
server.connection({ port: 3000 });

var db = [];

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('Hello, world!');
    }
});

server.route({
    method: 'GET',
    path: '/{name}',
    handler: function (request, reply) {
        //console.log("We got a request!");
        //request.log('a string');
        reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
        //console.log("frog");
    }
});

server.route({
    // would post to db
    method: 'POST',
    path: '/analytics',
    handler: function (request, reply) {
        console.log("request");
        db.push(request.payload.events.request[0]);
    }
});

server.route({
    // would read from db
    method: 'GET',
    path: '/analytics',
    handler: function (request, reply) {
        var result = "";
        db.forEach(function(e){
            console.log(e);
            for (var key in e){
                result += key + " " + e[key] + "\n";
            }

        });

        reply(result);
    }
});


server.route({
    method: 'GET',
    path: '/login/{name}',
    handler: function (request, reply) {
        console.log("login/{name}");
        request.log(request.params.name);
        reply("welcome, " + request.params.name);
    }
});

server.register({
    register: Good,
    options: {
        reporters: [{
                    reporter: require('good-http'),
                    events: { request: '*' },
                    config: {
                        endpoint : 'http://localhost:3000/analytics',
                        threshold: 0
                        // ,wreck: {
                        //     headers: { 'x-api-key' : 12345 }
                        //     }
                    }
        }]
    }
}, function (err) {
    if (err) {
        throw err; // something bad happened loading the plugin
    }

    server.start(function () {
        server.log('info', 'Server running at: ' + server.info.uri);
    });
});
