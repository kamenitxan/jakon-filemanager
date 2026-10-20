import { Component, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { FileManagerApiService } from '../../../core/services/file-manager-api.service';
import { FileManagerStoreService } from '../../../core/services/file-manager-store.service';
import { I18nService } from '../../../core/services/i18n.service';

interface FolderNode {
  path: string;
  name: string;
  depth: number;
  expanded: boolean;
  loaded: boolean;
  children: FolderNode[];
}

@Component({
  selector: 'fm-tree-sidebar',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, NgTemplateOutlet],
  templateUrl: './tree-sidebar.html',
  styleUrl: './tree-sidebar.scss',
})
export class TreeSidebarComponent {
  private readonly api = inject(FileManagerApiService);
  readonly store = inject(FileManagerStoreService);
  readonly i18n = inject(I18nService);

  readonly root = signal<FolderNode>({
    path: '/',
    name: 'root',
    depth: 0,
    expanded: true,
    loaded: false,
    children: [],
  });

  constructor() {
    void this.loadChildren(this.root());
  }

  toggle(node: FolderNode): void {
    node.expanded = !node.expanded;
    if (node.expanded && !node.loaded) {
      void this.loadChildren(node);
    }
    this.root.set({ ...this.root() });
  }

  select(node: FolderNode): void {
    this.store.navigateTo(node.path);
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
