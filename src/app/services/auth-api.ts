import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

export interface RegisterPayload {
  name?: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

interface StoredUser {
  id: number;
  name: string | null;
  email: string;
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private readonly USERS_KEY = 'finance_users';

  private getUsers(): StoredUser[] {
    const data = localStorage.getItem(this.USERS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveUsers(users: StoredUser[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  private generateToken(userId: number): string {
    return `mock_token_${userId}_${Date.now()}`;
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    const users = this.getUsers();
    
    // Check if user already exists
    if (users.some(u => u.email === payload.email)) {
      return throwError(() => new Error('Email already registered')).pipe(delay(300));
    }

    const newUser: StoredUser = {
      id: users.length + 1,
      name: payload.name || null,
      email: payload.email,
      username: payload.email.split('@')[0],
      password: payload.password,
    };

    users.push(newUser);
    this.saveUsers(users);

    const response: AuthResponse = {
      token: this.generateToken(newUser.id),
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    };

    return of(response).pipe(delay(300));
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    const users = this.getUsers();
    const user = users.find(
      u => (u.username === payload.username || u.email === payload.username) 
        && u.password === payload.password
    );

    if (!user) {
      return throwError(() => new Error('Invalid credentials')).pipe(delay(300));
    }

    const response: AuthResponse = {
      token: this.generateToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };

    return of(response).pipe(delay(300));
  }
}



