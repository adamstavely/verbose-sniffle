import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(Math.abs(diffMs) / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    const formatDate = () =>
      date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

    if (diffMs >= 0) {
      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
      if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
      if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
      return formatDate();
    }

    if (diffSec < 60) return 'In a moment';
    if (diffMin < 60) return `In ${diffMin} minute${diffMin === 1 ? '' : 's'}`;
    if (diffHour < 24) return `In ${diffHour} hour${diffHour === 1 ? '' : 's'}`;
    if (diffDay < 7) return `In ${diffDay} day${diffDay === 1 ? '' : 's'}`;
    return formatDate();
  }
}
