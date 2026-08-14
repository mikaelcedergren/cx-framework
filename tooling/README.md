# Framework tooling

This is the concrete component-reference and workbench contract for Cortex. It documents real `cx-*` tooling and is not part of the platform-neutral AI design contract in `../ai/`.

They are part of the framework package because the reference page consumes them, but they are not product primitives or product patterns. Application screens should use `primitives/` and `patterns/` first.

`cx-slot-marker` marks projected content slots in reference previews. Use it to show where a slot exists; use component variants to show real product examples of what belongs in that slot.

## Public API fidelity

The workbench is a literal public-API inspector. It must not make a component appear more capable or configurable than its public contract.

- Expose every public input or prop under its exact public name or prop path, such as `mood`, `dismissible`, or `action.text`.
- Do not expose implementation helpers, scenario presets, visual hacks, or workbench-only values as component props.
- Keep outputs and event demonstrations outside the prop-control list.
- Put contextual reference information in `[cxWorkbenchNote]`, not in the specimen.
- Keep component controls in one full-width vertical stack.
- Keep preview width, preview height, alignment, and other shell controls in the shared workbench shell.
- Omit an individual shell control through its positive `show*Control` input only when changing it cannot expose meaningful behavior.

## Control mapping

Controls reveal the public type:

| Public value | Workbench control |
| --- | --- |
| boolean | switch |
| short string | text field |
| long, markdown, or multiline string | textarea |
| number | number field |
| explicitly bounded numeric range | slider when exact entry is not primary |
| small finite union | button group |
| larger finite union | select |
| large searchable set, such as icons | searchable select |
| multi-select value | multi-select control |
| optional or nullable value | its real omitted, empty, or `none` state |
| object | controls for its public fields using exact paths |
| array or collection | faithful repeated-item controls, or an explicit API review |

Never invent a fake default to avoid representing absence.

## Defaults, examples, and slots

- Show the plain normal default first.
- Start optional values inactive or empty, matching the real component defaults.
- Use variants for believable product examples, never as pretend prop controls.
- Use slot markers to reveal slot existence and variants to demonstrate realistic slot content.
- Instantiate only the active specimen through `cxActiveWorkbench`; inactive examples and their listeners, observers, and overlays must not exist.

## Stress coverage

Before a component reference is complete, probe every applicable risk it can reach: long and unbroken strings, empty and omitted values, numeric boundaries, every finite option, disabled and loading states, pointer and keyboard interaction, active and selected states, narrow and wide previews, awkward valid combinations, and invalid combinations that should fail clearly.

When public behavior changes, update the component implementation, public API, workbench controls and defaults, realistic variants, slot markers, structured guidance, public registry, and relevant tests together.
