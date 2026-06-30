# Start here

This folder is a portable AI design reference. It gives an AI agent enough product judgment, interface rules, component behavior, and copy guidance to make consistent user-facing decisions in another product.

Use it as a complete package. Do not ask for additional source material before applying it.

## Read order

1. `01-design-philosophy.md` for judgment, taste, and decision-making principles.
2. `02-ux-rules.md` for cross-cutting interface rules.
3. `03-component-rules.md` for component-specific behavior.
4. `04-copy-and-microcopy.md` for voice, labels, buttons, errors, validation, and empty states.
5. `05-fallback-copy.md` when no tailored validation or alert copy exists.

## Rule strength

Rules use three strength levels:

- `must` means the rule is binding.
- `should` means the rule is the default unless a specific product need outweighs it.
- `may` means the pattern is allowed when the context supports it.

When rules appear to conflict, choose the path that best protects the user's mental model, prevents accidental harm, and makes the interface easiest to understand.

## How to apply

Before designing or changing a user-facing surface:

1. Read the relevant philosophy section.
2. Search the rule files by `TOPIC:` or `COMPONENT:`.
3. Apply the strongest matching rule.
4. If the system lacks the needed component behavior, extend the shared system instead of patching one screen.
5. Use fallback copy only when better, situation-specific copy is not available.

## Non-negotiables

- Preserve the user's mental model over internal structure.
- Prefer documented patterns before inventing new ones.
- Make feedback immediate, local, and clear.
- Prevent accidental destructive or irreversible actions.
- Choose tokens by meaning, not appearance.
- Keep affordance visible without adding unnecessary chrome.
- Write copy that names the object, action, state, or fix.
- Treat confusion as a design problem, not a user problem.
