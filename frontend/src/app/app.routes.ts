import { Routes } from '@angular/router';
import { StatusDashboardPageComponent } from './features/status/status-dashboard-page.component';

export const routes: Routes = [
  {
    path: '',
    component: StatusDashboardPageComponent,
  },
  {
    path: 'workspaces/:workspaceId',
    loadComponent: () =>
      import('./features/status/workspace-detail-page.component').then(
        (m) => m.WorkspaceDetailPageComponent
      ),
  },
  {
    path: 'incidents/:incidentId',
    loadComponent: () =>
      import('./features/status/incident-detail-page.component').then(
        (m) => m.IncidentDetailPageComponent
      ),
  },
  {
    path: 'external-systems',
    loadComponent: () =>
      import('./features/status/external-systems-page.component').then(
        (m) => m.ExternalSystemsPageComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
