import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { FileManagerStoreService } from '../../../core/services/file-manager-store.service';
import { I18nService } from '../../../core/services/i18n.service';
import { FileManagerActionsService } from '../file-manager-actions.service';
import { FileManagerEntry } from '../../../core/models/file-manager.model';

@Component({
  selector: 'fm-file-grid',
  standalone: true,
  imports: [MatIconModule, MatCheckboxModule, MatMenuModule, MatButtonModule],
  templateUrl: './file-grid.html',
  styleUrl: './file-grid.scss',
})
export class FileGridComponent {
  readonly store = inject(FileManagerStoreService);
  readonly i18n = inject(I18nService);
  readonly actions = inject(FileManagerActionsService);

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

  selectTile(entry: FileManagerEntry): void {
    this.store.selectOnly(entry.path);
  }
}
