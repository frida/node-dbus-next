import MessageBus from './lib/bus.js';
import createConnection from './lib/connection.js';
import {
  NameFlag,
  RequestNameReply,
  ReleaseNameReply,
  MessageType,
  MessageFlag
} from './lib/constants.js';
import { DBusError } from './lib/errors.js';
import * as iface from './lib/service/interface.js';
import { setBigIntCompat } from './lib/library-options.js';
import { Message } from './lib/message-type.js';
import * as validators from './lib/validators.js';
import { Variant } from './lib/variant.js';

import process from 'process';

let createClient = function(params) {
  let connection = createConnection(params || {});
  return new MessageBus(connection);
};

/**
 * Create a new {@link MessageBus} client on the DBus system bus to connect to
 * interfaces or request service names. Connects to the socket specified by the
 * `DBUS_SYSTEM_BUS_ADDRESS` environment variable or
 * `unix:path=/var/run/dbus/system_bus_socket`.
 *
 * @param {object} [options] - Options for `MessageBus` creation.
 * @param {object} [options.negotiateUnixFd] - Whether this bus should support the negotiation of Unix file descriptors.
 */
export function systemBus(opts) {
  if(!opts)
    opts = {};
  return createClient({
    negotiateUnixFd: opts.negotiateUnixFd,
    busAddress:
      process.env.DBUS_SYSTEM_BUS_ADDRESS ||
      'unix:path=/var/run/dbus/system_bus_socket'
  });
}

/**
 * Create a new {@link MessageBus} client on the DBus session bus to connect to
 * interfaces or request service names.
 *
 * @param {object} [options] - Options for `MessageBus` creation.
 * @param {object} [options.busAddress] - The socket path for the session bus.
 * @param {object} [options.negotiateUnixFd] - Whether this bus should support the negotiation of Unix file descriptors.
 * Defaults to finding the bus address in the manner specified in the DBus
 * specification. The bus address will first be read from the
 * `DBUS_SESSION_BUS_ADDRESS` environment variable and when that is not
 * available, found from the `$HOME/.dbus` directory.
 */
export function sessionBus(opts) {
  return createClient(opts);
}

/**
 * Create a new {@link MessageBus} client to communicate peer-to-peer.
 *
 * @param {object} [stream] - Duplex stream for communication.
 * @param {object} [options] - Options for `MessageBus` creation.
 */
export function peerBus(stream, opts) {
  return createClient({ ...opts, stream });
}

/**
 * Use JSBI as a polyfill for long integer types ('x' and 't') in the client
 * and the service. This is required for Node verisons that do not support the
 * native `BigInt` class which is used by default for these types (version <
 * 10.8.0).
 *
 * @function
 * @param {boolean} compat - pass `true` to use JSBI.
 */
export { setBigIntCompat };

export {
  NameFlag,
  RequestNameReply,
  ReleaseNameReply,
  MessageType,
  MessageFlag,
  iface as interface,
  Variant,
  Message,
  validators,
  DBusError,
};

export default {
  systemBus,
  sessionBus,
  peerBus,
  setBigIntCompat,
  NameFlag,
  RequestNameReply,
  ReleaseNameReply,
  MessageType,
  MessageFlag,
  interface: iface,
  Variant,
  Message,
  validators,
  DBusError,
};
