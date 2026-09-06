import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page">

      <!-- header -->
      <div class="page-head">
        <div class="head-badge"><span class="live-dot"></span> Admin Panel</div>
        <h1>Admin Dashboard</h1>
        <p>Platform overview and user management</p>
      </div>

      <!-- stat cards -->
      @if (stats()) {
        <div class="stats-grid">
          @for (s of statCards(); track s.label) {
            <div class="s-card">
              <div class="s-icon" [style]="s.iconStyle">
                <mat-icon>{{ s.icon }}</mat-icon>
              </div>
              <div class="s-body">
                <div class="s-val">{{ s.value | number }}</div>
                <div class="s-lbl">{{ s.label }}</div>
              </div>
              <div class="s-glow" [style.background]="s.glow"></div>
            </div>
          }
        </div>
      }

      <!-- users table -->
      <div class="table-card">
        <div class="table-head">
          <div class="th-left">
            <div class="th-icon"><mat-icon>people</mat-icon></div>
            <div>
              <div class="th-title">All Users</div>
              <div class="th-sub">{{ users().length }} total users</div>
            </div>
          </div>
          <button class="btn-refresh" (click)="load()">
            <mat-icon>refresh</mat-icon> Refresh
          </button>
        </div>

        @if (loading()) {
          <div class="tbl-loading">
            <mat-spinner diameter="36"></mat-spinner>
            <span>Loading users…</span>
          </div>
        } @else {
          <div class="tbl-wrap">
            <table class="tbl">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (u of users(); track u.id) {
                  <tr [class.inactive-row]="!u.is_active">
                    <td>
                      <div class="user-cell">
                        <div class="user-av">{{ initials(u.full_name) }}</div>
                        <span class="user-name">{{ u.full_name }}</span>
                      </div>
                    </td>
                    <td class="email-cell">{{ u.email }}</td>
                    <td>
                      <span class="role-badge" [class.admin-badge]="u.role === 'admin'">
                        <mat-icon>{{ u.role === 'admin' ? 'admin_panel_settings' : 'school' }}</mat-icon>
                        {{ u.role }}
                      </span>
                    </td>
                    <td>
                      <span class="status-badge" [class.active-badge]="u.is_active" [class.inactive-badge]="!u.is_active">
                        <span class="status-dot"></span>
                        {{ u.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="date-cell">{{ u.created_at | date:'MMM d, yyyy' }}</td>
                    <td>
                      <button class="action-btn" [class.deact-btn]="u.is_active" [class.act-btn]="!u.is_active"
                              (click)="toggleUser(u.id)"
                              [attr.aria-label]="u.is_active ? 'Deactivate' : 'Activate'">
                        <mat-icon>{{ u.is_active ? 'person_off' : 'person' }}</mat-icon>
                        {{ u.is_active ? 'Deactivate' : 'Activate' }}
                      </button>
                    </td>
                  </tr>
                }
                @if (users().length === 0) {
                  <tr>
                    <td colspan="6" class="empty-row">No users found</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .page { max-width: 1200px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; }

    .page-head { margin-bottom: 24px; }
    .head-badge {
      display: inline-flex; align-items: center; gap: 7px;
      background: rgba(0,102,140,.15); border: 1px solid rgba(113,196,239,.22);
      border-radius: 50px; padding: 4px 13px;
      font-size: .72rem; font-weight: 600; color: #71c4ef; margin-bottom: 10px;
    }
    .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #4cbe7d; animation: blink 2s ease-in-out infinite; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
    h1 { font-size: clamp(1.4rem,3vw,1.9rem); font-weight: 800; color: var(--text-primary); margin: 0 0 5px; letter-spacing: -.3px; }
    p  { color: var(--text-secondary); margin: 0; font-size: .875rem; }

    /* stats */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 12px; margin-bottom: 20px; }
    .s-card {
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 14px; padding: 18px 16px;
      display: flex; align-items: center; gap: 14px;
      position: relative; overflow: hidden;
      transition: border-color .25s, transform .2s;
    }
    .s-card:hover { border-color: rgba(113,196,239,.25); transform: translateY(-2px); }
    .s-glow { position: absolute; width: 70px; height: 70px; border-radius: 50%; top: -20px; right: -14px; opacity: .1; filter: blur(16px); pointer-events: none; }
    .s-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; mat-icon { color: #fff; font-size: 22px; } }
    .s-val  { font-size: 1.55rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
    .s-lbl  { font-size: .72rem; color: var(--text-secondary); font-weight: 600; margin-top: 3px; }

    /* table card */
    .table-card {
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 16px; overflow: hidden;
    }
    .table-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 22px; border-bottom: 1px solid var(--border-color); gap: 12px;
    }
    .th-left { display: flex; align-items: center; gap: 12px; }
    .th-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: rgba(0,102,140,.2); border: 1px solid rgba(113,196,239,.2);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: #71c4ef; font-size: 20px; }
    }
    .th-title { font-size: .95rem; font-weight: 700; color: var(--text-primary); }
    .th-sub   { font-size: .75rem; color: var(--text-secondary); margin-top: 2px; }
    .btn-refresh {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: 1px solid var(--border-color);
      border-radius: 8px; padding: 7px 14px;
      font-size: .8rem; font-weight: 600; color: var(--text-secondary); cursor: pointer;
      transition: all .2s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .btn-refresh:hover { border-color: rgba(113,196,239,.3); color: #71c4ef; }

    .tbl-loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 48px; color: var(--text-secondary); font-size: .875rem; }

    /* table */
    .tbl-wrap { overflow-x: auto; }
    .tbl { width: 100%; border-collapse: collapse; }
    .tbl thead tr { border-bottom: 1px solid var(--border-color); }
    .tbl th {
      padding: 11px 16px; text-align: left;
      font-size: .7rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .5px; color: var(--text-secondary);
      white-space: nowrap;
    }
    .tbl td { padding: 13px 16px; border-bottom: 1px solid rgba(255,255,255,.04); vertical-align: middle; }
    .tbl tbody tr:last-child td { border-bottom: none; }
    .tbl tbody tr { transition: background .15s; }
    .tbl tbody tr:hover { background: rgba(255,255,255,.02); }
    .inactive-row { opacity: .55; }

    /* cells */
    .user-cell { display: flex; align-items: center; gap: 10px; }
    .user-av {
      width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
      background: rgba(0,102,140,.35); border: 1.5px solid rgba(113,196,239,.3);
      display: flex; align-items: center; justify-content: center;
      font-size: .68rem; font-weight: 700; color: #71c4ef;
    }
    .user-name { font-size: .875rem; font-weight: 600; color: var(--text-primary); }
    .email-cell { font-size: .82rem; color: var(--text-secondary); }
    .date-cell  { font-size: .78rem; color: var(--text-secondary); white-space: nowrap; }

    .role-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 7px;
      background: rgba(113,196,239,.1); border: 1px solid rgba(113,196,239,.2);
      font-size: .72rem; font-weight: 700; color: #71c4ef; text-transform: capitalize;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }
    .admin-badge { background: rgba(245,158,11,.12); border-color: rgba(245,158,11,.25); color: #f59e0b; }

    .status-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 7px;
      font-size: .72rem; font-weight: 700;
    }
    .active-badge   { background: rgba(76,190,125,.1); border: 1px solid rgba(76,190,125,.2); color: #4cbe7d; }
    .inactive-badge { background: rgba(248,113,113,.1); border: 1px solid rgba(248,113,113,.2); color: #f87171; }
    .status-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: currentColor;
    }
    .active-badge .status-dot { animation: blink 2s ease-in-out infinite; }

    .action-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-radius: 7px; border: 1px solid transparent;
      font-size: .72rem; font-weight: 700; cursor: pointer; white-space: nowrap;
      transition: all .2s;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .deact-btn { background: rgba(248,113,113,.08); border-color: rgba(248,113,113,.2); color: #f87171; }
    .deact-btn:hover { background: rgba(248,113,113,.18); border-color: rgba(248,113,113,.4); }
    .act-btn   { background: rgba(76,190,125,.08); border-color: rgba(76,190,125,.2); color: #4cbe7d; }
    .act-btn:hover { background: rgba(76,190,125,.18); border-color: rgba(76,190,125,.4); }

    .empty-row { text-align: center; color: var(--text-secondary); padding: 40px; font-size: .875rem; }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(ApiService);

  stats   = signal<any>(null);
  users   = signal<any[]>([]);
  loading = signal(false);

  statCards() {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Total Users',      value: s.total_users,           icon: 'people',             iconStyle: 'background: linear-gradient(135deg,#00668c,#005a7a);', glow: '#00668c' },
      { label: 'Active Users',     value: s.active_users,          icon: 'person_check',       iconStyle: 'background: linear-gradient(135deg,#059669,#047857);', glow: '#059669' },
      { label: 'Roadmaps',         value: s.total_roadmaps,        icon: 'map',                iconStyle: 'background: linear-gradient(135deg,#d97706,#b45309);', glow: '#d97706' },
      { label: 'Career Analyses',  value: s.total_career_analyses, icon: 'work',               iconStyle: 'background: linear-gradient(135deg,#7c3aed,#6d28d9);', glow: '#7c3aed' },
      { label: 'Chat Messages',    value: s.total_chat_messages,   icon: 'chat',               iconStyle: 'background: linear-gradient(135deg,#0891b2,#0e7490);', glow: '#0891b2' },
    ];
  }

  initials(name: string): string {
    return (name || '').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.get('/admin/stats').subscribe({ next: (s: any) => this.stats.set(s), error: () => {} });
    this.api.get<any[]>('/admin/users').subscribe({
      next: (u) => { this.users.set(u); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleUser(userId: number): void {
    this.api.patch(`/admin/users/${userId}/toggle-active`, {}).subscribe({
      next: (res: any) => {
        this.users.update(list => list.map(u => u.id === userId ? { ...u, is_active: res.is_active } : u));
      },
    });
  }
}
