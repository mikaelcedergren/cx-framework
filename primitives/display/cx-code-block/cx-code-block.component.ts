import { ChangeDetectionStrategy, Component, Input, OnDestroy, signal } from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';

export type CxCodeBlockAnnotationMood = 'default' | 'info' | 'success' | 'warning' | 'danger';

export type CxCodeBlockLineAnnotation = {
  id?: string;
  kind: 'line';
  line: number;
  mood: CxCodeBlockAnnotationMood;
  message?: string;
};

export type CxCodeBlockRangeAnnotation = {
  id?: string;
  kind: 'range';
  line: number;
  startIndex: number;
  endIndex: number;
  mood: CxCodeBlockAnnotationMood;
  message?: string;
};

export type CxCodeBlockAnnotation = CxCodeBlockLineAnnotation | CxCodeBlockRangeAnnotation;

interface CxCodeBlockSegment {
  text: string;
  startIndex: number;
  mood?: CxCodeBlockAnnotationMood;
  message?: string;
}

interface CxCodeBlockLine {
  number: number;
  mood?: CxCodeBlockAnnotationMood;
  message?: string;
  segments: readonly CxCodeBlockSegment[];
}

@Component({
  selector: 'cx-code-block',
  imports: [CxIconButtonComponent],
  templateUrl: './cx-code-block.component.html',
  styleUrl: './cx-code-block.component.scss',
  host: {
    '[class.cx-code-block--has-heading]': 'hasHeading()',
    '[class.cx-code-block--copyable]': 'copyable',
    '[class.cx-code-block--no-wrap]': '!wrap',
    '[class.cx-code-block--copied]': 'copyState() === "copied"',
    '[class.cx-code-block--failed]': 'copyState() === "failed"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxCodeBlockComponent implements OnDestroy {
  private copyResetTimer: ReturnType<typeof setTimeout> | undefined;
  protected readonly copyState = signal<'idle' | 'copied' | 'failed'>('idle');

  @Input() code = '';
  @Input() heading: string | undefined;
  @Input() annotations: readonly CxCodeBlockAnnotation[] = [];
  @Input() copyable = false;
  @Input() wrap = true;

  public ngOnDestroy(): void {
    if (this.copyResetTimer) {
      clearTimeout(this.copyResetTimer);
    }
  }

  protected hasHeading(): boolean {
    return !!this.heading?.trim();
  }

  protected lines(): readonly CxCodeBlockLine[] {
    return this.code.split(/\r?\n/).map((text, index) => {
      const number = index + 1;
      const lineAnnotations = this.annotations.filter(
        (annotation): annotation is CxCodeBlockLineAnnotation =>
          annotation.kind === 'line' && annotation.line === number,
      );
      const rangeAnnotations = this.annotations.filter(
        (annotation): annotation is CxCodeBlockRangeAnnotation =>
          annotation.kind === 'range' && annotation.line === number,
      );
      const mood = lineAnnotations[0]?.mood;
      return {
        number,
        mood,
        message: lineAnnotations.find(annotation => annotation.mood === mood)?.message,
        segments: this.segments(text, rangeAnnotations),
      };
    });
  }

  protected copyIcon(): 'copy' | 'check' | 'error' {
    const state = this.copyState();
    if (state === 'copied') return 'check';
    if (state === 'failed') return 'error';
    return 'copy';
  }

  protected copyAriaLabel(): string {
    const state = this.copyState();
    if (state === 'copied') return 'Copied';
    if (state === 'failed') return 'Copy failed';
    return 'Copy code';
  }

  protected copyDisabled(): boolean {
    return !this.copyable || this.code.length === 0;
  }

  protected async copy(): Promise<void> {
    if (this.copyDisabled()) return;
    try {
      await navigator.clipboard.writeText(this.code);
      this.flashCopyState('copied');
    } catch {
      this.flashCopyState('failed');
    }
  }

  private segments(text: string, annotations: readonly CxCodeBlockRangeAnnotation[]): readonly CxCodeBlockSegment[] {
    const sorted = [...annotations]
      .map(annotation => ({
        ...annotation,
        startIndex: Math.max(0, Math.min(text.length, annotation.startIndex)),
        endIndex: Math.max(0, Math.min(text.length, annotation.endIndex)),
      }))
      .filter(annotation => annotation.endIndex > annotation.startIndex)
      .sort((a, b) => a.startIndex - b.startIndex);

    const segments: CxCodeBlockSegment[] = [];
    let cursor = 0;
    for (const annotation of sorted) {
      if (annotation.startIndex > cursor) {
        segments.push({ text: text.slice(cursor, annotation.startIndex), startIndex: cursor });
      }
      segments.push({
        text: text.slice(annotation.startIndex, annotation.endIndex),
        startIndex: annotation.startIndex,
        mood: annotation.mood,
        message: annotation.message,
      });
      cursor = annotation.endIndex;
    }
    if (cursor < text.length) {
      segments.push({ text: text.slice(cursor), startIndex: cursor });
    }
    return segments.length ? segments : [{ text: text || ' ', startIndex: 0 }];
  }

  private flashCopyState(copyState: 'copied' | 'failed'): void {
    this.copyState.set(copyState);
    if (this.copyResetTimer) {
      clearTimeout(this.copyResetTimer);
    }
    this.copyResetTimer = setTimeout(() => this.copyState.set('idle'), 1500);
  }
}
