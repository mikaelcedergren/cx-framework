# Design philosophy for AI

Use this document when a task requires judgment rather than a direct rule lookup. It explains the product instincts behind the portable rules without repeating them.

## Mental fit before mechanical logic

People experience software through perception, expectation, hesitation, confidence, and trust. They do not experience its database, route tree, or internal ownership model.

Preserve the user's mental model over the implementation model. A technically neat structure is still wrong when it makes the user stop and decode the product. If a flow feels mentally awkward, redesign the flow instead of explaining the machinery.

## Discipline protects attention

A design system deliberately settles recurring decisions: spacing, token roles, component shape, interaction behavior, state treatment, and language patterns. That discipline saves judgment for the few decisions that genuinely depend on context and perception.

Use the system as the starting point, not as inspiration. A feature should compose existing tokens, components, and patterns. When a repeatable need is missing, strengthen the shared owner within the approved scope so later features inherit the improvement.

## Components are sealed pieces

A component owns its template, presentation, internal spacing, states, and behavior. Containers own placement, width, surrounding gap, and page composition.

Do not reach into a component from a consumer with deep selectors, inline visual patches, specificity battles, or wrapper tricks. If the clean fix belongs to another owner outside the task's scope, surface that boundary instead of hiding the problem locally.

Opinionated components are useful. Their public API should express meaningful product variation, not every technically possible styling knob. Defaults should represent normal use, not a maximal demonstration.

## Tokens carry meaning

Choose tokens by role, not appearance. `primary` describes the main forward action; `danger` describes destructive or risky intent; surfaces describe planes; opacity describes hierarchy. A theme decides how those roles look.

Raw hue is appropriate only when hue itself is data or a user choice, such as a chart series, swatch, or chosen tag color. Meaning still needs another perceptual channel.

## Calm requires visible affordance

Low-noise UI is not hidden UI. Remove chrome that does not clarify structure, action, state, or priority, but keep interactive elements visibly reachable. Current location, selected state, keyboard focus, destructive intent, and recovery paths must never become guesses.

Dense information can remain dense. The goal is to reduce interface chrome around it. Use alignment, spacing, typography, and semantic weight before adding another box, border, fill, icon, or label.

## One unit gets one boundary

Visual hierarchy weakens when every unit receives a border, tint, radius, shadow, and nested container. Start with the lightest signal that makes a unit legible. Floating elements may combine a surface with shadow because elevation is their meaning; grounded content usually should not.

## Consistency is learned behavior

Every repeated interaction teaches the user what labels mean, where actions live, what color signals, and how a control behaves. Similar things must remain similar enough that this learning transfers.

Consistency is not sameness without context. Preserve the same concept and behavior; allow the surrounding layout to adapt to the task.

## Feedback protects trust

The user acts and the product responds. Visible, local feedback reduces more uncertainty than a silent speed improvement. Match the signal to what the system truly knows: activity for unknown progress, determinate progress for measured work, and clear words for failure or recovery.

Never manufacture progress, certainty, capability, or outcome to make the interface feel better. Trust depends on truthful state.

## Safety follows consequence

Reversible actions can be easy. Destructive, costly, or irreversible actions need clearer consequence and more deliberate intent. Preserve entered work after failure, warn before losing unsaved changes, and provide undo when the product can support it.

The product should absorb accidental human behavior rather than punish it.

## Accessibility is perception

Accessibility is the same design under real human variation: keyboard use, poor lighting, reduced vision, distraction, fatigue, motor constraints, color-vision differences, and motion sensitivity.

Encode meaning through more than one channel. Keep interaction keyboard reachable, focus perceivable, contrast durable, and motion purposeful. Design these qualities into the component contract rather than adding them as release polish.

## Voice follows the surface

Operational surfaces need concise, specific language. Learning surfaces may be warmer. Warmth means plain, kind, and useful; it does not mean cute, apologetic, or vague.

Words must preserve product truth. When behavior, consequence, or terminology is unknown, resolve the product question before writing around it.

## Finished-product judgment

Before handoff, ask:

- Does the structure match how the user thinks?
- Is the primary task obvious without decoding?
- Is every reachable state understandable and recoverable?
- Is the system being used or strengthened at the owning layer?
- Can anything be removed without reducing understanding?
- Are the claims, progress, consequences, and words truthful?

If the output is technically correct but mentally awkward, it is not finished.
