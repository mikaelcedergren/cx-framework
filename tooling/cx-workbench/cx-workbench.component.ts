import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { CxSelectComponent, type CxSelectOption } from '../../primitives/inputs/cx-select';

export type CxWorkbenchAlign = 'top' | 'center' | 'bottom';
export type CxWorkbenchMinSize = 'none' | 'small' | 'medium' | 'large';
export type CxWorkbenchPreviewWidth = 'auto' | 'small' | 'medium' | 'large' | 'full';

@Component({
  selector: 'cx-workbench',
  imports: [CxSelectComponent],
  templateUrl: './cx-workbench.component.html',
  styleUrl: './cx-workbench.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxWorkbenchComponent {
  protected readonly align$ = signal<CxWorkbenchAlign>('center');
  protected readonly minSize$ = signal<CxWorkbenchMinSize>('none');
  protected readonly previewWidth$ = signal<CxWorkbenchPreviewWidth>('auto');

  protected readonly alignOptions: CxSelectOption[] = [
    { id: 'top', label: 'top' },
    { id: 'center', label: 'center' },
    { id: 'bottom', label: 'bottom' },
  ];

  protected readonly minSizeOptions: CxSelectOption[] = [
    { id: 'none', label: 'none' },
    { id: 'small', label: 'small' },
    { id: 'medium', label: 'medium' },
    { id: 'large', label: 'large' },
  ];

  protected readonly previewWidthOptions: CxSelectOption[] = [
    { id: 'auto', label: 'auto' },
    { id: 'small', label: 'small' },
    { id: 'medium', label: 'medium' },
    { id: 'large', label: 'large' },
    { id: 'full', label: 'full' },
  ];

  @Input()
  public set align(value: CxWorkbenchAlign | undefined) {
    if (value === 'top' || value === 'center' || value === 'bottom') {
      this.align$.set(value);
    }
  }

  @Input()
  public set minSize(value: CxWorkbenchMinSize | boolean | '' | undefined) {
    this.minSize$.set(this.normalizeMinSize(value));
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

  protected onMinSizeChange(value: string | undefined): void {
    this.minSize$.set(this.normalizeMinSize(value));
  }

  protected onPreviewWidthChange(value: string | undefined): void {
    this.previewWidth$.set(this.normalizePreviewWidth(value));
  }

  private normalizeMinSize(value: CxWorkbenchMinSize | boolean | string | undefined): CxWorkbenchMinSize {
    if (value === true || value === '') return 'small';
    if (value === 'small' || value === 'medium' || value === 'large') return value;
    return 'none';
  }

  private normalizePreviewWidth(value: CxWorkbenchPreviewWidth | string | undefined): CxWorkbenchPreviewWidth {
    if (value === 'small' || value === 'medium' || value === 'large' || value === 'full') return value;
    return 'auto';
  }
}
