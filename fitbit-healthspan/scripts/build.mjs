// Bundles the web app into www/ (used by Capacitor for iOS and by server.js for the browser build).
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'public');
const out = path.join(root, 'www');

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });

await build({
  entryPoints: [path.join(src, 'app.js')],
  bundle: true,
  format: 'esm',
  target: ['safari16', 'chrome110'],
  minify: true,
  sourcemap: false,
  outfile: path.join(out, 'app.js'),
  logLevel: 'warning',
});

const { APP } = await import(pathToFileURL(path.join(src, 'app.config.js')).href);
const STATIC = ['index.html', 'styles.css', 'icon.svg', 'manifest.webmanifest', 'privacy.html', 'terms.html', 'support.html'];
for (const f of STATIC) {
  try {
    let body = await fs.readFile(path.join(src, f), 'utf8');
    // Brand + contact come from app.config.js so renaming the app is a one-line change.
    if (f.endsWith('.html') || f.endsWith('.webmanifest')) body = body.replaceAll('Vitalspan', APP.name).replaceAll('support@example.com', APP.supportEmail);
    await fs.writeFile(path.join(out, f), body);
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
}
console.log('Built www/');
