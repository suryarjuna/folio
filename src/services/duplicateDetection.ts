import * as db from '../db/database';
import { Coupon } from '../constants/types';

export interface DuplicateResult {
  isDuplicate: boolean;
  existingCoupon: Coupon | null;
}

/**
 * Check if a coupon with the same company name AND (same code OR same expiry date)
 * already exists among active coupons.
 */
export async function checkForDuplicate(
  companyName: string,
  code: string | null,
  expiryDate: string | null
): Promise<DuplicateResult> {
  const activeCoupons = await db.getActiveCoupons('newest');

  const match = activeCoupons.find((c) => {
    if (c.companyName.toLowerCase() !== companyName.toLowerCase()) return false;
    const sameCode = code && c.code && c.code.toLowerCase() === code.toLowerCase();
    const sameExpiry = expiryDate && c.expiryDate && c.expiryDate === expiryDate;
    return sameCode || sameExpiry;
  });

  return {
    isDuplicate: !!match,
    existingCoupon: match ?? null,
  };
}
