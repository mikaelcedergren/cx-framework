#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  symlink,
} from 'node:fs/promises';

const packageName = '@mikaelcedergren/cx-framework';
const scriptPath = fileURLToPath(import.meta.url);

function printHelp() {
  console.log(`Expose the packaged cx-framework skills to Codex in a consuming repository.

Usage:
  cx-framework-skills
  cx-framework-skills --root /path/to/project

Options:
  --root <path>  Consumer repository root. Defaults to the current directory.
  --help         Show this help.

The command creates symlinked skill folders under .agents/skills. It never copies skill bodies or
overwrites an existing local skill.
`);
}

function parseArgs(argv) {
  const options = { projectRoot: process.cwd() };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      printHelp();
      return null;
    }

    if (arg === '--root') {
      const root = argv[index + 1];
      if (!root) {
        throw new Error('--root requires a path.');
      }
      options.projectRoot = root;
      index += 1;
      continue;
    }

    if (arg.startsWith('--root=')) {
      options.projectRoot = arg.slice('--root='.length);
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

async function pathStats(filePath) {
  try {
    return await lstat(filePath);
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function assertProjectRoot(projectRoot) {
  const stats = await pathStats(projectRoot);
  if (!stats?.isDirectory()) {
    throw new Error(`Consumer root must be an existing directory: ${projectRoot}`);
  }

  const manifestPath = path.join(projectRoot, 'package.json');
  const manifestStats = await pathStats(manifestPath);
  if (!manifestStats?.isFile()) {
    throw new Error(`Consumer root must contain package.json: ${projectRoot}`);
  }
}

async function findInstalledPackage(searchRoot) {
  let current = path.resolve(searchRoot);

  while (true) {
    const candidate = path.join(
      current,
      'node_modules',
      '@mikaelcedergren',
      'cx-framework',
    );
    const manifestPath = path.join(candidate, 'package.json');
    const manifestStats = await pathStats(manifestPath);

    if (manifestStats?.isFile()) {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      if (manifest.name === packageName) {
        return candidate;
      }
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  throw new Error(
    `Could not find ${packageName} in node_modules at or above ${searchRoot}. Install the package before exposing its skills.`,
  );
}

async function packagedSkillNames(packageRoot) {
  const skillsRoot = path.join(packageRoot, 'ai', 'skills');
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const names = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillPath = path.join(skillsRoot, entry.name, 'SKILL.md');
    const skillStats = await pathStats(skillPath);
    if (skillStats?.isFile()) {
      names.push(entry.name);
    }
  }

  names.sort((left, right) => left.localeCompare(right));
  if (names.length === 0) {
    throw new Error(`No packaged skills found in ${skillsRoot}.`);
  }
  return names;
}

async function bridgeState(sourcePath, destinationPath) {
  const destinationStats = await pathStats(destinationPath);
  if (!destinationStats) {
    return 'missing';
  }

  if (!destinationStats.isSymbolicLink()) {
    return 'conflict';
  }

  try {
    const [sourceRealPath, destinationRealPath] = await Promise.all([
      realpath(sourcePath),
      realpath(destinationPath),
    ]);
    return sourceRealPath === destinationRealPath ? 'current' : 'conflict';
  } catch {
    return 'conflict';
  }
}

export async function installSkillBridges({
  projectRoot = process.cwd(),
  packageRoot = null,
  packageSearchRoot = process.cwd(),
} = {}) {
  const requestedRoot = path.resolve(projectRoot);
  await assertProjectRoot(requestedRoot);
  const consumerRoot = await realpath(requestedRoot);

  const installedPackageRoot = packageRoot
    ? path.resolve(packageRoot)
    : await findInstalledPackage(packageSearchRoot);
  const names = await packagedSkillNames(installedPackageRoot);
  const discoveryRoot = path.join(consumerRoot, '.agents', 'skills');
  const bridges = [];

  for (const name of names) {
    const sourcePath = path.join(installedPackageRoot, 'ai', 'skills', name);
    const destinationPath = path.join(discoveryRoot, name);
    const state = await bridgeState(sourcePath, destinationPath);
    bridges.push({ destinationPath, name, sourcePath, state });
  }

  const conflicts = bridges.filter(bridge => bridge.state === 'conflict');
  if (conflicts.length > 0) {
    throw new Error(
      `Refusing to overwrite existing local skills:\n${conflicts
        .map(bridge => `- ${path.relative(consumerRoot, bridge.destinationPath)}`)
        .join('\n')}`,
    );
  }

  await mkdir(discoveryRoot, { recursive: true });
  const created = [];
  for (const bridge of bridges) {
    if (bridge.state === 'current') {
      continue;
    }

    const target = process.platform === 'win32'
      ? bridge.sourcePath
      : path.relative(path.dirname(bridge.destinationPath), bridge.sourcePath);
    await symlink(target, bridge.destinationPath, process.platform === 'win32' ? 'junction' : 'dir');
    created.push(bridge.name);
  }

  return {
    created,
    current: bridges.filter(bridge => bridge.state === 'current').map(bridge => bridge.name),
    discoveryRoot,
    names,
    packageRoot: installedPackageRoot,
    projectRoot: consumerRoot,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options) {
    return;
  }

  const result = await installSkillBridges(options);
  const relativeRoot = path.relative(result.projectRoot, result.discoveryRoot) || '.';
  console.log(
    `Exposed ${result.names.length} cx-framework skills in ${relativeRoot} ` +
      `(${result.created.length} created, ${result.current.length} already current).`,
  );
  console.log('Restart Codex if the skills do not appear automatically.');
}

async function isMainModule() {
  if (!process.argv[1]) {
    return false;
  }

  try {
    const [entryPath, modulePath] = await Promise.all([
      realpath(process.argv[1]),
      realpath(scriptPath),
    ]);
    return entryPath === modulePath;
  } catch {
    return path.resolve(process.argv[1]) === scriptPath;
  }
}

if (await isMainModule()) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
