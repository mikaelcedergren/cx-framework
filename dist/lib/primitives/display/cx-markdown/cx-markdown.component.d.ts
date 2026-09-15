import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
export interface CxMarkdownLinkClick {
    href: string;
    event: MouseEvent;
}
/**
 * `default` — compact UI markdown (notes, inline copy).
 * `editorial` — the shared article and public-page reading treatment. Use when
 * reading is the surface's primary task, never for ordinary product UI.
 */
export type CxMarkdownVariant = 'default' | 'editorial';
export declare class CxMarkdownComponent {
    private readonly markdownState;
    readonly linkClick: EventEmitter<CxMarkdownLinkClick>;
    set markdown(value: string | undefined);
    variant: CxMarkdownVariant;
    protected readonly renderedMarkdown$: import("@angular/core").Signal<string>;
    protected readonly hasVisibleContent$: import("@angular/core").Signal<boolean>;
    protected onClick(event: MouseEvent): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxMarkdownComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxMarkdownComponent, "cx-markdown", never, { "markdown": { "alias": "markdown"; "required": false; }; "variant": { "alias": "variant"; "required": false; }; }, { "linkClick": "linkClick"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-markdown.component.d.ts.map