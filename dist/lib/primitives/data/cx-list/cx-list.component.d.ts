import { EventEmitter, type AfterContentInit, type OnDestroy } from '@angular/core';
import * as i0 from "@angular/core";
export type CxListVariant = 'default' | 'flat';
export type CxListDensity = 'comfortable' | 'compact';
export declare class CxListComponent implements AfterContentInit, OnDestroy {
    private readonly emptyState;
    private expandedIdValue;
    private densityValue;
    private dividedValue;
    private itemChangesSubscription?;
    private itemToggleSubscriptions;
    private items?;
    /** `flat` drops the container's border and radius for an already-framed surface. */
    variant: CxListVariant;
    emptyText: string;
    set density(value: CxListDensity);
    get density(): CxListDensity;
    set divided(value: boolean);
    get divided(): boolean;
    /**
     * The single open row. The list is an accordion by design: opening a row
     * closes the previous one, so multiple standalone panels are the wrong
     * component for that job.
     */
    set expandedId(value: string | undefined);
    get expandedId(): string | undefined;
    readonly expandedIdChange: EventEmitter<string | undefined>;
    protected readonly empty$: import("@angular/core").Signal<boolean>;
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    private bindItems;
    private unbindItems;
    private onExpandToggle;
    private syncExpanded;
    private syncContext;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxListComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxListComponent, "cx-list", never, { "variant": { "alias": "variant"; "required": false; }; "emptyText": { "alias": "emptyText"; "required": false; }; "density": { "alias": "density"; "required": false; }; "divided": { "alias": "divided"; "required": false; }; "expandedId": { "alias": "expandedId"; "required": false; }; }, { "expandedIdChange": "expandedIdChange"; }, ["items"], ["*"], true, never>;
    static ngAcceptInputType_divided: unknown;
}
//# sourceMappingURL=cx-list.component.d.ts.map