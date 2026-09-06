import { createComponent, type EnvironmentInjector, type Injector } from '@angular/core';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import type { EditorView, NodeView, NodeViewConstructor } from 'prosemirror-view';
import { CxCheckboxComponent } from '../cx-checkbox/cx-checkbox.component';

/** Project the existing checkbox into ProseMirror's otherwise editor-owned DOM. */
export function createListItemViews(
  environmentInjector: EnvironmentInjector,
  elementInjector: Injector,
) {
  const refreshers = new Set<() => void>();
  const listItem: NodeViewConstructor = (initialNode, view: EditorView, getPos): NodeView => {
    const document = view.dom.ownerDocument;
    const dom = document.createElement('li');
    const task = initialNode.attrs['checked'] !== null;
    if (!task) {
      return {
        dom,
        contentDOM: dom,
        update: node => node.type === initialNode.type && node.attrs['checked'] === null,
      };
    }

    let currentNode: ProseMirrorNode = initialNode;
    dom.className = 'cx-markdown-editor__task';
    const control = document.createElement('span');
    control.className = 'cx-markdown-editor__task-control';
    control.contentEditable = 'false';
    const host = document.createElement('cx-checkbox');
    control.append(host);
    const contentDOM = document.createElement('div');
    contentDOM.className = 'cx-markdown-editor__task-content';
    dom.append(control, contentDOM);
    const checkbox = createComponent(CxCheckboxComponent, {
      hostElement: host,
      environmentInjector,
      elementInjector,
    });
    const refresh = () => {
      dom.dataset['checked'] = String(currentNode.attrs['checked']);
      checkbox.setInput('selected', currentNode.attrs['checked']);
      checkbox.setInput('disabled', !view.editable);
      checkbox.setInput('ariaLabel', currentNode.firstChild?.textContent || 'Task');
      checkbox.changeDetectorRef.detectChanges();
    };
    const subscription = checkbox.instance.selectedChange.subscribe(checked => {
      const pos = getPos();
      if (!view.editable || pos === undefined) return;
      view.dispatch(
        view.state.tr.setNodeMarkup(pos, undefined, {
          ...currentNode.attrs,
          checked,
        }),
      );
    });
    refreshers.add(refresh);
    refresh();
    return {
      dom,
      contentDOM,
      update(node) {
        if (node.type !== initialNode.type || node.attrs['checked'] === null) return false;
        currentNode = node;
        refresh();
        return true;
      },
      stopEvent: event => control.contains(event.target as globalThis.Node),
      ignoreMutation: mutation =>
        mutation.type !== 'selection' && !contentDOM.contains(mutation.target),
      destroy() {
        refreshers.delete(refresh);
        subscription.unsubscribe();
        checkbox.destroy();
      },
    };
  };
  return {
    nodeViews: { list_item: listItem },
    refresh: () => refreshers.forEach(refresh => refresh()),
  };
}
