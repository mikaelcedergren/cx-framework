import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
export interface CxMarkdownLinkClick {
    href: string;
    event: MouseEvent;
}
/**
 * `default` — compact UI markdown (notes, inline copy).
 * `article` — editorial reading treatment via the global `.cx-article` styling
 * (serif headings, reading measure). Use for long-form bodies.
 */
export type CxMarkdownVariant = 'default' | 'article';
export type CxMarkdownAlign = 'center' | 'start';
export declare class CxMarkdownComponent {
    private readonly markdownState;
    readonly linkClick: EventEmitter<CxMarkdownLinkClick>;
    set markdown(value: string | undefined);
    variant: CxMarkdownVariant;
    align: CxMarkdownAlign;
    protected readonly renderedMarkdown$: import("@angular/core").Signal<string>;
    protected readonly hasVisibleContent$: import("@angular/core").Signal<boolean>;
    protected onClick(event: MouseEvent): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxMarkdownComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxMarkdownComponent, "cx-markdown", never, { "markdown": { "alias": "markdown"; "required": false; }; "variant": { "alias": "variant"; "required": false; }; "align": { "alias": "align"; "required": false; }; }, { "linkClick": "linkClick"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-markdown.component.d.ts.map