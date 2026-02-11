import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
  error = '';
  loading = false;

  async onRegister() {
    if (!this.email || !this.password) {
      this.error = 'Email and password are required.';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.error = '';
    this.loading = true;

    try {
      const response = await firstValueFrom(
        this.authApi.register({
          name: this.name.trim() || undefined,
          email: this.email.trim(),
          password: this.password,
        })
      );
      this.auth.setToken(response.token);
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.error = toUserMessage(err, 'Unable to create account. Please try again.');
    } finally {
      this.loading = false;
    }
  }
}
