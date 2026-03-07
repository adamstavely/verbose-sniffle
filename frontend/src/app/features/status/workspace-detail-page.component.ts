import { NgIf, NgFor, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StatusApiService } from '../../core/status-api.service';
import type {
  WorkspaceFeatureStatus,
  ExternalSystemStatus,
} from 'shared/status-models';
import { StatusLabelPipe } from '../../pipes/status-label.pipe';
import { FeatureNamePipe } from '../../pipes/feature-name.pipe';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { ExternalSystemTypePipe } from '../../pipes/external-system-type.pipe';

@Component({
  selector: 'app-workspace-detail-page',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    RouterLink,
    StatusLabelPipe,
    FeatureNamePipe,
    RelativeTimePipe,
    ExternalSystemTypePipe,
  ],
  templateUrl: './workspace-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(StatusApiService);

  readonly workspaceId = signal<string>('');
  readonly workspaceName = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly features = signal<WorkspaceFeatureStatus[]>([]);
  readonly externalSystems = signal<ExternalSystemStatus[]>([]);

  readonly impactedSystems = computed(() => {
    const ids = new Set<string>();
    for (const feature of this.features()) {
      for (const sysId of feature.impactingExternalSystemIds ?? []) {
        ids.add(sysId);
      }
    }
    return this.externalSystems().filter((s) => ids.has(s.id));
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('workspaceId') ?? '';
    this.workspaceId.set(id);
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    const workspaceId = this.workspaceId();

    this.api.getWorkspaces().subscribe({
      next: (dto) => {
        const ws = dto.workspaces.find((w) => w.id === workspaceId);
        this.workspaceName.set(ws?.name ?? null);
      },
    });

    this.api.getWorkspaceFeatures(workspaceId).subscribe({
      next: (dto) => {
        this.features.set(dto.features);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load feature status for this workspace.');
        this.loading.set(false);
      },
    });

    this.api.getExternalSystems().subscribe({
      next: (dto) => this.externalSystems.set(dto.systems),
      error: () => {
        // Non-fatal.
      },
    });
  }

  trackByFeatureId(_index: number, feature: WorkspaceFeatureStatus): string {
    return feature.featureId;
  }

  trackBySystemId(_index: number, system: ExternalSystemStatus): string {
    return system.id;
  }
}

