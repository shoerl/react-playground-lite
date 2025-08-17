import ts from 'typescript';
import path from 'path';
import fs from 'fs';

export type PropDef =
  | { type: 'string' }
  | { type: 'number' }
  | { type: 'boolean' }
  | { type: 'union'; options: string[] };

export type ComponentDef = {
  name: string;
  path: string;
  props: Record<string, PropDef>;
  isDefaultExport: boolean;
};

export type Manifest = {
  components: ComponentDef[];
};

export interface ScannerOptions {
  srcDir: string;
  projectRoot: string;
}

export interface Scanner {
  options: ScannerOptions;
  scan: () => Manifest;
}

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
    console.error(`Error reading directory ${dir}:`, error);
  }
  return files;
}

export function createScanner(options: ScannerOptions): Scanner {
  const { srcDir, projectRoot } = options;

  const parsePropType = (type: ts.Type, checker: ts.TypeChecker): PropDef | null => {
    const nonNullableType = type.getNonNullableType();

    if (nonNullableType.flags & ts.TypeFlags.String) return { type: 'string' };
    if (nonNullableType.flags & ts.TypeFlags.Number) return { type: 'number' };
    if (nonNullableType.flags & ts.TypeFlags.Boolean) return { type: 'boolean' };

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

  const getPropsOfComponent = (node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression, checker: ts.TypeChecker): Record<string, PropDef> | null => {
    if (node.parameters.length !== 1) {
      return null;
    }

    const propsParam = node.parameters[0];
    if (!propsParam.type) return null;

    const type = checker.getTypeFromTypeNode(propsParam.type);
    const properties = type.getProperties();

    const props: Record<string, PropDef> = {};
    for (const propSymbol of properties) {
      const propName = propSymbol.getName();
      const propType = checker.getTypeOfSymbolAtLocation(propSymbol, propSymbol.valueDeclaration!);
      const propDef = parsePropType(propType, checker);
      if (propDef) {
        props[propName] = propDef;
      }
    }
    return Object.keys(props).length > 0 ? props : null;
  };

  const getComponentDefs = (filePath: string, program: ts.Program): ComponentDef[] => {
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) return [];
    const checker = program.getTypeChecker();
    const componentDefs: ComponentDef[] = [];

    const exports = checker.getExportsOfModule(checker.getSymbolAtLocation(sourceFile)!);

    exports.forEach(exportSymbol => {
      const decl = exportSymbol.getDeclarations()?.[0];
      if (!decl) return;

      let componentName: string;
      let functionDecl: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | undefined;
      const isDefaultExport = exportSymbol.name === 'default';

      if (ts.isFunctionDeclaration(decl) || ts.isFunctionExpression(decl) || ts.isArrowFunction(decl)) {
        functionDecl = decl;
        componentName = isDefaultExport
          ? path.basename(filePath, path.extname(filePath))
          : exportSymbol.name;
      } else if (ts.isVariableDeclaration(decl) && decl.initializer) {
        if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
          functionDecl = decl.initializer;
          componentName = isDefaultExport
            ? path.basename(filePath, path.extname(filePath))
            : (decl.name as ts.Identifier).text;
        }
      } else if (ts.isExportAssignment(decl) && ts.isIdentifier(decl.expression)) {
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
        return;
      }


      if (functionDecl) {
        const props = getPropsOfComponent(functionDecl, checker);
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

  const scan = (): Manifest => {
    const files = findComponentFiles(srcDir);
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
        console.error(`Error scanning file ${file}:`, error);
      }
    }
    return { components };
  };

  return { options, scan };
}
