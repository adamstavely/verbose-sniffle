import { Pipe, PipeTransform } from '@angular/core';
import type { StatusLevel } from 'shared/status-models';
import { getStatusLabel } from 'shared/status-labels';

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(level: StatusLevel | null | undefined): string {
    return getStatusLabel(level);
  }
}
