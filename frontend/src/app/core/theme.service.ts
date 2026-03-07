import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'status-theme';

  readonly theme = signal<Theme>(this.loadInitial());
  readonly dark = signal<boolean>(false);

  constructor() {
    this.apply(this.theme());
    if (isPlatformBrowser(this.platformId)) {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', () => {
          if (this.theme() === 'system') this.apply('system');
        });
    }
  }

  private loadInitial(): Theme {
    if (!isPlatformBrowser(this.platformId)) return 'system';
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  }

  setTheme(theme: Theme) {
    this.theme.set(theme);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, theme);
    }
    this.apply(theme);
  }

  private apply(theme: Theme) {
    const dark =
      theme === 'dark' ||
      (theme === 'system' &&
        isPlatformBrowser(this.platformId) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.dark.set(dark);
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.classList.toggle('dark', dark);
    }
  }

  toggle() {
    const next = this.dark() ? 'light' : 'dark';
    this.setTheme(next);
  }
}
