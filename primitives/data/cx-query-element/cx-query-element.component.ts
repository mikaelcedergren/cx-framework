import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

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
}

const DEFAULT_QUERY_ELEMENT_DATA: CxQueryElementData = {
  kind: 'field',
  label: 'Status',
};

@Component({
  selector: 'cx-query-element',
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

  @Input()
  public set data(value: CxQueryElementData | null | undefined) {
    const data = value ?? DEFAULT_QUERY_ELEMENT_DATA;

    this.kind = data.kind;
    this.label = data.label ?? this.defaultLabelFor(data.kind);
    this.values = data.values ?? [];
    this.valuesPrefix = data.valuesPrefix ?? '';
    this.valuesDivider = data.valuesDivider ?? ', ';
    this.valuesSuffix = data.valuesSuffix ?? '';
    this.focused = data.focused ?? false;
    this.disabled = data.disabled ?? false;
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

  protected onPressed(): void {
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
