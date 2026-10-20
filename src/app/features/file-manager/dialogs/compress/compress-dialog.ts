import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nService } from '../../../../core/services/i18n.service';

export interface CompressDialogData {
  currentPath: string;
  defaultFilename: string;
}

export interface CompressDialogResult {
  destination: string;
  compressedFilename: string;
}

@Component({
  selector: 'fm-compress-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './compress-dialog.html',
})
export class CompressDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<CompressDialogComponent, CompressDialogResult | undefined>,
  );
  readonly data = inject<CompressDialogData>(MAT_DIALOG_DATA);
  readonly i18n = inject(I18nService);

  readonly filenameControl = new FormControl(this.data.defaultFilename, {
    nonNullable: true,
    validators: [Validators.required],
  });

  confirm(): void {
    if (this.filenameControl.invalid) {
      this.filenameControl.markAsTouched();
      return;
    }
    this.dialogRef.close({
      destination: this.data.currentPath,
      compressedFilename: this.filenameControl.value.trim(),
    });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}

