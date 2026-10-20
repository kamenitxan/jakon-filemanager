// Dev-server proxy for `npm start` (see angular.json -> serve.options.proxyConfig).
// Forwards the connector API calls to the real Jakon admin backend so `ng serve`
// can talk to `/admin/files/*` without CORS issues. Override the target with the
// FM_BACKEND_TARGET environment variable if your backend runs elsewhere.
const target = process.env['FM_BACKEND_TARGET'] || 'http://192.168.5.70:4569';

module.exports = {
  '/admin/files/**': {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
  },
};
