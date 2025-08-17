import ts from 'typescript';
import fs from 'fs';
import path from 'path';

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

export type Manifest = { components: ComponentDef[] };

export interface ScannerOptions {
  srcDir: string;
}

export function createScanner({ srcDir }: ScannerOptions) {
  function walk(dir: string): string[] {
    return fs.readdirSync(dir).flatMap((entry) => {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) return walk(full);
      return /\.(tsx?|ts)$/.test(entry) ? [full] : [];
    });
  }

  return {
    scan(): Manifest {
      const root = process.cwd();
      const absSrc = path.resolve(root, srcDir);
      const files = walk(absSrc);
      const program = ts.createProgram(files, {
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        strict: true,
        skipLibCheck: true
      });
      const checker = program.getTypeChecker();
      const components: ComponentDef[] = [];

      for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.fileName.startsWith(absSrc)) continue;
        const fn = sourceFile.statements.find((s): s is ts.FunctionDeclaration =>
          ts.isFunctionDeclaration(s) &&
          !!s.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword) &&
          !!s.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
        );
        if (!fn || !fn.parameters.length) continue;
        const param = fn.parameters[0];
        if (!param.type || !ts.isTypeReferenceNode(param.type)) continue;
        const symbol = checker.getSymbolAtLocation(param.type.typeName);
        if (!symbol) continue;
        const propsType = checker.getDeclaredTypeOfSymbol(symbol);
        const props: Record<string, PropDef> = {};
        for (const prop of checker.getPropertiesOfType(propsType)) {
          const propType = checker.getTypeOfSymbolAtLocation(prop, sourceFile);
          const def = typeToPropDef(propType);
          if (def) props[prop.getName()] = def;
        }
        const relPath = path.relative(root, sourceFile.fileName).replace(/\\/g, '/');
        const name = path.basename(sourceFile.fileName, path.extname(sourceFile.fileName));
        components.push({ name, path: relPath, props });
      }
      return { components };
    }
  };

  function typeToPropDef(type: ts.Type): PropDef | undefined {
    if (type.flags & ts.TypeFlags.String) return { type: 'string' };
    if (type.flags & ts.TypeFlags.Number) return { type: 'number' };
    if (type.flags & ts.TypeFlags.Boolean) return { type: 'boolean' };
    if (type.isUnion()) {
      const options = type.types.filter(t => t.flags & ts.TypeFlags.StringLiteral).map(t => (t as ts.StringLiteralType).value);
      if (options.length === type.types.length) {
        return { type: 'union', options };
      }
    }
    return undefined;
  }
}
