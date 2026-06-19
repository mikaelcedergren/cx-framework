import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: 'ng-template[cxWizardDialogStep]',
  standalone: true,
})
export class CxWizardDialogStepDirective {
  stepId = '';

  @Input('cxWizardDialogStep')
  set cxStepId(value: string) {
    this.stepId = value;
  }

  public constructor(public readonly templateRef: TemplateRef<unknown>) {}
}
