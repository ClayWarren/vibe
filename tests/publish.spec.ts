import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { install } from '../src/pm/index.js';
import { publishModule } from '../src/module/registry.js';

describe('publish/install via local registry', () => {
  it('publishes module to local registry and installs it', async () => {
    const tmpMod = path.join(process.cwd(), 'tmp_mod_dir');
    fs.mkdirSync(tmpMod, { recursive: true });
    fs.writeFileSync(
      path.join(tmpMod, 'vcl.json'),
      JSON.stringify({ name: 'localpkg', version: '0.0.1' }, null, 2)
    );
    fs.writeFileSync(path.join(tmpMod, 'main.vcl'), 'let x = 1.', 'utf8');
    const registry = path.join(process.cwd(), '.vcl-registry-test');
    publishModule(tmpMod, registry);

    const installDir = path.join(process.cwd(), 'tmp_proj');
    fs.mkdirSync(installDir, { recursive: true });
    fs.writeFileSync(path.join(installDir, 'vcl.json'), JSON.stringify({ name: 'app', version: '0.0.0' }));

    await install('localpkg', '0.0.1', installDir, registry);

    const installed = path.join(installDir, 'vcl_modules', 'localpkg', 'main.vcl');
    expect(fs.existsSync(installed)).toBe(true);

    fs.rmSync(tmpMod, { recursive: true, force: true });
    fs.rmSync(registry, { recursive: true, force: true });
    fs.rmSync(installDir, { recursive: true, force: true });
  });
});
