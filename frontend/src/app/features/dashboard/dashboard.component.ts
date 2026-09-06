import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../core/store/auth.store';
import { ProgressService } from '../../core/services/progress.service';
import { RoadmapService } from '../../core/services/roadmap.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="dashboard">

      <!-- ── welcome row ── -->
      <div class="welcome-row">
        <div class="welcome-left">
          <div class="welcome-badge">
            <span class="live-dot"></span>
            AI Platform Active
          </div>
          <h1>Welcome back, <span class="hl">{{ firstName }}</span> 👋</h1>
          <p class="subtitle">Here's your learning overview for today</p>
        </div>
        <a class="cta-btn" routerLink="/skills">
          <mat-icon>add</mat-icon>
          Update Skills
        </a>
      </div>

      <!-- ── stats grid ── -->
      <div class="stats-grid">
        @for (stat of stats(); track stat.label) {
          <div class="stat-card" [class.stat-active]="stat.highlight">
            <div class="stat-icon-wrap" [style]="stat.iconStyle">
              <mat-icon>{{ stat.icon }}</mat-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
            <div class="stat-glow" [style.background]="stat.glowColor"></div>
          </div>
        }
      </div>

      <!-- ── active roadmap ── -->
      @if (activeRoadmap()) {
        <div class="roadmap-card">
          <div class="roadmap-head">
            <div class="roadmap-icon">
              <mat-icon>map</mat-icon>
            </div>
            <div class="roadmap-info">
              <div class="roadmap-label">Active Roadmap</div>
              <div class="roadmap-title">{{ activeRoadmap()?.title }}</div>
            </div>
            <a class="view-btn" routerLink="/roadmap">
              View Roadmap
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
          <div class="progress-wrap">
            <div class="progress-info">
              <span class="progress-pct">{{ activeRoadmap()?.completion_percentage | number:'1.0-0' }}% Complete</span>
              <span class="progress-tasks">Keep going!</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" [style.width.%]="activeRoadmap()?.completion_percentage"></div>
            </div>
          </div>
        </div>
      }

      <!-- ── quick actions ── -->
      <div class="section-head">
        <h2>Quick Actions</h2>
        <span class="section-tag">AI-powered</span>
      </div>

      <div class="actions-grid">
        @for (action of quickActions; track action.label) {
          <a class="action-card" [routerLink]="action.route">
            <div class="action-icon-wrap" [style]="action.iconStyle">
              <mat-icon>{{ action.icon }}</mat-icon>
            </div>
            <div class="action-body">
              <strong>{{ action.label }}</strong>
              <span>{{ action.desc }}</span>
            </div>
            <div class="action-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1160px;
      margin: 0 auto;
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* ── welcome ── */
    .welcome-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 28px; gap: 16px; flex-wrap: wrap;
    }
    .welcome-badge {
      display: inline-flex; align-items: center; gap: 7px;
      background: rgba(0,102,140,.15);
      border: 1px solid rgba(113,196,239,.22);
      border-radius: 50px; padding: 4px 12px;
      font-size: .72rem; font-weight: 600; color: #71c4ef;
      margin-bottom: 10px;
    }
    .live-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #4cbe7d;
      animation: blink 2s ease-in-out infinite; flex-shrink: 0;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }

    h1 {
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 800; color: var(--text-primary);
      margin: 0 0 6px; letter-spacing: -.3px;
    }
    .hl { color: #71c4ef; }
    .subtitle { color: var(--text-secondary); margin: 0; font-size: .9rem; }

    .cta-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: #00668c; color: #fff;
      border: none; border-radius: 9px;
      padding: 10px 20px;
      font-size: .875rem; font-weight: 700;
      text-decoration: none; white-space: nowrap;
      transition: background .25s, box-shadow .25s, transform .2s;
      box-shadow: 0 4px 16px rgba(0,102,140,.35);
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .cta-btn:hover {
      background: #005a7a;
      box-shadow: 0 6px 24px rgba(0,102,140,.5);
      transform: translateY(-1px);
    }

    /* ── stats ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 14px; margin-bottom: 20px;
    }

    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 18px 20px;
      display: flex; align-items: center; gap: 14px;
      position: relative; overflow: hidden;
      transition: border-color .3s, transform .25s, box-shadow .25s;
    }
    .stat-card:hover {
      border-color: rgba(113,196,239,.25);
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(0,0,0,.3);
    }
    .stat-card.stat-active { border-color: rgba(113,196,239,.2); }

    .stat-glow {
      position: absolute; width: 80px; height: 80px; border-radius: 50%;
      top: -20px; right: -20px; opacity: .12; pointer-events: none;
      filter: blur(20px);
    }

    .stat-icon-wrap {
      width: 46px; height: 46px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      mat-icon { color: #fff; font-size: 22px; }
    }
    .stat-body { flex: 1; min-width: 0; }
    .stat-value {
      font-size: 1.6rem; font-weight: 800;
      color: var(--text-primary); line-height: 1;
      margin-bottom: 4px;
    }
    .stat-label { font-size: .75rem; color: var(--text-secondary); font-weight: 500; }

    /* ── roadmap card ── */
    .roadmap-card {
      background: var(--surface);
      border: 1px solid rgba(113,196,239,.15);
      border-radius: 14px;
      padding: 20px 22px;
      margin-bottom: 28px;
    }
    .roadmap-head {
      display: flex; align-items: center; gap: 14px;
      margin-bottom: 16px; flex-wrap: wrap;
    }
    .roadmap-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: rgba(0,102,140,.2);
      border: 1px solid rgba(113,196,239,.2);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      mat-icon { color: #71c4ef; font-size: 20px; }
    }
    .roadmap-info { flex: 1; }
    .roadmap-label { font-size: .7rem; font-weight: 600; color: #71c4ef; text-transform: uppercase; letter-spacing: .6px; }
    .roadmap-title { font-size: .95rem; font-weight: 700; color: var(--text-primary); margin-top: 2px; }
    .view-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(0,102,140,.15);
      border: 1px solid rgba(113,196,239,.18);
      border-radius: 8px; padding: 7px 14px;
      font-size: .8rem; font-weight: 600; color: #71c4ef;
      text-decoration: none;
      transition: background .2s, border-color .2s;
    }
    .view-btn:hover { background: rgba(0,102,140,.28); border-color: rgba(113,196,239,.35); }

    .progress-info {
      display: flex; justify-content: space-between;
      font-size: .78rem; margin-bottom: 8px;
    }
    .progress-pct { color: #71c4ef; font-weight: 700; }
    .progress-tasks { color: var(--text-secondary); }
    .progress-track {
      height: 6px; background: rgba(113,196,239,.1);
      border-radius: 3px; overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #00668c, #71c4ef);
      border-radius: 3px;
      transition: width .6s cubic-bezier(.4,0,.2,1);
      box-shadow: 0 0 10px rgba(113,196,239,.4);
    }

    /* ── quick actions ── */
    .section-head {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 14px;
    }
    h2 { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .section-tag {
      font-size: .65rem; font-weight: 700; letter-spacing: .6px; text-transform: uppercase;
      color: #71c4ef;
      background: rgba(113,196,239,.1);
      border: 1px solid rgba(113,196,239,.2);
      border-radius: 20px; padding: 2px 9px;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }

    .action-card {
      background: var(--surface);
      border: 1px solid var(--border-color);
      border-radius: 13px;
      padding: 16px 18px;
      text-decoration: none;
      display: flex; align-items: center; gap: 14px;
      transition: border-color .25s, background .25s, transform .25s, box-shadow .25s;
      position: relative; overflow: hidden;
    }
    .action-card:hover {
      border-color: rgba(113,196,239,.28);
      background: rgba(113,196,239,.03);
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(0,0,0,.25);
    }
    .action-card:hover .action-arrow { opacity: 1; transform: translateX(0); color: #71c4ef; }

    .action-icon-wrap {
      width: 42px; height: 42px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      mat-icon { color: #fff; font-size: 20px; }
    }
    .action-body { flex: 1; min-width: 0; }
    .action-body strong {
      display: block; font-size: .855rem; font-weight: 700;
      color: var(--text-primary); margin-bottom: 2px;
    }
    .action-body span { font-size: .75rem; color: var(--text-secondary); }

    .action-arrow {
      color: var(--text-secondary); flex-shrink: 0;
      opacity: 0; transform: translateX(-4px);
      transition: opacity .2s, transform .2s, color .2s;
    }
  `],
})
export class DashboardComponent implements OnInit {
  authStore       = inject(AuthStore);
  private progressService = inject(ProgressService);
  private roadmapService  = inject(RoadmapService);

  get firstName(): string {
    return (this.authStore.user()?.full_name ?? '').split(' ')[0];
  }

  stats = signal([
    {
      label: 'Learning Hours', value: '0h', icon: 'schedule', highlight: false,
      iconStyle: 'background: linear-gradient(135deg, #00668c, #005a7a);',
      glowColor: '#00668c',
    },
    {
      label: 'Tasks Done', value: '0', icon: 'task_alt', highlight: false,
      iconStyle: 'background: linear-gradient(135deg, #4cbe7d, #059669);',
      glowColor: '#4cbe7d',
    },
    {
      label: 'Day Streak', value: '0 🔥', icon: 'local_fire_department', highlight: false,
      iconStyle: 'background: linear-gradient(135deg, #f59e0b, #d97706);',
      glowColor: '#f59e0b',
    },
    {
      label: 'Roadmap Progress', value: '0%', icon: 'trending_up', highlight: true,
      iconStyle: 'background: linear-gradient(135deg, #71c4ef, #00668c);',
      glowColor: '#71c4ef',
    },
  ]);

  activeRoadmap = signal<any>(null);

  quickActions = [
    {
      icon: 'psychology', label: 'AI Career Analysis', desc: 'Find your best path', route: '/careers',
      iconStyle: 'background: linear-gradient(135deg, #00668c, #005a7a);',
    },
    {
      icon: 'map', label: 'Generate Roadmap', desc: '30/60/90-day plans', route: '/roadmap',
      iconStyle: 'background: linear-gradient(135deg, #4cbe7d, #059669);',
    },
    {
      icon: 'trending_up', label: 'Income Prediction', desc: 'Know your potential', route: '/income',
      iconStyle: 'background: linear-gradient(135deg, #f59e0b, #d97706);',
    },
    {
      icon: 'smart_toy', label: 'AI Mentor', desc: 'Ask anything', route: '/chat',
      iconStyle: 'background: linear-gradient(135deg, #71c4ef, #00668c);',
    },
    {
      icon: 'folder_special', label: 'Portfolio Review', desc: 'Get AI feedback', route: '/portfolio',
      iconStyle: 'background: linear-gradient(135deg, #8b5cf6, #6d28d9);',
    },
    {
      icon: 'bar_chart', label: 'Track Progress', desc: 'Log your learning', route: '/progress',
      iconStyle: 'background: linear-gradient(135deg, #ec4899, #be185d);',
    },
  ];

  ngOnInit(): void {
    this.progressService.getWeeklyStats().subscribe({
      next: (s: any) => {
        this.stats.update(arr => [
          { ...arr[0], value: `${s.total_learning_hours}h` },
          { ...arr[1], value: String(s.total_tasks_completed) },
          { ...arr[2], value: `${s.current_streak} 🔥` },
          arr[3],
        ]);
      },
    });

    this.roadmapService.getActive().subscribe({
      next: (roadmap: any) => {
        this.activeRoadmap.set(roadmap);
        this.stats.update(arr => [
          arr[0], arr[1], arr[2],
          { ...arr[3], value: `${Math.round(roadmap.completion_percentage)}%` },
        ]);
      },
      error: () => {}, // no active roadmap yet — ignore 404
    });
  }
}
