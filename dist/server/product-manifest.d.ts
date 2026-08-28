export declare const PRODUCT_MANIFEST_FILENAME = "cx-product.json";
export declare const MAX_PRODUCT_MANIFEST_BYTES: number;
export declare const PRODUCT_PROFILES: readonly ["static-site", "hybrid-site", "web-app"];
export declare const PRODUCT_DEPLOYMENTS: readonly ["mac-mini", "work-mac"];
export declare const PRODUCT_RENDERING_MODES: readonly ["ssg", "csr"];
export declare const PRODUCT_DESIGN_SYSTEMS: readonly ["cx-framework", "cx-framework-source"];
export declare const PRODUCT_VISUAL_SYSTEMS: readonly ["framework", "product-skin"];
export declare const PRODUCT_AUTHENTICATION_MODES: readonly ["none", "gate", "owner", "accounts"];
export declare const PRODUCT_PERSISTENCE_MODES: readonly ["none", "structured-records", "human-files", "human-files-with-index"];
export declare const PRODUCT_BACKGROUND_WORK_MODES: readonly ["none", "build-time", "durable"];
export declare const PRODUCT_EXTERNAL_EFFECTS: readonly ["ai", "email", "network-fetch", "notifications", "payments"];
export type ProductProfile = (typeof PRODUCT_PROFILES)[number];
export type ProductDeployment = (typeof PRODUCT_DEPLOYMENTS)[number];
export type ProductRenderingMode = (typeof PRODUCT_RENDERING_MODES)[number];
export type ProductDesignSystem = (typeof PRODUCT_DESIGN_SYSTEMS)[number];
export type ProductVisualSystem = (typeof PRODUCT_VISUAL_SYSTEMS)[number];
export type ProductAuthenticationMode = (typeof PRODUCT_AUTHENTICATION_MODES)[number];
export type ProductPersistenceMode = (typeof PRODUCT_PERSISTENCE_MODES)[number];
export type ProductBackgroundWorkMode = (typeof PRODUCT_BACKGROUND_WORK_MODES)[number];
export type ProductExternalEffect = (typeof PRODUCT_EXTERNAL_EFFECTS)[number];
export interface ProductFrontendManifest {
    readonly framework: "angular";
    readonly rendering: ProductRenderingMode;
    readonly designSystem: ProductDesignSystem;
    readonly visualSystem: ProductVisualSystem;
}
export interface ProductCapabilityManifest {
    readonly authentication: ProductAuthenticationMode;
    readonly persistentData: ProductPersistenceMode;
    readonly backgroundWork: ProductBackgroundWorkMode;
    readonly externalEffects: readonly ProductExternalEffect[];
}
export interface ProductManifest {
    readonly $schema: string;
    readonly schemaVersion: 1;
    readonly id: string;
    readonly family: "web";
    readonly profile: ProductProfile;
    readonly deployment: ProductDeployment;
    readonly frontend: ProductFrontendManifest;
    readonly capabilities: ProductCapabilityManifest;
}
export interface LoadedProductManifest {
    readonly manifest: ProductManifest;
    readonly manifestFile: string;
}
export declare function loadProductManifest(manifestFile: string): ProductManifest;
export declare function loadProductManifestFile(manifestFile: string): LoadedProductManifest;
//# sourceMappingURL=product-manifest.d.ts.map