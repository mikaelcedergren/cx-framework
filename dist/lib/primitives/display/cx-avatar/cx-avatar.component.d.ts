import * as i0 from "@angular/core";
export type CxAvatarSize = 'small' | 'default' | 'large';
export type CxAvatarColor = 'auto' | 'blue' | 'cyan' | 'lime' | 'green' | 'yellow' | 'orange' | 'tangerine' | 'red' | 'pink' | 'purple' | 'violet';
export interface CxAvatarBadge {
    count?: number;
}
export declare class CxAvatarComponent {
    private readonly imageFailed;
    private srcValue;
    private sizeValue;
    private colorValue;
    private ariaLabelValue;
    name: string;
    badge: CxAvatarBadge | undefined;
    set src(value: string | undefined);
    get src(): string | undefined;
    set size(value: CxAvatarSize | undefined);
    get size(): CxAvatarSize;
    set color(value: CxAvatarColor | undefined);
    get color(): CxAvatarColor;
    set ariaLabel(value: string | undefined);
    get ariaLabel(): string | undefined;
    protected resolvedColor(): Exclude<CxAvatarColor, 'auto'>;
    protected initials(): string | undefined;
    protected showImage(): boolean;
    protected badgeVisible(): boolean;
    protected badgeCount(): number | undefined;
    protected onImageError(): void;
    private nameHash;
    private firstInitial;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxAvatarComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxAvatarComponent, "cx-avatar", never, { "name": { "alias": "name"; "required": false; }; "badge": { "alias": "badge"; "required": false; }; "src": { "alias": "src"; "required": false; }; "size": { "alias": "size"; "required": false; }; "color": { "alias": "color"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-avatar.component.d.ts.map