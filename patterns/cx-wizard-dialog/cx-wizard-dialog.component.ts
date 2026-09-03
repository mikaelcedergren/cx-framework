import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  AfterContentChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Injector,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  afterNextRender,
  computed,
  contentChildren,
  inject,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxButtonComponent } from '../../primitives/actions/cx-button';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import { CxShortcutKeyComponent } from '../../primitives/display/cx-shortcut-key';
import { CxDismissRequest, type CxDismissReason } from '../../primitives/overlay/dismiss-request';
import { CxOverlayStateService, type CxOverlayStateHandle } from '../../primitives/overlay/overlay-state';
import { isHostVisible } from '../../primitives/shared/host-visibility';
import { CxStateMessageComponent } from '../../primitives/feedback/cx-state-message';
import { CxIconComponent } from '../../primitives/media/cx-icon';
import { CxWizardDialogStepDirective } from './cx-wizard-dialog-step.directive';

let cxWizardDialogId = 0;

export type CxWizardDialogAction = 'cancel' | 'back' | 'continue' | 'confirm' | 'close' | 'dismiss';
export type CxWizardDialogSize = 'default' | 'large';
export type CxWizardDialogStepStatus = 'default' | 'success';

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
  dismissible?: boolean;
}

const EMPTY_WIZARD: CxWizardDialogData = {
  steps: [],
  index: 0,
  size: 'default',
  dismissible: true,
};

@Component({
  selector: 'cx-wizard-dialog',
  imports: [
    CommonModule,
    A11yModule,
    CxButtonComponent,
    CxShortcutKeyComponent,
    CxStateMessageComponent,
    CxIconButtonComponent,
    CxIconComponent,
  ],
  templateUrl: './cx-wizard-dialog.component.html',
  styleUrl: './cx-wizard-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxWizardDialogComponent implements AfterContentChecked, OnChanges, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly overlayState = inject(CxOverlayStateService);
  private readonly openState = signal(false);
  private readonly wizardState = signal<CxWizardDialogData>(EMPTY_WIZARD);
  private readonly stepTemplates = contentChildren(CxWizardDialogStepDirective);
  private overlayHandle?: CxOverlayStateHandle;
  private requestedOpen = false;

  @ViewChild('feedbackContent', { read: ElementRef })
  private readonly feedbackContent?: ElementRef<HTMLElement>;

  @ViewChild('dialogBackdrop', { read: ElementRef })
  private readonly dialogBackdrop?: ElementRef<HTMLElement>;

  @ViewChild('stepContent', { read: ElementRef })
  private readonly stepContent?: ElementRef<HTMLElement>;

  @ViewChild('stepInfoContent', { read: ElementRef })
  private readonly stepInfoContent?: ElementRef<HTMLElement>;

  @ViewChild('stepHeading', { read: ElementRef })
  private readonly stepHeading?: ElementRef<HTMLElement>;

  protected readonly titleId = `cx-wizard-dialog-title-${++cxWizardDialogId}`;
  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly wizard$ = this.wizardState.asReadonly();
  protected readonly steps$ = computed(() => this.wizard$().steps);
  protected readonly currentStepIndex$ = computed(() => this.clampIndex(this.wizard$().index ?? 0));
  protected readonly currentStep$ = computed<CxWizardDialogStep | undefined>(() => this.steps$()[this.currentStepIndex$()]);
  protected readonly activeTemplate$ = computed(() => {
    const activeStepId = this.currentStep$()?.id;
    if (!activeStepId) {
      return null;
    }
    return this.stepTemplates().find(template => template.stepId === activeStepId)?.templateRef ?? null;
  });
  protected readonly loadingActionId$ = computed(() => this.wizard$().loadingActionId);
  protected readonly isLoading$ = computed(() => this.loading || !!this.loadingActionId$());
  protected readonly isFirstStep$ = computed(() =>
    this.steps$().length === 0 || this.currentStepIndex$() === 0,
  );
  protected readonly isLastStep$ = computed(() =>
    this.steps$().length === 0 || this.currentStepIndex$() === this.steps$().length - 1,
  );
  protected readonly showFeedback$ = computed(() => this.wizard$().feedbackVisible === true);
  protected readonly isLarge$ = computed(() => this.wizard$().size === 'large');
  protected readonly dismissible$ = computed(() => this.wizard$().dismissible !== false);
  protected readonly primaryLabel$ = computed(() => {
    if (this.isLastStep$()) {
      const override = this.confirmLabel.trim();
      return override || 'Confirm';
    }
    return 'Continue';
  });
  protected readonly secondaryLabel$ = computed(() => (this.isFirstStep$() ? 'Cancel' : 'Back'));
  protected readonly currentHeading$ = computed(() => this.currentStep$()?.heading.trim() || this.currentStep$()?.name || 'Step');
  protected readonly currentInfoHeading$ = computed(
    () => this.currentStep$()?.infoHeading.trim() || this.currentStep$()?.name || 'Step guidance',
  );
  protected readonly currentInfoDescription$ = computed(() => this.currentStep$()?.infoDescription.trim() || undefined);

  @Input() loading = false;
  @Input() confirmLabel = '';

  @Input()
  public set wizard(value: CxWizardDialogData | null | undefined) {
    const previousStepId = this.currentStep$()?.id;
    const activeElement = this.document.activeElement;
    const focusedInOutgoingStep = this.openState()
      && !!previousStepId
      && activeElement instanceof HTMLElement
      && (
        !!this.stepContent?.nativeElement.contains(activeElement)
        || !!this.stepInfoContent?.nativeElement.contains(activeElement)
      );
    const nextWizard = this.normalizeWizard(value);
    const nextStepId = nextWizard.steps[nextWizard.index ?? 0]?.id;

    this.wizardState.set(nextWizard);
    if (focusedInOutgoingStep && nextStepId && nextStepId !== previousStepId) {
      this.focusStepAfterRender(nextStepId);
    }
  }

  @Input()
  public set open(value: boolean) {
    this.requestedOpen = Boolean(value);
    this.syncOpen(this.requestedOpen);
  }
  public get open(): boolean {
    return this.requestedOpen;
  }

  @Output() readonly openChange = new EventEmitter<boolean>();
  /** Synchronous request emitted before a user dismissal would close this wizard. */
  @Output() readonly dismissRequest = new EventEmitter<CxDismissRequest>();
  @Output() readonly action = new EventEmitter<CxWizardDialogAction>();

  public ngOnChanges(_changes: SimpleChanges): void {
    this.syncOpen(this.requestedOpen);
  }

  public ngAfterContentChecked(): void {
    if (this.isOpen$()) {
      this.assertStepTemplates();
    }
  }

  public ngOnDestroy(): void {
    this.releaseOverlay();
  }

  protected isActiveStep(index: number): boolean {
    return index === this.currentStepIndex$();
  }

  protected isCompletedStep(step: CxWizardDialogStep, index: number): boolean {
    return step.status === 'success' || index < this.currentStepIndex$();
  }

  protected isConnectorComplete(index: number): boolean {
    return this.currentStepIndex$() > index;
  }

  protected onBackdropClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  protected onDialogKeydown(event: KeyboardEvent): void {
    if (event.isComposing || this.isLoading$()) {
      return;
    }

    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      this.onPrimaryAction();
    }
  }

  protected onDismiss(): void {
    if (this.isLoading$()) {
      return;
    }
    if (!this.requestDismiss('dismiss')) {
      return;
    }
    this.action.emit('dismiss');
    this.closeFromUser();
  }

  protected onFeedbackClose(): void {
    if (this.isLoading$()) {
      return;
    }
    this.action.emit('close');
    this.closeFromUser();
  }

  protected onSecondaryAction(): void {
    if (this.isLoading$()) {
      return;
    }

    if (this.isFirstStep$()) {
      if (!this.requestDismiss('cancel')) {
        return;
      }
      this.action.emit('cancel');
      this.closeFromUser();
      return;
    }

    this.action.emit('back');
  }

  protected onPrimaryAction(): void {
    if (this.isLoading$()) {
      return;
    }

    if (this.isLastStep$()) {
      this.action.emit('confirm');
      return;
    }

    this.action.emit('continue');
  }

  private closeFromUser(): void {
    this.requestedOpen = false;
    this.syncOpen(false);
    this.openChange.emit(false);
  }

  private requestDismiss(reason: CxDismissReason): boolean {
    const request = new CxDismissRequest(reason);
    this.dismissRequest.emit(request);
    return !request.defaultPrevented;
  }

  private syncOpen(nextOpen: boolean): void {
    if (this.openState() === nextOpen) {
      return;
    }

    if (nextOpen) {
      this.overlayHandle = this.overlayState.capture({
        surface: () => this.dialogBackdrop?.nativeElement,
        isActive: () => this.openState() && isHostVisible(this.dialogBackdrop?.nativeElement),
        onEscape: () => this.onSecondaryAction(),
      });
    } else {
      this.releaseOverlay();
    }

    this.openState.set(nextOpen);
  }

  private focusStepAfterRender(expectedStepId: string): void {
    afterNextRender(() => {
      if (
        !this.openState()
        || !this.overlayState.isTopmost(this.overlayHandle)
        || this.currentStep$()?.id !== expectedStepId
      ) {
        return;
      }
      this.stepHeading?.nativeElement.focus({ preventScroll: true });
    }, { injector: this.injector });
  }

  private releaseOverlay(): void {
    this.overlayState.release(this.overlayHandle);
    this.overlayHandle = undefined;
  }

  private assertStepTemplates(): void {
    const templateIds = new Set<string>();
    this.stepTemplates().forEach((template, index) => {
      const id = template.stepId.trim();
      if (!id) {
        throw new Error(`[cx-wizard-dialog] step template at index ${index} requires a non-empty id.`);
      }
      if (templateIds.has(id)) {
        throw new Error(`[cx-wizard-dialog] step template id "${id}" must be unique.`);
      }
      templateIds.add(id);
    });

    for (const step of this.steps$()) {
      if (!templateIds.has(step.id)) {
        throw new Error(`[cx-wizard-dialog] step "${step.id}" requires a matching cxWizardDialogStep template.`);
      }
    }
  }

  private clampIndex(index: number): number {
    const maxIndex = this.steps$().length - 1;
    if (maxIndex < 0) {
      return 0;
    }
    const normalizedIndex = Number.isFinite(index) ? Math.trunc(index) : 0;
    return Math.max(0, Math.min(normalizedIndex, maxIndex));
  }

  private normalizeWizard(value: CxWizardDialogData | null | undefined): CxWizardDialogData {
    if (!value) {
      return EMPTY_WIZARD;
    }

    if (!Array.isArray(value.steps)) {
      throw new Error('[cx-wizard-dialog] wizard.steps must be an array.');
    }

    const ids = new Set<string>();
    const names = new Set<string>();
    const steps: CxWizardDialogStep[] = value.steps.map((step, index) => {
      const id = typeof step?.id === 'string' ? step.id.trim() : '';
      if (!id) {
        throw new Error(`[cx-wizard-dialog] step at index ${index} requires a non-empty id.`);
      }
      if (ids.has(id)) {
        throw new Error(`[cx-wizard-dialog] step id "${id}" must be unique.`);
      }
      ids.add(id);

      const name = typeof step?.name === 'string' ? step.name.trim() : '';
      const nameKey = name.toLowerCase();
      if (names.has(nameKey)) {
        throw new Error(`[cx-wizard-dialog] step name "${name}" must be unique.`);
      }
      names.add(nameKey);

      const heading = typeof step?.heading === 'string' ? step.heading.trim() : '';
      const infoHeading = typeof step?.infoHeading === 'string' ? step.infoHeading.trim() : '';
      const infoDescription = typeof step?.infoDescription === 'string' ? step.infoDescription.trim() : '';
      if (step.infoCustom !== true) {
      }

      return {
        id,
        name,
        heading,
        infoHeading,
        infoDescription,
        icon: step.icon,
        infoCustom: step.infoCustom === true,
        status: step.status === 'success' ? 'success' as const : 'default' as const,
      };
    });

    const index = Math.max(0, Math.min(Math.trunc(value.index ?? 0), Math.max(steps.length - 1, 0)));

    return {
      ...value,
      steps,
      index,
      size: value.size === 'large' ? 'large' : 'default',
      dismissible: value.dismissible !== false,
    };
  }
}
