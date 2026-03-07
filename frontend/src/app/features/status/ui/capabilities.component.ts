import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import type { CapabilityGroup } from 'shared/status-models';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';
import { ErrorPanelComponent } from '../../../shared/ui/error-panel.component';
import { StatusLabelPipe } from '../../../pipes/status-label.pipe';

@Component({
  selector: 'app-capabilities',
  standalone: true,
  imports: [NgClass, StatusBadgeComponent, ErrorPanelComponent, StatusLabelPipe],
  templateUrl: './capabilities.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapabilitiesComponent {
  groups = input.required<CapabilityGroup[]>();
  loading = input(false);
  error = input<string | null>(null);

  readonly expandedId = signal<string | null>(null);

  toggleExpanded(id: string) {
    this.expandedId.update((v) => (v === id ? null : id));
  }

  groupWorstStatus(group: CapabilityGroup): 'HEALTHY' | 'DEGRADED' | 'OUTAGE' | 'MAINTENANCE' {
    if (group.items.some((i) => i.level === 'OUTAGE')) return 'OUTAGE';
    if (group.items.some((i) => i.level === 'DEGRADED')) return 'DEGRADED';
    if (group.items.some((i) => i.level === 'MAINTENANCE')) return 'MAINTENANCE';
    return 'HEALTHY';
  }

}
