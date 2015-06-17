var Hapi = require('hapi'),
    Good = require('good'),
    Path = require('path'),
    server = new Hapi.Server();
    // server = new Hapi.Server({
    //     connections : {
    //         routes : {
    //             files : {
    //                 relativeTo : Path.join(__dirname, 'public')
    //             }
    //
    //         }
    //     }
    // });

server.views({
    engines : {
        html : require('handlebars')
    },
    //relativeTo : __dirname,
    path : Path.join(__dirname, 'public'),
    // path : "templates",
    // helpersPath : "helpers"

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
                        // wreck : {
                        //     //???
                        // }
                     }
        },
        // {
        //     reporter : require('good-console'),
        //     events : { ops : "*" }
        // }
    ]
};

// actually plug in the plugin
server.register({ register: Good, options: options }, function (err) {
        if (err) {
            throw err; // something bad happened loading the plugin
        }
        server.start(function () {
            server.log('info', 'Server running at: ' + server.info.uri);
        });
    });
