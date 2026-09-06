import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoadmapService } from '../../core/services/roadmap.service';

@Component({
  selector: 'app-portfolio-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page">

      <!-- ── header ── -->
      <div class="page-head">
        <div class="head-badge"><span class="live-dot"></span> AI-Powered</div>
        <h1>Portfolio Analyzer</h1>
        <p>Get AI feedback on your portfolio and GitHub to maximize recruiter appeal</p>
      </div>

      <!-- ── input card ── -->
      <div class="input-card">
        <div class="card-head">
          <div class="card-icon"><mat-icon>folder_special</mat-icon></div>
          <div>
            <div class="card-title">Analyze Your Portfolio</div>
            <div class="card-sub">Provide your links and career goal for a detailed AI review</div>
          </div>
        </div>

        <div class="fields">
          <div class="field-row">
            <div class="field-icon globe"><mat-icon>language</mat-icon></div>
            <div class="field-wrap">
              <label>Portfolio URL <span class="opt">(optional)</span></label>
              <input class="fi" [(ngModel)]="portfolioUrl" placeholder="https://yourportfolio.com">
            </div>
          </div>
          <div class="field-row">
            <div class="field-icon code"><mat-icon>code</mat-icon></div>
            <div class="field-wrap">
              <label>GitHub URL <span class="opt">(optional)</span></label>
              <input class="fi" [(ngModel)]="githubUrl" placeholder="https://github.com/username">
            </div>
          </div>
          <div class="field-row">
            <div class="field-icon target"><mat-icon>track_changes</mat-icon></div>
            <div class="field-wrap">
              <label>Career Goal</label>
              <input class="fi" [(ngModel)]="careerGoal" placeholder="e.g. Frontend Developer, Full Stack Engineer">
            </div>
          </div>
        </div>

        <div class="card-footer">
          <span class="tip-txt">💡 At least one URL or career goal is needed for analysis</span>
          <button class="btn-analyze" (click)="analyze()"
                  [disabled]="loading() || (!portfolioUrl.trim() && !githubUrl.trim() && !careerGoal.trim())">
            @if (loading()) {
              <mat-spinner diameter="18"></mat-spinner> Analyzing…
            } @else {
              <mat-icon>auto_awesome</mat-icon> Analyze Portfolio
            }
          </button>
        </div>
      </div>

      <!-- error -->
      @if (errorMsg()) {
        <div class="error-bar">
          <mat-icon>warning_amber</mat-icon>
          {{ errorMsg() }}
          <button class="err-x" (click)="errorMsg.set(null)"><mat-icon>close</mat-icon></button>
        </div>
      }

      <!-- loading -->
      @if (loading()) {
        <div class="gen-state">
          <div class="gen-ring"><mat-spinner diameter="52"></mat-spinner></div>
          <h3>AI is reviewing your portfolio…</h3>
          <p>Scanning code quality, project depth, and recruiter appeal</p>
          <div class="gen-steps">
            @for (s of loadingSteps; track s) {
              <span class="gs"><mat-icon>check_circle</mat-icon>{{ s }}</span>
            }
          </div>
        </div>
      }

      <!-- ── results ── -->
      @if (review() && !loading()) {

        <!-- scores -->
        <div class="scores-row">
          @for (sc of scores(); track sc.label) {
            <div class="score-card">
              <div class="score-ring-wrap">
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="7"/>
                  <circle cx="48" cy="48" r="40" fill="none"
                          [attr.stroke]="sc.color"
                          stroke-width="7" stroke-linecap="round"
                          [attr.stroke-dasharray]="251.33"
                          [attr.stroke-dashoffset]="251.33 - (251.33 * sc.value / 100)"
                          transform="rotate(-90 48 48)"
                          style="transition: stroke-dashoffset .9s ease; filter: drop-shadow(0 0 6px currentColor)"/>
                </svg>
                <div class="ring-center">
                  <span class="ring-val">{{ sc.value | number:'1.0-0' }}</span>
                  <span class="ring-unit">/100</span>
                </div>
              </div>
              <div class="score-lbl">{{ sc.label }}</div>
              <div class="score-bar">
                <div class="score-bar-fill" [style.width.%]="sc.value" [style.background]="sc.color"></div>
              </div>
            </div>
          }
        </div>

        <!-- overall rating -->
        <div class="overall-card">
          <div class="overall-left">
            <div class="overall-icon"><mat-icon>insights</mat-icon></div>
            <div>
              <div class="overall-title">Overall Score</div>
              <div class="overall-sub">Based on quality, readiness and appeal</div>
            </div>
          </div>
          <div class="overall-val">{{ overallScore() | number:'1.0-0' }}<span>/100</span></div>
          <div class="overall-badge" [class]="overallGrade()">{{ overallGrade() | titlecase }}</div>
        </div>

        <!-- strengths -->
        @if (review()!.strengths?.length) {
          <div class="section-card">
            <div class="sec-head">
              <div class="sec-icon green"><mat-icon>verified</mat-icon></div>
              <div>
                <div class="sec-title">Strengths</div>
                <div class="sec-sub">What makes your portfolio stand out</div>
              </div>
            </div>
            <div class="item-list">
              @for (s of review()!.strengths; track s) {
                <div class="item-row green">
                  <mat-icon>check_circle</mat-icon>
                  <span>{{ s }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- missing projects -->
        @if (review()!.missing_projects?.length) {
          <div class="section-card">
            <div class="sec-head">
              <div class="sec-icon cyan"><mat-icon>rocket_launch</mat-icon></div>
              <div>
                <div class="sec-title">Recommended Projects to Add</div>
                <div class="sec-sub">Projects that will boost recruiter interest</div>
              </div>
            </div>
            <div class="item-list">
              @for (p of review()!.missing_projects; track p; let i = $index) {
                <div class="item-row cyan">
                  <div class="item-num">{{ i + 1 }}</div>
                  <span>{{ p }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- improvements -->
        @if (review()!.improvement_suggestions?.length) {
          <div class="section-card">
            <div class="sec-head">
              <div class="sec-icon amber"><mat-icon>lightbulb</mat-icon></div>
              <div>
                <div class="sec-title">Improvement Suggestions</div>
                <div class="sec-sub">Actionable changes to boost your score</div>
              </div>
            </div>
            <div class="suggestions-list">
              @for (sg of review()!.improvement_suggestions; track sg.area) {
                <div class="suggestion-row">
                  <div class="sug-area">{{ sg.area }}</div>
                  <div class="sug-text">{{ sg.suggestion }}</div>
                </div>
              }
            </div>
          </div>
        }

        <!-- re-analyze -->
        <div class="reanalyze-row">
          <button class="btn-ghost" (click)="review.set(null)">
            <mat-icon>refresh</mat-icon> Re-analyze
          </button>
        </div>
      }

      <!-- empty state -->
      @if (!review() && !loading()) {
        <div class="empty-state">
          <div class="empty-glow"></div>
          <div class="empty-icon">
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#71c4ef" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
            </svg>
          </div>
          <h2>AI-powered portfolio review</h2>
          <p>Enter your portfolio URL, GitHub, and career goal above to get a detailed score with actionable improvement tips</p>
        </div>
      }

    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; }

    /* header */
    .page-head { margin-bottom: 22px; }
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

    /* input card */
    .input-card {
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 16px; padding: 24px; margin-bottom: 20px;
    }
    .card-head { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 22px; }
    .card-icon {
      width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
      background: rgba(0,102,140,.2); border: 1px solid rgba(113,196,239,.2);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: #71c4ef; font-size: 22px; }
    }
    .card-title { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 3px; }
    .card-sub   { font-size: .8rem; color: var(--text-secondary); }

    /* fields */
    .fields { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .field-row {
      display: flex; align-items: center; gap: 12px;
      background: rgba(255,255,255,.03); border: 1px solid rgba(113,196,239,.08);
      border-radius: 11px; padding: 12px 14px;
      transition: border-color .2s;
    }
    .field-row:focus-within { border-color: rgba(113,196,239,.3); }

    .field-icon {
      width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .globe  { background: rgba(0,102,140,.2); border: 1px solid rgba(113,196,239,.2); mat-icon { color: #71c4ef; } }
    .code   { background: rgba(139,92,246,.15); border: 1px solid rgba(139,92,246,.2); mat-icon { color: #a78bfa; } }
    .target { background: rgba(76,190,125,.12); border: 1px solid rgba(76,190,125,.2); mat-icon { color: #4cbe7d; } }

    .field-wrap { flex: 1; }
    label { display: block; font-size: .68rem; font-weight: 600; letter-spacing: .5px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 4px; }
    .opt  { text-transform: none; font-weight: 400; opacity: .6; letter-spacing: 0; }
    .fi {
      width: 100%; background: none; border: none; outline: none;
      color: var(--text-primary); font-size: .9rem; font-family: inherit;
    }
    .fi::placeholder { color: rgba(255,255,255,.22); }

    .card-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding-top: 16px; border-top: 1px solid var(--border-color); }
    .tip-txt { font-size: .78rem; color: var(--text-secondary); }

    .btn-analyze {
      display: inline-flex; align-items: center; gap: 7px;
      background: #00668c; color: #fff; border: none;
      border-radius: 9px; padding: 11px 22px;
      font-size: .9rem; font-weight: 700; cursor: pointer;
      transition: background .2s, box-shadow .2s, transform .15s;
      box-shadow: 0 4px 16px rgba(0,102,140,.35);
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      mat-spinner { --mdc-circular-progress-active-indicator-color: #fff; }
    }
    .btn-analyze:hover:not(:disabled) { background: #005a7a; box-shadow: 0 6px 22px rgba(0,102,140,.5); transform: translateY(-1px); }
    .btn-analyze:disabled { opacity: .5; cursor: not-allowed; transform: none; }

    /* error */
    .error-bar {
      display: flex; align-items: center; gap: 10px;
      background: rgba(248,113,113,.08); border: 1px solid rgba(248,113,113,.25);
      border-radius: 11px; padding: 12px 16px; margin-bottom: 20px;
      color: #f87171; font-size: .875rem;
      mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    }
    .err-x { background: none; border: none; cursor: pointer; color: #f87171; margin-left: auto; display: flex; padding: 0; mat-icon { font-size: 18px; } }

    /* loading */
    .gen-state { text-align: center; padding: 56px 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .gen-ring { margin-bottom: 6px; }
    .gen-state h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .gen-state > p { color: var(--text-secondary); font-size: .875rem; margin: 0; }
    .gen-steps { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 6px; }
    .gs { display: flex; align-items: center; gap: 5px; font-size: .75rem; color: rgba(113,196,239,.7); mat-icon { font-size: 14px; width: 14px; height: 14px; color: #4cbe7d; } }

    /* scores row */
    .scores-row {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 14px; margin-bottom: 16px;
    }
    @media (max-width: 600px) { .scores-row { grid-template-columns: 1fr; } }

    .score-card {
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 14px; padding: 20px;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      transition: border-color .25s, transform .25s;
    }
    .score-card:hover { border-color: rgba(113,196,239,.25); transform: translateY(-2px); }

    .score-ring-wrap { position: relative; width: 96px; height: 96px; }
    .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .ring-val  { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
    .ring-unit { font-size: .6rem; color: var(--text-secondary); }
    .score-lbl { font-size: .8rem; font-weight: 600; color: var(--text-secondary); text-align: center; }
    .score-bar { width: 100%; height: 4px; background: rgba(255,255,255,.07); border-radius: 2px; overflow: hidden; }
    .score-bar-fill { height: 100%; border-radius: 2px; transition: width .8s ease; opacity: .7; }

    /* overall */
    .overall-card {
      display: flex; align-items: center; gap: 16px;
      background: var(--surface); border: 1px solid rgba(113,196,239,.18);
      border-radius: 14px; padding: 18px 22px; margin-bottom: 16px; flex-wrap: wrap;
    }
    .overall-left { display: flex; align-items: center; gap: 12px; flex: 1; }
    .overall-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: rgba(0,102,140,.2); border: 1px solid rgba(113,196,239,.2);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: #71c4ef; font-size: 20px; }
    }
    .overall-title { font-size: .9rem; font-weight: 700; color: var(--text-primary); }
    .overall-sub   { font-size: .75rem; color: var(--text-secondary); margin-top: 2px; }
    .overall-val   { font-size: 2rem; font-weight: 800; color: var(--text-primary); span { font-size: .9rem; color: var(--text-secondary); } }
    .overall-badge { padding: 5px 14px; border-radius: 8px; font-size: .78rem; font-weight: 700; text-transform: capitalize; }
    .excellent { background: rgba(76,190,125,.15); border: 1px solid rgba(76,190,125,.3); color: #4cbe7d; }
    .good      { background: rgba(113,196,239,.12); border: 1px solid rgba(113,196,239,.25); color: #71c4ef; }
    .fair      { background: rgba(245,158,11,.12); border: 1px solid rgba(245,158,11,.25); color: #f59e0b; }
    .poor      { background: rgba(248,113,113,.12); border: 1px solid rgba(248,113,113,.25); color: #f87171; }

    /* section card */
    .section-card {
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 14px; padding: 20px 22px;
      display: flex; flex-direction: column; gap: 16px;
      margin-bottom: 14px;
    }
    .sec-head { display: flex; align-items: flex-start; gap: 12px; }
    .sec-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .sec-icon.green  { background: rgba(76,190,125,.12); border: 1px solid rgba(76,190,125,.2); mat-icon { color: #4cbe7d; } }
    .sec-icon.cyan   { background: rgba(0,102,140,.2);   border: 1px solid rgba(113,196,239,.2); mat-icon { color: #71c4ef; } }
    .sec-icon.amber  { background: rgba(245,158,11,.12); border: 1px solid rgba(245,158,11,.2); mat-icon { color: #f59e0b; } }
    .sec-title { font-size: .95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
    .sec-sub   { font-size: .76rem; color: var(--text-secondary); }

    /* item list */
    .item-list { display: flex; flex-direction: column; gap: 8px; }
    .item-row {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px 14px; border-radius: 9px; font-size: .875rem;
      border: 1px solid transparent;
    }
    .item-row.green { background: rgba(76,190,125,.06); border-color: rgba(76,190,125,.12); color: var(--text-primary); mat-icon { color: #4cbe7d; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; } }
    .item-row.cyan  { background: rgba(0,102,140,.08); border-color: rgba(113,196,239,.12); color: var(--text-primary); }
    .item-num {
      width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0;
      background: rgba(0,102,140,.2); border: 1px solid rgba(113,196,239,.2);
      display: flex; align-items: center; justify-content: center;
      font-size: .68rem; font-weight: 700; color: #71c4ef;
    }

    /* suggestions */
    .suggestions-list { display: flex; flex-direction: column; gap: 10px; }
    .suggestion-row {
      padding: 12px 16px; border-radius: 10px;
      background: rgba(245,158,11,.05); border: 1px solid rgba(245,158,11,.12);
    }
    .sug-area { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #f59e0b; margin-bottom: 4px; }
    .sug-text { font-size: .875rem; color: var(--text-primary); line-height: 1.5; }

    /* reanalyze */
    .reanalyze-row { display: flex; justify-content: center; margin-top: 8px; }
    .btn-ghost {
      display: inline-flex; align-items: center; gap: 7px;
      background: none; border: 1px solid var(--border-color);
      border-radius: 9px; padding: 10px 20px;
      font-size: .875rem; font-weight: 600; color: var(--text-secondary); cursor: pointer;
      transition: border-color .2s, color .2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .btn-ghost:hover { border-color: rgba(113,196,239,.3); color: #71c4ef; }

    /* empty */
    .empty-state {
      text-align: center; padding: 70px 24px;
      display: flex; flex-direction: column; align-items: center; gap: 14px;
      position: relative;
    }
    .empty-glow {
      position: absolute; width: 280px; height: 280px; border-radius: 50%;
      background: radial-gradient(circle, rgba(0,102,140,.1), transparent 70%);
      pointer-events: none;
    }
    .empty-icon {
      width: 88px; height: 88px; border-radius: 22px;
      background: rgba(0,102,140,.12); border: 1px solid rgba(113,196,239,.18);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 28px rgba(0,102,140,.15);
    }
    .empty-state h2 { font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .empty-state > p { color: var(--text-secondary); font-size: .875rem; max-width: 400px; line-height: 1.65; margin: 0; }
  `],
})
export class PortfolioAnalyzerComponent {
  private roadmapService = inject(RoadmapService);

  loading    = signal(false);
  review     = signal<any>(null);
  errorMsg   = signal<string | null>(null);

  portfolioUrl = '';
  githubUrl    = '';
  careerGoal   = '';

  loadingSteps = ['Scanning portfolio structure', 'Reviewing GitHub projects', 'Checking recruiter appeal', 'Generating suggestions'];

  scores() {
    const r = this.review();
    if (!r) return [];
    return [
      { label: 'Portfolio Quality',  value: r.quality_score,                   color: '#71c4ef' },
      { label: 'Resume Readiness',   value: r.resume_readiness_score,          color: '#4cbe7d' },
      { label: 'Recruiter Appeal',   value: r.recruiter_attractiveness_score,  color: '#f59e0b' },
    ];
  }

  overallScore(): number {
    const r = this.review();
    if (!r) return 0;
    return (r.quality_score + r.resume_readiness_score + r.recruiter_attractiveness_score) / 3;
  }

  overallGrade(): string {
    const s = this.overallScore();
    if (s >= 80) return 'excellent';
    if (s >= 65) return 'good';
    if (s >= 45) return 'fair';
    return 'poor';
  }

  analyze(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.roadmapService.analyzePortfolio({
      portfolio_url: this.portfolioUrl || undefined,
      github_url:    this.githubUrl    || undefined,
      career_goal:   this.careerGoal   || undefined,
    }).subscribe({
      next: (r) => { this.review.set(r); this.loading.set(false); },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.detail || 'Analysis failed. Make sure your OpenAI API key is set in backend/.env');
      },
    });
  }
}
