import { NgIf, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { ScheduledMaintenance, CoreServiceStatus, ExternalSystemStatus } from 'shared/status-models';
import { RelativeTimePipe } from '../../../pipes/relative-time.pipe';

@Component({
  selector: 'app-scheduled-maintenance',
  standalone: true,
  imports: [NgIf, NgFor, RelativeTimePipe],
  templateUrl: './scheduled-maintenance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduledMaintenanceComponent {
  @Input() maintenance: ScheduledMaintenance[] = [];
  @Input() coreServices: CoreServiceStatus[] = [];
  @Input() externalSystems: ExternalSystemStatus[] = [];
  @Input() loading = false;

  getAffectedNames(m: ScheduledMaintenance): string[] {
    const services = (m.affectedCoreServiceIds ?? []).map((id) =>
      this.coreServices.find((s) => s.id === id)?.name ?? id
    );
    const systems = (m.affectedExternalSystemIds ?? []).map((id) =>
      this.externalSystems.find((s) => s.id === id)?.name ?? id
    );
    return [...services, ...systems];
  }

  trackByMaintenanceId(_index: number, m: ScheduledMaintenance): string {
    return m.id;
  }
}
