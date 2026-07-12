import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CxLogStep, CxLogStepComponent } from '../cx-log-step';

/** Immutable complete log model. Entries own their visible detail; the model owns connector positions. */
export class CxLog {
  private static readonly emptyLog = new CxLog([]);

  private constructor(public readonly entries: readonly CxLogEntry[]) {}

  public static empty(): CxLog {
    return CxLog.emptyLog;
  }

  public static of(entries: readonly CxLogEntry[]): CxLog {
    return new CxLog(entries.map((entry, index) => {
      const position =
        entries.length === 1 ? 'single' : index === 0 ? 'first' : index === entries.length - 1 ? 'last' : 'middle';
      return { ...entry, step: entry.step.withPosition(position) };
    }));
  }

  public withEntries(entries: readonly CxLogEntry[]): CxLog {
    return CxLog.of(entries);
  }

  public withEntry(index: number, entry: CxLogEntry): CxLog {
    return CxLog.of(this.entries.map((current, currentIndex) => (currentIndex === index ? entry : current)));
  }
}

export interface CxLogEntry {
  readonly step: CxLogStep;
  readonly datestamp?: string;
  readonly description?: string;
  readonly author?: string;
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

  protected renderedEntries(): readonly CxLogRenderedEntry[] {
    return this.log.entries.map(entry => ({
      step: entry.step,
      datestamp: entry.datestamp ?? '',
      description: entry.description ?? '',
      author: entry.author ?? '',
    }));
  }
}
