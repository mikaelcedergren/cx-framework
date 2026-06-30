# Fallback copy

## Purpose

This file is a safety net for shipping forms and error states without bespoke copy ready. When a designer or product owner has written specific copy for the situation, use that. When time allows, write tailored copy that fits the exact product context. When no better copy exists, use the closest message or pattern here so the product does not ship something vague, clever, or accidentally rude. The bar is good enough: clear, respectful, actionable, and safe enough to ship.

## Message patterns

Use these when there is no exact message in the catalog. Keep the same grammar as the closest pattern.

| Situation | Shape | Example |
| --- | --- | --- |
| Empty text field or missing typed value | `Enter a [thing].` | `Enter a URL.` |
| Invalid typed format | `Enter a valid [thing].` | `Enter a valid email.` |
| Format with a required shape | `Enter a [thing] in [format] format.` | `Enter an IP address in IPv4 format.` |
| Format with a useful example | `Enter a valid [thing], like [example].` | `Enter a valid IP address, like 192.168.0.1.` |
| Numeric or bounded range | `Enter a [thing] between [min] and [max].` | `Enter a port between 1024 and 65535.` |
| Picker or choice input | `Select a [thing].` | `Select a date.` |
| Multi-choice input | `Select at least one [thing].` | `Select at least one option.` |
| Specific cleanup action | `Remove [what to remove].` | `Remove spaces or invalid characters.` |
| Required value or protocol | `Use [correct value] only.` | `Use an https:// URL only.` |
| Constraint violation | `[Field] can't be [state]. [Action].` | `Date can't be in the future. Select today or a past date.` |
| Length, strength, or size issue | `[Field] is too [adjective]. [Action].` | `File is too large. Choose a smaller file.` |
| Positive requirement | `[Field] must be [requirement]. [Action].` | `Name must be unique. Use a different name.` |
| Duplicate | `[Thing] already exists. [Action].` | `Tag already exists. Use a different tag.` |
| Unsupported feature or value | `[Thing] isn't supported. Use [supported thing].` | `IPv6 isn't supported. Use IPv4.` |
| Problem plus fix | `[Problem]. [Action].` | `Invalid pattern. Update the regex to use a valid format.` |
| Server or request issue | `The [thing] can't be [state] right now. [Action].` | `The service can't be reached right now. Try again later.` |

## Choosing the right fallback

First decide where the message belongs, then how specific you can be. Use field-level inline validation when one field is empty, malformed, duplicated, or blocked; the message sits beneath that field. Empty-field messages should give the user a chance to act without sounding like they already failed, while messages for input that does not work should name the problem and guide toward the correct shape.

Use form-level alerts when the failure is not tied to one field — a failed request, an unavailable service, a denied permission, a timeout, or a conflict; the message appears in an alert at the top of the form.

When the failure is a constraint violation (future/past date, duplicate, unsupported value, length or size limit), reach for the matching message pattern and keep its grammar, stating both the problem and the fix.

Use generic last-resort copy only when nothing more specific applies: `This is required. Complete this field.` for a required field that cannot be named cleanly, and `Enter a valid value.` for an invalid value with no better label.

## Inline validation catalog

These messages appear directly beneath form fields. If the product uses a more specific field label, adapt the message to that label.

### URL

| Scenario | Error message |
| --- | --- |
| Empty / required | `Enter a URL.` |
| Invalid format | `Enter a valid URL with http:// or https:// and a domain name.` |
| Wrong protocol | `Use an https:// URL only.` |
| Invalid characters | `Remove spaces or invalid characters.` |
| Exceeds length | `URL is too long. Shorten it.` |
| Unreachable | `The URL can't be reached. Check the address or try again.` |
| Wrong protocol type | `Protocol isn't supported. Use http:// or https://.` |
| Server-side validation failure | `The URL can't be validated right now. Try again.` |
| Contains credentials | `The URL can't include credentials. Remove them.` |

### Email

| Scenario | Error message |
| --- | --- |
| Invalid format | `Enter a valid email.` |
| Domain blocked | `Email domain isn't allowed. Use a different email.` |
| Already taken | `Email is already in use. Use a different email.` |

### Password

| Scenario | Error message |
| --- | --- |
| Empty / required | `Enter a password.` |
| Complexity requirements | `Password must be 8 to 32 characters and include uppercase, lowercase, a number, and a symbol.` |
| Invalid characters | `Remove spaces or unsupported characters (like emojis or non-English letters).` |
| Too weak | `Password is too easy to guess. Use 8 to 32 characters with uppercase, lowercase, a number, and a symbol.` |
| Confirmation mismatch | `Passwords don't match. Enter the same password in both fields.` |
| Same as previous | `Password can't match your previous password. Use a new password.` |
| Contains username | `Password can't contain your username. Remove it.` |

### IP address

| Scenario | Error message |
| --- | --- |
| Empty / required | `Enter an IP address.` |
| Duplicate | `Enter a unique IP address.` |
| Out of range | `Enter an IP address inside the allowed range.` |
| Wrong format | `Enter an IP address in IPv4 format.` |
| Generic invalid | `Enter a valid IP address, like 192.168.0.1.` |
| Blocked | `This IP address isn't allowed. Enter a different IP address.` |
| Already exists | `This IP address is already in the list. Enter a different IP address.` |
| IPv6 attempted | `IPv6 isn't supported. Use IPv4.` |

### Name and text fields

| Scenario | Error message |
| --- | --- |
| Empty / required | `Enter a name.` |
| Too long | `Name is too long. Shorten it.` |
| Not unique | `Name must be unique. Use a different name.` |
| Invalid characters | `Name contains unsupported characters. Remove them.` |

### Number

| Scenario | Error message |
| --- | --- |
| Invalid format | `Enter a valid number.` |
| Out of range | `Enter a number inside the allowed range.` |
| Too low | `Enter a higher number.` |
| Too high | `Enter a lower number.` |
| Decimals not allowed | `Number can't include decimals. Use a whole number.` |

### Port range

| Scenario | Error message |
| --- | --- |
| Invalid port | `Enter a valid port number.` |
| Out of range | `Enter a port inside the allowed range.` |
| Specific range hint | `Enter a port between 1024 and 65535.` |
| Bad format | `Port range format isn't valid. Use a range like 80-443.` |

### Regex

| Scenario | Error message |
| --- | --- |
| Invalid pattern | `Invalid pattern. Update the regex to use a valid format.` |

### Date

| Scenario | Error message |
| --- | --- |
| Empty / required | `Select a date.` |
| Future not allowed | `Date can't be in the future. Select today or a past date.` |
| Past not allowed | `Date can't be in the past. Select today or a future date.` |
| Out of range | `Date must be within the allowed range. Select an allowed date.` |
| End before start | `End date must be after the start date. Select a later end date.` |

### Tag input

| Scenario | Error message |
| --- | --- |
| Duplicate | `Tag already exists. Use a different tag.` |
| Invalid format | `Tag format isn't valid. Remove unsupported characters.` |
| Limit reached | `Too many tags. Remove a tag before adding another.` |

### Textarea

| Scenario | Error message |
| --- | --- |
| Empty / required | `Enter text.` |
| Too long | `Text is too long. Shorten it.` |
| Invalid characters | `Text contains unsupported characters. Remove them.` |
| Bad formatting | `Text contains invalid formatting. Remove unsupported formatting.` |

### File upload

| Scenario | Error message |
| --- | --- |
| Wrong type | `File type isn't supported. Choose a supported file type.` |
| Too large | `File is too large. Choose a smaller file.` |
| General failure | `Upload failed. Try again.` |
| Corrupt file | `File is corrupted or unreadable. Choose another file.` |

### Dropdown

| Scenario | Error message |
| --- | --- |
| Single select dropdown, no selection | `Select an option.` |
| Multi select dropdown, no selection | `Select at least one option.` |

### Radio buttons

| Scenario | Error message |
| --- | --- |
| No selection | `Select an option.` |

### Checkboxes

| Scenario | Error message |
| --- | --- |
| No selection | `Select at least one option.` |

### Generic fallbacks

Use these only when nothing more specific applies.

| Scenario | Error message |
| --- | --- |
| Required field | `This is required. Complete this field.` |
| Invalid value | `Enter a valid value.` |

## Form-level alerts

These messages appear in an alert at the top of a form when the issue is not tied to one field.

| Scenario | Alert message |
| --- | --- |
| General server error | `The request failed. Try again.` |
| Service unavailable | `The service can't be reached right now. Try again later.` |
| Timeout | `The request took too long. Try again.` |
| Permission denied | `You don't have permission to perform this action. Ask an admin for access.` |
| Organization policy block | `This action isn't allowed by your organization's settings. Ask an admin to change it.` |
| Conflict | `This action conflicts with another change. Refresh and try again.` |
| Server-side validation | `Review the highlighted fields and try again.` |
| Rate limiting | `Too many requests. Try again later.` |
