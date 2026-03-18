export type DiscountType = 'percentage' | 'fixedAmount' | 'bogo' | 'freeShipping' | 'other';
export type CouponSource = 'camera' | 'photoLibrary' | 'shareExtension' | 'manual';
export type CouponStatus = 'active' | 'used' | 'expired';
export type SortOrder =
  | 'companyAZ'
  | 'companyZA'
  | 'expiryAscending'
  | 'expiryDescending'
  | 'newest'
  | 'oldest'
  | 'discountHighest';

export interface Coupon {
  id: string;
  companyName: string;
  couponImageUri: string | null;
  thumbnailUri: string | null;
  code: string | null;
  discountDescription: string;
  discountValue: number | null;
  discountType: DiscountType;
  expiryDate: string | null; // ISO string
  minimumPurchase: number | null;
  categories: string; // JSON array string
  notes: string | null;
  source: CouponSource;
  isFavorite: number; // 0 or 1 for SQLite
  status: CouponStatus;
  archivedDate: string | null;
  usedDate: string | null;
  barcodeValue: string | null;
  barcodeType: string | null;
  websiteURL: string | null;
  terms: string | null;
  createdAt: string;
}

export const DiscountTypeLabels: Record<DiscountType, string> = {
  percentage: '% Off',
  fixedAmount: '$ Off',
  bogo: 'Buy One Get One',
  freeShipping: 'Free Shipping',
  other: 'Other',
};

export const SortOrderLabels: Record<SortOrder, string> = {
  companyAZ: 'Company A-Z',
  companyZA: 'Company Z-A',
  expiryAscending: 'Expiry (Soonest)',
  expiryDescending: 'Expiry (Latest)',
  newest: 'Newest First',
  oldest: 'Oldest First',
  discountHighest: 'Highest Discount',
};
