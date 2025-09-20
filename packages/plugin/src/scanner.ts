import ts from 'typescript';
import path from 'path';
import fs from 'fs';
import {
  MANIFEST_VERSION,
  type ComponentDef,
  type Manifest,
  type PropDef,
} from './manifest.js';

export type { ComponentDef, Manifest, PropDef } from './manifest.js';

/**
 * Options for the component scanner.
 */
export interface ScannerOptions {
  /** The directory to scan for components. */
  srcDir: string;
  /** The root directory of the project. */
  projectRoot: string;
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

/**
 * Recursively finds all `.ts` and `.tsx` files in a directory.
 * @param dir - The directory to search.
 * @returns A list of absolute file paths.
 * @internal
 */
function findComponentFiles(dir: string): string[] {
  let files: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue;
        files = files.concat(findComponentFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Silently ignore errors, e.g., permission denied
    console.error(`Error reading directory ${dir}:`, error);
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

  /**
   * Parses a TypeScript type and returns a `PropDef` if it's a supported type.
   * @param type - The TypeScript type to parse.
   * @param checker - The TypeScript type checker.
   * @returns A `PropDef` or `null` if the type is not supported.
   * @internal
   */
  const parsePropType = (type: ts.Type, checker: ts.TypeChecker): PropDef | null => {
    // We don't handle nullable types, so get the base type.
    const nonNullableType = type.getNonNullableType();

    // Check for basic primitive types.
    if (nonNullableType.flags & ts.TypeFlags.String) return { type: 'string' };
    if (nonNullableType.flags & ts.TypeFlags.Number) return { type: 'number' };
    if (nonNullableType.flags & ts.TypeFlags.Boolean) return { type: 'boolean' };

    // Check for a union of string literals, e.g., `'a' | 'b' | 'c'`.
    if (nonNullableType.isUnion()) {
      const options: string[] = [];
      let isStringLiteralUnion = true;
      for (const t of nonNullableType.types) {
        if (t.isStringLiteral()) {
          options.push(t.value);
        } else {
          // If any type in the union is not a string literal, we don't support it.
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
   * Extracts the props from a React component's function declaration.
   * @param node - The AST node for the component function.
   * @param checker - The TypeScript type checker.
   * @returns A record of prop definitions, or `null` if no props are found.
   * @internal
   */
  const getPropsOfComponent = (node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression, checker: ts.TypeChecker): Record<string, PropDef> | null => {
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

      let componentName: string;
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
              const props = getPropsOfComponent(funcDecl, checker);
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
        const props = getPropsOfComponent(functionDecl, checker);
        // We only consider it a component if it has props.
        // This is a limitation, but helps filter out non-component functions.
        if (props) {
          componentDefs.push({
            name: componentName!,
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
    const files = findComponentFiles(srcDir);

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
        // Log errors but don't crash the whole process.
        console.error(`Error scanning file ${file}:`, error);
      }
    }
    return { version: MANIFEST_VERSION, components };
  };

  return { options, scan };
}
