import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

const buildCss = async () => {
  const inPath = path.join(__dirname, 'src', 'index.css');
  const outPath = path.join(distDir, 'styles.css');
  const css = fs.readFileSync(inPath, 'utf8');

  const result = await postcss([tailwind({ optimize: { minify: true } }), autoprefixer]).process(css, {
    from: inPath,
    to: outPath,
    map: { inline: false },
  });

  fs.writeFileSync(outPath, result.css);
  if (result.map) fs.writeFileSync(`${outPath}.map`, result.map.toString());
};

const esbuildExe = (() => {
  if (process.platform === 'win32') {
    const winExe = path.join(__dirname, 'node_modules', '@esbuild', 'win32-x64', 'esbuild.exe');
    if (fs.existsSync(winExe)) return winExe;
  }
  return path.join(__dirname, 'node_modules', '.bin', process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild');
})();

const esbuildArgs = [
  'src/main.jsx',
  '--bundle',
  '--format=esm',
  '--minify',
  '--sourcemap',
  '--outfile=dist/bundle.js',
  '--jsx=automatic',
  '--loader:.js=jsx',
  '--loader:.jsx=jsx',
];

const run = async () => {
  await buildCss();

  const proc = spawn(esbuildExe, esbuildArgs, { stdio: 'inherit', shell: false });
  proc.on('exit', (code) => process.exit(code ?? 1));
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
