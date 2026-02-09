import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private token = signal<string | null>(localStorage.getItem('token'));

  isAuthenticated = computed(() => !!this.token());

  getToken(): string | null {
    return this.token();
  }

  setToken(token: string): void {
    this.token.set(token);
    localStorage.setItem('token', token);
  }

  clearToken(): void {
    this.token.set(null);
    localStorage.removeItem('token');
  }
}
