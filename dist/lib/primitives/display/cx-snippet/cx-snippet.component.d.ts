import * as i0 from "@angular/core";
export type CxSnippetLanguage = 'ts' | 'html' | 'scss' | 'md' | 'json';
export type CxSnippet = {
    code: string;
    language: CxSnippetLanguage;
    label?: string;
};
export declare class CxSnippetComponent {
    snippet: CxSnippet | null | undefined;
    protected label(): string;
    protected highlightedCode(): string;
    private resolvedSnippet;
    private normalizeLanguage;
    private escapeHtml;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxSnippetComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxSnippetComponent, "cx-snippet", never, { "snippet": { "alias": "snippet"; "required": false; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-snippet.component.d.ts.map