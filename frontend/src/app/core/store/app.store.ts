import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppStore {
  private _darkMode = signal<boolean>((() => {
    const stored = localStorage.getItem('sti_theme');
    const isDark = stored ? stored === 'dark' : true;
    document.body.classList.toggle('dark-theme', isDark);
    return isDark;
  })());
  private _sidebarOpen = signal<boolean>(true);
  private _mode = signal<'analyzer' | 'build'>(
    (localStorage.getItem('sti_mode') as 'analyzer' | 'build') || 'analyzer'
  );

  readonly darkMode    = computed(() => this._darkMode());
  readonly sidebarOpen = computed(() => this._sidebarOpen());
  readonly mode        = computed(() => this._mode());

  toggleDarkMode(): void {
    const next = !this._darkMode();
    this._darkMode.set(next);
    localStorage.setItem('sti_theme', next ? 'dark' : 'light');
    document.body.classList.toggle('dark-theme', next);
  }

  toggleSidebar(): void { this._sidebarOpen.update(v => !v); }
  setSidebar(open: boolean): void { this._sidebarOpen.set(open); }

  setMode(mode: 'analyzer' | 'build'): void {
    this._mode.set(mode);
    localStorage.setItem('sti_mode', mode);
  }
}
