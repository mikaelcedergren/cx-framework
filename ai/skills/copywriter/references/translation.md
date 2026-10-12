# Natural, faithful translations

Use this reference for translation and localization, not ordinary same-language edits. It applies the standards in [the copy rules](../../../design/05-copy-and-microcopy.md), especially `copy.translation-natural`, `copy.linguistic-correctness`, `copy.terminology`, and `copy.truth`. The goal is copy that sounds originally written in the target language, not merely a grammatical rendering of source words.

## Establish meaning and context

Read the related text together: heading, action, hint, result, and relevant state. Establish the original language, target language and region, audience, formality or form of address, and product terminology from existing decisions. Do not silently mix regional variants or forms of address. Ask only when a missing choice changes meaning or the appropriate wording; use the established locale when available.

Find out what ambiguous actions actually do. Closing a notification is different from rejecting a finding, and a saved draft is different from a published item. Resource keys and short source strings may not provide enough context. Fix a clear source typo in the translation without rewriting the source file; surface an ambiguity that changes product meaning rather than guessing what the author intended.

Translate from the original when available. For Swedish source, do not routinely create an English version and translate that onward. If only an intermediary version exists, use it with that limitation in mind and seek the original when the wording is consequential or ambiguous.

## Write for the target reader

Keep the action, thought, and tone while allowing the target language to determine sentence structure, word order, connecting words, and sentence boundaries. Read paragraphs as connected thoughts, not a sequence of individually translated sentences. A grammatically possible phrase can still be unnatural; ask whether people use this combination of words in this situation.

Prefer familiar, precise vocabulary. Keep a professional term when it is necessary or is the audience's normal term; simplify its surrounding explanation instead of diluting the concept. Natural does not mean slang, casual address, added warmth, or extra explanation. Preserve the product's voice and the purpose of the surface.

Apply English-specific rules only to English. Follow target-language grammar, spelling, punctuation, and address conventions; preserve the framework's other copy principles and explicit product decisions. Do not force English capitalization or Swedish compounds into another language. Do not shorten away information merely to match the source's length.

## Reuse terminology with judgment

Consult the product's existing locale glossary and approved translations. Keep the same concept consistent while allowing inflection, agreement, and sentence structure. Do not automatically reuse a translated word where the same source word has a different meaning.

When corrections are accepted, retain them in the product's existing terminology or localization reference: concept, locale, preferred wording, relevant context, and any rejected wording with its reason. Distinguish approved terms from provisional suggestions. Do not create a universal glossary in this portable skill, turn one correction into an all-purpose ban, or copy private product text into external lookup tools. Where usage is uncertain, consult suitable dictionaries, official language references, or established domain terminology rather than trusting the first search result.

## Review through different lenses

First read only the target text. Does it sound natural for this audience and surface? Check familiar word combinations, references between sentences, logical connections, unnecessary formality, and awkward traces of the source language. Revise wording that is understandable only after mentally reconstructing the original.

Then compare with the source and product context. Check omissions and additions, negation, actor, object, timing, conditions, certainty, permissions, numbers, consequences, and recovery. In particular, preserve distinctions such as can versus must, temporary versus permanent, and unavailable versus nonexistent. A smoother sentence must not introduce a promise. Translating back can help diagnose a discrepancy, but matching a back-translation does not prove accuracy or naturalness.

Separately proofread spelling, grammar, gender and number agreement where applicable, punctuation, capitalization, and word formation. Use existing locale-aware spelling and grammar tools when available, reviewing their suggestions against approved names and terms. Do not silently install a new tool, claim a check ran when it did not, or treat a model's confidence as linguistic evidence.

For interface resources, use the existing localization parser and checks to preserve keys, placeholders, markup, links, and formatting syntax. Reorder placeholders as grammar requires without renaming or dropping them. Check plural/select branches required by the target language, including representative values, and avoid concatenated fragments that prevent natural grammar. If the resource structure cannot express the translation correctly, surface its owner rather than breaking syntax or forcing unnatural text.

Inspect the assembled interface when available: long translations, substituted values, wrapping, clipping, reading direction, and nearby labels can change understanding. Treat a source-only or text-only review as such; do not claim rendered fit without observing it. Keep locale-specific dates, numbers, and units consistent with the product contract rather than manually changing their meaning.

## Calibrate with context

These examples illustrate decisions, not a glossary or evidence of human review.

| Context | Translation decision | What changes the answer |
| --- | --- | --- |
| English `Dismiss` closes a notification; target is Swedish | `Stäng` names the actual action naturally. | If the action rejects a finding, determine that meaning; do not mechanically reuse the closing label. |
| English `We couldn't save your changes. Try again.`; retry is supported; target is Swedish | `Det gick inte att spara dina ändringar. Försök igen.` preserves failure and recovery without mirroring the English speaker. | Do not add retry when the source or known behavior does not support it. |
| Swedish `Du behöver inte betala nu.`; target is English | `You do not need to pay now.` preserves the current obligation. | `You will never be charged.` invents a promise even though it sounds fluent. |
| A translated message contains a count and an item name | Keep both placeholders intact and use the target language's required grammatical branches. | A correct singular example does not verify zero, plural, long names, or agreement elsewhere. |

For a new task, test one variation that challenges the proposed wording: a different action meaning, a negative condition, an unfamiliar term, or a plural value. Do not require every possible variation for a single label.

## Handoff and trust

Deliver the translation with only material assumptions or unresolved questions. Say which wording or interpretation needs verification and why, rather than attaching a vague warning to every translation. Preserve source/target mapping when needed for implementation. Keep review notes outside the user-facing text.

A second reading by the same model is not independent verification. Important copy in a language that cannot be adequately checked needs a fluent human reviewer before readiness is claimed. Escalate a meaning-changing uncertainty before release; routine terminology and tool checks can proceed without asking the user about each word. Keep the distinction between a drafted translation, tool-checked text, and human-reviewed text honest. Use Custodian for the acceptance verdict under the skill's established handoff.
