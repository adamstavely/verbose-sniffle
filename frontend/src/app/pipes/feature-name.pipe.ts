import { Pipe, PipeTransform } from '@angular/core';
import { getFeatureDisplayName } from 'shared/status-labels';

@Pipe({ name: 'featureName', standalone: true })
export class FeatureNamePipe implements PipeTransform {
  transform(featureId: string | null | undefined): string {
    if (!featureId) return '—';
    return getFeatureDisplayName(featureId);
  }
}
