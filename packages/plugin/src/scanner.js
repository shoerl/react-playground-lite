import ts from 'typescript';
import path from 'path';
import fs from 'fs';
function findComponentFiles(dir) {
    let files = [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name === 'node_modules')
                    continue;
                files = files.concat(findComponentFiles(fullPath));
            }
            else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
                files.push(fullPath);
            }
        }
    }
    catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
    }
    return files;
}
export function createScanner(options) {
    const { srcDir, projectRoot } = options;
    const parsePropType = (type, checker) => {
        const nonNullableType = type.getNonNullableType();
        if (nonNullableType.flags & ts.TypeFlags.String)
            return { type: 'string' };
        if (nonNullableType.flags & ts.TypeFlags.Number)
            return { type: 'number' };
        if (nonNullableType.flags & ts.TypeFlags.Boolean)
            return { type: 'boolean' };
        if (nonNullableType.isUnion()) {
            const options = [];
            let isStringLiteralUnion = true;
            for (const t of nonNullableType.types) {
                if (t.isStringLiteral()) {
                    options.push(t.value);
                }
                else {
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
    const getPropsOfComponent = (node, checker) => {
        if (node.parameters.length !== 1) {
            return null;
        }
        const propsParam = node.parameters[0];
        if (!propsParam.type)
            return null;
        const type = checker.getTypeFromTypeNode(propsParam.type);
        const properties = type.getProperties();
        const props = {};
        for (const propSymbol of properties) {
            const propName = propSymbol.getName();
            const propType = checker.getTypeOfSymbolAtLocation(propSymbol, propSymbol.valueDeclaration);
            const propDef = parsePropType(propType, checker);
            if (propDef) {
                props[propName] = propDef;
            }
        }
        return Object.keys(props).length > 0 ? props : null;
    };
    const getComponentDef = (filePath, program) => {
        const sourceFile = program.getSourceFile(filePath);
        if (!sourceFile)
            return null;
        const checker = program.getTypeChecker();
        let functionDecl;
        let componentName;
        const visit = (node) => {
            let exportNode;
            if (ts.isExportAssignment(node) && node.expression) {
                exportNode = node.expression;
            }
            else if ((ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)) &&
                node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) &&
                node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)) {
                exportNode = node;
            }
            if (!exportNode) {
                ts.forEachChild(node, visit);
                return;
            }
            if (ts.isIdentifier(exportNode)) {
                const symbol = checker.getResolvedSignature(exportNode)?.getDeclaration()?.parent;
                if (symbol && ts.isFunctionDeclaration(symbol)) {
                    functionDecl = symbol;
                    componentName = symbol.name?.getText(sourceFile);
                }
            }
            else if (ts.isFunctionDeclaration(exportNode)) {
                functionDecl = exportNode;
                componentName = exportNode.name?.getText(sourceFile);
            }
            else if (ts.isVariableStatement(exportNode)) {
                const varDecl = exportNode.declarationList.declarations[0];
                if (varDecl && varDecl.initializer && ts.isArrowFunction(varDecl.initializer)) {
                    functionDecl = varDecl.initializer;
                    componentName = varDecl.name.getText(sourceFile);
                }
            }
        };
        visit(sourceFile);
        if (!functionDecl)
            return null;
        const props = getPropsOfComponent(functionDecl, checker);
        if (!props)
            return null;
        return {
            name: componentName || path.basename(filePath, path.extname(filePath)),
            path: path.relative(projectRoot, filePath).replace(/\\/g, '/'),
            props,
        };
    };
    const scan = () => {
        const files = findComponentFiles(srcDir);
        const program = ts.createProgram(files, {
            jsx: ts.JsxEmit.ReactJSX,
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ESNext,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            skipLibCheck: true,
        });
        const components = [];
        for (const file of files) {
            try {
                const def = getComponentDef(file, program);
                if (def) {
                    components.push(def);
                }
            }
            catch (error) {
                console.error(`Error scanning file ${file}:`, error);
            }
        }
        return { components };
    };
    return { options, scan };
}
//# sourceMappingURL=scanner.js.map