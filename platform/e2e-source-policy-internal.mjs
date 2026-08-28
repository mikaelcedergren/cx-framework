import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLAYWRIGHT_SOURCE_EXTENSIONS = Object.freeze(
  new Set([".cjs", ".cts", ".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]),
);
const PLAYWRIGHT_SOURCE_VIOLATIONS = Object.freeze([
  {
    label: "a test-owned network-control identifier",
    pattern:
      /\b(?:browserName|proxy|serviceWorkers|launchOptions|contextOptions|connectOptions)\b/u,
  },
  {
    label: "Playwright webServer lifecycle ownership",
    pattern: /\bwebServer\b/u,
  },
  {
    label: "a computed network-control option",
    pattern:
      /\[\s*["'](?:browserName|proxy|serviceWorkers|launchOptions|contextOptions|connectOptions)["']\s*\]\s*:/u,
    raw: true,
  },
  {
    label: "unmanaged Playwright browser or context creation",
    pattern:
      /\.\s*(?:connect|connectOverCDP|launch|launchPersistentContext|newContext)\s*\(/u,
  },
  {
    label: "computed unmanaged Playwright browser or context creation",
    pattern:
      /\[\s*["'](?:connect|connectOverCDP|launch|launchPersistentContext|newContext)["']\s*\]\s*\(/u,
  },
  {
    label: "browser-owned implicit context creation",
    pattern: /\bbrowser\s*\.\s*newPage\s*\(/u,
  },
  {
    label: "computed browser-owned implicit context creation",
    pattern: /\bbrowser\s*\[\s*["']newPage["']\s*\]\s*\(/u,
    raw: true,
  },
  {
    label: "a process or worker escape module",
    pattern: /["'](?:node:)?(?:child_process|cluster|worker_threads)["']/u,
    raw: true,
  },
  {
    label: "dynamic builtin-module access",
    pattern:
      /\b(?:createRequire|process\s*\.\s*getBuiltinModule|process\s*\.\s*mainModule|module\s*\.\s*require)\b/u,
  },
  {
    label: "a low-level process binding",
    pattern: /\bprocess\s*\.\s*(?:binding|_linkedBinding)\s*\(/u,
  },
  {
    label: "a low-level E2E lifecycle primitive",
    pattern:
      /\b(?:createOwnedE2ERuntime|launchEnvIProcessGroup|recordOwnedDetachedProcessGroup|removeOwnedE2ERuntime|runHermeticE2E|terminateProcessGroup|withOwnedE2ERuntime)\b/u,
  },
  {
    label: "the private E2E runner implementation",
    pattern: /e2e-runner\.mjs/u,
    raw: true,
  },
]);
const PLAYWRIGHT_CONFIG_SHAPE_VIOLATIONS = Object.freeze([
  {
    label: "a config spread",
    pattern: /\.\.\./u,
  },
  {
    label: "a computed config key or mutation",
    pattern: /\[[^\]\n]*\]\s*(?::|=(?!=))/u,
  },
  {
    label: "reflective config construction",
    pattern:
      /\b(?:Object\s*\.\s*(?:assign|defineProperties|defineProperty)|Proxy|Reflect)\b/u,
  },
  {
    label: "post-definition config mutation",
    pattern: /(?:\.\s*testDir\b\s*=|\bdelete\b)/u,
  },
]);

export function validateHermeticPlaywrightSourcePolicy({
  configPath,
  repoRoot,
  testDirectory,
}) {
  const canonicalRoot = realpathSync(path.resolve(repoRoot));
  const canonicalConfig = canonicalContainedFile(
    canonicalRoot,
    configPath,
    "Playwright config",
  );
  const canonicalTestDirectory = canonicalContainedDirectory(
    canonicalRoot,
    testDirectory,
    "Playwright test directory",
  );
  const configSource = readPlaywrightPolicySource(canonicalConfig);
  const executableConfig = maskPlaywrightNonExecutableSource(configSource);
  validateCanonicalRunnerImport({
    configPath: canonicalConfig,
    configSource,
    executableConfig,
    repoRoot: canonicalRoot,
  });
  const hermeticUseCalls = executableConfig.match(
    /(?<![\w$.])createHermeticPlaywrightUse\s*\(/gu,
  );
  const helperIdentifiers = executableConfig.match(
    /\bcreateHermeticPlaywrightUse\b/gu,
  );
  if (hermeticUseCalls?.length !== 1 || helperIdentifiers?.length !== 2) {
    throw new Error(
      "Playwright config must delegate network ownership to exactly one createHermeticPlaywrightUse() call.",
    );
  }
  const runtimeDeclarations = [
    ...configSource.matchAll(
      /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*validateOwnedE2ERuntime\s*\(\s*\{\s*productId\s*:\s*(["'])([a-z][a-z0-9-]{1,47})\2\s*\}\s*\)\s*;/gu,
    ),
  ];
  const runtimeArguments = [
    ...executableConfig.matchAll(
      /(?<![\w$.])createHermeticPlaywrightUse\s*\(\s*([A-Za-z_$][\w$]*)\b/gu,
    ),
  ];
  const runtimeIdentifiers = executableConfig.match(
    /\bvalidateOwnedE2ERuntime\b/gu,
  );
  if (
    runtimeDeclarations.length !== 1 ||
    runtimeArguments.length !== 1 ||
    runtimeIdentifiers?.length !== 2 ||
    runtimeDeclarations[0][1] !== runtimeArguments[0][1]
  ) {
    throw new Error(
      "Playwright config must pass one literal product runtime from validateOwnedE2ERuntime() directly to createHermeticPlaywrightUse().",
    );
  }
  for (const violation of PLAYWRIGHT_CONFIG_SHAPE_VIOLATIONS) {
    if (violation.pattern.test(executableConfig)) {
      throw new Error(`Playwright config contains ${violation.label}.`);
    }
  }
  for (const violation of PLAYWRIGHT_SOURCE_VIOLATIONS) {
    const inspected = violation.raw ? configSource : executableConfig;
    if (violation.pattern.test(inspected)) {
      throw new Error(`Playwright config contains ${violation.label}.`);
    }
  }
  const testDirKeys = [...executableConfig.matchAll(/\btestDir\s*:/gu)];
  const testDirMatch =
    testDirKeys.length === 1
      ? configSource
          .slice(testDirKeys[0].index)
          .match(/^testDir\s*:\s*(["'])([^"'\\]+)\1/u)
      : null;
  if (
    !testDirMatch ||
    realpathSync(
      path.resolve(path.dirname(canonicalConfig), testDirMatch[2]),
    ) !== canonicalTestDirectory
  ) {
    throw new Error(
      "Playwright config testDir must exactly match its policy-audited directory.",
    );
  }
  const lifecycleSources = playwrightLifecycleSources({
    configPath: canonicalConfig,
    configSource,
    executableConfig,
    repoRoot: canonicalRoot,
  });
  for (const sourcePath of playwrightSourceGraph({
    configPath: canonicalConfig,
    lifecycleSources,
    repoRoot: canonicalRoot,
    testDirectory: canonicalTestDirectory,
  })) {
    const source = readPlaywrightPolicySource(sourcePath);
    const executableSource = maskPlaywrightNonExecutableSource(source);
    for (const violation of PLAYWRIGHT_SOURCE_VIOLATIONS) {
      const inspected = violation.raw ? source : executableSource;
      if (violation.pattern.test(inspected)) {
        throw new Error(
          `${path.relative(canonicalRoot, sourcePath)} contains ${violation.label}.`,
        );
      }
    }
  }
  return Object.freeze({
    configPath: canonicalConfig,
    testDirectory: canonicalTestDirectory,
  });
}

export function canonicalContainedFile(root, value, label) {
  if (typeof value !== "string" || !path.isAbsolute(value)) {
    throw new Error(`${label} must be an absolute path.`);
  }
  const canonical = realpathSync(value);
  const relative = path.relative(root, canonical);
  if (
    !relative ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`${label} must be one file inside the product repository.`);
  }
  const metadata = lstatSync(canonical);
  if (!metadata.isFile() || metadata.isSymbolicLink()) {
    throw new Error(`${label} must be one regular file.`);
  }
  return canonical;
}

function canonicalContainedDirectory(root, value, label) {
  if (typeof value !== "string" || !path.isAbsolute(value)) {
    throw new Error(`${label} must be an absolute path.`);
  }
  const canonical = realpathSync(value);
  const relative = path.relative(root, canonical);
  if (
    !relative ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`${label} must be inside the product repository.`);
  }
  const metadata = lstatSync(canonical);
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new Error(`${label} must be one regular directory.`);
  }
  return canonical;
}

function validateCanonicalRunnerImport({
  configPath,
  configSource,
  executableConfig,
  repoRoot,
}) {
  const imports = [
    ...executableConfig.matchAll(
      /\bimport\s*\{[^}]*\bcreateHermeticPlaywrightUse\b[^}]*\}\s*from\b/gu,
    ),
  ];
  if (imports.length !== 1) {
    throw new Error(
      "Playwright config must directly import createHermeticPlaywrightUse from its canonical runner.",
    );
  }
  const statementEnd = configSource.indexOf(";", imports[0].index);
  if (statementEnd === -1) {
    throw new Error("Playwright config runner import must be one statement.");
  }
  const statement = configSource.slice(imports[0].index, statementEnd + 1);
  const executableStatement = executableConfig.slice(
    imports[0].index,
    statementEnd + 1,
  );
  const localRunner = path.join(
    repoRoot,
    "framework",
    "platform",
    "e2e-runner-public.mjs",
  );
  const expectedSpecifier =
    existsSync(localRunner) &&
    realpathSync(path.join(path.dirname(localRunner), "e2e-runner.mjs")) ===
      realpathSync(fileURLToPath(new URL("./e2e-runner.mjs", import.meta.url)))
      ? `./${path
          .relative(path.dirname(configPath), localRunner)
          .split(path.sep)
          .join("/")}`
      : "@mikaelcedergren/cx-framework/platform/e2e-runner";
  const specifier = statement.match(/\bfrom\s*(["'])([^"']+)\1/u)?.[2];
  const importedNames = executableStatement
    .match(/\bimport\s*\{([^}]*)\}/u)?.[1]
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .sort();
  if (
    specifier !== expectedSpecifier ||
    !importedNames ||
    importedNames.length !== 2 ||
    importedNames[0] !== "createHermeticPlaywrightUse" ||
    importedNames[1] !== "validateOwnedE2ERuntime"
  ) {
    throw new Error(
      `Playwright config must directly import createHermeticPlaywrightUse from ${expectedSpecifier}.`,
    );
  }
}

function playwrightSourceFiles(directory) {
  const files = [];
  const pending = [directory];
  while (pending.length > 0) {
    const current = pending.pop();
    const entries = readdirSync(current, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(
          `Playwright policy refuses symlinked test source ${entryPath}.`,
        );
      }
      if (entry.isDirectory()) {
        pending.push(entryPath);
      } else if (
        entry.isFile() &&
        PLAYWRIGHT_SOURCE_EXTENSIONS.has(path.extname(entry.name))
      ) {
        files.push(entryPath);
      }
    }
  }
  return files.sort();
}

function playwrightSourceGraph({
  configPath,
  lifecycleSources,
  repoRoot,
  testDirectory,
}) {
  const discovered = new Set([
    configPath,
    ...lifecycleSources,
    ...playwrightSourceFiles(testDirectory),
  ]);
  const pending = [...discovered];
  while (pending.length > 0) {
    const sourcePath = pending.pop();
    const source = readPlaywrightPolicySource(sourcePath);
    const specifiers = localSourceSpecifiers(source, sourcePath);
    for (const specifier of specifiers) {
      const resolved = resolvePlaywrightLocalSource(
        repoRoot,
        sourcePath,
        specifier,
      );
      if (isCanonicalE2ERunnerFacade(repoRoot, resolved)) continue;
      if (!discovered.has(resolved)) {
        discovered.add(resolved);
        pending.push(resolved);
      }
    }
  }
  return [...discovered].sort();
}

function playwrightLifecycleSources({
  configPath,
  configSource,
  executableConfig,
  repoRoot,
}) {
  const sources = [];
  for (const match of executableConfig.matchAll(
    /\b(?:globalSetup|globalTeardown)\s*:/gu,
  )) {
    const raw = configSource.slice(match.index);
    const literal = raw.match(
      /^(?:globalSetup|globalTeardown)\s*:\s*(["'])([^"'\\\n]+)\1/u,
    );
    if (!literal || !literal[2].startsWith(".")) {
      throw new Error(
        "Playwright config lifecycle hooks must be literal repo-local source paths.",
      );
    }
    sources.push(
      resolvePlaywrightLocalSource(repoRoot, configPath, literal[2]),
    );
  }
  return [...new Set(sources)].sort();
}

function localSourceSpecifiers(source, sourcePath) {
  const uncommented = maskPlaywrightComments(source);
  const specifiers = new Set();
  const staticPatterns = [
    /(?:^|\n)\s*(?:import|export)\s+(?:type\s+)?(?:[^;"']*?\s+from\s+)?(["'])([^"'\n]+)\1/gu,
  ];
  for (const pattern of staticPatterns) {
    for (const match of uncommented.matchAll(pattern)) {
      if (match[2].startsWith(".")) specifiers.add(match[2]);
    }
  }
  const executable = maskPlaywrightNonExecutableSource(source);
  for (const specifier of literalDynamicImportSpecifiers(
    source,
    executable,
    sourcePath,
  )) {
    if (specifier.startsWith(".")) specifiers.add(specifier);
  }
  for (const specifier of literalRequireSpecifiers(
    source,
    executable,
    sourcePath,
  )) {
    if (specifier.startsWith(".")) specifiers.add(specifier);
  }
  return [...specifiers].sort();
}

function literalRequireSpecifiers(source, executable, sourcePath) {
  const specifiers = [];
  for (const match of executable.matchAll(/\brequire\s*\(/gu)) {
    let index = match.index + match[0].length;
    while (/\s/u.test(source[index] ?? "")) index += 1;
    const quote = source[index];
    if (quote !== '"' && quote !== "'") {
      throw new Error(
        `${sourcePath} contains a non-literal require outside the audited source graph.`,
      );
    }
    index += 1;
    let specifier = "";
    while (index < source.length && source[index] !== quote) {
      if (source[index] === "\\") {
        throw new Error(
          `${sourcePath} contains an escaped require outside the audited source graph.`,
        );
      }
      specifier += source[index];
      index += 1;
    }
    if (source[index] !== quote) {
      throw new Error(`${sourcePath} contains an unterminated require.`);
    }
    index += 1;
    while (/\s/u.test(source[index] ?? "")) index += 1;
    if (source[index] !== ")") {
      throw new Error(
        `${sourcePath} contains a require with unmanaged arguments.`,
      );
    }
    specifiers.push(specifier);
  }
  return specifiers;
}

function literalDynamicImportSpecifiers(source, executable, sourcePath) {
  const specifiers = [];
  for (const match of executable.matchAll(/\bimport\s*\(/gu)) {
    let index = match.index + match[0].length;
    while (/\s/u.test(source[index] ?? "")) index += 1;
    const quote = source[index];
    if (quote !== '"' && quote !== "'") {
      throw new Error(
        `${sourcePath} contains a non-literal dynamic import outside the audited source graph.`,
      );
    }
    index += 1;
    let specifier = "";
    while (index < source.length && source[index] !== quote) {
      if (source[index] === "\\") {
        throw new Error(
          `${sourcePath} contains an escaped dynamic import outside the audited source graph.`,
        );
      }
      specifier += source[index];
      index += 1;
    }
    if (source[index] !== quote) {
      throw new Error(`${sourcePath} contains an unterminated dynamic import.`);
    }
    index += 1;
    while (/\s/u.test(source[index] ?? "")) index += 1;
    if (source[index] !== ")") {
      throw new Error(
        `${sourcePath} contains a dynamic import with unmanaged options.`,
      );
    }
    specifiers.push(specifier);
  }
  return specifiers;
}

function resolvePlaywrightLocalSource(repoRoot, importer, specifier) {
  const unresolved = path.resolve(path.dirname(importer), specifier);
  const selectedExtension = path.extname(unresolved);
  const withoutExtension = selectedExtension
    ? unresolved.slice(0, -selectedExtension.length)
    : unresolved;
  const candidates = [
    unresolved,
    ...(!selectedExtension ||
    PLAYWRIGHT_SOURCE_EXTENSIONS.has(selectedExtension)
      ? [...PLAYWRIGHT_SOURCE_EXTENSIONS].map(
          (extension) => `${withoutExtension}${extension}`,
        )
      : []),
    ...(!selectedExtension
      ? [...PLAYWRIGHT_SOURCE_EXTENSIONS].map((extension) =>
          path.join(unresolved, `index${extension}`),
        )
      : []),
  ];
  const existing = [...new Set(candidates)].filter((candidate) => {
    if (!existsSync(candidate)) return false;
    const metadata = lstatSync(candidate);
    if (metadata.isSymbolicLink()) {
      throw new Error(
        `Playwright policy refuses symlinked transitive source ${candidate}.`,
      );
    }
    return metadata.isFile();
  });
  if (existing.length !== 1) {
    throw new Error(
      `${path.relative(repoRoot, importer)} has an unresolved or ambiguous local import ${specifier}.`,
    );
  }
  const resolved = canonicalContainedFile(
    repoRoot,
    existing[0],
    "Playwright transitive source",
  );
  if (!PLAYWRIGHT_SOURCE_EXTENSIONS.has(path.extname(resolved))) {
    throw new Error(
      `${path.relative(repoRoot, importer)} imports unsupported executable source ${specifier}.`,
    );
  }
  return resolved;
}

function isCanonicalE2ERunnerFacade(repoRoot, sourcePath) {
  const facade = path.join(
    repoRoot,
    "framework",
    "platform",
    "e2e-runner-public.mjs",
  );
  return existsSync(facade) && realpathSync(facade) === sourcePath;
}

function maskPlaywrightComments(source) {
  const output = [...source];
  let index = 0;
  let quote;
  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];
    if (quote) {
      if (current === "\\") {
        index += 2;
        continue;
      }
      if (current === quote) quote = undefined;
      index += 1;
      continue;
    }
    if (current === '"' || current === "'" || current === "`") {
      quote = current;
      index += 1;
      continue;
    }
    if (current === "/" && next === "/") {
      output[index] = " ";
      output[index + 1] = " ";
      index += 2;
      while (index < source.length && source[index] !== "\n") {
        output[index] = " ";
        index += 1;
      }
      continue;
    }
    if (current === "/" && next === "*") {
      output[index] = " ";
      output[index + 1] = " ";
      index += 2;
      while (
        index < source.length &&
        !(source[index] === "*" && source[index + 1] === "/")
      ) {
        if (source[index] !== "\n") output[index] = " ";
        index += 1;
      }
      if (index < source.length) {
        output[index] = " ";
        output[index + 1] = " ";
        index += 2;
      }
      continue;
    }
    index += 1;
  }
  return output.join("");
}

function readPlaywrightPolicySource(sourcePath) {
  const metadata = lstatSync(sourcePath);
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.size > 1_048_576
  ) {
    throw new Error(
      `Playwright policy source must be one regular file of at most 1 MiB: ${sourcePath}.`,
    );
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      readFileSync(sourcePath),
    );
  } catch {
    throw new Error(
      `Playwright policy source is not valid UTF-8: ${sourcePath}.`,
    );
  }
}

function maskPlaywrightNonExecutableSource(source) {
  const output = Array.from(source, () => " ");
  let index = 0;

  const copyCode = (templateExpression = false) => {
    let braceDepth = 0;
    while (index < source.length) {
      const current = source[index];
      const next = source[index + 1];
      if (templateExpression && current === "}" && braceDepth === 0) {
        output[index] = current;
        index += 1;
        return;
      }
      if (current === "/" && next === "/") {
        index += 2;
        while (index < source.length && source[index] !== "\n") index += 1;
        continue;
      }
      if (current === "/" && next === "*") {
        index += 2;
        while (
          index < source.length &&
          !(source[index] === "*" && source[index + 1] === "/")
        ) {
          index += 1;
        }
        index = Math.min(source.length, index + 2);
        continue;
      }
      if (current === '"' || current === "'") {
        skipQuoted(current);
        continue;
      }
      if (current === "`") {
        skipTemplate();
        continue;
      }
      output[index] = current;
      if (current === "{") braceDepth += 1;
      else if (current === "}" && braceDepth > 0) braceDepth -= 1;
      index += 1;
    }
  };

  const skipQuoted = (quote) => {
    index += 1;
    while (index < source.length) {
      if (source[index] === "\\") {
        index += 2;
      } else if (source[index] === quote) {
        index += 1;
        return;
      } else {
        index += 1;
      }
    }
  };

  const skipTemplate = () => {
    index += 1;
    while (index < source.length) {
      if (source[index] === "\\") {
        index += 2;
      } else if (source[index] === "`") {
        index += 1;
        return;
      } else if (source[index] === "$" && source[index + 1] === "{") {
        output[index] = "$";
        output[index + 1] = "{";
        index += 2;
        copyCode(true);
      } else {
        index += 1;
      }
    }
  };

  copyCode();
  return output.join("");
}
