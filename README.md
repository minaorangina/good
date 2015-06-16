# Good

##What?
It's a plugin for Hapi.  You use it to log various details of requests and responses in your Hapi server.  Almost like putting a load of `console.log()`s in your code, but far less horrible.

There are three 'reporters' in Good.  Think of them as flavours:
+ [good-http](https://github.com/hapijs/good-http)
+ [good-file](https://github.com/hapijs/good-file)
+ [good-console](https://github.com/hapijs/good-console)

The reporter is responsible for listening for the data you want to log.

All three reporters log the same stuff.  You choose the reporter that will log your data in your preferred format:

+ **good-file** will report back in a local file  
+ **good-console** will report to the console  
+ **good-http** allows you to direct the log to a specified endpoint in your server

##How?

There are 5 event listeners in Good, which all correspond to Hapi events.

1. **log** listens for `server.log()` events.  Corresponds to *log* in Hapi.
2. **request** listens for `request.log()` events.  Corresponds to *request* in Hapi...
3. **response** corresponds to:
    + *tail* in Hapi, which occurs once a request process has ended??
    + *response* in Hapi, which occurs when a response it sent back to the client
4. **error** listens for errors.  Corresponds to *request-error* in Hapi...
5. **wreck** ... ???


###Using Good within a Hapi server

Good plugs into Hapi via the `.register()` method.
`Server.register(registerObj, callback)`

The server is initialised within the callback.

    var Good = require('good');
    var Server = require('hapi');
    var options = {
                    reporters: [
                        reporterObj,
                        reporterObj,
                        reporterObj
                    ]
                }

    Server.register({register: Good, options: options}, function callback(err){
                    if (err){
                        throw(err);
                    }
                    server.start(function(){
                        server.log('info', 'Server running at: ' + server.info.uri);
                    });
    });
