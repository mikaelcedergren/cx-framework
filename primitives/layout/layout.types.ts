export type CxLayoutGap = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type CxLayoutAlign = 'start' | 'center' | 'end' | 'stretch';
export type CxLayoutJustify = 'start' | 'center' | 'end' | 'between';

export function cxLayoutGapToken(gap: CxLayoutGap): string {
  switch (gap) {
    case '2xs':
      return 'var(--space-2xs)';
    case 'xs':
      return 'var(--space-xs)';
    case 'sm':
      return 'var(--space-sm)';
    case 'lg':
      return 'var(--space-lg)';
    case 'xl':
      return 'var(--space-xl)';
    case '2xl':
      return 'var(--space-2xl)';
    case 'md':
    default:
      return 'var(--space-md)';
  }
}

export function cxLayoutAlignValue(align: CxLayoutAlign): string {
  switch (align) {
    case 'start':
      return 'flex-start';
    case 'center':
      return 'center';
    case 'end':
      return 'flex-end';
    case 'stretch':
    default:
      return 'stretch';
  }
}

export function cxLayoutJustifyValue(justify: CxLayoutJustify): string {
  switch (justify) {
    case 'center':
      return 'center';
    case 'end':
      return 'flex-end';
    case 'between':
      return 'space-between';
    case 'start':
    default:
      return 'flex-start';
  }
}
