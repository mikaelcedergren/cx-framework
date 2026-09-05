import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  Output,
  computed,
  contentChild,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CxLabeledRowGroupComponent } from './cx-labeled-row-group.component';
import { CxLabeledRowInfoDirective } from './cx-labeled-row-info.directive';
import { CxValidationMessageComponent } from '../../primitives/feedback/cx-validation-message';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import { CxCheckboxComponent } from '../../primitives/inputs/cx-checkbox';
import {
  type CxFileUpload,
  CxFileUploadComponent,
  type CxFileUploadValue,
} from '../../primitives/inputs/cx-file-upload';
import { type CxIconName } from '../../icons/manifest';
import { CxTextFieldComponent } from '../../primitives/inputs/cx-text-field';
import { CxRadioComponent } from '../../primitives/inputs/cx-radio';
import { CxDropdownComponent, type CxDropdownOption } from '../../primitives/inputs/cx-dropdown';
import { CxSwitchComponent } from '../../primitives/inputs/cx-switch';
import { CxTextAreaComponent, type CxTextAreaSizing } from '../../primitives/inputs/cx-text-area';
import { type CxFieldValidation, normalizeCxValidation } from '../../primitives/inputs/shared/field.types';
import {
  CxDynamicFieldsComponent,
  type CxDynamicFieldOption,
  type CxDynamicFieldValue,
} from '../cx-dynamic-fields';
import { CxPopoverComponent } from '../../primitives/overlay/cx-popover';
import {
  CxFloatingSurfaceController,
  type CxFloatingSurfaceRequest,
  type CxFloatingSurfaceViewport,
} from '../../primitives/overlay/floating-surface-controller';
import { CxHostVisibilityObserver } from '../../primitives/shared/host-visibility';

const CX_LABELED_ROW_INFO_MAX_WIDTH = 320;
const CX_LABELED_ROW_INFO_MAX_HEIGHT = 320;
const CX_LABELED_ROW_INFO_ESTIMATED_WIDTH = 280;
const CX_LABELED_ROW_INFO_MIN_WIDTH = 220;
const CX_LABELED_ROW_INFO_ESTIMATED_HEIGHT = 240;
const CX_LABELED_ROW_INFO_VIEWPORT_PADDING = 8;
const CX_LABELED_ROW_INFO_GAP = 4;

let nextLabeledRowInfoId = 0;

export type CxLabeledRowRadioOption = {
  id: string;
  label: string;
};

export type CxLabeledRowSize = 'small' | 'default' | 'large';

export type CxLabeledRowContent =
  | {
      kind: 'text';
      text: string;
    }
  | {
      kind: 'input';
      value?: string;
      hint?: string;
      prependText?: string;
      appendText?: string;
      disabled?: boolean;
      validation?: CxFieldValidation;
    }
  | {
      kind: 'textarea';
      value?: string;
      hint?: string;
      minLines?: number;
      sizing?: CxTextAreaSizing;
      disabled?: boolean;
      validation?: CxFieldValidation;
    }
  | {
      kind: 'select';
      options: CxDropdownOption[];
      value?: string;
      values?: string[];
      placeholder?: string;
      searchable?: boolean;
      multiple?: boolean;
      disabled?: boolean;
      validation?: CxFieldValidation;
    }
  | {
      kind: 'radio-group';
      options: CxLabeledRowRadioOption[];
      value?: string;
      disabled?: boolean;
      validation?: CxFieldValidation;
    }
  | {
      kind: 'checkbox';
      label: string;
      checked?: boolean;
      disabled?: boolean;
      validation?: CxFieldValidation;
    }
  | {
      kind: 'switch';
      label: string;
      checked?: boolean;
      disabled?: boolean;
      validation?: CxFieldValidation;
    }
  | {
      kind: 'file-upload';
      files?: ReadonlyArray<CxFileUploadValue | File>;
      multiple?: boolean;
      buttonText?: string;
      buttonIcon?: CxIconName;
      disabled?: boolean;
    }
  | {
      kind: 'dynamic-fields';
      options: CxDynamicFieldOption[];
      fields?: CxDynamicFieldValue[];
      disabled?: boolean;
    };

@Component({
  selector: 'cx-labeled-row',
  imports: [
    CommonModule,
    CxValidationMessageComponent,
    CxIconButtonComponent,
    CxCheckboxComponent,
    CxDynamicFieldsComponent,
    CxFileUploadComponent,
    CxTextFieldComponent,
    CxRadioComponent,
    CxDropdownComponent,
    CxSwitchComponent,
    CxTextAreaComponent,
    CxPopoverComponent,
  ],
  templateUrl: './cx-labeled-row.component.html',
  styleUrl: './cx-labeled-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxLabeledRowComponent implements OnDestroy {
  private readonly radioValueState = signal<string | undefined>(undefined);
  private readonly hostElement: HTMLElement = inject(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly group = inject(CxLabeledRowGroupComponent, { optional: true });
  private readonly infoContent = contentChild(CxLabeledRowInfoDirective);
  private readonly infoTriggerRef = viewChild<ElementRef<HTMLElement>>('infoTrigger');
  private readonly infoPopoverRef = viewChild<CxPopoverComponent>('infoPopover');
  private readonly infoSurfaceFocusRef = viewChild<ElementRef<HTMLElement>>('infoSurfaceFocus');
  private readonly infoOpenState = signal(false);
  private readonly hostVisibility = new CxHostVisibilityObserver(this.hostElement, visible => {
    if (!visible && this.infoOpenState()) {
      this.closeInfoPopover();
    }
  });
  private infoFocusTimer?: number;
  private infoOpenTracking = false;

  protected readonly infoPopoverId = `cx-labeled-row-info-${++nextLabeledRowInfoId}`;
  protected readonly infoPopoverMaxWidth = CX_LABELED_ROW_INFO_MAX_WIDTH;
  protected readonly infoOpen = this.infoOpenState.asReadonly();
  protected readonly hasInfoContent = computed(
    () => this.infoContent()?.hasVisibleContent() ?? false,
  );
  protected readonly infoOverlay = new CxFloatingSurfaceController(
    (rect, viewport) => this.measureInfoOverlay(rect, viewport),
    () => this.infoPopoverRef()?.surfaceElement(),
  );

  constructor() {
    effect(() => {
      if (this.infoOpenState() && !this.hasInfoContent()) {
        this.closeInfoPopover();
      }
    });
  }

  /** A row placed directly in a cx-labeled-row-group defers its label column to the group. */
  @HostBinding('class.cx-labeled-row--grouped')
  protected get grouped(): boolean {
    const parent = this.hostElement.parentElement;
    return parent !== null && (this.group?.isGridElement(parent) ?? false);
  }

  @Input() label = 'Label';
  @Input() size: CxLabeledRowSize = 'default';
  @Input() optional = false;

  protected get hasLabel(): boolean {
    return this.label.trim().length > 0;
  }

  @Input()
  public set content(value: CxLabeledRowContent) {
    this.contentInputBound = true;
    this.contentState = value;
    if (value.kind === 'radio-group') {
      this.radioValueState.set(value.value);
    }
  }

  public get content(): CxLabeledRowContent {
    return this.contentState;
  }

  @Output() readonly inputValueChange = new EventEmitter<string>();
  @Output() readonly selectValueChange = new EventEmitter<string | undefined>();
  @Output() readonly selectValuesChange = new EventEmitter<string[]>();
  @Output() readonly radioValueChange = new EventEmitter<string>();
  @Output() readonly checkboxCheckedChange = new EventEmitter<boolean>();
  @Output() readonly switchCheckedChange = new EventEmitter<boolean>();
  @Output() readonly fileUploadChange = new EventEmitter<CxFileUpload>();
  @Output() readonly dynamicFieldsChange = new EventEmitter<CxDynamicFieldValue[]>();

  protected contentInputBound = false;
  protected contentState: CxLabeledRowContent = {
    kind: 'text',
    text: 'Paste chaos here',
  };

  public ngOnDestroy(): void {
    this.stopInfoTracking();
    this.infoOverlay.destroy();
    this.clearInfoFocusTimer();
  }

  protected get infoAriaLabel(): string {
    const label = this.label.trim();
    return label ? `More information about ${label}` : 'More information';
  }

  protected get infoTriggerElement(): HTMLElement | undefined {
    return this.infoTriggerRef()?.nativeElement;
  }

  protected toggleInfoPopover(): void {
    if (this.infoOpenState()) {
      this.closeInfoPopover();
      return;
    }
    if (!this.hasInfoContent()) {
      return;
    }
    const trigger = this.infoTriggerRef()?.nativeElement;
    if (!trigger) {
      return;
    }

    this.infoOverlay.endSession();
    this.infoOverlay.sync(trigger);
    this.infoOpenState.set(true);
    this.startInfoTracking();
    this.scheduleInfoSurfaceFocus();
  }

  protected closeInfoPopover(): void {
    if (!this.infoOpenState()) {
      return;
    }
    this.clearInfoFocusTimer();
    this.infoOpenState.set(false);
    this.stopInfoTracking();
    this.infoOverlay.endSession();
  }

  protected onInputValueChange(value: string): void {
    this.inputValueChange.emit(value);
  }

  protected onSelectValueChange(value: string | undefined): void {
    this.selectValueChange.emit(value);
  }

  protected onSelectValuesChange(value: string[]): void {
    this.selectValuesChange.emit(value);
  }

  protected onRadioSelect(value: string): void {
    this.radioValueState.set(value);
    this.radioValueChange.emit(value);
  }

  protected onCheckboxCheckedChange(value: boolean): void {
    this.checkboxCheckedChange.emit(value);
  }

  protected onSwitchCheckedChange(value: boolean): void {
    this.switchCheckedChange.emit(value);
  }

  protected onFileUpload(value: CxFileUpload): void {
    this.fileUploadChange.emit(value);
  }

  protected onDynamicFieldsChange(value: CxDynamicFieldValue[]): void {
    this.dynamicFieldsChange.emit(value);
  }

  protected isRadioSelected(optionId: string): boolean {
    return this.radioValueState() === optionId;
  }

  protected validationMessages(validation: CxFieldValidation | null | undefined) {
    return normalizeCxValidation(validation);
  }

  private measureInfoOverlay(
    _rect: DOMRect,
    viewport: CxFloatingSurfaceViewport,
  ): CxFloatingSurfaceRequest {
    const viewportWidth = Math.max(
      viewport.width - CX_LABELED_ROW_INFO_VIEWPORT_PADDING * 2,
      0,
    );
    const viewportHeight = Math.max(
      viewport.height - CX_LABELED_ROW_INFO_VIEWPORT_PADDING * 2,
      0,
    );
    const estimatedWidth = Math.min(CX_LABELED_ROW_INFO_ESTIMATED_WIDTH, viewportWidth);
    return {
      width: estimatedWidth,
      minWidth: Math.min(CX_LABELED_ROW_INFO_MIN_WIDTH, viewportWidth),
      estimatedHeight: Math.min(CX_LABELED_ROW_INFO_ESTIMATED_HEIGHT, viewportHeight),
      align: 'start',
      viewportPadding: CX_LABELED_ROW_INFO_VIEWPORT_PADDING,
      gap: CX_LABELED_ROW_INFO_GAP,
      maxHeightCap: Math.min(CX_LABELED_ROW_INFO_MAX_HEIGHT, viewportHeight),
    };
  }

  private scheduleInfoSurfaceFocus(): void {
    const windowRef = this.document.defaultView;
    if (!windowRef) {
      return;
    }
    this.clearInfoFocusTimer();
    this.infoFocusTimer = windowRef.setTimeout(() => {
      this.infoFocusTimer = undefined;
      this.infoOverlay.sync();
      this.infoSurfaceFocusRef()?.nativeElement.focus({ preventScroll: true });
    });
  }

  private clearInfoFocusTimer(): void {
    const windowRef = this.document.defaultView;
    if (windowRef && this.infoFocusTimer !== undefined) {
      windowRef.clearTimeout(this.infoFocusTimer);
    }
    this.infoFocusTimer = undefined;
  }

  private startInfoTracking(): void {
    if (this.infoOpenTracking) {
      return;
    }
    this.infoOpenTracking = true;
    this.hostVisibility.start();
    this.document.addEventListener('scroll', this.onCapturedDocumentScroll, true);
    this.document.defaultView?.addEventListener('resize', this.onWindowResize);
    this.infoOverlay.observeTrigger(this.infoTriggerRef()?.nativeElement, () => {
      if (this.hostVisibility.check()) {
        this.infoOverlay.sync();
      }
    });
  }

  private stopInfoTracking(): void {
    this.hostVisibility.stop();
    if (!this.infoOpenTracking) {
      return;
    }
    this.infoOpenTracking = false;
    this.document.removeEventListener('scroll', this.onCapturedDocumentScroll, true);
    this.document.defaultView?.removeEventListener('resize', this.onWindowResize);
    this.infoOverlay.stopObservingTrigger();
  }

  private readonly onCapturedDocumentScroll = (event: Event): void => {
    if (!this.infoOpenState() || !this.hostVisibility.check()) {
      return;
    }
    const target = event.target;
    if (target instanceof Node && this.infoPopoverRef()?.surfaceElement()?.contains(target)) {
      return;
    }
    this.infoOverlay.sync();
  };

  private readonly onWindowResize = (): void => {
    if (this.infoOpenState() && this.hostVisibility.check()) {
      this.infoOverlay.sync();
    }
  };
}
