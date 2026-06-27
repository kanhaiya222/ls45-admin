/** Mirrors com.ls45.common.response.ApiResponse */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  requestId?: string;
  timestamp?: string;
}

/** Mirrors com.ls45.common.pagination.PageResponse */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/** Mirrors LoginRequest (POST /api/v1/auth/login). */
export interface LoginRequest {
  email: string;
  password: string;
  deviceType?: string;
}

/** Mirrors UserDto in AuthResponse. */
export interface AuthUser {
  publicId: string;
  email: string;
  firstName: string;
  lastName: string;
  status?: string;
  roles?: string[];
  /** Effective permissions (RESOURCE:ACTION:SCOPE) — drives module/sidebar visibility. */
  permissions?: string[];
  lastLoginAt?: string;
}

/** Mirrors AuthResponse (data of POST /api/v1/auth/login). */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export type PackageStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type PackageDifficulty = 'EASY' | 'MODERATE' | 'CHALLENGING';

/** Mirrors CategoryResponse (GET /api/v1/categories). */
export interface Category {
  publicId: string;
  name: string;
  slug: string;
  packageCount?: number;
}

/** Mirrors TagResponse (GET /api/v1/tags). */
export interface Tag {
  publicId: string;
  name: string;
  slug: string;
  type?: string;
}

/** Mirrors CreateCategoryRequest (POST/PUT /api/v1/admin/categories). */
export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  iconCode?: string;
  parentPublicId?: string;
  sortOrder: number;
}

/** Mirrors CreateTagRequest (POST/PUT /api/v1/admin/tags). type: WELLNESS_THEME|AUDIENCE_TYPE|GENERAL. */
export interface CreateTagPayload {
  name: string;
  slug?: string;
  type: string;
}

/** Mirrors FaqResponse (GET /api/v1/admin/packages/{id}/faqs). */
export interface Faq {
  publicId?: string;
  question: string;
  answer: string;
  sortOrder?: number;
  published?: boolean;
}

/** Mirrors CreateFaqRequest. */
export interface CreateFaqPayload {
  question: string;
  answer: string;
  sortOrder: number;
  published: boolean;
}

/** Mirrors PackageMediaResponse. */
export interface PackageMedia {
  publicId: string;
  mediaType?: string;
  url: string;
  altText?: string;
  sortOrder: number;
  primary: boolean;
}

/** Mirrors AddMediaRequest. */
export interface AddMediaPayload {
  url: string;
  altText?: string;
  mediaType?: string;
  sortOrder: number;
  primary: boolean;
}

/** Mirrors PackageDetailResponse (GET /api/v1/admin/packages/{id}). */
export interface PackageDetail {
  publicId: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  basePrice?: number;
  durationDays: number;
  durationNights: number;
  maxGroupSize?: number;
  minGroupSize?: number;
  difficulty?: PackageDifficulty;
  status?: PackageStatus;
  meetingLocation?: string;
  endLocation?: string;
  featured: boolean;
  categoryPublicId?: string;
  tagPublicIds?: string[];
  inclusions?: string[];
  exclusions?: string[];
  highlights?: string[];
  metaTitle?: string;
  metaDescription?: string;
  media?: PackageMedia[];
}

/** Mirrors CreatePackageRequest (POST/PUT /api/v1/admin/packages[/{id}]). */
export interface CreatePackagePayload {
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  categoryPublicId: string;
  tagPublicIds?: string[];
  durationDays: number;
  durationNights: number;
  maxGroupSize: number;
  minGroupSize: number;
  difficulty?: PackageDifficulty;
  meetingLocation?: string;
  endLocation?: string;
  basePrice: number;
  featured: boolean;
  inclusions?: string[];
  exclusions?: string[];
  highlights?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

/** Mirrors PackageListResponse (GET /api/v1/admin/packages). */
export interface PackageListItem {
  publicId: string;
  name: string;
  slug: string;
  shortDescription?: string;
  heroImageUrl?: string;
  thumbnailUrl?: string;
  basePrice?: number;
  currency?: string;
  durationDays: number;
  durationNights: number;
  difficulty?: string;
  featured: boolean;
  status: PackageStatus;
  categoryPublicId?: string;
  categoryName?: string;
}

/** Mirrors BookingItemResponse. */
export interface BookingItem {
  publicId: string;
  itemType: string;
  name: string;
  unitPrice?: number;
  quantity: number;
  totalPrice?: number;
}

/** Mirrors PaymentRecordResponse. */
export interface PaymentRecord {
  publicId: string;
  amount?: number;
  currencyCode?: string;
  status: string;
  gateway?: string;
  gatewayReference?: string;
  capturedAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  createdAt?: string;
}

/** Mirrors BookingResponse (GET /api/v1/admin/bookings). */
export interface Booking {
  publicId: string;
  bookingReference: string;
  departureId: number;
  status: string;
  occupancyType: string;
  numTravellers: number;
  basePrice?: number;
  addonTotal?: number;
  taxAmount?: number;
  totalPrice?: number;
  currencyCode?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  items?: BookingItem[];
  createdAt?: string;
}

export type CmsPageStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/** Mirrors CmsPageListResponse (GET /api/v1/admin/cms/pages). */
export interface CmsPageListItem {
  publicId: string;
  title: string;
  slug: string;
  status: CmsPageStatus;
  updatedAt?: string;
}

/** Mirrors CmsPageResponse (GET /api/v1/admin/cms/pages/{id}). */
export interface CmsPageDetail {
  publicId: string;
  title: string;
  slug?: string;
  body?: string;
  status?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
}

/** Mirrors CreateCmsPageRequest (POST/PUT /api/v1/admin/cms/pages[/{id}]). */
export interface CreateCmsPagePayload {
  title: string;
  slug?: string;
  body?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
}

export type BlogPostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/** Mirrors BlogCategoryResponse (GET /api/v1/admin/blog/categories). */
export interface BlogCategory {
  publicId: string;
  name: string;
  slug: string;
  description?: string;
}

/** Mirrors CreateBlogCategoryRequest (POST/PUT /api/v1/admin/blog/categories). */
export interface CreateBlogCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
}

/** Mirrors BlogPostListResponse (GET /api/v1/admin/blog/posts). */
export interface BlogPostListItem {
  publicId: string;
  title: string;
  slug: string;
  excerpt?: string;
  heroImageUrl?: string;
  authorName?: string;
  status: BlogPostStatus;
  publishedAt?: string;
  categoryPublicId?: string;
  categoryName?: string;
}

/** Mirrors BlogPostDetailResponse (GET /api/v1/admin/blog/posts/{id}). */
export interface BlogPostDetail {
  publicId: string;
  title: string;
  slug?: string;
  excerpt?: string;
  body?: string;
  heroImageUrl?: string;
  authorName?: string;
  status?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  categoryPublicId?: string;
  categoryName?: string;
}

/** Mirrors CreateBlogPostRequest (POST/PUT /api/v1/admin/blog/posts[/{id}]). */
export interface CreateBlogPostPayload {
  categoryPublicId?: string;
  title: string;
  slug?: string;
  excerpt?: string;
  body?: string;
  heroImageUrl?: string;
  authorName?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
}

export type DepartureStatus = 'OPEN' | 'WAITLIST_ONLY' | 'CLOSED' | 'CANCELLED' | 'COMPLETED';
export type OccupancyType = 'SINGLE' | 'DOUBLE_SHARING' | 'TRIPLE_SHARING' | 'QUAD_SHARING';

export interface DeparturePricing {
  occupancyType: string;
  price: number;
  currency?: string;
  active?: boolean;
}

/** Mirrors DepartureSummaryResponse (GET /api/v1/admin/departures?packagePublicId=). */
export interface DepartureSummary {
  publicId: string;
  packagePublicId: string;
  startDate: string;
  endDate: string;
  status: DepartureStatus;
  totalCapacity: number;
  availableSeats: number;
  soldOut: boolean;
  bookingCutoffDate?: string;
  pricing?: DeparturePricing[];
}

/** Mirrors ManifestPassengerResponse (GET /api/v1/admin/departures/{id}/manifest). */
export interface ManifestPassenger {
  bookingReference?: string;
  travellerPublicId?: string;
  lead: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string;
  dietaryPreferences?: string;
  seatReference?: string;
}

/** Mirrors WaitlistEntryResponse (GET /api/v1/admin/departures/{id}/waitlist). */
export interface WaitlistEntry {
  publicId: string;
  departureId: number;
  occupancyType: string;
  numTravellers: number;
  status: string;
  notifiedAt?: string;
  expiresAt?: string;
  createdAt?: string;
}

/** Mirrors CreateDepartureRequest (POST /api/v1/admin/departures). */
export interface CreateDeparturePayload {
  packagePublicId: string;
  startDate: string;
  endDate: string;
  bookingCutoffDate: string;
  totalCapacity: number;
  specialNotes?: string;
  pricing: { occupancyType: OccupancyType; price: number }[];
}

/** Mirrors BookingStatsResponse (GET /api/v1/admin/reports/bookings/stats). */
export interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  byStatus?: Record<string, number>;
}

/** Mirrors RevenueReportResponse (GET /api/v1/admin/reports/revenue). */
export interface RevenueReport {
  periodStart: string;
  periodEnd: string;
  grossRevenue: number;
  taxCollected: number;
  netRevenue: number;
  totalRefunds: number;
  confirmedBookingCount: number;
}

export interface PaymentStatusSummary {
  status: string;
  count: number;
  amount: number;
}

/** Mirrors PaymentSummaryResponse (GET /api/v1/admin/reports/payment-summary). */
export interface PaymentSummary {
  periodStart: string;
  periodEnd: string;
  totalTransactions: number;
  totalAmount: number;
  byStatus: PaymentStatusSummary[];
}

/** Mirrors CustomerRegistrationReportResponse (GET .../reports/customer-registrations). */
export interface CustomerRegistrationReport {
  periodStart: string;
  periodEnd: string;
  totalCustomers: number;
  newRegistrations: number;
}

/** Mirrors CustomerActivityResponse (GET .../reports/customer-activity). */
export interface CustomerActivity {
  periodStart: string;
  periodEnd: string;
  totalCustomers: number;
  activeCustomers: number;
  repeatCustomers: number;
}

/** Mirrors PackagePerformanceResponse (GET .../reports/package-performance). */
export interface PackagePerformance {
  packagePublicId: string;
  packageName: string;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  confirmedRevenue: number;
}

// ── Team & Access (users / roles / permissions) ──────────────────────────────

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

/** Mirrors AdminUserResponse (GET /api/v1/admin/users). */
export interface AdminUser {
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: string;
  roles: string[];
  createdAt?: string;
  lastLoginAt?: string;
}

/** Body for POST /api/v1/admin/users (CreateStaffUserRequest). */
export interface CreateStaffUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/** Mirrors RoleResponse (GET /api/v1/admin/roles). `system` roles are locked (no edit/delete). */
export interface Role {
  publicId: string;
  name: string;
  description?: string;
  permissionCodes: string[];
  system: boolean;
}

/** Body for POST/PUT /api/v1/admin/roles (CreateRoleRequest). */
export interface CreateRolePayload {
  name: string;
  description?: string;
  permissionCodes: string[];
}

/** Mirrors PermissionResponse (GET /api/v1/admin/permissions). code = RESOURCE:ACTION:SCOPE. */
export interface Permission {
  code: string;
  resource: string;
  action: string;
  scope: string;
  description?: string;
}
