import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../../core/store/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-page">

      <!-- ambient glows -->
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>

      <!-- particles -->
      <div class="particles">
        @for (p of particles; track $index) {
          <span class="particle" [style]="p"></span>
        }
      </div>

      <div class="auth-card">
        <!-- brand -->
        <div class="auth-header">
          <div class="brand-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#71c4ef" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 3.5-2.5 6.5-6 7.4V18h2v2h-6v-2h2v-1.6C7.5 15.5 5 12.5 5 9a7 7 0 0 1 7-7z"/>
              <circle cx="12" cy="9" r="2.5" fill="#71c4ef" stroke="none"/>
            </svg>
          </div>
          <h1>Welcome back</h1>
          <p>Sign in to your SkillToIncome AI account</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field-wrap">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="you@example.com" autocomplete="email">
              <mat-icon matSuffix class="field-icon">email</mat-icon>
            </mat-form-field>
          </div>

          <div class="field-wrap">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="password" autocomplete="current-password">
              <button mat-icon-button matSuffix type="button"
                (click)="showPassword = !showPassword"
                [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'">
                <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>
          </div>

          @if (authStore.error()) {
            <div class="error-box" role="alert">
              <mat-icon>error_outline</mat-icon>
              {{ authStore.error() }}
            </div>
          }

          <button type="submit" class="submit-btn" [disabled]="authStore.loading()">
            @if (authStore.loading()) {
              <mat-spinner diameter="20" />
            } @else {
              <span>Sign In</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            }
          </button>
        </form>

        <div class="auth-links">
          <a routerLink="/auth/forgot-password">Forgot password?</a>
          <span>No account? <a routerLink="/auth/register">Sign up free</a></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── page shell ── */
    .auth-page {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background:
        radial-gradient(ellipse 70% 50% at 20% 20%, rgba(0,102,140,.22) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 80% 70%, rgba(113,196,239,.07) 0%, transparent 60%),
        #08111a;
      padding: 24px;
      font-family: 'Inter', system-ui, sans-serif;
      position: relative; overflow: hidden;
    }

    /* glows */
    .glow {
      position: absolute; border-radius: 50%; pointer-events: none;
    }
    .glow-1 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(0,102,140,.18), transparent 70%);
      top: -180px; left: -160px;
      animation: glow-drift 14s ease-in-out infinite alternate;
    }
    .glow-2 {
      width: 340px; height: 340px;
      background: radial-gradient(circle, rgba(113,196,239,.07), transparent 70%);
      bottom: -100px; right: -80px;
      animation: glow-drift 18s ease-in-out infinite alternate-reverse;
    }
    @keyframes glow-drift {
      from { transform: translate(0,0); }
      to   { transform: translate(50px, 40px); }
    }

    /* particles */
    .particles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
    .particle {
      position: absolute; border-radius: 50%; background: #71c4ef;
      animation: float-up linear infinite;
    }
    @keyframes float-up {
      0%   { transform: translateY(100vh); opacity: 0; }
      5%   { opacity: 1; }
      95%  { opacity: .4; }
      100% { transform: translateY(-80px); opacity: 0; }
    }

    /* ── card ── */
    .auth-card {
      background: #0c1824;
      border: 1px solid rgba(113,196,239,.14);
      border-radius: 20px;
      padding: 44px 40px 36px;
      width: 100%; max-width: 420px;
      box-shadow: 0 24px 64px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.03);
      position: relative; z-index: 1;
      animation: card-in .6s cubic-bezier(.4,0,.2,1) both;
    }
    @keyframes card-in {
      from { opacity: 0; transform: translateY(22px) scale(.97); }
      to   { opacity: 1; transform: translateY(0)   scale(1);    }
    }

    /* ── header ── */
    .auth-header { text-align: center; margin-bottom: 30px; }

    .brand-mark {
      width: 56px; height: 56px; border-radius: 14px;
      background: rgba(0,102,140,.25);
      border: 1.5px solid rgba(113,196,239,.3);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 0 20px rgba(0,102,140,.3);
      animation: mark-pulse 3s ease-in-out infinite;
    }
    @keyframes mark-pulse {
      0%,100% { box-shadow: 0 0 20px rgba(0,102,140,.3); }
      50%     { box-shadow: 0 0 36px rgba(113,196,239,.35); }
    }

    h1 {
      font-size: 1.6rem; font-weight: 800; color: #fff;
      margin: 0 0 6px; letter-spacing: -.3px;
    }
    p { color: rgba(255,255,255,.5); margin: 0; font-size: .9rem; }

    /* ── fields ── */
    .field-wrap { margin-bottom: 4px; }
    .full-width { width: 100%; }

    /* override Material outline colors to match theme */
    ::ng-deep .full-width .mat-mdc-text-field-wrapper {
      background: rgba(255,255,255,.04) !important;
      border-radius: 10px !important;
    }
    ::ng-deep .full-width .mdc-notched-outline__leading,
    ::ng-deep .full-width .mdc-notched-outline__notch,
    ::ng-deep .full-width .mdc-notched-outline__trailing {
      border-color: rgba(113,196,239,.2) !important;
    }
    ::ng-deep .full-width.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .full-width.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .full-width.mat-focused .mdc-notched-outline__trailing {
      border-color: #71c4ef !important;
    }
    ::ng-deep .full-width .mat-mdc-input-element { color: #fff !important; }
    ::ng-deep .full-width .mat-mdc-floating-label { color: rgba(255,255,255,.45) !important; }
    ::ng-deep .full-width.mat-focused .mat-mdc-floating-label { color: #71c4ef !important; }
    ::ng-deep .full-width .mat-mdc-form-field-icon-suffix .mat-icon { color: rgba(255,255,255,.35); }
    .field-icon { color: rgba(255,255,255,.3) !important; }

    /* ── error ── */
    .error-box {
      display: flex; align-items: center; gap: 8px;
      background: rgba(220,38,38,.1);
      border: 1px solid rgba(220,38,38,.3);
      border-radius: 10px;
      padding: 10px 14px;
      color: #f87171;
      font-size: .85rem;
      margin-bottom: 16px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    }

    /* ── submit ── */
    .submit-btn {
      width: 100%;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: #00668c;
      color: #fff;
      border: none; border-radius: 10px;
      padding: 13px 24px;
      font-size: .95rem; font-weight: 700;
      cursor: pointer;
      margin-bottom: 20px;
      transition: background .25s, box-shadow .25s, transform .2s;
      box-shadow: 0 4px 20px rgba(0,102,140,.4);
      svg { transition: transform .25s; }
      &:hover:not(:disabled) {
        background: #005a7a;
        box-shadow: 0 8px 28px rgba(0,102,140,.55);
        transform: translateY(-1px);
        svg { transform: translateX(3px); }
      }
      &:disabled { opacity: .55; cursor: not-allowed; transform: none; }
      mat-spinner { --mdc-circular-progress-active-indicator-color: #fff; }
    }

    /* ── links ── */
    .auth-links {
      display: flex; flex-direction: column; gap: 8px;
      text-align: center; font-size: .85rem;
      color: rgba(255,255,255,.45);
      a {
        color: #71c4ef; text-decoration: none; font-weight: 600;
        transition: color .2s;
        &:hover { color: #a8dff5; }
      }
    }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  authStore = inject(AuthStore);
  showPassword = false;

  particles = Array.from({ length: 18 }, () => ({
    style: `width:${Math.random()*2.5+1}px;height:${Math.random()*2.5+1}px;`
          +`left:${Math.random()*100}%;top:${Math.random()*100}%;`
          +`animation-delay:${Math.random()*10}s;`
          +`animation-duration:${Math.random()*12+10}s;`
          +`opacity:${Math.random()*0.25+0.04};`
  }));

  form = this.fb.group({
    email: ['', [Validators.required]],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    // mark all fields touched so validation errors show
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.authStore.login(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {},
    });
  }
}
