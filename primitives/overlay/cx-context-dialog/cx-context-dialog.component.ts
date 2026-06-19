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

export type CxContextDialogMood = Extract<CxButtonMood, 'default' | 'warning' | 'danger'>;
export type CxContextDialogAlign = 'bottomLeft' | 'topLeft';

@Component({
  selector: 'cx-context-dialog',
  imports: [CxButtonComponent],
  templateUrl: './cx-context-dialog.component.html',
  styleUrl: './cx-context-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxContextDialogComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  @Input() heading = 'Delete scan target';
  @Input() text = 'This removes the target from the scan. The finding backlog will find a new hobby.';
  @Input() confirmText = 'Delete target';
  @Input() cancelText = 'Cancel';
  @Input() mood: CxContextDialogMood = 'danger';
  @Input() align: CxContextDialogAlign = 'bottomLeft';
  @Input() dismissible = false;

  @Output() readonly confirm = new EventEmitter<void>();
  @Output() readonly cancel = new EventEmitter<void>();

  protected onCancel(): void {
    this.cancel.emit();
  }

  protected onConfirm(): void {
    this.confirm.emit();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.dismissible) {
      return;
    }

    const target = event.target;
    if (target instanceof Node && this.host.nativeElement.contains(target)) {
      return;
    }

    this.onCancel();
  }
}
