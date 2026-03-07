import { NgIf, NgFor, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import type { CoreServiceStatus, StatusLevel } from 'shared/status-models';
import { StatusLabelPipe } from '../../../pipes/status-label.pipe';
import { RelativeTimePipe } from '../../../pipes/relative-time.pipe';

type SortColumn = 'service' | 'status' | 'lastUpdated';
type SortDirection = 'asc' | 'desc';

const STATUS_ORDER: Record<StatusLevel, number> = {
  OUTAGE: 0,
  DEGRADED: 1,
  MAINTENANCE: 2,
  HEALTHY: 3,
  UNKNOWN: 4,
};

@Component({
  selector: 'app-core-services-status',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, StatusLabelPipe, RelativeTimePipe],
  templateUrl: './core-services-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoreServicesStatusComponent {
  @Input() services: CoreServiceStatus[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Output() retry = new EventEmitter<void>();

  readonly sortColumn = signal<SortColumn>('status');
  readonly sortDirection = signal<SortDirection>('asc');

  readonly sortedServices = computed(() => {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    const list = [...this.services];
    list.sort((a, b) => {
      let cmp = 0;
      if (col === 'service') {
        cmp = a.name.localeCompare(b.name);
      } else if (col === 'status') {
        cmp = STATUS_ORDER[a.level] - STATUS_ORDER[b.level];
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

  trackByServiceId(_index: number, service: CoreServiceStatus): string {
    return service.id;
  }
}

