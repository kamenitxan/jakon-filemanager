import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FileManagerStoreService } from './file-manager-store.service';
import { FileManagerApiService } from './file-manager-api.service';
import { NotificationService } from './notification.service';
import { FileManagerEntry } from '../models/file-manager.model';

function makeEntry(overrides: Partial<FileManagerEntry>): FileManagerEntry {
  return {
    name: 'file.txt',
    rights: '-rw-r--r--',
    size: '10',
    date: 'today',
    type: 'file',
    path: '/file.txt',
    sizeBytes: 10,
    ...overrides,
  };
}

describe('FileManagerStoreService', () => {
  let store: FileManagerStoreService;
  let apiSpy: { list: ReturnType<typeof vi.fn> };
  let notificationsSpy: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiSpy = { list: vi.fn() };
    notificationsSpy = { error: vi.fn(), success: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        FileManagerStoreService,
        { provide: FileManagerApiService, useValue: apiSpy },
        { provide: NotificationService, useValue: notificationsSpy },
      ],
    });
    store = TestBed.inject(FileManagerStoreService);
  });

  it('loads entries for the current path on refresh()', () => {
    const entries = [makeEntry({ name: 'a.txt', path: '/a.txt' })];
    apiSpy.list.mockReturnValue(of(entries));

    store.refresh();

    expect(apiSpy.list).toHaveBeenCalledWith('/');
    expect(store.entries()).toEqual(entries);
    expect(store.loading()).toBe(false);
  });

  it('shows a notification and clears entries when list() fails', () => {
    apiSpy.list.mockReturnValue(throwError(() => new Error('boom')));

    store.refresh();

    expect(notificationsSpy.error).toHaveBeenCalled();
    expect(store.entries()).toEqual([]);
  });

  it('navigateTo() updates currentPath and reloads entries', () => {
    apiSpy.list.mockReturnValue(of([]));

    store.navigateTo('/photos');

    expect(store.currentPath()).toBe('/photos');
    expect(apiSpy.list).toHaveBeenCalledWith('/photos');
  });

  it('filteredEntries() sorts folders first, then applies the search term', () => {
    apiSpy.list.mockReturnValue(
      of([
        makeEntry({ name: 'zeta.txt', path: '/zeta.txt', type: 'file' }),
        makeEntry({ name: 'alpha', path: '/alpha', type: 'dir' }),
        makeEntry({ name: 'beta.txt', path: '/beta.txt', type: 'file' }),
      ]),
    );
    store.refresh();

    expect(store.filteredEntries().map((e) => e.name)).toEqual(['alpha', 'beta.txt', 'zeta.txt']);

    store.setSearchTerm('zeta');
    expect(store.filteredEntries().map((e) => e.name)).toEqual(['zeta.txt']);
  });

  it('toggleSelection() adds and removes paths from the selection', () => {
    expect(store.hasSelection()).toBe(false);

    store.toggleSelection('/a.txt');
    expect(store.selectedPaths().has('/a.txt')).toBe(true);
    expect(store.hasSelection()).toBe(true);

    store.toggleSelection('/a.txt');
    expect(store.selectedPaths().has('/a.txt')).toBe(false);
    expect(store.hasSelection()).toBe(false);
  });
});
