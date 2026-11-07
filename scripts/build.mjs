import { cp, mkdir, rm } from 'node:fs/promises';

// Recreate generated output so removed pages cannot survive a previous build.
const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of ['index.html', '_redirects', 'about', 'blog', 'contact', 'portal', 'questionnaire', 'services', 'work', 'assets', 'files']) {
  await cp(new URL(entry, root), new URL(entry, output), { recursive: true });
}
