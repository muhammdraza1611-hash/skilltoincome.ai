import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { CareerService } from '../../core/services/career.service';

@Component({
  selector: 'app-skills-assessment',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="page">

      <!-- ── header ── -->
      <div class="page-head">
        <div class="head-badge"><span class="live-dot"></span> Step {{ step() }} of 2</div>
        <h1>Skills Assessment</h1>
        <p>Tell us about your skills and goals so AI can personalize your experience</p>
      </div>

      <!-- ── stepper ── -->
      <div class="stepper">
        <div class="step-line">
          <div class="step-line-fill" [style.width.%]="step() === 1 ? 0 : 100"></div>
        </div>
        @for (s of steps; track s.n) {
          <div class="step-node" [class.active]="step() === s.n" [class.done]="step() > s.n">
            <div class="step-circle">
              @if (step() > s.n) { <mat-icon>check</mat-icon> } @else { {{ s.n }} }
            </div>
            <span class="step-label">{{ s.label }}</span>
          </div>
        }
      </div>

      <!-- ══ STEP 1 ══ -->
      @if (step() === 1) {
        <div class="card">
          <div class="card-head">
            <div class="card-icon"><mat-icon>psychology_alt</mat-icon></div>
            <div>
              <h2>What skills do you have?</h2>
              <p class="card-sub">Add your technical and soft skills with proficiency levels</p>
            </div>
          </div>

          <!-- skill rows -->
          <div [formGroup]="form">
            <div formArrayName="skills" class="skills-list">
              @for (ctrl of skillsArray.controls; track $index; let i = $index) {
              <div class="skill-row" [formGroupName]="i">

                <div class="skill-idx">{{ i + 1 }}</div>

                <div class="skill-fields">
                  <div class="sf-name">
                    <label>Skill Name</label>
                    <input class="fi" formControlName="skill_name"
                           placeholder="e.g. JavaScript, Python, UI Design" autocomplete="off">
                  </div>

                  <div class="sf-level">
                    <label>Level</label>
                    <div class="level-btns">
                      @for (lvl of levels; track lvl.value) {
                        <button type="button"
                          class="lvl-btn"
                          [class.lvl-beginner]="lvl.value === 'beginner' && ctrl.get('level')?.value === lvl.value"
                          [class.lvl-intermediate]="lvl.value === 'intermediate' && ctrl.get('level')?.value === lvl.value"
                          [class.lvl-advanced]="lvl.value === 'advanced' && ctrl.get('level')?.value === lvl.value"
                          [class.lvl-inactive]="ctrl.get('level')?.value !== lvl.value"
                          (click)="ctrl.get('level')?.setValue(lvl.value)">
                          {{ lvl.label }}
                        </button>
                      }
                    </div>
                  </div>
                </div>

                <button type="button" class="del-btn"
                        [disabled]="skillsArray.length === 1"
                        (click)="removeSkill(i)" aria-label="Remove">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              }
            </div>

            <!-- add skill -->
            <button type="button" class="add-row-btn" (click)="addSkill()">
              <mat-icon>add</mat-icon> Add Another Skill
            </button>
          </div>

          <div class="card-footer">
            <span class="tip-txt">💡 Add at least 3 skills for better AI analysis</span>
            <button type="button" class="btn-primary" (click)="step.set(2)">
              Continue
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
        </div>
      }

      <!-- ══ STEP 2 ══ -->
      @if (step() === 2) {
        <div class="card" [formGroup]="form">
          <div class="card-head">
            <div class="card-icon green"><mat-icon>track_changes</mat-icon></div>
            <div>
              <h2>Tell us about your goals</h2>
              <p class="card-sub">Help the AI understand what you want to achieve</p>
            </div>
          </div>

          <div class="goals-grid">
            <div class="fg full">
              <label>Career Goals <em>(comma separated)</em></label>
              <input class="fi" formControlName="career_goals"
                     placeholder="e.g. Become a freelancer, Get a remote job, Build a SaaS">
            </div>
            <div class="fg full">
              <label>Interests <em>(comma separated)</em></label>
              <input class="fi" formControlName="interests"
                     placeholder="e.g. AI, Web Development, Mobile Apps">
            </div>
            <div class="fg">
              <label>Learning Hours / Day</label>
              <input class="fi" type="number" formControlName="learning_hours" min="0.5" max="12" step="0.5">
            </div>
            <div class="fg">
              <label>Location <em>(optional)</em></label>
              <input class="fi" formControlName="location" placeholder="e.g. Cairo, Egypt">
            </div>
            <div class="fg">
              <label>GitHub URL <em>(optional)</em></label>
              <input class="fi" formControlName="github_url" placeholder="https://github.com/username">
            </div>
            <div class="fg">
              <label>Portfolio URL <em>(optional)</em></label>
              <input class="fi" formControlName="portfolio_url" placeholder="https://yoursite.com">
            </div>
          </div>

          @if (saved()) {
            <div class="saved-box">
              <mat-icon>check_circle</mat-icon>
              Assessment saved!
              <a routerLink="/careers">Run AI Career Analysis →</a>
            </div>
          }

          <div class="card-footer">
            <button type="button" class="btn-ghost" (click)="step.set(1)">
              <mat-icon>arrow_back</mat-icon> Back
            </button>
            <button type="button" class="btn-primary" (click)="onSubmit()" [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="18"></mat-spinner> Saving…
              } @else {
                <mat-icon>save</mat-icon> Save Assessment
              }
            </button>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .page { max-width: 780px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; }

    /* header */
    .page-head { margin-bottom: 24px; }
    .head-badge {
      display: inline-flex; align-items: center; gap: 7px;
      background: rgba(0,102,140,.15); border: 1px solid rgba(113,196,239,.22);
      border-radius: 50px; padding: 4px 13px;
      font-size: .72rem; font-weight: 600; color: #71c4ef; margin-bottom: 12px;
    }
    .live-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #4cbe7d;
      animation: blink 2s ease-in-out infinite;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
    h1 { font-size: clamp(1.5rem,3vw,2rem); font-weight: 800; color: var(--text-primary); margin: 0 0 6px; letter-spacing: -.3px; }
    p  { color: var(--text-secondary); margin: 0; font-size: .9rem; }

    /* stepper */
    .stepper {
      position: relative; display: flex; justify-content: space-between;
      align-items: flex-start; margin-bottom: 28px; padding: 0 40px;
    }
    .step-line {
      position: absolute; top: 17px; left: 40px; right: 40px;
      height: 2px; background: rgba(113,196,239,.12); border-radius: 1px;
    }
    .step-line-fill {
      height: 100%; border-radius: 1px;
      background: linear-gradient(90deg, #00668c, #71c4ef);
      transition: width .5s cubic-bezier(.4,0,.2,1);
      box-shadow: 0 0 8px rgba(113,196,239,.4);
    }
    .step-node { display: flex; flex-direction: column; align-items: center; gap: 6px; z-index: 1; }
    .step-circle {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: .82rem; font-weight: 700;
      background: #0c1824; border: 2px solid rgba(113,196,239,.18);
      color: var(--text-secondary); transition: all .3s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .step-node.active .step-circle {
      background: #00668c; border-color: #71c4ef; color: #fff;
      box-shadow: 0 0 16px rgba(0,102,140,.5);
    }
    .step-node.done .step-circle {
      background: rgba(76,190,125,.15); border-color: #4cbe7d; color: #4cbe7d;
    }
    .step-label { font-size: .72rem; font-weight: 600; color: var(--text-secondary); transition: color .3s; }
    .step-node.active .step-label { color: #71c4ef; }
    .step-node.done .step-label  { color: #4cbe7d; }

    /* card */
    .card {
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 18px; padding: 28px 28px 24px;
      animation: fade-in .3s ease both;
    }
    @keyframes fade-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

    .card-head { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 24px; }
    .card-icon {
      width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
      background: rgba(0,102,140,.18); border: 1px solid rgba(113,196,239,.2);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: #71c4ef; font-size: 22px; }
    }
    .card-icon.green { background: rgba(76,190,125,.12); border-color: rgba(76,190,125,.2); mat-icon { color: #4cbe7d; } }
    .card-head h2 { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0 0 3px; }
    .card-sub { font-size: .8rem; color: var(--text-secondary); margin: 0; }

    /* skill rows */
    .skills-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }

    .skill-row {
      display: flex; align-items: center; gap: 12px;
      background: rgba(255,255,255,.03); border: 1px solid rgba(113,196,239,.08);
      border-radius: 12px; padding: 14px 16px;
      transition: border-color .2s;
    }
    .skill-row:hover { border-color: rgba(113,196,239,.18); }

    .skill-idx {
      width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
      background: rgba(0,102,140,.2); border: 1px solid rgba(113,196,239,.2);
      display: flex; align-items: center; justify-content: center;
      font-size: .7rem; font-weight: 700; color: #71c4ef;
    }

    .skill-fields { flex: 1; display: flex; gap: 14px; flex-wrap: wrap; align-items: flex-start; }
    .sf-name { flex: 1; min-width: 180px; }
    .sf-level { flex-shrink: 0; }

    label {
      display: block; font-size: .68rem; font-weight: 600; letter-spacing: .5px;
      text-transform: uppercase; color: var(--text-secondary); margin-bottom: 6px;
    }

    /* base input */
    .fi {
      width: 100%;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(113,196,239,.14);
      border-radius: 9px; padding: 9px 13px;
      color: var(--text-primary);
      font-size: .875rem; font-family: inherit;
      outline: none; transition: border-color .2s, box-shadow .2s;
    }
    .fi::placeholder { color: rgba(255,255,255,.22); }
    .fi:focus {
      border-color: rgba(113,196,239,.5);
      box-shadow: 0 0 0 3px rgba(113,196,239,.08);
    }

    /* level toggle buttons — NO native select */
    .level-btns { display: flex; gap: 5px; }
    .lvl-btn {
      padding: 6px 11px; border-radius: 7px; border: 1px solid transparent;
      font-size: .72rem; font-weight: 600; cursor: pointer;
      transition: all .18s; white-space: nowrap;
      background: rgba(255,255,255,.04);
      border-color: rgba(113,196,239,.1);
      color: var(--text-secondary);
    }
    .lvl-btn:hover { border-color: rgba(113,196,239,.3); color: var(--text-primary); }
    .lvl-beginner    { background: rgba(76,190,125,.15)!important; border-color: #4cbe7d!important; color: #4cbe7d!important; }
    .lvl-intermediate{ background: rgba(245,158,11,.15)!important; border-color: #f59e0b!important; color: #f59e0b!important; }
    .lvl-advanced    { background: rgba(113,196,239,.15)!important; border-color: #71c4ef!important; color: #71c4ef!important; }
    .lvl-inactive    { background: rgba(255,255,255,.03); border-color: rgba(113,196,239,.1); color: var(--text-secondary); }

    .del-btn {
      width: 32px; height: 32px; border-radius: 8px;
      background: none; border: none; cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      color: rgba(248,113,113,.45); transition: background .2s, color .2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .del-btn:hover:not(:disabled) { background: rgba(248,113,113,.1); color: #f87171; }
    .del-btn:disabled { opacity: .25; cursor: not-allowed; }

    .add-row-btn {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      width: 100%; padding: 10px;
      background: rgba(113,196,239,.05); border: 1px dashed rgba(113,196,239,.22);
      border-radius: 10px; cursor: pointer;
      font-size: .84rem; font-weight: 600; color: #71c4ef;
      transition: background .2s, border-color .2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .add-row-btn:hover { background: rgba(113,196,239,.1); border-color: rgba(113,196,239,.38); }

    /* goals grid */
    .goals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 8px; }
    .fg { display: flex; flex-direction: column; gap: 6px; }
    .fg.full { grid-column: 1 / -1; }
    .fg em { font-style: normal; font-weight: 400; opacity: .6; text-transform: none; letter-spacing: 0; font-size: .65rem; }

    /* saved */
    .saved-box {
      display: flex; align-items: center; gap: 10px;
      background: rgba(76,190,125,.08); border: 1px solid rgba(76,190,125,.25);
      border-radius: 10px; padding: 12px 16px;
      font-size: .875rem; color: #4cbe7d; margin-top: 16px;
      mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
      a { color: #71c4ef; text-decoration: none; font-weight: 600; margin-left: 4px; }
    }

    /* footer */
    .card-footer {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 22px; padding-top: 18px;
      border-top: 1px solid var(--border-color); gap: 12px; flex-wrap: wrap;
    }
    .tip-txt { font-size: .78rem; color: var(--text-secondary); }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 7px;
      background: #00668c; color: #fff; border: none;
      border-radius: 9px; padding: 11px 22px;
      font-size: .9rem; font-weight: 700; cursor: pointer;
      transition: background .2s, box-shadow .2s, transform .15s;
      box-shadow: 0 4px 16px rgba(0,102,140,.35);
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      mat-spinner { --mdc-circular-progress-active-indicator-color: #fff; }
    }
    .btn-primary:hover:not(:disabled) {
      background: #005a7a; box-shadow: 0 6px 22px rgba(0,102,140,.5); transform: translateY(-1px);
    }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; }

    .btn-ghost {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: 1px solid var(--border-color);
      border-radius: 9px; padding: 11px 18px;
      font-size: .875rem; font-weight: 600; color: var(--text-secondary); cursor: pointer;
      transition: border-color .2s, color .2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .btn-ghost:hover { border-color: rgba(113,196,239,.3); color: #71c4ef; }
  `],
})
export class SkillsAssessmentComponent {
  private fb            = inject(FormBuilder);
  private careerService = inject(CareerService);
  private snackBar      = inject(MatSnackBar);

  step    = signal(1);
  loading = signal(false);
  saved   = signal(false);

  steps = [{ n: 1, label: 'Your Skills' }, { n: 2, label: 'Your Goals' }];
  levels = [
    { value: 'beginner',     label: 'Beginner'     },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced',     label: 'Advanced'     },
  ];

  form = this.fb.group({
    skills:        this.fb.array([this.newSkill()]),
    career_goals:  [''],
    interests:     [''],
    learning_hours:[2],
    location:      [''],
    github_url:    [''],
    portfolio_url: [''],
  });

  get skillsArray(): FormArray { return this.form.get('skills') as FormArray; }

  newSkill() {
    return this.fb.group({
      skill_name:       ['', Validators.required],
      level:            ['beginner'],
      years_experience: [0],
      is_primary:       [0],
    });
  }

  addSkill()            { this.skillsArray.push(this.newSkill()); }
  removeSkill(i: number){ if (this.skillsArray.length > 1) this.skillsArray.removeAt(i); }

  onSubmit(): void {
    this.loading.set(true);
    this.saved.set(false);
    const v = this.form.value;
    const payload = {
      skills: v.skills,
      profile: {
        career_goals:           v.career_goals?.split(',').map((s:string)=>s.trim()).filter(Boolean)||[],
        interests:              v.interests?.split(',').map((s:string)=>s.trim()).filter(Boolean)||[],
        learning_hours_per_day: v.learning_hours || 2,
        location:               v.location    || null,
        github_url:             v.github_url  || null,
        portfolio_url:          v.portfolio_url || null,
      },
    };
    this.careerService.saveAssessment(payload as any).subscribe({
      next: () => {
        this.loading.set(false);
        this.saved.set(true);
        this.snackBar.open('✅ Assessment saved! Now run AI Career Analysis.', 'Go →', { duration: 5000 });
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to save. Please try again.', 'OK', { duration: 3000 });
      },
    });
  }
}
