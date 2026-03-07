import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, interval, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StatusApiService } from '../../core/status-api.service';
import type {
  AppStatusSummary,
  CoreServiceStatus,
  ExternalSystemStatus,
  IncidentSummary,
  ResolvedIncidentEntry,
  ScheduledMaintenance,
  Workspace,
} from 'shared/status-models';
import { GlobalStatusHeaderComponent } from './ui/global-status-header.component';
import { CapabilitiesComponent } from './ui/capabilities.component';
import { CoreServicesStatusComponent } from './ui/core-services-status.component';
import { WorkspaceStatusOverviewComponent } from './ui/workspace-status-overview.component';
import { ExternalSystemsPanelComponent } from './ui/external-systems-panel.component';
import { ActiveIncidentsComponent } from './ui/active-incidents.component';
import { ScheduledMaintenanceComponent } from './ui/scheduled-maintenance.component';
import { UptimeBarComponent } from './ui/uptime-bar.component';
import { RecentIncidentsComponent } from './ui/recent-incidents.component';
import { SubscribeNotificationsComponent } from './ui/subscribe-notifications.component';
import { buildCapabilityGroups } from 'shared/capability-groups';
@Component({
  selector: 'app-status-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    GlobalStatusHeaderComponent,
    CapabilitiesComponent,
    CoreServicesStatusComponent,
    WorkspaceStatusOverviewComponent,
    ExternalSystemsPanelComponent,
    ActiveIncidentsComponent,
    ScheduledMaintenanceComponent,
    UptimeBarComponent,
    RecentIncidentsComponent,
    SubscribeNotificationsComponent,
  ],
  templateUrl: './status-dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusDashboardPageComponent {
  private readonly api = inject(StatusApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);

  readonly summary = signal<AppStatusSummary | null>(null);
  readonly coreServices = signal<CoreServiceStatus[]>([]);
  readonly workspaces = signal<Workspace[]>([]);

  readonly capabilityGroups = computed(() => buildCapabilityGroups(this.coreServices()));
  readonly externalSystems = signal<ExternalSystemStatus[]>([]);
  readonly incidents = signal<IncidentSummary[]>([]);
  readonly scheduledMaintenance = signal<ScheduledMaintenance[]>([]);
  readonly recentIncidents = signal<ResolvedIncidentEntry[]>([]);

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

    forkJoin({
      summary: this.api.getSummary().pipe(
        catchError(() => {
          this.error.set('Unable to load overall status.');
          return of(null);
        })
      ),
      workspaces: this.api.getWorkspaces().pipe(
        catchError(() => of({ workspaces: [] as Workspace[] }))
      ),
      externalSystems: this.api.getExternalSystems().pipe(
        catchError(() => of({ systems: [] as ExternalSystemStatus[] }))
      ),
      incidents: this.api.getIncidents().pipe(
        catchError(() => of({ incidents: [] as IncidentSummary[] }))
      ),
      maintenance: this.api.getScheduledMaintenance().pipe(
        catchError(() => of({ maintenance: [] as ScheduledMaintenance[] }))
      ),
      recentIncidents: this.api.getRecentIncidents().pipe(
        catchError(() => of([] as ResolvedIncidentEntry[]))
      ),
    }).subscribe({
      next: (result) => {
        if (result.summary) {
          this.summary.set(result.summary.summary);
          this.coreServices.set(result.summary.coreServices);
        }
        this.workspaces.set(result.workspaces.workspaces);
        this.externalSystems.set(result.externalSystems.systems);
        this.incidents.set(result.incidents.incidents);
        this.scheduledMaintenance.set(result.maintenance.maintenance);
        this.recentIncidents.set(result.recentIncidents);
        this.loading.set(false);
        this.refreshing.set(false);
      },
      error: () => {
        this.error.set('Unable to load overall status.');
        this.loading.set(false);
        this.refreshing.set(false);
      },
    });
  }
}

