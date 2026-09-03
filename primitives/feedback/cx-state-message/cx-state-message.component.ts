import { isPlatformBrowser } from '@angular/common';
import {
  type AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxButtonComponent, type CxButtonMood } from '../../actions/cx-button';
import { type CxFeedbackAction, visibleCxFeedbackAction } from '../cx-feedback-action';
import { CxSpinnerComponent } from '../cx-spinner';
import { CxIconComponent } from '../../media/cx-icon';

export type CxStateMessageState = 'default' | 'pending' | 'success' | 'scheduled' | 'danger';
export type CxStateMessageVisual = 'icon' | 'none';
export type CxStateMessageLayout = 'vertical' | 'horizontal';

/** A state message answers with solid buttons; transparency is not one of its choices. */
export type CxStateMessageAction = Omit<CxFeedbackAction, 'transparent'>;

const CX_STATE_MESSAGE_PRESETS: Record<Exclude<CxStateMessageState, 'default'>, {
  heading: string;
  description: string;
  icon: CxIconName;
}> = {
  pending: {
    heading: 'Working on it',
    description: "Hold tight while we get this ready. We'll let you know when it's done.",
    icon: 'spinner',
  },
  success: {
    heading: 'All done',
    description: 'Everything went through. You can move on to the next step.',
    icon: 'check',
  },
  scheduled: {
    heading: 'Scheduled',
    description: 'This will run automatically at the scheduled time. You can cancel it if plans change.',
    icon: 'schedule',
  },
  danger: {
    heading: 'Something went wrong',
    description: 'Try again, or reach out to support if it keeps happening.',
    icon: 'error',
  },
};

const CX_STATE_MESSAGE_STATE_ACTIONS: Partial<Record<CxStateMessageState, CxStateMessageAction>> = {
  success: { text: 'Continue' },
  danger: { text: 'Try again' },
};

@Component({
  selector: 'cx-state-message',
  imports: [CxButtonComponent, CxIconComponent, CxSpinnerComponent],
  templateUrl: './cx-state-message.component.html',
  styleUrl: './cx-state-message.component.scss',
  host: {
    role: 'status',
    '[class.cx-state-message-host--success]': 'state === "success"',
    '[class.cx-state-message-host--scheduled]': 'state === "scheduled"',
    '[class.cx-state-message-host--danger]': 'state === "danger"',
    '[attr.title]': 'null',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxStateMessageComponent implements AfterViewChecked {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private measuredRegion: HTMLElement | undefined;
  private measuredOffset: number | undefined;

  @ViewChild('messageBody', { read: ElementRef })
  private messageBodyRef?: ElementRef<HTMLElement>;

  @ViewChild('iconRegion', { read: ElementRef })
  private iconRegionRef?: ElementRef<HTMLElement>;

  @Input() heading = '';
  @Input() description: string | undefined;
  @Input() action: CxStateMessageAction | undefined;
  @Input() secondaryAction: CxStateMessageAction | undefined;
  @Input() state: CxStateMessageState = 'default';
  @Input() visual: CxStateMessageVisual = 'icon';
  @Input() layout: CxStateMessageLayout = 'vertical';
  @Input() icon: CxIconName | undefined;

  @Output('action') readonly actionEmitter = new EventEmitter<CxStateMessageAction>();
  @Output('secondaryAction') readonly secondaryActionEmitter = new EventEmitter<CxStateMessageAction>();

  public ngAfterViewChecked(): void {
    this.syncIconInkOffset();
  }

  /** The state carries the mark that matches it; an icon of the consumer's own always wins. */
  protected get resolvedIcon(): CxIconName {
    return this.icon ?? this.resolvedPreset?.icon ?? 'placeholder';
  }

  protected get resolvedHeading(): string {
    const heading = this.heading.trim();
    if (heading) {
      return heading;
    }
    const preset = this.resolvedPreset;
    return preset?.heading ?? '';
  }

  protected get resolvedDescription(): string {
    const description = this.description?.trim();
    if (description) {
      return description;
    }
    const preset = this.resolvedPreset;
    return preset?.description ?? '';
  }

  protected get hasHeading(): boolean {
    return this.resolvedHeading.length > 0;
  }

  protected get hasDescription(): boolean {
    return this.resolvedDescription.length > 0;
  }

  protected get showSpinner(): boolean {
    return this.visual === 'icon' && this.state === 'pending';
  }

  protected get showIcon(): boolean {
    return this.visual === 'icon' && !this.showSpinner;
  }

  protected get visibleAction(): CxStateMessageAction | undefined {
    return this.visibleActionFor(this.action) ?? this.visibleActionFor(CX_STATE_MESSAGE_STATE_ACTIONS[this.state]);
  }

  protected get visibleSecondaryAction(): CxStateMessageAction | undefined {
    return this.visibleActionFor(this.secondaryAction);
  }

  protected hasActions(): boolean {
    return this.visibleAction !== undefined || this.visibleSecondaryAction !== undefined;
  }

  private get resolvedPreset(): typeof CX_STATE_MESSAGE_PRESETS[keyof typeof CX_STATE_MESSAGE_PRESETS] | undefined {
    if (this.state === 'default') {
      return undefined;
    }
    return CX_STATE_MESSAGE_PRESETS[this.state];
  }

  private visibleActionFor(action: CxStateMessageAction | undefined): CxStateMessageAction | undefined {
    return visibleCxFeedbackAction(action);
  }

  protected resolveActionMood(action: CxStateMessageAction): CxButtonMood {
    return action.mood ?? 'default';
  }

  protected onActionPressed(action: CxStateMessageAction): void {
    this.actionEmitter.emit(action);
  }

  protected onSecondaryActionPressed(action: CxStateMessageAction): void {
    this.secondaryActionEmitter.emit(action);
  }

  /**
   * A top-aligned mark reads as dropped unless its ink starts on the heading's cap
   * line. Both offsets are real and neither is knowable from CSS: an icon carries
   * its own air inside its box, and that air differs per glyph, while the heading
   * keeps half its leading above the caps. Publish the difference so the layout can
   * lift the mark by exactly that much.
   */
  private syncIconInkOffset(): void {
    const region = this.iconRegionRef?.nativeElement;
    if (!this.browser || !region) {
      this.measuredRegion = undefined;
      this.measuredOffset = undefined;
      return;
    }

    const air = this.iconInkAir(region);
    const heading = this.messageBodyRef?.nativeElement.querySelector('.cx-state-message__heading');
    const offset = Math.max(0, air - (heading ? capLeading(heading) : 0));
    if (region === this.measuredRegion && offset === this.measuredOffset) {
      return;
    }
    region.style.setProperty('--cx-state-message-icon-ink', `${offset}px`);
    this.measuredRegion = region;
    this.measuredOffset = offset;
  }

  /** Blank space between the icon box's top edge and the first painted pixel of its glyph. */
  private iconInkAir(region: HTMLElement): number {
    const svg = region.querySelector('svg');
    const height = svg?.getBoundingClientRect().height ?? 0;
    const viewBox = svg?.viewBox.baseVal;
    if (!svg || !height || !viewBox?.height) {
      return 0;
    }
    let ink: DOMRect;
    try {
      ink = svg.getBBox();
    } catch {
      return 0;
    }
    return ink.height ? ((ink.y - viewBox.y) / viewBox.height) * height : 0;
  }
}

/** Blank space a line of text keeps above its cap height, from the font's own metrics. */
function capLeading(heading: Element): number {
  const style = getComputedStyle(heading);
  const context = document.createElement('canvas').getContext('2d');
  if (!context) {
    return 0;
  }
  context.font = `${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${style.fontFamily}`;
  const metrics = context.measureText('H');
  const ascent = metrics.fontBoundingBoxAscent;
  const descent = metrics.fontBoundingBoxDescent;
  const cap = metrics.actualBoundingBoxAscent;
  if (!ascent || !cap) {
    return 0;
  }
  const lineHeight = Number.parseFloat(style.lineHeight);
  const halfLeading = Number.isFinite(lineHeight) ? (lineHeight - (ascent + descent)) / 2 : 0;
  return Math.max(0, halfLeading + (ascent - cap));
}
