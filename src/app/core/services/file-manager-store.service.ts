import { inject, Injectable, signal, computed } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { FileManagerApiService } from './file-manager-api.service';
import { NotificationService } from './notification.service';
import { FileManagerEntry, FileManagerViewMode } from '../models/file-manager.model';

const ROOT_PATH = '/';

function parentOf(path: string): string {
  if (path === ROOT_PATH) {
    return ROOT_PATH;
  }
  const trimmed = path.replace(/\/+$/, '');
  const idx = trimmed.lastIndexOf('/');
  return idx <= 0 ? ROOT_PATH : trimmed.slice(0, idx);
}

/**
 * Central signals-based state for the file manager: current directory, its
 * entries, selection, view mode and search filter. Components read state via
 * public computed signals and trigger mutations through the exposed methods;
 * no direct signal writes happen outside this service.
 */
@Injectable({ providedIn: 'root' })
export class FileManagerStoreService {
  private readonly api = inject(FileManagerApiService);
  private readonly notifications = inject(NotificationService);

  readonly currentPath = signal<string>(ROOT_PATH);
  readonly entries = signal<FileManagerEntry[]>([]);
  readonly loading = signal(false);
  readonly viewMode = signal<FileManagerViewMode>('list');
  readonly searchTerm = signal('');
  readonly selectedPaths = signal<ReadonlySet<string>>(new Set());

  readonly breadcrumbs = computed(() => {
    const path = this.currentPath();
    if (path === ROOT_PATH) {
      return [{ name: 'root', path: ROOT_PATH }];
    }
    const segments = path.split('/').filter(Boolean);
    const crumbs = [{ name: 'root', path: ROOT_PATH }];
    let acc = '';
    for (const segment of segments) {
      acc += `/${segment}`;
      crumbs.push({ name: segment, path: acc });
    }
    return crumbs;
  });

  readonly filteredEntries = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const entries = this.entries();
    const filtered = term ? entries.filter((e) => e.name.toLowerCase().includes(term)) : entries;
    return [...filtered].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'dir' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  });

  readonly selectedEntries = computed(() => {
    const selected = this.selectedPaths();
    return this.entries().filter((e) => selected.has(e.path));
  });

  readonly hasSelection = computed(() => this.selectedPaths().size > 0);

  refresh(): void {
    this.loading.set(true);
    this.selectedPaths.set(new Set());
    this.api
      .list(this.currentPath())
      .pipe(
        tap((entries) => this.entries.set(entries)),
        catchError((err) => {
          this.notifications.error(err, 'Failed to load directory');
          this.entries.set([]);
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  navigateTo(path: string): void {
    this.currentPath.set(path || ROOT_PATH);
    this.refresh();
  }

  navigateUp(): void {
    this.navigateTo(parentOf(this.currentPath()));
  }

  enterDirectory(entry: FileManagerEntry): void {
    if (entry.type === 'dir') {
      this.navigateTo(entry.path);
    }
  }

  setViewMode(mode: FileManagerViewMode): void {
    this.viewMode.set(mode);
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  toggleSelection(path: string): void {
    const current = new Set(this.selectedPaths());
    if (current.has(path)) {
      current.delete(path);
    } else {
      current.add(path);
    }
    this.selectedPaths.set(current);
  }

  selectOnly(path: string): void {
    this.selectedPaths.set(new Set([path]));
  }

  clearSelection(): void {
    this.selectedPaths.set(new Set());
  }

  selectAll(): void {
    this.selectedPaths.set(new Set(this.filteredEntries().map((e) => e.path)));
  }
}
