import { Injectable, computed, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../services/api.service';
import { User, AuthTokens, LoginRequest, RegisterRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private api = inject(ApiService);
  private router = inject(Router);

  // Signals
  private _user = signal<User | null>(this._loadUserFromStorage());
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public computed
  readonly user = computed(() => this._user());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly isAuthenticated = computed(() => !!this._user());
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  private _loadUserFromStorage(): User | null {
    try {
      const raw = localStorage.getItem('sti_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  login(credentials: LoginRequest): Observable<AuthTokens> {
    this._loading.set(true);
    this._error.set(null);
    return this.api.post<AuthTokens>('/auth/login', credentials).pipe(
      tap({
        next: (res) => {
          this._saveSession(res);
          this._loading.set(false);
        },
        error: (err) => {
          this._error.set(err.error?.detail || 'Login failed');
          this._loading.set(false);
        },
      })
    );
  }

  register(data: RegisterRequest): Observable<User> {
    this._loading.set(true);
    this._error.set(null);
    return this.api.post<User>('/auth/register', data).pipe(
      tap({
        next: () => this._loading.set(false),
        error: (err) => {
          this._error.set(err.error?.detail || 'Registration failed');
          this._loading.set(false);
        },
      })
    );
  }

  refreshToken(): Observable<AuthTokens> {
    const refresh = localStorage.getItem('sti_refresh_token');
    return this.api.post<AuthTokens>('/auth/refresh', { refresh_token: refresh }).pipe(
      tap((res) => this._saveSession(res))
    );
  }

  logout(): void {
    localStorage.removeItem('sti_access_token');
    localStorage.removeItem('sti_refresh_token');
    localStorage.removeItem('sti_user');
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  updateUser(user: User): void {
    this._user.set(user);
    localStorage.setItem('sti_user', JSON.stringify(user));
  }

  getAccessToken(): string | null {
    return localStorage.getItem('sti_access_token');
  }

  private _saveSession(res: AuthTokens): void {
    localStorage.setItem('sti_access_token', res.access_token);
    localStorage.setItem('sti_refresh_token', res.refresh_token);
    localStorage.setItem('sti_user', JSON.stringify(res.user));
    this._user.set(res.user);
    this.router.navigate(['/dashboard']);
  }
}
