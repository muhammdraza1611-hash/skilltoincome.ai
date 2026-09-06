import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoadmapService } from '../../core/services/roadmap.service';

@Component({
  selector: 'app-income-prediction',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page">

      <!-- ── header ── -->
      <div class="page-head">
        <div class="head-left">
          <div class="head-badge"><span class="live-dot"></span> AI-Powered</div>
          <h1>Income Prediction Engine</h1>
          <p>AI-powered earnings forecast based on your skills and market data</p>
        </div>
      </div>

      <!-- ── search bar ── -->
      <div class="search-card">
        <div class="search-icon"><mat-icon>trending_up</mat-icon></div>
        <div class="search-wrap" [class.focused]="focused">
          <input
            [(ngModel)]="careerInput"
            placeholder="Enter a career path — e.g. Frontend Developer, AI Engineer, UI/UX Designer"
            (focus)="focused = true" (blur)="focused = false"
            (keydown.enter)="predict()"
          >
        </div>
        <button class="btn-predict" (click)="predict()" [disabled]="!careerInput.trim() || loading()">
          @if (loading()) {
            <mat-spinner diameter="18"></mat-spinner> Predicting…
          } @else {
            <mat-icon>auto_awesome</mat-icon> Predict
          }
        </button>
      </div>

      <!-- quick suggestions -->
      @if (!prediction()) {
        <div class="suggestions">
          @for (s of suggestions; track s) {
            <button class="sugg-chip" (click)="careerInput = s; predict()">{{ s }}</button>
          }
        </div>
      }

      <!-- error -->
      @if (errorMsg()) {
        <div class="error-bar">
          <mat-icon>warning_amber</mat-icon>{{ errorMsg() }}
          <button class="err-x" (click)="errorMsg.set(null)"><mat-icon>close</mat-icon></button>
        </div>
      }

      <!-- loading state -->
      @if (loading()) {
        <div class="gen-state">
          <div class="gen-ring"><mat-spinner diameter="52"></mat-spinner></div>
          <h3>Analyzing income potential…</h3>
          <p>Scanning freelance markets, job boards and salary data</p>
          <div class="gen-steps">
            @for (s of loadingSteps; track s) {
              <span class="gs"><mat-icon>check_circle</mat-icon>{{ s }}</span>
            }
          </div>
        </div>
      }

      <!-- ── results ── -->
      @if (prediction() && !loading()) {
        <div class="results">

          <!-- career label -->
          <div class="career-label-row">
            <div class="career-lbl">
              <mat-icon>work</mat-icon> {{ prediction().career_path }}
            </div>
            <button class="btn-rerun" (click)="prediction.set(null)">
              <mat-icon>refresh</mat-icon> New Prediction
            </button>
          </div>

          <!-- 3 income cards -->
          <div class="income-cards">
            <div class="inc-card freelance">
              <div class="inc-card-bg"></div>
              <div class="inc-icon"><mat-icon>laptop_mac</mat-icon></div>
              <div class="inc-label">Freelance Monthly</div>
              <div class="inc-range">
                <span class="inc-val">\${{ prediction().freelance_monthly_min | number:'1.0-0' }}</span>
                <span class="inc-dash">–</span>
                <span class="inc-val">\${{ prediction().freelance_monthly_max | number:'1.0-0' }}</span>
              </div>
              <div class="inc-sub">per month</div>
            </div>

            <div class="inc-card salary">
              <div class="inc-card-bg"></div>
              <div class="inc-icon"><mat-icon>business_center</mat-icon></div>
              <div class="inc-label">Job Salary</div>
              <div class="inc-range">
                <span class="inc-val">\${{ prediction().job_salary_annual_min / 1000 | number:'1.0-0' }}K</span>
                <span class="inc-dash">–</span>
                <span class="inc-val">\${{ prediction().job_salary_annual_max / 1000 | number:'1.0-0' }}K</span>
              </div>
              <div class="inc-sub">per year</div>
            </div>

            <div class="inc-card timeline">
              <div class="inc-card-bg"></div>
              <div class="inc-icon"><mat-icon>schedule</mat-icon></div>
              <div class="inc-label">Time to First Income</div>
              <div class="inc-val-single">{{ prediction().time_to_first_income_days }}</div>
              <div class="inc-sub">days · First client in {{ prediction().time_to_first_client_days }} days</div>
            </div>
          </div>

          <!-- growth chart -->
          @if (prediction().growth_projection?.length) {
            <div class="section-card">
              <div class="sec-head">
                <div class="sec-icon cyan"><mat-icon>show_chart</mat-icon></div>
                <div>
                  <div class="sec-title">Income Growth Projection</div>
                  <div class="sec-sub">Estimated monthly earnings over time</div>
                </div>
              </div>
              <div class="chart-wrap">
                @for (pt of prediction().growth_projection; track pt.month) {
                  <div class="chart-col">
                    <div class="chart-bar-wrap">
                      <div class="chart-bar"
                           [style.height.%]="(pt.income / maxIncome()) * 100"
                           [title]="'$' + pt.income">
                      </div>
                    </div>
                    <div class="chart-label">M{{ pt.month }}</div>
                    <div class="chart-val">\${{ pt.income >= 1000 ? (pt.income/1000 | number:'1.0-1') + 'K' : pt.income }}</div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- freelance section -->
          <div class="two-col">
            <!-- fiverr -->
            <div class="section-card">
              <div class="sec-head">
                <div class="sec-icon green"><mat-icon>storefront</mat-icon></div>
                <div>
                  <div class="sec-title">Fiverr Niches</div>
                  <div class="sec-sub">Best gig categories for you</div>
                </div>
              </div>
              <div class="chip-list">
                @for (n of prediction().fiverr_niches; track n) {
                  <span class="chip chip-green">{{ n }}</span>
                }
              </div>
            </div>

            <!-- upwork -->
            <div class="section-card">
              <div class="sec-head">
                <div class="sec-icon amber"><mat-icon>work_outline</mat-icon></div>
                <div>
                  <div class="sec-title">Upwork Categories</div>
                  <div class="sec-sub">Top matching job categories</div>
                </div>
              </div>
              <div class="chip-list">
                @for (c of prediction().upwork_categories; track c) {
                  <span class="chip chip-amber">{{ c }}</span>
                }
              </div>
            </div>
          </div>

          <!-- gig titles -->
          @if (prediction().gig_titles?.length) {
            <div class="section-card">
              <div class="sec-head">
                <div class="sec-icon cyan"><mat-icon>title</mat-icon></div>
                <div>
                  <div class="sec-title">Suggested Gig Titles</div>
                  <div class="sec-sub">Ready-to-use titles for your listings</div>
                </div>
              </div>
              <div class="gig-list">
                @for (t of prediction().gig_titles; track t; let i = $index) {
                  <div class="gig-row">
                    <span class="gig-num">{{ i + 1 }}</span>
                    <span class="gig-text">{{ t }}</span>
                    <mat-icon class="gig-copy" (click)="copyText(t)" matTitle="Copy">content_copy</mat-icon>
                  </div>
                }
              </div>
            </div>
          }

          <!-- AI analysis -->
          @if (prediction().ai_analysis) {
            <div class="section-card">
              <div class="sec-head">
                <div class="sec-icon purple"><mat-icon>psychology</mat-icon></div>
                <div>
                  <div class="sec-title">AI Market Analysis</div>
                  <div class="sec-sub">Personalized insights for your profile</div>
                </div>
              </div>
              <p class="analysis-txt">{{ prediction().ai_analysis }}</p>
            </div>
          }

        </div>
      }

      <!-- empty state -->
      @if (!prediction() && !loading()) {
        <div class="empty-state">
          <div class="empty-glow"></div>
          <div class="empty-icon">
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#71c4ef" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <h2>Discover your earning potential</h2>
          <p>Enter a career path above and our AI will forecast your freelance income, job salary, and time to first earnings</p>
        </div>
      }

    </div>
  `,
  styles: [`
    .page { max-width: 1000px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; }

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

    /* search card */
    .search-card {
      display: flex; align-items: center; gap: 12px;
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 14px; padding: 14px 16px;
      margin-bottom: 14px;
      transition: border-color .2s;
    }
    .search-card:focus-within { border-color: rgba(113,196,239,.35); }
    .search-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      background: rgba(0,102,140,.2); border: 1px solid rgba(113,196,239,.2);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: #71c4ef; font-size: 20px; }
    }
    .search-wrap { flex: 1; }
    .search-wrap input {
      width: 100%; background: none; border: none; outline: none;
      color: var(--text-primary); font-size: .95rem;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .search-wrap input::placeholder { color: rgba(255,255,255,.25); }

    .btn-predict {
      display: inline-flex; align-items: center; gap: 7px;
      background: #00668c; color: #fff; border: none;
      border-radius: 9px; padding: 10px 20px;
      font-size: .875rem; font-weight: 700; cursor: pointer; white-space: nowrap;
      transition: background .2s, box-shadow .2s, transform .15s;
      box-shadow: 0 4px 16px rgba(0,102,140,.35);
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      mat-spinner { --mdc-circular-progress-active-indicator-color: #fff; }
    }
    .btn-predict:hover:not(:disabled) { background: #005a7a; box-shadow: 0 6px 22px rgba(0,102,140,.5); transform: translateY(-1px); }
    .btn-predict:disabled { opacity: .5; cursor: not-allowed; transform: none; }

    /* suggestions */
    .suggestions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
    .sugg-chip {
      padding: 6px 14px; border-radius: 20px;
      background: rgba(255,255,255,.04); border: 1px solid rgba(113,196,239,.14);
      font-size: .78rem; font-weight: 500; color: var(--text-secondary);
      cursor: pointer; transition: all .2s;
    }
    .sugg-chip:hover { background: rgba(113,196,239,.1); border-color: rgba(113,196,239,.35); color: #71c4ef; }

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

    /* ── results ── */
    .results { display: flex; flex-direction: column; gap: 16px; }

    .career-label-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .career-lbl {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(0,102,140,.15); border: 1px solid rgba(113,196,239,.22);
      border-radius: 9px; padding: 8px 16px;
      font-size: .875rem; font-weight: 700; color: #71c4ef;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .btn-rerun {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: 1px solid var(--border-color);
      border-radius: 8px; padding: 7px 14px;
      font-size: .8rem; font-weight: 600; color: var(--text-secondary); cursor: pointer;
      transition: all .2s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .btn-rerun:hover { border-color: rgba(113,196,239,.3); color: #71c4ef; }

    /* income cards */
    .income-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }

    .inc-card {
      border-radius: 16px; padding: 22px;
      position: relative; overflow: hidden;
      display: flex; flex-direction: column; gap: 6px;
    }
    .inc-card-bg {
      position: absolute; inset: 0; pointer-events: none; opacity: .12;
      background: radial-gradient(circle at 80% 20%, #fff, transparent 60%);
    }
    .freelance { background: linear-gradient(135deg, #00668c, #005a7a); box-shadow: 0 8px 28px rgba(0,102,140,.4); }
    .salary    { background: linear-gradient(135deg, #059669, #047857); box-shadow: 0 8px 28px rgba(5,150,105,.4); }
    .timeline  { background: linear-gradient(135deg, #d97706, #b45309); box-shadow: 0 8px 28px rgba(217,119,6,.4); }

    .inc-icon { mat-icon { font-size: 22px; width: 22px; height: 22px; color: rgba(255,255,255,.7); } }
    .inc-label { font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .6px; color: rgba(255,255,255,.7); }
    .inc-range { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
    .inc-val   { font-size: 1.8rem; font-weight: 800; color: #fff; line-height: 1; }
    .inc-val-single { font-size: 2.2rem; font-weight: 800; color: #fff; line-height: 1; }
    .inc-dash  { font-size: 1.2rem; color: rgba(255,255,255,.5); }
    .inc-sub   { font-size: .75rem; color: rgba(255,255,255,.65); }

    /* chart */
    .chart-wrap {
      display: flex; align-items: flex-end; gap: 8px;
      height: 120px; padding: 0 4px;
    }
    .chart-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; min-width: 0; height: 100%; }
    .chart-bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; }
    .chart-bar {
      width: 100%; border-radius: 5px 5px 0 0; min-height: 4px;
      background: linear-gradient(180deg, #71c4ef, #00668c);
      transition: height .6s cubic-bezier(.4,0,.2,1);
      box-shadow: 0 0 8px rgba(113,196,239,.25);
    }
    .chart-label { font-size: .62rem; color: var(--text-secondary); font-weight: 600; }
    .chart-val   { font-size: .65rem; color: #71c4ef; font-weight: 700; white-space: nowrap; }

    /* section card */
    .section-card {
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 14px; padding: 20px 22px;
      display: flex; flex-direction: column; gap: 16px;
    }
    .sec-head { display: flex; align-items: flex-start; gap: 12px; }
    .sec-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .sec-icon.cyan   { background: rgba(0,102,140,.2); border: 1px solid rgba(113,196,239,.2); mat-icon { color: #71c4ef; } }
    .sec-icon.green  { background: rgba(5,150,105,.15); border: 1px solid rgba(76,190,125,.2); mat-icon { color: #4cbe7d; } }
    .sec-icon.amber  { background: rgba(217,119,6,.12); border: 1px solid rgba(245,158,11,.2); mat-icon { color: #f59e0b; } }
    .sec-icon.purple { background: rgba(139,92,246,.12); border: 1px solid rgba(139,92,246,.2); mat-icon { color: #a78bfa; } }
    .sec-title { font-size: .95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
    .sec-sub   { font-size: .76rem; color: var(--text-secondary); }

    /* chips */
    .chip-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      padding: 5px 12px; border-radius: 7px;
      font-size: .78rem; font-weight: 600;
      border: 1px solid transparent;
    }
    .chip-green  { background: rgba(76,190,125,.1);  border-color: rgba(76,190,125,.2);  color: #4cbe7d; }
    .chip-amber  { background: rgba(245,158,11,.1);  border-color: rgba(245,158,11,.2);  color: #f59e0b; }

    /* gig list */
    .gig-list { display: flex; flex-direction: column; gap: 8px; }
    .gig-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: 9px;
      background: rgba(255,255,255,.03); border: 1px solid rgba(113,196,239,.08);
      transition: border-color .2s;
    }
    .gig-row:hover { border-color: rgba(113,196,239,.2); }
    .gig-num {
      width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
      background: rgba(0,102,140,.2); border: 1px solid rgba(113,196,239,.2);
      display: flex; align-items: center; justify-content: center;
      font-size: .68rem; font-weight: 700; color: #71c4ef;
    }
    .gig-text { flex: 1; font-size: .875rem; color: var(--text-primary); }
    .gig-copy { font-size: 16px; width: 16px; height: 16px; color: var(--text-secondary); cursor: pointer; transition: color .2s; }
    .gig-copy:hover { color: #71c4ef; }

    .analysis-txt { font-size: .875rem; color: var(--text-secondary); line-height: 1.75; margin: 0; }

    /* two col */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 680px) { .two-col { grid-template-columns: 1fr; } }

    /* empty */
    .empty-state {
      text-align: center; padding: 72px 24px;
      display: flex; flex-direction: column; align-items: center; gap: 14px;
      position: relative;
    }
    .empty-glow {
      position: absolute; width: 300px; height: 300px; border-radius: 50%;
      background: radial-gradient(circle, rgba(0,102,140,.1), transparent 70%);
      pointer-events: none;
    }
    .empty-icon {
      width: 90px; height: 90px; border-radius: 24px;
      background: rgba(0,102,140,.12); border: 1px solid rgba(113,196,239,.18);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 28px rgba(0,102,140,.15);
    }
    .empty-state h2 { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .empty-state > p { color: var(--text-secondary); font-size: .875rem; max-width: 400px; line-height: 1.65; margin: 0; }
  `],
})
export class IncomePredictionComponent implements OnInit {
  private roadmapService = inject(RoadmapService);

  loading    = signal(false);
  prediction = signal<any>(null);
  errorMsg   = signal<string | null>(null);
  careerInput = '';
  focused     = false;

  suggestions = [
    'Frontend Developer', 'Full Stack Developer', 'UI/UX Designer',
    'AI/ML Engineer', 'DevOps Engineer', 'Mobile Developer',
  ];

  loadingSteps = ['Scanning job boards', 'Analyzing freelance markets', 'Calculating salary ranges', 'Building projections'];

  maxIncome(): number {
    const pts = this.prediction()?.growth_projection || [];
    return Math.max(...pts.map((p: any) => p.income), 1);
  }

  copyText(text: string): void {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  ngOnInit(): void {
    this.roadmapService.getIncomePredictions().subscribe({
      next: (preds: any[]) => { if (preds.length) this.prediction.set(preds[0]); },
      error: () => {},
    });
  }

  predict(): void {
    const career = this.careerInput.trim();
    if (!career) return;
    this.loading.set(true);
    this.errorMsg.set(null);
    this.roadmapService.predictIncome(career).subscribe({
      next: (p) => { this.prediction.set(p); this.loading.set(false); },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.detail || 'Prediction failed. Make sure your OpenAI API key is set in backend/.env');
      },
    });
  }
}
