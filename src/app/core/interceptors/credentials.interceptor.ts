import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Ensures every request to the file manager connector API carries the Jakon
 * admin session cookie. The backend is a session-authenticated admin pagelet,
 * not a token API, so credentials must be included on every call.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};
