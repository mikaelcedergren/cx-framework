import { type CxIconName } from '../../../icons/manifest';
import * as i0 from "@angular/core";
export type CxProcessPillMood = 'default' | 'info' | 'success' | 'warning' | 'danger';
/**
 * A single stage in a process. Presentational only — it renders a mood-coloured
 * indicator (icon or dot), a label, and an optional count. The interactive
 * behaviour (selection, keyboard, the move-toward-done logic) lives in
 * `cx-process`, which composes these. Usable standalone as a status legend.
 */
export declare class CxProcessPillComponent {
    /** Stage name. */
    label: string;
    /** Items currently in this stage. Omitted (undefined) hides the count; `0` is shown — a known empty stage is meaningful. */
    count: number | undefined;
    /** Semantic colour for the indicator. */
    mood: CxProcessPillMood;
    /** Leading icon. When omitted, a mood-coloured dot is shown instead. */
    icon: CxIconName | undefined;
    /** Active/selected appearance (the rail drives this from the current filter). */
    selected: boolean;
    /** Marks a settled, end-of-flow stage (e.g. Fixed, Closed) rather than open work. */
    terminal: boolean;
    /** De-emphasised appearance — used by the rail to quiet open stages once nothing is left to handle. */
    muted: boolean;
    /** Non-interactive, dimmed appearance. */
    disabled: boolean;
    /** Condensed appearance: hides the label, keeping the indicator and count. The rail sets this when the row runs out of room. */
    dense: boolean;
    protected hasCount(): boolean;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxProcessPillComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxProcessPillComponent, "cx-process-pill", never, { "label": { "alias": "label"; "required": false; }; "count": { "alias": "count"; "required": false; }; "mood": { "alias": "mood"; "required": false; }; "icon": { "alias": "icon"; "required": false; }; "selected": { "alias": "selected"; "required": false; }; "terminal": { "alias": "terminal"; "required": false; }; "muted": { "alias": "muted"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "dense": { "alias": "dense"; "required": false; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-process-pill.component.d.ts.map