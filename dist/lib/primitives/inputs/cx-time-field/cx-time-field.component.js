import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Injector, Input, Output, ViewChild, afterNextRender, computed, inject, signal, } from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message/index.js';
import { CxSpinnerComponent } from '../../feedback/cx-spinner/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { normalizeCxValidation, normalizeCxValidationMessages, } from '../shared/field.types.js';
import * as i0 from "@angular/core";
export function parseCxTimeValue(value) {
    const normalizedValue = value?.trim() ?? '';
    if (!normalizedValue) {
        return null;
    }
    const match = normalizedValue.match(/^(\d{1,2})(?::?(\d{2}))?(?:\s*([ap]m))?$/i);
    if (!match) {
        return null;
    }
    let hourText = match[1] ?? '';
    let minuteText = match[2] ?? '';
    const meridiem = match[3]?.toUpperCase();
    const digits = normalizedValue.replace(/[^0-9]/g, '');
    if (!minuteText && /^\d{3,4}$/.test(digits)) {
        if (digits.length === 3) {
            hourText = digits.slice(0, 1);
            minuteText = digits.slice(1);
        }
        else {
            hourText = digits.slice(0, 2);
            minuteText = digits.slice(2, 4);
        }
    }
    if (!minuteText) {
        minuteText = '00';
    }
    const rawHour = Number.parseInt(hourText, 10);
    const rawMinute = Number.parseInt(minuteText, 10);
    if (!Number.isFinite(rawHour) || !Number.isFinite(rawMinute)) {
        return null;
    }
    if (rawMinute < 0 || rawMinute > 59) {
        return null;
    }
    let hours24 = rawHour;
    if (meridiem) {
        if (rawHour < 1 || rawHour > 12) {
            return null;
        }
        hours24 = meridiem === 'AM' ? rawHour % 12 : (rawHour % 12) + 12;
    }
    else if (rawHour < 0 || rawHour > 23) {
        return null;
    }
    return {
        hours24,
        minutes: rawMinute,
    };
}
export function formatCxTimeValue(hours24, minutes) {
    const normalizedHours24 = clamp(hours24, 0, 23);
    const normalizedMinutes = clamp(minutes, 0, 59);
    return `${padTwoDigits(normalizedHours24)}:${padTwoDigits(normalizedMinutes)}`;
}
export class CxTimeFieldComponent {
    static nextId = 0;
    host = inject((ElementRef));
    injector = inject(Injector);
    modeState = signal('default', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "modeState" }] : /* istanbul ignore next */ []));
    sizeState = signal('default', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "sizeState" }] : /* istanbul ignore next */ []));
    hours24State = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hours24State" }] : /* istanbul ignore next */ []));
    minutesState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "minutesState" }] : /* istanbul ignore next */ []));
    hourTextState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hourTextState" }] : /* istanbul ignore next */ []));
    minuteTextState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "minuteTextState" }] : /* istanbul ignore next */ []));
    meridiemState = signal('AM', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "meridiemState" }] : /* istanbul ignore next */ []));
    minuteStepState = signal(1, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "minuteStepState" }] : /* istanbul ignore next */ []));
    minState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "minState" }] : /* istanbul ignore next */ []));
    maxState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "maxState" }] : /* istanbul ignore next */ []));
    validationState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "validationState" }] : /* istanbul ignore next */ []));
    focusedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "focusedState" }] : /* istanbul ignore next */ []));
    committedValueState = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "committedValueState" }] : /* istanbul ignore next */ []));
    dirtyDraftState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "dirtyDraftState" }] : /* istanbul ignore next */ []));
    lastEmittedValue;
    refocusPending = false;
    labelId = `cx-time-field-label-${CxTimeFieldComponent.nextId}`;
    messagesId = `cx-time-field-messages-${CxTimeFieldComponent.nextId++}`;
    hourFieldRef;
    minuteFieldRef;
    meridiemButtonRef;
    label = 'Time';
    ariaLabel;
    hourAriaLabel = 'Hours';
    minuteAriaLabel = 'Minutes';
    optional = false;
    disabled = false;
    loading = false;
    clearable = false;
    hint;
    set mode(value) {
        const mode = value === '12h' ? '12h' : 'default';
        if (mode === this.modeState()) {
            return;
        }
        this.modeState.set(mode);
        if (this.committedValueState() && !this.dirtyDraftState()) {
            this.syncDraftFromCanonical(true);
        }
    }
    set size(value) {
        this.sizeState.set(value === 'small' || value === 'large' ? value : 'default');
    }
    set minuteStep(value) {
        const numeric = Number(value);
        const nextStep = Number.isFinite(numeric) ? clamp(Math.floor(numeric), 1, 59) : 1;
        if (nextStep === this.minuteStepState()) {
            return;
        }
        this.minuteStepState.set(nextStep);
        const committedValue = this.committedValueState();
        if (!committedValue || this.dirtyDraftState()) {
            return;
        }
        const nextMinutes = snapToMinuteStep(committedValue.minutes, nextStep);
        if (nextMinutes === committedValue.minutes) {
            return;
        }
        const nextValue = { ...committedValue, minutes: nextMinutes };
        this.committedValueState.set(nextValue);
        this.hours24State.set(nextValue.hours24);
        this.minutesState.set(nextValue.minutes);
        this.syncDraftFromCanonical(true);
        queueMicrotask(() => this.emitCommittedValue());
    }
    set min(value) {
        this.minState.set(value?.trim() || undefined);
    }
    set max(value) {
        this.maxState.set(value?.trim() || undefined);
    }
    set validation(value) {
        this.validationState.set(value ?? undefined);
    }
    set value(value) {
        const parsedValue = parseCxTimeValue(value);
        if (!parsedValue) {
            this.clearDraft();
            this.lastEmittedValue = undefined;
            return;
        }
        this.setCanonicalValue(parsedValue);
        this.lastEmittedValue = this.formattedCommittedValue();
    }
    valueChange = new EventEmitter();
    focusChange = new EventEmitter();
    clear = new EventEmitter();
    hourText$ = this.hourTextState.asReadonly();
    minuteText$ = this.minuteTextState.asReadonly();
    mode$ = this.modeState.asReadonly();
    size$ = this.sizeState.asReadonly();
    meridiem$ = this.meridiemState.asReadonly();
    is12h$ = computed(() => this.modeState() === '12h', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "is12h$" }] : /* istanbul ignore next */ []));
    isEmpty$ = computed(() => !this.hourTextState() && !this.minuteTextState(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isEmpty$" }] : /* istanbul ignore next */ []));
    outOfRange$ = computed(() => {
        const value = this.currentValue();
        if (!value) {
            return false;
        }
        const min = parseCxTimeValue(this.minState());
        const max = parseCxTimeValue(this.maxState());
        const currentMinutes = this.totalMinutes(value);
        return (min && currentMinutes < this.totalMinutes(min)) || (max && currentMinutes > this.totalMinutes(max));
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "outOfRange$" }] : /* istanbul ignore next */ []));
    validationMessages$ = () => {
        if (this.disabled) {
            return [];
        }
        const explicitValidation = normalizeCxValidation(this.validationState());
        const explicitError = explicitValidation.find(message => message.type === 'error');
        if (explicitError) {
            return [explicitError];
        }
        const messages = [];
        const invalidDraftMessage = this.invalidDraftMessage();
        if (invalidDraftMessage) {
            messages.push({ type: 'error', message: invalidDraftMessage });
        }
        if (this.outOfRange$()) {
            messages.push({ type: 'error', message: this.rangeValidationMessage() });
        }
        const builtInMessages = normalizeCxValidationMessages(messages).slice(0, 1);
        if (builtInMessages.length > 0) {
            return builtInMessages;
        }
        return explicitValidation;
    };
    hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
    showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
    isLocked$ = () => this.disabled || this.loading;
    shellFocused$ = this.focusedState.asReadonly();
    hasClear$ = () => this.clearable && !this.isEmpty$() && !this.disabled && !this.loading;
    get resolvedGroupAriaLabel() {
        const ariaLabel = this.ariaLabel?.trim();
        if (ariaLabel) {
            return ariaLabel;
        }
        if (this.label.trim()) {
            return undefined;
        }
        return 'Time';
    }
    get resolvedGroupAriaLabelledBy() {
        if (this.ariaLabel?.trim()) {
            return undefined;
        }
        return this.label.trim() ? this.labelId : undefined;
    }
    get resolvedGroupAriaDescribedBy() {
        const ids = [];
        if (this.showHint$() || this.validationMessages$().length > 0) {
            ids.push(this.messagesId);
        }
        return ids.length > 0 ? ids.join(' ') : undefined;
    }
    onFocusIn() {
        if (this.isLocked$() || this.focusedState()) {
            return;
        }
        this.focusedState.set(true);
        this.focusChange.emit(true);
    }
    onFocusOut(event) {
        if (this.refocusPending) {
            return;
        }
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && this.host.nativeElement.contains(nextTarget)) {
            return;
        }
        this.commitDraftOnExit();
        if (!this.focusedState()) {
            return;
        }
        this.focusedState.set(false);
        this.focusChange.emit(false);
    }
    onShellMousedown(event) {
        if (this.isLocked$()) {
            return;
        }
        const target = event.target;
        if (!target || target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button')) {
            return;
        }
        event.preventDefault();
        this.focusSegment('hour');
    }
    onSegmentFocus(segment) {
        if (this.isLocked$()) {
            return;
        }
        this.selectSegmentText(segment);
    }
    onSegmentPointerUp(segment, event) {
        if (this.isLocked$()) {
            return;
        }
        event.preventDefault();
        this.selectSegmentText(segment);
    }
    onSegmentInput(segment, event) {
        if (this.isLocked$()) {
            return;
        }
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        const digits = target.value.replace(/\D/g, '').slice(0, 2);
        this.setSegmentText(segment, digits);
        this.dirtyDraftState.set(true);
        if (digits.length === 1 && shouldAutoPadSingleDigit(segment, digits, this.modeState())) {
            this.setSegmentText(segment, normalizeSegmentDraft(segment, `0${digits}`, this.modeState(), this.minuteStepState()));
            this.commitSegment(segment);
            this.focusNextSegment(segment);
            return;
        }
        if (digits.length === 2) {
            this.commitSegment(segment);
            this.focusNextSegment(segment);
            return;
        }
        this.positionSegmentCaret(segment, digits.length);
    }
    onSegmentKeydown(segment, event) {
        if (this.isLocked$()) {
            return;
        }
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        if (event.metaKey || event.ctrlKey || event.altKey) {
            return;
        }
        if (/^\d$/.test(event.key)) {
            event.preventDefault();
            const completed = this.handleDigit(segment, event.key, shouldReplaceSelection(target));
            if (completed) {
                this.focusNextSegment(segment);
            }
            return;
        }
        switch (event.key) {
            case 'Backspace':
                event.preventDefault();
                this.handleBackspace(segment, target);
                return;
            case 'Delete':
                event.preventDefault();
                this.handleDelete(segment, target);
                return;
            case ':':
            case 'ArrowRight':
                event.preventDefault();
                this.commitSegment(segment);
                this.focusNextSegment(segment);
                return;
            case 'ArrowLeft':
                event.preventDefault();
                this.commitSegment(segment);
                this.focusPreviousSegment(segment);
                return;
            case 'ArrowUp':
                event.preventDefault();
                this.adjustSegment(segment, 1, event.shiftKey);
                return;
            case 'ArrowDown':
                event.preventDefault();
                this.adjustSegment(segment, -1, event.shiftKey);
                return;
            case 'Enter':
                event.preventDefault();
                this.commitSegment(segment);
                return;
            case 'Tab':
                this.commitSegment(segment);
                return;
            default:
                if (event.key.length === 1) {
                    event.preventDefault();
                }
        }
    }
    onSegmentPaste(event) {
        if (this.isLocked$()) {
            return;
        }
        event.preventDefault();
        const pastedText = event.clipboardData?.getData('text') ?? '';
        const parsedValue = parseCxTimeValue(pastedText);
        if (!parsedValue) {
            return;
        }
        this.setCanonicalValue(parsedValue);
        this.emitCommittedValue();
    }
    onMeridiemClick() {
        if (this.isLocked$() || !this.is12h$()) {
            return;
        }
        this.toggleMeridiem();
    }
    onMeridiemKeydown(event) {
        if (this.isLocked$() || !this.is12h$()) {
            return;
        }
        switch (event.key) {
            case 'ArrowUp':
            case 'ArrowDown':
            case 'Enter':
            case ' ':
                event.preventDefault();
                this.toggleMeridiem();
                return;
            case 'a':
            case 'A':
                event.preventDefault();
                this.setMeridiem('AM');
                return;
            case 'p':
            case 'P':
                event.preventDefault();
                this.setMeridiem('PM');
                return;
            case 'ArrowLeft':
                event.preventDefault();
                this.focusSegment('minute');
                return;
            default:
                return;
        }
    }
    onClear(event) {
        if (!this.hasClear$()) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.clearDraft();
        this.emitValue(undefined, true);
        this.clear.emit();
        this.refocusPending = true;
        afterNextRender(() => {
            this.focusSegment('hour');
            this.refocusPending = false;
        }, { injector: this.injector });
    }
    setCanonicalValue(value) {
        const normalizedValue = {
            hours24: clamp(value.hours24, 0, 23),
            minutes: snapToMinuteStep(value.minutes, this.minuteStepState()),
        };
        this.hours24State.set(normalizedValue.hours24);
        this.minutesState.set(normalizedValue.minutes);
        this.committedValueState.set(normalizedValue);
        this.dirtyDraftState.set(false);
        this.syncDraftFromCanonical(true);
    }
    clearDraft() {
        this.hours24State.set(0);
        this.minutesState.set(0);
        this.hourTextState.set('');
        this.minuteTextState.set('');
        this.meridiemState.set('AM');
        this.committedValueState.set(null);
        this.dirtyDraftState.set(false);
    }
    handleDigit(segment, digit, replace) {
        const currentText = this.getSegmentText(segment);
        const candidate = replace || currentText.length >= 2 ? digit : `${currentText}${digit}`;
        this.dirtyDraftState.set(true);
        if (candidate.length === 1) {
            if (shouldAutoPadSingleDigit(segment, digit, this.modeState())) {
                const normalizedValue = normalizeSegmentDraft(segment, `0${digit}`, this.modeState(), this.minuteStepState());
                this.setSegmentText(segment, normalizedValue);
                this.commitSegment(segment);
                return true;
            }
            this.setSegmentText(segment, candidate);
            this.positionSegmentCaret(segment, 1);
            return false;
        }
        const normalizedValue = normalizeSegmentDraft(segment, candidate, this.modeState(), this.minuteStepState());
        this.setSegmentText(segment, normalizedValue);
        this.commitSegment(segment);
        return true;
    }
    handleBackspace(segment, input) {
        const currentText = this.getSegmentText(segment);
        if (!currentText) {
            this.focusPreviousSegment(segment);
            return;
        }
        const start = input.selectionStart ?? currentText.length;
        const end = input.selectionEnd ?? start;
        if (start === 0 && end === 0) {
            return;
        }
        const nextStart = start === end ? Math.max(0, start - 1) : start;
        const nextText = start === end
            ? `${currentText.slice(0, nextStart)}${currentText.slice(end)}`
            : `${currentText.slice(0, start)}${currentText.slice(end)}`;
        this.setSegmentText(segment, nextText);
        this.dirtyDraftState.set(true);
        this.positionSegmentCaret(segment, nextStart);
    }
    handleDelete(segment, input) {
        const currentText = this.getSegmentText(segment);
        if (!currentText) {
            return;
        }
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? start;
        if (start === end && start >= currentText.length) {
            return;
        }
        const nextEnd = start === end ? start + 1 : end;
        this.setSegmentText(segment, `${currentText.slice(0, start)}${currentText.slice(nextEnd)}`);
        this.dirtyDraftState.set(true);
        this.positionSegmentCaret(segment, start);
    }
    adjustSegment(segment, direction, large) {
        const currentValue = this.currentValue();
        if (currentValue) {
            this.setCanonicalValue(currentValue);
        }
        else if (!this.committedValueState()) {
            this.setCanonicalValue({ hours24: 0, minutes: 0 });
        }
        else {
            this.syncDraftFromCanonical(true);
        }
        if (segment === 'hour') {
            const delta = direction * (large ? 5 : 1);
            this.hours24State.set(wrap(this.hours24State() + delta, 0, 23));
        }
        else {
            const stepCount = large ? this.largeMinuteStepCount() : 1;
            this.minutesState.set(stepMinuteOnGrid(this.minutesState(), this.minuteStepState(), direction, stepCount));
        }
        const nextValue = { hours24: this.hours24State(), minutes: this.minutesState() };
        this.committedValueState.set(nextValue);
        this.dirtyDraftState.set(false);
        this.syncDraftFromCanonical(true);
        this.emitCommittedValue();
        this.selectSegmentText(segment);
    }
    commitSegment(segment) {
        const text = this.getSegmentText(segment);
        if (!text.trim()) {
            this.setSegmentText(segment, '');
            this.dirtyDraftState.set(true);
            return;
        }
        const normalizedValue = normalizeSegmentDraft(segment, text, this.modeState(), this.minuteStepState());
        this.setSegmentText(segment, normalizedValue);
        this.dirtyDraftState.set(true);
        this.commitCurrentDraft();
    }
    commitDraftOnExit() {
        const hourText = this.hourTextState();
        const minuteText = this.minuteTextState();
        if (!hourText && !minuteText) {
            this.clearDraft();
            this.emitValue(undefined);
            return;
        }
        const fallbackHour = this.is12h$() ? '12' : '00';
        this.hourTextState.set(normalizeSegmentDraft('hour', hourText || fallbackHour, this.modeState(), this.minuteStepState()));
        this.minuteTextState.set(normalizeSegmentDraft('minute', minuteText || '00', this.modeState(), this.minuteStepState()));
        this.dirtyDraftState.set(true);
        this.commitCurrentDraft();
    }
    commitCurrentDraft() {
        const value = this.currentValue();
        if (!value) {
            return false;
        }
        this.setCanonicalValue(value);
        this.emitCommittedValue();
        return true;
    }
    syncDraftFromCanonical(force = false) {
        if (!force && this.isEmpty$()) {
            return;
        }
        if (this.modeState() === '12h') {
            const hours24 = this.hours24State();
            this.meridiemState.set(hours24 >= 12 ? 'PM' : 'AM');
            this.hourTextState.set(padTwoDigits(toDisplayHour(hours24)));
        }
        else {
            this.hourTextState.set(padTwoDigits(this.hours24State()));
        }
        this.minuteTextState.set(padTwoDigits(this.minutesState()));
    }
    emitCommittedValue() {
        const value = this.formattedCommittedValue();
        if (!value) {
            return;
        }
        this.emitValue(value);
    }
    emitValue(value, force = false) {
        if (!force && value === this.lastEmittedValue) {
            return;
        }
        this.lastEmittedValue = value;
        this.valueChange.emit(value);
    }
    formattedCommittedValue() {
        const value = this.committedValueState();
        return value ? formatCxTimeValue(value.hours24, value.minutes) : undefined;
    }
    currentValue() {
        const hourText = this.hourTextState().trim();
        const minuteText = this.minuteTextState().trim();
        if (hourText.length !== 2 || minuteText.length !== 2) {
            return null;
        }
        const hour = Number.parseInt(hourText, 10);
        const minute = Number.parseInt(minuteText, 10);
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
            return null;
        }
        const validHour = this.is12h$() ? hour >= 1 && hour <= 12 : hour >= 0 && hour <= 23;
        if (!validHour || minute < 0 || minute > 59) {
            return null;
        }
        return {
            hours24: this.toHours24(hour),
            minutes: minute,
        };
    }
    totalMinutes(value) {
        return value.hours24 * 60 + value.minutes;
    }
    toHours24(displayHour) {
        if (this.modeState() !== '12h') {
            return displayHour;
        }
        return this.meridiemState() === 'AM' ? displayHour % 12 : (displayHour % 12) + 12;
    }
    toggleMeridiem() {
        this.setMeridiem(this.meridiemState() === 'AM' ? 'PM' : 'AM');
    }
    setMeridiem(value) {
        if (value === this.meridiemState()) {
            return;
        }
        this.meridiemState.set(value);
        this.dirtyDraftState.set(true);
        this.commitCurrentDraft();
    }
    getSegmentText(segment) {
        return segment === 'hour' ? this.hourTextState() : this.minuteTextState();
    }
    setSegmentText(segment, value) {
        if (segment === 'hour') {
            this.hourTextState.set(value);
            return;
        }
        this.minuteTextState.set(value);
    }
    focusNextSegment(segment) {
        if (segment === 'hour') {
            this.focusSegment('minute');
            return;
        }
        if (this.is12h$()) {
            this.meridiemButtonRef?.nativeElement.focus();
            return;
        }
        this.selectSegmentText('minute');
    }
    focusPreviousSegment(segment) {
        if (segment === 'minute') {
            this.focusSegment('hour');
        }
    }
    focusSegment(segment) {
        const target = segment === 'hour' ? this.hourFieldRef?.nativeElement : this.minuteFieldRef?.nativeElement;
        target?.focus();
        this.selectSegmentText(segment);
    }
    selectSegmentText(segment) {
        const target = segment === 'hour' ? this.hourFieldRef?.nativeElement : this.minuteFieldRef?.nativeElement;
        if (!target) {
            return;
        }
        queueMicrotask(() => {
            target.setSelectionRange(0, target.value.length);
        });
    }
    positionSegmentCaret(segment, position) {
        const target = segment === 'hour' ? this.hourFieldRef?.nativeElement : this.minuteFieldRef?.nativeElement;
        if (!target) {
            return;
        }
        queueMicrotask(() => target.setSelectionRange(position, position));
    }
    largeMinuteStepCount() {
        return Math.max(1, Math.round(15 / this.minuteStepState()));
    }
    invalidDraftMessage() {
        const hourText = this.hourTextState().trim();
        if (hourText.length === 2) {
            const hour = Number.parseInt(hourText, 10);
            const validHour = Number.isFinite(hour)
                && (this.is12h$() ? hour >= 1 && hour <= 12 : hour >= 0 && hour <= 23);
            if (!validHour) {
                return this.is12h$()
                    ? 'Enter an hour from 1 to 12.'
                    : 'Enter an hour from 00 to 23.';
            }
        }
        const minuteText = this.minuteTextState().trim();
        if (minuteText.length === 2) {
            const minute = Number.parseInt(minuteText, 10);
            if (!Number.isFinite(minute) || minute < 0 || minute > 59) {
                return 'Enter minutes from 00 to 59.';
            }
        }
        return undefined;
    }
    rangeValidationMessage() {
        const min = parseCxTimeValue(this.minState());
        const max = parseCxTimeValue(this.maxState());
        const minText = min ? formatCxTimeValue(min.hours24, min.minutes) : undefined;
        const maxText = max ? formatCxTimeValue(max.hours24, max.minutes) : undefined;
        if (minText && maxText) {
            return `Enter a time from ${minText} to ${maxText}.`;
        }
        if (minText) {
            return `Enter a time at or after ${minText}.`;
        }
        if (maxText) {
            return `Enter a time at or before ${maxText}.`;
        }
        return 'Enter an allowed time.';
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTimeFieldComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxTimeFieldComponent, isStandalone: true, selector: "cx-time-field", inputs: { label: "label", ariaLabel: "ariaLabel", hourAriaLabel: "hourAriaLabel", minuteAriaLabel: "minuteAriaLabel", optional: "optional", disabled: "disabled", loading: "loading", clearable: "clearable", hint: "hint", mode: "mode", size: "size", minuteStep: "minuteStep", min: "min", max: "max", validation: "validation", value: "value" }, outputs: { valueChange: "valueChange", focusChange: "focusChange", clear: "clear" }, host: { listeners: { "focusin": "onFocusIn()", "focusout": "onFocusOut($event)" } }, viewQueries: [{ propertyName: "hourFieldRef", first: true, predicate: ["hourField"], descendants: true, read: ElementRef }, { propertyName: "minuteFieldRef", first: true, predicate: ["minuteField"], descendants: true, read: ElementRef }, { propertyName: "meridiemButtonRef", first: true, predicate: ["meridiemButton"], descendants: true, read: ElementRef }], ngImport: i0, template: "<div\n  class=\"cx-time-field\"\n  [class.cx-time-field--small]=\"size$() === 'small'\"\n  [class.cx-time-field--large]=\"size$() === 'large'\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-time-field__header\">\n      <div class=\"cx-time-field__label\" [id]=\"labelId\">{{ label }}</div>\n\n      @if (optional) {\n        <div class=\"cx-time-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-time-field__field-shell\"\n    [class.cx-time-field__field-shell--focused]=\"shellFocused$()\"\n    [class.cx-time-field__field-shell--disabled]=\"disabled\"\n    [class.cx-time-field__field-shell--loading]=\"loading\"\n    [class.cx-time-field__field-shell--error]=\"hasError$()\"\n    [class.cx-time-field__field-shell--empty]=\"isEmpty$()\"\n    role=\"group\"\n    [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n    [attr.aria-labelledby]=\"resolvedGroupAriaLabelledBy\"\n    [attr.aria-describedby]=\"resolvedGroupAriaDescribedBy\"\n    [attr.aria-label]=\"resolvedGroupAriaLabel\"\n    [attr.aria-busy]=\"loading ? 'true' : null\"\n    (mousedown)=\"onShellMousedown($event)\"\n  >\n    <div class=\"cx-time-field__segments\">\n      <div class=\"cx-time-field__clock\">\n        <input\n          #hourField\n          class=\"cx-time-field__segment-input\"\n          type=\"text\"\n          inputmode=\"numeric\"\n          maxlength=\"2\"\n          autocomplete=\"off\"\n          spellcheck=\"false\"\n          [value]=\"hourText$()\"\n          [disabled]=\"isLocked$()\"\n          [attr.aria-label]=\"hourAriaLabel\"\n          (focus)=\"onSegmentFocus('hour')\"\n          (pointerup)=\"onSegmentPointerUp('hour', $event)\"\n          (input)=\"onSegmentInput('hour', $event)\"\n          (keydown)=\"onSegmentKeydown('hour', $event)\"\n          (paste)=\"onSegmentPaste($event)\"\n        />\n\n        <span class=\"cx-time-field__separator\" aria-hidden=\"true\">:</span>\n\n        <input\n          #minuteField\n          class=\"cx-time-field__segment-input\"\n          type=\"text\"\n          inputmode=\"numeric\"\n          maxlength=\"2\"\n          autocomplete=\"off\"\n          spellcheck=\"false\"\n          [value]=\"minuteText$()\"\n          [disabled]=\"isLocked$()\"\n          [attr.aria-label]=\"minuteAriaLabel\"\n          (focus)=\"onSegmentFocus('minute')\"\n          (pointerup)=\"onSegmentPointerUp('minute', $event)\"\n          (input)=\"onSegmentInput('minute', $event)\"\n          (keydown)=\"onSegmentKeydown('minute', $event)\"\n          (paste)=\"onSegmentPaste($event)\"\n        />\n      </div>\n\n      @if (is12h$()) {\n        <button\n          #meridiemButton\n          type=\"button\"\n          class=\"cx-time-field__meridiem\"\n          [disabled]=\"isLocked$()\"\n          [attr.aria-label]=\"'Meridiem ' + meridiem$()\"\n          (click)=\"onMeridiemClick()\"\n          (keydown)=\"onMeridiemKeydown($event)\"\n        >\n          {{ meridiem$() }}\n        </button>\n      }\n    </div>\n\n    @if (loading) {\n      <span class=\"cx-time-field__loading\" aria-hidden=\"true\">\n        <cx-spinner size=\"small\" mood=\"default\" />\n      </span>\n    }\n\n    @if (hasClear$()) {\n      <button type=\"button\" class=\"cx-time-field__clear\" aria-label=\"Clear\" (click)=\"onClear($event)\">\n        <cx-icon icon=\"remove\" [size]=\"14\" />\n      </button>\n    }\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-time-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-time-field__hint\">{{ hint!.trim() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:inline-flex;min-width:0;width:max-content;max-width:100%}.cx-time-field{min-width:0;width:max-content;max-width:100%}.cx-time-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-time-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-time-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-time-field__header,.cx-time-field__messages,.cx-time-field__label{min-width:0}.cx-time-field__optional{flex:0 0 auto;white-space:nowrap}.cx-time-field__label,.cx-time-field__hint{overflow-wrap:anywhere}.cx-time-field__field-shell{box-sizing:border-box;display:inline-flex;width:max-content;min-height:var(--controller-size);align-items:center;justify-content:center;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0)}.cx-time-field__field-shell{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-time-field__field-shell:hover:not(.cx-time-field__field-shell--disabled):not(.cx-time-field__field-shell--error){border-color:var(--border-hover)}.cx-time-field__field-shell--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-time-field__field-shell:has(.cx-time-field__segment-input:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-time-field__field-shell--error,.cx-time-field__field-shell--error:hover:not(.cx-time-field__field-shell--disabled){border-color:var(--danger)}.cx-time-field__field-shell--disabled{opacity:.55;cursor:default}.cx-time-field__field-shell--loading{cursor:progress}.cx-time-field--small .cx-time-field__field-shell{min-height:var(--controller-size-small)}.cx-time-field--large .cx-time-field__field-shell{min-height:var(--controller-size-large);border-radius:var(--radius-xl)}.cx-time-field__field-shell:hover:not(.cx-time-field__field-shell--disabled):not(.cx-time-field__field-shell--error),.cx-time-field__field-shell:focus-within:not(.cx-time-field__field-shell--disabled):not(.cx-time-field__field-shell--error){outline:var(--outline-field-interaction);outline-offset:0}.cx-time-field__field-shell--disabled{user-select:none;pointer-events:none}.cx-time-field__segments{display:inline-flex;min-width:0;align-items:center;gap:var(--space-sm)}.cx-time-field__clock{display:inline-flex;align-items:center;gap:var(--space-2xs)}.cx-time-field__segment-input{width:2.4ch;padding:0;border:0;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-control);text-align:center;caret-color:var(--primary)}.cx-time-field--small .cx-time-field__segment-input,.cx-time-field--small .cx-time-field__separator{font-size:var(--font-size-body-sm)}.cx-time-field--large .cx-time-field__segment-input,.cx-time-field--large .cx-time-field__separator{font-size:var(--font-size-body-lg)}.cx-time-field__segment-input::placeholder{color:var(--placeholder)}.cx-time-field__segment-input:focus-visible{outline:0}.cx-time-field__segment-input:disabled{cursor:default}.cx-time-field__field-shell--loading .cx-time-field__segment-input,.cx-time-field__field-shell--loading .cx-time-field__meridiem{cursor:progress}.cx-time-field__separator{color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-control)}.cx-time-field__field-shell--empty .cx-time-field__separator{color:var(--placeholder)}.cx-time-field__meridiem{display:inline-flex;min-width:var(--controller-size);height:var(--icon-size-md);align-items:center;justify-content:center;padding:0 var(--space-xs);border:0;border-radius:var(--radius-sm);background:var(--opacity-low);color:var(--ink);cursor:pointer;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-control);transition:background-color var(--motion-fast) ease}.cx-time-field__meridiem:hover:not(:disabled){background:var(--opacity-mid)}.cx-time-field__meridiem:focus-visible{background:var(--opacity-mid);outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-time-field__meridiem:disabled{cursor:default}.cx-time-field--small .cx-time-field__meridiem{height:var(--icon-size-sm)}.cx-time-field--large .cx-time-field__meridiem{height:var(--icon-size-lg);font-size:var(--font-size-body)}.cx-time-field__loading{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-time-field__clear{display:inline-flex;flex:0 0 auto;width:24px;height:24px;align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-xs);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-time-field__clear:hover{background:var(--opacity-low);color:var(--ink)}.cx-time-field__clear:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-time-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-time-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }, { kind: "component", type: CxValidationMessageComponent, selector: "cx-validation-message", inputs: ["type", "showAll", "messages"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTimeFieldComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-time-field', imports: [CxIconComponent, CxSpinnerComponent, CxValidationMessageComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-time-field\"\n  [class.cx-time-field--small]=\"size$() === 'small'\"\n  [class.cx-time-field--large]=\"size$() === 'large'\"\n>\n  @if (label.trim()) {\n    <div class=\"cx-time-field__header\">\n      <div class=\"cx-time-field__label\" [id]=\"labelId\">{{ label }}</div>\n\n      @if (optional) {\n        <div class=\"cx-time-field__optional\">Optional</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-time-field__field-shell\"\n    [class.cx-time-field__field-shell--focused]=\"shellFocused$()\"\n    [class.cx-time-field__field-shell--disabled]=\"disabled\"\n    [class.cx-time-field__field-shell--loading]=\"loading\"\n    [class.cx-time-field__field-shell--error]=\"hasError$()\"\n    [class.cx-time-field__field-shell--empty]=\"isEmpty$()\"\n    role=\"group\"\n    [attr.aria-invalid]=\"hasError$() ? 'true' : null\"\n    [attr.aria-labelledby]=\"resolvedGroupAriaLabelledBy\"\n    [attr.aria-describedby]=\"resolvedGroupAriaDescribedBy\"\n    [attr.aria-label]=\"resolvedGroupAriaLabel\"\n    [attr.aria-busy]=\"loading ? 'true' : null\"\n    (mousedown)=\"onShellMousedown($event)\"\n  >\n    <div class=\"cx-time-field__segments\">\n      <div class=\"cx-time-field__clock\">\n        <input\n          #hourField\n          class=\"cx-time-field__segment-input\"\n          type=\"text\"\n          inputmode=\"numeric\"\n          maxlength=\"2\"\n          autocomplete=\"off\"\n          spellcheck=\"false\"\n          [value]=\"hourText$()\"\n          [disabled]=\"isLocked$()\"\n          [attr.aria-label]=\"hourAriaLabel\"\n          (focus)=\"onSegmentFocus('hour')\"\n          (pointerup)=\"onSegmentPointerUp('hour', $event)\"\n          (input)=\"onSegmentInput('hour', $event)\"\n          (keydown)=\"onSegmentKeydown('hour', $event)\"\n          (paste)=\"onSegmentPaste($event)\"\n        />\n\n        <span class=\"cx-time-field__separator\" aria-hidden=\"true\">:</span>\n\n        <input\n          #minuteField\n          class=\"cx-time-field__segment-input\"\n          type=\"text\"\n          inputmode=\"numeric\"\n          maxlength=\"2\"\n          autocomplete=\"off\"\n          spellcheck=\"false\"\n          [value]=\"minuteText$()\"\n          [disabled]=\"isLocked$()\"\n          [attr.aria-label]=\"minuteAriaLabel\"\n          (focus)=\"onSegmentFocus('minute')\"\n          (pointerup)=\"onSegmentPointerUp('minute', $event)\"\n          (input)=\"onSegmentInput('minute', $event)\"\n          (keydown)=\"onSegmentKeydown('minute', $event)\"\n          (paste)=\"onSegmentPaste($event)\"\n        />\n      </div>\n\n      @if (is12h$()) {\n        <button\n          #meridiemButton\n          type=\"button\"\n          class=\"cx-time-field__meridiem\"\n          [disabled]=\"isLocked$()\"\n          [attr.aria-label]=\"'Meridiem ' + meridiem$()\"\n          (click)=\"onMeridiemClick()\"\n          (keydown)=\"onMeridiemKeydown($event)\"\n        >\n          {{ meridiem$() }}\n        </button>\n      }\n    </div>\n\n    @if (loading) {\n      <span class=\"cx-time-field__loading\" aria-hidden=\"true\">\n        <cx-spinner size=\"small\" mood=\"default\" />\n      </span>\n    }\n\n    @if (hasClear$()) {\n      <button type=\"button\" class=\"cx-time-field__clear\" aria-label=\"Clear\" (click)=\"onClear($event)\">\n        <cx-icon icon=\"remove\" [size]=\"14\" />\n      </button>\n    }\n  </div>\n\n  @if (showHint$() || validationMessages$().length > 0) {\n    <div class=\"cx-time-field__messages\" [id]=\"messagesId\">\n      @if (showHint$()) {\n        <div class=\"cx-time-field__hint\">{{ hint!.trim() }}</div>\n      }\n\n      @if (validationMessages$().length > 0) {\n        <cx-validation-message [messages]=\"validationMessages$()\" />\n      }\n    </div>\n  }\n</div>\n", styles: [":host{display:inline-flex;min-width:0;width:max-content;max-width:100%}.cx-time-field{min-width:0;width:max-content;max-width:100%}.cx-time-field__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm);margin-bottom:var(--space-xs)}.cx-time-field__label{color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:1.2}.cx-time-field__optional{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:1.2}.cx-time-field__header,.cx-time-field__messages,.cx-time-field__label{min-width:0}.cx-time-field__optional{flex:0 0 auto;white-space:nowrap}.cx-time-field__label,.cx-time-field__hint{overflow-wrap:anywhere}.cx-time-field__field-shell{box-sizing:border-box;display:inline-flex;width:max-content;min-height:var(--controller-size);align-items:center;justify-content:center;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0)}.cx-time-field__field-shell{transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease}.cx-time-field__field-shell:hover:not(.cx-time-field__field-shell--disabled):not(.cx-time-field__field-shell--error){border-color:var(--border-hover)}.cx-time-field__field-shell--focused{outline:var(--outline-focus);outline-offset:var(--outline-focus-offset)}:host-context([data-cx-keyboard-navigation]) .cx-time-field__field-shell:has(.cx-time-field__segment-input:focus){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-time-field__field-shell--error,.cx-time-field__field-shell--error:hover:not(.cx-time-field__field-shell--disabled){border-color:var(--danger)}.cx-time-field__field-shell--disabled{opacity:.55;cursor:default}.cx-time-field__field-shell--loading{cursor:progress}.cx-time-field--small .cx-time-field__field-shell{min-height:var(--controller-size-small)}.cx-time-field--large .cx-time-field__field-shell{min-height:var(--controller-size-large);border-radius:var(--radius-xl)}.cx-time-field__field-shell:hover:not(.cx-time-field__field-shell--disabled):not(.cx-time-field__field-shell--error),.cx-time-field__field-shell:focus-within:not(.cx-time-field__field-shell--disabled):not(.cx-time-field__field-shell--error){outline:var(--outline-field-interaction);outline-offset:0}.cx-time-field__field-shell--disabled{user-select:none;pointer-events:none}.cx-time-field__segments{display:inline-flex;min-width:0;align-items:center;gap:var(--space-sm)}.cx-time-field__clock{display:inline-flex;align-items:center;gap:var(--space-2xs)}.cx-time-field__segment-input{width:2.4ch;padding:0;border:0;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-control);text-align:center;caret-color:var(--primary)}.cx-time-field--small .cx-time-field__segment-input,.cx-time-field--small .cx-time-field__separator{font-size:var(--font-size-body-sm)}.cx-time-field--large .cx-time-field__segment-input,.cx-time-field--large .cx-time-field__separator{font-size:var(--font-size-body-lg)}.cx-time-field__segment-input::placeholder{color:var(--placeholder)}.cx-time-field__segment-input:focus-visible{outline:0}.cx-time-field__segment-input:disabled{cursor:default}.cx-time-field__field-shell--loading .cx-time-field__segment-input,.cx-time-field__field-shell--loading .cx-time-field__meridiem{cursor:progress}.cx-time-field__separator{color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-control)}.cx-time-field__field-shell--empty .cx-time-field__separator{color:var(--placeholder)}.cx-time-field__meridiem{display:inline-flex;min-width:var(--controller-size);height:var(--icon-size-md);align-items:center;justify-content:center;padding:0 var(--space-xs);border:0;border-radius:var(--radius-sm);background:var(--opacity-low);color:var(--ink);cursor:pointer;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-control);transition:background-color var(--motion-fast) ease}.cx-time-field__meridiem:hover:not(:disabled){background:var(--opacity-mid)}.cx-time-field__meridiem:focus-visible{background:var(--opacity-mid);outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-time-field__meridiem:disabled{cursor:default}.cx-time-field--small .cx-time-field__meridiem{height:var(--icon-size-sm)}.cx-time-field--large .cx-time-field__meridiem{height:var(--icon-size-lg);font-size:var(--font-size-body)}.cx-time-field__loading{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-time-field__clear{display:inline-flex;flex:0 0 auto;width:24px;height:24px;align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-xs);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-time-field__clear:hover{background:var(--opacity-low);color:var(--ink)}.cx-time-field__clear:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-time-field__messages{display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)}.cx-time-field__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}"] }]
        }], propDecorators: { hourFieldRef: [{
                type: ViewChild,
                args: ['hourField', { read: ElementRef }]
            }], minuteFieldRef: [{
                type: ViewChild,
                args: ['minuteField', { read: ElementRef }]
            }], meridiemButtonRef: [{
                type: ViewChild,
                args: ['meridiemButton', { read: ElementRef }]
            }], label: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], hourAriaLabel: [{
                type: Input
            }], minuteAriaLabel: [{
                type: Input
            }], optional: [{
                type: Input
            }], disabled: [{
                type: Input
            }], loading: [{
                type: Input
            }], clearable: [{
                type: Input
            }], hint: [{
                type: Input
            }], mode: [{
                type: Input
            }], size: [{
                type: Input
            }], minuteStep: [{
                type: Input
            }], min: [{
                type: Input
            }], max: [{
                type: Input
            }], validation: [{
                type: Input
            }], value: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], focusChange: [{
                type: Output
            }], clear: [{
                type: Output
            }], onFocusIn: [{
                type: HostListener,
                args: ['focusin']
            }], onFocusOut: [{
                type: HostListener,
                args: ['focusout', ['$event']]
            }] } });
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function wrap(value, min, max) {
    const size = max - min + 1;
    return ((value - min + size) % size) + min;
}
function padTwoDigits(value) {
    return `${Math.floor(value)}`.padStart(2, '0');
}
function shouldReplaceSelection(input) {
    return input.selectionStart === 0 && input.selectionEnd === input.value.length;
}
function shouldAutoPadSingleDigit(segment, digit, mode) {
    const numericDigit = Number.parseInt(digit, 10);
    if (!Number.isFinite(numericDigit)) {
        return false;
    }
    if (segment === 'minute') {
        return numericDigit > 5;
    }
    return mode === '12h' ? numericDigit > 1 : numericDigit > 2;
}
function normalizeSegmentDraft(segment, value, mode, minuteStep) {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    if (!digitsOnly) {
        return '';
    }
    const parsedValue = Number.parseInt(digitsOnly, 10);
    if (!Number.isFinite(parsedValue)) {
        return '';
    }
    if (segment === 'minute') {
        if (parsedValue > 59) {
            return padTwoDigits(parsedValue);
        }
        return padTwoDigits(snapToMinuteStep(parsedValue, minuteStep));
    }
    if (mode === '12h' && parsedValue === 0) {
        return '12';
    }
    return padTwoDigits(parsedValue);
}
function snapToMinuteStep(value, minuteStep) {
    const normalizedValue = clamp(value, 0, 59);
    return minuteGrid(minuteStep).reduce((closest, candidate) => {
        const closestDistance = Math.abs(normalizedValue - closest);
        const candidateDistance = Math.abs(normalizedValue - candidate);
        return candidateDistance <= closestDistance ? candidate : closest;
    });
}
function stepMinuteOnGrid(current, minuteStep, direction, count) {
    const grid = minuteGrid(minuteStep);
    const exactIndex = grid.indexOf(current);
    let index;
    if (exactIndex >= 0) {
        index = exactIndex;
    }
    else if (direction > 0) {
        const nextIndex = grid.findIndex(value => value > current);
        index = nextIndex >= 0 ? nextIndex - 1 : grid.length - 1;
    }
    else {
        let previousIndex = -1;
        for (let gridIndex = grid.length - 1; gridIndex >= 0; gridIndex -= 1) {
            if ((grid[gridIndex] ?? 0) < current) {
                previousIndex = gridIndex;
                break;
            }
        }
        index = previousIndex >= 0 ? previousIndex + 1 : 0;
    }
    const moves = Math.max(1, Math.floor(count));
    for (let move = 0; move < moves; move += 1) {
        index = wrap(index + direction, 0, grid.length - 1);
    }
    return grid[index] ?? 0;
}
function minuteGrid(minuteStep) {
    const step = clamp(Math.floor(minuteStep), 1, 59);
    const values = [];
    for (let minute = 0; minute <= 59; minute += step) {
        values.push(minute);
    }
    return values;
}
function toDisplayHour(hours24) {
    const normalized = clamp(hours24, 0, 23);
    const display = normalized % 12;
    return display === 0 ? 12 : display;
}
