import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { CxBadgeComponent } from '../cx-badge/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import * as i0 from "@angular/core";
const AVATAR_COLORS = [
    'blue',
    'cyan',
    'lime',
    'green',
    'yellow',
    'orange',
    'tangerine',
    'red',
    'pink',
    'purple',
    'violet',
];
export class CxAvatarComponent {
    imageFailed = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "imageFailed" }] : /* istanbul ignore next */ []));
    srcValue;
    sizeValue = 'default';
    colorValue = 'auto';
    ariaLabelValue;
    name = '';
    badge;
    set src(value) {
        this.srcValue = value || undefined;
        this.imageFailed.set(false);
    }
    get src() {
        return this.srcValue;
    }
    set size(value) {
        this.sizeValue = value ?? 'default';
    }
    get size() {
        return this.sizeValue;
    }
    set color(value) {
        this.colorValue = value ?? 'auto';
    }
    get color() {
        return this.colorValue;
    }
    set ariaLabel(value) {
        this.ariaLabelValue = value || undefined;
    }
    get ariaLabel() {
        return this.ariaLabelValue;
    }
    resolvedColor() {
        if (this.color !== 'auto') {
            return this.color;
        }
        return AVATAR_COLORS[this.nameHash() % AVATAR_COLORS.length];
    }
    initials() {
        const parts = this.name.trim().split(/[\s-]+/).filter(Boolean);
        if (!parts.length)
            return undefined;
        if (parts.length === 1)
            return this.firstInitial(parts[0]);
        const first = this.firstInitial(parts[0]);
        const last = this.firstInitial(parts[parts.length - 1]);
        return first && last ? `${first}${last}` : (first ?? last);
    }
    showImage() {
        return !!this.src && !this.imageFailed();
    }
    badgeVisible() {
        return this.badge !== undefined;
    }
    badgeCount() {
        return this.badge?.count;
    }
    onImageError() {
        this.imageFailed.set(true);
    }
    nameHash() {
        const name = this.name.trim();
        if (!name)
            return 0;
        return Array.from(name).reduce((hash, char) => hash + (char.codePointAt(0) ?? 0), 0);
    }
    firstInitial(value) {
        return Array.from(value.trim()).find(char => /\p{L}|\p{N}/u.test(char))?.toUpperCase();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxAvatarComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxAvatarComponent, isStandalone: true, selector: "cx-avatar", inputs: { name: "name", badge: "badge", src: "src", size: "size", color: "color", ariaLabel: "ariaLabel" }, host: { properties: { "class.cx-avatar-host--small": "size === \"small\"", "class.cx-avatar-host--default": "size === \"default\"", "class.cx-avatar-host--large": "size === \"large\"", "class.cx-avatar-host--blue": "resolvedColor() === \"blue\"", "class.cx-avatar-host--cyan": "resolvedColor() === \"cyan\"", "class.cx-avatar-host--lime": "resolvedColor() === \"lime\"", "class.cx-avatar-host--green": "resolvedColor() === \"green\"", "class.cx-avatar-host--yellow": "resolvedColor() === \"yellow\"", "class.cx-avatar-host--orange": "resolvedColor() === \"orange\"", "class.cx-avatar-host--tangerine": "resolvedColor() === \"tangerine\"", "class.cx-avatar-host--red": "resolvedColor() === \"red\"", "class.cx-avatar-host--pink": "resolvedColor() === \"pink\"", "class.cx-avatar-host--purple": "resolvedColor() === \"purple\"", "class.cx-avatar-host--violet": "resolvedColor() === \"violet\"" } }, ngImport: i0, template: "<cx-badge [visible]=\"badgeVisible()\" [count]=\"badgeCount()\">\n  <span\n    class=\"cx-avatar\"\n    [attr.role]=\"ariaLabel ? 'img' : null\"\n    [attr.aria-label]=\"ariaLabel || null\"\n    [attr.aria-hidden]=\"ariaLabel ? null : 'true'\"\n  >\n    @if (showImage()) {\n      <img class=\"cx-avatar__image\" [src]=\"src\" alt=\"\" (error)=\"onImageError()\" />\n    } @else if (initials(); as avatarInitials) {\n      <span class=\"cx-avatar__initials\" aria-hidden=\"true\">{{ avatarInitials }}</span>\n    } @else {\n      <cx-icon class=\"cx-avatar__icon\" icon=\"user\" size=\"auto\" />\n    }\n  </span>\n</cx-badge>\n", styles: [":host{display:inline-flex;flex:0 0 auto;container-type:inline-size;width:var(--cx-avatar-size, 32px);height:var(--cx-avatar-size, 32px)}:host(.cx-avatar-host--small){--cx-avatar-size: 24px}:host(.cx-avatar-host--default){--cx-avatar-size: 32px}:host(.cx-avatar-host--large){--cx-avatar-size: 48px}.cx-avatar{display:flex;width:var(--cx-avatar-size);height:var(--cx-avatar-size);align-items:center;justify-content:center;overflow:hidden;border-radius:16cqi;corner-shape:round;background:var(--cyan-opacity);color:var(--cyan)}:host(.cx-avatar-host--blue) .cx-avatar{background:var(--blue-opacity);color:var(--blue)}:host(.cx-avatar-host--cyan) .cx-avatar{background:var(--cyan-opacity);color:var(--cyan)}:host(.cx-avatar-host--lime) .cx-avatar{background:var(--lime-opacity);color:var(--lime)}:host(.cx-avatar-host--green) .cx-avatar{background:var(--green-opacity);color:var(--green)}:host(.cx-avatar-host--yellow) .cx-avatar{background:var(--yellow-opacity);color:var(--yellow)}:host(.cx-avatar-host--orange) .cx-avatar{background:var(--orange-opacity);color:var(--orange)}:host(.cx-avatar-host--tangerine) .cx-avatar{background:var(--tangerine-opacity);color:var(--tangerine)}:host(.cx-avatar-host--red) .cx-avatar{background:var(--red-opacity);color:var(--red)}:host(.cx-avatar-host--pink) .cx-avatar{background:var(--pink-opacity);color:var(--pink)}:host(.cx-avatar-host--purple) .cx-avatar{background:var(--purple-opacity);color:var(--purple)}:host(.cx-avatar-host--violet) .cx-avatar{background:var(--violet-opacity);color:var(--violet)}.cx-avatar__image{display:block;width:100%;height:100%;object-fit:cover}.cx-avatar__initials{font-size:40cqi;font-weight:var(--font-weight-bold);line-height:1;text-transform:uppercase;user-select:none}.cx-avatar__icon{width:52%;height:52%;color:currentColor}"], dependencies: [{ kind: "component", type: CxBadgeComponent, selector: "cx-badge", inputs: ["visible", "placement", "count", "text", "mood", "ariaLabel"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxAvatarComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-avatar', imports: [CxBadgeComponent, CxIconComponent], host: {
                        '[class.cx-avatar-host--small]': 'size === "small"',
                        '[class.cx-avatar-host--default]': 'size === "default"',
                        '[class.cx-avatar-host--large]': 'size === "large"',
                        '[class.cx-avatar-host--blue]': 'resolvedColor() === "blue"',
                        '[class.cx-avatar-host--cyan]': 'resolvedColor() === "cyan"',
                        '[class.cx-avatar-host--lime]': 'resolvedColor() === "lime"',
                        '[class.cx-avatar-host--green]': 'resolvedColor() === "green"',
                        '[class.cx-avatar-host--yellow]': 'resolvedColor() === "yellow"',
                        '[class.cx-avatar-host--orange]': 'resolvedColor() === "orange"',
                        '[class.cx-avatar-host--tangerine]': 'resolvedColor() === "tangerine"',
                        '[class.cx-avatar-host--red]': 'resolvedColor() === "red"',
                        '[class.cx-avatar-host--pink]': 'resolvedColor() === "pink"',
                        '[class.cx-avatar-host--purple]': 'resolvedColor() === "purple"',
                        '[class.cx-avatar-host--violet]': 'resolvedColor() === "violet"',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<cx-badge [visible]=\"badgeVisible()\" [count]=\"badgeCount()\">\n  <span\n    class=\"cx-avatar\"\n    [attr.role]=\"ariaLabel ? 'img' : null\"\n    [attr.aria-label]=\"ariaLabel || null\"\n    [attr.aria-hidden]=\"ariaLabel ? null : 'true'\"\n  >\n    @if (showImage()) {\n      <img class=\"cx-avatar__image\" [src]=\"src\" alt=\"\" (error)=\"onImageError()\" />\n    } @else if (initials(); as avatarInitials) {\n      <span class=\"cx-avatar__initials\" aria-hidden=\"true\">{{ avatarInitials }}</span>\n    } @else {\n      <cx-icon class=\"cx-avatar__icon\" icon=\"user\" size=\"auto\" />\n    }\n  </span>\n</cx-badge>\n", styles: [":host{display:inline-flex;flex:0 0 auto;container-type:inline-size;width:var(--cx-avatar-size, 32px);height:var(--cx-avatar-size, 32px)}:host(.cx-avatar-host--small){--cx-avatar-size: 24px}:host(.cx-avatar-host--default){--cx-avatar-size: 32px}:host(.cx-avatar-host--large){--cx-avatar-size: 48px}.cx-avatar{display:flex;width:var(--cx-avatar-size);height:var(--cx-avatar-size);align-items:center;justify-content:center;overflow:hidden;border-radius:16cqi;corner-shape:round;background:var(--cyan-opacity);color:var(--cyan)}:host(.cx-avatar-host--blue) .cx-avatar{background:var(--blue-opacity);color:var(--blue)}:host(.cx-avatar-host--cyan) .cx-avatar{background:var(--cyan-opacity);color:var(--cyan)}:host(.cx-avatar-host--lime) .cx-avatar{background:var(--lime-opacity);color:var(--lime)}:host(.cx-avatar-host--green) .cx-avatar{background:var(--green-opacity);color:var(--green)}:host(.cx-avatar-host--yellow) .cx-avatar{background:var(--yellow-opacity);color:var(--yellow)}:host(.cx-avatar-host--orange) .cx-avatar{background:var(--orange-opacity);color:var(--orange)}:host(.cx-avatar-host--tangerine) .cx-avatar{background:var(--tangerine-opacity);color:var(--tangerine)}:host(.cx-avatar-host--red) .cx-avatar{background:var(--red-opacity);color:var(--red)}:host(.cx-avatar-host--pink) .cx-avatar{background:var(--pink-opacity);color:var(--pink)}:host(.cx-avatar-host--purple) .cx-avatar{background:var(--purple-opacity);color:var(--purple)}:host(.cx-avatar-host--violet) .cx-avatar{background:var(--violet-opacity);color:var(--violet)}.cx-avatar__image{display:block;width:100%;height:100%;object-fit:cover}.cx-avatar__initials{font-size:40cqi;font-weight:var(--font-weight-bold);line-height:1;text-transform:uppercase;user-select:none}.cx-avatar__icon{width:52%;height:52%;color:currentColor}"] }]
        }], propDecorators: { name: [{
                type: Input
            }], badge: [{
                type: Input
            }], src: [{
                type: Input
            }], size: [{
                type: Input
            }], color: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }] } });
