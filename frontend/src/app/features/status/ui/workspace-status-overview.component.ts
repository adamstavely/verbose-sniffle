import { NgIf, NgFor, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { Workspace, ExternalSystemStatus } from 'shared/status-models';
import { StatusLabelPipe } from '../../../pipes/status-label.pipe';

type StatusFilter = 'ALL' | 'HEALTHY' | 'DEGRADED' | 'OUTAGE' | 'MAINTENANCE' | 'UNKNOWN';

@Component({
  selector: 'app-workspace-status-overview',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, RouterLink, StatusLabelPipe, FormsModule],
  templateUrl: './workspace-status-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceStatusOverviewComponent {
  @Input() workspaces: Workspace[] = [];
  @Input() externalSystems: ExternalSystemStatus[] = [];
  @Input() loading = false;

  readonly searchQuery = signal('');
  readonly statusFilter = signal<StatusFilter>('ALL');

  readonly filteredWorkspaces = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.statusFilter();
    return this.workspaces.filter((w) => {
      const matchesSearch =
        !query ||
        w.name.toLowerCase().includes(query) ||
        (w.ownerTeam?.toLowerCase().includes(query) ?? false);
      const matchesStatus = filter === 'ALL' || (w.level ?? 'UNKNOWN') === filter;
      return matchesSearch && matchesStatus;
    });
  });

  trackByWorkspaceId(_index: number, workspace: Workspace): string {
    return workspace.id;
  }
}

