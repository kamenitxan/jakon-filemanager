import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FileManagerApiService } from '../../../../core/services/file-manager-api.service';
import { I18nService } from '../../../../core/services/i18n.service';

export interface UploadDialogData {
  destination: string;
}

@Component({
  selector: 'fm-upload-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './upload-dialog.html',
})
export class UploadDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<UploadDialogComponent, boolean>);
  private readonly api = inject(FileManagerApiService);
  readonly data = inject<UploadDialogData>(MAT_DIALOG_DATA);
  readonly i18n = inject(I18nService);

  readonly files = signal<File[]>([]);
  readonly uploading = signal(false);
  readonly progress = signal(0);
  readonly isDragOver = signal(false);
  readonly error = signal<string | null>(null);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const dropped = event.dataTransfer?.files;
    if (dropped) {
      this.addFiles(dropped);
    }
  }

  onFilesPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(input.files);
    }
    input.value = '';
  }

  removeFile(index: number): void {
    this.files.update((files) => files.filter((_, i) => i !== index));
  }

  startUpload(): void {
    if (this.files().length === 0) {
      return;
    }
    this.uploading.set(true);
    this.error.set(null);
    this.api.upload(this.data.destination, this.files()).subscribe({
      next: (progress) => this.progress.set(progress),
      error: (err) => {
        this.uploading.set(false);
        this.error.set(err instanceof Error ? err.message : 'Upload failed');
      },
      complete: () => {
        this.uploading.set(false);
        this.dialogRef.close(true);
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  private addFiles(fileList: FileList): void {
    this.files.update((files) => [...files, ...Array.from(fileList)]);
  }
}
