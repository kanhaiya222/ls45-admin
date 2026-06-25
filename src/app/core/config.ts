import { environment } from '../../environments/environment';

/**
 * API base URL for the LS45 backend (Spring Boot, /api/v1). Resolved from the active Angular
 * environment. The admin portal is a pure SPA (no SSR); dev talks to :8080 directly, prod uses a
 * relative, reverse-proxied base (see src/environments/*).
 */
export const API_BASE_URL = environment.apiBaseUrl;
