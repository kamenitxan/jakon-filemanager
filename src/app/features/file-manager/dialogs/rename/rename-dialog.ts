import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nService } from '../../../../core/services/i18n.service';

export interface RenameDialogData {
  currentName: string;
}

@Component({
  selector: 'fm-rename-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './rename-dialog.html',
})
export class RenameDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<RenameDialogComponent, string | undefined>);
  readonly data = inject<RenameDialogData>(MAT_DIALOG_DATA);
  readonly i18n = inject(I18nService);

  readonly nameControl = new FormControl(this.data.currentName, {
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

