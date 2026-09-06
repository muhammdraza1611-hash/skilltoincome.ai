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
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-page">

      <!-- ambient glows -->
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>
      <div class="glow glow-3"></div>

      <!-- particles -->
      <div class="particles">
        @for (p of particles; track $index) {
          <span class="particle" [style]="p"></span>
        }
      </div>

      <div class="auth-card">

        <!-- brand header -->
        <div class="auth-header">
          <div class="brand-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#71c4ef" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 3.5-2.5 6.5-6 7.4V18h2v2h-6v-2h2v-1.6C7.5 15.5 5 12.5 5 9a7 7 0 0 1 7-7z"/>
              <circle cx="12" cy="9" r="2.5" fill="#71c4ef" stroke="none"/>
            </svg>
          </div>
          <h1>Create your account</h1>
          <p>Start your journey to financial freedom</p>
        </div>

        <!-- trust badges -->
        <div class="trust-row">
          <span class="trust-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4cbe7d" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Free forever
          </span>
          <span class="trust-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#71c4ef" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            Ready in 2 min
          </span>
          <span class="trust-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#71c4ef" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Secure
          </span>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field-wrap">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="full_name" placeholder="John Doe">
              <mat-icon matSuffix class="field-icon">person</mat-icon>
            </mat-form-field>
          </div>

          <div class="field-wrap">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" placeholder="johndoe">
              <mat-icon matSuffix class="field-icon">alternate_email</mat-icon>
            </mat-form-field>
          </div>

          <div class="field-wrap">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email">
              <mat-icon matSuffix class="field-icon">email</mat-icon>
            </mat-form-field>
          </div>

          <div class="field-wrap">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPass ? 'text' : 'password'" formControlName="password" autocomplete="new-password">
              <button mat-icon-button matSuffix type="button"
                (click)="showPass = !showPass"
                [attr.aria-label]="showPass ? 'Hide password' : 'Show password'">
                <mat-icon>{{ showPass ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>
          </div>

          <!-- password strength -->
          @if (form.get('password')?.value) {
            <div class="strength-row">
              @for (s of strengthSegments; track $index) {
                <div class="seg" [class.seg-weak]="s === 'weak'" [class.seg-ok]="s === 'ok'" [class.seg-strong]="s === 'strong'"></div>
              }
              <span class="strength-label" [class.weak]="strengthLevel==='weak'" [class.ok]="strengthLevel==='ok'" [class.strong]="strengthLevel==='strong'">
                {{ strengthLevel === 'weak' ? 'Weak' : strengthLevel === 'ok' ? 'Good' : 'Strong' }}
              </span>
            </div>
          }

          @if (authStore.error()) {
            <div class="error-box" role="alert">
              <mat-icon>error_outline</mat-icon>
              {{ authStore.error() }}
            </div>
          }

          <button type="submit" class="submit-btn" [disabled]="form.invalid || authStore.loading()">
            @if (authStore.loading()) {
              <mat-spinner diameter="20" />
            } @else {
              <span>Create Account</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            }
          </button>
        </form>

        <p class="auth-links">Already have an account? <a routerLink="/auth/login">Sign in</a></p>
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
    .glow { position: absolute; border-radius: 50%; pointer-events: none; }
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
    .glow-3 {
      width: 220px; height: 220px;
      background: radial-gradient(circle, rgba(0,102,140,.1), transparent 70%);
      top: 40%; right: 10%;
      animation: glow-drift 22s ease-in-out infinite alternate;
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
      padding: 40px 38px 32px;
      width: 100%; max-width: 440px;
      box-shadow: 0 24px 64px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.03);
      position: relative; z-index: 1;
      animation: card-in .6s cubic-bezier(.4,0,.2,1) both;
    }
    @keyframes card-in {
      from { opacity: 0; transform: translateY(22px) scale(.97); }
      to   { opacity: 1; transform: translateY(0)   scale(1);    }
    }

    /* ── header ── */
    .auth-header { text-align: center; margin-bottom: 18px; }

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
      font-size: 1.55rem; font-weight: 800; color: #fff;
      margin: 0 0 6px; letter-spacing: -.3px;
    }
    p { color: rgba(255,255,255,.5); margin: 0; font-size: .88rem; }

    /* ── trust row ── */
    .trust-row {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-bottom: 22px; flex-wrap: wrap;
    }
    .trust-badge {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(113,196,239,.07);
      border: 1px solid rgba(113,196,239,.16);
      border-radius: 20px; padding: 4px 10px;
      font-size: .7rem; font-weight: 600; color: rgba(255,255,255,.55);
    }

    /* ── fields ── */
    .field-wrap { margin-bottom: 2px; }
    .full-width { width: 100%; }

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

    /* ── password strength ── */
    .strength-row {
      display: flex; align-items: center; gap: 5px;
      margin: -4px 0 12px;
    }
    .seg {
      flex: 1; height: 3px; border-radius: 2px;
      background: rgba(255,255,255,.1);
      transition: background .3s;
      &.seg-weak   { background: #ef4444; }
      &.seg-ok     { background: #f59e0b; }
      &.seg-strong { background: #4cbe7d; }
    }
    .strength-label {
      font-size: .7rem; font-weight: 600; margin-left: 4px; white-space: nowrap;
      &.weak   { color: #ef4444; }
      &.ok     { color: #f59e0b; }
      &.strong { color: #4cbe7d; }
    }

    /* ── error ── */
    .error-box {
      display: flex; align-items: center; gap: 8px;
      background: rgba(220,38,38,.1);
      border: 1px solid rgba(220,38,38,.3);
      border-radius: 10px;
      padding: 10px 14px;
      color: #f87171;
      font-size: .85rem;
      margin-bottom: 14px;
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
      margin-bottom: 18px;
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
      text-align: center; font-size: .85rem;
      color: rgba(255,255,255,.45); margin: 0;
      a {
        color: #71c4ef; text-decoration: none; font-weight: 600;
        transition: color .2s;
        &:hover { color: #a8dff5; }
      }
    }
  `],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  authStore = inject(AuthStore);
  showPass = false;

  particles = Array.from({ length: 18 }, () => ({
    style: `width:${Math.random()*2.5+1}px;height:${Math.random()*2.5+1}px;`
          +`left:${Math.random()*100}%;top:${Math.random()*100}%;`
          +`animation-delay:${Math.random()*10}s;`
          +`animation-duration:${Math.random()*12+10}s;`
          +`opacity:${Math.random()*0.25+0.04};`
  }));

  form = this.fb.group({
    full_name: ['', Validators.required],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get strengthLevel(): 'weak' | 'ok' | 'strong' {
    const v = this.form.get('password')?.value || '';
    const score = [v.length >= 8, /[A-Z]/.test(v), /[0-9]/.test(v), /[^a-zA-Z0-9]/.test(v)].filter(Boolean).length;
    if (score <= 1) return 'weak';
    if (score <= 2) return 'ok';
    return 'strong';
  }

  get strengthSegments(): string[] {
    const lvl = this.strengthLevel;
    if (lvl === 'weak')   return ['weak',   '',   ''];
    if (lvl === 'ok')     return ['ok',     'ok', ''];
    return ['strong', 'strong', 'strong'];
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.authStore.register(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/auth/login'], { queryParams: { registered: true } }),
    });
  }
}
