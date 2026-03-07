import { NgIf, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ExternalSystemStatus } from 'shared/status-models';
import { trackById } from '../utils/track-by';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { ExternalSystemTypePipe } from '../../../pipes/external-system-type.pipe';

@Component({
  selector: 'app-external-systems-panel',
  standalone: true,
  imports: [NgIf, NgFor, StatusBadgeComponent, EmptyStateComponent, ExternalSystemTypePipe],
  templateUrl: './external-systems-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalSystemsPanelComponent {
  readonly systems = input<ExternalSystemStatus[]>([]);
  readonly compact = input(false);
  readonly loading = input(false);
  readonly trackById = trackById;
}

