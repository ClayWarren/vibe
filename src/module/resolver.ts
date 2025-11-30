import fs from 'fs';
import path from 'path';
import { readManifest } from '../pm/index.js';

export function resolveModule(source: string, cwd = process.cwd()): string {
  // local file: source.vcl in cwd
  const localPath = path.join(cwd, `${source}.vcl`);
  if (fs.existsSync(localPath)) return fs.readFileSync(localPath, 'utf8');
  // dependency: look in vcl_modules/<name>/main.vcl
  const modPath = path.join(cwd, 'vcl_modules', source, 'main.vcl');
  if (fs.existsSync(modPath)) return fs.readFileSync(modPath, 'utf8');
  throw new Error(`Cannot resolve module ${source}`);
}
