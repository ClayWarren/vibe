import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { fetchTarball, copyLocalModule } from '../module/fetch.js';

export type Manifest = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
};

const MANIFEST = 'vcl.json';

export function readManifest(cwd = process.cwd()): Manifest | null {
  const file = path.join(cwd, MANIFEST);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function writeManifest(manifest: Manifest, cwd = process.cwd()) {
  const file = path.join(cwd, MANIFEST);
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2));
}

export async function install(dep: string, version = 'latest', cwd = process.cwd(), registry?: string) {
  const mf = readManifest(cwd) ?? { name: 'app', version: '0.0.0', dependencies: {} };
  mf.dependencies = mf.dependencies || {};
  mf.dependencies[dep] = version;
  writeManifest(mf, cwd);
  const modDir = path.join(cwd, 'vcl_modules', dep.replace(/[:\/]/g, '_'));
  if (!fs.existsSync(modDir)) fs.mkdirSync(modDir, { recursive: true });
  const main = path.join(modDir, 'main.vcl');
  if (fs.existsSync(main)) {
    console.log(`Added ${dep}@${version} (already present in vcl_modules)`);
    return;
  }

  // 1) bundled stdlib/modules (like TS ships lib.d.ts)
  const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const bundledDir = path.join(pkgRoot, 'vcl_modules', dep);
  if (fs.existsSync(path.join(bundledDir, 'main.vcl'))) {
    copyDir(bundledDir, modDir);
    console.log(`Installed bundled module ${dep} from package contents`);
    return;
  }

  // 2) npm registry tarball (TypeScript-style distribution)
  try {
    const tarball = await resolveNpmTarball(dep, version);
    await fetchTarball(tarball, modDir);
    if (fs.existsSync(main)) {
      console.log(`Added ${dep}@${version} from npm (${tarball})`);
      return;
    }
  } catch (err) {
    // fall through to local registry
  }

  // 3) local/override registry (folder or URL)
  const base = registry || process.env.VCL_REGISTRY || path.join(process.env.HOME || process.cwd(), '.vcl-registry');
  try {
    if (fs.existsSync(base)) {
      const src = path.join(base, dep);
      await copyLocalModule(src, modDir);
    } else {
      const url = looksLikeUrl(dep) ? dep : `${base}/${dep}-${version}.tgz`;
      await fetchTarball(url, modDir);
    }
  } catch (err) {
    throw new Error(`Failed to install ${dep}@${version} from registry '${base}': ${(err as Error).message}`);
  }

  if (!fs.existsSync(main)) {
    throw new Error(`Registry did not provide main.vcl for ${dep}@${version} (looked in ${modDir})`);
  }

  console.log(`Added ${dep}@${version} to vcl.json and installed into vcl_modules/${dep}/main.vcl`);
}

function looksLikeUrl(s: string) {
  return s.startsWith('http://') || s.startsWith('https://');
}

async function resolveNpmTarball(dep: string, version: string): Promise<string> {
  const npm = process.env.NPM_REGISTRY || 'https://registry.npmjs.org';
  if (looksLikeUrl(dep)) return dep;

  const metaUrl = `${npm}/${dep.replace(/\//g, '%2f')}`;
  const meta = await fetchJson(metaUrl);
  const ver = version === 'latest' ? meta['dist-tags']?.latest : version;
  const resolved = meta.versions?.[ver]?.dist?.tarball;
  if (!resolved) throw new Error(`No tarball found for ${dep}@${ver}`);
  return resolved as string;
}

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk.toString()));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
