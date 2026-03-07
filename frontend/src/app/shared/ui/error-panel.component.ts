import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-panel',
  standalone: true,
  template: `
    <div class="panel p-6 border-l-4 border-l-red-500" role="alert">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-start gap-3">
          <span
            class="shrink-0 w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
            aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              class="w-5 h-5 text-red-600 dark:text-red-400">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clip-rule="evenodd" />
            </svg>
          </span>
          <div>
            <p class="text-[15px] font-medium text-red-800 dark:text-red-400">
              {{ message() }}
            </p>
            <p class="text-[14px] text-slate-600 dark:text-slate-400 mt-1">
              Check your connection and try again.
            </p>
          </div>
        </div>
        @if (showRetry()) {
          <button
            type="button"
            (click)="retry.emit()"
            class="shrink-0 px-4 py-2 rounded-xl bg-red-600 text-white text-[14px] font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
            Try again
          </button>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorPanelComponent {
  readonly message = input.required<string>();
  readonly showRetry = input(false);
  readonly retry = output<void>();
}
