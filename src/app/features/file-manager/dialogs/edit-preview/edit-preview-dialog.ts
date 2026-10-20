import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { FileManagerApiService } from '../../../../core/services/file-manager-api.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { FileManagerEntry } from '../../../../core/models/file-manager.model';

export interface EditPreviewDialogData {
  entry: FileManagerEntry;
}

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'];
const TEXT_EXTENSIONS = [
  'txt', 'md', 'json', 'js', 'ts', 'html', 'htm', 'css', 'scss', 'xml', 'yml', 'yaml',
  'log', 'py', 'java', 'scala', 'kt', 'conf', 'ini', 'sh', 'bat', 'properties', 'csv',
];

function extensionOf(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx === -1 ? '' : name.slice(idx + 1).toLowerCase();
}

type PreviewKind = 'image' | 'text' | 'unsupported';

@Component({
  selector: 'fm-edit-preview-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule,
  ],
  templateUrl: './edit-preview-dialog.html',
})
export class EditPreviewDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<EditPreviewDialogComponent, boolean>);
  private readonly api = inject(FileManagerApiService);
  readonly data = inject<EditPreviewDialogData>(MAT_DIALOG_DATA);
  readonly i18n = inject(I18nService);

  readonly kind: PreviewKind = this.resolveKind();
  readonly loading = signal(this.kind === 'text');
  readonly saving = signal(false);
  readonly content = signal('');
  readonly error = signal<string | null>(null);
  readonly downloadUrl = this.api.downloadUrl(this.data.entry.path);

  constructor() {
    if (this.kind === 'text') {
      this.api.getContent(this.data.entry.path).subscribe({
        next: (text) => {
          this.content.set(text);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err instanceof Error ? err.message : 'Failed to load file content');
          this.loading.set(false);
        },
      });
    }
  }

  save(): void {
    this.saving.set(true);
    this.api.edit(this.data.entry.path, this.content()).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err instanceof Error ? err.message : 'Failed to save file');
      },
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }

  private resolveKind(): PreviewKind {
    const ext = extensionOf(this.data.entry.name);
    if (IMAGE_EXTENSIONS.includes(ext)) {
      return 'image';
    }
    if (TEXT_EXTENSIONS.includes(ext)) {
      return 'text';
    }
    return 'unsupported';
  }
}
