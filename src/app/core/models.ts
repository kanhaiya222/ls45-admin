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

/** Mirrors TaggedProductResponse — a Shop product cross-sold on a package ("Shop this journey"). */
export interface TaggedProduct {
  publicId: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  heroImageUrl?: string;
  thumbnailUrl?: string;
  basePrice?: number;
  currencyCode?: string;
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
  taggedProducts?: TaggedProduct[];
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

// ── Commerce: products (the "Shop") ──────────────────────────────────────────

/** Backend enum is DRAFT | ACTIVE | ARCHIVED — "published" products are ACTIVE. */
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

/** Mirrors ProductListResponse (GET /api/v1/admin/products). */
export interface ProductListItem {
  publicId: string;
  name: string;
  slug: string;
  sku: string;
  status: ProductStatus;
  productType?: string;
  basePrice?: number;
  currencyCode?: string;
  thumbnailUrl?: string;
  featured: boolean;
}

/** Mirrors ProductVariantResponse. */
export interface ProductVariant {
  publicId: string;
  sku: string;
  variantName: string;
  attributes?: string;
  priceOverride?: number;
  effectivePrice?: number;
  weightGrams?: number;
  sortOrder: number;
  active: boolean;
}

/** Mirrors ProductMediaResponse. */
export interface ProductMedia {
  publicId: string;
  mediaType?: string;
  url: string;
  altText?: string;
  sortOrder: number;
  primary: boolean;
}

/** Mirrors ProductDetailResponse (GET /api/v1/admin/products/{id}). */
export interface ProductDetail {
  publicId: string;
  name: string;
  slug?: string;
  sku: string;
  status?: ProductStatus;
  productType?: string;
  shortDescription?: string;
  description?: string;
  basePrice?: number;
  currencyCode?: string;
  heroImageUrl?: string;
  thumbnailUrl?: string;
  weightGrams?: number;
  featured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  publishedAt?: string;
  variants?: ProductVariant[];
  media?: ProductMedia[];
}

/** Mirrors CreateProductRequest (POST/PUT /api/v1/admin/products[/{id}]). */
export interface CreateProductPayload {
  name: string;
  slug?: string;
  sku: string;
  productType?: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  currencyCode?: string;
  heroImageUrl?: string;
  thumbnailUrl?: string;
  weightGrams: number;
  featured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
}

/** Mirrors AddProductVariantRequest (POST /api/v1/admin/products/{id}/variants). */
export interface AddProductVariantPayload {
  sku: string;
  variantName: string;
  attributes?: string;
  priceOverride?: number;
  weightGrams?: number;
  sortOrder: number;
  active: boolean;
}

// ── Commerce: product collections ────────────────────────────────────────────

export type CollectionStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

/** Mirrors CollectionListResponse (GET /api/v1/admin/product-collections). */
export interface AdminCollectionListItem {
  publicId: string;
  name: string;
  slug: string;
  status: CollectionStatus;
  sortOrder: number;
  thumbnailUrl?: string;
}

/** Mirrors CollectionDetailResponse. products[] reuses ProductListItem shape. */
export interface AdminCollectionDetail {
  publicId: string;
  name: string;
  slug?: string;
  description?: string;
  status?: CollectionStatus;
  sortOrder: number;
  heroImageUrl?: string;
  thumbnailUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  products?: ProductListItem[];
}

/** Body for POST/PUT /admin/product-collections (CreateCollectionRequest). */
export interface CreateCollectionPayload {
  name: string;
  slug?: string;
  description?: string;
  sortOrder: number;
  heroImageUrl?: string;
  thumbnailUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
}

// ── Commerce: coupons (campaign-scoped) ──────────────────────────────────────

export type CouponStatus = 'ACTIVE' | 'INACTIVE';
export type DiscountType = 'PERCENT' | 'FIXED';

/** Mirrors CouponCampaignResponse. */
export interface CouponCampaign {
  publicId: string;
  campaignName: string;
  startsAt?: string;
  endsAt?: string;
  maxTotalUses?: number;
  maxPerUser: number;
  status?: string;
}

/** Body for POST /admin/coupon-campaigns. */
export interface CreateCampaignPayload {
  campaignName: string;
  startsAt: string;
  endsAt: string;
  maxTotalUses?: number;
  maxPerUser: number;
}

/** Mirrors CouponResponse. */
export interface AdminCoupon {
  publicId: string;
  campaignPublicId?: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  status: CouponStatus;
}

/** Body for POST /admin/coupon-campaigns/{id}/coupons. */
export interface CreateCouponPayload {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
}

// ── Commerce: product reviews (moderation) ───────────────────────────────────

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Mirrors ReviewResponse (GET /api/v1/admin/reviews). */
export interface AdminReview {
  publicId: string;
  productPublicId: string;
  rating: number;
  title?: string;
  body?: string;
  status: ReviewStatus;
  createdAt?: string;
  moderatedAt?: string;
}

// ── Commerce: orders, fulfillment, returns (Shop operations) ──────────────────

export type OrderStatus =
  | 'PENDING_PAYMENT' | 'CONFIRMED' | 'FULFILLING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type ShipmentStatus = 'PENDING' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';

/** Mirrors OrderListResponse (GET /api/v1/admin/orders). */
export interface AdminOrderListItem {
  publicId: string;
  orderNumber: string;
  status: OrderStatus;
  grandTotal: number;
  currencyCode?: string;
  placedAt?: string;
  itemCount: number;
}

/** Mirrors OrderItemResponse. */
export interface AdminOrderItem {
  publicId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

/** Mirrors OrderStatusHistoryResponse. */
export interface OrderStatusHistory {
  fromStatus?: string;
  toStatus: string;
  note?: string;
  createdAt?: string;
}

/** Mirrors OrderResponse (GET /api/v1/admin/orders/{id}). */
export interface AdminOrder {
  publicId: string;
  orderNumber: string;
  status: OrderStatus;
  currencyCode?: string;
  itemSubtotal: number;
  shippingTotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  shippingMethodName?: string;
  shipName?: string;
  shipPhone?: string;
  shipLine1?: string;
  shipLine2?: string;
  shipCity?: string;
  shipState?: string;
  shipPostalCode?: string;
  shipCountry?: string;
  placedAt?: string;
  items?: AdminOrderItem[];
  history?: OrderStatusHistory[];
}

/** Mirrors ShipmentItemResponse. */
export interface ShipmentItem {
  publicId: string;
  orderItemPublicId: string;
  name: string;
  quantity: number;
}

/** Mirrors ShipmentResponse. */
export interface Shipment {
  publicId: string;
  orderPublicId: string;
  status: ShipmentStatus;
  carrier?: string;
  trackingNumber?: string;
  fulfillmentLocationPublicId?: string;
  shippedAt?: string;
  deliveredAt?: string;
  items?: ShipmentItem[];
}

/** Body for POST .../shipments (CreateShipmentRequest). Empty items = ship all remaining. */
export interface CreateShipmentPayload {
  fulfillmentLocationPublicId?: string;
  carrier?: string;
  trackingNumber?: string;
  items?: { orderItemPublicId: string; quantity: number }[];
}

/** Body for PATCH .../shipments/{id}/status (UpdateShipmentStatusRequest). */
export interface UpdateShipmentStatusPayload {
  status: ShipmentStatus;
  trackingNumber?: string;
  carrier?: string;
}

/** Mirrors FulfillmentLocationResponse (GET /api/v1/admin/fulfillment/locations). */
export interface FulfillmentLocation {
  publicId: string;
  name: string;
  code: string;
  city?: string;
  country?: string;
  active: boolean;
}

/** Mirrors ReturnItemResponse. */
export interface ReturnItem {
  publicId: string;
  orderItemPublicId: string;
  name: string;
  quantity: number;
  restock: boolean;
}

/** Mirrors ReturnResponse (GET /api/v1/admin/returns). */
export interface ReturnRequest {
  publicId: string;
  orderPublicId: string;
  status: ReturnStatus;
  reason?: string;
  refundAmount?: number;
  requestedAt?: string;
  resolvedAt?: string;
  items?: ReturnItem[];
}

// ── Commerce: shipping + inventory config (Shop setup) ───────────────────────

/** Mirrors ShippingZoneResponse (GET /api/v1/admin/shipping/zones). */
export interface ShippingZone {
  publicId: string;
  name: string;
  code: string;
  countryCodes: string[];
  active: boolean;
}

/** Body for POST/PUT /admin/shipping/zones. */
export interface CreateShippingZonePayload {
  name: string;
  code: string;
  countryCodes: string[];
  active: boolean;
}

/** Mirrors ShippingMethodResponse. */
export interface ShippingMethod {
  publicId: string;
  name: string;
  carrier?: string;
  code: string;
  active: boolean;
  sortOrder: number;
}

/** Body for POST/PUT /admin/shipping/methods. */
export interface CreateShippingMethodPayload {
  name: string;
  carrier?: string;
  code: string;
  active: boolean;
  sortOrder: number;
}

/** Mirrors ShippingRateResponse. */
export interface ShippingRate {
  publicId: string;
  zonePublicId: string;
  methodPublicId: string;
  methodName?: string;
  minOrderAmount?: number;
  maxWeightGrams?: number;
  price?: number;
  freeOverAmount?: number;
  active: boolean;
}

/** Body for POST/PUT /admin/shipping/rates. */
export interface CreateShippingRatePayload {
  zonePublicId: string;
  methodPublicId: string;
  minOrderAmount?: number;
  maxWeightGrams?: number;
  price?: number;
  freeOverAmount?: number;
  active: boolean;
}

/** Mirrors WarehouseResponse (GET /api/v1/admin/warehouses). */
export interface Warehouse {
  publicId: string;
  name: string;
  code: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  active: boolean;
}

/** Body for POST/PUT /admin/warehouses. */
export interface CreateWarehousePayload {
  name: string;
  code: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/** Mirrors StockLevelResponse. */
export interface StockLevel {
  publicId: string;
  warehousePublicId: string;
  variantPublicId: string;
  onHandQty: number;
  reservedQty: number;
  availableQty: number;
  reorderLevel: number;
}

/** Body for POST /admin/stock/adjust. movementType: INBOUND|OUTBOUND|ADJUSTMENT. */
export interface AdjustStockPayload {
  warehousePublicId: string;
  variantPublicId: string;
  quantityDelta: number;
  movementType: string;
  reason?: string;
  reference?: string;
}

/** Mirrors StockMovementResponse. */
export interface StockMovement {
  publicId: string;
  movementType: string;
  quantityDelta: number;
  balanceAfter: number;
  reason?: string;
  reference?: string;
  createdAt?: string;
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

/** Mirrors BrandingDto (GET /app/config.branding, GET/PUT /api/v1/admin/settings). */
export interface Branding {
  siteName: string;
  tagline?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  timezone: string;
  currencyCode: string;
  dateFormat: string;
  supportEmail?: string | null;
  supportPhone?: string | null;
  socialLinks?: Record<string, string>;
}
