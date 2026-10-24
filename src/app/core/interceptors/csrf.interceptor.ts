import { HttpInterceptorFn } from '@angular/common/http';

const CSRF_META_SELECTOR = 'meta[name="csrf-token"]';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Attaches the Jakon admin CSRF token as the `X-CSRF-Token` header on every request.
 *
 * The token is rendered server-side into a `<meta name="csrf-token">` tag by the hosting
 * Pebble template (`fileManagerV2Frame.peb`, via `{{ csrfToken() }}`). Jakon's
 * `CsrfProtection` rejects every non-GET `/admin/**` request without a matching token once
 * the backend is not running in DEVEL mode - and the connector API treats even `list` as a
 * POST, so the header has to be sent on essentially every call.
 *
 * Absent when the app is loaded outside of Jakon (e.g. the standalone dev server), in which
 * case the request is left untouched.
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const token = document.querySelector(CSRF_META_SELECTOR)?.getAttribute('content');
  if (!token) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { [CSRF_HEADER_NAME]: token } }));
};
