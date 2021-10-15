const libraryOptions = {
  bigIntCompat: false
};

export function getBigIntCompat() {
  return libraryOptions.bigIntCompat;
}

export function setBigIntCompat(val) {
  if (typeof val !== 'boolean') {
    throw new Error('dbus.setBigIntCompat() must be called with a boolean parameter');
  }
  libraryOptions.bigIntCompat = val;
}
