export function identifierToJs (identifier) {
  return identifier.charAt(0).toLowerCase() + identifier.slice(1);
}

export function identifierFromJs (identifier) {
  return identifier.charAt(0).toUpperCase() + identifier.slice(1);
}
