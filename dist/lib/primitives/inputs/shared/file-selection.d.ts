import { type CxValidationMessage } from './field.types';
export type CxFileValue = {
    name: string;
    size?: number;
    type?: string;
    lastModified?: number;
    file?: File;
};
export type CxFileSelectionIssue = 'unsupported-type' | 'too-large' | 'single-file';
export type CxFileSelectionResult = {
    accepted: readonly CxFileValue[];
    issue: CxFileSelectionIssue | undefined;
};
export declare function normalizeCxFileValue(value: CxFileValue | File): CxFileValue;
export declare function selectCxFiles(values: ReadonlyArray<CxFileValue | File>, options: {
    accept?: string;
    maxSize?: number;
    multiple: boolean;
}): CxFileSelectionResult;
export declare function cxFileSelectionMessage(issue: CxFileSelectionIssue | undefined, options?: {
    accept?: string;
    maxSize?: number;
}): CxValidationMessage | undefined;
export declare function formatCxFileSize(size: number | undefined): string;
export declare function formatCxAcceptedFileTypes(accept: string | undefined): readonly string[];
export declare function formatCxFileConstraints(accept: string | undefined, maxSize: number | undefined): string;
//# sourceMappingURL=file-selection.d.ts.map