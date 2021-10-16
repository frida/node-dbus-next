import process from 'process';

export default function auth (stream, opts, cb) {
  const { authMethods } = opts;
  const skipAuthentication = authMethods !== undefined && authMethods.length === 0;
  if (!skipAuthentication) {
    throw new Error('not supported');
  }
  process.nextTick(() => { cb(null, null); });
}
