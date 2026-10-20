import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FileManagerApiError, FileManagerApiService } from './file-manager-api.service';

describe('FileManagerApiService', () => {
  let service: FileManagerApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FileManagerApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('list() resolves full paths and numeric sizes from the connector response', async () => {
    const promise = firstValueFrom(service.list('/photos'));

    const req = httpMock.expectOne('/admin/files/listUrl');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ action: 'list', path: '/photos', onlyFolders: false });
    req.flush({
      result: [
        { name: 'image.png', rights: '-rw-r--r--', size: '2048', date: 'today', type: 'file' },
        { name: 'sub', rights: 'drwxr-xr-x', size: '4096', date: 'today', type: 'dir' },
      ],
    });

    const entries = await promise;
    expect(entries).toEqual([
      {
        name: 'image.png',
        rights: '-rw-r--r--',
        size: '2048',
        date: 'today',
        type: 'file',
        path: '/photos/image.png',
        sizeBytes: 2048,
      },
      {
        name: 'sub',
        rights: 'drwxr-xr-x',
        size: '4096',
        date: 'today',
        type: 'dir',
        path: '/photos/sub',
        sizeBytes: 4096,
      },
    ]);
  });

  it('rename() resolves when the backend reports success', async () => {
    const promise = firstValueFrom(service.rename('/a.txt', '/b.txt'));

    const req = httpMock.expectOne('/admin/files/renameUrl');
    expect(req.request.body).toEqual({ action: 'rename', item: '/a.txt', newItemPath: '/b.txt' });
    req.flush({ result: { success: true, error: null } });

    await expect(promise).resolves.toBeUndefined();
  });

  it('rejects with FileManagerApiError when the backend reports success:false', async () => {
    const promise = firstValueFrom(service.remove(['/locked.txt']));

    const req = httpMock.expectOne('/admin/files/removeUrl');
    req.flush({ result: { success: false, error: 'Cannot remove: permission denied' } });

    await expect(promise).rejects.toBeInstanceOf(FileManagerApiError);
    await expect(promise).rejects.toThrow('Cannot remove: permission denied');
  });

  it('builds correct download URLs for single and multiple items', () => {
    expect(service.downloadUrl('/a.txt')).toBe(
      '/admin/files/downloadFileUrl?action=download&path=/a.txt',
    );
    const multi = service.downloadMultipleUrl(['/a.txt', '/b.txt'], 'files.zip');
    expect(multi).toContain('action=downloadMultiple');
    expect(multi).toContain('toFilename=files.zip');
    expect(multi).toContain('items%5B%5D=/a.txt');
    expect(multi).toContain('items%5B%5D=/b.txt');
  });
});
