#!/usr/bin/env node

import { Buffer } from "node:buffer";
import { createHash, randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseTemplate,
  TmplAstRecursiveVisitor,
  visitAll,
} from "@angular/compiler";
import ts from "typescript";

const scriptPath = fileURLToPath(import.meta.url);
const defaultFrameworkRoot = path.resolve(path.dirname(scriptPath), "..");
const registryRelativePath = "support/components/registry.json";
const authorityRelativePath = "support/components/authority.json";
const publicApiRelativePath = "public-api.ts";
const packageEntrypoint = "@mikaelcedergren/cx-framework";

export const componentAuthorityLimits = Object.freeze({
  maxBytes: 2 * 1024 * 1024,
  maxComponents: 512,
  maxSelectorsPerComponent: 32,
  maxInputsPerComponent: 256,
  maxOutputsPerComponent: 256,
  maxProjectionSlotsPerComponent: 64,
  maxStylesPerComponent: 16,
  maxTotalInputs: 8192,
  maxTotalOutputs: 4096,
  maxTotalProjectionSlots: 4096,
  maxIdentifierLength: 128,
  maxSelectorLength: 512,
  maxSourceExpressionLength: 4096,
});

function sha256(source) {
  return createHash("sha256").update(source).digest("hex");
}

function compareText(left, right) {
  return left.localeCompare(right);
}

function compareBinding(left, right) {
  return (
    compareText(left.binding, right.binding) ||
    compareText(left.member, right.member)
  );
}

function normalizedNodeText(node, sourceFile) {
  return node.getText(sourceFile).replace(/\s+/gu, " ").trim();
}

function isSafeRelativePath(relativePath) {
  return (
    typeof relativePath === "string" &&
    relativePath.length > 0 &&
    !path.posix.isAbsolute(relativePath) &&
    !relativePath.includes("\\") &&
    !relativePath.split("/").includes("..") &&
    path.posix.normalize(relativePath) === relativePath
  );
}

function absoluteOwnedPath(frameworkRoot, relativePath) {
  if (!isSafeRelativePath(relativePath)) {
    throw new Error(`Unsafe framework-relative path: ${relativePath}`);
  }
  const absolutePath = path.resolve(frameworkRoot, ...relativePath.split("/"));
  const relative = path.relative(frameworkRoot, absolutePath);
  if (
    !relative ||
    relative.startsWith(`..${path.sep}`) ||
    relative === ".." ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Path escapes the framework root: ${relativePath}`);
  }
  return absolutePath;
}

async function readOwnedText(frameworkRoot, relativePath, { maxBytes } = {}) {
  const absolutePath = absoluteOwnedPath(frameworkRoot, relativePath);
  const stats = await lstat(absolutePath);
  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new Error(
      `Component authority input must be a regular non-symlink file: ${relativePath}`,
    );
  }
  if (maxBytes !== undefined && stats.size > maxBytes) {
    throw new Error(
      `${relativePath} exceeds the ${maxBytes}-byte component authority limit.`,
    );
  }
  const canonicalRoot = await realpath(frameworkRoot);
  const canonicalPath = await realpath(absolutePath);
  if (!canonicalPath.startsWith(`${canonicalRoot}${path.sep}`)) {
    throw new Error(
      `Component authority input escapes its root: ${relativePath}`,
    );
  }
  return readFile(absolutePath, "utf8");
}

async function ownedFileExists(frameworkRoot, relativePath) {
  try {
    const stats = await lstat(absoluteOwnedPath(frameworkRoot, relativePath));
    if (stats.isSymbolicLink()) {
      throw new Error(
        `Component authority input must not be a symlink: ${relativePath}`,
      );
    }
    return stats.isFile();
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function parseTypeScript(relativePath, source) {
  const sourceFile = ts.createSourceFile(
    relativePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    const diagnostic = sourceFile.parseDiagnostics[0];
    const detail = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
    throw new Error(`${relativePath} cannot be parsed: ${detail}`);
  }
  return sourceFile;
}

async function resolveExportTarget(frameworkRoot, fromRelativePath, specifier) {
  if (!specifier.startsWith(".")) {
    return null;
  }
  const fromDirectory = path.posix.dirname(fromRelativePath);
  let unresolved = path.posix.normalize(
    path.posix.join(fromDirectory, specifier),
  );
  if (unresolved.endsWith(".js")) {
    unresolved = unresolved.slice(0, -3);
  }
  const candidates = unresolved.endsWith(".ts")
    ? [unresolved]
    : [`${unresolved}.ts`, path.posix.join(unresolved, "index.ts")];
  for (const candidate of candidates) {
    if (!isSafeRelativePath(candidate)) {
      throw new Error(
        `${fromRelativePath} exports a path outside the framework: ${specifier}`,
      );
    }
    if (await ownedFileExists(frameworkRoot, candidate)) {
      return candidate;
    }
  }
  throw new Error(
    `${fromRelativePath} exports an unresolved local module: ${specifier}`,
  );
}

async function collectPublicExportGraph(frameworkRoot) {
  const access = new Map();
  const digests = new Map();
  const modules = new Map();
  const pending = [];

  function cloneAccess(names) {
    return names === null
      ? null
      : new Map(
          [...names].map(([name, rootNames]) => [name, new Set(rootNames)]),
        );
  }

  function request(relativePath, names) {
    const previous = access.get(relativePath);
    if (!access.has(relativePath)) {
      access.set(relativePath, cloneAccess(names));
      pending.push(relativePath);
      return;
    }
    if (previous === null || names === null) {
      if (previous !== null) {
        access.set(relativePath, null);
        pending.push(relativePath);
      }
      return;
    }
    let changed = false;
    for (const [name, rootNames] of names) {
      const previousRootNames = previous.get(name);
      if (!previousRootNames) {
        previous.set(name, new Set(rootNames));
        changed = true;
        continue;
      }
      const previousSize = previousRootNames.size;
      for (const rootName of rootNames) {
        previousRootNames.add(rootName);
      }
      changed ||= previousRootNames.size !== previousSize;
    }
    if (changed) {
      pending.push(relativePath);
    }
  }

  request(publicApiRelativePath, null);
  while (pending.length > 0) {
    const relativePath = pending.pop();
    let sourceFile = modules.get(relativePath);
    if (!sourceFile) {
      const source = await readOwnedText(frameworkRoot, relativePath);
      digests.set(relativePath, sha256(source));
      sourceFile = parseTypeScript(relativePath, source);
      modules.set(relativePath, sourceFile);
    }
    const requestedNames = access.get(relativePath);
    for (const statement of sourceFile.statements) {
      if (
        !ts.isExportDeclaration(statement) ||
        statement.isTypeOnly ||
        !statement.moduleSpecifier ||
        !ts.isStringLiteralLike(statement.moduleSpecifier)
      ) {
        continue;
      }
      const target = await resolveExportTarget(
        frameworkRoot,
        relativePath,
        statement.moduleSpecifier.text,
      );
      if (!target) {
        continue;
      }
      if (!statement.exportClause) {
        request(target, requestedNames);
        continue;
      }
      if (!ts.isNamedExports(statement.exportClause)) {
        continue;
      }
      const targetNames = new Map();
      for (const element of statement.exportClause.elements) {
        if (element.isTypeOnly) {
          continue;
        }
        const exportedName = element.name.text;
        const rootNames =
          requestedNames === null
            ? new Set([exportedName])
            : requestedNames.get(exportedName);
        if (rootNames) {
          const targetName = element.propertyName?.text ?? exportedName;
          const existing = targetNames.get(targetName) ?? new Set();
          for (const rootName of rootNames) {
            existing.add(rootName);
          }
          targetNames.set(targetName, existing);
        }
      }
      if (targetNames.size > 0) {
        request(target, targetNames);
      }
    }
  }
  return { access, digests };
}

function recordInputDigest(digests, relativePath, digest) {
  const previous = digests.get(relativePath);
  if (previous && previous !== digest) {
    throw new Error(
      `Component authority input changed while it was being read: ${relativePath}`,
    );
  }
  digests.set(relativePath, digest);
}

async function assertInputsStable(frameworkRoot, digests) {
  for (const [relativePath, expectedDigest] of [...digests].sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    const actualDigest = sha256(
      await readOwnedText(frameworkRoot, relativePath),
    );
    if (actualDigest !== expectedDigest) {
      throw new Error(
        `Component authority input changed during generation: ${relativePath}`,
      );
    }
  }
}

function angularCoreBindings(sourceFile) {
  const bindings = new Map();
  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      statement.moduleSpecifier.text !== "@angular/core" ||
      !statement.importClause?.namedBindings ||
      !ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      continue;
    }
    for (const element of statement.importClause.namedBindings.elements) {
      bindings.set(
        element.name.text,
        element.propertyName?.text ?? element.name.text,
      );
    }
  }
  return bindings;
}

function angularName(expression, bindings) {
  return ts.isIdentifier(expression)
    ? bindings.get(expression.text)
    : undefined;
}

function decoratorCall(member, importedName, bindings) {
  const decorators = ts.canHaveDecorators(member)
    ? (ts.getDecorators(member) ?? [])
    : [];
  const matches = decorators.filter(
    (decorator) =>
      ts.isCallExpression(decorator.expression) &&
      angularName(decorator.expression.expression, bindings) === importedName,
  );
  if (matches.length > 1) {
    throw new Error(
      `A declaration has more than one @${importedName} decorator.`,
    );
  }
  return matches[0]?.expression;
}

function objectProperty(objectLiteral, name) {
  const properties = objectLiteral.properties.filter((property) => {
    if (!property.name) {
      return false;
    }
    return (
      (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
      property.name.text === name
    );
  });
  if (properties.length > 1) {
    throw new Error(`Metadata defines ${name} more than once.`);
  }
  return properties[0];
}

function propertyInitializer(property, label) {
  if (!property) {
    return undefined;
  }
  if (!ts.isPropertyAssignment(property)) {
    throw new Error(`${label} must use an explicit property assignment.`);
  }
  return property.initializer;
}

function staticString(node, label) {
  if (!node || !ts.isStringLiteralLike(node)) {
    throw new Error(`${label} must be a static string literal.`);
  }
  return node.text;
}

function staticBoolean(node, label) {
  if (node?.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (node?.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  throw new Error(`${label} must be a static boolean literal.`);
}

function memberName(member, context) {
  if (!member.name || !ts.isIdentifier(member.name)) {
    throw new Error(`${context} must use an identifier member name.`);
  }
  const modifiers = ts.canHaveModifiers(member)
    ? (ts.getModifiers(member) ?? [])
    : [];
  if (
    modifiers.some(
      (modifier) =>
        modifier.kind === ts.SyntaxKind.PrivateKeyword ||
        modifier.kind === ts.SyntaxKind.ProtectedKeyword,
    )
  ) {
    throw new Error(`${context} must be public: ${member.name.text}`);
  }
  return member.name.text;
}

function inferLiteralType(expression, sourceFile, context) {
  if (ts.isParenthesizedExpression(expression)) {
    return inferLiteralType(expression.expression, sourceFile, context);
  }
  if (
    ts.isAsExpression(expression) ||
    ts.isTypeAssertionExpression(expression)
  ) {
    return normalizedNodeText(expression.type, sourceFile);
  }
  if (
    ts.isStringLiteralLike(expression) ||
    ts.isTemplateExpression(expression)
  ) {
    return "string";
  }
  if (
    ts.isNumericLiteral(expression) ||
    (ts.isPrefixUnaryExpression(expression) &&
      ts.isNumericLiteral(expression.operand))
  ) {
    return "number";
  }
  if (
    expression.kind === ts.SyntaxKind.TrueKeyword ||
    expression.kind === ts.SyntaxKind.FalseKeyword
  ) {
    return "boolean";
  }
  if (expression.kind === ts.SyntaxKind.NullKeyword) {
    return "null";
  }
  if (ts.isIdentifier(expression) && expression.text === "undefined") {
    return "undefined";
  }
  throw new Error(
    `${context} needs an explicit public type; its initializer is not a primitive literal.`,
  );
}

function memberInputType(member, sourceFile, context) {
  if (ts.isSetAccessorDeclaration(member)) {
    const parameter = member.parameters[0];
    if (!parameter?.type) {
      throw new Error(`${context} setter needs an explicit parameter type.`);
    }
    return normalizedNodeText(parameter.type, sourceFile);
  }
  if ("type" in member && member.type) {
    return normalizedNodeText(member.type, sourceFile);
  }
  if ("initializer" in member && member.initializer) {
    return inferLiteralType(member.initializer, sourceFile, context);
  }
  throw new Error(`${context} needs an explicit public type.`);
}

function parseOptions(node, sourceFile, context) {
  const result = { alias: null, required: false, transform: null };
  if (!node) {
    return result;
  }
  if (!ts.isObjectLiteralExpression(node)) {
    throw new Error(`${context} options must be an object literal.`);
  }
  if (node.properties.some(ts.isSpreadAssignment)) {
    throw new Error(`${context} options must not hide metadata in a spread.`);
  }
  const alias = propertyInitializer(
    objectProperty(node, "alias"),
    `${context} alias`,
  );
  const required = propertyInitializer(
    objectProperty(node, "required"),
    `${context} required`,
  );
  const transform = objectProperty(node, "transform");
  if (alias) {
    result.alias = staticString(alias, `${context} alias`);
  }
  if (required) {
    result.required = staticBoolean(required, `${context} required`);
  }
  if (transform) {
    if (ts.isPropertyAssignment(transform)) {
      result.transform = normalizedNodeText(transform.initializer, sourceFile);
    } else if (ts.isShorthandPropertyAssignment(transform)) {
      result.transform = transform.name.text;
    } else {
      throw new Error(`${context} transform must be an explicit expression.`);
    }
  }
  return result;
}

function parseInputDecorator(call, member, sourceFile, context) {
  const name = memberName(member, context);
  let options = { alias: null, required: false, transform: null };
  const argument = call.arguments[0];
  if (argument && ts.isStringLiteralLike(argument)) {
    options.alias = argument.text;
  } else if (argument) {
    options = parseOptions(argument, sourceFile, context);
  }
  return {
    binding: options.alias ?? name,
    member: name,
    type: memberInputType(member, sourceFile, context),
    required: options.required,
    transform: options.transform,
    defaultValue:
      "initializer" in member && member.initializer
        ? normalizedNodeText(member.initializer, sourceFile)
        : null,
    source: "decorator",
  };
}

function eventPayloadType(member, sourceFile, context, bindings) {
  if ("initializer" in member && member.initializer) {
    const initializer = member.initializer;
    if (
      ts.isNewExpression(initializer) &&
      angularName(initializer.expression, bindings) === "EventEmitter"
    ) {
      return initializer.typeArguments?.[0]
        ? normalizedNodeText(initializer.typeArguments[0], sourceFile)
        : "void";
    }
  }
  if (
    "type" in member &&
    member.type &&
    ts.isTypeReferenceNode(member.type) &&
    ts.isIdentifier(member.type.typeName) &&
    bindings.get(member.type.typeName.text) === "EventEmitter"
  ) {
    return member.type.typeArguments?.[0]
      ? normalizedNodeText(member.type.typeArguments[0], sourceFile)
      : "void";
  }
  throw new Error(`${context} must expose a typed Angular EventEmitter.`);
}

function parseOutputDecorator(call, member, sourceFile, context, bindings) {
  const name = memberName(member, context);
  const argument = call.arguments[0];
  const alias = argument ? staticString(argument, `${context} alias`) : name;
  return {
    binding: alias,
    member: name,
    type: eventPayloadType(member, sourceFile, context, bindings),
    source: "decorator",
  };
}

function signalCall(initializer, bindings) {
  if (!initializer || !ts.isCallExpression(initializer)) {
    return null;
  }
  const imported = angularName(initializer.expression, bindings);
  if (imported === "input" || imported === "output" || imported === "model") {
    return { call: initializer, kind: imported, required: false };
  }
  if (
    ts.isPropertyAccessExpression(initializer.expression) &&
    initializer.expression.name.text === "required"
  ) {
    const owner = angularName(initializer.expression.expression, bindings);
    if (owner === "input" || owner === "model") {
      return { call: initializer, kind: owner, required: true };
    }
  }
  return null;
}

function signalType(signal, sourceFile, context) {
  if (signal.call.typeArguments?.[0]) {
    return normalizedNodeText(signal.call.typeArguments[0], sourceFile);
  }
  if (signal.kind === "output") {
    return "void";
  }
  if (signal.required) {
    throw new Error(
      `${context} required signal needs an explicit generic type.`,
    );
  }
  const value = signal.call.arguments[0];
  if (!value) {
    throw new Error(`${context} needs a generic type or a default value.`);
  }
  return inferLiteralType(value, sourceFile, context);
}

function parseSignalMember(member, sourceFile, context, bindings) {
  if (!("initializer" in member)) {
    return null;
  }
  const signal = signalCall(member.initializer, bindings);
  if (!signal) {
    return null;
  }
  const name = memberName(member, context);
  const optionsIndex = signal.required || signal.kind === "output" ? 0 : 1;
  const options = parseOptions(
    signal.call.arguments[optionsIndex],
    sourceFile,
    context,
  );
  const binding = options.alias ?? name;
  const type = signalType(signal, sourceFile, context);
  if (signal.kind === "output") {
    return {
      inputs: [],
      outputs: [{ binding, member: name, type, source: "signal" }],
    };
  }
  const input = {
    binding,
    member: name,
    type,
    required: signal.required || options.required,
    transform: options.transform,
    defaultValue:
      signal.required || signal.call.arguments.length === 0
        ? null
        : normalizedNodeText(signal.call.arguments[0], sourceFile),
    source: signal.kind === "model" ? "model" : "signal",
  };
  const outputs =
    signal.kind === "model"
      ? [
          {
            binding: `${binding}Change`,
            member: name,
            type,
            source: "model",
          },
        ]
      : [];
  return { inputs: [input], outputs };
}

function assertUniqueBindings(entries, context) {
  const seen = new Set();
  for (const entry of entries) {
    if (!entry.binding || /\s/u.test(entry.binding)) {
      throw new Error(
        `${context} has an invalid binding name: ${entry.binding}`,
      );
    }
    if (seen.has(entry.binding)) {
      throw new Error(`${context} exposes ${entry.binding} more than once.`);
    }
    seen.add(entry.binding);
  }
}

function publicApiForClass(classDeclaration, sourceFile, context, bindings) {
  const inputs = [];
  const outputs = [];
  for (const member of classDeclaration.members) {
    const input = decoratorCall(member, "Input", bindings);
    const output = decoratorCall(member, "Output", bindings);
    if (input && output) {
      throw new Error(
        `${context} member cannot be both an input and an output.`,
      );
    }
    if (input) {
      inputs.push(parseInputDecorator(input, member, sourceFile, context));
      continue;
    }
    if (output) {
      outputs.push(
        parseOutputDecorator(output, member, sourceFile, context, bindings),
      );
      continue;
    }
    const signal = parseSignalMember(member, sourceFile, context, bindings);
    if (signal) {
      inputs.push(...signal.inputs);
      outputs.push(...signal.outputs);
    }
  }
  inputs.sort(compareBinding);
  outputs.sort(compareBinding);
  assertUniqueBindings(inputs, `${context} inputs`);
  assertUniqueBindings(outputs, `${context} outputs`);
  return { inputs, outputs };
}

function componentDeclaration(sourceFile, entry) {
  const bindings = angularCoreBindings(sourceFile);
  const matches = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isClassDeclaration(statement) || !statement.name) {
      continue;
    }
    const decorators = ts.canHaveDecorators(statement)
      ? (ts.getDecorators(statement) ?? [])
      : [];
    for (const decorator of decorators) {
      if (!ts.isCallExpression(decorator.expression)) {
        continue;
      }
      const kind = angularName(decorator.expression.expression, bindings);
      if (kind !== "Component" && kind !== "Directive") {
        continue;
      }
      const metadata = decorator.expression.arguments[0];
      if (!metadata || !ts.isObjectLiteralExpression(metadata)) {
        throw new Error(
          `${entry.path} ${kind} metadata must be an object literal.`,
        );
      }
      const selector = staticString(
        propertyInitializer(
          objectProperty(metadata, "selector"),
          `${entry.path} selector`,
        ),
        `${entry.path} selector`,
      );
      const selectors = selector
        .split(",")
        .map((value) => value.trim())
        .sort(compareText);
      if (
        selectors.length === entry.selectors.length &&
        selectors.every((value, index) => value === entry.selectors[index])
      ) {
        matches.push({
          classDeclaration: statement,
          kind: kind === "Component" ? "component" : "directive",
          metadata,
          bindings,
        });
      }
    }
  }
  if (matches.length !== 1) {
    throw new Error(
      `${entry.path} must contain exactly one exported declaration for ${entry.selectors.join(", ")}.`,
    );
  }
  const declaration = matches[0];
  const modifiers = ts.canHaveModifiers(declaration.classDeclaration)
    ? (ts.getModifiers(declaration.classDeclaration) ?? [])
    : [];
  if (
    !modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  ) {
    throw new Error(`${entry.path} component declaration must be exported.`);
  }
  return declaration;
}

function projectionSlots(template) {
  const parsed = parseTemplate(template, "component-authority-template.html", {
    preserveLineEndings: true,
    preserveWhitespaces: true,
  });
  if (parsed.errors?.length) {
    throw new Error(
      `Component template cannot be parsed for content projection: ${parsed.errors
        .map((error) => error.toString())
        .join("; ")}`,
    );
  }
  const slots = [];
  class ProjectionVisitor extends TmplAstRecursiveVisitor {
    visitContent(content) {
      if (
        content.attributes.some((attribute) => attribute.name === "[select]") ||
        content.selector.includes("{{") ||
        content.selector.includes("}}")
      ) {
        throw new Error("ng-content select must be static.");
      }
      slots.push({
        ordinal: slots.length + 1,
        selector: content.selector.trim() || "*",
      });
      return super.visitContent(content);
    }
  }
  visitAll(new ProjectionVisitor(), parsed.nodes);
  return slots;
}

async function componentEvidence(frameworkRoot, entry, source, declaration) {
  const metadata = declaration.metadata;
  const inputDigests = [{ relativePath: entry.path, digest: sha256(source) }];
  let template = { kind: "none", sha256: null };
  let templateSource = "";
  const templateUrlNode = propertyInitializer(
    objectProperty(metadata, "templateUrl"),
    `${entry.path} templateUrl`,
  );
  const inlineTemplateNode = propertyInitializer(
    objectProperty(metadata, "template"),
    `${entry.path} template`,
  );
  if (templateUrlNode && inlineTemplateNode) {
    throw new Error(
      `${entry.path} must not define both template and templateUrl.`,
    );
  }
  if (declaration.kind === "component") {
    if (templateUrlNode) {
      const specifier = staticString(
        templateUrlNode,
        `${entry.path} templateUrl`,
      );
      const templatePath = path.posix.normalize(
        path.posix.join(path.posix.dirname(entry.path), specifier),
      );
      templateSource = await readOwnedText(frameworkRoot, templatePath);
      template = {
        kind: "external",
        sha256: sha256(templateSource),
      };
      inputDigests.push({
        relativePath: templatePath,
        digest: template.sha256,
      });
    } else if (inlineTemplateNode) {
      templateSource = staticString(
        inlineTemplateNode,
        `${entry.path} template`,
      );
      template = {
        kind: "inline",
        sha256: sha256(templateSource),
      };
    } else {
      throw new Error(`${entry.path} component is missing its template.`);
    }
  }

  const styles = [];
  const styleUrlNode = propertyInitializer(
    objectProperty(metadata, "styleUrl"),
    `${entry.path} styleUrl`,
  );
  const styleUrlsNode = propertyInitializer(
    objectProperty(metadata, "styleUrls"),
    `${entry.path} styleUrls`,
  );
  const inlineStylesNode = propertyInitializer(
    objectProperty(metadata, "styles"),
    `${entry.path} styles`,
  );
  if (
    [styleUrlNode, styleUrlsNode, inlineStylesNode].filter(Boolean).length > 1
  ) {
    throw new Error(`${entry.path} has ambiguous style metadata.`);
  }
  let externalStyleNodes = [];
  if (styleUrlNode) {
    externalStyleNodes = [styleUrlNode];
  } else if (styleUrlsNode) {
    if (!ts.isArrayLiteralExpression(styleUrlsNode)) {
      throw new Error(`${entry.path} styleUrls must be a static array.`);
    }
    externalStyleNodes = [...styleUrlsNode.elements];
  }
  for (const styleNode of externalStyleNodes) {
    const specifier = staticString(styleNode, `${entry.path} style path`);
    const stylePath = path.posix.normalize(
      path.posix.join(path.posix.dirname(entry.path), specifier),
    );
    const styleSource = await readOwnedText(frameworkRoot, stylePath);
    const digest = sha256(styleSource);
    styles.push({
      ordinal: styles.length + 1,
      kind: "external",
      sha256: digest,
    });
    inputDigests.push({ relativePath: stylePath, digest });
  }
  if (inlineStylesNode) {
    if (!ts.isArrayLiteralExpression(inlineStylesNode)) {
      throw new Error(`${entry.path} styles must be a static array.`);
    }
    for (const styleNode of inlineStylesNode.elements) {
      const styleSource = staticString(styleNode, `${entry.path} inline style`);
      styles.push({
        ordinal: styles.length + 1,
        kind: "inline",
        sha256: sha256(styleSource),
      });
    }
  }

  return {
    contentProjection: projectionSlots(templateSource),
    evidence: {
      source: { sha256: sha256(source) },
      template,
      styles,
    },
    inputDigests,
  };
}

function assertBoundedAuthorityText(value, maximum, context) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${context} must be a non-empty string.`);
  }
  if (value.length > maximum) {
    throw new Error(`${context} exceeds the ${maximum}-character limit.`);
  }
}

function assertGeneratedAuthorityLimits(authority) {
  const limits = componentAuthorityLimits;
  if (
    authority.components.length === 0 ||
    authority.components.length > limits.maxComponents
  ) {
    throw new Error(
      `Component authority must contain 1-${limits.maxComponents} components.`,
    );
  }

  let totalInputs = 0;
  let totalOutputs = 0;
  let totalProjectionSlots = 0;
  for (const component of authority.components) {
    const context = `Component authority ${component.name}`;
    assertBoundedAuthorityText(
      component.name,
      limits.maxIdentifierLength,
      `${context} name`,
    );
    assertBoundedAuthorityText(
      component.category,
      limits.maxIdentifierLength,
      `${context} category`,
    );
    assertBoundedAuthorityText(
      component.publicApi.symbol,
      limits.maxIdentifierLength,
      `${context} public symbol`,
    );
    if (component.selectors.length > limits.maxSelectorsPerComponent) {
      throw new Error(
        `${context} exceeds ${limits.maxSelectorsPerComponent} selectors.`,
      );
    }
    for (const selector of component.selectors) {
      assertBoundedAuthorityText(
        selector,
        limits.maxSelectorLength,
        `${context} selector`,
      );
    }

    const { inputs, outputs } = component.publicApi;
    if (inputs.length > limits.maxInputsPerComponent) {
      throw new Error(
        `${context} exceeds ${limits.maxInputsPerComponent} public inputs.`,
      );
    }
    if (outputs.length > limits.maxOutputsPerComponent) {
      throw new Error(
        `${context} exceeds ${limits.maxOutputsPerComponent} public outputs.`,
      );
    }
    totalInputs += inputs.length;
    totalOutputs += outputs.length;
    for (const input of inputs) {
      for (const [label, value] of [
        ["input binding", input.binding],
        ["input member", input.member],
      ]) {
        assertBoundedAuthorityText(
          value,
          limits.maxIdentifierLength,
          `${context} ${label}`,
        );
      }
      assertBoundedAuthorityText(
        input.type,
        limits.maxSourceExpressionLength,
        `${context} input type`,
      );
      for (const [label, value] of [
        ["input transform", input.transform],
        ["input default", input.defaultValue],
      ]) {
        if (value !== null) {
          assertBoundedAuthorityText(
            value,
            limits.maxSourceExpressionLength,
            `${context} ${label}`,
          );
        }
      }
    }
    for (const output of outputs) {
      for (const [label, value] of [
        ["output binding", output.binding],
        ["output member", output.member],
      ]) {
        assertBoundedAuthorityText(
          value,
          limits.maxIdentifierLength,
          `${context} ${label}`,
        );
      }
      assertBoundedAuthorityText(
        output.type,
        limits.maxSourceExpressionLength,
        `${context} output type`,
      );
    }

    if (
      component.contentProjection.length > limits.maxProjectionSlotsPerComponent
    ) {
      throw new Error(
        `${context} exceeds ${limits.maxProjectionSlotsPerComponent} projection slots.`,
      );
    }
    totalProjectionSlots += component.contentProjection.length;
    for (const slot of component.contentProjection) {
      assertBoundedAuthorityText(
        slot.selector,
        limits.maxSelectorLength,
        `${context} projection selector`,
      );
    }
    if (component.evidence.styles.length > limits.maxStylesPerComponent) {
      throw new Error(
        `${context} exceeds ${limits.maxStylesPerComponent} style sources.`,
      );
    }
  }

  for (const [actual, maximum, label] of [
    [totalInputs, limits.maxTotalInputs, "inputs"],
    [totalOutputs, limits.maxTotalOutputs, "outputs"],
    [totalProjectionSlots, limits.maxTotalProjectionSlots, "projection slots"],
  ]) {
    if (actual > maximum) {
      throw new Error(
        `Component authority exceeds the ${maximum} total ${label} limit.`,
      );
    }
  }

  const rendered = `${JSON.stringify(authority, null, 2)}\n`;
  if (Buffer.byteLength(rendered, "utf8") > limits.maxBytes) {
    throw new Error(
      `Component authority exceeds the ${limits.maxBytes}-byte package limit.`,
    );
  }
  if (
    /(?:\/Users\/|\/Volumes\/|file:\/\/|[A-Za-z]:\\\\)/u.test(rendered) ||
    /"(?:patterns|primitives|tooling)\/[^"\\n]+\.(?:ts|html|css|scss)"/u.test(
      rendered,
    )
  ) {
    throw new Error(
      "Component authority must not expose filesystem or raw framework source paths.",
    );
  }
}

function normalizedRegistryEntry(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error("Component registry entries must be objects.");
  }
  const { name, selectors, area, category, path: sourcePath } = entry;
  if (!/^cx-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name)) {
    throw new Error(`Invalid component registry name: ${name}`);
  }
  if (!Array.isArray(selectors) || selectors.length === 0) {
    throw new Error(`Component registry entry ${name} has no selectors.`);
  }
  const normalizedSelectors = [...selectors].sort(compareText);
  if (
    normalizedSelectors.some(
      (selector, index) =>
        typeof selector !== "string" ||
        selector.length === 0 ||
        (index > 0 && selector === normalizedSelectors[index - 1]),
    )
  ) {
    throw new Error(`Component registry entry ${name} has invalid selectors.`);
  }
  if (!new Set(["pattern", "primitive", "tooling"]).has(area)) {
    throw new Error(
      `Component registry entry ${name} has invalid area ${area}.`,
    );
  }
  if (typeof category !== "string" || category.length === 0) {
    throw new Error(`Component registry entry ${name} has no category.`);
  }
  if (
    !isSafeRelativePath(sourcePath) ||
    !/^(?:patterns|primitives|tooling)\/.+\.(?:component|directive)\.ts$/u.test(
      sourcePath,
    )
  ) {
    throw new Error(
      `Component registry entry ${name} has an unsafe source path.`,
    );
  }
  const expectedRoot = {
    pattern: "patterns/",
    primitive: "primitives/",
    tooling: "tooling/",
  }[area];
  if (!sourcePath.startsWith(expectedRoot)) {
    throw new Error(
      `Component registry entry ${name} area does not match its path.`,
    );
  }
  return {
    name,
    selectors: normalizedSelectors,
    area,
    category,
    path: sourcePath,
  };
}

export async function generateComponentAuthority({
  frameworkRoot = defaultFrameworkRoot,
} = {}) {
  const root = await realpath(frameworkRoot);
  const registrySource = await readOwnedText(root, registryRelativePath);
  const inputDigests = new Map([
    [registryRelativePath, sha256(registrySource)],
  ]);
  let registry;
  try {
    registry = JSON.parse(registrySource);
  } catch (error) {
    throw new Error(`${registryRelativePath} is not valid JSON.`, {
      cause: error,
    });
  }
  if (!Array.isArray(registry.components)) {
    throw new Error(`${registryRelativePath} must contain a components array.`);
  }
  const entries = registry.components
    .map(normalizedRegistryEntry)
    .sort((left, right) => compareText(left.name, right.name));
  const names = new Set();
  const selectors = new Set();
  for (const entry of entries) {
    if (names.has(entry.name)) {
      throw new Error(`${registryRelativePath} duplicates ${entry.name}.`);
    }
    names.add(entry.name);
    for (const selector of entry.selectors) {
      if (selectors.has(selector)) {
        throw new Error(
          `${registryRelativePath} duplicates selector ${selector}.`,
        );
      }
      selectors.add(selector);
    }
  }

  const exportGraph = await collectPublicExportGraph(root);
  for (const [relativePath, digest] of exportGraph.digests) {
    recordInputDigest(inputDigests, relativePath, digest);
  }
  const components = [];
  for (const entry of entries) {
    const source = await readOwnedText(root, entry.path);
    const sourceFile = parseTypeScript(entry.path, source);
    const declaration = componentDeclaration(sourceFile, entry);
    const symbol = declaration.classDeclaration.name.text;
    const publicAccess = exportGraph.access.get(entry.path);
    if (publicAccess === undefined) {
      throw new Error(
        `${registryRelativePath} advertises ${entry.name}, but ${entry.path} is not reachable from ${publicApiRelativePath}.`,
      );
    }
    const rootSymbols =
      publicAccess === null ? new Set([symbol]) : publicAccess.get(symbol);
    if (!rootSymbols) {
      throw new Error(
        `${registryRelativePath} advertises ${entry.name}, but ${symbol} is not exported by ${publicApiRelativePath}.`,
      );
    }
    if (!rootSymbols.has(symbol)) {
      throw new Error(
        `${registryRelativePath} advertises ${entry.name}, but ${symbol} is exported only through a renamed symbol (${[...rootSymbols].sort(compareText).join(", ")}). Public component symbols must not be aliased.`,
      );
    }
    const publicApi = publicApiForClass(
      declaration.classDeclaration,
      sourceFile,
      `${entry.name} public API`,
      declaration.bindings,
    );
    const evidence = await componentEvidence(root, entry, source, declaration);
    for (const { relativePath, digest } of evidence.inputDigests) {
      recordInputDigest(inputDigests, relativePath, digest);
    }
    components.push({
      name: entry.name,
      area: entry.area,
      category: entry.category,
      kind: declaration.kind,
      selectors: entry.selectors,
      publicApi: { symbol, ...publicApi },
      contentProjection: evidence.contentProjection,
      evidence: evidence.evidence,
    });
  }

  await assertInputsStable(root, inputDigests);

  const authority = {
    schemaVersion: 1,
    entrypoint: packageEntrypoint,
    componentCount: components.length,
    catalogSha256: sha256(JSON.stringify(components)),
    components,
  };
  assertGeneratedAuthorityLimits(authority);
  return authority;
}

export function renderComponentAuthority(authority) {
  return `${JSON.stringify(authority, null, 2)}\n`;
}

export async function assertComponentAuthorityCurrent({
  frameworkRoot = defaultFrameworkRoot,
} = {}) {
  const root = await realpath(frameworkRoot);
  const expectedBeforeRead = renderComponentAuthority(
    await generateComponentAuthority({ frameworkRoot: root }),
  );
  let actual;
  try {
    actual = await readOwnedText(root, authorityRelativePath, {
      maxBytes: componentAuthorityLimits.maxBytes,
    });
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      throw new Error(
        `${authorityRelativePath} is missing. Run the component authority generator.`,
        { cause: error },
      );
    }
    throw error;
  }
  const expectedAfterRead = renderComponentAuthority(
    await generateComponentAuthority({ frameworkRoot: root }),
  );
  if (expectedAfterRead !== expectedBeforeRead) {
    throw new Error(
      "Component authority inputs changed while the generated file was being checked.",
    );
  }
  if (actual !== expectedAfterRead) {
    throw new Error(
      `${authorityRelativePath} is stale. Run the component authority generator and review the generated public contract.`,
    );
  }
  return JSON.parse(actual);
}

export async function writeComponentAuthority({
  frameworkRoot = defaultFrameworkRoot,
} = {}) {
  const root = await realpath(frameworkRoot);
  const authority = await generateComponentAuthority({ frameworkRoot: root });
  const renderedAuthority = renderComponentAuthority(authority);
  const outputPath = absoluteOwnedPath(root, authorityRelativePath);
  const outputDirectory = path.dirname(outputPath);
  await mkdir(outputDirectory, { recursive: true });
  try {
    const stats = await lstat(outputPath);
    if (!stats.isFile() || stats.isSymbolicLink()) {
      throw new Error(
        `${authorityRelativePath} must be a regular non-symlink file before replacement.`,
      );
    }
  } catch (error) {
    if (!(error && typeof error === "object" && error.code === "ENOENT")) {
      throw error;
    }
  }
  const temporaryPath = path.join(
    outputDirectory,
    `.authority-${process.pid}-${randomUUID()}.tmp`,
  );
  try {
    await writeFile(temporaryPath, renderedAuthority, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o644,
    });
    const stats = await lstat(temporaryPath);
    if (!stats.isFile() || stats.isSymbolicLink()) {
      throw new Error("Generated component authority is not a regular file.");
    }
    const reattestedAuthority = renderComponentAuthority(
      await generateComponentAuthority({ frameworkRoot: root }),
    );
    if (reattestedAuthority !== renderedAuthority) {
      throw new Error(
        "Component authority inputs changed before generated output activation.",
      );
    }
    await rename(temporaryPath, outputPath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
  return authority;
}

function printHelp() {
  console.log(`Usage: node scripts/generate-component-authority.mjs [--check]

Generates support/components/authority.json from the public Angular export graph,
component registry, decorators, public bindings, and component templates.

Options:
  --check  Verify the generated authority byte-for-byte without writing files.
  --help   Show this help text.
`);
}

function parseArguments(arguments_) {
  const options = { check: false };
  for (const argument of arguments_) {
    if (argument === "--check") {
      options.check = true;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      printHelp();
      return null;
    }
    throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (!options) {
    return;
  }
  if (options.check) {
    const authority = await assertComponentAuthorityCurrent();
    console.log(
      `Component authority is current: ${authority.componentCount} public declarations.`,
    );
    return;
  }
  const authority = await writeComponentAuthority();
  console.log(
    `Generated ${authorityRelativePath}: ${authority.componentCount} public declarations.`,
  );
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
