import { NgIf, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ScheduledMaintenance, CoreServiceStatus, ExternalSystemStatus } from 'shared/status-models';
import { trackById } from '../utils/track-by';
import { RelativeTimePipe } from '../../../pipes/relative-time.pipe';

@Component({
  selector: 'app-scheduled-maintenance',
  standalone: true,
  imports: [NgIf, NgFor, RelativeTimePipe],
  templateUrl: './scheduled-maintenance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduledMaintenanceComponent {
  readonly maintenance = input<ScheduledMaintenance[]>([]);
  readonly coreServices = input<CoreServiceStatus[]>([]);
  readonly externalSystems = input<ExternalSystemStatus[]>([]);
  readonly loading = input(false);
  readonly trackById = trackById;

  getAffectedNames(m: ScheduledMaintenance): string[] {
    const services = (m.affectedCoreServiceIds ?? []).map((id) =>
      this.coreServices().find((s) => s.id === id)?.name ?? id
    );
    const systems = (m.affectedExternalSystemIds ?? []).map((id) =>
      this.externalSystems().find((s) => s.id === id)?.name ?? id
    );
    return [...services, ...systems];
  }
}
