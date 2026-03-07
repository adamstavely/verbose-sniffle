import { NgIf, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { Workspace, ExternalSystemStatus } from 'shared/status-models';
import { trackById } from '../utils/track-by';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';

type StatusFilter = 'ALL' | 'HEALTHY' | 'DEGRADED' | 'OUTAGE' | 'MAINTENANCE' | 'UNKNOWN';

@Component({
  selector: 'app-workspace-status-overview',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, StatusBadgeComponent, EmptyStateComponent, FormsModule],
  templateUrl: './workspace-status-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceStatusOverviewComponent {
  readonly workspaces = input<Workspace[]>([]);
  readonly externalSystems = input<ExternalSystemStatus[]>([]);
  readonly loading = input(false);

  readonly searchQuery = signal('');
  readonly statusFilter = signal<StatusFilter>('ALL');

  readonly filteredWorkspaces = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.statusFilter();
    return this.workspaces().filter((w) => {
      const matchesSearch =
        !query ||
        w.name.toLowerCase().includes(query) ||
        (w.ownerTeam?.toLowerCase().includes(query) ?? false);
      const matchesStatus = filter === 'ALL' || (w.level ?? 'UNKNOWN') === filter;
      return matchesSearch && matchesStatus;
    });
  });

  readonly trackById = trackById;
}

