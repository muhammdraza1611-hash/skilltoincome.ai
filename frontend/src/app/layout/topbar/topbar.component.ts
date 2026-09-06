import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppStore } from '../../core/store/app.store';
import { AuthStore } from '../../core/store/auth.store';
import { OnboardingTourComponent } from '../../shared/onboarding-tour/onboarding-tour.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule, MatBadgeModule, MatTooltipModule, RouterLink],
  template: `
    <header class="topbar">
      <div class="topbar-left">
        <button class="icon-btn" (click)="appStore.toggleSidebar()" aria-label="Toggle sidebar">
          <mat-icon>menu</mat-icon>
        </button>
        <div class="page-brand">
          <span class="page-title">SkillToIncome</span>
          <span class="page-sub">AI</span>
        </div>
      </div>

      <div class="topbar-right">
        <!-- theme toggle -->
        <button class="icon-btn" (click)="appStore.toggleDarkMode()"
                [attr.aria-label]="appStore.darkMode() ? 'Light mode' : 'Dark mode'">
          <mat-icon>{{ appStore.darkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>

        <!-- take tour again -->
        <button class="icon-btn" (click)="resetTour()" matTooltip="Take a tour" aria-label="Take tour">
          <mat-icon>help_outline</mat-icon>
        </button>

        <!-- notifications -->
        <button class="icon-btn" routerLink="/progress" aria-label="Notifications">
          <mat-icon>notifications</mat-icon>
        </button>

        <!-- user menu -->
        <button class="user-btn" [matMenuTriggerFor]="userMenu" aria-label="User menu">
          <div class="topbar-avatar">{{ initials }}</div>
          <mat-icon class="chevron">expand_more</mat-icon>
        </button>

        <mat-menu #userMenu="matMenu" class="sti-user-menu">
          <div class="menu-header">
            <div class="menu-avatar">{{ initials }}</div>
            <div class="menu-info">
              <strong>{{ authStore.user()?.full_name }}</strong>
              <small>{{ authStore.user()?.email }}</small>
            </div>
          </div>
          <button mat-menu-item routerLink="/profile">
            <mat-icon>person</mat-icon> Profile
          </button>
          <button mat-menu-item routerLink="/skills">
            <mat-icon>psychology_alt</mat-icon> Update Skills
          </button>
          <div class="menu-divider"></div>
          <button mat-menu-item class="logout-item" (click)="authStore.logout()">
            <mat-icon>logout</mat-icon> Logout
          </button>
        </mat-menu>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: 60px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px;
      background: var(--surface);
      border-bottom: 1px solid var(--border-color);
      position: sticky; top: 0; z-index: 100;
      flex-shrink: 0;
    }

    .topbar-left  { display: flex; align-items: center; gap: 10px; }
    .topbar-right { display: flex; align-items: center; gap: 4px; }

    /* icon btn */
    .icon-btn {
      width: 36px; height: 36px; border-radius: 9px;
      background: none; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-secondary);
      transition: background .2s, color .2s;
      mat-icon { font-size: 20px; }
    }
    .icon-btn:hover {
      background: var(--hover-bg);
      color: #71c4ef;
    }

    /* brand */
    .page-brand { display: flex; align-items: baseline; gap: 4px; }
    .page-title  { font-weight: 700; font-size: .95rem; color: var(--text-primary); }
    .page-sub    {
      font-size: .72rem; font-weight: 700; letter-spacing: .5px;
      color: #71c4ef;
      background: rgba(113,196,239,.1);
      border: 1px solid rgba(113,196,239,.2);
      border-radius: 4px; padding: 1px 5px;
    }

    /* user btn */
    .user-btn {
      display: flex; align-items: center; gap: 6px;
      background: rgba(113,196,239,.06);
      border: 1px solid rgba(113,196,239,.12);
      border-radius: 9px; padding: 5px 10px 5px 6px;
      cursor: pointer; transition: background .2s, border-color .2s;
    }
    .user-btn:hover {
      background: rgba(113,196,239,.1);
      border-color: rgba(113,196,239,.25);
    }
    .topbar-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(0,102,140,.4);
      border: 1.5px solid rgba(113,196,239,.35);
      display: flex; align-items: center; justify-content: center;
      font-size: .68rem; font-weight: 700; color: #71c4ef;
    }
    .chevron { font-size: 16px; color: var(--text-secondary); }

    /* menu header */
    .menu-header {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px 10px;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 4px;
    }
    .menu-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(0,102,140,.4);
      border: 1.5px solid rgba(113,196,239,.3);
      display: flex; align-items: center; justify-content: center;
      font-size: .72rem; font-weight: 700; color: #71c4ef;
      flex-shrink: 0;
    }
    .menu-info { display: flex; flex-direction: column; gap: 1px; }
    .menu-info strong { font-size: .85rem; color: var(--text-primary); }
    .menu-info small  { font-size: .75rem; color: var(--text-secondary); }
    .menu-divider { height: 1px; background: var(--border-color); margin: 4px 0; }
    .logout-item { color: #f87171 !important; }
  `],
})
export class TopbarComponent {
  appStore  = inject(AppStore);
  authStore = inject(AuthStore);

  get initials(): string {
    const name = this.authStore.user()?.full_name || '';
    return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  resetTour(): void {
    OnboardingTourComponent.resetTour();
    window.location.reload();
  }
}
