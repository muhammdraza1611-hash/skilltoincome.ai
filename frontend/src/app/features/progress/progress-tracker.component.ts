import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProgressService } from '../../core/services/progress.service';
import { WeeklyStats } from '../../core/models/roadmap.model';

@Component({
  selector: 'app-progress-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page">

      <!-- header -->
      <div class="page-head">
        <div class="head-left">
          <div class="head-badge"><span class="live-dot"></span> Daily Tracking</div>
          <h1>Progress Tracker</h1>
          <p>Log your daily learning and watch your streak grow</p>
        </div>
        <div class="today-chip">
          <mat-icon>today</mat-icon>
          {{ todayLabel }}
        </div>
      </div>

      <!-- ── LOG FORM (always visible at top) ── -->
      <div class="log-card">
        <div class="log-card-head">
          <div class="lch-icon"><mat-icon>edit_note</mat-icon></div>
          <div class="lch-info">
            <div class="lch-title">Log Today's Progress</div>
            <div class="lch-sub">How much did you learn today?</div>
          </div>
          @if (saved()) {
            <div class="saved-pill"><mat-icon>check_circle</mat-icon> Logged!</div>
          }
        </div>

        <div class="log-inputs">
          <!-- hours block -->
          <div class="input-block">
            <div class="input-label">
              <mat-icon>schedule</mat-icon> Learning Hours
            </div>
            <div class="stepper">
              <button type="button" class="step-btn" (click)="decHours()"><mat-icon>remove</mat-icon></button>
              <span class="step-val">{{ hours }}h</span>
              <button type="button" class="step-btn" (click)="incHours()"><mat-icon>add</mat-icon></button>
            </div>
            <div class="quick-pills">
              @for (h of quickHours; track h) {
                <button type="button" class="qpill" [class.qpill-on]="hours === h" (click)="hours = h">{{ h }}h</button>
              }
            </div>
          </div>

          <!-- tasks block -->
          <div class="input-block">
            <div class="input-label">
              <mat-icon>task_alt</mat-icon> Tasks Completed
            </div>
            <div class="stepper">
              <button type="button" class="step-btn" (click)="decTasks()"><mat-icon>remove</mat-icon></button>
              <span class="step-val">{{ tasks }}</span>
              <button type="button" class="step-btn" (click)="incTasks()"><mat-icon>add</mat-icon></button>
            </div>
            <div class="quick-pills">
              @for (t of quickTasks; track t) {
                <button type="button" class="qpill" [class.qpill-on]="tasks === t" (click)="tasks = t">{{ t }}</button>
              }
            </div>
          </div>
        </div>

        <!-- notes -->
        <div class="notes-block">
          <div class="input-label"><mat-icon>notes</mat-icon> Notes <span class="opt">optional</span></div>
          <input class="notes-fi" [(ngModel)]="notes" placeholder="What did you learn or accomplish today?">
        </div>

        <div class="log-footer">
          <div class="log-hint">
            <mat-icon>info_outline</mat-icon>
            Daily logging builds your streak and improves AI recommendations
          </div>
          <button class="btn-log" (click)="logProgress()" [disabled]="saving() || hours < 0.5">
            @if (saving()) {
              <mat-spinner diameter="18"></mat-spinner> Saving…
            } @else {
              <mat-icon>add_task</mat-icon> Log Progress
            }
          </button>
        </div>
      </div>

      <!-- ── STATS (shown after first log) ── -->
      @if (weeklyStats()) {

        <!-- streak -->
        <div class="streak-card" [class.on-fire]="weeklyStats()!.current_streak >= 7">
          <div class="sc-left">
            <span class="fire-emoji">🔥</span>
            <div>
              <div class="streak-big">{{ weeklyStats()!.current_streak }}-Day Streak</div>
              <div class="streak-sub">{{ streakMsg }}</div>
            </div>
          </div>
          <div class="streak-dots">
            @for (d of last7; track d.label) {
              <div class="sdot" [class.sdot-on]="d.logged" [title]="d.label">
                @if (d.logged) { <mat-icon>check</mat-icon> }
              </div>
            }
          </div>
        </div>

        <!-- stat cards -->
        <div class="stats-grid">
          <div class="s-card">
            <div class="s-icon cyan"><mat-icon>schedule</mat-icon></div>
            <div class="s-val">{{ weeklyStats()!.total_learning_hours | number:'1.0-1' }}h</div>
            <div class="s-lbl">Hours This Week</div>
          </div>
          <div class="s-card">
            <div class="s-icon green"><mat-icon>task_alt</mat-icon></div>
            <div class="s-val">{{ weeklyStats()!.total_tasks_completed }}</div>
            <div class="s-lbl">Tasks Completed</div>
          </div>
          <div class="s-card">
            <div class="s-icon amber"><mat-icon>calendar_today</mat-icon></div>
            <div class="s-val">{{ weeklyStats()!.days_logged }}/7</div>
            <div class="s-lbl">Days Logged</div>
          </div>
          <div class="s-card">
            <div class="s-icon purple"><mat-icon>local_fire_department</mat-icon></div>
            <div class="s-val">{{ weeklyStats()!.current_streak }}</div>
            <div class="s-lbl">Current Streak</div>
          </div>
        </div>

        <!-- bar chart -->
        @if (weeklyStats()!.daily_logs.length > 0) {
          <div class="chart-card">
            <div class="chart-header">
              <div class="ch-left">
                <div class="ch-icon"><mat-icon>bar_chart</mat-icon></div>
                <div>
                  <div class="ch-title">Daily Activity</div>
                  <div class="ch-sub">Learning hours this week</div>
                </div>
              </div>
              <div class="ch-max-label">Max: {{ maxHours() }}h</div>
            </div>
            <div class="bars">
              @for (log of weeklyStats()!.daily_logs; track log.date) {
                <div class="bar-col">
                  <div class="bar-val">{{ log.hours > 0 ? log.hours + 'h' : '' }}</div>
                  <div class="bar-track">
                    <div class="bar-fill"
                         [class.bar-active]="log.hours > 0"
                         [style.height.%]="barHeight(log.hours)">
                    </div>
                  </div>
                  <div class="bar-date">{{ log.date | slice:5:10 }}</div>
                  @if (log.achievements?.length) {
                    <span class="bar-trophy">🏆</span>
                  }
                </div>
              }
            </div>
          </div>
        }
      }

      <!-- empty stats hint (no data yet) -->
      @if (!weeklyStats()) {
        <div class="empty-hint">
          <div class="eh-icon"><mat-icon>trending_up</mat-icon></div>
          <div class="eh-text">Your stats and activity chart will appear here after your first log</div>
        </div>
      }

    </div>
  `,
  styles: [`
    .page { max-width: 860px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; display: flex; flex-direction: column; gap: 16px; }

    /* header */
    .page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
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

    .today-chip {
      display: inline-flex; align-items: center; gap: 7px;
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 9px; padding: 8px 14px;
      font-size: .8rem; color: var(--text-secondary); flex-shrink: 0; margin-top: 4px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #71c4ef; }
    }

    /* log card */
    .log-card {
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 16px; padding: 24px;
    }
    .log-card-head { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; flex-wrap: wrap; }
    .lch-icon {
      width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
      background: rgba(0,102,140,.2); border: 1px solid rgba(113,196,239,.2);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: #71c4ef; font-size: 22px; }
    }
    .lch-title { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
    .lch-sub   { font-size: .78rem; color: var(--text-secondary); margin-top: 2px; }

    .saved-pill {
      margin-left: auto; display: inline-flex; align-items: center; gap: 6px;
      background: rgba(76,190,125,.12); border: 1px solid rgba(76,190,125,.28);
      border-radius: 8px; padding: 6px 12px;
      font-size: .8rem; font-weight: 700; color: #4cbe7d;
      animation: pop-in .25s ease;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    @keyframes pop-in { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }

    /* inputs row */
    .log-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px; }
    @media(max-width:560px) { .log-inputs { grid-template-columns: 1fr; } }

    .input-block { display: flex; flex-direction: column; gap: 10px; }
    .input-label {
      display: flex; align-items: center; gap: 6px;
      font-size: .72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .5px; color: var(--text-secondary);
      mat-icon { font-size: 15px; width: 15px; height: 15px; color: rgba(113,196,239,.6); }
    }

    /* stepper */
    .stepper {
      display: flex; align-items: center;
      background: rgba(255,255,255,.04); border: 1px solid rgba(113,196,239,.14);
      border-radius: 10px; overflow: hidden; height: 44px;
    }
    .step-btn {
      width: 44px; height: 100%; background: none; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-secondary); transition: background .2s, color .2s; flex-shrink: 0;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .step-btn:hover { background: rgba(113,196,239,.1); color: #71c4ef; }
    .step-val {
      flex: 1; text-align: center; font-size: 1.1rem; font-weight: 800;
      color: var(--text-primary); user-select: none;
    }

    /* quick pills */
    .quick-pills { display: flex; gap: 5px; flex-wrap: wrap; }
    .qpill {
      padding: 4px 10px; border-radius: 7px;
      border: 1px solid rgba(113,196,239,.12); background: rgba(255,255,255,.03);
      font-size: .72rem; font-weight: 600; color: var(--text-secondary); cursor: pointer;
      transition: all .15s;
    }
    .qpill:hover  { border-color: rgba(113,196,239,.3); color: #71c4ef; }
    .qpill.qpill-on { background: rgba(0,102,140,.2); border-color: rgba(113,196,239,.4); color: #71c4ef; }

    /* notes */
    .notes-block { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
    .opt { text-transform: none; font-weight: 400; opacity: .6; font-size: .68rem; letter-spacing: 0; }
    .notes-fi {
      width: 100%; background: rgba(255,255,255,.04);
      border: 1px solid rgba(113,196,239,.14); border-radius: 9px;
      padding: 10px 13px; color: var(--text-primary);
      font-size: .875rem; font-family: inherit; outline: none;
      transition: border-color .2s;
    }
    .notes-fi::placeholder { color: rgba(255,255,255,.2); }
    .notes-fi:focus { border-color: rgba(113,196,239,.4); box-shadow: 0 0 0 3px rgba(113,196,239,.07); }

    .log-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 16px; border-top: 1px solid var(--border-color); gap: 12px; flex-wrap: wrap;
    }
    .log-hint {
      display: flex; align-items: center; gap: 6px;
      font-size: .75rem; color: var(--text-secondary);
      mat-icon { font-size: 15px; width: 15px; height: 15px; color: rgba(113,196,239,.5); }
    }
    .btn-log {
      display: inline-flex; align-items: center; gap: 7px;
      background: #00668c; color: #fff; border: none; border-radius: 9px;
      padding: 11px 22px; font-size: .9rem; font-weight: 700; cursor: pointer;
      transition: background .2s, box-shadow .2s, transform .15s;
      box-shadow: 0 4px 16px rgba(0,102,140,.35);
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      mat-spinner { --mdc-circular-progress-active-indicator-color: #fff; }
    }
    .btn-log:hover:not(:disabled) { background: #005a7a; box-shadow: 0 6px 22px rgba(0,102,140,.5); transform: translateY(-1px); }
    .btn-log:disabled { opacity: .5; cursor: not-allowed; transform: none; }

    /* streak card */
    .streak-card {
      display: flex; align-items: center; justify-content: space-between;
      background: linear-gradient(135deg, rgba(217,119,6,.18), rgba(180,90,0,.14));
      border: 1px solid rgba(245,158,11,.22); border-radius: 14px;
      padding: 18px 22px; gap: 16px; flex-wrap: wrap;
    }
    .streak-card.on-fire { border-color: rgba(245,158,11,.4); box-shadow: 0 0 24px rgba(245,158,11,.12); }
    .sc-left { display: flex; align-items: center; gap: 14px; }
    .fire-emoji { font-size: 2.2rem; flex-shrink: 0; }
    .streak-big { font-size: 1.15rem; font-weight: 800; color: #f59e0b; }
    .streak-sub { font-size: .78rem; color: rgba(245,158,11,.7); margin-top: 2px; }

    .streak-dots { display: flex; gap: 6px; }
    .sdot {
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(245,158,11,.08); border: 1.5px solid rgba(245,158,11,.2);
      display: flex; align-items: center; justify-content: center;
      transition: all .2s;
      mat-icon { font-size: 14px; width: 14px; height: 14px; color: #f59e0b; }
    }
    .sdot.sdot-on { background: rgba(245,158,11,.25); border-color: #f59e0b; box-shadow: 0 0 8px rgba(245,158,11,.3); }

    /* stats grid */
    .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
    @media(max-width:680px) { .stats-grid { grid-template-columns: repeat(2,1fr); } }

    .s-card {
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 13px; padding: 16px;
      display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center;
      transition: border-color .2s, transform .2s;
    }
    .s-card:hover { border-color: rgba(113,196,239,.25); transform: translateY(-2px); }
    .s-icon {
      width: 38px; height: 38px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .s-icon.cyan   { background: rgba(0,102,140,.2); border: 1px solid rgba(113,196,239,.2); mat-icon { color: #71c4ef; } }
    .s-icon.green  { background: rgba(76,190,125,.12); border: 1px solid rgba(76,190,125,.2); mat-icon { color: #4cbe7d; } }
    .s-icon.amber  { background: rgba(245,158,11,.12); border: 1px solid rgba(245,158,11,.2); mat-icon { color: #f59e0b; } }
    .s-icon.purple { background: rgba(139,92,246,.12); border: 1px solid rgba(139,92,246,.2); mat-icon { color: #a78bfa; } }
    .s-val { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
    .s-lbl { font-size: .72rem; font-weight: 600; color: var(--text-secondary); }

    /* chart card */
    .chart-card {
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 14px; padding: 20px 22px;
      display: flex; flex-direction: column; gap: 18px;
    }
    .chart-header { display: flex; align-items: center; justify-content: space-between; }
    .ch-left { display: flex; align-items: center; gap: 12px; }
    .ch-icon {
      width: 38px; height: 38px; border-radius: 9px;
      background: rgba(0,102,140,.2); border: 1px solid rgba(113,196,239,.2);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: #71c4ef; font-size: 18px; }
    }
    .ch-title  { font-size: .9rem; font-weight: 700; color: var(--text-primary); }
    .ch-sub    { font-size: .74rem; color: var(--text-secondary); }
    .ch-max-label { font-size: .72rem; color: var(--text-secondary); background: rgba(255,255,255,.04); border: 1px solid var(--border-color); border-radius: 6px; padding: 3px 9px; }

    .bars { display: flex; gap: 8px; align-items: flex-end; height: 140px; }
    .bar-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; height: 100%; }
    .bar-val  { font-size: .65rem; color: #71c4ef; font-weight: 700; min-height: 16px; }
    .bar-track { flex: 1; width: 100%; display: flex; align-items: flex-end; background: rgba(255,255,255,.04); border-radius: 5px; overflow: hidden; }
    .bar-fill  { width: 100%; min-height: 3px; border-radius: 5px; background: rgba(255,255,255,.06); transition: height .7s cubic-bezier(.4,0,.2,1); }
    .bar-fill.bar-active { background: linear-gradient(180deg, #71c4ef 0%, #00668c 100%); box-shadow: 0 0 10px rgba(113,196,239,.25); }
    .bar-date  { font-size: .62rem; color: var(--text-secondary); font-weight: 600; }
    .bar-trophy { font-size: .7rem; }

    /* empty hint */
    .empty-hint {
      display: flex; align-items: center; gap: 12px;
      background: rgba(255,255,255,.02); border: 1px dashed rgba(113,196,239,.15);
      border-radius: 12px; padding: 16px 20px;
    }
    .eh-icon {
      width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
      background: rgba(0,102,140,.15); border: 1px solid rgba(113,196,239,.15);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: #71c4ef; font-size: 18px; }
    }
    .eh-text { font-size: .82rem; color: var(--text-secondary); line-height: 1.5; }
  `],
})
export class ProgressTrackerComponent implements OnInit {
  private progressService = inject(ProgressService);

  weeklyStats = signal<WeeklyStats | null>(null);
  saving      = signal(false);
  saved       = signal(false);
  maxHours    = signal(8);

  hours = 1;
  tasks = 0;
  notes = '';

  quickHours = [0.5, 1, 2, 3, 4, 6];
  quickTasks = [0, 1, 2, 3, 5, 10];

  get todayLabel(): string {
    return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  get streakMsg(): string {
    const s = this.weeklyStats()?.current_streak ?? 0;
    if (s === 0) return 'Log today to start your streak!';
    if (s < 3)   return 'Great start! Keep going.';
    if (s < 7)   return 'Building momentum! 💪';
    if (s < 30)  return 'Amazing consistency! 🚀';
    return 'Legendary! You\'re unstoppable! 💎';
  }

  get last7(): { label: string; logged: boolean }[] {
    const logs = this.weeklyStats()?.daily_logs ?? [];
    const loggedDates = new Set(logs.filter(l => l.hours > 0).map(l => l.date.slice(0, 10)));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), logged: loggedDates.has(key) };
    });
  }

  barHeight(hours: number): number {
    const max = this.maxHours();
    return max > 0 ? Math.max((hours / max) * 100, hours > 0 ? 5 : 0) : 0;
  }

  incHours(): void { this.hours = Math.min(+(this.hours + 0.5).toFixed(1), 24); }
  decHours(): void { this.hours = Math.max(+(this.hours - 0.5).toFixed(1), 0.5); }
  incTasks(): void { this.tasks += 1; }
  decTasks(): void { this.tasks = Math.max(this.tasks - 1, 0); }

  ngOnInit(): void { this.loadStats(); }

  loadStats(): void {
    this.progressService.getWeeklyStats().subscribe({
      next: (stats) => {
        this.weeklyStats.set(stats);
        const max = Math.max(...stats.daily_logs.map((l: any) => l.hours), 1);
        this.maxHours.set(max);
      },
      error: () => {},
    });
  }

  logProgress(): void {
    if (this.hours < 0.5) return;
    this.saving.set(true);
    this.saved.set(false);
    this.progressService.logProgress(this.hours, this.tasks, this.notes || undefined).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        this.notes = '';
        this.loadStats();
        setTimeout(() => this.saved.set(false), 4000);
      },
      error: () => { this.saving.set(false); },
    });
  }
}
