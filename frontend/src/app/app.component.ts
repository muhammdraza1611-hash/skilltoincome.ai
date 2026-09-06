import { Component, OnInit, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppStore } from './core/store/app.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent implements OnInit {
  private appStore = inject(AppStore);

  ngOnInit(): void {
    // Apply saved theme on startup
    if (this.appStore.darkMode()) {
      document.body.classList.add('dark-theme');
    }
  }
}
