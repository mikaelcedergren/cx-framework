import type { CxIconName } from "../../icons/manifest";

/** A platform-owned action. Query actions prefill the question without sending it. */
export interface CxAssistantAction {
  id: string;
  label: string;
  description?: string;
  icon?: CxIconName;
  keywords?: readonly string[];
  query?: string;
  disabled?: boolean;
}
export interface CxAssistantContext {
  id: string;
  label: string;
  /** Only explicitly supplied context is sent to the responder. */
  detail?: string;
}
export interface CxAssistantAnswer {
  text: string;
  source?: string;
  action?: CxAssistantAction;
  stats?: readonly { label: string; value: string }[];
}
export interface CxAssistantTurn {
  question: string;
  answer: CxAssistantAnswer;
}
export interface CxAssistantRequest {
  question: string;
  context: CxAssistantContext | null;
  history: readonly CxAssistantTurn[];
  signal: AbortSignal;
}
export type CxAssistantResponder = (
  request: CxAssistantRequest,
) => Promise<CxAssistantAnswer>;
export type CxAssistantPicker = (
  element: Element,
) => { element: HTMLElement; context: CxAssistantContext } | null;

export function filterAssistantActions(
  actions: readonly CxAssistantAction[],
  query: string,
): readonly CxAssistantAction[] {
  const normalize = (value: string) =>
    value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
  const term = normalize(query).replace(
    /^(?:go to|open|navigate to|take me to)\s+/,
    "",
  );
  if (!term) return [];
  return actions
    .map((action, index) => {
      const label = normalize(action.label);
      const text = normalize(
        [action.label, action.description, ...(action.keywords ?? [])].join(
          " ",
        ),
      );
      return {
        action,
        index,
        rank: label === term ? 0 : label.startsWith(term) ? 1 : 2,
        matches: term.split(" ").every((word) => text.includes(word)),
      };
    })
    .filter((item) => item.matches)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((item) => item.action);
}
