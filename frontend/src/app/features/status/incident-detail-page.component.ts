import { NgIf, NgFor, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StatusApiService } from '../../core/status-api.service';
import type {
  IncidentSummary,
  CoreServiceStatus,
  Workspace,
  ExternalSystemStatus,
} from 'shared/status-models';
import { StatusLabelPipe } from '../../pipes/status-label.pipe';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';

@Component({
  selector: 'app-incident-detail-page',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    RouterLink,
    StatusLabelPipe,
    RelativeTimePipe,
  ],
  templateUrl: './incident-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(StatusApiService);

  readonly incidentId = signal<string>('');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly incident = signal<IncidentSummary | null>(null);
  readonly coreServices = signal<CoreServiceStatus[]>([]);
  readonly workspaces = signal<Workspace[]>([]);
  readonly externalSystems = signal<ExternalSystemStatus[]>([]);

  readonly affectedServices = computed(() => {
    const incident = this.incident();
    const services = this.coreServices();
    const ids = new Set(incident?.affectedCoreServiceIds ?? []);
    return services.filter((s) => ids.has(s.id));
  });

  readonly affectedWorkspaces = computed(() => {
    const incident = this.incident();
    const workspaces = this.workspaces();
    const ids = new Set(incident?.affectedWorkspaceIds ?? []);
    return workspaces.filter((w) => ids.has(w.id));
  });

  readonly affectedExternalSystems = computed(() => {
    const incident = this.incident();
    const systems = this.externalSystems();
    const ids = new Set(incident?.affectedExternalSystemIds ?? []);
    return systems.filter((s) => ids.has(s.id));
  });

  readonly sortedUpdates = computed(() => {
    const updates = this.incident()?.updates ?? [];
    return [...updates].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('incidentId') ?? '';
    this.incidentId.set(id);
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    const incidentId = this.incidentId();

    this.api.getSummary().subscribe({
      next: (dto) => this.coreServices.set(dto.coreServices),
      error: () => {},
    });

    this.api.getWorkspaces().subscribe({
      next: (dto) => this.workspaces.set(dto.workspaces),
      error: () => {},
    });

    this.api.getExternalSystems().subscribe({
      next: (dto) => this.externalSystems.set(dto.systems),
      error: () => {},
    });

    this.api.getIncidentById(incidentId).subscribe({
      next: (inc) => {
        this.incident.set(inc);
        this.loading.set(false);
        if (!inc) {
          this.error.set('Incident not found.');
        }
      },
      error: () => {
        this.error.set('Unable to load incident details.');
        this.loading.set(false);
      },
    });
  }

  trackByServiceId(_index: number, s: CoreServiceStatus): string {
    return s.id;
  }

  trackByWorkspaceId(_index: number, w: Workspace): string {
    return w.id;
  }

  trackBySystemId(_index: number, s: ExternalSystemStatus): string {
    return s.id;
  }

  trackByUpdateIndex(index: number): number {
    return index;
  }
}
