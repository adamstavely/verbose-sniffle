import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { AppStatusSummary } from 'shared/status-models';
import { ThemeService } from '../../../core/theme.service';

@Component({
  selector: 'app-global-status-header',
  standalone: true,
  imports: [NgClass],
  templateUrl: './global-status-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalStatusHeaderComponent {
  readonly theme = inject(ThemeService);
  readonly summary = input<AppStatusSummary | null>(null);

  protected bannerClass(): string {
    const level = this.summary()?.level;
    switch (level) {
      case 'HEALTHY':
        return 'hero-banner hero-banner-healthy';
      case 'DEGRADED':
        return 'hero-banner hero-banner-degraded';
      case 'OUTAGE':
        return 'hero-banner hero-banner-outage';
      case 'MAINTENANCE':
        return 'hero-banner hero-banner-maintenance';
      default:
        return 'hero-banner hero-banner-neutral';
    }
  }
}
