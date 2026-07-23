import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import { CxDropdownComponent, type CxDropdownOption } from '../../primitives/inputs/cx-dropdown';

export type CxWorkbenchAlign = 'top' | 'center' | 'bottom';
export type CxWorkbenchPreviewHeight = 'auto' | 'small' | 'medium' | 'large';
export type CxWorkbenchPreviewWidth = 'auto' | 'small' | 'medium' | 'large' | 'full';

@Component({
  selector: 'cx-workbench',
  imports: [CxDropdownComponent],
  templateUrl: './cx-workbench.component.html',
  styleUrl: './cx-workbench.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxWorkbenchComponent {
  protected readonly align$ = signal<CxWorkbenchAlign>('center');
  protected readonly previewHeight$ = signal<CxWorkbenchPreviewHeight>('auto');
  protected readonly previewWidth$ = signal<CxWorkbenchPreviewWidth>('auto');

  protected readonly alignOptions: CxDropdownOption[] = [
    { id: 'top', label: 'top' },
    { id: 'center', label: 'center' },
    { id: 'bottom', label: 'bottom' },
  ];

  protected readonly previewHeightOptions: CxDropdownOption[] = [
    { id: 'auto', label: 'auto' },
    { id: 'small', label: 'small' },
    { id: 'medium', label: 'medium' },
    { id: 'large', label: 'large' },
  ];

  protected readonly previewWidthOptions: CxDropdownOption[] = [
    { id: 'auto', label: 'auto' },
    { id: 'small', label: 'small' },
    { id: 'medium', label: 'medium' },
    { id: 'large', label: 'large' },
    { id: 'full', label: 'full' },
  ];

  @Input({ transform: booleanAttribute }) showPreviewHeightControl = true;
  @Input({ transform: booleanAttribute }) showPreviewWidthControl = true;
  @Input({ transform: booleanAttribute }) showAlignControl = true;

  @Input()
  public set align(value: CxWorkbenchAlign | undefined) {
    if (value === 'top' || value === 'center' || value === 'bottom') {
      this.align$.set(value);
    }
  }

  @Input()
  public set previewHeight(value: CxWorkbenchPreviewHeight | undefined) {
    this.previewHeight$.set(this.normalizePreviewHeight(value));
  }

  @Input()
  public set previewWidth(value: CxWorkbenchPreviewWidth | undefined) {
    this.previewWidth$.set(this.normalizePreviewWidth(value));
  }

  protected onAlignChange(value: string | undefined): void {
    if (value === 'top' || value === 'center' || value === 'bottom') {
      this.align$.set(value);
    }
  }

  protected onPreviewHeightChange(value: string | undefined): void {
    this.previewHeight$.set(this.normalizePreviewHeight(value));
  }

  protected onPreviewWidthChange(value: string | undefined): void {
    this.previewWidth$.set(this.normalizePreviewWidth(value));
  }

  private normalizePreviewHeight(value: CxWorkbenchPreviewHeight | string | undefined): CxWorkbenchPreviewHeight {
    if (value === 'small' || value === 'medium' || value === 'large') return value;
    return 'auto';
  }

  private normalizePreviewWidth(value: CxWorkbenchPreviewWidth | string | undefined): CxWorkbenchPreviewWidth {
    if (value === 'small' || value === 'medium' || value === 'large' || value === 'full') return value;
    return 'auto';
  }
}
