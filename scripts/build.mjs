import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { access, cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import * as sass from 'sass';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frameworkRoot = path.resolve(scriptDir, '..');
const outRoot = path.join(frameworkRoot, 'out-tsc');
const distRoot = path.join(frameworkRoot, 'dist');
const ngcPath = path.join(frameworkRoot, 'node_modules', '@angular', 'compiler-cli', 'bundles', 'src', 'bin', 'ngc.js');

// ngc inlines each component's `styleUrl` verbatim; it does not run a stylesheet
// preprocessor. Compile component SCSS to CSS in place, run ngc, then restore
// the original sources so package builds contain browser-readable styles.
const styleSourceDirs = ['primitives', 'patterns'];

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      env: process.env,
    });

    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) {
        resolve(undefined);
        return;
      }
      reject(new Error(`Command failed with exit code ${code ?? 'unknown'}: ${command} ${args.join(' ')}`));
    });
  });
}

async function collectComponentStyles(dir) {
  const found = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await collectComponentStyles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith('.component.scss')) {
      found.push(entryPath);
    }
  }

  return found;
}

async function compileComponentStyles() {
  const files = [];
  for (const dir of styleSourceDirs) {
    files.push(...(await collectComponentStyles(path.join(frameworkRoot, dir))));
  }

  const originals = new Map();
  for (const file of files) {
    originals.set(file, await readFile(file, 'utf8'));
  }

  const compiled = new Map();
  for (const file of files) {
    try {
      compiled.set(file, sass.compile(file, { style: 'compressed', loadPaths: [frameworkRoot] }).css);
    } catch (error) {
      throw new Error(
        `Failed to compile component stylesheet ${path.relative(frameworkRoot, file)}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  await Promise.all([...compiled].map(([file, css]) => writeFile(file, css)));
  return originals;
}

async function restoreComponentStyles(originals) {
  await Promise.all([...originals].map(([file, content]) => writeFile(file, content)));
}

async function buildFramework() {
  await access(ngcPath);
  await rm(outRoot, { recursive: true, force: true });
  await rm(distRoot, { recursive: true, force: true });

  const styleBackups = await compileComponentStyles();
  try {
    await run('node', [ngcPath, '-p', 'tsconfig.lib.json', '--sourceMap', 'false', '--inlineSources', 'false'], frameworkRoot);
  } finally {
    await restoreComponentStyles(styleBackups);
  }

  await mkdir(distRoot, { recursive: true });
  await cp(path.join(outRoot, 'lib'), path.join(distRoot, 'lib'), { recursive: true });
  await rewriteJsModuleSpecifiers(path.join(distRoot, 'lib'));
}

async function rewriteJsModuleSpecifiers(root) {
  const entries = await readdir(root, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      await rewriteJsModuleSpecifiers(entryPath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      await rewriteJsFileSpecifiers(entryPath);
    }
  }
}

async function rewriteJsFileSpecifiers(filePath) {
  const source = await readFile(filePath, 'utf8');
  const fileDir = path.dirname(filePath);
  const next = source
    .replace(/(\bfrom\s*["'])(\.{1,2}\/[^"']+)(["'])/g, (_match, before, specifier, after) => {
      return `${before}${resolveJsSpecifier(fileDir, specifier)}${after}`;
    })
    .replace(/(\bimport\s*["'])(\.{1,2}\/[^"']+)(["'])/g, (_match, before, specifier, after) => {
      return `${before}${resolveJsSpecifier(fileDir, specifier)}${after}`;
    })
    .replace(/(\bimport\(\s*["'])(\.{1,2}\/[^"']+)(["']\s*\))/g, (_match, before, specifier, after) => {
      return `${before}${resolveJsSpecifier(fileDir, specifier)}${after}`;
    });

  if (next !== source) {
    await writeFile(filePath, next);
  }
}

function resolveJsSpecifier(fileDir, specifier) {
  if (/\.(?:cjs|js|json|mjs)$/.test(specifier)) {
    return specifier;
  }

  const absoluteTarget = path.resolve(fileDir, specifier);
  if (fileExistsSync(`${absoluteTarget}.js`)) {
    return `${specifier}.js`;
  }

  if (fileExistsSync(path.join(absoluteTarget, 'index.js'))) {
    return `${specifier}/index.js`;
  }

  return specifier;
}

function fileExistsSync(filePath) {
  return existsSync(filePath);
}

buildFramework().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
