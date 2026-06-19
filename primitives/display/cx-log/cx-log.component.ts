import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CxLogStep, CxLogStepComponent } from '../cx-log-step';

export class CxLog {
  private static readonly emptyLog = new CxLog([]);

  private constructor(public readonly steps: readonly CxLogStep[]) {}

  public static empty(): CxLog {
    return CxLog.emptyLog;
  }

  public static of(steps: readonly CxLogStep[]): CxLog {
    return new CxLog(
      steps.map((step, index) => {
        const position =
          steps.length === 1 ? 'single' : index === 0 ? 'first' : index === steps.length - 1 ? 'last' : 'middle';
        return step.withPosition(position);
      }),
    );
  }

  public withSteps(steps: readonly CxLogStep[]): CxLog {
    return CxLog.of(steps);
  }

  public withStep(index: number, step: CxLogStep): CxLog {
    return CxLog.of(this.steps.map((current, currentIndex) => (currentIndex === index ? step : current)));
  }
}

export interface CxLogEntry {
  step: CxLogStep;
  datestamp?: string;
  description?: string;
  author?: string;
}

interface CxLogRenderedEntry {
  step: CxLogStep;
  datestamp: string;
  description: string;
  author: string;
}

@Component({
  selector: 'cx-log',
  imports: [CxLogStepComponent],
  templateUrl: './cx-log.component.html',
  styleUrl: './cx-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxLogComponent {
  private logState = CxLog.empty();

  @Input()
  public set log(log: CxLog | undefined) {
    this.logState = log ?? CxLog.empty();
  }

  public get log(): CxLog {
    return this.logState;
  }

  @Input() entries: readonly CxLogEntry[] | undefined;

  protected renderedEntries(): readonly CxLogRenderedEntry[] {
    const entries: readonly CxLogEntry[] = this.entries ?? this.log.steps.map(step => ({ step }));
    const positionedSteps = CxLog.of(entries.map(entry => entry.step)).steps;
    return entries.map((entry, index) => ({
      step: positionedSteps[index] ?? entry.step,
      datestamp: entry.datestamp ?? '',
      description: entry.description ?? '',
      author: entry.author ?? '',
    }));
  }
}
