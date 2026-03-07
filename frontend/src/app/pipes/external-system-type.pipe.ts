import { Pipe, PipeTransform } from '@angular/core';
import { getExternalSystemTypeLabel } from 'shared/status-labels';

@Pipe({ name: 'externalSystemType', standalone: true })
export class ExternalSystemTypePipe implements PipeTransform {
  transform(type: string | null | undefined): string {
    if (!type) return '—';
    return getExternalSystemTypeLabel(type);
  }
}
