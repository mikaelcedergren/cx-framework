import { EventEmitter, type OnChanges, type SimpleChanges } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import * as i0 from "@angular/core";
/**
 * List-level presentation owned by the parent `cx-list`. Content projection
 * puts the row outside the list's style scope, so the list pushes these values
 * down instead of reaching in with a descendant selector.
 */
export interface CxListItemContext {
    readonly density: 'comfortable' | 'compact';
    readonly divided: boolean;
    /** A parent list is driving the open state, so the row must not toggle itself. */
    readonly managed: boolean;
}
export declare class CxListItemComponent implements OnChanges {
    private readonly expandedState;
    private readonly contextState;
    private warnedInvalidActivation;
    /**
     * Stable key for the parent list's single-open state. Falls back to the
     * generated id, so an uncontrolled list still opens one row at a time.
     */
    itemId: string | undefined;
    heading: string;
    description: string | undefined;
    /** Short trailing value such as a count, status word, or timestamp. */
    meta: string | undefined;
    prependIcon: CxIconName | undefined;
    /**
     * Turns the row body into a button that emits `pressed`. Ignored when the
     * row is `expandable`, because a row cannot both navigate away and open.
     */
    interactive: boolean;
    /** Navigation destination. Renders the row body as a real link. */
    href: string | undefined;
    target: string | undefined;
    rel: string | undefined;
    /** Row body opens its projected content instead of emitting `pressed`. */
    expandable: boolean;
    disabled: boolean;
    readonly pressed: EventEmitter<void>;
    readonly expandedChange: EventEmitter<boolean>;
    /** Raised on user activation so the parent list can close its other rows. */
    readonly expandToggle: EventEmitter<string>;
    protected readonly contentId: string;
    protected readonly expanded$: import("@angular/core").Signal<boolean>;
    protected readonly context$: import("@angular/core").Signal<CxListItemContext>;
    ngOnChanges(_changes: SimpleChanges): void;
    /** Key the parent list tracks this row by. */
    get key(): string;
    /** Parent-driven open state; does not re-emit `expandedChange` back to the list. */
    setExpanded(expanded: boolean): void;
    setContext(context: CxListItemContext): void;
    /** A static row has no affordance and takes no pointer or keyboard activation. */
    protected get activatable(): boolean;
    protected get resolvedHref(): string | undefined;
    protected get resolvedRel(): string | null;
    protected onActivate(): void;
    protected onLinkClick(event: MouseEvent): void;
    private warnInvalidCombinations;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxListItemComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxListItemComponent, "cx-list-item", never, { "itemId": { "alias": "itemId"; "required": false; }; "heading": { "alias": "heading"; "required": false; }; "description": { "alias": "description"; "required": false; }; "meta": { "alias": "meta"; "required": false; }; "prependIcon": { "alias": "prependIcon"; "required": false; }; "interactive": { "alias": "interactive"; "required": false; }; "href": { "alias": "href"; "required": false; }; "target": { "alias": "target"; "required": false; }; "rel": { "alias": "rel"; "required": false; }; "expandable": { "alias": "expandable"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; }, { "pressed": "pressed"; "expandedChange": "expandedChange"; "expandToggle": "expandToggle"; }, never, ["[actions]", "*"], true, never>;
    static ngAcceptInputType_interactive: unknown;
    static ngAcceptInputType_expandable: unknown;
    static ngAcceptInputType_disabled: unknown;
}
//# sourceMappingURL=cx-list-item.component.d.ts.map