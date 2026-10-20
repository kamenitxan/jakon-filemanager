import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { FileManagerApiService } from '../../core/services/file-manager-api.service';
import { FileManagerStoreService } from '../../core/services/file-manager-store.service';
import { NotificationService } from '../../core/services/notification.service';
import { I18nService } from '../../core/services/i18n.service';
import { FileManagerEntry } from '../../core/models/file-manager.model';
import {
  CreateFolderDialogComponent,
  CreateFolderDialogData,
} from './dialogs/create-folder/create-folder-dialog';
import { RenameDialogComponent, RenameDialogData } from './dialogs/rename/rename-dialog';
import {
  DeleteConfirmDialogComponent,
  DeleteConfirmDialogData,
} from './dialogs/delete-confirm/delete-confirm-dialog';
import {
  MoveCopyDialogComponent,
  MoveCopyDialogData,
  MoveCopyDialogResult,
  MoveCopyMode,
} from './dialogs/move-copy/move-copy-dialog';
import {
  CompressDialogComponent,
  CompressDialogData,
  CompressDialogResult,
} from './dialogs/compress/compress-dialog';
import {
  ExtractDialogComponent,
  ExtractDialogData,
  ExtractDialogResult,
} from './dialogs/extract/extract-dialog';
import {
  PermissionsDialogComponent,
  PermissionsDialogData,
  PermissionsDialogResult,
} from './dialogs/permissions/permissions-dialog';
import { UploadDialogComponent, UploadDialogData } from './dialogs/upload/upload-dialog';
import {
  EditPreviewDialogComponent,
  EditPreviewDialogData,
} from './dialogs/edit-preview/edit-preview-dialog';

/**
 * Houses every file manager action (dialogs + API calls + store refresh). Both
 * the toolbar (bulk actions on the current selection) and per-row context
 * menus call into this service so the behaviour stays in one place.
 */
@Injectable({ providedIn: 'root' })
export class FileManagerActionsService {
  private readonly dialog = inject(MatDialog);
  private readonly api = inject(FileManagerApiService);
  private readonly store = inject(FileManagerStoreService);
  private readonly notifications = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  async createFolder(): Promise<void> {
    const name = await firstValueFrom(
      this.dialog
        .open<CreateFolderDialogComponent, CreateFolderDialogData, string | undefined>(
          CreateFolderDialogComponent,
          { data: { currentPath: this.store.currentPath() }, width: '420px' },
        )
        .afterClosed(),
    );
    if (!name) {
      return;
    }
    const newPath = this.joinPath(this.store.currentPath(), name);
    try {
      await firstValueFrom(this.api.createFolder(newPath));
      this.notifications.success(this.i18n.translate('message.folderCreated'));
      this.store.refresh();
    } catch (err) {
      this.notifications.error(err, this.i18n.translate('message.folderCreateFailed'));
    }
  }

  async rename(entry: FileManagerEntry): Promise<void> {
    const newName = await firstValueFrom(
      this.dialog
        .open<RenameDialogComponent, RenameDialogData, string | undefined>(RenameDialogComponent, {
          data: { currentName: entry.name },
          width: '420px',
        })
        .afterClosed(),
    );
    if (!newName || newName === entry.name) {
      return;
    }
    const newPath = this.joinPath(this.store.currentPath(), newName);
    try {
      await firstValueFrom(this.api.rename(entry.path, newPath));
      this.notifications.success(this.i18n.translate('message.renamed'));
      this.store.refresh();
    } catch (err) {
      this.notifications.error(err, this.i18n.translate('message.renameFailed'));
    }
  }

  async deleteEntries(entries: FileManagerEntry[]): Promise<void> {
    if (entries.length === 0) {
      return;
    }
    const confirmed = await firstValueFrom(
      this.dialog
        .open<DeleteConfirmDialogComponent, DeleteConfirmDialogData, boolean>(
          DeleteConfirmDialogComponent,
          { data: { names: entries.map((e) => e.name) }, width: '420px' },
        )
        .afterClosed(),
    );
    if (!confirmed) {
      return;
    }
    try {
      await firstValueFrom(this.api.remove(entries.map((e) => e.path)));
      this.notifications.success(this.i18n.translate('message.deleted'));
      this.store.refresh();
    } catch (err) {
      this.notifications.error(err, this.i18n.translate('message.deleteFailed'));
    }
  }

  async moveOrCopy(entries: FileManagerEntry[], mode: MoveCopyMode): Promise<void> {
    if (entries.length === 0) {
      return;
    }
    const result = await firstValueFrom(
      this.dialog
        .open<MoveCopyDialogComponent, MoveCopyDialogData, MoveCopyDialogResult | undefined>(
          MoveCopyDialogComponent,
          {
            data: { items: entries.map((e) => e.path), currentPath: this.store.currentPath(), mode },
            width: '480px',
          },
        )
        .afterClosed(),
    );
    if (!result) {
      return;
    }
    try {
      const items = entries.map((e) => e.path);
      if (mode === 'move') {
        await firstValueFrom(this.api.move(items, result.destination));
        this.notifications.success(this.i18n.translate('message.moved'));
      } else {
        await firstValueFrom(this.api.copy(items, result.destination));
        this.notifications.success(this.i18n.translate('message.copied'));
      }
      this.store.refresh();
    } catch (err) {
      this.notifications.error(
        err,
        this.i18n.translate(mode === 'move' ? 'message.moveFailed' : 'message.copyFailed'),
      );
    }
  }

  async compress(entries: FileManagerEntry[]): Promise<void> {
    if (entries.length === 0) {
      return;
    }
    const defaultFilename = entries.length === 1 ? `${entries[0].name}.zip` : 'archive.zip';
    const result = await firstValueFrom(
      this.dialog
        .open<CompressDialogComponent, CompressDialogData, CompressDialogResult | undefined>(
          CompressDialogComponent,
          { data: { currentPath: this.store.currentPath(), defaultFilename }, width: '420px' },
        )
        .afterClosed(),
    );
    if (!result) {
      return;
    }
    try {
      await firstValueFrom(
        this.api.compress(
          entries.map((e) => e.path),
          result.destination,
          result.compressedFilename,
        ),
      );
      this.notifications.success(this.i18n.translate('message.compressed'));
      this.store.refresh();
    } catch (err) {
      this.notifications.error(err, this.i18n.translate('message.compressFailed'));
    }
  }

  /** Server currently disables `extract`; this surfaces the backend's "not supported" error. */
  async extract(entry: FileManagerEntry): Promise<void> {
    const result = await firstValueFrom(
      this.dialog
        .open<ExtractDialogComponent, ExtractDialogData, ExtractDialogResult | undefined>(
          ExtractDialogComponent,
          { data: { itemName: entry.name, currentPath: this.store.currentPath() }, width: '420px' },
        )
        .afterClosed(),
    );
    if (!result) {
      return;
    }
    try {
      await firstValueFrom(this.api.extract(entry.path, result.destination, result.folderName));
      this.notifications.success(this.i18n.translate('message.extracted'));
      this.store.refresh();
    } catch (err) {
      this.notifications.error(err, this.i18n.translate('message.extractFailed'));
    }
  }

  /** Server currently disables `changePermissions`; this surfaces the backend's error. */
  async changePermissions(entries: FileManagerEntry[]): Promise<void> {
    if (entries.length === 0) {
      return;
    }
    const result = await firstValueFrom(
      this.dialog
        .open<PermissionsDialogComponent, PermissionsDialogData, PermissionsDialogResult | undefined>(
          PermissionsDialogComponent,
          {
            data: {
              names: entries.map((e) => e.name),
              hasFolders: entries.some((e) => e.type === 'dir'),
            },
            width: '420px',
          },
        )
        .afterClosed(),
    );
    if (!result) {
      return;
    }
    try {
      await firstValueFrom(
        this.api.changePermissions(
          entries.map((e) => e.path),
          result.perms,
          result.permsCode,
          result.recursive,
        ),
      );
      this.notifications.success(this.i18n.translate('message.permissionsChanged'));
      this.store.refresh();
    } catch (err) {
      this.notifications.error(err, this.i18n.translate('message.permissionsFailed'));
    }
  }

  async upload(): Promise<void> {
    const uploaded = await firstValueFrom(
      this.dialog
        .open<UploadDialogComponent, UploadDialogData, boolean>(UploadDialogComponent, {
          data: { destination: this.store.currentPath() },
          width: '480px',
        })
        .afterClosed(),
    );
    if (uploaded) {
      this.notifications.success(this.i18n.translate('message.uploaded'));
      this.store.refresh();
    }
  }

  openEditOrPreview(entry: FileManagerEntry): void {
    this.dialog.open<EditPreviewDialogComponent, EditPreviewDialogData, boolean>(
      EditPreviewDialogComponent,
      { data: { entry }, width: '720px', maxWidth: '95vw' },
    );
  }

  download(entries: FileManagerEntry[]): void {
    if (entries.length === 0) {
      return;
    }
    const url =
      entries.length === 1 && entries[0].type === 'file'
        ? this.api.downloadUrl(entries[0].path)
        : this.api.downloadMultipleUrl(
            entries.map((e) => e.path),
            'files.zip',
          );
    window.open(url, '_blank');
  }

  private joinPath(parent: string, name: string): string {
    return parent === '/' ? `/${name}` : `${parent}/${name}`;
  }
}
