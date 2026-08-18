import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent, type CxIconMood } from '../../media/cx-icon';

export type CxLogStepPosition = 'first' | 'middle' | 'last' | 'single';
export type CxLogStepSize = 'default' | 'large';

/** A step whose text names something with its own destination. Route in-app, href outward. */
export type CxLogStepLink =
  | { readonly routerLink: string | readonly unknown[] }
  | { readonly href: string; readonly target?: string };

export class CxLogStep {
  private constructor(
    public readonly position: CxLogStepPosition,
    public readonly text: string,
    public readonly size: CxLogStepSize,
    public readonly icon: CxIconName | undefined,
    public readonly mood: CxIconMood,
    public readonly link: CxLogStepLink | undefined,
  ) {}

  public static of(text: string): CxLogStep {
    return new CxLogStep('middle', text, 'default', undefined, 'default', undefined);
  }

  public static empty(): CxLogStep {
    return CxLogStep.of('');
  }

  public withPosition(position: CxLogStepPosition): CxLogStep {
    return new CxLogStep(position, this.text, this.size, this.icon, this.mood, this.link);
  }

  public withText(text: string): CxLogStep {
    return new CxLogStep(this.position, text, this.size, this.icon, this.mood, this.link);
  }

  public withSize(size: CxLogStepSize): CxLogStep {
    return new CxLogStep(this.position, this.text, size, this.icon, this.mood, this.link);
  }

  public withIcon(icon: CxIconName): CxLogStep {
    return new CxLogStep(this.position, this.text, 'large', icon, this.mood, this.link);
  }

  public withMood(mood: CxIconMood): CxLogStep {
    return new CxLogStep(this.position, this.text, this.size, this.icon, mood, this.link);
  }

  public withLink(link: CxLogStepLink): CxLogStep {
    return new CxLogStep(this.position, this.text, this.size, this.icon, this.mood, link);
  }
}

const DEFAULT_STEP = CxLogStep.empty();

@Component({
  selector: 'cx-log-step',
  imports: [CxIconComponent, RouterLink],
  templateUrl: './cx-log-step.component.html',
  styleUrl: './cx-log-step.component.scss',
  host: {
    class: 'cx-log-step',
    '[class.cx-log-step--first]': 'step.position === "first"',
    '[class.cx-log-step--middle]': 'step.position === "middle"',
    '[class.cx-log-step--last]': 'step.position === "last"',
    '[class.cx-log-step--single]': 'step.position === "single"',
    '[class.cx-log-step--large]': 'step.size === "large"',
    '[class.cx-log-step--colored]': 'step.mood !== "default"',
    '[class.cx-log-step--mood-primary]': 'step.mood === "primary"',
    '[class.cx-log-step--mood-accent]': 'step.mood === "accent"',
    '[class.cx-log-step--mood-info]': 'step.mood === "info"',
    '[class.cx-log-step--mood-success]': 'step.mood === "success"',
    '[class.cx-log-step--mood-warning]': 'step.mood === "warning"',
    '[class.cx-log-step--mood-danger]': 'step.mood === "danger"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxLogStepComponent {
  private stepState = DEFAULT_STEP;

  @ViewChild('logContent', { read: ElementRef })
  private logContentRef?: ElementRef<HTMLElement>;

  @Input()
  public set step(step: CxLogStep | undefined) {
    this.stepState = step ?? DEFAULT_STEP;
  }

  public get step(): CxLogStep {
    return this.stepState;
  }

  @Input() datestamp = '';
  @Input() description = '';
  @Input() author = '';

  protected routerLink(): string | readonly unknown[] | undefined {
    const link = this.step.link;
    return link && 'routerLink' in link ? link.routerLink : undefined;
  }

  protected href(): string | undefined {
    const link = this.step.link;
    return link && 'href' in link ? link.href : undefined;
  }

  protected target(): string | null {
    const link = this.step.link;
    return (link && 'href' in link ? link.target : undefined) ?? null;
  }

  protected rel(): string | null {
    const link = this.step.link;
    return link && 'href' in link && link.target === '_blank' ? 'noopener' : null;
  }
}
