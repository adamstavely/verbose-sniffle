import { NgIf, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatusApiService } from '../../core/status-api.service';
import type { ExternalSystemStatus } from 'shared/status-models';
import { StatusLabelPipe } from '../../pipes/status-label.pipe';
import { ExternalSystemTypePipe } from '../../pipes/external-system-type.pipe';

@Component({
  selector: 'app-external-systems-page',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, StatusLabelPipe, ExternalSystemTypePipe],
  templateUrl: './external-systems-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalSystemsPageComponent {
  private readonly api = inject(StatusApiService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly systems = signal<ExternalSystemStatus[]>([]);

  trackBySystemId(_index: number, system: ExternalSystemStatus): string {
    return system.id;
  }

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    this.api.getExternalSystems().subscribe({
      next: (dto) => {
        this.systems.set(dto.systems);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load external system status.');
        this.loading.set(false);
      },
    });
  }
}

