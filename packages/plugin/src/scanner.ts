import ts from 'typescript';
import path from 'path';
import fs from 'fs';
import picomatch from 'picomatch';
import {
  MANIFEST_VERSION,
  type ComponentDef,
  type Manifest,
  type OptionPropDef,
  type PrimitivePropDef,
  type PropDef,
} from './manifest.js';

export type { ComponentDef, Manifest, PropDef } from './manifest.js';

export const DEFAULT_IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/.vite/**',
  '**/.storybook/**',
  '**/storybook-static/**',
  '**/coverage/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/*.stories.*',
];

export interface ScannerLogger {
  info?(message: string, context?: Record<string, unknown>): void;
  warn?(message: string, context?: Record<string, unknown>): void;
  error?(message: string, context?: Record<string, unknown>): void;
}

/**
 * Options for the component scanner.
 */
export interface ScannerOptions {
  /** The directory to scan for components. */
  srcDir: string;
  /** The root directory of the project. */
  projectRoot: string;
  /** Glob patterns (relative to the project root) to exclude from scanning. */
  ignore?: string[];
  /** Optional logger for diagnostics and warnings. */
  logger?: ScannerLogger;
}

/**
 * The component scanner interface.
 */
export interface Scanner {
  /** The options the scanner was created with. */
  options: ScannerOptions;
  /** Scans the source directory and returns a manifest of components. */
  scan: () => Manifest;
}

type NormalizedPath = string;

interface IgnoreMatch {
  matched: boolean;
  pattern?: string;
  relativePath: NormalizedPath;
  isDefault?: boolean;
}

type IgnoreMatcher = (absolutePath: string) => IgnoreMatch;

function toPosixPath(filePath: string): NormalizedPath {
  return filePath.split(path.sep).join('/');
}

function toRelativePath(projectRoot: string, absolutePath: string): NormalizedPath {
  const relative = path.relative(projectRoot, absolutePath);
  return relative.length > 0 ? toPosixPath(relative) : toPosixPath(path.basename(absolutePath));
}

function createLogger(custom?: ScannerLogger): Required<ScannerLogger> {
  return {
    info: custom?.info ?? (() => {}),
    warn: custom?.warn ?? ((message, context) => console.warn(message, context ?? '')),
    error: custom?.error ?? ((message, context) => console.error(message, context ?? '')),
  };
}

function createIgnoreMatcher(
  projectRoot: string,
  ignorePatterns: string[],
  userPatterns: Set<string>,
): IgnoreMatcher {
  const compiled = ignorePatterns.map(pattern => ({
    pattern,
    matcher: picomatch(pattern, { dot: true }),
    isDefault: !userPatterns.has(pattern),
  }));

  return absolutePath => {
    const relativePath = toRelativePath(projectRoot, absolutePath);
    for (const entry of compiled) {
      if (entry.matcher(relativePath)) {
        return {
          matched: true,
          pattern: entry.pattern,
          relativePath,
          isDefault: entry.isDefault,
        };
      }
    }
    return { matched: false, relativePath };
  };
}

function parseEnumType(type: ts.Type, checker: ts.TypeChecker): OptionPropDef | null {
  const resolveSymbol = (candidate: ts.Symbol | undefined): ts.Symbol | undefined => {
    if (!candidate) return undefined;
    if (candidate.flags & ts.SymbolFlags.Enum) return candidate;

    if (candidate.flags & ts.SymbolFlags.EnumMember) {
      const declaration = candidate.declarations?.[0];
      if (declaration && ts.isEnumMember(declaration)) {
        const enumDecl = declaration.parent;
        if (enumDecl && ts.isEnumDeclaration(enumDecl) && enumDecl.name) {
          const enumSymbol = checker.getSymbolAtLocation(enumDecl.name);
          if (enumSymbol && enumSymbol.flags & ts.SymbolFlags.Enum) {
            return enumSymbol;
          }
        }
      }
    }

    if (candidate.flags & ts.SymbolFlags.Alias) {
      const aliased = checker.getAliasedSymbol(candidate);
      return resolveSymbol(aliased);
    }

    return undefined;
  };

  const enumSymbol = resolveSymbol(type.aliasSymbol ?? type.symbol);
  if (!enumSymbol) return null;

  const memberTable = enumSymbol.members ?? enumSymbol.exports;
  if (!memberTable) return null;

  const options: string[] = [];
  const seen = new Set<string>();

  memberTable.forEach(memberSymbol => {
    if (!(memberSymbol.flags & ts.SymbolFlags.EnumMember)) {
      return;
    }
    let optionValue: string | number | undefined;
    const declaration = memberSymbol.valueDeclaration;
    if (declaration && ts.isEnumMember(declaration)) {
      const constantValue = checker.getConstantValue(declaration);
      if (constantValue !== undefined) {
        optionValue = constantValue;
      } else if (
        declaration.initializer &&
        ts.isStringLiteralLike(declaration.initializer)
      ) {
        optionValue = declaration.initializer.text;
      }
    }

    if (optionValue === undefined) {
      optionValue = checker.symbolToString(memberSymbol);
    }

    const stringValue = String(optionValue);
    if (!seen.has(stringValue)) {
      seen.add(stringValue);
      options.push(stringValue);
    }
  });

  if (options.length === 0) {
    return null;
  }

  const enumName = checker.symbolToString(enumSymbol);
  return { type: 'enum', name: enumName, options };
}

/**
 * Recursively finds all `.ts` and `.tsx` files in a directory.
 * @param dir - The directory to search.
 * @returns A list of absolute file paths.
 * @internal
 */
function findComponentFiles(
  dir: string,
  projectRoot: string,
  shouldIgnore: IgnoreMatcher,
  logger: Required<ScannerLogger>,
): string[] {
  const files: string[] = [];
  let entries: fs.Dirent[];

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    logger.warn('rplite:scanner:read-error', {
      path: toRelativePath(projectRoot, dir),
      error: (error as Error).message,
    });
    return files;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const match = shouldIgnore(fullPath);
    if (match.matched) {
      if (!match.isDefault) {
        logger.info('rplite:scanner:ignored', {
          path: match.relativePath,
          pattern: match.pattern,
        });
      }
    }
    if (match.matched) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...findComponentFiles(fullPath, projectRoot, shouldIgnore, logger));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Creates a component scanner.
 * @param options - The options for the scanner.
 * @returns A scanner instance.
 */
export function createScanner(options: ScannerOptions): Scanner {
  const { srcDir, projectRoot } = options;
  const logger = createLogger(options.logger);
  const userPatterns = new Set(options.ignore ?? []);
  const ignorePatterns = Array.from(
    new Set([...DEFAULT_IGNORE_PATTERNS, ...userPatterns]),
  );
  const shouldIgnore = createIgnoreMatcher(projectRoot, ignorePatterns, userPatterns);
  const resolvedOptions: ScannerOptions = {
    srcDir,
    projectRoot,
    ignore: options.ignore,
    logger: options.logger,
  };

  /**
   * Parses a TypeScript type and returns a base (non-array) prop definition if supported.
   */
  const parseBasePropType = (
    type: ts.Type,
    checker: ts.TypeChecker,
  ): (PrimitivePropDef | OptionPropDef) | null => {
    const nonNullableType = type.getNonNullableType();

    if (nonNullableType.flags & ts.TypeFlags.String) return { type: 'string' };
    if (nonNullableType.flags & ts.TypeFlags.Number) return { type: 'number' };
    if (nonNullableType.flags & ts.TypeFlags.Boolean) return { type: 'boolean' };

    const enumDef = parseEnumType(nonNullableType, checker);
    if (enumDef) return enumDef;

    if (nonNullableType.isUnion()) {
      const options: string[] = [];
      let isStringLiteralUnion = true;
      for (const t of nonNullableType.types) {
        if (t.isStringLiteral()) {
          options.push(t.value);
        } else {
          isStringLiteralUnion = false;
          break;
        }
      }
      if (isStringLiteralUnion && options.length > 0) {
        return { type: 'union', options };
      }
    }

    return null;
  };

  /**
   * Parses a TypeScript type and returns a `PropDef` if it's a supported type.
   * @param type - The TypeScript type to parse.
   * @param checker - The TypeScript type checker.
   * @returns A `PropDef` or `null` if the type is not supported.
   * @internal
   */
  const parsePropType = (type: ts.Type, checker: ts.TypeChecker): PropDef | null => {
    const base = parseBasePropType(type, checker);
    if (base) return base;

    const nonNullableType = type.getNonNullableType();

    if (checker.isArrayType(nonNullableType)) {
      const elementType = checker.getIndexTypeOfType(
        nonNullableType,
        ts.IndexKind.Number,
      );
      if (elementType) {
        const elementDef = parseBasePropType(elementType, checker);
        if (elementDef) {
          return { type: 'array', element: elementDef };
        }
      }
    }

    return null;
  };

  /**
   * Extracts the props from a React component's function declaration.
   * @param node - The AST node for the component function.
   * @param checker - The TypeScript type checker.
   * @returns A record of prop definitions, or `null` if no props are found.
   * @internal
   */
  const getPropsOfComponent = (
    node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
    checker: ts.TypeChecker,
    componentNameForLogs?: string,
  ): Record<string, PropDef> | null => {
    // Assume components have a single `props` object parameter.
    if (node.parameters.length !== 1) {
      return null;
    }

    const propsParam = node.parameters[0];
    if (!propsParam.type) return null;

    // Get the type of the props parameter.
    const type = checker.getTypeFromTypeNode(propsParam.type);
    const properties = type.getProperties();

    const props: Record<string, PropDef> = {};
    for (const propSymbol of properties) {
      const propName = propSymbol.getName();
      // `valueDeclaration` is the AST node where the symbol is declared.
      const propType = checker.getTypeOfSymbolAtLocation(propSymbol, propSymbol.valueDeclaration!);
      const propDef = parsePropType(propType, checker);
      if (propDef) {
        props[propName] = propDef;
      } else {
        // Warn when a prop cannot be inferred to a supported type.
        // This helps users understand why a control might be missing.
        try {
          const typeString = checker.typeToString(propType);
          logger.warn(
            'rplite:scanner:unsupported-prop',
            {
              component: componentNameForLogs ?? '(anonymous)',
              prop: propName,
              type: typeString,
            } as unknown as Record<string, unknown>,
          );
        } catch {
          logger.warn('rplite:scanner:unsupported-prop', {
            component: componentNameForLogs ?? '(anonymous)',
            prop: propName,
          });
        }
      }
    }
    return Object.keys(props).length > 0 ? props : null;
  };

  /**
   * Analyzes a source file to find exported React components.
   * @param filePath - The path to the file to analyze.
   * @param program - The TypeScript program instance.
   * @returns An array of component definitions found in the file.
   * @internal
   */
  const getComponentDefs = (filePath: string, program: ts.Program): ComponentDef[] => {
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) return [];
    const checker = program.getTypeChecker();
    const componentDefs: ComponentDef[] = [];

    // Get all exports from the source file.
    const exports = checker.getExportsOfModule(checker.getSymbolAtLocation(sourceFile)!);

    exports.forEach(exportSymbol => {
      const decl = exportSymbol.getDeclarations()?.[0];
      if (!decl) return;

      let componentName: string | undefined;
      let functionDecl: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | undefined;
      const isDefaultExport = exportSymbol.name === 'default';

      // This is a complex part of the code that tries to handle various ways
      // a React component can be defined and exported.
      // e.g., `export default function MyComponent() {}`
      // e.g., `export const MyComponent = () => {}`
      // e.g., `export { MyComponent } from './MyComponent'`

      if (ts.isFunctionDeclaration(decl) || ts.isFunctionExpression(decl) || ts.isArrowFunction(decl)) {
        // Case: `export function MyComponent() {}` or `export default () => {}`
        functionDecl = decl;
        componentName = isDefaultExport
          ? path.basename(filePath, path.extname(filePath)) // Use filename for default export
          : exportSymbol.name;
      } else if (ts.isVariableDeclaration(decl) && decl.initializer) {
        // Case: `export const MyComponent = () => {}`
        if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
          functionDecl = decl.initializer;
          componentName = isDefaultExport
            ? path.basename(filePath, path.extname(filePath))
            : (decl.name as ts.Identifier).text;
        }
      } else if (ts.isExportAssignment(decl) && ts.isIdentifier(decl.expression)) {
        // Case: `export default MyComponent;`
        const symbol = checker.getSymbolAtLocation(decl.expression);
        const originalDecl = symbol?.getDeclarations()?.[0];
        if (originalDecl) {
          if (ts.isFunctionDeclaration(originalDecl) || ts.isFunctionExpression(originalDecl) || ts.isArrowFunction(originalDecl)) {
            functionDecl = originalDecl;
            componentName = path.basename(filePath, path.extname(filePath));
          } else if (ts.isVariableDeclaration(originalDecl) && originalDecl.initializer && (ts.isArrowFunction(originalDecl.initializer) || ts.isFunctionExpression(originalDecl.initializer))) {
            functionDecl = originalDecl.initializer;
            componentName = path.basename(filePath, path.extname(filePath));
          }
        }
      } else if (ts.isExportDeclaration(decl) && decl.exportClause && ts.isNamedExports(decl.exportClause)) {
        // Case: `export { MyComponent, MyOtherComponent }`
        decl.exportClause.elements.forEach(specifier => {
          const symbol = checker.getSymbolAtLocation(specifier.name);
          const originalDecl = symbol?.getDeclarations()?.[0];
          if (originalDecl) {
            let funcDecl: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | undefined;
            if (ts.isFunctionDeclaration(originalDecl) || ts.isFunctionExpression(originalDecl)) {
              funcDecl = originalDecl;
            } else if (ts.isVariableDeclaration(originalDecl) && originalDecl.initializer && (ts.isArrowFunction(originalDecl.initializer) || ts.isFunctionExpression(originalDecl.initializer))) {
              funcDecl = originalDecl.initializer;
            }

            if (funcDecl) {
              const props = getPropsOfComponent(funcDecl, checker, specifier.name.text);
              if (props) {
                componentDefs.push({
                  name: specifier.name.text,
                  path: path.relative(projectRoot, filePath).replace(/\\/g, '/'),
                  props,
                  isDefaultExport: false,
                });
              }
            }
          }
        });
        return; // Handled in the loop, so we can return here.
      }


      // If we found a function declaration that looks like a component, get its props.
      if (functionDecl) {
        const resolvedName =
          componentName ?? path.basename(filePath, path.extname(filePath));
        const props = getPropsOfComponent(functionDecl, checker, resolvedName);
        // We only consider it a component if it has props.
        // This is a limitation, but helps filter out non-component functions.
        if (props) {
          componentDefs.push({
            name: resolvedName,
            path: path.relative(projectRoot, filePath).replace(/\\/g, '/'),
            props,
            isDefaultExport,
          });
        }
      }
    });

    return componentDefs;
  };

  /**
   * The main scan function.
   * @returns A manifest of all discovered components.
   */
  const scan = (): Manifest => {
    const files = findComponentFiles(srcDir, projectRoot, shouldIgnore, logger);

    // Create a TypeScript program to analyze the files.
    const program = ts.createProgram(files, {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      skipLibCheck: true,
    });

    const components: ComponentDef[] = [];
    for (const file of files) {
      try {
        const defs = getComponentDefs(file, program);
        if (defs.length > 0) {
          components.push(...defs);
        }
      } catch (error) {
        logger.warn('rplite:scanner:scan-error', {
          path: toRelativePath(projectRoot, file),
          error: (error as Error).message,
        });
      }
    }
    return { version: MANIFEST_VERSION, components };
  };

  return { options: resolvedOptions, scan };
}
