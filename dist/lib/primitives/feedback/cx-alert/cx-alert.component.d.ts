import { EventEmitter } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { type CxButtonMood } from '../../actions/cx-button';
import * as i0 from "@angular/core";
export type CxAlertMood = 'default' | 'info' | 'warning' | 'success' | 'danger';
export interface CxAlertAction {
    readonly text: string;
    readonly href?: string;
}
export declare class CxAlertComponent {
    heading: string;
    mood: CxAlertMood;
    loading: boolean;
    action: CxAlertAction | undefined;
    dismissible: boolean;
    readonly actionSelect: EventEmitter<CxAlertAction>;
    readonly dismiss: EventEmitter<void>;
    protected get hostClass(): string;
    protected get hostRole(): 'alert' | 'status';
    protected get hostBusy(): 'true' | null;
    protected get resolvedHeading(): string;
    protected hasHeading(): boolean;
    protected get resolvedIcon(): CxIconName;
    protected get visibleAction(): CxAlertAction | undefined;
    protected get actionMood(): CxButtonMood;
    protected actionHref(action: CxAlertAction): string | undefined;
    protected get dismissAriaLabel(): string;
    protected onActionSelect(action: CxAlertAction): void;
    protected onDismiss(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxAlertComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxAlertComponent, "cx-alert", never, { "heading": { "alias": "heading"; "required": false; }; "mood": { "alias": "mood"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; "action": { "alias": "action"; "required": false; }; "dismissible": { "alias": "dismissible"; "required": false; }; }, { "actionSelect": "actionSelect"; "dismiss": "dismiss"; }, never, ["*"], true, never>;
}
//# sourceMappingURL=cx-alert.component.d.ts.map