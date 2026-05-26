import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { email: string; password: string; firstName: string; lastName: string; }
export interface UserInfo { id: string; email: string; firstName: string; lastName: string; role: string; avatarUrl?: string; }
export interface AuthResponse { access_token: string; refresh_token: string; user: UserInfo; }

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'user_info';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly _user = signal<UserInfo | null>(this.loadUser());
  private readonly _loading = signal(false);

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this._loading.set(true);
    return this.http.post<{ data: AuthResponse }>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => this.handleAuthSuccess(res.data)),
      tap(() => this._loading.set(false)),
      catchError(err => { this._loading.set(false); return throwError(() => err); })
    ) as any;
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    this._loading.set(true);
    return this.http.post<{ data: AuthResponse }>(`${this.apiUrl}/register`, data).pipe(
      tap(res => this.handleAuthSuccess(res.data)),
      tap(() => this._loading.set(false)),
      catchError(err => { this._loading.set(false); return throwError(() => err); })
    ) as any;
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    return this.http.post<{ data: AuthResponse }>(`${this.apiUrl}/refresh`, { refresh_token: refreshToken }).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.data.access_token);
      })
    ) as any;
  }

  logout(): void {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    this.http.post(`${this.apiUrl}/logout`, { refresh_token: refreshToken }).subscribe();
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private handleAuthSuccess(auth: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, auth.access_token);
    localStorage.setItem(REFRESH_KEY, auth.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    this._user.set(auth.user);
    this.router.navigate(['/dashboard']);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  private loadUser(): UserInfo | null {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
