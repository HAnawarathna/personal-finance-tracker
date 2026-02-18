import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/auth';

  register(payload: RegisterPayload) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload);
  }

  login(payload: LoginPayload) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      username: payload.username,
      password: payload.password,
    });
  }
}



