import { AfterContentChecked, EventEmitter, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxDismissRequest } from '../../primitives/overlay/dismiss-request';
import * as i0 from "@angular/core";
export type CxWizardDialogAction = 'cancel' | 'back' | 'continue' | 'confirm' | 'close' | 'dismiss' | 'retry';
export type CxWizardDialogSize = 'default' | 'large';
export type CxWizardDialogStepStatus = 'default' | 'success';
export interface CxWizardDialogProcessing {
    /** Unique for each occurrence and retry; retain it while updating that work's result. */
    id: string;
    state: 'pending' | 'success' | 'danger';
    heading: string;
    description?: string;
}
export interface CxWizardDialogStep {
    id: string;
    name: string;
    heading: string;
    infoHeading: string;
    infoDescription: string;
    icon?: CxIconName;
    infoCustom?: boolean;
    status?: CxWizardDialogStepStatus;
}
export interface CxWizardDialogData {
    steps: readonly CxWizardDialogStep[];
    index?: number;
    size?: CxWizardDialogSize;
    loadingActionId?: CxWizardDialogAction | string;
    feedbackVisible?: boolean;
    /** A temporary screen outside steps. Clear it and update index on processingComplete. */
    processing?: CxWizardDialogProcessing;
    /** Shows the top-right close button. Off by default; Cancel and Escape are unaffected. */
    dismissible?: boolean;
}
export declare class CxWizardDialogComponent implements AfterContentChecked, OnChanges, OnDestroy {
    private readonly document;
    private readonly injector;
    private readonly overlayState;
    private readonly openState;
    private readonly wizardState;
    private readonly stepTemplates;
    private overlayHandle?;
    private requestedOpen;
    private processingRun?;
    private processingTimer?;
    private readonly processingContent?;
    private readonly feedbackContent?;
    private readonly dialogBackdrop?;
    private readonly stepContent?;
    private readonly stepInfoContent?;
    private readonly stepHeading?;
    protected readonly titleId: string;
    protected readonly isOpen$: import("@angular/core").Signal<boolean>;
    protected readonly wizard$: import("@angular/core").Signal<CxWizardDialogData>;
    protected readonly steps$: import("@angular/core").Signal<readonly CxWizardDialogStep[]>;
    protected readonly currentStepIndex$: import("@angular/core").Signal<number>;
    protected readonly currentStep$: import("@angular/core").Signal<CxWizardDialogStep | undefined>;
    protected readonly activeTemplate$: import("@angular/core").Signal<import("@angular/core").TemplateRef<unknown> | null>;
    protected readonly loadingActionId$: import("@angular/core").Signal<string | undefined>;
    protected readonly isLoading$: import("@angular/core").Signal<boolean>;
    protected readonly isFirstStep$: import("@angular/core").Signal<boolean>;
    protected readonly isLastStep$: import("@angular/core").Signal<boolean>;
    protected readonly showFeedback$: import("@angular/core").Signal<boolean>;
    protected readonly processing$: import("@angular/core").Signal<CxWizardDialogProcessing | undefined>;
    protected readonly isLarge$: import("@angular/core").Signal<boolean>;
    protected readonly dismissible$: import("@angular/core").Signal<boolean>;
    protected readonly primaryLabel$: import("@angular/core").Signal<string>;
    protected readonly secondaryLabel$: import("@angular/core").Signal<"Cancel" | "Back">;
    protected readonly currentHeading$: import("@angular/core").Signal<string>;
    protected readonly currentInfoHeading$: import("@angular/core").Signal<string>;
    protected readonly currentInfoDescription$: import("@angular/core").Signal<string | undefined>;
    loading: boolean;
    confirmLabel: string;
    /** Disables Continue or Confirm and its keyboard shortcut without blocking Back or Cancel. */
    primaryDisabled: boolean;
    set wizard(value: CxWizardDialogData | null | undefined);
    set open(value: boolean);
    get open(): boolean;
    readonly openChange: EventEmitter<boolean>;
    /** Synchronous request emitted before a user dismissal would close this wizard. */
    readonly dismissRequest: EventEmitter<CxDismissRequest>;
    readonly action: EventEmitter<CxWizardDialogAction>;
    /** Once per successful occurrence, after at least two seconds on screen. */
    readonly processingComplete: EventEmitter<string>;
    ngOnChanges(_changes: SimpleChanges): void;
    ngAfterContentChecked(): void;
    ngOnDestroy(): void;
    protected isActiveStep(index: number): boolean;
    protected isCompletedStep(step: CxWizardDialogStep, index: number): boolean;
    protected isConnectorComplete(index: number): boolean;
    protected onBackdropClick(event: MouseEvent): void;
    protected onDialogKeydown(event: KeyboardEvent): void;
    protected onDismiss(): void;
    protected onFeedbackClose(): void;
    protected onSecondaryAction(): void;
    protected onPrimaryAction(): void;
    protected onProcessingAction(action: 'retry' | 'back'): void;
    private syncProcessing;
    private completeProcessing;
    private cancelProcessing;
    private focusProcessingAfterRender;
    private focusProcessing;
    private closeFromUser;
    private requestDismiss;
    private syncOpen;
    private focusStepAfterRender;
    private releaseOverlay;
    private assertStepTemplates;
    private clampIndex;
    private normalizeWizard;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxWizardDialogComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxWizardDialogComponent, "cx-wizard-dialog", never, { "loading": { "alias": "loading"; "required": false; }; "confirmLabel": { "alias": "confirmLabel"; "required": false; }; "primaryDisabled": { "alias": "primaryDisabled"; "required": false; }; "wizard": { "alias": "wizard"; "required": false; }; "open": { "alias": "open"; "required": false; }; }, { "openChange": "openChange"; "dismissRequest": "dismissRequest"; "action": "action"; "processingComplete": "processingComplete"; }, ["stepTemplates"], ["[cxWizardDialogProcessing], [slot=processing]", "[cxWizardDialogFeedback], [slot=feedback]", "[cxWizardDialogSecondaryAction], [slot=secondary-action]", "[cxWizardDialogInfo], [slot=info]"], true, never>;
}
//# sourceMappingURL=cx-wizard-dialog.component.d.ts.map