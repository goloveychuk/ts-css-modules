import * as ts from 'typescript';
export declare function patchTsLib(tsLibModule: any): void;
export default function Transformer(context: ts.TransformationContext): (source: ts.SourceFile) => ts.SourceFile;
