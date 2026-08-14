import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  Output,
  QueryList,
  signal,
  type AfterContentInit,
  type OnDestroy,
} from '@angular/core';
import { type Subscription } from 'rxjs';
import { CxListItemComponent } from './cx-list-item.component';

export type CxListVariant = 'default' | 'flat';
export type CxListDensity = 'comfortable' | 'compact';

@Component({
  selector: 'cx-list',
  templateUrl: './cx-list.component.html',
  styleUrl: './cx-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxListComponent implements AfterContentInit, OnDestroy {
  private readonly emptyState = signal(true);
  private expandedIdValue: string | undefined;
  private densityValue: CxListDensity = 'comfortable';
  private dividedValue = true;

  private itemChangesSubscription?: Subscription;
  private itemToggleSubscriptions: Subscription[] = [];

  @ContentChildren(CxListItemComponent)
  private items?: QueryList<CxListItemComponent>;

  /** `flat` drops the container's border and radius for an already-framed surface. */
  @Input() variant: CxListVariant = 'default';
  @Input() emptyText = 'Nothing here yet.';

  @Input()
  public set density(value: CxListDensity) {
    this.densityValue = value;
    this.syncContext();
  }
  public get density(): CxListDensity {
    return this.densityValue;
  }

  @Input({ transform: booleanAttribute })
  public set divided(value: boolean) {
    this.dividedValue = value;
    this.syncContext();
  }
  public get divided(): boolean {
    return this.dividedValue;
  }

  /**
   * The single open row. The list is an accordion by design: opening a row
   * closes the previous one, so multiple standalone panels are the wrong
   * component for that job.
   */
  @Input()
  public set expandedId(value: string | undefined) {
    this.expandedIdValue = value;
    this.syncExpanded();
  }
  public get expandedId(): string | undefined {
    return this.expandedIdValue;
  }

  @Output() readonly expandedIdChange = new EventEmitter<string | undefined>();

  protected readonly empty$ = this.emptyState.asReadonly();

  ngAfterContentInit(): void {
    this.bindItems();
    this.itemChangesSubscription = this.items?.changes.subscribe(() => this.bindItems());
  }

  ngOnDestroy(): void {
    this.itemChangesSubscription?.unsubscribe();
    this.unbindItems();
  }

  private bindItems(): void {
    this.unbindItems();
    const items = this.items?.toArray() ?? [];
    this.emptyState.set(items.length === 0);
    this.itemToggleSubscriptions = items.map(item =>
      item.expandToggle.subscribe(key => this.onExpandToggle(key)),
    );
    this.syncContext();
    this.syncExpanded();
  }

  private unbindItems(): void {
    this.itemToggleSubscriptions.forEach(subscription => subscription.unsubscribe());
    this.itemToggleSubscriptions = [];
  }

  private onExpandToggle(key: string): void {
    this.expandedIdValue = this.expandedIdValue === key ? undefined : key;
    this.syncExpanded();
    this.expandedIdChange.emit(this.expandedIdValue);
  }

  private syncExpanded(): void {
    for (const item of this.items?.toArray() ?? []) {
      item.setExpanded(item.key === this.expandedIdValue);
    }
  }

  private syncContext(): void {
    for (const item of this.items?.toArray() ?? []) {
      item.setContext({ density: this.densityValue, divided: this.dividedValue, managed: true });
    }
  }
}
