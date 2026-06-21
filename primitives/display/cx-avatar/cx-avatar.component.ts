import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { CxBadgeComponent } from '../cx-badge';
import { CxIconComponent } from '../../media/cx-icon';

export type CxAvatarSize = 'small' | 'default' | 'large';
export type CxAvatarColor =
  | 'auto'
  | 'blue'
  | 'cyan'
  | 'lime'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'tangerine'
  | 'red'
  | 'pink'
  | 'purple'
  | 'violet';

export interface CxAvatarBadge {
  count?: number;
}

const AVATAR_COLORS: readonly Exclude<CxAvatarColor, 'auto'>[] = [
  'blue',
  'cyan',
  'lime',
  'green',
  'yellow',
  'orange',
  'tangerine',
  'red',
  'pink',
  'purple',
  'violet',
];

@Component({
  selector: 'cx-avatar',
  imports: [CxBadgeComponent, CxIconComponent],
  templateUrl: './cx-avatar.component.html',
  styleUrl: './cx-avatar.component.scss',
  host: {
    '[class.cx-avatar-host--small]': 'size === "small"',
    '[class.cx-avatar-host--default]': 'size === "default"',
    '[class.cx-avatar-host--large]': 'size === "large"',
    '[class.cx-avatar-host--blue]': 'resolvedColor() === "blue"',
    '[class.cx-avatar-host--cyan]': 'resolvedColor() === "cyan"',
    '[class.cx-avatar-host--lime]': 'resolvedColor() === "lime"',
    '[class.cx-avatar-host--green]': 'resolvedColor() === "green"',
    '[class.cx-avatar-host--yellow]': 'resolvedColor() === "yellow"',
    '[class.cx-avatar-host--orange]': 'resolvedColor() === "orange"',
    '[class.cx-avatar-host--tangerine]': 'resolvedColor() === "tangerine"',
    '[class.cx-avatar-host--red]': 'resolvedColor() === "red"',
    '[class.cx-avatar-host--pink]': 'resolvedColor() === "pink"',
    '[class.cx-avatar-host--purple]': 'resolvedColor() === "purple"',
    '[class.cx-avatar-host--violet]': 'resolvedColor() === "violet"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxAvatarComponent {
  private readonly imageFailed = signal(false);
  private srcValue: string | undefined;
  private sizeValue: CxAvatarSize = 'default';
  private colorValue: CxAvatarColor = 'auto';
  private ariaLabelValue: string | undefined;

  @Input() name = '';
  @Input() badge: CxAvatarBadge | undefined;

  @Input()
  public set src(value: string | undefined) {
    this.srcValue = value || undefined;
    this.imageFailed.set(false);
  }

  public get src(): string | undefined {
    return this.srcValue;
  }

  @Input()
  public set size(value: CxAvatarSize | undefined) {
    this.sizeValue = value ?? 'default';
  }

  public get size(): CxAvatarSize {
    return this.sizeValue;
  }

  @Input()
  public set color(value: CxAvatarColor | undefined) {
    this.colorValue = value ?? 'auto';
  }

  public get color(): CxAvatarColor {
    return this.colorValue;
  }

  @Input()
  public set ariaLabel(value: string | undefined) {
    this.ariaLabelValue = value || undefined;
  }

  public get ariaLabel(): string | undefined {
    return this.ariaLabelValue;
  }

  protected resolvedColor(): Exclude<CxAvatarColor, 'auto'> {
    if (this.color !== 'auto') {
      return this.color;
    }
    return AVATAR_COLORS[this.nameHash() % AVATAR_COLORS.length];
  }

  protected initials(): string | undefined {
    const parts = this.name.trim().split(/[\s-]+/).filter(Boolean);
    if (!parts.length) return undefined;
    if (parts.length === 1) return this.firstInitial(parts[0]);
    const first = this.firstInitial(parts[0]);
    const last = this.firstInitial(parts[parts.length - 1]);
    return first && last ? `${first}${last}` : (first ?? last);
  }

  protected showImage(): boolean {
    return !!this.src && !this.imageFailed();
  }

  protected badgeVisible(): boolean {
    return this.badge !== undefined;
  }

  protected badgeCount(): number | undefined {
    return this.badge?.count;
  }

  protected onImageError(): void {
    this.imageFailed.set(true);
  }

  private nameHash(): number {
    const name = this.name.trim();
    if (!name) return 0;
    return Array.from(name).reduce((hash, char) => hash + (char.codePointAt(0) ?? 0), 0);
  }

  private firstInitial(value: string): string | undefined {
    return Array.from(value.trim()).find(char => /\p{L}|\p{N}/u.test(char))?.toUpperCase();
  }
}
