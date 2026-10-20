import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { FileManagerApiService } from '../../../../core/services/file-manager-api.service';
import { I18nService } from '../../../../core/services/i18n.service';

export type MoveCopyMode = 'move' | 'copy';

export interface MoveCopyDialogData {
  items: string[];
  currentPath: string;
  mode: MoveCopyMode;
}

export interface MoveCopyDialogResult {
  destination: string;
}

interface FolderNode {
  path: string;
  name: string;
  depth: number;
  expanded: boolean;
  loaded: boolean;
  children: FolderNode[];
}

@Component({
  selector: 'fm-move-copy-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    NgTemplateOutlet,
    FormsModule,
  ],
  templateUrl: './move-copy-dialog.html',
})
export class MoveCopyDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<MoveCopyDialogComponent, MoveCopyDialogResult | undefined>,
  );
  private readonly api = inject(FileManagerApiService);
  readonly data = inject<MoveCopyDialogData>(MAT_DIALOG_DATA);
  readonly i18n = inject(I18nService);

  readonly root = signal<FolderNode>({
    path: '/',
    name: 'root',
    depth: 0,
    expanded: true,
    loaded: false,
    children: [],
  });
  readonly selectedPath = signal<string>(this.data.currentPath);

  constructor() {
    void this.loadChildren(this.root());
  }

  select(node: FolderNode): void {
    this.selectedPath.set(node.path);
  }

  toggle(node: FolderNode): void {
    node.expanded = !node.expanded;
    if (node.expanded && !node.loaded) {
      void this.loadChildren(node);
    }
    this.root.set({ ...this.root() });
  }

  confirm(): void {
    this.dialogRef.close({ destination: this.selectedPath() });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  private async loadChildren(node: FolderNode): Promise<void> {
    try {
      const entries = await firstValueFrom(this.api.list(node.path, true));
      node.children = entries
        .filter((e) => e.type === 'dir')
        .map((e) => ({
          path: e.path,
          name: e.name,
          depth: node.depth + 1,
          expanded: false,
          loaded: false,
          children: [],
        }));
      node.loaded = true;
      this.root.set({ ...this.root() });
    } catch {
      node.loaded = true;
    }
  }
}
