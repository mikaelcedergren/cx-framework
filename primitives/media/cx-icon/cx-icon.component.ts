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

type CxIconSizeInput = CxIconSize | number | string | undefined;
type CxIconSizeClass = CxIconSize | 'custom';

const DEFAULT_ICON_SIZE: CxIconSize = '16';
const CX_ICON_SIZES = new Set<CxIconSize>(['12', '14', '16', '20', '24', '32', '64', 'auto']);
const CSS_NUMBER_PATTERN = /^\d+(?:\.\d+)?$/;
const CSS_LENGTH_PATTERN = /^\d+(?:\.\d+)?(?:px|rem|em|%)$/;

function resolveIconSize(value: Exclude<CxIconSizeInput, undefined>): {
  cssValue: string;
  sizeClass: CxIconSizeClass;
} {
  const normalized = typeof value === 'number'
    ? (Number.isFinite(value) ? String(value) : '')
    : value.trim();

  if (normalized === 'auto') {
    return { cssValue: '100%', sizeClass: 'auto' };
  }

  if (CSS_NUMBER_PATTERN.test(normalized)) {
    return {
      cssValue: `${normalized}px`,
      sizeClass: CX_ICON_SIZES.has(normalized as CxIconSize)
        ? normalized as CxIconSize
        : 'custom',
    };
  }

  if (CSS_LENGTH_PATTERN.test(normalized)) {
    return { cssValue: normalized, sizeClass: 'custom' };
  }

  return { cssValue: `${DEFAULT_ICON_SIZE}px`, sizeClass: DEFAULT_ICON_SIZE };
}

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
    '[class.cx-icon--spinner]': 'icon === "spinner"',
    '[class.cx-icon--shaped]': 'shape !== "none"',
    '[class.cx-icon--square]': 'shape.startsWith("square")',
    '[class.cx-icon--circle]': 'shape.startsWith("circle")',
    '[class.cx-icon--subtle]': 'shape.endsWith("subtle")',
    '[class.cx-icon--solid]': 'shape.endsWith("solid") || shape.endsWith("outline")',
    '[class.cx-icon--outline]': 'shape.endsWith("outline")',
    '[class.cx-icon--mood-primary]': 'mood === "primary"',
    '[class.cx-icon--mood-accent]': 'mood === "accent"',
    '[class.cx-icon--mood-info]': 'mood === "info"',
    '[class.cx-icon--mood-success]': 'mood === "success"',
    '[class.cx-icon--mood-warning]': 'mood === "warning"',
    '[class.cx-icon--mood-danger]': 'mood === "danger"',
  },
  templateUrl: './cx-icon.component.html',
  styleUrl: './cx-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxIconComponent {
  private sizeValue: CxIconSizeInput = DEFAULT_ICON_SIZE;
  private moodValue: CxIconMood = 'default';
  private shapeValue: CxIconShape = 'none';

  protected resolvedSize = `${DEFAULT_ICON_SIZE}px`;
  protected resolvedSizeClass: CxIconSizeClass = DEFAULT_ICON_SIZE;

  @Input() icon: CxIconName | undefined;

  @Input()
  public set size(value: CxIconSizeInput) {
    this.sizeValue = value ?? DEFAULT_ICON_SIZE;
    const resolved = resolveIconSize(this.sizeValue);
    this.resolvedSize = resolved.cssValue;
    this.resolvedSizeClass = resolved.sizeClass;
  }

  public get size(): CxIconSizeInput {
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

  protected get iconDefinition() {
    return getCxIcon(this.icon);
  }
}
