import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../../services/auth';
import { AuthApi } from '../../services/auth-api';
import { toUserMessage } from '../../services/api-errors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private router = inject(Router);
  private auth = inject(Auth);
  private authApi = inject(AuthApi);

  username = '';
  password = '';
  error = '';
  loading = false;

  async onLogin() {
    if (!this.username || !this.password) {
      this.error = 'Please enter username and password.';
      return;
    }

    this.error = '';
    this.loading = true;

    try {
      const response = await firstValueFrom(
        this.authApi.login({
          username: this.username.trim(),
          password: this.password,
        })
      );
      this.auth.setToken(response.token);
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.error = toUserMessage(err, 'Invalid credentials. Please try again.');
    } finally {
      this.loading = false;
    }
  }
}


