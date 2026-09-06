import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CareerService } from '../../core/services/career.service';
import { CareerPath } from '../../core/models/career.model';

@Component({
  selector: 'app-career-analysis',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page">

      <!-- ── header ── -->
      <div class="page-head">
        <div class="head-left">
          <div class="head-badge"><span class="live-dot"></span> AI-Powered</div>
          <h1>Career Analysis</h1>
          <p>Discover your best career paths based on your skills and market demand</p>
        </div>
        <button class="btn-analyze" (click)="analyze()" [disabled]="loading()">
          @if (loading()) {
            <mat-spinner diameter="18"></mat-spinner> Analyzing…
          } @else {
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zM2 22a10 10 0 0 1 20 0"/><path d="M17 8l2 2 4-4"/></svg>
            Analyze Careers
          }
        </button>
      </div>

      <!-- error -->
      @if (errorMsg()) {
        <div class="error-bar">
          <mat-icon>warning_amber</mat-icon>
          <span>{{ errorMsg() }}</span>
          <button class="err-close" (click)="errorMsg.set(null)"><mat-icon>close</mat-icon></button>
        </div>
      }

      <!-- loading -->
      @if (loading()) {
        <div class="loading-box">
          <div class="loading-ring">
            <mat-spinner diameter="56"></mat-spinner>
          </div>
          <h3>AI is analyzing your profile…</h3>
          <p>Scanning market demand, salary data, and skill fit</p>
          <div class="loading-steps">
            @for (s of loadingSteps; track s) {
              <div class="ls"><mat-icon>check_circle</mat-icon> {{ s }}</div>
            }
          </div>
        </div>
      }

      <!-- careers grid -->
      @if (!loading() && careers().length > 0) {
        <div class="summary-row">
          <span class="found-badge">{{ careers().length }} career paths found</span>
          <span class="summary-hint">Sorted by AI suitability score</span>
        </div>

        <div class="careers-grid">
          @for (career of careers(); track career.id; let i = $index) {
            <div class="career-card" [class.top-pick]="career.is_recommended">

              <!-- rank + badge -->
              <div class="card-top-row">
                <div class="rank-badge" [class.rank-gold]="i === 0" [class.rank-silver]="i === 1" [class.rank-bronze]="i === 2">
                  #{{ i + 1 }}
                </div>
                @if (career.is_recommended) {
                  <div class="best-badge">⭐ Best Match</div>
                }
                <div class="diff-badge diff-{{ career.difficulty_level }}">{{ career.difficulty_level }}</div>
              </div>

              <!-- title -->
              <h2 class="career-title">{{ career.title }}</h2>
              <p class="career-desc">{{ career.description }}</p>

              <!-- score bars -->
              <div class="scores">
                <div class="score-row">
                  <span class="score-lbl">Suitability</span>
                  <div class="score-track">
                    <div class="score-fill fill-cyan" [style.width.%]="career.career_suitability_score"></div>
                  </div>
                  <span class="score-val">{{ career.career_suitability_score | number:'1.0-0' }}%</span>
                </div>
                <div class="score-row">
                  <span class="score-lbl">Market Demand</span>
                  <div class="score-track">
                    <div class="score-fill fill-green" [style.width.%]="career.market_demand_score"></div>
                  </div>
                  <span class="score-val">{{ career.market_demand_score | number:'1.0-0' }}%</span>
                </div>
              </div>

              <!-- stats row -->
              <div class="stats-row">
                <div class="stat-pill">
                  <mat-icon>attach_money</mat-icon>
                  <span>\${{ career.avg_salary_min / 1000 | number:'1.0-0' }}K – \${{ career.avg_salary_max / 1000 | number:'1.0-0' }}K/yr</span>
                </div>
                <div class="stat-pill">
                  <mat-icon>trending_up</mat-icon>
                  <span>{{ career.future_growth_percentage }}% growth</span>
                </div>
                @if (career.remote_opportunities) {
                  <div class="stat-pill remote">
                    <mat-icon>public</mat-icon>
                    <span>Remote</span>
                  </div>
                }
              </div>

              <!-- missing skills -->
              @if (career.missing_skills?.length) {
                <div class="skills-gap">
                  <span class="gap-label">Skills to learn</span>
                  <div class="gap-chips">
                    @for (sk of career.missing_skills.slice(0, 5); track sk) {
                      <span class="gap-chip">{{ sk }}</span>
                    }
                    @if (career.missing_skills.length > 5) {
                      <span class="gap-chip more">+{{ career.missing_skills.length - 5 }}</span>
                    }
                  </div>
                </div>
              }

              <!-- action -->
              <a class="roadmap-btn" routerLink="/roadmap"
                 [queryParams]="{careerId: career.id, careerTitle: career.title}">
                <mat-icon>map</mat-icon>
                Generate Roadmap
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
          }
        </div>
      }

      <!-- empty state -->
      @if (!loading() && careers().length === 0) {
        <div class="empty-state">
          <div class="empty-glow"></div>
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#71c4ef" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </div>
          <h2>No career analysis yet</h2>
          <p>Complete your skills assessment first, then click Analyze Careers to get AI-powered recommendations</p>
          <div class="empty-actions">
            <a class="btn-secondary" routerLink="/skills">
              <mat-icon>psychology_alt</mat-icon> Go to Skills Assessment
            </a>
            <button class="btn-primary-sm" (click)="analyze()">
              Try Analyze Now
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; }

    /* ── header ── */
    .page-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 28px; gap: 16px; flex-wrap: wrap;
    }
    .head-badge {
      display: inline-flex; align-items: center; gap: 7px;
      background: rgba(0,102,140,.15); border: 1px solid rgba(113,196,239,.22);
      border-radius: 50px; padding: 4px 13px;
      font-size: .72rem; font-weight: 600; color: #71c4ef; margin-bottom: 10px;
    }
    .live-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #4cbe7d;
      animation: blink 2s ease-in-out infinite;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
    h1 { font-size: clamp(1.5rem,3vw,2rem); font-weight: 800; color: var(--text-primary); margin: 0 0 6px; letter-spacing: -.3px; }
    p  { color: var(--text-secondary); margin: 0; font-size: .9rem; }

    .btn-analyze {
      display: inline-flex; align-items: center; gap: 8px;
      background: #00668c; color: #fff; border: none;
      border-radius: 10px; padding: 12px 22px;
      font-size: .9rem; font-weight: 700; cursor: pointer; white-space: nowrap;
      transition: background .2s, box-shadow .2s, transform .15s;
      box-shadow: 0 4px 18px rgba(0,102,140,.38);
      mat-spinner { --mdc-circular-progress-active-indicator-color: #fff; }
    }
    .btn-analyze:hover:not(:disabled) {
      background: #005a7a; box-shadow: 0 6px 26px rgba(0,102,140,.52); transform: translateY(-1px);
    }
    .btn-analyze:disabled { opacity: .55; cursor: not-allowed; transform: none; }

    /* error */
    .error-bar {
      display: flex; align-items: center; gap: 10px;
      background: rgba(248,113,113,.08); border: 1px solid rgba(248,113,113,.25);
      border-radius: 11px; padding: 12px 16px; margin-bottom: 20px;
      color: #f87171; font-size: .875rem;
      mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
      span { flex: 1; }
    }
    .err-close { background: none; border: none; cursor: pointer; color: #f87171; display: flex; padding: 0; mat-icon { font-size: 18px; } }

    /* loading */
    .loading-box {
      text-align: center; padding: 60px 20px;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .loading-ring { margin-bottom: 8px; }
    .loading-box h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .loading-box p  { color: var(--text-secondary); font-size: .875rem; margin: 0; }
    .loading-steps { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
    .ls {
      display: flex; align-items: center; gap: 5px;
      font-size: .75rem; color: rgba(113,196,239,.7);
      mat-icon { font-size: 14px; width: 14px; height: 14px; color: #4cbe7d; }
    }

    /* summary row */
    .summary-row {
      display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
    }
    .found-badge {
      background: rgba(0,102,140,.15); border: 1px solid rgba(113,196,239,.2);
      border-radius: 20px; padding: 4px 12px;
      font-size: .75rem; font-weight: 700; color: #71c4ef;
    }
    .summary-hint { font-size: .78rem; color: var(--text-secondary); }

    /* ── careers grid ── */
    .careers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 18px;
    }

    .career-card {
      background: var(--surface);
      border: 1px solid var(--border-color);
      border-radius: 16px; padding: 22px;
      display: flex; flex-direction: column; gap: 14px;
      transition: border-color .25s, transform .25s, box-shadow .25s;
      position: relative;
    }
    .career-card:hover {
      border-color: rgba(113,196,239,.28);
      transform: translateY(-3px);
      box-shadow: 0 16px 40px rgba(0,0,0,.3);
    }
    .career-card.top-pick {
      border-color: rgba(113,196,239,.3);
      box-shadow: 0 0 0 1px rgba(113,196,239,.15), 0 8px 24px rgba(0,0,0,.2);
    }

    /* card top row */
    .card-top-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

    .rank-badge {
      font-size: .68rem; font-weight: 800; letter-spacing: .5px;
      padding: 3px 9px; border-radius: 6px;
      background: rgba(255,255,255,.06); color: var(--text-secondary);
      border: 1px solid rgba(255,255,255,.08);
    }
    .rank-gold   { background: rgba(245,158,11,.15); border-color: rgba(245,158,11,.3); color: #f59e0b; }
    .rank-silver { background: rgba(148,163,184,.12); border-color: rgba(148,163,184,.25); color: #94a3b8; }
    .rank-bronze { background: rgba(180,120,60,.12); border-color: rgba(180,120,60,.25); color: #cd7f32; }

    .best-badge {
      font-size: .68rem; font-weight: 700; padding: 3px 9px; border-radius: 6px;
      background: rgba(113,196,239,.12); border: 1px solid rgba(113,196,239,.25); color: #71c4ef;
    }
    .diff-badge {
      font-size: .65rem; font-weight: 700; padding: 3px 8px; border-radius: 6px;
      text-transform: capitalize; margin-left: auto;
    }
    .diff-easy, .diff-beginner { background: rgba(76,190,125,.12); border: 1px solid rgba(76,190,125,.25); color: #4cbe7d; }
    .diff-medium, .diff-intermediate { background: rgba(245,158,11,.12); border: 1px solid rgba(245,158,11,.25); color: #f59e0b; }
    .diff-hard, .diff-advanced { background: rgba(248,113,113,.12); border: 1px solid rgba(248,113,113,.25); color: #f87171; }

    /* title */
    .career-title { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0; line-height: 1.3; }
    .career-desc  { font-size: .82rem; color: var(--text-secondary); margin: 0; line-height: 1.6; }

    /* scores */
    .scores { display: flex; flex-direction: column; gap: 8px; }
    .score-row { display: grid; grid-template-columns: 100px 1fr 38px; align-items: center; gap: 10px; }
    .score-lbl  { font-size: .72rem; color: var(--text-secondary); font-weight: 500; }
    .score-track {
      height: 5px; background: rgba(255,255,255,.07); border-radius: 3px; overflow: hidden;
    }
    .score-fill { height: 100%; border-radius: 3px; transition: width .8s cubic-bezier(.4,0,.2,1); }
    .fill-cyan  { background: linear-gradient(90deg, #00668c, #71c4ef); box-shadow: 0 0 6px rgba(113,196,239,.3); }
    .fill-green { background: linear-gradient(90deg, #059669, #4cbe7d); box-shadow: 0 0 6px rgba(76,190,125,.3); }
    .score-val  { font-size: .72rem; font-weight: 700; color: var(--text-primary); text-align: right; }

    /* stats row */
    .stats-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .stat-pill {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(255,255,255,.04); border: 1px solid rgba(113,196,239,.1);
      border-radius: 7px; padding: 5px 10px;
      font-size: .75rem; color: var(--text-secondary);
      mat-icon { font-size: 14px; width: 14px; height: 14px; color: rgba(113,196,239,.6); }
    }
    .stat-pill.remote { border-color: rgba(76,190,125,.2); color: #4cbe7d; mat-icon { color: #4cbe7d; } }

    /* skills gap */
    .skills-gap { display: flex; flex-direction: column; gap: 7px; }
    .gap-label { font-size: .68rem; font-weight: 600; letter-spacing: .5px; text-transform: uppercase; color: var(--text-secondary); }
    .gap-chips { display: flex; flex-wrap: wrap; gap: 5px; }
    .gap-chip {
      background: rgba(113,196,239,.07); border: 1px solid rgba(113,196,239,.15);
      border-radius: 6px; padding: 3px 9px;
      font-size: .72rem; color: rgba(113,196,239,.8); font-weight: 500;
    }
    .gap-chip.more { background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.1); color: var(--text-secondary); }

    /* roadmap button */
    .roadmap-btn {
      display: flex; align-items: center; gap: 7px;
      background: rgba(0,102,140,.15); border: 1px solid rgba(113,196,239,.2);
      border-radius: 9px; padding: 10px 16px;
      font-size: .84rem; font-weight: 700; color: #71c4ef;
      text-decoration: none; margin-top: auto;
      transition: background .2s, border-color .2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      svg { margin-left: auto; transition: transform .2s; }
    }
    .roadmap-btn:hover { background: rgba(0,102,140,.28); border-color: rgba(113,196,239,.4); svg { transform: translateX(3px); } }

    /* ── empty state ── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      text-align: center; padding: 80px 24px;
      position: relative;
    }
    .empty-glow {
      position: absolute; width: 300px; height: 300px; border-radius: 50%;
      background: radial-gradient(circle, rgba(0,102,140,.12), transparent 70%);
      pointer-events: none;
    }
    .empty-icon {
      width: 90px; height: 90px; border-radius: 24px;
      background: rgba(0,102,140,.12); border: 1px solid rgba(113,196,239,.18);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px; position: relative;
      box-shadow: 0 0 30px rgba(0,102,140,.15);
    }
    .empty-state h2 { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin: 0 0 10px; }
    .empty-state p  { color: var(--text-secondary); font-size: .9rem; max-width: 400px; margin: 0 0 28px; line-height: 1.6; }
    .empty-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

    .btn-secondary {
      display: inline-flex; align-items: center; gap: 7px;
      background: rgba(0,102,140,.15); border: 1px solid rgba(113,196,239,.22);
      border-radius: 9px; padding: 11px 20px;
      font-size: .875rem; font-weight: 700; color: #71c4ef;
      text-decoration: none; transition: background .2s, border-color .2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .btn-secondary:hover { background: rgba(0,102,140,.25); border-color: rgba(113,196,239,.4); }

    .btn-primary-sm {
      display: inline-flex; align-items: center;
      background: #00668c; color: #fff; border: none;
      border-radius: 9px; padding: 11px 20px;
      font-size: .875rem; font-weight: 700; cursor: pointer;
      transition: background .2s, box-shadow .2s;
      box-shadow: 0 4px 14px rgba(0,102,140,.35);
    }
    .btn-primary-sm:hover { background: #005a7a; box-shadow: 0 6px 20px rgba(0,102,140,.5); }
  `],
})
export class CareerAnalysisComponent implements OnInit {
  private careerService = inject(CareerService);

  loading  = signal(false);
  careers  = signal<CareerPath[]>([]);
  errorMsg = signal<string | null>(null);

  loadingSteps = [
    'Scanning market demand data',
    'Matching your skill profile',
    'Calculating salary ranges',
    'Ranking career paths',
  ];

  ngOnInit(): void {
    this.careerService.getCareers().subscribe({
      next: (c) => this.careers.set(c),
      error: () => {},
    });
  }

  analyze(): void {
    this.errorMsg.set(null);
    this.loading.set(true);
    this.careerService.analyzeCareers().subscribe({
      next: (careers) => { this.careers.set(careers); this.loading.set(false); },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.detail || 'Analysis failed. Make sure your OpenAI API key is set in backend/.env');
      },
    });
  }
}
