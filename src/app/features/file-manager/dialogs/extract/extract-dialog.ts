import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nService } from '../../../../core/services/i18n.service';

export interface ExtractDialogData {
  itemName: string;
  currentPath: string;
}

export interface ExtractDialogResult {
  destination: string;
  folderName: string;
}

@Component({
  selector: 'fm-extract-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './extract-dialog.html',
})
export class ExtractDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<ExtractDialogComponent, ExtractDialogResult | undefined>,
  );
  readonly data = inject<ExtractDialogData>(MAT_DIALOG_DATA);
  readonly i18n = inject(I18nService);

  readonly folderNameControl = new FormControl(
    this.data.itemName.replace(/\.(zip|tar|gz|tgz)$/i, ''),
    { nonNullable: true, validators: [Validators.required] },
  );

  confirm(): void {
    if (this.folderNameControl.invalid) {
      this.folderNameControl.markAsTouched();
      return;
    }
    this.dialogRef.close({
      destination: this.data.currentPath,
      folderName: this.folderNameControl.value.trim(),
    });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}

