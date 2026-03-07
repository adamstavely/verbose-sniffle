import { NgIf, NgFor, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { IncidentSummary, StatusLevel } from 'shared/status-models';
import { StatusLabelPipe } from '../../../pipes/status-label.pipe';
import { RelativeTimePipe } from '../../../pipes/relative-time.pipe';

const SEVERITY_ORDER: Record<StatusLevel, number> = {
  OUTAGE: 0,
  DEGRADED: 1,
  MAINTENANCE: 2,
  HEALTHY: 3,
  UNKNOWN: 4,
};

@Component({
  selector: 'app-active-incidents',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, RouterLink, StatusLabelPipe, RelativeTimePipe],
  templateUrl: './active-incidents.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveIncidentsComponent {
  @Input() incidents: IncidentSummary[] = [];
  @Input() loading = false;

  readonly activeIncidents = computed(() =>
    this.incidents.filter((i) => !i.resolvedAt)
  );

  readonly sortedIncidents = computed(() => {
    return [...this.activeIncidents()].sort(
      (a, b) => SEVERITY_ORDER[a.level] - SEVERITY_ORDER[b.level]
    );
  });

  trackByIncidentId(_index: number, incident: IncidentSummary): string {
    return incident.id;
  }
}
