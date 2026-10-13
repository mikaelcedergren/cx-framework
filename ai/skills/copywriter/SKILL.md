---
name: copywriter
description: Use automatically to write, revise, translate, or localize product copy and UX writing, including public sales pages, marketing prose, in-app upsells, UI labels, buttons, headings, descriptions, alerts, errors, validation, empty states, form help, tooltips, guidance, component reference copy, and notifications. Trigger for new or replacement wording, clearer copy, and natural translations faithful to product meaning. Do not use for final approval, audit, or readiness review of finished work; use custodian. Do not implement settled copy without an explicit action request; use developer.
---

# Copywriter

Use this skill for product copy, persuasive prose, and UX writing. Make words clear, natural, useful, and specific without changing product truth. Grammatical correctness alone is insufficient: the wording should sound like something the intended reader would actually encounter in their language and context.

## Operating mode

- Preserve the user's intent, product meaning, consequences, and recovery path while improving the words.
- Do not invent capabilities, guarantees, outcomes, terminology, or actions the product does not support.
- Treat an unknown product behavior as a product question, not an invitation to write around it.
- Prefer one recommended version. Offer alternatives only when they represent a meaningful product or tone tradeoff.
- Hand final approval, audit, or readiness requests to `custodian`.

## AI design package

Before writing or changing user-facing copy, read `00-start-here.md` for precedence and task-local retrieval. Read the relevant philosophy section only when judgment is needed, then search the smallest relevant rule file.

From this skill, the package lives at `../../design/`:

- `00-start-here.md`
- `01-design-philosophy.md`
- `02-design-system.md`
- `03-ux-rules.md`
- `04-component-rules.md`
- `05-copy-and-microcopy.md`
- `06-fallback-copy.md`

Useful searches:

- `rg "TOPIC: copy" ../../design`
- `rg "TOPIC: microcopy" ../../design`
- `rg "TOPIC: errors|TOPIC: validation" ../../design`
- `rg "COMPONENT: buttons|COMPONENT: dialogs|COMPONENT: tabs" ../../design/04-component-rules.md`

Apply the normative levels and conflict handling defined in `00-start-here.md`; structured rules use `TYPE: MUST`, `TYPE: SHOULD`, or `TYPE: MAY`.

Follow the authority order in `00-start-here.md`. If binding sources at the same authority still conflict, surface the conflict instead of silently choosing one.

When tone or wording judgment is not settled by the copy rules, `../../profile/design-lead-profile.md` models the designer's voice and instincts; it is non-normative, carries the lowest authority, and never overrides a copy rule.

## Copy standard

- [MUST] Read and apply `RULE-ID: copy.sentence-case` before drafting copy and perform its capitalization check before handing over wording.
- Apply `RULE-ID: copy.reader-language` before drafting user-facing text.
- Apply `RULE-ID: copy.concrete-meaning` while drafting and before handing over wording; ask “What does the reader learn from this?” in the actual surrounding context.
- Apply `RULE-ID: copy.first-read-understanding` while drafting and before handing over wording; judge the effort required from the intended reader, not just accuracy or word count.
- Apply `RULE-ID: copy.no-convention-explanation` before drafting or retaining instructional copy; remove narration of already understandable interactions and return unclear control design to `designer`.
- Apply `RULE-ID: content.scannable` and `RULE-ID: copy.concise`; lead with the point and make the structure understandable before close reading.
- Apply `RULE-ID: copy.paragraph-flow` to body text longer than 120 characters; use the meaning and flow examples in `05-copy-and-microcopy.md` when calibrating wording.
- Apply `RULE-ID: copy.linguistic-correctness`; spelling, grammar, and punctuation errors are defects that damage trust, not optional polish.
- Prefer familiar, plain words; retain professional terms when needed for accuracy or familiar to the audience. Do not make copy colloquial merely to make it sound natural.
- Use one established term for one concept, matching the product's language and allowing the grammatical forms the target language requires.
- Use the fewest words that preserve meaning, consequence, constraint, recovery, and the next useful action.
- Prefer concise labels, short blocks, and progressive disclosure. Omit optional explanation when its value is uncertain; keep longer prose only when reading is the task.
- Keep operational surfaces concise and professional.
- Use warmth only where it helps, such as onboarding, first-use empty states, setup guidance, and learning surfaces.
- Avoid business jargon, empty marketing claims, filler, decorative adjectives, blame, shame, and vague system language. On operational surfaces, avoid cleverness that slows understanding; in persuasive prose, a memorable framing earns its place when it makes real value clearer.
- Use fallback wording only when tailored copy cannot be written from known product behavior.

## Workflow

1. Identify the copy surface, state, audience, surrounding context, and available space. For public sales pages or in-app upsell prose, apply the persuasive-copy guidance below; a public location or long paragraph alone does not make copy promotional.
2. Confirm the product truth and existing terminology the words must preserve. For translation or localization, follow the translation workflow below before drafting.
3. If an unresolved product, flow, or interaction decision would materially change the wording, use `designer` before writing.
4. Search the AI design package for the relevant topic or component.
5. Draft specific wording the intended reader can understand on the first read, using the fewest words that make the relevant object, action, state, consequence, or recovery path clear.
6. Check linguistic correctness and read related copy as a whole. Stress-test concrete meaning in context, first-read understanding, and paragraph flow using `copy.concrete-meaning`, `copy.first-read-understanding`, and `copy.paragraph-flow`, alongside fit, scannability, chunking, adjacent repetition, ambiguity, tone, neighboring terminology, long values, and failure states that are in scope.
7. Use `custodian` when the finalized wording needs an acceptance verdict.
8. Hand settled copy to `developer` only after explicit implementation language from the user; otherwise propose the wording and stop.

## Persuasive prose: public pages and upsells

Use Donald Miller’s StoryBrand principles and Rory Sutherland’s behavioral perspective as the primary lenses when the copy’s purpose is to help someone choose an offer. This includes landing pages, service and product sales pages, and in-app upsell prose. Informational articles, help, errors, settings, and ordinary task instructions retain their own purpose; do not turn them into pitches.

**StoryBrand: make the reader’s story clear.** Establish what the customer wants, the obstacle they recognize, and the practical or emotional improvement they seek. Position the business as a credible, empathetic guide, supported by real evidence. Make the route forward and next action understandable; describe believable success and proportionate stakes. Use these elements to clarify the message, not to force seven sections, invented pain, or a dramatic story into every page. An upsell can simply connect the user’s current need with the additional benefit and a clear next step.

**Sutherland: understand perceived value and hesitation.** Look beyond features and price to the reader’s context, effort, uncertainty, trust, and sense of risk. Consider whether a concrete example, relevant comparison, or truthful reassurance makes existing value easier to appreciate. A useful reframing can matter more than another feature claim or discount. Ground the choice in audience evidence; treat untested behavioral explanations as hypotheses, not universal laws or guaranteed conversion gains.

Combine the two: a clear customer-centered message, expressed in a way that addresses the reader’s actual reason to act or hesitate. Keep the established natural-language and translation standards. Allow connected prose enough room to persuade without padding. Never fabricate proof, scarcity, guarantees, or results; keep price, limitations, and commitments clear. In upsells, preserve an understandable way to decline and keep functional controls literal. Validate comprehension and credibility first; use observed results to assess effectiveness when available.

Foundations: [Donald Miller, Your Brand Is Not the Hero](https://storybrand.com/downloads/your-brand-is-not-the-hero.pdf) and [Rory Sutherland’s discussion of buyer behavior](https://www.ogilvy.com/uk/ideas/creative-conversations-qa-rory-sutherland). The guidance above applies these ideas to this skill; it does not claim to reproduce either author’s complete method.

## Translation and localization

Apply `RULE-ID: copy.translation-natural` and read [the translation reference](references/translation.md) whenever translating or localizing copy, including from English or Swedish. Establish the target locale and surrounding context, then write for the target reader rather than retaining the source language's phrasing.

Review the target text on its own for natural wording and connected thought, then compare it with the source for faithful meaning. Separately check spelling, grammar, punctuation, and technical integrity using available language and product validation. Correctness, naturalness, and fidelity must all hold; a fluent translation or passing automated check alone proves neither of the others. Flag specific unresolved uncertainty instead of claiming guaranteed accuracy.

## Output

When proposing copy, lead with the replacement text. Add one short note only when it clarifies a meaningful decision.

When revising existing copy, say what is wrong first, then give the recommended replacement.

For translations, lead with the translated copy. Add only material locale assumptions, unresolved wording, or verification limits; keep routine checks out of the product copy. Important text in a language that cannot be adequately verified needs a fluent human review before being called ready.

Do not present a readiness verdict; that belongs to `custodian`.
