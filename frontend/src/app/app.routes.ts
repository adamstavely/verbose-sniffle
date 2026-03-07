import { Routes } from '@angular/router';
import { StatusDashboardPageComponent } from './features/status/status-dashboard-page.component';
import { WorkspaceDetailPageComponent } from './features/status/workspace-detail-page.component';
import { ExternalSystemsPageComponent } from './features/status/external-systems-page.component';
import { IncidentDetailPageComponent } from './features/status/incident-detail-page.component';

export const routes: Routes = [
  {
    path: '',
    component: StatusDashboardPageComponent,
  },
  {
    path: 'workspaces/:workspaceId',
    component: WorkspaceDetailPageComponent,
  },
  {
    path: 'incidents/:incidentId',
    component: IncidentDetailPageComponent,
  },
  {
    path: 'external-systems',
    component: ExternalSystemsPageComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
