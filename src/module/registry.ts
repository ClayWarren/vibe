import fs from 'fs';
import path from 'path';
import { readManifest } from '../pm/index.js';
import { copyLocalModule } from './fetch.js';

export function publishModule(sourceDir: string, registryDir: string) {
  const mf = readManifest(sourceDir);
  if (!mf) throw new Error('vcl.json not found in module');
  const dest = path.join(registryDir, mf.name);
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  copyDir(sourceDir, dest);
  console.log(`Published ${mf.name}@${mf.version} to ${dest}`);
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
