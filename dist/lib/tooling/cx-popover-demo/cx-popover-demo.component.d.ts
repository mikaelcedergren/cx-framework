import { OnDestroy } from '@angular/core';
import { CxFloatingSurfaceController } from '../../primitives/overlay/floating-surface-controller';
import { type CxFloatingSurfaceAlign } from '../../primitives/overlay/floating-surface';
import { type CxIconName } from '../../icons/manifest';
import * as i0 from "@angular/core";
export type CxPopoverDemoOption = {
    id: string;
    label: string;
    description?: string;
    prependIcon?: CxIconName;
};
export type CxPopoverDemoScenario = 'options' | 'workspace-menu';
type CxPopoverDemoSubmenuId = 'theme';
type CxPopoverDemoSubmenuItem = {
    id: string;
    label: string;
    prependIcon?: CxIconName;
};
type CxPopoverDemoSubmenuSurface = {
    id: CxPopoverDemoSubmenuId;
    left: number;
    top: number;
    maxHeight: number;
};
/**
 * Workbench-only host that anchors a real cx-popover to a real trigger, so
 * variants exercise the production sizing and positioning contract instead of
 * a styled stand-in. Not a product component.
 */
export declare class CxPopoverDemoComponent implements OnDestroy {
    triggerText: string;
    /** Stages narrow or wide triggers to stress the width contract. */
    triggerWidth: number | undefined;
    scenario: CxPopoverDemoScenario;
    heading: string | undefined;
    /** Rendered into the popover's heading-row slot as a link, not as an input. */
    description: string | undefined;
    text: string | undefined;
    showCheckboxes: boolean;
    maxWidth: number | undefined;
    align: CxFloatingSurfaceAlign;
    private optionsValue;
    set options(value: CxPopoverDemoOption[] | null | undefined);
    get options(): CxPopoverDemoOption[];
    private triggerRef?;
    private popoverRef?;
    private readonly openState;
    private readonly selectedIdsState;
    private readonly activeSubmenuState;
    private readonly themeSelectionState;
    private submenuFocusFrame;
    private suppressNextSubmenuFocusOpen;
    protected readonly digestEnabled$: import("@angular/core").WritableSignal<boolean>;
    protected readonly isOpen$: import("@angular/core").Signal<boolean>;
    protected readonly activeSubmenu$: import("@angular/core").Signal<CxPopoverDemoSubmenuSurface | undefined>;
    protected readonly submenuWidth = 264;
    protected readonly overlay: CxFloatingSurfaceController;
    ngOnDestroy(): void;
    protected toggleOpen(): void;
    protected close(): void;
    protected onOptionClick(option: CxPopoverDemoOption): void;
    protected isSelected(optionId: string): boolean;
    protected submenuState(submenuId: CxPopoverDemoSubmenuId): 'open' | 'closed';
    protected openSubmenu(submenuId: CxPopoverDemoSubmenuId, anchor: HTMLElement): void;
    protected openSubmenuFromFocus(submenuId: CxPopoverDemoSubmenuId, anchor: HTMLElement): void;
    protected openSubmenuFromClick(submenuId: CxPopoverDemoSubmenuId, anchor: HTMLElement, event: Event): void;
    protected openSubmenuFromKeyboard(submenuId: CxPopoverDemoSubmenuId, anchor: HTMLElement, event: KeyboardEvent): void;
    protected closeSubmenu(): void;
    protected closeSubmenuFromEscape(): void;
    protected submenuItems(submenuId: CxPopoverDemoSubmenuId): readonly CxPopoverDemoSubmenuItem[];
    protected submenuAriaLabel(submenuId: CxPopoverDemoSubmenuId): string;
    protected submenuSurfaceId(submenuId: CxPopoverDemoSubmenuId): string;
    protected isSubmenuItemSelected(submenuId: CxPopoverDemoSubmenuId, itemId: string): boolean;
    protected selectSubmenuItem(submenuId: CxPopoverDemoSubmenuId, itemId: string): void;
    protected onWindowResize(): void;
    private focusFirstSubmenuItem;
    private cancelSubmenuFocus;
    private measureOverlay;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxPopoverDemoComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxPopoverDemoComponent, "cx-popover-demo", never, { "triggerText": { "alias": "triggerText"; "required": false; }; "triggerWidth": { "alias": "triggerWidth"; "required": false; }; "scenario": { "alias": "scenario"; "required": false; }; "heading": { "alias": "heading"; "required": false; }; "description": { "alias": "description"; "required": false; }; "text": { "alias": "text"; "required": false; }; "showCheckboxes": { "alias": "showCheckboxes"; "required": false; }; "maxWidth": { "alias": "maxWidth"; "required": false; }; "align": { "alias": "align"; "required": false; }; "options": { "alias": "options"; "required": false; }; }, {}, never, never, true, never>;
}
export {};
//# sourceMappingURL=cx-popover-demo.component.d.ts.map