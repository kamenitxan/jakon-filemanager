# Jakon File Manager

Modern Angular 22 frontend for the Jakon admin file manager. This project replaces the
legacy AngularJS UI from [joni2back/angular-filemanager](https://github.com/joni2back/angular-filemanager)
that previously ran at `/admin/files`. It is a **frontend-only** rewrite: the backend
connector (`FileManagerController.scala` in the Jakon core module) is unchanged and
fully API-compatible with what this UI expects.

## Tech stack

- Angular 22, standalone components, zoneless change detection, Signals for state
  (no NgModules, no NgRx)
- Angular Material (Material 3 azure/blue theme)
- npm as package manager
- Vitest for unit tests (Angular 22's default test runner)

## Requirements

Angular CLI 22 requires Node `^22.22.3 || ^24.15.0 || >=26.0.0`. If your system Node is
older (this repo was developed against system Node v22.15.0, which does **not**
qualify), a portable Node distribution is kept out of git under `.tools/` and must be
put on `PATH` before running any npm/ng command, e.g.:

```powershell
$env:PATH = "$PWD\.tools\node-v24.22.0-win-x64;" + $env:PATH
```

(Download and extract a matching Node build into `.tools/` if it isn't present yet;
the folder is gitignored.)

## Development

```bash
npm install
npm start          # ng serve, proxied to the real backend (see below)
npm run build       # production build -> dist/jakon-filemanager
npm test            # Vitest unit tests
```

### Backend proxy

`ng serve` uses `proxy.conf.js` to forward every `/admin/files/**` request to a real
Jakon backend instance, since this is a frontend-only project with no API of its own.
The target defaults to `http://192.168.5.70:4569` and can be overridden with the
`FM_BACKEND_TARGET` environment variable:

```powershell
$env:FM_BACKEND_TARGET = "http://localhost:8080"
npm start
```

Authentication relies entirely on the existing Jakon admin session cookie
(`withCredentials: true` on every request via `credentialsInterceptor`) — log in to the
Jakon admin UI in the same browser/profile first; there is no separate login flow here.

## Architecture

```
src/app/
  core/
    config/        – injection tokens & constants (API base path, supported languages)
    models/         – TypeScript types mirroring the connector's JSON contract
    services/
      file-manager-api.service.ts    – thin HTTP layer over /admin/files/* actions
      file-manager-store.service.ts  – Signals-based state (path, entries, selection, view mode, search)
      i18n.service.ts                – signal-based translations, loads public/i18n/*.json
      notification.service.ts        – MatSnackBar wrapper for success/error toasts
    interceptors/
      credentials.interceptor.ts     – forces withCredentials on every request
  features/file-manager/
    file-manager-actions.service.ts  – orchestrates dialogs + API calls + store refresh
    shell/           – responsive layout (sidenav + toolbar + list/grid)
    toolbar/         – actions, search, view toggle, language switcher, breadcrumbs
    tree-sidebar/    – lazy-loaded recursive folder tree
    file-list/       – Material table view
    file-grid/       – icon/tile view
    dialogs/         – create-folder, rename, delete-confirm, move-copy picker,
                        upload (drag & drop + progress), compress, extract,
                        permissions, edit/preview
```

## Backend API contract

All JSON actions POST to `/admin/files/<anySegment>` with `{"action": "...", ...}` in
the body (the URL segment is cosmetic; `action` in the payload selects the operation).
Successful responses look like `{"result":{"success":true,"error":null}}`, failures
`{"result":{"success":false,"error":"..."}}`. `list` returns
`{"result":[{name,rights,size,date,type}, ...]}`. Uploads are
`multipart/form-data` POSTs with a `destination` field plus `file-0`, `file-1`, …
Downloads are plain `GET` requests to `downloadFileUrl` (single file) or
`downloadFileUrl?action=downloadMultiple&items[]=...` (zip of multiple items).

> **Note:** the backend currently has `changePermissions` and `extract` disabled
> (see `enabledAction` in `FileManagerController.scala`). The corresponding dialogs are
> implemented in the UI for parity with the legacy frontend, but calling them will
> surface a "not supported" error from the server until the backend re-enables them.
> The file manager is also disabled entirely when the backend runs on Windows.

## Testing

`npm test` runs Vitest specs covering `FileManagerApiService` (list/rename/remove
request shaping, success/error unwrapping, download URL building) and
`FileManagerStoreService` (refresh/navigation, search filtering, selection toggling),
plus the root `App` component smoke test.