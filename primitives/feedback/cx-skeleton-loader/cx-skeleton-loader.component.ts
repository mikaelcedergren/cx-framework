import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type CxSkeletonLoaderShape = 'table' | 'list' | 'chart' | 'blocks';
export type CxSkeletonLoaderRowHeight = '16' | '32' | '64' | '128' | '256';
export type CxSkeletonLoaderRowWidth = '50' | '100';
export type CxSkeletonLoaderGap = '4' | '8' | '16';
export type CxSkeletonLoaderMargin = '0' | '16';

export interface CxSkeletonLoaderCell {
  height?: CxSkeletonLoaderRowHeight;
}

export interface CxSkeletonLoaderRow {
  width?: CxSkeletonLoaderRowWidth;
  cells: readonly CxSkeletonLoaderCell[];
}

export class CxSkeletonLoader {
  private constructor(
    public readonly rows: readonly CxSkeletonLoaderRow[],
    public readonly gap: CxSkeletonLoaderGap,
    public readonly margin: CxSkeletonLoaderMargin,
    public readonly frozen: boolean,
  ) {}

  public static of(
    rows: readonly CxSkeletonLoaderRow[],
    gap: CxSkeletonLoaderGap,
    margin: CxSkeletonLoaderMargin,
    frozen = false,
  ): CxSkeletonLoader {
    return new CxSkeletonLoader(rows, gap, margin, frozen);
  }

  public static ofTable(columnCount = 4, rowCount = 6): CxSkeletonLoader {
    const rows = Array.from({ length: rowCount }, () => ({
      cells: Array.from({ length: columnCount }, () => ({})),
    }));
    return CxSkeletonLoader.of(rows, '8', '16');
  }

  public static ofList(itemCount = 3, groupCount = 0): CxSkeletonLoader {
    const rows: CxSkeletonLoaderRow[] = [];
    for (let groupIndex = 0; groupIndex < Math.max(groupCount, 1); groupIndex += 1) {
      if (groupCount > 0) {
        rows.push({ width: '50', cells: [{}] });
      }
      for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
        rows.push({ cells: [{}] });
      }
    }
    return CxSkeletonLoader.of(rows, '8', '16');
  }

  public static ofChart(): CxSkeletonLoader {
    return CxSkeletonLoader.of(
      [
        {
          cells: [
            { height: '32' },
            { height: '32' },
            { height: '64' },
            { height: '128' },
            { height: '32' },
            { height: '16' },
            { height: '64' },
          ],
        },
      ],
      '8',
      '16',
    );
  }

  public static ofBlocks(rowCount = 2, columnCount = 1, height: CxSkeletonLoaderRowHeight = '128'): CxSkeletonLoader {
    const rows = Array.from({ length: rowCount }, () => ({
      cells: Array.from({ length: columnCount }, () => ({ height })),
    }));
    return CxSkeletonLoader.of(rows, '8', '16');
  }

  public withRows(rows: readonly CxSkeletonLoaderRow[]): CxSkeletonLoader {
    return new CxSkeletonLoader(rows, this.gap, this.margin, this.frozen);
  }

  public withGap(gap: CxSkeletonLoaderGap): CxSkeletonLoader {
    return new CxSkeletonLoader(this.rows, gap, this.margin, this.frozen);
  }

  public withMargin(margin: CxSkeletonLoaderMargin): CxSkeletonLoader {
    return new CxSkeletonLoader(this.rows, this.gap, margin, this.frozen);
  }

  public withFrozen(frozen: boolean): CxSkeletonLoader {
    return new CxSkeletonLoader(this.rows, this.gap, this.margin, frozen);
  }
}

const DEFAULT_SKELETON = CxSkeletonLoader.ofTable();

@Component({
  selector: 'cx-skeleton-loader',
  templateUrl: './cx-skeleton-loader.component.html',
  styleUrl: './cx-skeleton-loader.component.scss',
  host: {
    role: 'status',
    '[attr.aria-busy]': 'loading ? "true" : "false"',
    'aria-label': 'Loading',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSkeletonLoaderComponent {
  private skeletonState = DEFAULT_SKELETON;

  /** The placeholder layout to hold. Defaults to a table skeleton. */
  @Input()
  public set skeleton(skeleton: CxSkeletonLoader | undefined) {
    this.skeletonState = skeleton ?? DEFAULT_SKELETON;
  }

  public get skeleton(): CxSkeletonLoader {
    return this.skeletonState;
  }

  @Input() loading = true;

  protected rows(): readonly CxSkeletonLoaderRow[] {
    return this.skeleton.rows;
  }

  protected rowWidth(row: CxSkeletonLoaderRow): CxSkeletonLoaderRowWidth {
    return row.width ?? '100';
  }

  protected cellHeight(cell: CxSkeletonLoaderCell): CxSkeletonLoaderRowHeight {
    return cell.height ?? '32';
  }

  protected animationDelay(rowIndex: number, cellIndex: number): number {
    return this.skeleton.frozen ? 0 : (rowIndex + cellIndex) * 90;
  }
}
