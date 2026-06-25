/**
 * Production environment. apiBaseUrl is RELATIVE, assuming the admin SPA is served behind a reverse
 * proxy that routes `/api` to the backend (same origin). If the admin is hosted on a separate origin
 * from the API, set this to the API's absolute base URL at deploy time.
 */
export const environment = {
  production: true,
  apiBaseUrl: '/api/v1',
};
