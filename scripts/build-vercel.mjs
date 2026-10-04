import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Build a separate, static frontend; the original Cloudflare server stays intact.
const root = fileURLToPath(new URL('../', import.meta.url));
const stage = path.join(root, '.vercel-frontend');
await mkdir(stage, { recursive: true });
const serverOnly = new Set(['api', 'classroom.ts', 'teacher-auth.ts', 'room-limits.ts', 'chatgpt-auth.ts', 'player-write.ts']);
// Remove excluded source files left by an earlier build of this generated folder.
for (const file of serverOnly) if (file.endsWith('.ts')) await rm(path.join(stage, 'app', file), { force: true });
for (const directory of ['app', 'components', 'hooks', 'lib', 'public']) {
  await cp(path.join(root, directory), path.join(stage, directory), {
    recursive: true,
    filter: source => !serverOnly.has(path.basename(source)),
  });
}
await cp(path.join(root, 'postcss.config.mjs'), path.join(stage, 'postcss.config.mjs'));
await writeFile(path.join(stage, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
await writeFile(path.join(stage, 'next.config.mjs'), `export default { output: 'export', images: { unoptimized: true } };\n`);
await writeFile(path.join(stage, 'tsconfig.json'), JSON.stringify({
  compilerOptions: { target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], skipLibCheck: true,
    strict: true, noEmit: true, esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler',
    resolveJsonModule: true, isolatedModules: true, jsx: 'react-jsx', paths: { '@/*': ['./*'] } },
  include: ['**/*.ts', '**/*.tsx', '.next/types/**/*.ts'], exclude: ['node_modules'],
}));
const result = spawnSync(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'build', stage, '--webpack'], {
  cwd: root, stdio: 'inherit', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
