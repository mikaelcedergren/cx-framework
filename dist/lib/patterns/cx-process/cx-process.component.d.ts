import { AfterViewInit, EventEmitter, OnDestroy } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { type CxProcessPillMood } from '../../primitives/display/cx-process-pill';
import * as i0 from "@angular/core";
export interface CxProcessStage {
    /** Stable id, emitted by `selectedIdChange` when the stage is selected. */
    id: string;
    /** Stage name. */
    label: string;
    /** Items in this stage. Drives the all-clear state when every open stage reaches `0`. */
    count?: number;
    /** Semantic colour for the stage indicator. */
    mood?: CxProcessPillMood;
    /** Leading icon; a mood-coloured dot is shown when omitted. */
    icon?: CxIconName;
    /** A settled end-of-flow stage (e.g. Fixed, Closed). Items here are no longer "to handle". */
    terminal?: boolean;
    /** Disable selection of this stage. */
    disabled?: boolean;
}
interface CxProcessTab {
    key: string;
    /** `undefined` for the leading "all" tab. */
    id: string | undefined;
    label: string;
    ariaLabel: string;
    count: number | undefined;
    mood: CxProcessPillMood;
    icon: CxIconName | undefined;
    terminal: boolean;
    open: boolean;
    muted: boolean;
    disabled: boolean;
    selected: boolean;
    dividerBefore: boolean;
}
/**
 * A prominent, full-row quick filter that doubles as a progress rail: it leads
 * the user through an ordered lifecycle whose goal is an empty backlog. Each
 * stage is a `cx-process-pill`; selecting one filters the view behind it.
 *
 * Unlike a plain filter, the rail understands "done": when every open
 * (non-terminal) stage reaches `0`, it resolves into an explicit all-clear
 * state instead of a row of zeros. What the user may reconfigure is decided by
 * the host via `editable`, not by the user freely.
 */
export declare class CxProcessComponent implements AfterViewInit, OnDestroy {
    private readonly tabRefs?;
    private readonly rowRef?;
    private readonly condensedState;
    private resizeObserver?;
    private animationFrameId;
    private expandWidth;
    private readonly stagesState;
    private readonly selectedIdState;
    private readonly showAllState;
    private readonly allLabelState;
    private readonly allClearLabelState;
    private readonly editableState;
    private readonly ariaLabelState;
    /** The ordered lifecycle stages, left (open) to right (terminal). */
    set stages(value: CxProcessStage[] | undefined);
    /** Currently selected stage id; `undefined` selects the leading "all" tab. Two-way bindable. */
    set selectedId(value: string | undefined);
    /** Render a leading tab that clears the stage filter. Defaults to `true`. */
    set showAll(value: boolean);
    /** Label for the leading "all" tab. */
    set allLabel(value: string | undefined);
    /** Label the leading tab adopts once there is nothing left to handle. */
    set allClearLabel(value: string | undefined);
    /** When true, reveal a customise affordance on hover/focus that emits `customize`. */
    set editable(value: boolean);
    /** Accessible name for the tablist. */
    set ariaLabel(value: string | undefined);
    readonly selectedIdChange: EventEmitter<string | undefined>;
    readonly customize: EventEmitter<void>;
    protected readonly editable$: import("@angular/core").Signal<boolean>;
    protected readonly ariaLabel$: import("@angular/core").Signal<string>;
    protected readonly condensed$: import("@angular/core").Signal<boolean>;
    private readonly hasLifecycle$;
    /** True when there is a real lifecycle and every open stage is known to be empty. */
    protected readonly isClear$: import("@angular/core").Signal<boolean>;
    private readonly total$;
    protected readonly tabs$: import("@angular/core").Signal<CxProcessTab[]>;
    /** Index of the single tab that holds the roving tab stop. */
    protected readonly focusIndex$: import("@angular/core").Signal<number>;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    private scheduleMeasure;
    private measure;
    protected select(tab: CxProcessTab): void;
    protected onKeydown(event: KeyboardEvent, index: number): void;
    private nextEnabledIndex;
    private labelWithCount;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxProcessComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxProcessComponent, "cx-process", never, { "stages": { "alias": "stages"; "required": false; }; "selectedId": { "alias": "selectedId"; "required": false; }; "showAll": { "alias": "showAll"; "required": false; }; "allLabel": { "alias": "allLabel"; "required": false; }; "allClearLabel": { "alias": "allClearLabel"; "required": false; }; "editable": { "alias": "editable"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; }, { "selectedIdChange": "selectedIdChange"; "customize": "customize"; }, never, never, true, never>;
    static ngAcceptInputType_showAll: unknown;
    static ngAcceptInputType_editable: unknown;
}
export {};
//# sourceMappingURL=cx-process.component.d.ts.map