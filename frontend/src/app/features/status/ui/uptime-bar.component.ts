import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type DailyStatus = 'operational' | 'degraded' | 'unavailable';

export interface UptimeData {
  days: DailyStatus[];
  percentage: number;
}

/** Generates deterministic mock data for 90 days. Replace with API when backend supports. */
function mockUptimeData(): UptimeData {
  const days: DailyStatus[] = [];
  let operational = 0;
  for (let i = 0; i < 90; i++) {
    const r = (i * 7 + 13) % 100 / 100;
    const status: DailyStatus =
      r > 0.97 ? 'unavailable' : r > 0.94 ? 'degraded' : 'operational';
    days.push(status);
    if (status === 'operational') operational++;
  }
  return {
    days,
    percentage: Math.round((operational / 90) * 1000) / 10,
  };
}

@Component({
  selector: 'app-uptime-bar',
  standalone: true,
  imports: [],
  templateUrl: './uptime-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UptimeBarComponent {
  readonly data = input<UptimeData | null>(null);

  get uptime(): UptimeData {
    return this.data() ?? mockUptimeData();
  }

  getBarClasses(day: DailyStatus): string {
    const base = 'flex-1 rounded-sm min-w-[2px] transition-[height] duration-100';
    const height =
      day === 'unavailable'
        ? 'h-7'
        : day === 'degraded'
          ? 'h-5'
          : 'h-3.5';
    const color =
      day === 'unavailable'
        ? 'bg-red-500'
        : day === 'degraded'
          ? 'bg-amber-500'
          : 'bg-emerald-500/80 dark:bg-emerald-500/70';
    return `${base} ${height} ${color}`;
  }
}
