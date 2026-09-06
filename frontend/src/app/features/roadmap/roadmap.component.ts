import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoadmapService } from '../../core/services/roadmap.service';
import { Roadmap, RoadmapDuration, TaskStatus } from '../../core/models/roadmap.model';

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page">

      <!-- ── header ── -->
      <div class="page-head">
        <div class="head-left">
          <div class="head-badge"><span class="live-dot"></span> AI-Generated</div>
          <h1>Learning Roadmap</h1>
          <p>Your personalized step-by-step learning plan</p>
        </div>

        <div class="controls">
          <!-- duration tabs -->
          <div class="dur-tabs">
            @for (d of durations; track d.value) {
              <button class="dur-tab" [class.active]="selectedDuration === d.value"
                      (click)="selectedDuration = d.value" [disabled]="generating()">
                {{ d.label }}
              </button>
            }
          </div>
          <button class="btn-generate" (click)="generate()" [disabled]="generating()">
            @if (generating()) {
              <mat-spinner diameter="16"></mat-spinner> Generating…
            } @else {
              <mat-icon>auto_awesome</mat-icon> Generate
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

      <!-- ── generating ── -->
      @if (generating()) {
        <div class="gen-state">
          <div class="gen-ring"><mat-spinner diameter="56"></mat-spinner></div>
          <h3>Building your roadmap…</h3>
          <p>AI is creating a day-by-day plan tailored to your skills</p>
          <div class="gen-steps">
            @for (s of genSteps; track s) {
              <span class="gs"><mat-icon>check_circle</mat-icon>{{ s }}</span>
            }
          </div>
        </div>
      }

      <!-- ── roadmap content ── -->
      @if (roadmap() && !generating()) {
        <!-- overview card -->
        <div class="overview-card">
          <div class="ov-left">
            <div class="ov-title-row">
              <div class="ov-icon"><mat-icon>map</mat-icon></div>
              <div>
                <h2>{{ roadmap()!.title }}</h2>
                <p>{{ roadmap()!.description }}</p>
              </div>
            </div>
            <div class="prog-track">
              <div class="prog-fill" [style.width.%]="roadmap()!.completion_percentage"></div>
            </div>
            <div class="prog-info">
              <span class="prog-pct">{{ roadmap()!.completion_percentage | number:'1.0-0' }}% complete</span>
              <span class="prog-tasks">
                {{ completedCount() }} / {{ roadmap()!.tasks.length }} tasks done
              </span>
            </div>
          </div>
          <div class="ov-ring">
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(113,196,239,.1)" stroke-width="6"/>
              <circle cx="45" cy="45" r="38" fill="none" stroke="url(#grad)" stroke-width="6"
                      stroke-linecap="round"
                      [attr.stroke-dasharray]="238.76"
                      [attr.stroke-dashoffset]="238.76 - (238.76 * roadmap()!.completion_percentage / 100)"
                      transform="rotate(-90 45 45)"
                      style="transition: stroke-dashoffset .8s ease"/>
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#00668c"/>
                  <stop offset="100%" stop-color="#71c4ef"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="ring-center">
              <span class="ring-val">{{ roadmap()!.completion_percentage | number:'1.0-0' }}</span>
              <span class="ring-unit">%</span>
            </div>
          </div>
        </div>

        <!-- ── VISUAL LEARNING PATH DIAGRAM ── -->
        <div class="diagram-card">
          <div class="diagram-head">
            <div class="dh-icon"><mat-icon>account_tree</mat-icon></div>
            <div>
              <div class="dh-title">Learning Path Diagram</div>
              <div class="dh-sub">roadmap.sh-style visual tree of your learning journey</div>
            </div>
            <div class="dh-legend">
              <span class="leg"><span class="leg-dot ld-done"></span>Done</span>
              <span class="leg"><span class="leg-dot ld-ms"></span>Milestone</span>
              <span class="leg"><span class="leg-dot ld-pending"></span>Pending</span>
            </div>
          </div>

          <div class="tree-scroll">
            <div class="tree-root">

              <!-- root node -->
              <div class="tr-root-node">
                <span class="trn-icon">🎯</span>
                {{ roadmap()!.title }}
              </div>
              <div class="tr-root-line"></div>

              <!-- weeks as main branches -->
              <div class="tr-weeks">
                @for (week of weekGroups(); track week.week) {
                  <div class="tr-week-col">

                    <!-- week connector -->
                    <div class="tr-v-line-top"></div>

                    <!-- week node -->
                    <div class="tr-week-node"
                         [class.trw-done]="week.completed === week.tasks.length"
                         [class.trw-partial]="week.completed > 0 && week.completed < week.tasks.length"
                         (click)="scrollToWeek(week.week)">
                      <div class="trw-label">Week {{ week.week }}</div>
                      <div class="trw-meta">{{ week.completed }}/{{ week.tasks.length }}</div>
                      <div class="trw-bar">
                        <div class="trw-bar-fill"
                             [style.width.%]="(week.completed / week.tasks.length) * 100">
                        </div>
                      </div>
                    </div>

                    <!-- tasks below week -->
                    <div class="tr-v-line-mid"></div>
                    <div class="tr-tasks-col">
                      @for (task of week.tasks; track task.id) {
                        <div class="tr-task-wrap">
                          <div class="tr-h-line"></div>
                          <div class="tr-task-node"
                               [class.trt-done]="task.status === 'completed'"
                               [class.trt-ms]="task.is_milestone"
                               [class.trt-pending]="task.status !== 'completed' && !task.is_milestone"
                               (click)="toggleTask(task)">
                            <div class="trt-dot">
                              @if (task.status === 'completed') {
                                <mat-icon>check</mat-icon>
                              } @else if (task.is_milestone) {
                                <mat-icon>star</mat-icon>
                              }
                            </div>
                            <div class="trt-text">
                              <span class="trt-title">{{ task.title }}</span>
                              @if (task.estimated_hours) {
                                <span class="trt-hours">{{ task.estimated_hours }}h</span>
                              }
                            </div>
                          </div>
                        </div>
                      }
                    </div>

                  </div>
                }
              </div>

            </div>
          </div>
        </div>

        <!-- week groups -->
        @for (week of weekGroups(); track week.week) {
          <div class="week-block" [id]="'week-' + week.week">
            <!-- week header -->
            <div class="week-header" (click)="toggleWeek(week.week)">
              <div class="week-left">
                <div class="week-num">W{{ week.week }}</div>
                <div>
                  <div class="week-title">Week {{ week.week }}</div>
                  <div class="week-meta">
                    {{ week.completed }}/{{ week.tasks.length }} tasks ·
                    {{ week.totalHours | number:'1.0-1' }}h total
                  </div>
                </div>
              </div>
              <div class="week-right">
                <div class="week-prog-track">
                  <div class="week-prog-fill" [style.width.%]="(week.completed / week.tasks.length) * 100"></div>
                </div>
                <span class="week-pct">{{ (week.completed / week.tasks.length * 100) | number:'1.0-0' }}%</span>
                <mat-icon class="chevron" [class.open]="openWeeks.has(week.week)">expand_more</mat-icon>
              </div>
            </div>

            <!-- tasks -->
            @if (openWeeks.has(week.week)) {
              <div class="tasks">
                @for (task of week.tasks; track task.id) {
                  <div class="task" [class.done]="task.status === 'completed'" [class.milestone]="task.is_milestone">

                    <!-- check button -->
                    <button class="check-btn" [class.checked]="task.status === 'completed'"
                            (click)="toggleTask(task)"
                            [attr.aria-label]="task.status === 'completed' ? 'Mark incomplete' : 'Mark complete'">
                      @if (task.status === 'completed') {
                        <mat-icon>check_circle</mat-icon>
                      } @else {
                        <mat-icon>radio_button_unchecked</mat-icon>
                      }
                    </button>

                    <div class="task-body">
                      <div class="task-title-row">
                        @if (task.is_milestone) {
                          <span class="ms-badge"><mat-icon>emoji_events</mat-icon> Milestone</span>
                        }
                        <span class="task-title" [class.striked]="task.status === 'completed'">
                          {{ task.title }}
                        </span>
                      </div>
                      @if (task.description) {
                        <p class="task-desc">{{ task.description }}</p>
                      }
                      <div class="task-meta">
                        @if (task.day_number) {
                          <span class="meta-pill"><mat-icon>today</mat-icon> Day {{ task.day_number }}</span>
                        }
                        <span class="meta-pill"><mat-icon>schedule</mat-icon> {{ task.estimated_hours }}h</span>
                      </div>
                      @if (task.resources?.length) {
                        <div class="resources">
                          @for (r of task.resources; track r.title) {
                            <a [href]="r.url" target="_blank" rel="noopener"
                               class="res-link"
                               [class.res-yt]="isYoutube(r.url)">
                              @if (isYoutube(r.url)) {
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M23.5 6.2s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.8 2 12 2 12 2s-4.8 0-7.3.1c-.6.1-1.9.1-3 1.3C.8 4.2.5 6.2.5 6.2S.2 8.5.2 10.8v2.1c0 2.3.3 4.6.3 4.6s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.7 12 21.8 12 21.8s4.8 0 7.3-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.3.3-4.6v-2.1c0-2.3-.3-4.6-.3-4.6zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/>
                                </svg>
                              } @else {
                                <mat-icon>{{ r.type === 'course' ? 'school' : 'article' }}</mat-icon>
                              }
                              {{ r.title }}
                            </a>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      }

      <!-- ── empty state ── -->
      @if (!roadmap() && !generating()) {
        <div class="empty-state">
          <div class="empty-glow"></div>
          <div class="empty-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#71c4ef" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
              <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
            </svg>
          </div>
          <h2>No roadmap yet</h2>
          <p>Select a duration above and click Generate to create your AI-personalized learning roadmap</p>
          <div class="dur-tabs empty-dur">
            @for (d of durations; track d.value) {
              <button class="dur-tab" [class.active]="selectedDuration === d.value"
                      (click)="selectedDuration = d.value">{{ d.label }}</button>
            }
          </div>
          <button class="btn-generate-lg" (click)="generate()">
            <mat-icon>auto_awesome</mat-icon> Generate My Roadmap
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 920px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; }

    /* header */
    .page-head {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 16px; flex-wrap: wrap; margin-bottom: 24px;
    }
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

    .controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    /* duration tabs */
    .dur-tabs { display: flex; background: rgba(255,255,255,.04); border: 1px solid var(--border-color); border-radius: 10px; padding: 3px; gap: 2px; }
    .dur-tab {
      padding: 7px 14px; border-radius: 7px; border: none;
      background: none; color: var(--text-secondary);
      font-size: .78rem; font-weight: 600; cursor: pointer;
      transition: all .2s; white-space: nowrap;
    }
    .dur-tab:hover { color: var(--text-primary); background: rgba(255,255,255,.05); }
    .dur-tab.active { background: #00668c; color: #fff; box-shadow: 0 2px 10px rgba(0,102,140,.4); }
    .dur-tab:disabled { opacity: .45; cursor: not-allowed; }

    .btn-generate {
      display: inline-flex; align-items: center; gap: 7px;
      background: #00668c; color: #fff; border: none;
      border-radius: 9px; padding: 10px 20px;
      font-size: .875rem; font-weight: 700; cursor: pointer;
      transition: background .2s, box-shadow .2s, transform .15s;
      box-shadow: 0 4px 16px rgba(0,102,140,.35);
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      mat-spinner { --mdc-circular-progress-active-indicator-color: #fff; }
    }
    .btn-generate:hover:not(:disabled) { background: #005a7a; box-shadow: 0 6px 22px rgba(0,102,140,.5); transform: translateY(-1px); }
    .btn-generate:disabled { opacity: .5; cursor: not-allowed; transform: none; }

    /* error */
    .error-bar {
      display: flex; align-items: center; gap: 10px;
      background: rgba(248,113,113,.08); border: 1px solid rgba(248,113,113,.25);
      border-radius: 11px; padding: 12px 16px; margin-bottom: 20px;
      color: #f87171; font-size: .875rem;
      mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    }
    .err-x { background: none; border: none; cursor: pointer; color: #f87171; margin-left: auto; display: flex; padding: 0; mat-icon { font-size: 18px; } }

    /* generating */
    .gen-state { text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .gen-ring { margin-bottom: 6px; }
    .gen-state h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .gen-state > p { color: var(--text-secondary); font-size: .875rem; margin: 0; }
    .gen-steps { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 6px; }
    .gs { display: flex; align-items: center; gap: 5px; font-size: .75rem; color: rgba(113,196,239,.7); mat-icon { font-size: 14px; width: 14px; height: 14px; color: #4cbe7d; } }

    /* overview card */
    .overview-card {
      background: var(--surface); border: 1px solid rgba(113,196,239,.18);
      border-radius: 16px; padding: 22px 24px;
      display: flex; align-items: center; gap: 20px;
      margin-bottom: 22px; flex-wrap: wrap;
    }
    .ov-left { flex: 1; min-width: 0; }
    .ov-title-row { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
    .ov-icon {
      width: 44px; height: 44px; border-radius: 11px; flex-shrink: 0;
      background: rgba(0,102,140,.2); border: 1px solid rgba(113,196,239,.2);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: #71c4ef; font-size: 22px; }
    }
    .ov-title-row h2 { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
    .ov-title-row p  { font-size: .8rem; color: var(--text-secondary); margin: 0; line-height: 1.5; }
    .prog-track { height: 6px; background: rgba(255,255,255,.07); border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
    .prog-fill  { height: 100%; background: linear-gradient(90deg, #00668c, #71c4ef); border-radius: 3px; transition: width .8s ease; box-shadow: 0 0 8px rgba(113,196,239,.35); }
    .prog-info  { display: flex; justify-content: space-between; font-size: .78rem; }
    .prog-pct   { color: #71c4ef; font-weight: 700; }
    .prog-tasks { color: var(--text-secondary); }

    .ov-ring { position: relative; width: 90px; height: 90px; flex-shrink: 0; }
    .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .ring-val  { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
    .ring-unit { font-size: .65rem; color: var(--text-secondary); margin-top: 1px; }

    /* week block */
    .week-block { margin-bottom: 12px; }

    .week-header {
      display: flex; align-items: center; justify-content: space-between;
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 12px; padding: 14px 18px;
      cursor: pointer; user-select: none;
      transition: border-color .2s, background .2s;
      gap: 12px;
    }
    .week-header:hover { border-color: rgba(113,196,239,.25); background: rgba(113,196,239,.03); }

    .week-left { display: flex; align-items: center; gap: 14px; }
    .week-num {
      width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
      background: rgba(0,102,140,.2); border: 1px solid rgba(113,196,239,.2);
      display: flex; align-items: center; justify-content: center;
      font-size: .78rem; font-weight: 800; color: #71c4ef;
    }
    .week-title { font-size: .92rem; font-weight: 700; color: var(--text-primary); }
    .week-meta  { font-size: .72rem; color: var(--text-secondary); margin-top: 2px; }

    .week-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .week-prog-track { width: 80px; height: 4px; background: rgba(255,255,255,.07); border-radius: 2px; overflow: hidden; }
    .week-prog-fill  { height: 100%; background: linear-gradient(90deg,#00668c,#71c4ef); border-radius: 2px; transition: width .5s ease; }
    .week-pct  { font-size: .72rem; font-weight: 700; color: #71c4ef; min-width: 30px; text-align: right; }
    .chevron   { color: var(--text-secondary); transition: transform .25s; font-size: 20px; }
    .chevron.open { transform: rotate(180deg); }

    /* tasks */
    .tasks { padding: 10px 0 4px 0; display: flex; flex-direction: column; gap: 8px; }

    .task {
      display: flex; align-items: flex-start; gap: 12px;
      background: rgba(255,255,255,.02); border: 1px solid rgba(113,196,239,.07);
      border-radius: 11px; padding: 14px 16px;
      transition: border-color .2s, background .2s;
    }
    .task:hover { border-color: rgba(113,196,239,.15); background: rgba(113,196,239,.02); }
    .task.done { opacity: .65; }
    .task.milestone { border-color: rgba(245,158,11,.2); background: rgba(245,158,11,.03); }

    .check-btn {
      width: 28px; height: 28px; border-radius: 50%;
      background: none; border: none; cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,.25);
      transition: color .2s; padding: 0; margin-top: 1px;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .check-btn:hover   { color: rgba(113,196,239,.7); }
    .check-btn.checked { color: #4cbe7d; }

    .task-body { flex: 1; min-width: 0; }
    .task-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }

    .ms-badge {
      display: inline-flex; align-items: center; gap: 4px;
      background: rgba(245,158,11,.12); border: 1px solid rgba(245,158,11,.25);
      border-radius: 6px; padding: 2px 8px;
      font-size: .68rem; font-weight: 700; color: #f59e0b; flex-shrink: 0;
      mat-icon { font-size: 12px; width: 12px; height: 12px; }
    }
    .task-title { font-size: .875rem; font-weight: 600; color: var(--text-primary); }
    .task-title.striked { text-decoration: line-through; color: var(--text-secondary); }
    .task-desc  { font-size: .78rem; color: var(--text-secondary); margin: 3px 0 8px; line-height: 1.5; }

    .task-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
    .meta-pill {
      display: inline-flex; align-items: center; gap: 4px;
      background: rgba(255,255,255,.04); border: 1px solid rgba(113,196,239,.1);
      border-radius: 6px; padding: 3px 8px;
      font-size: .7rem; color: var(--text-secondary);
      mat-icon { font-size: 12px; width: 12px; height: 12px; color: rgba(113,196,239,.5); }
    }

    .resources { display: flex; flex-wrap: wrap; gap: 6px; }
    .res-link {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(0,102,140,.12); border: 1px solid rgba(113,196,239,.18);
      border-radius: 7px; padding: 4px 10px;
      font-size: .72rem; font-weight: 600; color: #71c4ef;
      text-decoration: none;
      transition: background .2s, border-color .2s;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }
    .res-link:hover { background: rgba(0,102,140,.25); border-color: rgba(113,196,239,.35); }
    .res-yt {
      background: rgba(255,0,0,.08) !important;
      border-color: rgba(255,80,80,.25) !important;
      color: #ff6b6b !important;
    }
    .res-yt:hover { background: rgba(255,0,0,.15) !important; border-color: rgba(255,80,80,.45) !important; }

    /* empty */
    .empty-state {
      text-align: center; padding: 70px 24px;
      display: flex; flex-direction: column; align-items: center; gap: 14px;
      position: relative;
    }
    .empty-glow {
      position: absolute; width: 300px; height: 300px; border-radius: 50%;
      background: radial-gradient(circle, rgba(0,102,140,.1), transparent 70%);
      pointer-events: none;
    }
    .empty-icon {
      width: 88px; height: 88px; border-radius: 22px;
      background: rgba(0,102,140,.12); border: 1px solid rgba(113,196,239,.18);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 28px rgba(0,102,140,.15);
    }
    .empty-state h2 { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .empty-state > p { color: var(--text-secondary); font-size: .875rem; max-width: 380px; line-height: 1.6; margin: 0; }
    .empty-dur { margin-top: 4px; }

    .btn-generate-lg {
      display: inline-flex; align-items: center; gap: 8px;
      background: #00668c; color: #fff; border: none;
      border-radius: 10px; padding: 13px 28px;
      font-size: .95rem; font-weight: 700; cursor: pointer;
      transition: background .2s, box-shadow .2s, transform .15s;
      box-shadow: 0 4px 20px rgba(0,102,140,.4);
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .btn-generate-lg:hover { background: #005a7a; box-shadow: 0 6px 28px rgba(0,102,140,.55); transform: translateY(-1px); }

    /* ── DIAGRAM TREE (roadmap.sh style) ── */
    .diagram-card {
      background: var(--surface); border: 1px solid rgba(113,196,239,.15);
      border-radius: 16px; padding: 20px 22px; margin-bottom: 22px;
    }
    .diagram-head {
      display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
    }
    .dh-icon {
      width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
      background: rgba(0,102,140,.2); border: 1px solid rgba(113,196,239,.2);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: #71c4ef; font-size: 18px; }
    }
    .dh-title { font-size: .9rem; font-weight: 700; color: var(--text-primary); }
    .dh-sub   { font-size: .74rem; color: var(--text-secondary); }
    .dh-legend { margin-left: auto; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .leg { display: inline-flex; align-items: center; gap: 5px; font-size: .7rem; color: var(--text-secondary); }
    .leg-dot { width: 9px; height: 9px; border-radius: 3px; }
    .ld-done    { background: #4cbe7d; }
    .ld-ms      { background: #f59e0b; }
    .ld-pending { background: rgba(113,196,239,.25); border: 1px solid rgba(113,196,239,.35); }

    /* scroll wrapper */
    .tree-scroll {
      overflow-x: auto; overflow-y: visible;
      scrollbar-width: thin; scrollbar-color: rgba(113,196,239,.2) transparent;
      padding-bottom: 8px;
    }
    .tree-scroll::-webkit-scrollbar { height: 4px; }
    .tree-scroll::-webkit-scrollbar-thumb { background: rgba(113,196,239,.2); border-radius: 2px; }

    .tree-root { display: flex; flex-direction: column; align-items: center; min-width: max-content; padding: 0 20px; }

    /* root node */
    .tr-root-node {
      background: linear-gradient(135deg, #00668c, #005a7a);
      color: #fff; border-radius: 10px; padding: 10px 22px;
      font-size: .9rem; font-weight: 800; display: flex; align-items: center; gap: 8px;
      box-shadow: 0 4px 18px rgba(0,102,140,.4);
      white-space: nowrap;
    }
    .trn-icon { font-size: 1.1rem; }

    /* vertical line from root to weeks */
    .tr-root-line {
      width: 2px; height: 28px;
      background: linear-gradient(180deg, #00668c, rgba(113,196,239,.4));
    }

    /* weeks row */
    .tr-weeks {
      display: flex; align-items: flex-start; gap: 0;
      position: relative;
    }

    /* horizontal connector spanning all weeks */
    .tr-weeks::before {
      content: '';
      position: absolute; top: 0; left: 50px; right: 50px; height: 2px;
      background: rgba(113,196,239,.2);
      pointer-events: none;
    }

    /* each week column */
    .tr-week-col {
      display: flex; flex-direction: column; align-items: center;
      min-width: 160px; padding: 0 8px;
    }

    /* vertical line above week node */
    .tr-v-line-top {
      width: 2px; height: 24px;
      background: rgba(113,196,239,.3);
    }

    /* week node box */
    .tr-week-node {
      background: rgba(0,102,140,.15); border: 1.5px solid rgba(113,196,239,.25);
      border-radius: 10px; padding: 10px 14px; cursor: pointer;
      text-align: center; min-width: 130px;
      transition: border-color .2s, background .2s, transform .2s;
    }
    .tr-week-node:hover { border-color: rgba(113,196,239,.5); background: rgba(0,102,140,.25); transform: translateY(-2px); }
    .trw-done    { background: rgba(76,190,125,.12) !important; border-color: rgba(76,190,125,.35) !important; }
    .trw-partial { background: rgba(0,102,140,.2) !important; border-color: rgba(113,196,239,.4) !important; }
    .trw-label { font-size: .82rem; font-weight: 800; color: var(--text-primary); margin-bottom: 3px; }
    .trw-meta  { font-size: .68rem; color: var(--text-secondary); margin-bottom: 6px; }
    .trw-bar   { height: 3px; background: rgba(255,255,255,.08); border-radius: 2px; overflow: hidden; }
    .trw-bar-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #00668c, #71c4ef); transition: width .6s ease; }
    .trw-done .trw-bar-fill { background: #4cbe7d; }

    /* vertical line below week to tasks */
    .tr-v-line-mid {
      width: 2px; height: 20px;
      background: rgba(113,196,239,.2);
    }

    /* tasks column */
    .tr-tasks-col { display: flex; flex-direction: column; gap: 0; align-items: flex-start; width: 100%; }

    .tr-task-wrap { display: flex; align-items: center; width: 100%; }

    .tr-h-line {
      width: 18px; height: 2px; flex-shrink: 0;
      background: rgba(113,196,239,.2);
    }

    /* task node */
    .tr-task-node {
      display: flex; align-items: center; gap: 7px;
      background: rgba(255,255,255,.03); border: 1px solid rgba(113,196,239,.08);
      border-radius: 8px; padding: 7px 10px;
      cursor: pointer; flex: 1; margin: 3px 0;
      transition: border-color .2s, background .2s;
    }
    .tr-task-node:hover { border-color: rgba(113,196,239,.25); background: rgba(113,196,239,.05); }

    /* task states */
    .trt-done    { background: rgba(76,190,125,.07) !important; border-color: rgba(76,190,125,.2) !important; }
    .trt-ms      { background: rgba(245,158,11,.07) !important; border-color: rgba(245,158,11,.22) !important; }
    .trt-pending { }

    /* task dot */
    .trt-dot {
      width: 20px; height: 20px; border-radius: 5px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 12px; width: 12px; height: 12px; }
    }
    .trt-done .trt-dot    { background: rgba(76,190,125,.2); mat-icon { color: #4cbe7d; } }
    .trt-ms .trt-dot      { background: rgba(245,158,11,.2); mat-icon { color: #f59e0b; } }
    .trt-pending .trt-dot { background: rgba(255,255,255,.06); border: 1px solid rgba(113,196,239,.15); }

    .trt-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .trt-title { font-size: .72rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px; }
    .trt-done .trt-title { text-decoration: line-through; color: var(--text-secondary); }
    .trt-hours { font-size: .6rem; color: rgba(113,196,239,.6); }
  `],
})
export class RoadmapComponent implements OnInit {
  private roadmapService = inject(RoadmapService);
  private route          = inject(ActivatedRoute);

  generating       = signal(false);
  roadmap          = signal<Roadmap | null>(null);
  errorMsg         = signal<string | null>(null);
  selectedDuration: RoadmapDuration = '30_days';
  careerPathId: number | null = null;
  careerTitle: string | null  = null;
  openWeeks        = new Set<number>([1]);

  durations = [
    { value: '30_days' as RoadmapDuration, label: '30 Days' },
    { value: '60_days' as RoadmapDuration, label: '60 Days' },
    { value: '90_days' as RoadmapDuration, label: '90 Days' },
    { value: '6_months' as RoadmapDuration, label: '6 Months' },
  ];

  genSteps = ['Analyzing your skills', 'Planning weekly themes', 'Curating resources', 'Building daily tasks'];

  get completedCount(): () => number {
    return () => this.roadmap()?.tasks.filter(t => t.status === 'completed').length ?? 0;
  }

  weekGroups(): { week: number; tasks: any[]; completed: number; totalHours: number }[] {
    const r = this.roadmap();
    if (!r) return [];
    const map = new Map<number, any>();
    r.tasks.forEach(t => {
      if (!map.has(t.week_number)) {
        map.set(t.week_number, { week: t.week_number, tasks: [], completed: 0, totalHours: 0 });
      }
      const w = map.get(t.week_number);
      w.tasks.push(t);
      if (t.status === 'completed') w.completed++;
      w.totalHours += t.estimated_hours || 0;
    });
    return Array.from(map.values()).sort((a, b) => a.week - b.week);
  }

  toggleWeek(week: number): void {
    if (this.openWeeks.has(week)) this.openWeeks.delete(week);
    else this.openWeeks.add(week);
  }

  scrollToWeek(week: number): void {
    // open the week and scroll to it
    this.openWeeks.add(week);
    setTimeout(() => {
      const el = document.getElementById(`week-${week}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(p => {
      if (p['careerId'])    this.careerPathId = +p['careerId'];
      if (p['careerTitle']) this.careerTitle  = p['careerTitle'];
    });
    this.roadmapService.getActive().subscribe({
      next: r => { this.roadmap.set(r); this.openWeeks = new Set([1]); },
      error: () => {}, // no active roadmap yet — ignore 404
    });
  }

  generate(): void {
    this.generating.set(true);
    this.errorMsg.set(null);
    this.roadmapService.generate(
      this.selectedDuration,
      this.careerPathId ?? undefined,
      this.careerTitle  ?? undefined,
    ).subscribe({
      next: r => {
        this.roadmap.set(r);
        this.generating.set(false);
        this.openWeeks = new Set([1]);
      },
      error: err => {
        this.generating.set(false);
        this.errorMsg.set(err?.error?.detail || 'Generation failed. Make sure your OpenAI API key is set in backend/.env');
      },
    });
  }

  isYoutube(url: string): boolean {
    return url?.includes('youtube.com') || url?.includes('youtu.be');
  }

  toggleTask(task: any): void {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    this.roadmapService.updateTaskStatus(task.id, newStatus).subscribe({
      next: () => {
        this.roadmap.update(r => {
          if (!r) return r;
          const tasks = r.tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t);
          const done  = tasks.filter(t => t.status === 'completed').length;
          return { ...r, tasks, completion_percentage: (done / tasks.length) * 100 };
        });
      },
    });
  }
}
