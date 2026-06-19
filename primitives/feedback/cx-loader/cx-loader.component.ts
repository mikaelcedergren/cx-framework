import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type CxLoaderShape = 'table' | 'list' | 'chart' | 'blocks';
export type CxLoaderRowHeight = '16' | '32' | '64' | '128' | '256';
export type CxLoaderRowWidth = '50' | '100';
export type CxLoaderGap = '4' | '8' | '16';
export type CxLoaderMargin = '0' | '16';

export interface CxLoaderCell {
  height?: CxLoaderRowHeight;
}

export interface CxLoaderRow {
  width?: CxLoaderRowWidth;
  cells: readonly CxLoaderCell[];
}

export class CxLoader {
  private constructor(
    public readonly rows: readonly CxLoaderRow[],
    public readonly gap: CxLoaderGap,
    public readonly margin: CxLoaderMargin,
    public readonly frozen: boolean,
  ) {}

  public static of(
    rows: readonly CxLoaderRow[],
    gap: CxLoaderGap,
    margin: CxLoaderMargin,
    frozen = false,
  ): CxLoader {
    return new CxLoader(rows, gap, margin, frozen);
  }

  public static ofTable(columnCount = 4, rowCount = 6): CxLoader {
    const rows = Array.from({ length: rowCount }, () => ({
      cells: Array.from({ length: columnCount }, () => ({})),
    }));
    return CxLoader.of(rows, '8', '16');
  }

  public static ofList(itemCount = 3, groupCount = 0): CxLoader {
    const rows: CxLoaderRow[] = [];
    for (let groupIndex = 0; groupIndex < Math.max(groupCount, 1); groupIndex += 1) {
      if (groupCount > 0) {
        rows.push({ width: '50', cells: [{}] });
      }
      for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
        rows.push({ cells: [{}] });
      }
    }
    return CxLoader.of(rows, '8', '16');
  }

  public static ofChart(): CxLoader {
    return CxLoader.of(
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

  public static ofBlocks(rowCount = 2, columnCount = 1, height: CxLoaderRowHeight = '128'): CxLoader {
    const rows = Array.from({ length: rowCount }, () => ({
      cells: Array.from({ length: columnCount }, () => ({ height })),
    }));
    return CxLoader.of(rows, '8', '16');
  }

  public withRows(rows: readonly CxLoaderRow[]): CxLoader {
    return new CxLoader(rows, this.gap, this.margin, this.frozen);
  }

  public withGap(gap: CxLoaderGap): CxLoader {
    return new CxLoader(this.rows, gap, this.margin, this.frozen);
  }

  public withMargin(margin: CxLoaderMargin): CxLoader {
    return new CxLoader(this.rows, this.gap, margin, this.frozen);
  }

  public withFrozen(frozen: boolean): CxLoader {
    return new CxLoader(this.rows, this.gap, this.margin, frozen);
  }
}

const DEFAULT_LOADER = CxLoader.ofTable();

@Component({
  selector: 'cx-loader',
  templateUrl: './cx-loader.component.html',
  styleUrl: './cx-loader.component.scss',
  host: {
    role: 'status',
    '[attr.aria-busy]': 'loading ? "true" : "false"',
    'aria-label': 'Loading',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxLoaderComponent {
  private loaderState = DEFAULT_LOADER;

  @Input()
  public set loader(loader: CxLoader | undefined) {
    this.loaderState = loader ?? DEFAULT_LOADER;
  }

  public get loader(): CxLoader {
    return this.loaderState;
  }

  @Input() loading = true;

  protected rows(): readonly CxLoaderRow[] {
    return this.loader.rows;
  }

  protected rowWidth(row: CxLoaderRow): CxLoaderRowWidth {
    return row.width ?? '100';
  }

  protected cellHeight(cell: CxLoaderCell): CxLoaderRowHeight {
    return cell.height ?? '32';
  }

  protected animationDelay(rowIndex: number, cellIndex: number): number {
    return this.loader.frozen ? 0 : (rowIndex + cellIndex) * 90;
  }
}
