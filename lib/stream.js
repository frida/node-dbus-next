const net = require('net');
const { getDbusAddressFromFs } = require('./address-x11');

function createStream (opts) {
  let { busAddress, negotiateUnixFd } = opts;

  if (negotiateUnixFd === undefined) {
    negotiateUnixFd = false;
  }

  // TODO according to the dbus spec, we should start a new server if the bus
  // address cannot be found.
  if (!busAddress) {
    busAddress = process.env.DBUS_SESSION_BUS_ADDRESS;
  }
  if (!busAddress) {
    busAddress = getDbusAddressFromFs();
  }

  const addresses = busAddress.split(';');
  for (let i = 0; i < addresses.length; ++i) {
    const address = addresses[i];
    const familyParams = address.split(':');
    const family = familyParams[0];
    const params = {};
    familyParams[1].split(',').forEach(function (p) {
      const keyVal = p.split('=');
      params[keyVal[0]] = keyVal[1];
    });

    try {
      switch (family.toLowerCase()) {
        case 'tcp': {
          const host = params.host || 'localhost';
          const port = params.port;
          return net.createConnection(port, host);
        }
        case 'unix': {
          if (params.socket) {
            return net.createConnection(params.socket);
          }
          if (params.abstract) {
            const usocket = require('usocket');
            const sock = new usocket.USocket({ path: '\u0000' + params.abstract });
            sock.supportsUnixFd = negotiateUnixFd;
            return sock;
          }
          if (params.path) {
            try {
              const usocket = require('usocket');
              const sock = new usocket.USocket({ path: params.path });
              sock.supportsUnixFd = negotiateUnixFd;
              return sock;
            } catch (err) {
              // TODO: maybe emit warning?
              return net.createConnection(params.path);
            }
          }
          throw new Error(
            "not enough parameters for 'unix' connection - you need to specify 'socket' or 'abstract' or 'path' parameter"
          );
        }
        case 'unixexec': {
          const eventStream = require('event-stream');
          const spawn = require('child_process').spawn;
          const args = [];
          for (let n = 1; params['arg' + n]; n++) args.push(params['arg' + n]);
          const child = spawn(params.path, args);
          // duplex socket is auto connected so emit connect event next frame
          setTimeout(() => eventStream.emit('connected'), 0);

          return eventStream.duplex(child.stdin, child.stdout);
        }
        default: {
          throw new Error('unknown address type:' + family);
        }
      }
    } catch (e) {
      if (i < addresses.length - 1) {
        console.warn(e.message);
        continue;
      } else {
        throw e;
      }
    }
  }
}

module.exports = createStream;
