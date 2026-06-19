import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  computed,
  contentChildren,
  inject,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxButtonComponent } from '../../primitives/actions/cx-button';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import { CxShortcutKeyComponent } from '../../primitives/display/cx-shortcut-key';
import { CxOverlayStateService, type CxOverlayStateHandle } from '../../primitives/overlay/overlay-state';
import { CxEmptyStateComponent } from '../cx-empty-state';
import { CxIconComponent } from '../../primitives/media/cx-icon';
import { CxWizardDialogStepDirective } from './cx-wizard-dialog-step.directive';

let cxWizardDialogId = 0;

export type CxWizardDialogAction = 'cancel' | 'back' | 'continue' | 'confirm' | 'close' | 'dismiss';
export type CxWizardDialogSize = 'default' | 'large';
export type CxWizardDialogStepStatus = 'default' | 'success';

export interface CxWizardDialogStep {
  id: string;
  name: string;
  title: string;
  infoTitle: string;
  infoText: string;
  icon?: CxIconName;
  infoCustom?: boolean;
  visible?: boolean;
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
    CxEmptyStateComponent,
    CxIconButtonComponent,
    CxIconComponent,
  ],
  templateUrl: './cx-wizard-dialog.component.html',
  styleUrl: './cx-wizard-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxWizardDialogComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly overlayState = inject(CxOverlayStateService);
  private readonly openState = signal(false);
  private readonly wizardState = signal<CxWizardDialogData>(EMPTY_WIZARD);
  private readonly stepTemplates = contentChildren(CxWizardDialogStepDirective);
  private readonly documentKeydownListener = (event: KeyboardEvent) => this.onDialogKeydown(event);
  private overlayHandle?: CxOverlayStateHandle;

  protected readonly titleId = `cx-wizard-dialog-title-${++cxWizardDialogId}`;
  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly wizard$ = this.wizardState.asReadonly();
  protected readonly steps$ = computed(() => this.wizard$().steps);
  protected readonly visibleSteps$ = computed(() => this.steps$().filter(step => step.visible !== false));
  protected readonly currentStepIndex$ = computed(() => this.clampIndex(this.wizard$().index ?? 0));
  protected readonly currentStep$ = computed<CxWizardDialogStep | undefined>(() => this.steps$()[this.currentStepIndex$()]);
  protected readonly currentVisibleStepIndex$ = computed(() => {
    const currentStep = this.currentStep$();
    if (!currentStep) {
      return -1;
    }
    return this.visibleSteps$().indexOf(currentStep);
  });
  protected readonly activeTemplate$ = computed(() => {
    const activeStepId = this.currentStep$()?.id;
    if (!activeStepId) {
      return null;
    }
    return this.stepTemplates().find(template => template.stepId === activeStepId)?.templateRef ?? null;
  });
  protected readonly loadingActionId$ = computed(() => this.wizard$().loadingActionId);
  protected readonly isLoading$ = computed(() => this.loading || !!this.loadingActionId$());
  protected readonly isFirstStep$ = computed(() => this.previousIndex() < 0);
  protected readonly isLastStep$ = computed(() => this.nextIndex() >= this.steps$().length);
  protected readonly showFeedback$ = computed(() => this.wizard$().feedbackVisible === true);
  protected readonly isLarge$ = computed(() => this.wizard$().size === 'large');
  protected readonly dismissible$ = computed(() => this.wizard$().dismissible !== false);
  protected readonly primaryLabel$ = computed(() => {
    if (this.isLastStep$()) {
      const override = this.buttonNextText.trim();
      return override || 'Confirm';
    }
    return 'Continue';
  });
  protected readonly secondaryLabel$ = computed(() => (this.isFirstStep$() ? 'Cancel' : 'Back'));
  protected readonly currentTitle$ = computed(() => this.currentStep$()?.title.trim() || this.currentStep$()?.name || 'Step');
  protected readonly currentInfoTitle$ = computed(
    () => this.currentStep$()?.infoTitle.trim() || this.currentStep$()?.name || 'Step guidance',
  );
  protected readonly currentInfoText$ = computed(() => this.currentStep$()?.infoText.trim() || undefined);

  @Input() loading = false;
  @Input() buttonNextText = '';

  @Input()
  public set wizard(value: CxWizardDialogData | null | undefined) {
    this.wizardState.set(this.normalizeWizard(value));
  }

  @Input()
  public set open(value: boolean) {
    this.syncOpen(Boolean(value));
  }

  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly action = new EventEmitter<CxWizardDialogAction>();

  public ngOnDestroy(): void {
    this.releaseKeyboardShortcuts();
    this.releaseOverlay();
  }

  protected isActiveStep(index: number): boolean {
    return index === this.currentVisibleStepIndex$();
  }

  protected isCompletedStep(step: CxWizardDialogStep, index: number): boolean {
    return step.status === 'success' || (this.currentVisibleStepIndex$() > -1 && index < this.currentVisibleStepIndex$());
  }

  protected isConnectorComplete(index: number): boolean {
    return this.currentVisibleStepIndex$() > index;
  }

  protected onBackdropClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  protected onDialogKeydown(event: KeyboardEvent): void {
    if (event.isComposing || this.isLoading$()) {
      return;
    }

    if (event.key === 'Escape' && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.onSecondaryAction();
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
    this.syncOpen(false);
    this.openChange.emit(false);
  }

  private syncOpen(nextOpen: boolean): void {
    if (this.openState() === nextOpen) {
      return;
    }

    if (nextOpen) {
      this.overlayHandle = this.overlayState.capture();
      this.captureKeyboardShortcuts();
    } else {
      this.releaseKeyboardShortcuts();
      this.releaseOverlay();
    }

    this.openState.set(nextOpen);
  }

  private captureKeyboardShortcuts(): void {
    this.document.addEventListener('keydown', this.documentKeydownListener, true);
  }

  private releaseKeyboardShortcuts(): void {
    this.document.removeEventListener('keydown', this.documentKeydownListener, true);
  }

  private releaseOverlay(): void {
    this.overlayState.release(this.overlayHandle);
    this.overlayHandle = undefined;
  }

  private previousIndex(): number {
    const steps = this.steps$();
    for (let index = this.currentStepIndex$() - 1; index >= 0; index -= 1) {
      if (steps[index]?.visible !== false) {
        return index;
      }
    }
    return -1;
  }

  private nextIndex(): number {
    const steps = this.steps$();
    for (let index = this.currentStepIndex$() + 1; index < steps.length; index += 1) {
      if (steps[index]?.visible !== false) {
        return index;
      }
    }
    return steps.length;
  }

  private clampIndex(index: number): number {
    const maxIndex = this.steps$().length - 1;
    if (maxIndex < 0) {
      return 0;
    }
    return Math.max(0, Math.min(Math.trunc(index), maxIndex));
  }

  private normalizeWizard(value: CxWizardDialogData | null | undefined): CxWizardDialogData {
    if (!value) {
      return EMPTY_WIZARD;
    }

    const steps: CxWizardDialogStep[] = Array.isArray(value.steps)
      ? value.steps
          .filter((step): step is CxWizardDialogStep => !!step && typeof step.id === 'string' && step.id.trim().length > 0)
          .map(step => ({
            ...step,
            id: step.id.trim(),
            name: step.name?.trim() || 'Step',
            title: step.title?.trim() || step.name?.trim() || 'Step',
            infoTitle: step.infoTitle?.trim() || step.name?.trim() || 'Step guidance',
            infoText: step.infoText?.trim() || '',
            status: step.status === 'success' ? 'success' as const : 'default' as const,
          }))
      : [];

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
