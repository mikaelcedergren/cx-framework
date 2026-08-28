import path from 'node:path';
import os from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import {
  access,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { spawn } from 'node:child_process';
import * as sass from 'sass';
import { assertComponentAuthorityCurrent } from './generate-component-authority.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frameworkRoot = path.resolve(scriptDir, '..');
const distRoot = path.join(frameworkRoot, 'dist');
const ngcPath = path.join(
  frameworkRoot,
  'node_modules',
  '@angular',
  'compiler-cli',
  'bundles',
  'src',
  'bin',
  'ngc.js',
);
const tscPath = path.join(frameworkRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const publicationLockRoot = path.join(
  os.tmpdir(),
  `cx-framework-publish-${createHash('sha256').update(frameworkRoot).digest('hex').slice(0, 16)}.lock`,
);

// ngc inlines each component's `styleUrl` verbatim; it does not run a stylesheet
// preprocessor. Build from an isolated source copy so tracked SCSS is never
// replaced, even briefly, by generated CSS.
const styleSourceDirs = ['primitives', 'patterns'];
const stagingExcludes = new Set([
  'dist',
  'node_modules',
  'out-tsc',
  '.framework-build.status.json',
]);
const publicationPrefix = '.framework-build-publish-';
const publicationLockTimeoutMs = 30_000;
const publicationLockPollMs = 50;

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      env: process.env,
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }
      reject(
        new Error(
          `Command failed with exit code ${code ?? 'unknown'}: ${command} ${args.join(' ')}`,
        ),
      );
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

async function compileComponentStyles(root) {
  const files = [];
  for (const dir of styleSourceDirs) {
    files.push(...(await collectComponentStyles(path.join(root, dir))));
  }

  for (const file of files) {
    try {
      const css = sass.compile(file, {
        style: 'compressed',
        loadPaths: [root],
      }).css;
      await writeFile(file, css);
    } catch (error) {
      throw new Error(
        `Failed to compile component stylesheet ${path.relative(root, file)}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

export async function withStagingFramework(
  runInStaging,
  {
    sourceRoot = frameworkRoot,
    nodeModulesRoot = path.join(sourceRoot, 'node_modules'),
    stagingPrefix = path.join(os.tmpdir(), 'cx-framework-build-'),
  } = {},
) {
  const stagingParent = await mkdtemp(stagingPrefix);
  const stagingRoot = path.join(stagingParent, 'framework');
  try {
    await cp(sourceRoot, stagingRoot, {
      recursive: true,
      filter: (source) => {
        const relative = path.relative(sourceRoot, source);
        const rootName = relative.split(path.sep)[0];
        return (
          relative === '' ||
          (!stagingExcludes.has(rootName) &&
            !rootName.startsWith(publicationPrefix))
        );
      },
    });
    await symlink(
      nodeModulesRoot,
      path.join(stagingRoot, 'node_modules'),
      'dir',
    );
    return await runInStaging(stagingRoot);
  } finally {
    await rm(stagingParent, { recursive: true, force: true });
  }
}

async function acquirePublicationLock(lockRoot, timeoutMs, pollMs) {
  const startedAt = Date.now();
  while (true) {
    try {
      await mkdir(lockRoot);
      const identity = await lstat(lockRoot);
      try {
        await writeFile(
          path.join(lockRoot, 'owner.json'),
          `${JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })}\n`,
        );
      } catch (error) {
        await releasePublicationLock(lockRoot, identity);
        throw error;
      }
      return {
        release: () => releasePublicationLock(lockRoot, identity),
      };
    } catch (error) {
      if (!(error && typeof error === 'object' && error.code === 'EEXIST')) {
        throw error;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        throw new Error(
          `Timed out waiting for another framework build to publish. ` +
            `If no build is running, remove the stale lock at ${lockRoot}.`,
          { cause: error },
        );
      }
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
  }
}

async function releasePublicationLock(lockRoot, identity) {
  const quarantineRoot = `${lockRoot}.release-${process.pid}-${randomUUID()}`;
  await rename(lockRoot, quarantineRoot);
  const quarantinedIdentity = await lstat(quarantineRoot);
  if (
    quarantinedIdentity.dev !== identity.dev ||
    quarantinedIdentity.ino !== identity.ino
  ) {
    try {
      await rename(quarantineRoot, lockRoot);
    } catch (restoreError) {
      throw new AggregateError(
        [restoreError],
        `The framework publication lock was replaced while owned. ` +
          `Its replacement was preserved at ${quarantineRoot}.`,
      );
    }
    throw new Error(
      'The framework publication lock was replaced while owned; the replacement was preserved.',
    );
  }
  await rm(quarantineRoot, { recursive: true, force: true });
}

async function restorePublishedDirectories(published) {
  const rollbackErrors = [];
  for (const entry of [...published].reverse()) {
    try {
      await rm(entry.targetRoot, { recursive: true, force: true });
      if (entry.hadPrevious) {
        await rename(entry.backupRoot, entry.targetRoot);
      }
    } catch (error) {
      rollbackErrors.push(error);
    }
  }
  return rollbackErrors;
}

function publicationRollbackError(errors) {
  const error = new AggregateError(
    errors,
    'Framework publication failed and its previous outputs could not be fully restored. ' +
      'Recovery copies were preserved in the publication staging directory.',
  );
  error.preservePublicationArtifacts = true;
  return error;
}

async function swapPublishedDirectories(entries) {
  const published = [];
  try {
    for (const entry of entries) {
      const hadPrevious = existsSync(entry.targetRoot);
      if (hadPrevious) {
        await rename(entry.targetRoot, entry.backupRoot);
      }
      try {
        await rename(entry.nextRoot, entry.targetRoot);
      } catch (error) {
        if (hadPrevious) {
          try {
            await rename(entry.backupRoot, entry.targetRoot);
          } catch (restoreError) {
            throw publicationRollbackError([error, restoreError]);
          }
        }
        throw error;
      }
      published.push({ ...entry, hadPrevious });
    }
  } catch (error) {
    const rollbackErrors = await restorePublishedDirectories(published);
    if (rollbackErrors.length > 0) {
      throw publicationRollbackError([error, ...rollbackErrors]);
    }
    throw error;
  }
}

export async function publishBuildOutputs(
  stagedLibRoot,
  {
    stagedServerRoot,
    targetDistRoot = distRoot,
    publicationParent = path.dirname(targetDistRoot),
    lockRoot = publicationLockRoot,
    lockTimeoutMs = publicationLockTimeoutMs,
    lockPollMs = publicationLockPollMs,
  } = {},
) {
  if (!stagedServerRoot) {
    throw new Error('Framework publication requires the staged Node runtime output.');
  }
  const publicationRoot = await mkdtemp(
    path.join(publicationParent, publicationPrefix),
  );
  const preparedDistRoot = path.join(publicationRoot, 'dist');
  let publicationLock;
  let preservePublicationArtifacts = false;
  try {
    await cp(stagedLibRoot, path.join(preparedDistRoot, 'lib'), {
      recursive: true,
    });
    await cp(stagedServerRoot, path.join(preparedDistRoot, 'server'), {
      recursive: true,
    });

    publicationLock = await acquirePublicationLock(
      lockRoot,
      lockTimeoutMs,
      lockPollMs,
    );
    await swapPublishedDirectories([
      {
        nextRoot: preparedDistRoot,
        targetRoot: targetDistRoot,
        backupRoot: path.join(publicationRoot, 'previous-dist'),
      },
    ]);
  } catch (error) {
    preservePublicationArtifacts = Boolean(
      error && typeof error === 'object' && error.preservePublicationArtifacts,
    );
    if (preservePublicationArtifacts && error instanceof Error) {
      error.message = `${error.message} Recovery directory: ${publicationRoot}.`;
    }
    throw error;
  } finally {
    try {
      if (publicationLock) {
        await publicationLock.release();
      }
    } finally {
      if (!preservePublicationArtifacts) {
        await rm(publicationRoot, { recursive: true, force: true });
      }
    }
  }
}

async function buildFramework() {
  await assertComponentAuthorityCurrent({ frameworkRoot });
  await access(ngcPath);
  await access(tscPath);
  await withStagingFramework(async (stagingRoot) => {
    await compileComponentStyles(stagingRoot);
    await run(
      'node',
      [
        ngcPath,
        '-p',
        'tsconfig.lib.json',
        '--sourceMap',
        'false',
        '--inlineSources',
        'false',
      ],
      stagingRoot,
    );
    await run('node', [tscPath, '-p', 'tsconfig.server.json'], stagingRoot);
    const stagedLibRoot = path.join(stagingRoot, 'out-tsc', 'lib');
    const stagedServerRoot = path.join(stagingRoot, 'out-tsc', 'server');
    await rewriteJsModuleSpecifiers(stagedLibRoot);
    await rewriteJsModuleSpecifiers(stagedServerRoot);
    await publishBuildOutputs(stagedLibRoot, { stagedServerRoot });
  });
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
    .replace(
      /(\bfrom\s*["'])(\.{1,2}\/[^"']+)(["'])/g,
      (_match, before, specifier, after) => {
        return `${before}${resolveJsSpecifier(fileDir, specifier)}${after}`;
      },
    )
    .replace(
      /(\bimport\s*["'])(\.{1,2}\/[^"']+)(["'])/g,
      (_match, before, specifier, after) => {
        return `${before}${resolveJsSpecifier(fileDir, specifier)}${after}`;
      },
    )
    .replace(
      /(\bimport\(\s*["'])(\.{1,2}\/[^"']+)(["']\s*\))/g,
      (_match, before, specifier, after) => {
        return `${before}${resolveJsSpecifier(fileDir, specifier)}${after}`;
      },
    );

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

if (import.meta.main) {
  buildFramework().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
