import { type AfterViewChecked, EventEmitter } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { type CxButtonMood } from '../../primitives/actions/cx-button';
import { type CxFeedbackAction } from '../../primitives/feedback/cx-feedback-action';
import * as i0 from "@angular/core";
export type CxStateMessageState = 'default' | 'pending' | 'success' | 'scheduled' | 'danger';
export type CxStateMessageVisual = 'icon' | 'none';
export type CxStateMessageLayout = 'vertical' | 'horizontal';
/** A state message answers with solid buttons; transparency is not one of its choices. */
export type CxStateMessageAction = Omit<CxFeedbackAction, 'transparent'>;
export declare class CxStateMessageComponent implements AfterViewChecked {
    private readonly browser;
    private measuredRegion;
    private measuredOffset;
    private messageBodyRef?;
    private iconRegionRef?;
    heading: string;
    description: string | undefined;
    action: CxStateMessageAction | undefined;
    secondaryAction: CxStateMessageAction | undefined;
    state: CxStateMessageState;
    visual: CxStateMessageVisual;
    layout: CxStateMessageLayout;
    icon: CxIconName | undefined;
    readonly actionEmitter: EventEmitter<CxStateMessageAction>;
    readonly secondaryActionEmitter: EventEmitter<CxStateMessageAction>;
    ngAfterViewChecked(): void;
    /** The state carries the mark that matches it; an icon of the consumer's own always wins. */
    protected get resolvedIcon(): CxIconName;
    protected get resolvedHeading(): string;
    protected get resolvedDescription(): string;
    protected get hasHeading(): boolean;
    protected get hasDescription(): boolean;
    protected get showSpinner(): boolean;
    protected get showIcon(): boolean;
    protected get visibleAction(): CxStateMessageAction | undefined;
    protected get visibleSecondaryAction(): CxStateMessageAction | undefined;
    protected hasActions(): boolean;
    private get resolvedPreset();
    private visibleActionFor;
    protected resolveActionMood(action: CxStateMessageAction): CxButtonMood;
    protected onActionPressed(action: CxStateMessageAction): void;
    protected onSecondaryActionPressed(action: CxStateMessageAction): void;
    /**
     * A top-aligned mark reads as dropped unless its ink starts on the heading's cap
     * line. Both offsets are real and neither is knowable from CSS: an icon carries
     * its own air inside its box, and that air differs per glyph, while the heading
     * keeps half its leading above the caps. Publish the difference so the layout can
     * lift the mark by exactly that much.
     */
    private syncIconInkOffset;
    /** Blank space between the icon box's top edge and the first painted pixel of its glyph. */
    private iconInkAir;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxStateMessageComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxStateMessageComponent, "cx-state-message", never, { "heading": { "alias": "heading"; "required": false; }; "description": { "alias": "description"; "required": false; }; "action": { "alias": "action"; "required": false; }; "secondaryAction": { "alias": "secondaryAction"; "required": false; }; "state": { "alias": "state"; "required": false; }; "visual": { "alias": "visual"; "required": false; }; "layout": { "alias": "layout"; "required": false; }; "icon": { "alias": "icon"; "required": false; }; }, { "actionEmitter": "action"; "secondaryActionEmitter": "secondaryAction"; }, never, ["*"], true, never>;
}
//# sourceMappingURL=cx-state-message.component.d.ts.map