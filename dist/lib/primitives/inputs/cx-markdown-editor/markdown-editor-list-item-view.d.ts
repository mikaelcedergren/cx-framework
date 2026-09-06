import { type EnvironmentInjector, type Injector } from '@angular/core';
import type { NodeViewConstructor } from 'prosemirror-view';
/** Project the existing checkbox into ProseMirror's otherwise editor-owned DOM. */
export declare function createListItemViews(environmentInjector: EnvironmentInjector, elementInjector: Injector): {
    nodeViews: {
        list_item: NodeViewConstructor;
    };
    refresh: () => void;
};
//# sourceMappingURL=markdown-editor-list-item-view.d.ts.map