/**
 * Models matching the connector API contract implemented by
 * `FileManagerController.scala` / documented in joni2back/angular-filemanager API.md.
 */

export type FileManagerItemType = 'file' | 'dir';

/** One entry returned by the `list` action. */
export interface FileItem {
  name: string;
  /** Unix-style rights string, e.g. `-rw-r--r--` or `drwxr-xr-x`. */
  rights: string;
  /** File size in bytes, as a string (backend serializes it as a JSON string). */
  size: string;
  /** Formatted date string, e.g. `Wed, 4 Jul 2001 12:08:56 GMT`. */
  date: string;
  type: FileManagerItemType;
}

/** Client-side view model built on top of `FileItem`, with the resolved full path. */
export interface FileManagerEntry extends FileItem {
  /** Absolute path within the managed repository, e.g. `/photos/image.png`. */
  path: string;
  /** Numeric size in bytes, parsed from `size` for sorting/formatting. */
  sizeBytes: number;
}

export interface ApiResult<T> {
  result: T;
}

export interface OperationResult {
  success: boolean;
  error: string | null;
}

export type ListResponse = ApiResult<FileItem[]>;
export type OperationResponse = ApiResult<OperationResult>;
export type GetContentResponse = ApiResult<string>;

export interface RenameRequest {
  action: 'rename';
  item: string;
  newItemPath: string;
}

export interface MoveRequest {
  action: 'move';
  items: string[];
  newPath: string;
}

export interface CopyRequest {
  action: 'copy';
  items: string[];
  newPath: string;
  singleFilename?: string;
}

export interface RemoveRequest {
  action: 'remove';
  items: string[];
}

export interface EditRequest {
  action: 'edit';
  item: string;
  content: string;
}

export interface GetContentRequest {
  action: 'getContent';
  item: string;
}

export interface CreateFolderRequest {
  action: 'createFolder';
  newPath: string;
}

export interface ChangePermissionsRequest {
  action: 'changePermissions';
  items: string[];
  perms: string;
  permsCode: string;
  recursive: boolean;
}

export interface CompressRequest {
  action: 'compress';
  items: string[];
  destination: string;
  compressedFilename: string;
}

export interface ExtractRequest {
  action: 'extract';
  item: string;
  destination: string;
  folderName: string;
}

export interface ListRequest {
  action: 'list';
  path: string;
  onlyFolders?: boolean;
}

/** View mode toggle for the file list, mirrors the old angular-filemanager UI. */
export type FileManagerViewMode = 'list' | 'icon';
