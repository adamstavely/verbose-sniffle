import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { StatusApiService } from '../../core/status-api.service';
import { ThemeService } from '../../core/theme.service';
import type {
  AppStatusSummary,
  CoreServiceStatus,
  Workspace,
  ExternalSystemStatus,
  IncidentSummary,
  ScheduledMaintenance,
} from 'shared/status-models';
import { GlobalStatusHeaderComponent } from './ui/global-status-header.component';
import { CoreServicesStatusComponent } from './ui/core-services-status.component';
import { WorkspaceStatusOverviewComponent } from './ui/workspace-status-overview.component';
import { ExternalSystemsPanelComponent } from './ui/external-systems-panel.component';
import { ActiveIncidentsComponent } from './ui/active-incidents.component';
import { ScheduledMaintenanceComponent } from './ui/scheduled-maintenance.component';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';

@Component({
  selector: 'app-status-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    RelativeTimePipe,
    GlobalStatusHeaderComponent,
    CoreServicesStatusComponent,
    WorkspaceStatusOverviewComponent,
    ExternalSystemsPanelComponent,
    ActiveIncidentsComponent,
    ScheduledMaintenanceComponent,
  ],
  templateUrl: './status-dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusDashboardPageComponent {
  private readonly api = inject(StatusApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(ThemeService);

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);

  readonly summary = signal<AppStatusSummary | null>(null);
  readonly coreServices = signal<CoreServiceStatus[]>([]);
  readonly workspaces = signal<Workspace[]>([]);
  readonly externalSystems = signal<ExternalSystemStatus[]>([]);
  readonly incidents = signal<IncidentSummary[]>([]);
  readonly scheduledMaintenance = signal<ScheduledMaintenance[]>([]);

  trackByWorkspaceId(_index: number, workspace: Workspace): string {
    return workspace.id;
  }

  constructor() {
    this.load(false);
    interval(60_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load(true));
  }

  load(background = false) {
    if (!background) {
      this.loading.set(true);
    } else {
      this.refreshing.set(true);
    }
    this.error.set(null);

    this.api.getSummary().subscribe({
      next: (dto) => {
        this.summary.set(dto.summary);
        this.coreServices.set(dto.coreServices);
        this.loading.set(false);
        this.refreshing.set(false);
      },
      error: () => {
        this.error.set('Unable to load overall status.');
        this.loading.set(false);
        this.refreshing.set(false);
      },
    });

    this.api.getWorkspaces().subscribe({
      next: (dto) => this.workspaces.set(dto.workspaces),
      error: () => {
        // Keep summary visible even if workspaces fail.
      },
    });

    this.api.getExternalSystems().subscribe({
      next: (dto) => this.externalSystems.set(dto.systems),
      error: () => {
        // Non-fatal for main page.
      },
    });

    this.api.getIncidents().subscribe({
      next: (dto) => this.incidents.set(dto.incidents),
      error: () => {
        // Non-fatal for main page.
      },
    });

    this.api.getScheduledMaintenance().subscribe({
      next: (dto) => this.scheduledMaintenance.set(dto.maintenance),
      error: () => {
        // Non-fatal for main page.
      },
    });
  }
}

