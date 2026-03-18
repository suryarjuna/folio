import { useState, useEffect, useCallback } from 'react';
import { Coupon, SortOrder } from '../constants/types';
import * as db from '../db/database';

export function useActiveCoupons(sortOrder: SortOrder) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getActiveCoupons(sortOrder);
      setCoupons(data);
    } catch (e) {
      console.error('Failed to load coupons:', e);
    } finally {
      setLoading(false);
    }
  }, [sortOrder]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { coupons, loading, refresh };
}

export function useArchivedCoupons(status: 'used' | 'expired') {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getArchivedCoupons(status);
      setCoupons(data);
    } catch (e) {
      console.error('Failed to load archived coupons:', e);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { coupons, loading, refresh };
}
