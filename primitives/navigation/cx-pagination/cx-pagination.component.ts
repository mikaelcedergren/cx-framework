import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxSelectComponent, type CxSelectOption } from '../../inputs/cx-select';

export interface CxPaginationPage {
  number: number;
  size: number;
  total: number;
}

export type CxPaginationTotalMode = 'known' | 'unknown';

type CxPaginationPageItem =
  | {
      kind: 'page';
      id: string;
      page: number;
      label: string;
      current: boolean;
    }
  | {
      kind: 'ellipsis';
      id: string;
      label: string;
    };

function toPositiveInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(1, Math.floor(value));
}

function toNonNegativeInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.floor(value));
}

function normalizePageSizeOptions(options: readonly number[] | undefined): number[] {
  const normalized = (options ?? [])
    .filter(value => Number.isFinite(value))
    .map(value => Math.max(1, Math.floor(value)));
  return [...new Set(normalized)];
}

function getPageCount(totalItems: number, pageSize: number): number {
  if (pageSize <= 0) {
    return 0;
  }
  return Math.ceil(Math.max(0, totalItems) / pageSize);
}

function createPageItem(page: number, currentPage: number): CxPaginationPageItem {
  return {
    kind: 'page',
    id: `page-${page}`,
    page,
    label: String(page),
    current: page === currentPage,
  };
}

function buildPageItems(currentPage: number, pageCount: number): CxPaginationPageItem[] {
  if (pageCount <= 0) {
    return [];
  }

  const items: CxPaginationPageItem[] = [];
  const maxDiff = 3;
  for (let index = 1; index <= pageCount; index++) {
    const diff = Math.abs(currentPage - index);
    const diffEnd = pageCount - currentPage;
    const show =
      index === 1 ||
      index === pageCount ||
      diff < maxDiff ||
      (index < currentPage && currentPage === maxDiff + 1) ||
      (index > currentPage && diffEnd === maxDiff + 1);

    if (show) {
      items.push(createPageItem(index, currentPage));
      continue;
    }

    if (items.at(-1)?.kind !== 'ellipsis') {
      items.push({ kind: 'ellipsis', id: `ellipsis-${index}`, label: '...' });
    }
  }
  return items;
}

function normalizePage(value: CxPaginationPage | undefined): CxPaginationPage {
  return {
    number: toPositiveInteger(value?.number, 1),
    size: toPositiveInteger(value?.size, 25),
    total: toNonNegativeInteger(value?.total, 157),
  };
}

@Component({
  selector: 'cx-pagination',
  imports: [CxIconButtonComponent, CxSelectComponent],
  templateUrl: './cx-pagination.component.html',
  styleUrl: './cx-pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxPaginationComponent {
  private readonly pageState = signal<CxPaginationPage>({ number: 1, size: 25, total: 157 });
  private readonly pageSizesState = signal<number[]>([10, 25, 50, 100]);
  private readonly totalModeState = signal<CxPaginationTotalMode>('known');

  @Input()
  public set page(value: CxPaginationPage | undefined) {
    this.pageState.set(normalizePage(value));
  }

  @Input()
  public set pageSizes(value: readonly number[] | undefined) {
    this.pageSizesState.set(normalizePageSizeOptions(value ?? [10, 25, 50, 100]));
  }

  @Input()
  public set totalMode(value: CxPaginationTotalMode | undefined) {
    this.totalModeState.set(value === 'unknown' ? 'unknown' : 'known');
  }

  @Output() readonly pageChange = new EventEmitter<CxPaginationPage>();

  protected readonly currentPage$ = computed(() => this.pageState().number);
  protected readonly currentPageSize$ = computed(() => this.pageState().size);
  protected readonly totalItems$ = computed(() => this.pageState().total);
  protected readonly availablePageSizes$ = computed(() =>
    normalizePageSizeOptions(this.pageSizesState()),
  );
  protected readonly pageSizeOptions$ = computed<CxSelectOption[]>(() =>
    this.availablePageSizes$().map(value => ({
      id: String(value),
      label: String(value),
    })),
  );
  protected readonly pageCount$ = computed(() => getPageCount(this.totalItems$(), this.currentPageSize$()));
  protected readonly pageSizeValue$ = computed(() => String(this.currentPageSize$()));
  protected readonly totalKnown$ = computed(() => this.totalModeState() === 'known');
  protected readonly pageItems$ = computed<CxPaginationPageItem[]>(() => {
    if (!this.totalKnown$()) {
      return [createPageItem(this.currentPage$(), this.currentPage$())];
    }
    return buildPageItems(this.currentPage$(), this.pageCount$());
  });
  protected readonly previousDisabled$ = computed(() => this.currentPage$() <= 1);
  protected readonly nextDisabled$ = computed(() => this.totalKnown$() && this.currentPage$() >= this.pageCount$());
  protected readonly totalText$ = computed(() => {
    if (!this.totalKnown$()) {
      return '';
    }
    const totalItems = this.totalItems$();
    if (totalItems === 0) {
      return '0 of 0';
    }
    const start = (this.currentPage$() - 1) * this.currentPageSize$() + 1;
    const end = Math.min(this.currentPage$() * this.currentPageSize$(), totalItems);
    return `${start}-${end} of ${totalItems}`;
  });

  protected goToPreviousPage(): void {
    if (this.previousDisabled$()) {
      return;
    }
    const nextPage = this.currentPage$() - 1;
    this.emitPage({ ...this.pageState(), number: nextPage });
  }

  protected goToNextPage(): void {
    if (this.nextDisabled$()) {
      return;
    }
    const nextPage = this.currentPage$() + 1;
    this.emitPage({ ...this.pageState(), number: nextPage });
  }

  protected goToPage(page: number): void {
    const requestedPage = Math.max(1, toPositiveInteger(page, this.currentPage$()));
    const nextPage = this.totalKnown$() ? Math.min(requestedPage, this.pageCount$()) : requestedPage;
    if (nextPage === this.currentPage$()) {
      return;
    }

    this.emitPage({ ...this.pageState(), number: nextPage });
  }

  protected onPageSizeChange(value: string | undefined): void {
    const parsedValue = Number.parseInt(value ?? '', 10);
    const nextPageSize = toPositiveInteger(parsedValue, this.currentPageSize$());
    if (nextPageSize === this.currentPageSize$()) {
      return;
    }

    this.emitPage({
      ...this.pageState(),
      number: 1,
      size: nextPageSize,
    });
  }

  private emitPage(page: CxPaginationPage): void {
    const nextPage = normalizePage(page);
    this.pageState.set(nextPage);
    this.pageChange.emit(nextPage);
  }
}
