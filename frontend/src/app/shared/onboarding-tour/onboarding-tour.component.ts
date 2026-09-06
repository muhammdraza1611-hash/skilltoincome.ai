import {
  Component, OnInit, OnDestroy, signal, inject,
  HostListener, NgZone, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../core/store/auth.store';

interface TourStep {
  selector: string;
  title: string;
  desc: string;
  emoji: string;
  side: 'right' | 'left' | 'bottom' | 'top' | 'center';
}

interface Rect { top: number; left: number; width: number; height: number; }

@Component({
  selector: 'app-onboarding-tour',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    @if (show()) {
      <!-- dark backdrop -->
      <div class="t-backdrop" (click)="$event.stopPropagation()">

        <!-- spotlight hole -->
        @if (rect()) {
          <div class="t-hole"
               [style.top.px]="rect()!.top - 6"
               [style.left.px]="rect()!.left - 6"
               [style.width.px]="rect()!.width + 12"
               [style.height.px]="rect()!.height + 12">
          </div>
        }

        <!-- animated SVG arrow (only when rect exists) -->
        @if (rect() && arrowPath()) {
          <svg class="t-arrow-svg" [attr.viewBox]="arrowViewBox()" preserveAspectRatio="none">
            <defs>
              <marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#71c4ef"/>
              </marker>
            </defs>
            <path [attr.d]="arrowPath()" stroke="#71c4ef" stroke-width="2.5"
                  fill="none" marker-end="url(#ah)"
                  stroke-dasharray="6,3" class="t-arrow-path"/>
          </svg>
        }

        <!-- tour card -->
        <div class="t-card" [style]="cardPos()">

          <!-- top row: dots + skip -->
          <div class="t-top">
            <div class="t-dots">
              @for (s of steps; track $index; let i = $index) {
                <button class="t-dot" [class.t-dot-on]="i === idx()" (click)="goto(i)"></button>
              }
            </div>
            @if (idx() < steps.length - 1) {
              <button class="t-skip" (click)="done()">Skip</button>
            }
          </div>

          <!-- emoji + step label -->
          <div class="t-emoji">{{ steps[idx()].emoji }}</div>
          <div class="t-num">Step {{ idx() + 1 }} of {{ steps.length }}</div>
          <h3 class="t-title">{{ steps[idx()].title }}</h3>
          <p  class="t-desc">{{ steps[idx()].desc }}</p>

          <!-- nav buttons -->
          <div class="t-nav">
            @if (idx() > 0) {
              <button class="t-back" (click)="prev()">
                <mat-icon>arrow_back</mat-icon>
              </button>
            }
            <button class="t-next" (click)="next()">
              @if (idx() === steps.length - 1) {
                <mat-icon>check</mat-icon>&nbsp;Let's go!
              } @else {
                Next&nbsp;<mat-icon>arrow_forward</mat-icon>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* backdrop */
    .t-backdrop {
      position: fixed; inset: 0; z-index: 9998;
      pointer-events: all;
      animation: t-fade .3s ease;
    }
    @keyframes t-fade { from{opacity:0} to{opacity:1} }

    /* spotlight hole — box-shadow trick */
    .t-hole {
      position: fixed; border-radius: 10px;
      box-shadow:
        0 0 0 4px rgba(113,196,239,.55),
        0 0 0 9999px rgba(4,11,20,.82);
      transition: all .35s cubic-bezier(.4,0,.2,1);
      pointer-events: none;
      z-index: 9999;
      animation: t-glow 2s ease-in-out infinite;
    }
    @keyframes t-glow {
      0%,100% { box-shadow: 0 0 0 4px rgba(113,196,239,.55), 0 0 0 9999px rgba(4,11,20,.82); }
      50%      { box-shadow: 0 0 0 5px rgba(113,196,239,.9),  0 0 0 9999px rgba(4,11,20,.82), 0 0 20px rgba(113,196,239,.4); }
    }

    /* svg arrow */
    .t-arrow-svg {
      position: fixed; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 10000; overflow: visible;
    }
    .t-arrow-path {
      animation: t-dash 1.5s linear infinite;
    }
    @keyframes t-dash {
      to { stroke-dashoffset: -18; }
    }

    /* card */
    .t-card {
      position: fixed;
      background: linear-gradient(145deg, #0d1f30, #0c1824);
      border: 1px solid rgba(113,196,239,.28);
      border-radius: 20px; padding: 22px 24px 20px;
      width: 310px;
      z-index: 10001;
      box-shadow:
        0 28px 60px rgba(0,0,0,.7),
        0 0 0 1px rgba(255,255,255,.04),
        0 0 24px rgba(113,196,239,.08);
      animation: t-card-in .3s cubic-bezier(.34,1.56,.64,1);
      font-family: 'Inter', system-ui, sans-serif;
    }
    @keyframes t-card-in {
      from { opacity:0; transform: scale(.88) translateY(10px); }
      to   { opacity:1; transform: scale(1)   translateY(0); }
    }

    /* top row */
    .t-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .t-dots { display: flex; gap: 5px; }
    .t-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: rgba(113,196,239,.2); border: none; cursor: pointer;
      transition: all .25s; padding: 0;
    }
    .t-dot.t-dot-on { background: #71c4ef; width: 20px; border-radius: 4px; }
    .t-skip {
      background: none; border: none; cursor: pointer;
      font-size: .75rem; color: rgba(255,255,255,.35);
      padding: 0; transition: color .2s; font-family: inherit;
    }
    .t-skip:hover { color: rgba(255,255,255,.6); }

    /* content */
    .t-emoji { font-size: 2rem; margin-bottom: 4px; line-height: 1; }
    .t-num { font-size: .65rem; font-weight: 700; text-transform: uppercase;
              letter-spacing: .7px; color: #71c4ef; margin-bottom: 5px; }
    .t-title { font-size: 1rem; font-weight: 800; color: #fff; margin: 0 0 9px;
               letter-spacing: -.2px; line-height: 1.3; }
    .t-desc  { font-size: .81rem; color: rgba(255,255,255,.62); line-height: 1.65;
               margin: 0; }

    /* nav */
    .t-nav { display: flex; gap: 8px; margin-top: 18px; justify-content: flex-end; }
    .t-back {
      width: 36px; height: 36px; border-radius: 9px;
      background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
      color: rgba(255,255,255,.55); cursor: pointer; display: flex;
      align-items: center; justify-content: center; transition: all .2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .t-back:hover { background: rgba(255,255,255,.12); color: #fff; }
    .t-next {
      display: inline-flex; align-items: center;
      background: linear-gradient(135deg, #00668c, #005a7a);
      color: #fff; border: none; border-radius: 9px;
      padding: 9px 18px; font-size: .875rem; font-weight: 700;
      cursor: pointer; transition: all .2s;
      box-shadow: 0 4px 16px rgba(0,102,140,.45);
      mat-icon { font-size: 17px; width: 17px; height: 17px; }
    }
    .t-next:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(0,102,140,.6); }
  `],
})
export class OnboardingTourComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authStore = inject(AuthStore);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  show = signal(false);
  idx  = signal(0);
  rect = signal<Rect | null>(null);

  private readonly KEY = 'sti_tour_v2';

  steps: TourStep[] = [
    {
      selector: '',
      title: 'Welcome to SkillToIncome AI! 🎉',
      desc: 'This quick tour shows you how to turn your skills into real income using AI. Takes less than 2 minutes!',
      emoji: '🚀', side: 'center',
    },
    {
      selector: 'a[routerlink="/skills"]',
      title: 'Step 1 — Skills Assessment',
      desc: 'Start here! Add your skills and career goals. AI uses this to personalize your entire experience — roadmap, salary predictions, and career paths.',
      emoji: '🧠', side: 'right',
    },
    {
      selector: 'a[routerlink="/careers"]',
      title: 'Step 2 — AI Career Analysis',
      desc: 'Get up to 7 AI-ranked career paths with salary ranges, market demand scores, remote work availability, and skill gap analysis.',
      emoji: '🎯', side: 'right',
    },
    {
      selector: 'a[routerlink="/roadmap"]',
      title: 'Step 3 — Learning Roadmap',
      desc: 'Select a 30/60/90-day duration. AI generates a daily learning plan with real YouTube tutorials and official docs for every task.',
      emoji: '🗺️', side: 'right',
    },
    {
      selector: 'a[routerlink="/income"]',
      title: 'Step 4 — Income Prediction',
      desc: 'Enter any career to get AI-predicted freelance income, job salary, Fiverr niches, Upwork categories, and ready-to-use gig titles.',
      emoji: '💰', side: 'right',
    },
    {
      selector: 'a[routerlink="/portfolio"]',
      title: 'Step 5 — Portfolio Analyzer',
      desc: 'Paste your GitHub or portfolio URL. AI scores it on quality, resume readiness, and recruiter appeal — then suggests specific improvements.',
      emoji: '📁', side: 'right',
    },
    {
      selector: 'a[routerlink="/chat"]',
      title: 'Step 6 — AI Mentor Chat',
      desc: 'Your 24/7 AI mentor knows your skills, goals, and progress. Ask for career advice, freelancing strategies, or what to learn next.',
      emoji: '🤖', side: 'right',
    },
    {
      selector: '.mode-btn:last-child',
      title: 'Step 7 — AI Code Builder',
      desc: 'Click Build mode to generate complete websites with AI! Type any description and watch AI write HTML, CSS, and JavaScript in real time.',
      emoji: '⚡', side: 'right',
    },
    {
      selector: '',
      title: 'You\'re all set! ✅',
      desc: 'Start with Skills Assessment → then Career Analysis → then your Roadmap. Your journey from skills to income begins now!',
      emoji: '🏆', side: 'center',
    },
  ];

  ngOnInit(): void {
    if (!localStorage.getItem(this.KEY) && this.authStore.isAuthenticated()) {
      // Wait for router to settle before showing tour
      setTimeout(() => {
        this.zone.run(() => {
          this.show.set(true);
          this._updateRect(0);
        });
      }, 1500);
    }
  }

  ngOnDestroy(): void {}

  goto(i: number): void {
    this.idx.set(i);
    this._updateRect(i);
  }

  next(): void {
    if (this.idx() >= this.steps.length - 1) { this.done(); return; }
    const n = this.idx() + 1;
    this.idx.set(n);
    this._updateRect(n);
  }

  prev(): void {
    const n = this.idx() - 1;
    if (n >= 0) { this.idx.set(n); this._updateRect(n); }
  }

  done(): void {
    localStorage.setItem(this.KEY, '1');
    this.show.set(false);
    this.rect.set(null);
    // Delay navigation to avoid router transition conflict
    setTimeout(() => this.router.navigate(['/skills']), 100);
  }

  /* ── card position ── */
  cardPos(): string {
    const step = this.steps[this.idx()];
    const r = this.rect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = 310, ch = 320;
    const gap = 20;

    if (step.side === 'center' || !r) {
      return `top:50%;left:50%;transform:translate(-50%,-50%)`;
    }

    let top: number, left: number;

    if (step.side === 'right') {
      left = Math.min(r.left + r.width + gap, vw - cw - 16);
      top  = Math.max(16, Math.min(r.top + r.height / 2 - ch / 2, vh - ch - 16));
    } else if (step.side === 'left') {
      left = Math.max(16, r.left - cw - gap);
      top  = Math.max(16, Math.min(r.top + r.height / 2 - ch / 2, vh - ch - 16));
    } else if (step.side === 'bottom') {
      top  = Math.min(r.top + r.height + gap, vh - ch - 16);
      left = Math.max(16, Math.min(r.left + r.width / 2 - cw / 2, vw - cw - 16));
    } else {
      top  = Math.max(16, r.top - ch - gap);
      left = Math.max(16, Math.min(r.left + r.width / 2 - cw / 2, vw - cw - 16));
    }

    return `top:${top}px;left:${left}px`;
  }

  /* ── SVG arrow ── */
  arrowViewBox(): string {
    return `0 0 ${window.innerWidth} ${window.innerHeight}`;
  }

  arrowPath(): string {
    const r = this.rect();
    const step = this.steps[this.idx()];
    if (!r || step.side === 'center') return '';

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = 310, ch = 320;
    const gap = 20;

    // Spotlight center
    const sx = r.left + r.width / 2;
    const sy = r.top + r.height / 2;

    // Card position (same calc)
    let ct = 0, cl = 0;
    if (step.side === 'right') {
      cl = Math.min(r.left + r.width + gap, vw - cw - 16);
      ct = Math.max(16, Math.min(r.top + r.height / 2 - ch / 2, vh - ch - 16));
    } else if (step.side === 'left') {
      cl = Math.max(16, r.left - cw - gap);
      ct = Math.max(16, Math.min(r.top + r.height / 2 - ch / 2, vh - ch - 16));
    } else {
      return '';
    }

    // Arrow: from card edge to spotlight edge
    let x1: number, y1: number, x2: number, y2: number;
    if (step.side === 'right') {
      x1 = cl; y1 = ct + ch / 2;                          // left edge of card
      x2 = r.left + r.width + 6; y2 = sy;                  // right edge of spotlight
    } else {
      x1 = cl + cw; y1 = ct + ch / 2;
      x2 = r.left - 6; y2 = sy;
    }

    // Curved bezier
    const mx = (x1 + x2) / 2;
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
  }

  private _updateRect(i: number): void {
    const sel = this.steps[i].selector;
    if (!sel) { this.rect.set(null); this.cdr.detectChanges(); return; }

    // Try multiple times (element might not be rendered yet)
    let attempts = 0;
    const tryFind = () => {
      const el = document.querySelector(sel);
      if (el) {
        const r = el.getBoundingClientRect();
        this.zone.run(() => {
          this.rect.set({ top: r.top, left: r.left, width: r.width, height: r.height });
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          this.cdr.detectChanges();
        });
      } else if (attempts++ < 8) {
        setTimeout(tryFind, 200);
      } else {
        this.zone.run(() => { this.rect.set(null); this.cdr.detectChanges(); });
      }
    };
    tryFind();
  }

  @HostListener('window:resize')
  onResize(): void { this._updateRect(this.idx()); }

  static resetTour(): void { localStorage.removeItem('sti_tour_v2'); }
}
