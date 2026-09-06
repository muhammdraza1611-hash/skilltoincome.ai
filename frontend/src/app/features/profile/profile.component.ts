import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '../../core/store/auth.store';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page">

      <!-- header -->
      <div class="page-head">
        <div class="head-badge"><span class="live-dot"></span> Account</div>
        <h1>Profile Settings</h1>
        <p>Manage your account information and security</p>
      </div>

      <div class="layout">

        <!-- ── LEFT: avatar card ── -->
        <div class="left-col">
          <div class="avatar-card">
            <div class="big-avatar">{{ initials }}</div>
            <div class="avatar-name">{{ authStore.user()?.full_name }}</div>
            <div class="avatar-email">{{ authStore.user()?.email }}</div>
            <div class="role-pill" [class.admin-pill]="authStore.user()?.role === 'admin'">
              <mat-icon>{{ authStore.user()?.role === 'admin' ? 'admin_panel_settings' : 'school' }}</mat-icon>
              {{ authStore.user()?.role | titlecase }}
            </div>
          </div>

          <!-- account info -->
          <div class="info-card">
            <div class="info-title">Account Info</div>
            <div class="info-row">
              <mat-icon>badge</mat-icon>
              <div>
                <div class="info-lbl">Username</div>
                <div class="info-val">{{ authStore.user()?.username }}</div>
              </div>
            </div>
            <div class="info-row">
              <mat-icon>verified_user</mat-icon>
              <div>
                <div class="info-lbl">Verified</div>
                <div class="info-val" [class.verified]="authStore.user()?.is_verified">
                  {{ authStore.user()?.is_verified ? 'Email Verified ✓' : 'Not Verified' }}
                </div>
              </div>
            </div>
            <div class="info-row">
              <mat-icon>calendar_today</mat-icon>
              <div>
                <div class="info-lbl">Member Since</div>
                <div class="info-val">{{ authStore.user()?.created_at | date:'MMM d, yyyy' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── RIGHT: forms ── -->
        <div class="right-col">

          <!-- edit profile -->
          <div class="form-card">
            <div class="form-head">
              <div class="form-icon"><mat-icon>edit</mat-icon></div>
              <div>
                <div class="form-title">Edit Profile</div>
                <div class="form-sub">Update your display name and bio</div>
              </div>
            </div>

            <div class="fields">
              <div class="field-block">
                <label>Full Name</label>
                <input class="fi" [(ngModel)]="fullName" placeholder="Your full name">
              </div>
              <div class="field-block">
                <label>Bio <span class="opt">optional</span></label>
                <textarea class="fi fi-ta" [(ngModel)]="bio" rows="3" placeholder="Tell us about yourself…"></textarea>
              </div>
            </div>

            @if (profileSaved()) {
              <div class="success-bar"><mat-icon>check_circle</mat-icon> Profile updated successfully!</div>
            }

            <div class="form-footer">
              <button class="btn-save" (click)="saveProfile()" [disabled]="saving()">
                @if (saving()) { <mat-spinner diameter="18"></mat-spinner> Saving… }
                @else { <mat-icon>save</mat-icon> Save Changes }
              </button>
            </div>
          </div>

          <!-- change password -->
          <div class="form-card">
            <div class="form-head">
              <div class="form-icon amber"><mat-icon>lock</mat-icon></div>
              <div>
                <div class="form-title">Change Password</div>
                <div class="form-sub">Update your account password</div>
              </div>
            </div>

            <div class="fields">
              <div class="field-block">
                <label>Current Password</label>
                <div class="pw-wrap">
                  <input class="fi" [type]="showCurrent ? 'text' : 'password'"
                         [(ngModel)]="currentPassword" autocomplete="current-password"
                         placeholder="Enter current password">
                  <button type="button" class="eye-btn" (click)="showCurrent = !showCurrent">
                    <mat-icon>{{ showCurrent ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
              </div>
              <div class="field-block">
                <label>New Password</label>
                <div class="pw-wrap">
                  <input class="fi" [type]="showNew ? 'text' : 'password'"
                         [(ngModel)]="newPassword" autocomplete="new-password"
                         placeholder="Min 8 characters">
                  <button type="button" class="eye-btn" (click)="showNew = !showNew">
                    <mat-icon>{{ showNew ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
                <!-- strength bar -->
                @if (newPassword) {
                  <div class="pw-strength">
                    <div class="pw-bars">
                      @for (i of [0,1,2,3]; track i) {
                        <div class="pw-bar" [class.pw-bar-on]="pwScore > i"
                             [style.background]="pwScore <= 1 ? '#f87171' : pwScore <= 2 ? '#f59e0b' : '#4cbe7d'"></div>
                      }
                    </div>
                    <span class="pw-lbl"
                          [class.red]="pwScore <= 1" [class.amber]="pwScore === 2" [class.green]="pwScore >= 3">
                      {{ pwScore <= 1 ? 'Weak' : pwScore === 2 ? 'Fair' : pwScore === 3 ? 'Good' : 'Strong' }}
                    </span>
                  </div>
                }
              </div>
            </div>

            @if (pwError()) {
              <div class="error-bar"><mat-icon>error_outline</mat-icon> {{ pwError() }}</div>
            }
            @if (pwSaved()) {
              <div class="success-bar"><mat-icon>check_circle</mat-icon> Password updated successfully!</div>
            }

            <div class="form-footer">
              <button class="btn-save btn-amber" (click)="changePassword()"
                      [disabled]="savingPass() || !currentPassword || !newPassword || newPassword.length < 8">
                @if (savingPass()) { <mat-spinner diameter="18"></mat-spinner> Updating… }
                @else { <mat-icon>lock_reset</mat-icon> Update Password }
              </button>
            </div>
          </div>

          <!-- danger zone -->
          <div class="danger-card">
            <div class="danger-head">
              <mat-icon>warning_amber</mat-icon>
              <div class="danger-title">Danger Zone</div>
            </div>
            <p class="danger-sub">These actions are irreversible. Please proceed with caution.</p>
            <button class="btn-logout" (click)="authStore.logout()">
              <mat-icon>logout</mat-icon> Sign Out
            </button>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; }

    .page-head { margin-bottom: 24px; }
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

    /* layout */
    .layout { display: grid; grid-template-columns: 260px 1fr; gap: 18px; align-items: start; }
    @media(max-width:768px) { .layout { grid-template-columns: 1fr; } }

    /* avatar card */
    .avatar-card {
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 16px; padding: 24px;
      display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center;
    }
    .big-avatar {
      width: 80px; height: 80px; border-radius: 50%;
      background: linear-gradient(135deg, #00668c, #005a7a);
      border: 3px solid rgba(113,196,239,.35);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.6rem; font-weight: 800; color: #fff;
      box-shadow: 0 0 24px rgba(0,102,140,.4);
    }
    .avatar-name  { font-size: .95rem; font-weight: 700; color: var(--text-primary); }
    .avatar-email { font-size: .78rem; color: var(--text-secondary); }
    .role-pill {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(113,196,239,.1); border: 1px solid rgba(113,196,239,.2);
      border-radius: 20px; padding: 4px 12px;
      font-size: .72rem; font-weight: 700; color: #71c4ef;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .admin-pill { background: rgba(245,158,11,.12); border-color: rgba(245,158,11,.25); color: #f59e0b; }

    /* info card */
    .info-card {
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 16px; padding: 18px; margin-top: 12px;
      display: flex; flex-direction: column; gap: 14px;
    }
    .info-title { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: var(--text-secondary); margin-bottom: 2px; }
    .info-row { display: flex; align-items: flex-start; gap: 10px; mat-icon { font-size: 16px; width: 16px; height: 16px; color: rgba(113,196,239,.6); margin-top: 2px; flex-shrink: 0; } }
    .info-lbl { font-size: .68rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .4px; font-weight: 600; }
    .info-val { font-size: .82rem; color: var(--text-primary); font-weight: 500; margin-top: 1px; }
    .info-val.verified { color: #4cbe7d; }

    /* right col */
    .right-col { display: flex; flex-direction: column; gap: 16px; }

    /* form card */
    .form-card {
      background: var(--surface); border: 1px solid var(--border-color);
      border-radius: 16px; padding: 22px;
      display: flex; flex-direction: column; gap: 18px;
    }
    .form-head { display: flex; align-items: center; gap: 12px; }
    .form-icon {
      width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0;
      background: rgba(0,102,140,.2); border: 1px solid rgba(113,196,239,.2);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: #71c4ef; font-size: 20px; }
    }
    .form-icon.amber { background: rgba(245,158,11,.12); border-color: rgba(245,158,11,.22); mat-icon { color: #f59e0b; } }
    .form-title { font-size: .95rem; font-weight: 700; color: var(--text-primary); }
    .form-sub   { font-size: .76rem; color: var(--text-secondary); margin-top: 2px; }

    /* fields */
    .fields { display: flex; flex-direction: column; gap: 12px; }
    .field-block { display: flex; flex-direction: column; gap: 6px; }
    label {
      font-size: .7rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .5px; color: var(--text-secondary);
    }
    .opt { text-transform: none; font-weight: 400; opacity: .6; letter-spacing: 0; }
    .fi {
      width: 100%; background: rgba(255,255,255,.04);
      border: 1px solid rgba(113,196,239,.14); border-radius: 9px;
      padding: 10px 13px; color: var(--text-primary);
      font-size: .875rem; font-family: inherit; outline: none;
      transition: border-color .2s;
    }
    .fi::placeholder { color: rgba(255,255,255,.2); }
    .fi:focus { border-color: rgba(113,196,239,.4); box-shadow: 0 0 0 3px rgba(113,196,239,.07); }
    .fi-ta { resize: vertical; min-height: 80px; }

    /* password wrap */
    .pw-wrap { position: relative; }
    .pw-wrap .fi { padding-right: 42px; }
    .eye-btn {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: var(--text-secondary);
      display: flex; padding: 0; transition: color .2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .eye-btn:hover { color: #71c4ef; }

    /* strength */
    .pw-strength { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
    .pw-bars { display: flex; gap: 4px; flex: 1; }
    .pw-bar { height: 3px; flex: 1; border-radius: 2px; background: rgba(255,255,255,.08); transition: background .3s; }
    .pw-bar.pw-bar-on { }
    .pw-lbl { font-size: .68rem; font-weight: 700; min-width: 36px; }
    .pw-lbl.red { color: #f87171; } .pw-lbl.amber { color: #f59e0b; } .pw-lbl.green { color: #4cbe7d; }

    /* success/error */
    .success-bar {
      display: flex; align-items: center; gap: 8px;
      background: rgba(76,190,125,.08); border: 1px solid rgba(76,190,125,.25);
      border-radius: 9px; padding: 10px 14px; font-size: .84rem; color: #4cbe7d;
      animation: fade-in .25s ease;
      mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    }
    .error-bar {
      display: flex; align-items: center; gap: 8px;
      background: rgba(248,113,113,.08); border: 1px solid rgba(248,113,113,.25);
      border-radius: 9px; padding: 10px 14px; font-size: .84rem; color: #f87171;
      mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    }
    @keyframes fade-in { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

    /* footer */
    .form-footer { display: flex; justify-content: flex-end; padding-top: 4px; }
    .btn-save {
      display: inline-flex; align-items: center; gap: 7px;
      background: #00668c; color: #fff; border: none; border-radius: 9px;
      padding: 10px 20px; font-size: .875rem; font-weight: 700; cursor: pointer;
      transition: background .2s, box-shadow .2s, transform .15s;
      box-shadow: 0 4px 14px rgba(0,102,140,.35);
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      mat-spinner { --mdc-circular-progress-active-indicator-color: #fff; }
    }
    .btn-save:hover:not(:disabled) { background: #005a7a; box-shadow: 0 6px 20px rgba(0,102,140,.5); transform: translateY(-1px); }
    .btn-save:disabled { opacity: .5; cursor: not-allowed; transform: none; }
    .btn-amber { background: rgba(217,119,6,.8); box-shadow: 0 4px 14px rgba(217,119,6,.3); }
    .btn-amber:hover:not(:disabled) { background: #b45309; box-shadow: 0 6px 20px rgba(217,119,6,.45); }

    /* danger */
    .danger-card {
      background: rgba(248,113,113,.04); border: 1px solid rgba(248,113,113,.18);
      border-radius: 16px; padding: 20px 22px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .danger-head { display: flex; align-items: center; gap: 8px; mat-icon { color: #f87171; font-size: 20px; } }
    .danger-title { font-size: .9rem; font-weight: 700; color: #f87171; }
    .danger-sub   { font-size: .8rem; color: var(--text-secondary); margin: 0; }
    .btn-logout {
      display: inline-flex; align-items: center; gap: 7px; width: fit-content;
      background: rgba(248,113,113,.1); border: 1px solid rgba(248,113,113,.25);
      border-radius: 9px; padding: 9px 18px;
      font-size: .875rem; font-weight: 700; color: #f87171; cursor: pointer;
      transition: background .2s, border-color .2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .btn-logout:hover { background: rgba(248,113,113,.18); border-color: rgba(248,113,113,.4); }
  `],
})
export class ProfileComponent {
  authStore = inject(AuthStore);
  private api = inject(ApiService);

  saving     = signal(false);
  savingPass = signal(false);
  profileSaved = signal(false);
  pwSaved    = signal(false);
  pwError    = signal<string | null>(null);

  fullName       = this.authStore.user()?.full_name || '';
  bio            = this.authStore.user()?.bio || '';
  currentPassword = '';
  newPassword     = '';
  showCurrent     = false;
  showNew         = false;

  get initials(): string {
    return (this.authStore.user()?.full_name || '')
      .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  get pwScore(): number {
    const v = this.newPassword;
    return [v.length >= 8, /[A-Z]/.test(v), /[0-9]/.test(v), /[^a-zA-Z0-9]/.test(v)]
      .filter(Boolean).length;
  }

  saveProfile(): void {
    this.saving.set(true);
    this.profileSaved.set(false);
    this.api.patch('/auth/me', { full_name: this.fullName, bio: this.bio }).subscribe({
      next: (user: any) => {
        this.authStore.updateUser(user);
        this.saving.set(false);
        this.profileSaved.set(true);
        setTimeout(() => this.profileSaved.set(false), 4000);
      },
      error: () => this.saving.set(false),
    });
  }

  changePassword(): void {
    if (!this.currentPassword || !this.newPassword || this.newPassword.length < 8) return;
    this.savingPass.set(true);
    this.pwError.set(null);
    this.pwSaved.set(false);
    this.api.post('/auth/change-password', {
      current_password: this.currentPassword,
      new_password: this.newPassword,
    }).subscribe({
      next: () => {
        this.savingPass.set(false);
        this.pwSaved.set(true);
        this.currentPassword = '';
        this.newPassword = '';
        setTimeout(() => this.pwSaved.set(false), 4000);
      },
      error: (err) => {
        this.savingPass.set(false);
        this.pwError.set(err?.error?.detail || 'Failed to update password');
      },
    });
  }
}
