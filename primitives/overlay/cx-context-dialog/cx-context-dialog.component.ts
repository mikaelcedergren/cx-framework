import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
} from '@angular/core';
import { CxButtonComponent, type CxButtonMood } from '../../actions/cx-button';
import { isHostVisible } from '../../shared/host-visibility';

export type CxContextDialogMood = Extract<CxButtonMood, 'default' | 'warning' | 'danger'>;
export type CxContextDialogAlign = 'bottomLeft' | 'topLeft';

let cxContextDialogId = 0;

@Component({
  selector: 'cx-context-dialog',
  imports: [CxButtonComponent],
  templateUrl: './cx-context-dialog.component.html',
  styleUrl: './cx-context-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxContextDialogComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly instanceId = ++cxContextDialogId;

  @Input() heading = 'Confirm action';
  @Input() description = 'Review this before continuing.';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() mood: CxContextDialogMood = 'default';
  @Input() align: CxContextDialogAlign = 'bottomLeft';
  @Input() dismissible = false;

  @Output() readonly confirm = new EventEmitter<void>();
  @Output() readonly cancel = new EventEmitter<void>();

  protected readonly headingId = `cx-context-dialog-heading-${this.instanceId}`;
  protected readonly descriptionId = `cx-context-dialog-description-${this.instanceId}`;

  protected get hasHeading(): boolean {
    return this.heading.trim().length > 0;
  }

  protected get hasDescription(): boolean {
    return this.description.trim().length > 0;
  }

  protected get hasConfirmAction(): boolean {
    return this.confirmText.trim().length > 0;
  }

  protected get hasCancelAction(): boolean {
    return this.cancelText.trim().length > 0;
  }

  protected get hasActions(): boolean {
    return this.hasConfirmAction || this.hasCancelAction;
  }

  protected get actionOnlyAccessibleName(): string | null {
    if (this.hasHeading || this.hasDescription) {
      return null;
    }
    return this.meaningfulConfirmText || this.meaningfulCancelText || null;
  }

  protected onCancel(): void {
    this.cancel.emit();
  }

  protected onConfirm(): void {
    this.confirm.emit();
  }

  private get meaningfulConfirmText(): string {
    const text = this.confirmText.trim();
    return text.toLocaleLowerCase() === 'confirm' ? '' : text;
  }

  private get meaningfulCancelText(): string {
    const text = this.cancelText.trim();
    return text.toLocaleLowerCase() === 'cancel' ? '' : text;
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.dismissible || !isHostVisible(this.host.nativeElement)) {
      return;
    }

    const target = event.target;
    if (target instanceof Node && this.host.nativeElement.contains(target)) {
      return;
    }

    this.onCancel();
  }
}
