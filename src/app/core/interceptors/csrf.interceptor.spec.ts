import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { csrfInterceptor } from './csrf.interceptor';

describe('csrfInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([csrfInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock.verify();
    document.head.querySelectorAll('meta[name="csrf-token"]').forEach((el) => el.remove());
  });

  it('attaches the X-CSRF-Token header when a csrf-token meta tag is present', async () => {
    const meta = document.createElement('meta');
    meta.name = 'csrf-token';
    meta.content = 'test-token-123';
    document.head.appendChild(meta);
    setup();

    const promise = firstValueFrom(http.post('/admin/files/listUrl', {}));
    const req = httpMock.expectOne('/admin/files/listUrl');
    expect(req.request.headers.get('X-CSRF-Token')).toBe('test-token-123');
    req.flush({});
    await promise;
  });

  it('leaves the request untouched when no csrf-token meta tag exists', async () => {
    setup();

    const promise = firstValueFrom(http.post('/admin/files/listUrl', {}));
    const req = httpMock.expectOne('/admin/files/listUrl');
    expect(req.request.headers.has('X-CSRF-Token')).toBe(false);
    req.flush({});
    await promise;
  });
});
