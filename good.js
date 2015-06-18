var Hapi = require('hapi'),
    Good = require('good'),
    Path = require('path'),
    Handlebars = require('handlebars'),
    server = new Hapi.Server();

server.views({
    engines : {
        html : Handlebars,
    },
    path : Path.join(__dirname, 'public'),
    helpersPath : "helpers"

});
server.connection({ port: 3000 });

var routes = require('./routes')(server);

// passes into the plugin
var options = {
    reporters : [
        {
            reporter : require('good-file'),
            events : { response : "*" },
            config : "./our-log"
        },
        {
            reporter : require('good-http'),
            events : { request : "*" },
            config : {
                        endpoint : 'http://localhost:3000/analytics',
                        threshold : 0,
                     }
        },
    ]
};

// actually plug in the plugin
server.register({ register: Good, options: options }, function (err) {
        if (err) {
            throw err;
        }
        server.start(function () {
            server.log('info', 'Server running at: ' + server.info.uri);
        });
    });
