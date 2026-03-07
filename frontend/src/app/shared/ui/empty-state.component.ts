import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="p-8 text-center">
      <span
        class="inline-flex w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 items-center justify-center mb-3"
        aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class="w-6 h-6">
          <path
            fill-rule="evenodd"
            d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zM8 10a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5A.75.75 0 018 10zm.75 2.5a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z"
            clip-rule="evenodd" />
        </svg>
      </span>
      <p class="text-[15px] font-medium text-slate-700 dark:text-slate-300">
        {{ title() }}
      </p>
      @if (description()) {
        <p class="text-[14px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          {{ description() }}
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input<string>();
}
