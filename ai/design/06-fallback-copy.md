# Fallback copy

This file is the last-resort wording catalog in the framework spec.

> **Normative language:** `[MUST]` is mandatory; `[SHOULD]` is the default unless a concrete product reason justifies departure; `[MAY]` is optional; `[NOTE]` is non-normative and cannot override a rule. A marker governs only its paragraph or list item and any unmarked entries in one list, table, or code block it directly introduces; it never crosses a paragraph or heading boundary. Unlabelled prose with no inherited marker is `[NOTE]`. See `00-start-here.md` for the canonical definitions, precedence, and conflict handling.

[MUST] Apply the binding language rules in `05-copy-and-microcopy.md` first.

## Purpose

[NOTE] This catalog is the fallback resource referenced by `RULE-ID: copy.errors.fallback`; that rule owns when fallback wording is allowed.

[MUST] Never let fallback wording invent policy, capability, validation limits, supported formats, permission models, or recovery.

[NOTE] Before using a pattern:

1. [MUST] Confirm what the product actually knows.
2. [MUST] Decide whether the message belongs to one field or the whole request.
3. [MUST] Replace every bracketed value with a known product value.
4. [MUST] If a required value is unknown, resolve the product question instead of guessing.
5. [SHOULD] Prefer the consuming product's established terminology.

## Safe message patterns

[MAY] Use the following patterns when their known situation matches exactly.

| Known situation | Pattern |
| --- | --- |
| Required typed value | `Enter [thing].` |
| Invalid known format | `Enter [thing] in [known format] format.` |
| Useful known example | `Enter [thing], like [known example].` |
| Known numeric range | `Enter [thing] between [known minimum] and [known maximum].` |
| Required choice | `Select [thing].` |
| Required multi-choice | `Select at least one [thing].` |
| Known disallowed content | `Remove [known disallowed content].` |
| Known requirement | `[Field] must [known requirement]. [Known recovery].` |
| Known duplicate | `[Thing] already exists. [Known recovery].` |
| Known unsupported value | `[Thing] isn't supported. Use [known supported option].` |
| Known size or length limit | `[Thing] is too [large/long/short]. [Known recovery].` |
| Known temporary failure | `[Thing] can't be [completed/reached] right now. [Known recovery].` |

[MUST] Do not leave bracketed text in shipped copy.

## Inline validation

[MUST] Apply `RULE-ID: forms.local-error` to determine whether a failure belongs to one field or the whole request.

### Generic required and invalid values

[MAY] Use an exact-matching fallback from this table.

| Situation | Fallback |
| --- | --- |
| Required named value | `Enter [field name].` |
| Required unnamed value | `Complete this field.` |
| Required choice | `Select [option type].` |
| Required multi-choice | `Select at least one [option type].` |
| Invalid value with no known detail | `Enter a valid [field name].` |

### URL

[MAY] Use an exact-matching fallback from this table.

| Known situation | Fallback |
| --- | --- |
| Required | `Enter a URL.` |
| Invalid | `Enter a valid URL.` |
| Known required protocol | `Use a URL that starts with [supported protocol].` |
| Unreachable | `The URL can't be reached. Check the address or try again.` |
| Validation unavailable | `The URL can't be validated right now. Try again.` |

[MUST] Do not claim that one protocol, credential shape, hostname, or URL length is unsupported unless the product enforces that rule.

### Email

[MAY] Use an exact-matching fallback from this table.

| Known situation | Fallback |
| --- | --- |
| Required | `Enter an email address.` |
| Invalid | `Enter a valid email address.` |
| Known duplicate | `Email address is already in use. Use a different email address.` |
| Known domain restriction | `Email domain isn't allowed. Use an allowed email address.` |

### Password

[MAY] Use an exact-matching fallback from this table.

| Known situation | Fallback |
| --- | --- |
| Required | `Enter a password.` |
| Known requirement | `Password must [known requirement].` |
| Confirmation mismatch | `Passwords don't match. Enter the same password in both fields.` |
| Known reuse restriction | `Password can't match [known previous-password rule]. Use a different password.` |

[MUST] Never invent length, complexity, character-set, language, symbol, or password-history policy. State only the requirements enforced by the product.

### Network address or identifier

[MAY] Use an exact-matching fallback from this table.

| Known situation | Fallback |
| --- | --- |
| Required | `Enter [identifier name].` |
| Invalid format | `Enter [identifier name] in [known format] format.` |
| Known duplicate | `[Identifier name] already exists. Enter a different value.` |
| Known unsupported version | `[Version] isn't supported. Use [supported version].` |
| Known blocked value | `This [identifier name] isn't allowed. Enter a different value.` |

[MUST] Do not assume IPv4, IPv6, port, protocol, range, or address policy without product evidence.

### Name and text

[MAY] Use an exact-matching fallback from this table.

| Known situation | Fallback |
| --- | --- |
| Required name | `Enter a name.` |
| Known maximum length | `Name is too long. Use [known maximum] characters or fewer.` |
| Known uniqueness requirement | `Name must be unique. Use a different name.` |
| Known character restriction | `Name contains unsupported characters. Remove [known unsupported characters].` |

### Number or range

[MAY] Use an exact-matching fallback from this table.

| Known situation | Fallback |
| --- | --- |
| Invalid number | `Enter a valid number.` |
| Known range | `Enter a number between [known minimum] and [known maximum].` |
| Known minimum | `Enter a number of at least [known minimum].` |
| Known maximum | `Enter a number no greater than [known maximum].` |
| Whole number required | `Enter a whole number.` |

### Date

[MAY] Use an exact-matching fallback from this table.

| Known situation | Fallback |
| --- | --- |
| Required | `Select a date.` |
| Future disallowed | `Date can't be in the future. Select today or an earlier date.` |
| Past disallowed | `Date can't be in the past. Select today or a later date.` |
| Known range | `Select a date between [known start] and [known end].` |
| End before start | `End date must be after the start date. Select a later end date.` |

### File upload

[MAY] Use an exact-matching fallback from this table.

| Known situation | Fallback |
| --- | --- |
| Known unsupported type | `File type isn't supported. Choose [known supported type].` |
| Known size limit | `File is too large. Choose a file smaller than [known limit].` |
| Unreadable file | `File can't be read. Choose another file.` |
| Upload failure | `Upload failed. Try again.` |

## Form- and request-level alerts

[NOTE] These patterns cover failures that `RULE-ID: forms.local-error` assigns to form or request level rather than one field.

[MAY] Use an exact-matching fallback from this table.

| Known situation | Fallback |
| --- | --- |
| Unknown request failure | `The request failed. Try again.` |
| Known unavailable service | `The service can't be reached right now. Try again later.` |
| Known timeout | `The request took too long. Try again.` |
| Known permission failure | `You don't have permission to [known action].` |
| Known policy restriction | `This action isn't allowed by [known policy name].` |
| Known conflict | `This conflicts with another change. Refresh and try again.` |
| Server-side field validation | `Review the highlighted fields and try again.` |
| Known rate limit | `Too many requests. Try again [known retry time].` |

[MUST] Do not tell the user to contact an administrator, owner, support team, or organization unless that recovery path exists in the consuming product.
