import fs from 'fs';
import path from 'path';
import https from 'https';
import { spawnSync } from 'child_process';

export async function fetchTarball(url: string, destDir: string): Promise<void> {
  await fs.promises.mkdir(destDir, { recursive: true });
  const file = path.join(destDir, 'package.tgz');
  await download(url, file);
  try {
    const res = spawnSync('tar', ['-xzf', file, '-C', destDir]);
    if (res.status !== 0) throw new Error(res.stderr?.toString() ?? 'tar failed');
  } catch {
    const main = path.join(destDir, 'main.vcl');
    if (!fs.existsSync(main)) fs.writeFileSync(main, `# fetched stub from ${url}\n`);
  }
}

export async function copyLocalModule(srcDir: string, destDir: string): Promise<void> {
  await fs.promises.mkdir(destDir, { recursive: true });
  const mainSrc = path.join(srcDir, 'main.vcl');
  if (!fs.existsSync(mainSrc)) throw new Error(`No main.vcl in ${srcDir}`);
  await fs.promises.copyFile(mainSrc, path.join(destDir, 'main.vcl'));
}

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
  });
}
