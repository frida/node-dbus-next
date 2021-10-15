const EventEmitter = require('events').EventEmitter;
const message = require('./message');
const clientHandshake = require('./handshake');
const { Message } = require('./message-type');
const { messageToJsFmt, marshallMessage } = require('./marshall-compat');
const createStream = require('./stream.js');

function createConnection (opts) {
  const self = new EventEmitter();
  opts = opts || {};
  let { stream, negotiateUnixFd = false } = opts;
  if (stream) {
    self.mode = 'p2p';
    stream.supportsUnixFd = negotiateUnixFd;
  } else {
    self.mode = 'bus';
    stream = createStream(opts);
    stream.setNoDelay && stream.setNoDelay();
  }
  self.stream = stream;

  stream.on('error', function (err) {
    // forward network and stream errors
    self.emit('error', err);
  });

  stream.on('end', function () {
    self.emit('end');
    self.message = function () {
      self.emit('error', new Error('Tried to write a message to a closed stream'));
    };
  });

  self.end = function () {
    stream.end();
    return self;
  };

  function afterHandshake (error, guid) {
    if (error) {
      return self.emit('error', error);
    }
    self.guid = guid;
    self.emit('connect');
    message.unmarshalMessages(
      stream,
      function (message) {
        try {
          message = new Message(messageToJsFmt(message));
        } catch (err) {
          self.emit('error', err, `There was an error receiving a message (this is probably a bug in dbus-next): ${message}`);
          return;
        }
        self.emit('message', message);
      },
      opts
    );
  }
  stream.once('connect', () => clientHandshake(stream, opts, afterHandshake));
  stream.once('connected', () => clientHandshake(stream, opts, afterHandshake));

  self._messages = [];

  // pre-connect version, buffers all messages. replaced after connect
  self.message = function (msg) {
    self._messages.push(msg);
  };

  self.once('connect', function () {
    self.state = 'connected';
    for (let i = 0; i < self._messages.length; ++i) {
      const [data, fds] = marshallMessage(self._messages[i]);
      if (stream.supportsUnixFd) {
        stream.write({ data, fds });
      } else {
        stream.write(data);
      }
    }
    self._messages.length = 0;

    // no need to buffer once connected
    self.message = function (msg) {
      if (!stream.writable) {
        throw new Error('Cannot send message, stream is closed');
      }
      const [data, fds] = marshallMessage(msg);
      if (stream.supportsUnixFd) {
        stream.write({ data, fds });
      } else {
        if (fds.length > 0) {
          console.warn('Sending file descriptors is not supported in current bus connection');
        }
        stream.write(data);
      }
    };
  });

  return self;
}

module.exports = createConnection;
