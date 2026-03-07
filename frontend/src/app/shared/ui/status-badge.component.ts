import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { StatusLevel } from 'shared/status-models';
import {
  getStatusDotClass,
  getStatusPillClass,
  getStatusPillCompactClass,
  getStatusTextClass,
} from 'shared/status-utils';
import { StatusLabelPipe } from '../../pipes/status-label.pipe';

export type StatusBadgeVariant = 'pill' | 'pillCompact' | 'dot' | 'text';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass, StatusLabelPipe],
  template: `
    @switch (variant()) {
      @case ('dot') {
        <span
          class="shrink-0 w-2.5 h-2.5 rounded-full"
          [ngClass]="dotClass()"
          [attr.aria-label]="level() | statusLabel">
        </span>
      }
      @case ('text') {
        <span [ngClass]="textClass()" [attr.aria-label]="level() | statusLabel">
          {{ level() | statusLabel }}
        </span>
      }
      @case ('pillCompact') {
        <span
          class="inline-flex items-center px-2.5 py-1 rounded-lg text-[13px] font-medium shrink-0"
          [ngClass]="pillCompactClass()"
          [attr.aria-label]="level() | statusLabel">
          {{ level() | statusLabel }}
        </span>
      }
      @default {
        <span
          class="inline-flex items-center px-2.5 py-1 rounded-lg text-[12px] font-medium border shrink-0"
          [ngClass]="pillClass()"
          [attr.aria-label]="level() | statusLabel">
          {{ level() | statusLabel }}
        </span>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly level = input.required<StatusLevel | null | undefined>();
  readonly variant = input<StatusBadgeVariant>('pill');

  protected readonly dotClass = () =>
    getStatusDotClass(this.level());
  protected readonly pillClass = () =>
    getStatusPillClass(this.level());
  protected readonly pillCompactClass = () =>
    getStatusPillCompactClass(this.level());
  protected readonly textClass = () =>
    getStatusTextClass(this.level());
}
