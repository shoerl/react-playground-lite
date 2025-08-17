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

  const getPropsOfComponent = (node: ts.FunctionDeclaration | ts.ArrowFunction, checker: ts.TypeChecker): Record<string, PropDef> | null => {
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

  const getComponentDef = (filePath: string, program: ts.Program): ComponentDef | null => {
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) return null;
    const checker = program.getTypeChecker();

    let functionDecl: ts.FunctionDeclaration | ts.ArrowFunction | undefined;
    let componentName: string | undefined;

    const visit = (node: ts.Node) => {
      let exportNode: ts.Node | undefined;
      if (ts.isExportAssignment(node) && node.expression) {
        exportNode = node.expression;
      } else if (
        (ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)) &&
        node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) &&
        node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)
      ) {
        exportNode = node;
      }

      if (!exportNode) {
        ts.forEachChild(node, visit);
        return;
      }

      if (ts.isIdentifier(exportNode)) {
        let symbol = checker.getSymbolAtLocation(exportNode);
        if (symbol) {
          if (symbol.flags & ts.SymbolFlags.Alias) {
            symbol = checker.getAliasedSymbol(symbol);
          }

          if (symbol.valueDeclaration && ts.isFunctionDeclaration(symbol.valueDeclaration)) {
            functionDecl = symbol.valueDeclaration;
            componentName = functionDecl.name?.getText(sourceFile);
          }
        }
      } else if (ts.isFunctionDeclaration(exportNode)) {
        functionDecl = exportNode;
        componentName = exportNode.name?.getText(sourceFile);
      } else if (ts.isVariableStatement(exportNode)) {
        const varDecl = exportNode.declarationList.declarations[0];
        if (varDecl && varDecl.initializer && ts.isArrowFunction(varDecl.initializer)) {
          functionDecl = varDecl.initializer;
          componentName = varDecl.name.getText(sourceFile);
        }
      }
    };

    visit(sourceFile);

    if (!functionDecl) return null;

    const props = getPropsOfComponent(functionDecl, checker);
    if (!props) return null;

    return {
      name: componentName || path.basename(filePath, path.extname(filePath)),
      path: path.relative(projectRoot, filePath).replace(/\\/g, '/'),
      props,
    };
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
        const def = getComponentDef(file, program);
        if (def) {
          components.push(def);
        }
      } catch (error) {
        console.error(`Error scanning file ${file}:`, error);
      }
    }
    return { components };
  };

  return { options, scan };
}
