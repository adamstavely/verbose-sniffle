import { NgIf, NgFor, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { ExternalSystemStatus } from 'shared/status-models';
import { StatusLabelPipe } from '../../../pipes/status-label.pipe';
import { ExternalSystemTypePipe } from '../../../pipes/external-system-type.pipe';

@Component({
  selector: 'app-external-systems-panel',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, StatusLabelPipe, ExternalSystemTypePipe],
  templateUrl: './external-systems-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalSystemsPanelComponent {
  @Input() systems: ExternalSystemStatus[] = [];
  @Input() compact = false;
  @Input() loading = false;

  trackBySystemId(_index: number, system: ExternalSystemStatus): string {
    return system.id;
  }
}

