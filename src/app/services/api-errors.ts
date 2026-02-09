import { HttpErrorResponse } from '@angular/common/http';

export function toUserMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Unable to reach the server. Please check the API and try again.';
    }

    if (error.status === 401) {
      return 'Please sign in to continue.';
    }

    if (error.status === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }

    const apiMessage = typeof error.error?.message === 'string' ? error.error.message : '';
    if (apiMessage) {
      return apiMessage;
    }
  }

  return fallback;
}
