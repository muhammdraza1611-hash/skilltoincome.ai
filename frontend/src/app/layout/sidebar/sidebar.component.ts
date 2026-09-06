import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../core/store/auth.store';
import { AppStore } from '../../core/store/app.store';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  template: `
    <aside class="sidebar" [class.collapsed]="!appStore.sidebarOpen()">

      <!-- logo -->
      <div class="sidebar-logo">
        <div class="brand-mark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71c4ef" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a7 7 0 0 1 7 7c0 3.5-2.5 6.5-6 7.4V18h2v2h-6v-2h2v-1.6C7.5 15.5 5 12.5 5 9a7 7 0 0 1 7-7z"/>
            <circle cx="12" cy="9" r="2" fill="#71c4ef" stroke="none"/>
          </svg>
        </div>
        <div class="logo-text">
          <span class="logo-name">SkillToIncome</span>
          <span class="logo-tag">AI Platform</span>
        </div>
      </div>

      <!-- mode switcher -->
      <div class="mode-switcher" [class.collapsed]="!appStore.sidebarOpen()">
        <button class="mode-btn" [class.mode-active]="appStore.mode() === 'analyzer'"
                (click)="setMode('analyzer')"
                [matTooltip]="!appStore.sidebarOpen() ? 'Skill Analyzer' : ''" matTooltipPosition="right">
          <mat-icon>psychology</mat-icon>
          <span class="mode-label">Skill Analyzer</span>
        </button>
        <button class="mode-btn mode-build" [class.mode-active]="appStore.mode() === 'build'"
                (click)="setMode('build')"
                [matTooltip]="!appStore.sidebarOpen() ? 'Build' : ''" matTooltipPosition="right">
          <mat-icon>code</mat-icon>
          <span class="mode-label">Build</span>
        </button>
      </div>

      <!-- nav -->
      <nav class="sidebar-nav">
        @if (appStore.mode() === 'analyzer') {
          @for (item of analyzerItems; track item.route) {
            @if (!item.adminOnly || authStore.isAdmin()) {
              <a class="nav-item" [routerLink]="item.route" routerLinkActive="active"
                 [matTooltip]="!appStore.sidebarOpen() ? item.label : ''" matTooltipPosition="right">
                <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
                <span class="nav-label">{{ item.label }}</span>
                <span class="active-indicator"></span>
              </a>
            }
          }
        }

        @if (appStore.mode() === 'build') {
          @for (item of buildItems; track item.route) {
            <a class="nav-item" [routerLink]="item.route" routerLinkActive="active"
               [matTooltip]="!appStore.sidebarOpen() ? item.label : ''" matTooltipPosition="right">
              <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
              <span class="nav-label">{{ item.label }}</span>
              <span class="active-indicator"></span>
            </a>
          }
        }
      </nav>

      <!-- footer -->
      <div class="sidebar-footer">
        <div class="user-mini" [class.hide]="!appStore.sidebarOpen()">
          <div class="user-avatar">{{ initials }}</div>
          <div class="user-meta">
            <span class="user-name">{{ authStore.user()?.full_name }}</span>
            <span class="user-role">{{ authStore.user()?.role }}</span>
          </div>
        </div>
        <button class="nav-item logout-btn" (click)="authStore.logout()"
                [matTooltip]="!appStore.sidebarOpen() ? 'Logout' : ''" matTooltipPosition="right">
          <mat-icon class="nav-icon">logout</mat-icon>
          <span class="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 240px; height: 100vh;
      background: var(--sidebar-bg);
      border-right: 1px solid var(--border-color);
      display: flex; flex-direction: column;
      transition: width .3s cubic-bezier(.4,0,.2,1);
      overflow: hidden; position: sticky; top: 0; flex-shrink: 0;
    }
    .sidebar.collapsed { width: 66px; }

    .sidebar-logo {
      display: flex; align-items: center; gap: 11px;
      padding: 18px 16px; border-bottom: 1px solid var(--border-color);
      min-height: 64px; flex-shrink: 0;
    }
    .brand-mark {
      width: 34px; height: 34px; border-radius: 9px;
      background: rgba(0,102,140,.28); border: 1px solid rgba(113,196,239,.25);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; box-shadow: 0 0 12px rgba(0,102,140,.3);
    }
    .logo-text { display: flex; flex-direction: column; gap: 1px; overflow: hidden; transition: opacity .2s, width .3s; }
    .collapsed .logo-text { opacity: 0; width: 0; }
    .logo-name { font-size: .88rem; font-weight: 700; color: var(--text-primary); white-space: nowrap; }
    .logo-tag  { font-size: .6rem; font-weight: 600; letter-spacing: .8px; text-transform: uppercase; color: #71c4ef; }

    /* ── mode switcher ── */
    .mode-switcher {
      display: flex; flex-direction: column; gap: 3px;
      padding: 10px 8px; border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
    }
    .mode-switcher.collapsed .mode-label { opacity: 0; width: 0; overflow: hidden; }

    .mode-btn {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 9px;
      background: none; border: 1px solid transparent;
      color: var(--text-secondary); cursor: pointer;
      font-size: .82rem; font-weight: 600; width: 100%;
      transition: all .2s; white-space: nowrap;
      mat-icon { font-size: 17px; width: 17px; height: 17px; flex-shrink: 0; }
    }
    .mode-btn:hover { background: var(--hover-bg); color: var(--text-primary); }

    .mode-btn.mode-active {
      background: rgba(0,102,140,.18);
      border-color: rgba(113,196,239,.2);
      color: #71c4ef;
    }
    .mode-btn.mode-build.mode-active {
      background: rgba(139,92,246,.15);
      border-color: rgba(139,92,246,.3);
      color: #a78bfa;
    }
    .mode-label { transition: opacity .2s, width .3s; overflow: hidden; }

    /* ── nav ── */
    .sidebar-nav {
      flex: 1; padding: 10px 8px;
      overflow-y: auto; overflow-x: hidden;
      display: flex; flex-direction: column; gap: 2px;
    }
    .nav-item {
      display: flex; align-items: center; gap: 11px;
      padding: 9px 10px; border-radius: 9px;
      color: var(--text-secondary); text-decoration: none;
      cursor: pointer; border: none; background: none;
      width: 100%; font-size: .835rem; font-weight: 500;
      transition: all .2s ease; white-space: nowrap;
      position: relative; overflow: hidden;
    }
    .nav-item:hover { background: var(--hover-bg); color: #71c4ef; }
    .nav-item:hover .nav-icon { color: #71c4ef; }
    .nav-item.active { background: rgba(0,102,140,.18); color: #71c4ef; border: 1px solid rgba(113,196,239,.15); }
    .nav-item.active .nav-icon { color: #71c4ef; }

    .active-indicator {
      position: absolute; left: 0; top: 20%; bottom: 20%;
      width: 3px; border-radius: 0 2px 2px 0;
      background: #71c4ef; opacity: 0; transition: opacity .2s;
    }
    .nav-item.active .active-indicator { opacity: 1; }

    .nav-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; color: var(--text-secondary); transition: color .2s; }
    .nav-label { transition: opacity .2s, width .3s; overflow: hidden; }
    .collapsed .nav-label { opacity: 0; width: 0; }

    /* ── footer ── */
    .sidebar-footer { padding: 10px 8px 14px; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 4px; }
    .user-mini {
      display: flex; align-items: center; gap: 9px;
      padding: 8px 10px; border-radius: 9px;
      background: rgba(113,196,239,.05); border: 1px solid rgba(113,196,239,.08);
      margin-bottom: 4px; overflow: hidden;
      transition: opacity .2s, height .3s, padding .3s, margin .3s;
    }
    .user-mini.hide { opacity: 0; height: 0; padding: 0; margin: 0; }
    .user-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(0,102,140,.4); border: 1.5px solid rgba(113,196,239,.3);
      display: flex; align-items: center; justify-content: center;
      font-size: .7rem; font-weight: 700; color: #71c4ef; flex-shrink: 0;
    }
    .user-meta { display: flex; flex-direction: column; gap: 1px; overflow: hidden; min-width: 0; }
    .user-name { font-size: .78rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: .62rem; text-transform: uppercase; letter-spacing: .6px; color: #71c4ef; font-weight: 600; }
    .logout-btn { color: rgba(248,113,113,.7); }
    .logout-btn:hover { background: rgba(248,113,113,.08); color: #f87171; }
    .logout-btn:hover .nav-icon { color: #f87171; }
  `],
})
export class SidebarComponent {
  authStore = inject(AuthStore);
  appStore  = inject(AppStore);
  private router = inject(Router);

  analyzerItems: NavItem[] = [
    { label: 'Dashboard',          icon: 'dashboard',            route: '/dashboard' },
    { label: 'Skills Assessment',  icon: 'psychology_alt',       route: '/skills'    },
    { label: 'Career Analysis',    icon: 'work',                 route: '/careers'   },
    { label: 'Job Board',          icon: 'work_outline',         route: '/jobs'      },
    { label: 'Roadmap',            icon: 'map',                  route: '/roadmap'   },
    { label: 'Income Prediction',  icon: 'trending_up',          route: '/income'    },
    { label: 'Portfolio Analyzer', icon: 'folder_special',       route: '/portfolio' },
    { label: 'AI Mentor',          icon: 'smart_toy',            route: '/chat'      },
    { label: 'Progress',           icon: 'bar_chart',            route: '/progress'  },
    { label: 'Profile',            icon: 'person',               route: '/profile'   },
    { label: 'Admin',              icon: 'admin_panel_settings', route: '/admin', adminOnly: true },
  ];

  buildItems: NavItem[] = [
    { label: 'Code Editor',    icon: 'code',          route: '/build'         },
    { label: 'My Projects',    icon: 'folder_open',   route: '/build/projects'},
    { label: 'Templates',      icon: 'dashboard_customize', route: '/build/templates'},
    { label: 'AI Assistant',   icon: 'smart_toy',     route: '/build/ai'      },
  ];

  get initials(): string {
    const name = this.authStore.user()?.full_name || '';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  setMode(mode: 'analyzer' | 'build'): void {
    this.appStore.setMode(mode);
    if (mode === 'analyzer') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/build']);
    }
  }
}
