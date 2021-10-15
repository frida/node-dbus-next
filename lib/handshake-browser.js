import process from 'process';

export default function auth (stream, opts, cb) {
  const skipAuthentication = authMethods.length === 0;
  if (!skipAuthentication) {
    throw new Error('not supported');
  }
  process.nextTick(() => { cb(null, null); });
}
