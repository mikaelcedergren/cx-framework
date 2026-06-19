import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { CxIconComponent } from '../../media/cx-icon';
import {
  type CxFieldSize,
  type CxValidationMessage,
  normalizeCxValidationMessages,
} from '../../inputs/shared/field.types';
import { CxQueryElementComponent, type CxQueryElementData } from '../cx-query-element';

export type CxQueryFieldSize = CxFieldSize;
export type CxQueryFieldSegment = CxQueryElementData & { id: string };

let cxQueryFieldId = 0;

@Component({
  selector: 'cx-query-field',
  imports: [
    CxIconButtonComponent,
    CxIconComponent,
    CxQueryElementComponent,
    CxSpinnerComponent,
    CxValidationMessageComponent,
  ],
  templateUrl: './cx-query-field.component.html',
  styleUrl: './cx-query-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxQueryFieldComponent {
  private readonly segmentsState = signal<readonly CxQueryFieldSegment[]>([]);
  private readonly focusedIndexState = signal<number | undefined>(undefined);
  private readonly validationMessagesState = signal<ReadonlyArray<CxValidationMessage>>([]);

  protected readonly labelId = `cx-query-field-label-${++cxQueryFieldId}`;
  protected readonly messagesId = `cx-query-field-messages-${cxQueryFieldId}`;

  @Input() label = 'Filters';
  @Input() hint: string | undefined;
  @Input() optional = false;
  @Input() size: CxQueryFieldSize = 'default';
  @Input() disabled = false;
  @Input() readOnly = false;
  @Input() loading = false;
  @Input() clearable = false;
  @Input() ariaLabel: string | undefined;
  @Input() ariaDescribedBy: string | undefined;

  @Input()
  public set query(value: readonly CxQueryFieldSegment[] | null | undefined) {
    this.segmentsState.set(value ?? []);
    if ((value?.length ?? 0) === 0) {
      this.focusedIndexState.set(undefined);
    }
  }

  @Input()
  public set validationMessages(value: ReadonlyArray<CxValidationMessage> | null | undefined) {
    this.validationMessagesState.set(normalizeCxValidationMessages(value));
  }

  @Output() readonly queryChange = new EventEmitter<readonly CxQueryFieldSegment[]>();

  protected readonly segments$ = this.segmentsState.asReadonly();
  protected readonly validationMessages$ = computed(() => {
    if (this.disabled) {
      return [];
    }
    return [...this.validationMessagesState()];
  });
  protected readonly hasError$ = computed(() => this.validationMessages$().some(message => message.type === 'error'));
  protected readonly showHint$ = computed(() => !!this.hint?.trim() && this.validationMessages$().length === 0);
  protected readonly hasSegments$ = computed(() => this.segmentsState().length > 0);

  protected resolvedAriaLabelledBy(): string | null {
    return this.label.trim() ? this.labelId : null;
  }

  protected resolvedAriaDescribedBy(): string | null {
    const ids = [
      this.ariaDescribedBy,
      this.showHint$() || this.validationMessages$().length > 0 ? this.messagesId : undefined,
    ].filter((id): id is string => !!id);
    return ids.length > 0 ? ids.join(' ') : null;
  }

  protected isLocked(): boolean {
    return this.disabled || this.readOnly || this.loading;
  }

  protected segmentData(segment: CxQueryFieldSegment, index: number): CxQueryElementData {
    return { ...segment, focused: this.focusedIndexState() === index || segment.focused };
  }

  protected onSegmentPressed(index: number): void {
    if (this.isLocked()) {
      return;
    }
    this.focusedIndexState.set(index);
  }

  protected onContainerClick(): void {
    if (this.isLocked()) {
      return;
    }
    const segments = this.segmentsState();
    const index = Math.max(segments.length - 1, 0);
    this.focusedIndexState.set(segments.length > 0 ? index : undefined);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.isLocked()) {
      return;
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const segments = this.segmentsState();
      if (segments.length === 0) {
        return;
      }
      const current = this.focusedIndexState() ?? 0;
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const next = (current + delta + segments.length) % segments.length;
      this.focusedIndexState.set(next);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.queryChange.emit(this.segmentsState());
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.focusedIndexState.set(undefined);
    }
  }

  protected onClear(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isLocked() || !this.clearable) {
      return;
    }
    this.segmentsState.set([]);
    this.focusedIndexState.set(undefined);
    this.queryChange.emit([]);
  }
}
