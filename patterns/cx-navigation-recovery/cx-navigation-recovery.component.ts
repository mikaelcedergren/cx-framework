import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CxBannerComponent } from '../../primitives/feedback/cx-banner';
import { CxNavigationRecoveryService } from './cx-navigation-recovery.service';

@Component({
  selector: 'cx-navigation-recovery',
  imports: [CxBannerComponent],
  templateUrl: './cx-navigation-recovery.component.html',
  styleUrl: './cx-navigation-recovery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxNavigationRecoveryComponent {
  protected readonly recovery = inject(CxNavigationRecoveryService);
}
