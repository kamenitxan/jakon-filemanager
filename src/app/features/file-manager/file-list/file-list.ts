import { Component, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { FileManagerStoreService } from '../../../core/services/file-manager-store.service';
import { I18nService } from '../../../core/services/i18n.service';
import { FileManagerActionsService } from '../file-manager-actions.service';
import { FileManagerEntry } from '../../../core/models/file-manager.model';

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

@Component({
  selector: 'fm-file-list',
  standalone: true,
  imports: [MatTableModule, MatCheckboxModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './file-list.html',
  styleUrl: './file-list.scss',
})
export class FileListComponent {
  readonly store = inject(FileManagerStoreService);
  readonly i18n = inject(I18nService);
  readonly actions = inject(FileManagerActionsService);

  readonly displayedColumns = ['select', 'name', 'size', 'date', 'rights', 'menu'];

  formatSize = formatSize;

  isSelected(entry: FileManagerEntry): boolean {
    return this.store.selectedPaths().has(entry.path);
  }

  toggle(entry: FileManagerEntry): void {
    this.store.toggleSelection(entry.path);
  }

  open(entry: FileManagerEntry): void {
    if (entry.type === 'dir') {
      this.store.enterDirectory(entry);
    } else {
      this.actions.openEditOrPreview(entry);
    }
  }

  selectRow(entry: FileManagerEntry): void {
    this.store.selectOnly(entry.path);
  }
}
