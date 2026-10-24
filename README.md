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
npm run build:jakon # stable file names for embedding in Jakon -> dist/jakon-filemanager-jakon (see below)
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

### Embedding in Jakon

Jakon serves this app as a second, "beta" file manager at `/admin/filemanager2`
(`FileManagerV2Controller`), next to the original AngularJS one at `/admin/files`, so
both can be used side by side while this rewrite is being tested. Only the hosting
template differs — the JSON/upload/download API is still served, unchanged, by the
original `FileManagerController` at `/admin/files/*`, since `FILE_MANAGER_API_BASE`
(`/admin/files`) is hardcoded regardless of which page loaded the app.

> **Why not `/admin/files2`?** The legacy `FileManagerController` registers a catch-all
> route `@Get(path = "{method}")` under `/admin/files`, which Javalin resolves as "any
> path segment starting with `files`, with the rest captured as `{method}`". That swallows
> *any* path starting with `/admin/files`, including `/admin/files2` — so the page always
> rendered the old file manager. The beta route must not start with the literal segment
> `files`.

Two things matter for that embedding:

- **Stable file names.** `npm run build:jakon` uses a dedicated "jakon" Angular build
  configuration (`outputHashing: "none"`, `baseHref: "/jakon/filemanager/"`) so the
  Jakon Pebble template can hardcode `main.js`/`styles.css` paths instead of needing to
  regenerate `index.html` on every build. Output goes to
  `dist/jakon-filemanager-jakon/browser/`.
- **CSRF header.** Jakon requires an `X-CSRF-Token` header (or `_csrf` form field) on
  every non-GET `/admin/**` request outside of DEVEL mode, and its file manager
  connector treats even `list` as a POST. The hosting template
  (`fileManagerV2Frame.peb`) renders the session's token into
  `<meta name="csrf-token" content="{{ csrfToken() }}">`, and `csrfInterceptor`
  (`core/interceptors/csrf.interceptor.ts`) reads that tag and attaches it as
  `X-CSRF-Token` on every outgoing request. When no such tag is present (e.g. the
  standalone dev server), the interceptor is a no-op.
- **Initial language.** The hosting template also renders the logged-in Jakon user's
  configured locale into `<meta name="app-locale" content="{{ locale() }}">` (the
  same `locale()`/`i18n()` Pebble functions the rest of the admin UI uses). The
  `I18nService` (`core/services/i18n.service.ts`) reads that tag and uses it ahead of
  any stored/browser-detected language, so the app opens in the same language as the
  Jakon admin profile. Absent when loaded outside of Jakon, falling back to
  `localStorage`/browser language as before.

See the `update-jakon` skill (`.claude/skills/update-jakon/SKILL.md`) for the full
build-and-copy procedure into the Jakon repository.

The page is currently hosted in an `<iframe>` (`fileManagerV2.peb` embeds
`fileManagerV2Frame.peb`), mirroring the legacy setup. This gives free document-level
isolation between Jakon's own Bootstrap/jQuery admin theme and this app's Angular
Material global styles (CSS custom properties, typography resets) and shell (toolbar +
sidenav), which would otherwise bleed into each other if mounted into the same DOM.

**Possible future alternative:** bootstrap the app as an [Angular
Element](https://angular.dev/guide/elements) (custom element) with Shadow DOM instead of
via `bootstrapApplication`. That would give the same style/script isolation without an
iframe, so the app could be mounted directly into a Jakon admin page (no nested
document, no double toolbar/menu chrome). Not done yet — it needs rethinking the
bootstrap entry point, and checking that Angular Material's CDK overlays (dialogs,
snackbar, autocomplete, which portal content outside the host element by default) still
render correctly from inside a shadow root.

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
      csrf.interceptor.ts            – attaches X-CSRF-Token from a <meta> tag (see Embedding in Jakon)
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