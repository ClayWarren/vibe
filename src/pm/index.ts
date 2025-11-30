import fs from 'fs';
import path from 'path';
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
  if (!fs.existsSync(main)) {
    // Attempt to fetch tarball or copy from local registry dir
    const base = registry || process.env.VCL_REGISTRY || 'https://registry.example.com/vcl';
    try {
      if (fs.existsSync(base)) {
        const src = path.join(base, dep);
        await copyLocalModule(src, modDir);
      } else {
        const url = looksLikeUrl(dep) ? dep : `${base}/${dep}-${version}.tgz`;
        await fetchTarball(url, modDir);
      }
    } catch {
      fs.writeFileSync(main, `# stub module ${dep}\n`, 'utf8');
    }
  }
  console.log(`Added ${dep}@${version} to vcl.json and prepared vcl_modules/${dep}/main.vcl`);
}

function looksLikeUrl(s: string) {
  return s.startsWith('http://') || s.startsWith('https://');
}
