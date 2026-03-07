import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { IncidentSummary } from 'shared/status-models';
import { compareByStatus } from 'shared/status-utils';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';
import { RelativeTimePipe } from '../../../pipes/relative-time.pipe';

@Component({
  selector: 'app-active-incidents',
  standalone: true,
  imports: [NgClass, RouterLink, StatusBadgeComponent, RelativeTimePipe],
  templateUrl: './active-incidents.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveIncidentsComponent {
  readonly incidents = input<IncidentSummary[]>([]);
  readonly loading = input(false);

  readonly expandedUpdatesId = signal<string | null>(null);

  toggleUpdates(id: string) {
    this.expandedUpdatesId.update((current) => (current === id ? null : id));
  }

  readonly activeIncidents = computed(() =>
    this.incidents().filter((i) => !i.resolvedAt)
  );

  readonly sortedIncidents = computed(() => {
    return [...this.activeIncidents()].sort((a, b) =>
      compareByStatus(a.level, b.level)
    );
  });
}
