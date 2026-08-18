import { UrlTree } from '@angular/router';
import type { CxSideNavItem } from './cx-side-nav.component';

/** Internal assertion shared by the component input boundary and its contract tests. */
export function assertCompatibleSideNavUrlTreeExtras(item: CxSideNavItem, path: string): void {
  if (!(item.routerLink instanceof UrlTree)) {
    return;
  }

  const incompatibleExtras = (['queryParams', 'queryParamsHandling', 'fragment'] as const).filter(
    extra => item[extra] !== undefined,
  );
  if (incompatibleExtras.length > 0) {
    throw new Error(
      `[cx-side-nav] ${path} uses a UrlTree for routerLink and must not also set ${incompatibleExtras.join(', ')}. Include those values in the UrlTree instead.`,
    );
  }
}
