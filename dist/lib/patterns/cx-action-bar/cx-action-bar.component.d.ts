import { EventEmitter } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { type CxButtonMood } from '../../primitives/actions/cx-button';
import * as i0 from "@angular/core";
export interface CxActionBarItem {
    id: string;
    name?: string;
    icon?: CxIconName;
    priority?: 'primary';
    mood?: CxButtonMood;
    disabled?: boolean;
    transparent?: boolean;
}
export interface CxActionBarGroup {
    id?: string;
    items: readonly CxActionBarItem[];
}
export interface CxActionBarData {
    count: number;
    menu: readonly CxActionBarGroup[];
}
export declare class CxActionBarComponent {
    protected readonly data$: import("@angular/core").WritableSignal<CxActionBarData | undefined>;
    set data(value: CxActionBarData | null | undefined);
    readonly deselectAll: EventEmitter<void>;
    readonly action: EventEmitter<string>;
    protected readonly visibleGroups$: import("@angular/core").Signal<readonly CxActionBarGroup[]>;
    protected get countLabel(): string;
    protected trackGroup(index: number, group: CxActionBarGroup): string;
    protected actionText(item: CxActionBarItem): string;
    protected actionAriaLabel(item: CxActionBarItem): string;
    protected actionTransparent(item: CxActionBarItem): boolean;
    protected actionMood(item: CxActionBarItem): CxButtonMood;
    protected onAction(item: CxActionBarItem): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxActionBarComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxActionBarComponent, "cx-action-bar", never, { "data": { "alias": "data"; "required": false; }; }, { "deselectAll": "deselectAll"; "action": "action"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-action-bar.component.d.ts.map