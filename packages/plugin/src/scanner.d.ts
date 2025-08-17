export type PropDef = {
    type: 'string';
} | {
    type: 'number';
} | {
    type: 'boolean';
} | {
    type: 'union';
    options: string[];
};
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
export declare function createScanner(options: ScannerOptions): Scanner;
//# sourceMappingURL=scanner.d.ts.map