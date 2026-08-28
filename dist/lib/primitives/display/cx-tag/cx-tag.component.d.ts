import { EventEmitter } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import * as i0 from "@angular/core";
export declare const CX_TAG_COLORS: readonly ["default", "blue", "cyan", "lime", "green", "yellow", "orange", "tangerine", "red", "pink", "purple", "violet"];
export type CxTagColor = (typeof CX_TAG_COLORS)[number];
export declare const CX_TAG_COLOR_PICKER_OPTIONS: readonly ["blue", "cyan", "lime", "green", "yellow", "orange", "tangerine", "red", "pink", "purple", "violet"];
export declare class CxTagComponent {
    private readonly host;
    text: string;
    icon: CxIconName | undefined;
    color: CxTagColor;
    outline: boolean;
    dismissible: boolean;
    /**
     * Turns the tag body into a real button. Opt-in because a tag is often
     * slotted inside another button or label, where a nested button would be
     * invalid and would steal the outer control's activation.
     */
    interactive: boolean;
    /** Accessible name for the interactive body; falls back to the visible text. */
    ariaLabel: string | undefined;
    /**
     * Set only when the tag opens a surface. Drives aria-haspopup and
     * aria-expanded on the body button, so the popup relationship sits on the
     * real control instead of this component's non-interactive host.
     */
    expanded: boolean | undefined;
    /** ID of the surface an interactive tag opens. */
    controls: string | undefined;
    readonly dismiss: EventEmitter<void>;
    readonly pressed: EventEmitter<void>;
    protected get visibleText(): string;
    protected get dismissLabel(): string;
    /** Null keeps the visible text as the button's accessible name. */
    protected get bodyLabel(): string | null;
    protected get popupKind(): string | null;
    /**
     * Focuses an interactive tag without its container needing to know which
     * element inside carries the button. No-ops on a passive tag.
     */
    focus(): void;
    protected onDismiss(event: MouseEvent): void;
    protected onPressed(event: MouseEvent): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxTagComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxTagComponent, "cx-tag", never, { "text": { "alias": "text"; "required": false; }; "icon": { "alias": "icon"; "required": false; }; "color": { "alias": "color"; "required": false; }; "outline": { "alias": "outline"; "required": false; }; "dismissible": { "alias": "dismissible"; "required": false; }; "interactive": { "alias": "interactive"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "expanded": { "alias": "expanded"; "required": false; }; "controls": { "alias": "controls"; "required": false; }; }, { "dismiss": "dismiss"; "pressed": "pressed"; }, never, never, true, never>;
    static ngAcceptInputType_interactive: unknown;
}
//# sourceMappingURL=cx-tag.component.d.ts.map