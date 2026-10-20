import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '../../../../core/services/i18n.service';

export interface DeleteConfirmDialogData {
  names: string[];
}

@Component({
  selector: 'fm-delete-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './delete-confirm-dialog.html',
})
export class DeleteConfirmDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<DeleteConfirmDialogComponent, boolean>);
  readonly data = inject<DeleteConfirmDialogData>(MAT_DIALOG_DATA);
  readonly i18n = inject(I18nService);

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
