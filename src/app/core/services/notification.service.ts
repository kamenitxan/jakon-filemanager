import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FileManagerApiError } from './file-manager-api.service';

/** Thin wrapper around MatSnackBar used to surface success/error toasts app-wide. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, undefined, { duration: 3000, panelClass: 'fm-snackbar-success' });
  }

  /** Extracts a readable message from backend errors (`{success:false,error}`) or HTTP failures. */
  error(err: unknown, fallback = 'Something went wrong'): void {
    const message = this.extractMessage(err, fallback);
    this.snackBar.open(message, 'Dismiss', { duration: 6000, panelClass: 'fm-snackbar-error' });
  }

  private extractMessage(err: unknown, fallback: string): string {
    if (err instanceof FileManagerApiError) {
      return err.message;
    }
    if (err && typeof err === 'object' && 'error' in err) {
      const inner = (err as { error?: unknown }).error;
      if (inner && typeof inner === 'object' && 'result' in inner) {
        const result = (inner as { result?: { error?: string } }).result;
        if (result?.error) {
          return result.error;
        }
      }
    }
    if (err instanceof Error && err.message) {
      return err.message;
    }
    return fallback;
  }
}
