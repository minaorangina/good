var Hapi = require('hapi');
var Good = require('good');
var level = require('level');
var fs = require('fs');
var db = level('./mydb');
var Path = require('path');
var server = new Hapi.Server();
server.connection({ port: 3000 });

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
        request.log('a giraffe' );
        reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
    }
});



server.route({
    method: 'POST',
    path: '/analytics',
    handler: function (request, reply) {
        console.log("should push to database");
        db.put(request.payload.events.request[0].timestamp, request.payload.events.request[0].id, function (err) {
          if (err){
            console.log('Ooops!', err);
          }
        });

    }
});

server.route({
    method: 'GET',
    path: '/analytics',
    handler: function (request, reply) {
      var result = [];
      db.createReadStream()
      .on('data', function (data) {
        result.push(data.key + ' = ' + data.value + "<br/>");
      })
      .on('end', function () {
        reply.view("analytics", {
          total: result.length,
        });
      });
    }
});

server.views({
  engines: {
    html: require('handlebars')
  },
  path: Path.join(__dirname, "views")
});

server.route({
    method: 'GET',
    path: '/login/{name}',
    handler: function (request, reply) {
        request.log();
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
      }
    }]
  }
}, function (err) {
    if (err) {
        throw err;
    }

    server.start(function () {
        server.log('info', 'Server running at: ' + server.info.uri);
    });
});
