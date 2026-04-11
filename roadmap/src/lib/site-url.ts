/**
 * Prefix a root-relative path with `import.meta.env.BASE_URL` so links work when the app is
 * deployed under a subpath (and stay correct at `/` when `base` is default).
 *
 * @param path - Path without base, e.g. `roadmap`, `developer-guide`, or empty string for home.
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const segment = path.replace(/^\//, '');
  return new URL(segment || '.', new URL(base, 'http://localhost')).pathname;
}
