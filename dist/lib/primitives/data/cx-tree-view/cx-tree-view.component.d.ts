import { EventEmitter } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import * as i0 from "@angular/core";
export type CxTreeViewDensity = 'comfortable' | 'compact';
export interface CxTreeViewItem {
    readonly id: string;
    readonly label: string;
    readonly icon?: CxIconName;
    readonly disabled?: boolean;
    readonly children?: readonly CxTreeViewItem[];
}
export declare class CxTreeViewComponent {
    private readonly itemsState;
    private readonly selectedIdState;
    private readonly expandedIdsState;
    private readonly densityState;
    private readonly selectableState;
    private readonly disabledState;
    private readonly showIconsState;
    set density(value: CxTreeViewDensity | undefined);
    set selectable(value: boolean | undefined);
    set disabled(value: boolean | undefined);
    set showIcons(value: boolean | undefined);
    set items(value: readonly CxTreeViewItem[] | null | undefined);
    set selectedId(value: string | undefined);
    set expandedIds(value: readonly string[] | null | undefined);
    readonly selectedIdChange: EventEmitter<string | undefined>;
    readonly expandedIdsChange: EventEmitter<readonly string[]>;
    protected readonly items$: import("@angular/core").Signal<readonly CxTreeViewItem[]>;
    protected readonly selectedId$: import("@angular/core").Signal<string | undefined>;
    protected readonly expandedIds$: import("@angular/core").Signal<readonly string[]>;
    protected readonly density$: import("@angular/core").Signal<CxTreeViewDensity>;
    protected readonly selectable$: import("@angular/core").Signal<boolean>;
    protected readonly disabled$: import("@angular/core").Signal<boolean>;
    protected readonly showIcons$: import("@angular/core").Signal<boolean>;
    protected hasChildren(item: CxTreeViewItem): boolean;
    protected isExpanded(item: CxTreeViewItem): boolean;
    protected onToggle(item: CxTreeViewItem): void;
    protected onSelect(item: CxTreeViewItem): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxTreeViewComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxTreeViewComponent, "cx-tree-view", never, { "density": { "alias": "density"; "required": false; }; "selectable": { "alias": "selectable"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "showIcons": { "alias": "showIcons"; "required": false; }; "items": { "alias": "items"; "required": false; }; "selectedId": { "alias": "selectedId"; "required": false; }; "expandedIds": { "alias": "expandedIds"; "required": false; }; }, { "selectedIdChange": "selectedIdChange"; "expandedIdsChange": "expandedIdsChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-tree-view.component.d.ts.map