import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { CommonModule } from '@angular/common';
import { OnboardingTourComponent } from '../../shared/onboarding-tour/onboarding-tour.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule, SidebarComponent, TopbarComponent, CommonModule, OnboardingTourComponent],
  template: `
    <div class="app-layout">
      <app-sidebar />
      <div class="main-content">
        <app-topbar />
        <main class="page-content" [class.page-full]="isBuildRoute">
          <router-outlet />
        </main>
      </div>
    </div>
    <!-- Onboarding tour — shows only once for new users -->
    <app-onboarding-tour />
  `,
  styles: [`
    .app-layout {
      display: flex; height: 100vh; overflow: hidden; background: var(--background);
    }
    .main-content {
      flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0;
    }
    .page-content {
      flex: 1; overflow-y: auto; padding: 28px 32px; background: var(--background);
    }
    .page-content.page-full {
      padding: 0; overflow: hidden;
    }
  `],
})
export class MainLayoutComponent {
  get isBuildRoute(): boolean {
    return window.location.pathname.startsWith('/build');
  }
}
