import { NgIf, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { AppStatusSummary } from 'shared/status-models';
import { getStatusLabel } from 'shared/status-labels';

@Component({
  selector: 'app-global-status-header',
  standalone: true,
  imports: [NgIf, NgClass],
  templateUrl: './global-status-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalStatusHeaderComponent {
  @Input() summary: AppStatusSummary | null = null;
  @Input() loading = false;
  @Input() hasError = false;

  get statusLabel(): string {
    if (this.loading) {
      return 'Loading status…';
    }
    if (this.hasError) {
      return 'Status unavailable';
    }
    return getStatusLabel(this.summary?.level);
  }

  /** Left border accent color based on status */
  get statusBorderClass(): string {
    if (this.loading || this.hasError) return 'border-l-slate-300';
    switch (this.summary?.level) {
      case 'HEALTHY': return 'border-l-emerald-500';
      case 'DEGRADED': return 'border-l-amber-500';
      case 'OUTAGE': return 'border-l-red-500';
      case 'MAINTENANCE': return 'border-l-sky-500';
      default: return 'border-l-slate-400';
    }
  }
}

