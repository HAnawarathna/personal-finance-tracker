import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../../services/auth';
import { AuthApi } from '../../services/auth-api';
import { toUserMessage } from '../../services/api-errors';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private router = inject(Router);
  private auth = inject(Auth);
  private authApi = inject(AuthApi);

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  userType = 'personal';
  error = signal('');
  loading = signal(false);

  async onRegister() {
    if (!this.email || !this.password) {
      this.error.set('Email and password are required.');
      return;
    }

    if (this.password.length < 6) {
      this.error.set('Password must be at least 6 characters.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.error.set('');
    this.loading.set(true);

    try {
      const response = await firstValueFrom(
        this.authApi.register({
          name: this.name.trim() || undefined,
          email: this.email.trim(),
          password: this.password,
          userType: this.userType,
        })
      );
      this.auth.setToken(response.token);
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.error.set(toUserMessage(err, 'Unable to create account. Please try again.'));
    } finally {
      this.loading.set(false);
    }
  }
}
