# good-http

Http(s) broadcasting for Good process monitor

[![Build Status](https://travis-ci.org/hapijs/good-file.svg?branch=master)](https://travis-ci.org/hapijs/good-file) ![Current Version](https://img.shields.io/npm/v/good-http.svg)

Lead Maintainer: [Adam Bretz](https://github.com/arb)

## Usage

`good-http` is a good-reporter implementation to write [hapi](http://hapijs.com/) server events to remote endpoints. It makes a "POST" request with a JSON payload to the supplied `endpoint`.

## Good Http
### GoodHttp (events, config)

Creates a new GoodHttp object where:

- `events` - an object of key value pairs.
  - `key` - one of the supported [good events](https://github.com/hapijs/good) indicating the hapi event to subscribe to
  - `value` - a single string or an array of strings to filter incoming events. "\*" indicates no filtering. `null` and `undefined` are assumed to be "\*"
- `config` - configuration object
  - `endpoint` - full path to remote server to transmit logs.
	- `[threshold]` - number of events to hold before transmission. Defaults to `20`. Set to `0` to have every event start transmission instantly. It is strongly suggested to have a set threshold to make data transmission more efficient.
  - `[wreck]` - configuration object to pass into [`wreck`](https://github.com/hapijs/wreck#advanced). Defaults to `{ timeout: 60000, headers: {} }`. `content-type` is always "application/json".


## Good Http Methods
### `goodhttp.init(stream, emitter, callback)`
Initializes the reporter with the following arguments:

- `stream` - a Node readable stream that will be the source of data for this reporter. It is assumed that `stream` is in `objectMode`.
- `emitter` - an event emitter object.
- `callback` - a callback to execute when the start function has complete all the necessary set up steps and is ready to receive data.

Then the `stream` emits an "end" event, `goodhttp` will transmit any events remaining it it's internal buffer to attempt to prevent data loss.

### Schema

Each POST will match the following schema. Every event will be wrapped inside the `events` key and grouped by the event type and ordered by the timestamp. The payload that is POSTed to the `endpoint` has the following schema:

```json
{
  "host":"servername.home",
  "schema":"good-http",
  "timeStamp":1412710565121,
  "events":{
    "request":[
      {
        "event":"request",
        "timestamp":1413464014739,
        ...
      },
      {
        "event":"request",
        "timestamp":1414221317758,
        ...
      },
      {
        "event":"request",
        "timestamp":1415088216608,
        ...
      }
    ],
    "log":[
      {
        "event":"log",
        "timestamp":1415180913160,
        ...
      },
      {
        "event":"log",
        "timestamp":1422493874390,
        ...
      }
    ]
  }
}
```
