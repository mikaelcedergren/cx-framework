import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'cx-page-header',
  templateUrl: './cx-page-header.component.html',
  styleUrl: './cx-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxPageHeaderComponent {
  @Input() heading = 'Page title';
  @Input() description = '';
  // Cortex-only: Luma uses this as a quiet inline page-note editor.
  @Input() editableDescription = false;
  @Output() descriptionChange = new EventEmitter<string>();

  commitDescription(next: string): void {
    const trimmed = next.trim();
    if (trimmed !== this.description.trim()) {
      this.descriptionChange.emit(trimmed);
    }
  }
}
