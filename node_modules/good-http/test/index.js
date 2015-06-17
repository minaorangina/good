// Load modules

var EventEmitter = require('events').EventEmitter;
var Stream = require('stream');
var Http = require('http');
var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var GoodHttp = require('..');
var Hoek = require('hoek');

// Declare internals

var internals = {};

internals.isSorted = function (elements) {

    var i = 0;
    var il = elements.length;

    while (i < il && elements[i + 1]) {

        if (elements[i].timestamp > elements[i + 1].timestamp) {
            return false;
        }
        ++i;
    }
    return true;
};

internals.getUri = function (server) {

    var address = server.address();

    return 'http://' + address.address + ':' + address.port;
};

internals.readStream = function (done) {

    var result = new Stream.Readable({ objectMode: true });
    result._read = Hoek.ignore;

    if (typeof done === 'function') {
        result.once('end', done);
    }

    return result;
};

// Test shortcuts

var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('GoodHttp', function () {

    it('allows creation without using new', function (done) {

        var reporter = GoodHttp({ log: '*' }, { endpoint: true });
        expect(reporter).to.exist();
        done();
    });

    it('allows creation using new', function (done) {

        var reporter = new GoodHttp({ log: '*' }, { endpoint: true });
        expect(reporter).to.exist();
        done();
    });

    it('throws an error if missing endpoint', function (done) {

        expect(function () {

            var reporter = GoodHttp(null, null);
        }).to.throw('config.endpoint must be a string');
        done();
    });

    it('does not report if the event que is empty', function (done) {

        var reporter = GoodHttp({ log: '*'}, { endpoint: 'http://localhost:31337', threshold: 5 });
        var result = reporter._sendMessages();
        expect(result).to.not.exist();
        done();
    });

    it('honors the threshold setting and sends the events in a batch', function (done) {

        var stream = internals.readStream();
        var hitCount = 0;
        var ee = new EventEmitter();
        var server = Http.createServer(function (req, res) {

            var data = '';
            hitCount++;

            req.on('data', function (chunk) {

                data += chunk;
            });
            req.on('end', function () {

                var payload = JSON.parse(data);
                var events = payload.events.log;

                expect(req.headers['x-api-key']).to.equal('12345');
                expect(payload.schema).to.equal('good-http');
                expect(events.length).to.equal(5);

                if (hitCount === 1) {
                    expect(events[4].id).to.equal(4);
                    expect(events[4].event).to.equal('log');
                    res.end();
                }
                else if (hitCount === 2) {
                    expect(events[4].id).to.equal(9);
                    expect(events[4].event).to.equal('log');

                    res.end();
                    server.close(done);
                }
            });
        });

        server.listen(0, '127.0.0.1', function () {

            var reporter = GoodHttp({ log: '*' }, {
                endpoint: internals.getUri(server),
                threshold: 5,
                wreck: {
                    headers: {
                        'x-api-key': 12345
                    }
                }
            });

            reporter.init(stream, ee, function (err) {

                expect(err).to.not.exist();

                for (var i = 0; i < 10; ++i) {
                    stream.push({
                        id: i,
                        value: 'this is data for item ' + 1,
                        event: 'log'
                    });
                }
            });
        });
    });

    it('sends each event individually if threshold is 0', function (done) {

        var stream = internals.readStream();
        var hitCount = 0;
        var ee = new EventEmitter();
        var server = Http.createServer(function (req, res) {

            var data = '';
            req.on('data', function (chunk) {

                data += chunk;
            });
            req.on('end', function () {

                hitCount++;
                var payload = JSON.parse(data);

                expect(payload.events).to.exist();
                expect(payload.events.log).to.exist();
                expect(payload.events.log.length).to.equal(1);
                expect(payload.events.log[0].id).to.equal(hitCount - 1);

                res.writeHead(200);
                res.end();
                if (hitCount === 10) {
                    server.close(done);
                }
            });
        });

        server.listen(0, '127.0.01', function () {

            var reporter = new GoodHttp({ log: '*' }, {
                endpoint: internals.getUri(server),
                threshold: 0
            });

            reporter.init(stream, ee, function (err) {

                expect(err).to.not.exist();

                for (var i = 0; i < 10; ++i) {

                    stream.push({
                        id: i,
                        value: 'this is data for item ' + 1,
                        event: 'log'
                    });
                }
            });
        });
    });

    it('sends the events in an envelop grouped by type and ordered by timestamp', function (done) {

        var stream = internals.readStream();
        var hitCount = 0;
        var ee = new EventEmitter();
        var server = Http.createServer(function (req, res) {

            hitCount++;
            var data = '';

            req.on('data', function (chunk) {

                data += chunk;
            });

            req.on('end', function () {

                var payload = JSON.parse(data);
                var events = payload.events;

                expect(req.headers['x-api-key']).to.equal('12345');
                expect(payload.schema).to.equal('good-http');

                expect(events.log).to.exist();
                expect(events.request).to.exist();

                expect(internals.isSorted(events.log)).to.equal(true);
                expect(internals.isSorted(events.request)).to.equal(true);

                if (hitCount === 1) {
                    expect(events.log.length).to.equal(3);
                    expect(events.request.length).to.equal(2);
                    res.end();
                }
                else if (hitCount === 2) {
                    expect(events.log.length).to.equal(2);
                    expect(events.request.length).to.equal(3);
                    res.end();
                    server.close(done);
                }
            });
        });

        server.listen(0, '127.0.0.1', function () {

            var reporter = new GoodHttp({
                log: '*',
                request: '*'
            }, {
                endpoint: internals.getUri(server),
                threshold: 5,
                wreck: {
                    headers: {
                        'x-api-key': 12345
                    }
                }
            });

            reporter.init(stream, ee, function (err) {

                expect(err).to.not.exist();

                for (var i = 0; i < 10; ++i) {

                    var eventType = i % 2 === 0 ? 'log' : 'request';

                    stream.push({
                        id: i,
                        value: 'this is data for item ' + 1,
                        timestamp: Math.floor(Date.now() + (Math.random() * 10000000000)),
                        event: eventType
                    });
                }
            });
        });
    });

    it('handles circular object references correctly', function (done) {

        var stream = internals.readStream();
        var hitCount = 0;
        var ee = new EventEmitter();
        var server = Http.createServer(function (req, res) {

            var data = '';
            hitCount++;

            req.on('data', function (chunk) {

                data += chunk;
            });
            req.on('end', function () {

                var events = JSON.parse(data);
                events = events.events;

                expect(events).to.exist();
                expect(events.log).to.exist();
                expect(events.log.length).to.equal(5);
                expect(events.log[0]._data).to.equal('[Circular ~.events.log.0]');

                expect(hitCount).to.equal(1);

                res.end();

                server.close(done);
            });
        });

        server.listen(0, '127.0.0.1', function () {

            var reporter = new GoodHttp({ log: '*' }, {
                endpoint: internals.getUri(server),
                threshold: 5
            });

            reporter.init(stream, ee, function (err) {

                expect(err).to.not.exist();

                for (var i = 0; i < 5; ++i) {

                    var data = {
                        event: 'log',
                        timestamp: Date.now(),
                        id: i
                    };

                    data._data = data;

                    stream.push(data);
                }
            });
        });
    });

    it('makes a last attempt to send any remaining log entries when the read stream ends', function (done) {

        var hitCount = 0;
        var ee = new EventEmitter();
        var server = Http.createServer(function (req, res) {

            var data = '';
            hitCount++;

            req.on('data', function (chunk) {

                data += chunk;
            });
            req.on('end', function () {

                var payload = JSON.parse(data);
                var events = payload.events;

                expect(events.log).to.exist();
                expect(events.log.length).to.equal(2);

                res.end();
                server.close(done);
            });
        });

        server.listen(0, '127.0.0.1', function () {

            var stream = internals.readStream();
            var reporter = new GoodHttp({ log: '*' }, {
                endpoint: internals.getUri(server),
                threshold: 3,
                wreck: {
                    headers: {
                        'x-api-key': 12345
                    }
                }
            });

            reporter.init(stream, ee, function (err) {

                expect(err).to.not.exist();

                stream.push({
                    event: 'log',
                    timestamp: Date.now(),
                    id: 1
                });
                stream.push({
                    event: 'log',
                    timestamp: Date.now(),
                    id: 2
                });
                stream.push(null);
            });
        });
    });
});
