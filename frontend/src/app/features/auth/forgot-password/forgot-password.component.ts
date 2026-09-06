import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-page">

      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>

      <div class="particles">
        @for (p of particles; track $index) {
          <span class="particle" [style]="p"></span>
        }
      </div>

      <div class="auth-card">
        <div class="auth-header">
          <div class="brand-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#71c4ef" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1>Reset Password</h1>
          <p>Enter your email to receive a reset link</p>
        </div>

        @if (sent()) {
          <div class="success-box">
            <div class="success-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4cbe7d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div class="success-title">Check your inbox</div>
              <div class="success-sub">If that email exists, a reset link has been sent.</div>
            </div>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="field-wrap">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" placeholder="you@example.com">
                <mat-icon matSuffix class="field-icon">email</mat-icon>
              </mat-form-field>
            </div>

            <button type="submit" class="submit-btn" [disabled]="form.invalid || loading()">
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                <span>Send Reset Link</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              }
            </button>
          </form>
        }

        <p class="auth-links"><a routerLink="/auth/login">← Back to Login</a></p>
      </div>
    </div>
  `,
  styles: [`
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
    @keyframes glow-drift {
      from { transform: translate(0,0); }
      to   { transform: translate(50px, 40px); }
    }

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

    .auth-header { text-align: center; margin-bottom: 28px; }

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

    h1 { font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0 0 6px; letter-spacing: -.3px; }
    p  { color: rgba(255,255,255,.5); margin: 0; font-size: .9rem; }

    .field-wrap { margin-bottom: 4px; }
    .full-width { width: 100%; }

    ::ng-deep .full-width .mat-mdc-text-field-wrapper {
      background: rgba(255,255,255,.04) !important; border-radius: 10px !important;
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
    .field-icon { color: rgba(255,255,255,.3) !important; }

    .success-box {
      display: flex; align-items: flex-start; gap: 14px;
      background: rgba(76,190,125,.08);
      border: 1px solid rgba(76,190,125,.25);
      border-radius: 12px; padding: 16px 18px;
      margin-bottom: 20px;
    }
    .success-icon {
      width: 38px; height: 38px; border-radius: 50%;
      background: rgba(76,190,125,.15);
      border: 1px solid rgba(76,190,125,.3);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .success-title { font-size: .92rem; font-weight: 700; color: #4cbe7d; margin-bottom: 3px; }
    .success-sub   { font-size: .82rem; color: rgba(255,255,255,.5); }

    .submit-btn {
      width: 100%;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: #00668c; color: #fff;
      border: none; border-radius: 10px;
      padding: 13px 24px;
      font-size: .95rem; font-weight: 700;
      cursor: pointer; margin-bottom: 20px;
      transition: background .25s, box-shadow .25s, transform .2s;
      box-shadow: 0 4px 20px rgba(0,102,140,.4);
      svg { transition: transform .25s; }
      &:hover:not(:disabled) {
        background: #005a7a;
        box-shadow: 0 8px 28px rgba(0,102,140,.55);
        transform: translateY(-1px);
        svg { transform: translateX(3px); }
      }
      &:disabled { opacity: .55; cursor: not-allowed; }
      mat-spinner { --mdc-circular-progress-active-indicator-color: #fff; }
    }

    .auth-links {
      text-align: center; font-size: .85rem;
      color: rgba(255,255,255,.45); margin: 0;
      a { color: #71c4ef; text-decoration: none; font-weight: 600; transition: color .2s; &:hover { color: #a8dff5; } }
    }
  `],
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  sent = signal(false);
  loading = signal(false);

  particles = Array.from({ length: 18 }, () => ({
    style: `width:${Math.random()*2.5+1}px;height:${Math.random()*2.5+1}px;`
          +`left:${Math.random()*100}%;top:${Math.random()*100}%;`
          +`animation-delay:${Math.random()*10}s;`
          +`animation-duration:${Math.random()*12+10}s;`
          +`opacity:${Math.random()*0.25+0.04};`
  }));

  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.api.post('/auth/forgot-password', this.form.value).subscribe({
      next: () => { this.sent.set(true); this.loading.set(false); },
      error: () => { this.sent.set(true); this.loading.set(false); },
    });
  }
}
