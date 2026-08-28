import { Directive, Input } from '@angular/core';
import * as i0 from "@angular/core";
export class CxWizardDialogStepDirective {
    templateRef;
    stepId = '';
    set cxStepId(value) {
        this.stepId = value;
    }
    constructor(templateRef) {
        this.templateRef = templateRef;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxWizardDialogStepDirective, deps: [{ token: i0.TemplateRef }], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "22.0.8", type: CxWizardDialogStepDirective, isStandalone: true, selector: "ng-template[cxWizardDialogStep]", inputs: { cxStepId: ["cxWizardDialogStep", "cxStepId"] }, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxWizardDialogStepDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: 'ng-template[cxWizardDialogStep]',
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.TemplateRef }], propDecorators: { cxStepId: [{
                type: Input,
                args: ['cxWizardDialogStep']
            }] } });
