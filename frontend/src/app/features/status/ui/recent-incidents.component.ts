import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ResolvedIncidentEntry } from 'shared/status-models';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';

@Component({
  selector: 'app-recent-incidents',
  standalone: true,
  imports: [StatusBadgeComponent],
  templateUrl: './recent-incidents.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentIncidentsComponent {
  incidents = input.required<ResolvedIncidentEntry[]>();
  loading = input(false);
}
