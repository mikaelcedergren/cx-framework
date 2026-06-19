import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { getCxIcon, type CxIconName } from '../../../icons/manifest';

export type CxIconSize = '12' | '14' | '16' | '20' | '24' | '32' | '64' | 'auto';
export type CxIconMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
export type CxIconShape =
  | 'none'
  | 'square-subtle'
  | 'square-solid'
  | 'square-outline'
  | 'circle-subtle'
  | 'circle-solid'
  | 'circle-outline';

const CX_ICON_SIZES = new Set<CxIconSize>(['12', '14', '16', '20', '24', '32', '64', 'auto']);

@Component({
  selector: 'cx-icon',
  host: {
    '[style.--cx-icon-size]': 'resolvedSize',
    '[class.cx-icon--size-12]': 'resolvedSizeClass === "12"',
    '[class.cx-icon--size-14]': 'resolvedSizeClass === "14"',
    '[class.cx-icon--size-16]': 'resolvedSizeClass === "16"',
    '[class.cx-icon--size-20]': 'resolvedSizeClass === "20"',
    '[class.cx-icon--size-24]': 'resolvedSizeClass === "24"',
    '[class.cx-icon--size-32]': 'resolvedSizeClass === "32"',
    '[class.cx-icon--size-64]': 'resolvedSizeClass === "64"',
    '[class.cx-icon--size-auto]': 'resolvedSizeClass === "auto"',
    '[class.cx-icon--spinner]': 'name === "spinner"',
    '[class.cx-icon--shaped]': 'resolvedShape !== "none"',
    '[class.cx-icon--square]': 'resolvedShape.startsWith("square")',
    '[class.cx-icon--circle]': 'resolvedShape.startsWith("circle")',
    '[class.cx-icon--subtle]': 'resolvedShape.endsWith("subtle")',
    '[class.cx-icon--solid]': 'resolvedShape.endsWith("solid") || resolvedShape.endsWith("outline")',
    '[class.cx-icon--outline]': 'resolvedShape.endsWith("outline")',
    '[class.cx-icon--mood-primary]': 'resolvedMood === "primary"',
    '[class.cx-icon--mood-accent]': 'resolvedMood === "accent"',
    '[class.cx-icon--mood-info]': 'resolvedMood === "info"',
    '[class.cx-icon--mood-success]': 'resolvedMood === "success"',
    '[class.cx-icon--mood-warning]': 'resolvedMood === "warning"',
    '[class.cx-icon--mood-danger]': 'resolvedMood === "danger"',
  },
  templateUrl: './cx-icon.component.html',
  styleUrl: './cx-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxIconComponent {
  private sizeValue: CxIconSize | number | string | undefined = '16';
  private moodValue: CxIconMood = 'default';
  private shapeValue: CxIconShape = 'none';

  @Input() name: CxIconName | undefined;

  @Input()
  public set size(value: CxIconSize | number | string | undefined) {
    this.sizeValue = value ?? '16';
  }

  public get size(): CxIconSize | number | string | undefined {
    return this.sizeValue;
  }

  @Input()
  public set mood(value: CxIconMood | undefined) {
    this.moodValue = value ?? 'default';
  }

  public get mood(): CxIconMood {
    return this.moodValue;
  }

  @Input()
  public set shape(value: CxIconShape | undefined) {
    this.shapeValue = value ?? 'none';
  }

  public get shape(): CxIconShape {
    return this.shapeValue;
  }

  protected get iconDef() {
    return getCxIcon(this.name);
  }

  protected get resolvedSize(): string {
    const value = this.sizeValue;
    if (this.resolvedSizeClass === 'auto') {
      return '100%';
    }
    if (value === undefined || value === null || value === '') {
      return '16px';
    }
    if (typeof value === 'number') {
      return `${value}px`;
    }
    const trimmed = value.trim();
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      return `${trimmed}px`;
    }
    return /^(?:\d+(\.\d+)?)(px|rem|em|%)$/.test(trimmed) ? trimmed : '16px';
  }

  protected get resolvedSizeClass(): CxIconSize | 'custom' {
    const value = this.sizeValue;
    if (value === undefined || value === null || value === '') {
      return '16';
    }
    const normalized = typeof value === 'number' ? String(value) : value.trim();
    return this.isIconSize(normalized) ? normalized : 'custom';
  }

  protected get resolvedMood(): CxIconMood {
    return this.mood;
  }

  protected get resolvedShape(): CxIconShape {
    return this.shape;
  }

  private isIconSize(value: string): value is CxIconSize {
    return CX_ICON_SIZES.has(value as CxIconSize);
  }
}
