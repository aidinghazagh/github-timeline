// GitHub usernames are alphanumeric plus hyphens, up to 39 chars, never starting
// with a hyphen. (Some legacy accounts have doubled or trailing hyphens, so those
// are allowed.) This also keeps path segments like "../" out of API URLs.
const USERNAME_RE = /^[a-z\d][a-z\d-]{0,38}$/i;

export function isValidUsername(name: string): boolean {
  return USERNAME_RE.test(name);
}
