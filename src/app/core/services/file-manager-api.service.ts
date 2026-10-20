import { HttpClient, HttpEvent, HttpEventType, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { FILE_MANAGER_API_BASE } from '../config/app-config';
import {
  ChangePermissionsRequest,
  CompressRequest,
  CopyRequest,
  CreateFolderRequest,
  EditRequest,
  ExtractRequest,
  FileItem,
  FileManagerEntry,
  GetContentRequest,
  GetContentResponse,
  ListRequest,
  ListResponse,
  MoveRequest,
  OperationResponse,
  RemoveRequest,
  RenameRequest,
} from '../models/file-manager.model';

/** Raised when the backend answers with HTTP 200 but `result.success === false`. */
export class FileManagerApiError extends Error {}

function parseSize(size: string): number {
  const n = Number(size);
  return Number.isFinite(n) ? n : 0;
}

function toEntry(item: FileItem, parentPath: string): FileManagerEntry {
  const path = parentPath === '/' ? `/${item.name}` : `${parentPath}/${item.name}`;
  return { ...item, path, sizeBytes: parseSize(item.size) };
}

function unwrapOperation(response: OperationResponse): void {
  if (!response.result.success) {
    throw new FileManagerApiError(response.result.error ?? 'Unknown file manager error');
  }
}

/**
 * Thin HTTP layer over the `/admin/files/*` connector API implemented by
 * `FileManagerController.scala`. Endpoint segments (`listUrl`, `renameUrl`, ...)
 * follow the historical angular-filemanager config naming for readability, even
 * though the backend only inspects the `action` field of the JSON body.
 */
@Injectable({ providedIn: 'root' })
export class FileManagerApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(FILE_MANAGER_API_BASE);

  list(path: string, onlyFolders = false): Observable<FileManagerEntry[]> {
    const body: ListRequest = { action: 'list', path, onlyFolders };
    return this.http
      .post<ListResponse>(`${this.base}/listUrl`, body)
      .pipe(map((res) => res.result.map((item) => toEntry(item, path))));
  }

  rename(item: string, newItemPath: string): Observable<void> {
    const body: RenameRequest = { action: 'rename', item, newItemPath };
    return this.post(`${this.base}/renameUrl`, body);
  }

  move(items: string[], newPath: string): Observable<void> {
    const body: MoveRequest = { action: 'move', items, newPath };
    return this.post(`${this.base}/moveUrl`, body);
  }

  copy(items: string[], newPath: string, singleFilename?: string): Observable<void> {
    const body: CopyRequest = { action: 'copy', items, newPath, singleFilename };
    return this.post(`${this.base}/copyUrl`, body);
  }

  remove(items: string[]): Observable<void> {
    const body: RemoveRequest = { action: 'remove', items };
    return this.post(`${this.base}/removeUrl`, body);
  }

  edit(item: string, content: string): Observable<void> {
    const body: EditRequest = { action: 'edit', item, content };
    return this.post(`${this.base}/editUrl`, body);
  }

  getContent(item: string): Observable<string> {
    const body: GetContentRequest = { action: 'getContent', item };
    return this.http
      .post<GetContentResponse>(`${this.base}/getContentUrl`, body)
      .pipe(map((res) => res.result));
  }

  createFolder(newPath: string): Observable<void> {
    const body: CreateFolderRequest = { action: 'createFolder', newPath };
    return this.post(`${this.base}/createFolderUrl`, body);
  }

  /** Server-side currently disabled; expect a "not supported" error from the backend. */
  changePermissions(
    items: string[],
    perms: string,
    permsCode: string,
    recursive: boolean,
  ): Observable<void> {
    const body: ChangePermissionsRequest = {
      action: 'changePermissions',
      items,
      perms,
      permsCode,
      recursive,
    };
    return this.post(`${this.base}/permissionsUrl`, body);
  }

  compress(items: string[], destination: string, compressedFilename: string): Observable<void> {
    const body: CompressRequest = {
      action: 'compress',
      items,
      destination,
      compressedFilename,
    };
    return this.post(`${this.base}/compressUrl`, body);
  }

  /** Server-side currently disabled; expect a "not supported" error from the backend. */
  extract(item: string, destination: string, folderName: string): Observable<void> {
    const body: ExtractRequest = { action: 'extract', item, destination, folderName };
    return this.post(`${this.base}/extractUrl`, body);
  }

  /** Uploads files to `destination`, reporting progress (0-100) as it streams. */
  upload(destination: string, files: File[]): Observable<number> {
    const formData = new FormData();
    formData.append('destination', destination);
    files.forEach((file, index) => formData.append(`file-${index}`, file, file.name));

    return new Observable<number>((subscriber) => {
      const sub = this.http
        .post(`${this.base}/uploadUrl`, formData, {
          observe: 'events',
          reportProgress: true,
        })
        .subscribe({
          next: (event: HttpEvent<unknown>) => {
            if (event.type === HttpEventType.UploadProgress && event.total) {
              subscriber.next(Math.round((100 * event.loaded) / event.total));
            } else if (event.type === HttpEventType.Response) {
              const body = event.body as OperationResponse | null;
              if (body) {
                try {
                  unwrapOperation(body);
                } catch (err) {
                  subscriber.error(err);
                  return;
                }
              }
              subscriber.next(100);
              subscriber.complete();
            }
          },
          error: (err) => subscriber.error(err),
        });
      return () => sub.unsubscribe();
    });
  }

  /** Builds the GET URL to download a single file (for use in an `<a>` link). */
  downloadUrl(path: string): string {
    const params = new HttpParams().set('action', 'download').set('path', path);
    return `${this.base}/downloadFileUrl?${params.toString()}`;
  }

  /** Builds the GET URL to download multiple items as a single ZIP archive. */
  downloadMultipleUrl(items: string[], toFilename: string): string {
    let params = new HttpParams().set('action', 'downloadMultiple').set('toFilename', toFilename);
    items.forEach((item) => {
      params = params.append('items[]', item);
    });
    return `${this.base}/downloadFileUrl?${params.toString()}`;
  }

  private post(url: string, body: unknown): Observable<void> {
    return this.http.post<OperationResponse>(url, body).pipe(
      map((res) => {
        unwrapOperation(res);
      }),
    );
  }
}

