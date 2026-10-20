import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { FileManagerStoreService } from '../../../core/services/file-manager-store.service';
import { I18nService } from '../../../core/services/i18n.service';
import { FileManagerActionsService } from '../file-manager-actions.service';
import { SupportedLanguage } from '../../../core/config/app-config';

@Component({
  selector: 'fm-toolbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatMenuModule,
    MatTooltipModule,
    FormsModule,
  ],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class ToolbarComponent {
  readonly store = inject(FileManagerStoreService);
  readonly i18n = inject(I18nService);
  readonly actions = inject(FileManagerActionsService);

  get searchTerm(): string {
    return this.store.searchTerm();
  }

  set searchTerm(value: string) {
    this.store.setSearchTerm(value);
  }

  setLanguage(lang: SupportedLanguage): void {
    this.i18n.setLanguage(lang);
  }

  createFolder(): void {
    void this.actions.createFolder();
  }

  upload(): void {
    void this.actions.upload();
  }

  rename(): void {
    const [entry] = this.store.selectedEntries();
    if (entry) {
      void this.actions.rename(entry);
    }
  }

  delete(): void {
    void this.actions.deleteEntries(this.store.selectedEntries());
  }

  move(): void {
    void this.actions.moveOrCopy(this.store.selectedEntries(), 'move');
  }

  copy(): void {
    void this.actions.moveOrCopy(this.store.selectedEntries(), 'copy');
  }

  compress(): void {
    void this.actions.compress(this.store.selectedEntries());
  }

  extract(): void {
    const [entry] = this.store.selectedEntries();
    if (entry) {
      void this.actions.extract(entry);
    }
  }

  permissions(): void {
    void this.actions.changePermissions(this.store.selectedEntries());
  }

  download(): void {
    this.actions.download(this.store.selectedEntries());
  }

  refresh(): void {
    this.store.refresh();
  }
}
