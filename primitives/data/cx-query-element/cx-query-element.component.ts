import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CxTooltipDirective } from '../../overlay/cx-tooltip';

export type CxQueryElementKind = 'insert' | 'field' | 'operator' | 'boolean' | 'parenthesis' | 'values';

export interface CxQueryElementData {
  id?: string;
  kind: CxQueryElementKind;
  label?: string;
  values?: readonly string[];
  valuesPrefix?: string;
  valuesDivider?: string;
  valuesSuffix?: string;
  focused?: boolean;
  disabled?: boolean;
  grouped?: boolean;
  tabIndex?: number;
  ariaLabel?: string;
}

const DEFAULT_QUERY_ELEMENT_DATA: CxQueryElementData = {
  kind: 'field',
  label: 'Status',
};

@Component({
  selector: 'cx-query-element',
  imports: [CxTooltipDirective],
  templateUrl: './cx-query-element.component.html',
  styleUrl: './cx-query-element.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxQueryElementComponent {
  protected kind: CxQueryElementKind = DEFAULT_QUERY_ELEMENT_DATA.kind;
  protected label = DEFAULT_QUERY_ELEMENT_DATA.label ?? '';
  protected values: readonly string[] = [];
  protected valuesPrefix = '';
  protected valuesDivider = ', ';
  protected valuesSuffix = '';
  protected focused = false;
  protected disabled = false;
  protected grouped = false;
  protected tabIndex = 0;
  protected ariaLabel: string | undefined;

  @Input()
  public set data(value: CxQueryElementData | null | undefined) {
    const data = value ?? DEFAULT_QUERY_ELEMENT_DATA;

    this.kind = data.kind;
    this.label = data.label ?? this.defaultLabelFor(data.kind);
    this.values = (data.values ?? []).map(item => item?.trim() ?? '');
    this.valuesPrefix = data.valuesPrefix ?? '';
    this.valuesDivider = data.valuesDivider ?? ', ';
    this.valuesSuffix = data.valuesSuffix ?? '';
    this.focused = data.focused ?? false;
    this.disabled = data.disabled ?? false;
    this.grouped = data.grouped ?? false;
    this.tabIndex = data.tabIndex ?? 0;
    this.ariaLabel = data.ariaLabel?.trim() || undefined;
  }

  @Output() readonly pressed = new EventEmitter<void>();

  protected isValues(): boolean {
    return this.kind === 'values';
  }

  protected resolvedLabel(): string {
    const trimmed = this.label.trim();
    if (trimmed) {
      return trimmed;
    }
    return this.defaultLabelFor(this.kind);
  }

  protected resolvedText(): string {
    if (!this.isValues()) {
      return this.resolvedLabel();
    }

    const values = this.values.map(value => value || '<Empty>');
    return `${this.valuesPrefix}${values.join(this.valuesDivider)}${this.valuesSuffix}`;
  }

  protected onPressed(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled) {
      return;
    }
    this.pressed.emit();
  }

  private defaultLabelFor(kind: CxQueryElementKind): string {
    switch (kind) {
      case 'insert':
        return '...';
      case 'operator':
        return '=';
      case 'boolean':
        return 'AND';
      case 'parenthesis':
        return '(';
      case 'values':
        return '';
      case 'field':
      default:
        return 'Status';
    }
  }
}
