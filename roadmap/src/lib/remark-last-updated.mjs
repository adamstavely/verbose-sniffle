import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';

/**
 * Remark plugin: inject `lastUpdated` (ISO date string) into MDX frontmatter,
 * derived from the file's last git commit date. Falls back to the filesystem
 * mtime when git history isn't available (uncommitted file, or a shallow/no-git
 * checkout — e.g. some CI hosts). Read by MdxDocLayout to render "Last updated".
 */
export function remarkLastUpdated() {
  return function (_tree, file) {
    const filepath = file.history?.[0] ?? file.path;
    let iso = null;

    if (filepath) {
      try {
        const out = execSync(`git log -1 --format=%cI -- "${filepath}"`, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        iso = out || null;
      } catch {
        iso = null;
      }

      if (!iso) {
        try {
          iso = statSync(filepath).mtime.toISOString();
        } catch {
          iso = null;
        }
      }
    }

    file.data.astro.frontmatter.lastUpdated = iso;
  };
}
