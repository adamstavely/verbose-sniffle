import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  type AppStatusSummary,
  type CoreServiceStatus,
  type Workspace,
  type WorkspaceFeatureStatus,
  type ExternalSystemStatus,
  type IncidentSummary,
  type ScheduledMaintenance,
} from 'shared/status-models';
import {
  USE_MOCK_DATA,
  MOCK_SUMMARY,
  MOCK_WORKSPACES,
  getMockWorkspaceFeatures,
  MOCK_EXTERNAL_SYSTEMS,
  MOCK_INCIDENTS,
  getMockIncidentById,
  MOCK_SCHEDULED_MAINTENANCE,
} from './mock-status-data';

export interface StatusSummaryDto {
  summary: AppStatusSummary;
  coreServices: CoreServiceStatus[];
}

export interface WorkspacesDto {
  workspaces: Workspace[];
}

export interface WorkspaceFeaturesDto {
  workspaceId: string;
  features: WorkspaceFeatureStatus[];
}

export interface ExternalSystemsDto {
  systems: ExternalSystemStatus[];
}

export interface IncidentsDto {
  incidents: IncidentSummary[];
}

export interface ScheduledMaintenanceDto {
  maintenance: ScheduledMaintenance[];
}

@Injectable({
  providedIn: 'root',
})
export class StatusApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = signal<string>('/api/status');

  getSummary(): Observable<StatusSummaryDto> {
    if (USE_MOCK_DATA) {
      return of(MOCK_SUMMARY);
    }
    return this.http.get<StatusSummaryDto>(`${this.baseUrl()}/summary`);
  }

  getWorkspaces(): Observable<WorkspacesDto> {
    if (USE_MOCK_DATA) {
      return of(MOCK_WORKSPACES);
    }
    return this.http.get<WorkspacesDto>(`${this.baseUrl()}/workspaces`);
  }

  getWorkspaceFeatures(workspaceId: string): Observable<WorkspaceFeaturesDto> {
    if (USE_MOCK_DATA) {
      return of(getMockWorkspaceFeatures(workspaceId));
    }
    return this.http.get<WorkspaceFeaturesDto>(
      `${this.baseUrl()}/workspaces/${encodeURIComponent(workspaceId)}/features`
    );
  }

  getExternalSystems(): Observable<ExternalSystemsDto> {
    if (USE_MOCK_DATA) {
      return of(MOCK_EXTERNAL_SYSTEMS);
    }
    return this.http.get<ExternalSystemsDto>(
      `${this.baseUrl()}/external-systems`
    );
  }

  getIncidents(): Observable<IncidentsDto> {
    if (USE_MOCK_DATA) {
      return of(MOCK_INCIDENTS);
    }
    return this.http.get<IncidentsDto>(`${this.baseUrl()}/incidents`);
  }

  getScheduledMaintenance(): Observable<ScheduledMaintenanceDto> {
    if (USE_MOCK_DATA) {
      return of(MOCK_SCHEDULED_MAINTENANCE);
    }
    return this.http.get<ScheduledMaintenanceDto>(
      `${this.baseUrl()}/scheduled-maintenance`
    );
  }

  getIncidentById(incidentId: string): Observable<IncidentSummary | null> {
    if (USE_MOCK_DATA) {
      return of(getMockIncidentById(incidentId));
    }
    return this.http
      .get<IncidentSummary>(
        `${this.baseUrl()}/incidents/${encodeURIComponent(incidentId)}`
      )
      .pipe(catchError(() => of(null)));
  }
}

