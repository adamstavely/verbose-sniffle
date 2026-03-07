import { NgIf, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { CoreServiceStatus } from 'shared/status-models';
import { compareByStatus } from 'shared/status-utils';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { ErrorPanelComponent } from '../../../shared/ui/error-panel.component';
import { RelativeTimePipe } from '../../../pipes/relative-time.pipe';

type SortColumn = 'service' | 'status' | 'lastUpdated';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-core-services-status',
  standalone: true,
  imports: [NgIf, NgClass, StatusBadgeComponent, EmptyStateComponent, ErrorPanelComponent, RelativeTimePipe],
  templateUrl: './core-services-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoreServicesStatusComponent {
  readonly services = input<CoreServiceStatus[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly retry = output<void>();

  readonly sortColumn = signal<SortColumn>('status');
  readonly sortDirection = signal<SortDirection>('asc');
  readonly expandedId = signal<string | null>(null);

  toggleExpanded(id: string) {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  readonly sortedServices = computed(() => {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    const list = [...this.services()];
    list.sort((a, b) => {
      let cmp = 0;
      if (col === 'service') {
        cmp = a.name.localeCompare(b.name);
      } else if (col === 'status') {
        cmp = compareByStatus(a.level, b.level);
      } else {
        cmp = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
      }
      return dir === 'asc' ? cmp : -cmp;
    });
    return list;
  });

  setSort(column: SortColumn) {
    if (this.sortColumn() === column) {
      this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set(column === 'status' ? 'asc' : 'asc');
    }
  }

}

