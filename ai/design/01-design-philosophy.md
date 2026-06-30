# Design philosophy for AI

This document is a portable design and UX philosophy for AI agents that need to make product, interface, copy, and component decisions.

Use this before the rule lists when judgment matters. The rules say what to do. This document explains how to think.

## Core belief

Design exists to make a system feel natural to humans.

A computer system can be logically correct and still feel wrong. People do not experience software as a database, a routing tree, or an implementation model. They experience it through perception, expectation, emotion, hesitation, confidence, and trust. The right design is the one that carries enough of the system's complexity that the user can move naturally.

If a path feels natural, it is usually the right path even when it is less mechanically logical. If a path is logically neat but makes the user stop, decode, or feel stupid, it is wrong for the interface.

The user's mental model wins over internal structure.

## UX is applied human judgment

UX is not guessing, decoration, or endless user testing. It is expert judgment grounded in psychology, perception, human behavior, context, and real-world use.

Testing sharpens the work, but it is not the work. A chef does not need a focus group to know that salt sharpens flavor or that acid cuts richness. A designer should know the same kind of fundamentals: people scan before they read, prefer familiar patterns, avoid uncertainty, fear losing work, miss what is hidden, and trust consistency.

Treat confusion as evidence. If someone with product context finds a flow confusing, a customer will be confused faster and with less patience.

The product should never ask the user to prove they are smart enough to decode it.

## Discipline is freeing

A design system can look restrictive from the outside because it removes many choices: spacing, color roles, component shape, button hierarchy, field behavior, and copy patterns. That is the point.

Those choices were going to be made anyway. If the system makes them, designers and developers keep their attention for the decisions that actually need craft.

The system handles the seventy small decisions so the human can make the one or two perceptual calls that matter:

- whether spacing feels too tight even when it is technically on scale
- whether wording scans but still feels wrong
- whether a flow is logical but emotionally awkward
- whether visual weight pulls attention away from the real task

Discipline is not the enemy of creativity. It protects creative attention from being spent on decisions that should already be settled.

## Build with pieces

A product is built from pieces: tokens, components, patterns, and flows.

Screens are not drawn from scratch. They are composed from the system. A button is not one button; it is a component with states, sizes, moods, loading behavior, disabled behavior, and copy rules. A card is not one card; it is a shape for a particular kind of content. A form field is not local chrome; it is the same field behavior reused wherever a field appears.

When a component needs a new ability, extend the component. Do not bend one screen around it.

The loop is:

1. Use what the system already has.
2. If the system lacks the right answer, extend the system.
3. Use the new system capability in the feature.
4. Let the next feature inherit the improvement.

Every feature should leave the system a little stronger.

## Components are sealed

A component owns its template, styling, states, and internal rules. Consumers should not reach inside it with inline styles, parent overrides, global patches, specificity fights, or wrapper hacks.

If a component does not fit the real use case, reshape the component itself. Add a prop, variant, slot, state, or token that belongs to its public API.

Components own internal padding and chrome. Containers own gaps, margin, width, and layout. A component should not push its neighbors around with margin, because the right outside spacing depends on where it is used.

Sealed components compose into patterns. Patterns compose into products. If components leak, the whole system becomes a pile of exceptions that designers, developers, AI, and users can no longer trust.

## Tokens carry meaning

Do not choose tokens by appearance. Choose them by role.

Use `primary` because the action is primary, not because a particular blue or violet looks nice. Use `danger` because the action is destructive or risky, not because red is attractive. Use `surface-mid`, `surface-low`, and `surface-high` because they describe a surface's position, not because of their current color values.

The token holds the meaning. The theme decides what that meaning looks like.

This is what lets a product pivot: dark mode, high contrast, a brand refresh, a white-label version, or a visual retune should happen through tokens, not by rewriting every screen.

Use raw palette colors only when the hue itself is user-facing meaning, such as chart series, user-chosen tag colors, swatches, or explicit severity systems.

## Color is signal first

Color carries information before text is read. Red suggests danger or stop. Yellow suggests caution. Green suggests safety or success. The interface should treat color as meaning, not decoration.

But color alone is never enough. Not everyone sees color the same way, and even users with full color perception may be tired, rushed, in glare, or scanning quickly. Pair color with labels, icons, shape, position, or weight.

Surface area changes impact. A small colored mark reads as detail. A large colored area changes the whole mood of the page. Use large color fields carefully.

Opacity does much of the quiet hierarchy work:

- high opacity for readable supporting text
- mid opacity for borders and structure
- low opacity for soft backgrounds and quiet states
- ink for active, important, or selected content

## Surfaces are paper

Think of the interface as paper.

`surface-mid` is the default page. Most content lives there.

`surface-low` recedes. Use it for quieter, slightly sunken regions.

`surface-high` rises. Use it rarely for zones that need to feel more present, such as navigation or prominent panels.

Do not stack surfaces to fake depth. Use opacity for hierarchy on the same surface, borders to define units, and shadow only for floating elements such as dialogs, popovers, dropdowns, and tooltips.

Surface names describe perceived position, not literal lightness. The theme supplies the color.

## Consistency protects trust

Every interface teaches rules:

- where actions live
- what red means
- how buttons behave
- how menus group actions
- what words mean
- what shape implies interactivity

Users learn these rules without noticing. When the product follows them, the user stays in flow. When it breaks them, the user pauses and starts decoding.

Similar things should look and behave similarly. The same action should use the same label, position, component, color, and behavior across the product. If something is called "workspace" in one place, do not call it "project" elsewhere unless it is genuinely different.

Consistency is not aesthetic tidiness. It is a trust mechanism and a maintenance mechanism. It helps users learn the product and helps teams change the product from one place.

## Familiar patterns carry hidden meaning

Users arrive with years of pattern knowledge. Do not break that vocabulary.

- Checkboxes mean multi-select.
- Radio buttons mean one option from a short list.
- Dropdowns mean choosing from a longer set.
- Underlined text means link.
- Hover states imply interactivity.
- Disabled-looking controls imply unavailable action.
- Red destructive actions imply risk.

Borrow existing patterns whenever they fit. Invent only when no familiar pattern can express the job.

Breaking familiar meaning creates confusion even if the local design seems clever.

## Show less so the right thing can be seen

Showing more does not automatically give the user more value. More options, more metadata, more chrome, and more visible controls can make the important thing harder to find.

Start with the lightest structure that still communicates the content. Add affordance only when perception requires it.

Dense data does not require dense interface chrome. Let alignment, typography, opacity, and grouping do the work before adding borders, fills, tags, icons, and tooltips.

Ask what can be removed without reducing understanding.

## One unit gets one box

When something must feel like its own unit, use one signal:

- a border
- a subtle background
- a shadow
- a spacing boundary
- a clear typographic grouping

Do not stack all of them. Nested boxes, tinted cards inside cards, borders plus fills plus shadows, and heavy radius all compete for hierarchy.

Floating elements are the exception. Dialogs, popovers, dropdowns, and tooltips may use both border and shadow because the combined cue means "this is above the page."

Default radius should stay small, around 4px. Large radius is a semantic signal for softness, pills, avatars, or chip-like elements.

## Spacing creates rhythm

Use a 4px base. It keeps edges crisp, alignment predictable, and spacing coherent.

Useful defaults:

- 8px for close relationships such as labels, metadata, short text, and small inline groups
- 16px for separate groups, fields, sections, and elements with visual weight
- larger spacing only for real page pauses or major shifts

Typography is the exception. Type is fitted by perception, not forced onto the grid.

## Accessibility is perception

Accessibility is not a separate checklist. It is the same design done for the full range of humans.

Poor contrast, tiny text, flashing animation, color-only meaning, missing focus states, and mouse-only flows fail more than a small accessibility category. They fail tired users, rushed users, older users, distracted users, keyboard users, power users, colorblind users, and users in bad lighting.

Encode meaning through more than one channel. Make interactive elements keyboard reachable. Use visible focus. Keep contrast strong enough for real-world screens.

Design for messy human perception from the start.

## Feedback removes uncertainty

The user acts. The product responds.

That is the most basic interface contract. A click with no visible response feels broken even when the system is working. Silence makes one second feel like ten.

Respond near the user's attention:

- button state for a clicked button
- inline progress for local work
- skeletons for loading content
- a progress bar for measurable processes
- a clear message for failure
- a short confirmation for meaningful success

Speed matters less than certainty. Users wait better when they know what is happening.

## Trust is fragile

Trust is invisible until broken.

Protect it by making the product predictable, reversible where possible, and honest about consequences.

Destructive or irreversible actions need friction. Reversible actions should be easy. The dangerous path should require more attention than the safe path.

Warn before losing work. Preserve user input after errors. Let users inspect, adjust, undo, or understand automated choices. Never make leaving harder than joining, and never shame the user into staying.

The user should never be surprised by their own product.

## Voice depends on surface

The product does not have one voice. It has the right voice for the job.

Operational surfaces should be concise and professional:

- labels
- errors
- buttons
- status
- table values
- field help

Learning surfaces can be warmer:

- onboarding
- first-time empty states
- guidance panels
- setup explanations

Warm does not mean cute, fluffy, apologetic, or jokey. It means plain, kind, and useful.

When unsure, use concise.

## The AI should behave like a system-minded designer

When generating or reviewing UI, AI should:

- preserve the user's mental model over the implementation model
- start with the existing system before inventing new UI
- extend shared components instead of patching local screens
- choose tokens by meaning
- keep visible affordance clear but low-noise
- use familiar interaction patterns conventionally
- make feedback immediate and local
- prevent accidental actions
- write copy that tells the user what to do
- treat narrative principles as binding taste, not optional inspiration

If the output is technically correct but mentally awkward, it is not done.
