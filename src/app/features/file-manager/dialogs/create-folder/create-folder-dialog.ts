import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nService } from '../../../../core/services/i18n.service';

export interface CreateFolderDialogData {
  /** Current directory the new folder will be created in, for display only. */
  currentPath: string;
}

@Component({
  selector: 'fm-create-folder-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './create-folder-dialog.html',
})
export class CreateFolderDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CreateFolderDialogComponent, string | undefined>);
  readonly data = inject<CreateFolderDialogData>(MAT_DIALOG_DATA);
  readonly i18n = inject(I18nService);

  readonly nameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^[^/\\]+$/)],
  });

  confirm(): void {
    if (this.nameControl.invalid) {
      this.nameControl.markAsTouched();
      return;
    }
    this.dialogRef.close(this.nameControl.value.trim());
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}

