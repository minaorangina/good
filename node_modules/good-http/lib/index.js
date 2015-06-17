// Load modules

var Os = require('os');
var GroupBy = require('lodash.groupby');
var Hoek = require('hoek');
var Stringify = require('json-stringify-safe');
var Squeeze = require('good-squeeze').Squeeze;
var Wreck = require('wreck');

// Declare internals

var internals = {
    defaults: {
        threshold: 20,
        schema: 'good-http',
        wreck: {
            timeout: 60000,
            headers: {}
        }
    },
    host: Os.hostname()
};


internals.createEventMap = function (events) {

    // Group the events by the event
    var result = GroupBy(events, 'event');

    // Sort each collection by the timestamp
    var keys = Object.keys(result);
    var predicate = function (a, b) {

        return a.timestamp - b.timestamp;
    };

    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        var eventCollection = result[key];
        eventCollection.sort(predicate);
    }

    return result;
};


module.exports = internals.GoodHttp = function (events, config) {

    if (!(this instanceof internals.GoodHttp)) {
        return new internals.GoodHttp(events, config);
    }

    config = config || {};
    Hoek.assert(config.endpoint, 'config.endpoint must be a string');

    var settings = Hoek.applyToDefaults(internals.defaults, config);

    this._streams = {
        squeeze: Squeeze(events)
    };
    this._eventQueue = [];
    this._settings = settings;
};


internals.GoodHttp.prototype.init = function (stream, emitter, callback) {

    var self = this;

    this._streams.squeeze.on('data', function (data) {

        self._eventQueue.push(data);
        if (self._eventQueue.length >= self._settings.threshold) {
            self._sendMessages();
            self._eventQueue.length = 0;
        }
    });

    this._streams.squeeze.on('end', function () {
        self._sendMessages();
    });

    stream.pipe(this._streams.squeeze);

    callback();
};


internals.GoodHttp.prototype._sendMessages = function () {

    if (!this._eventQueue.length) { return; }

    var envelope = {
        host: internals.host,
        schema: this._settings.schema,
        timeStamp: Date.now()
    };

    envelope.events = internals.createEventMap(this._eventQueue);

    var wreckOptions = {
        payload: Stringify(envelope)
    };

    Hoek.merge(wreckOptions, this._settings.wreck, false);

    // Prevent this from user tampering
    wreckOptions.headers['content-type'] = 'application/json';

    Wreck.request('post', this._settings.endpoint, wreckOptions);
};
