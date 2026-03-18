import * as SQLite from 'expo-sqlite';
import { Coupon, CouponStatus, SortOrder } from '../constants/types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('folio.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY NOT NULL,
      companyName TEXT NOT NULL,
      couponImageUri TEXT,
      thumbnailUri TEXT,
      code TEXT,
      discountDescription TEXT NOT NULL DEFAULT '',
      discountValue REAL,
      discountType TEXT NOT NULL DEFAULT 'other',
      expiryDate TEXT,
      minimumPurchase REAL,
      categories TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      isFavorite INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      archivedDate TEXT,
      usedDate TEXT,
      barcodeValue TEXT,
      barcodeType TEXT,
      websiteURL TEXT,
      terms TEXT,
      createdAt TEXT NOT NULL
    );
  `);
  return db;
}

export async function insertCoupon(coupon: Coupon): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO coupons (
      id, companyName, couponImageUri, thumbnailUri, code,
      discountDescription, discountValue, discountType, expiryDate,
      minimumPurchase, categories, notes, source, isFavorite, status,
      archivedDate, usedDate, barcodeValue, barcodeType, websiteURL,
      terms, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    coupon.id,
    coupon.companyName,
    coupon.couponImageUri,
    coupon.thumbnailUri,
    coupon.code,
    coupon.discountDescription,
    coupon.discountValue,
    coupon.discountType,
    coupon.expiryDate,
    coupon.minimumPurchase,
    coupon.categories,
    coupon.notes,
    coupon.source,
    coupon.isFavorite,
    coupon.status,
    coupon.archivedDate,
    coupon.usedDate,
    coupon.barcodeValue,
    coupon.barcodeType,
    coupon.websiteURL,
    coupon.terms,
    coupon.createdAt
  );
}

export async function updateCoupon(coupon: Coupon): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE coupons SET
      companyName = ?, couponImageUri = ?, thumbnailUri = ?, code = ?,
      discountDescription = ?, discountValue = ?, discountType = ?,
      expiryDate = ?, minimumPurchase = ?, categories = ?, notes = ?,
      source = ?, isFavorite = ?, status = ?, archivedDate = ?,
      usedDate = ?, barcodeValue = ?, barcodeType = ?, websiteURL = ?,
      terms = ?
    WHERE id = ?`,
    coupon.companyName,
    coupon.couponImageUri,
    coupon.thumbnailUri,
    coupon.code,
    coupon.discountDescription,
    coupon.discountValue,
    coupon.discountType,
    coupon.expiryDate,
    coupon.minimumPurchase,
    coupon.categories,
    coupon.notes,
    coupon.source,
    coupon.isFavorite,
    coupon.status,
    coupon.archivedDate,
    coupon.usedDate,
    coupon.barcodeValue,
    coupon.barcodeType,
    coupon.websiteURL,
    coupon.terms,
    coupon.id
  );
}

export async function deleteCoupon(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM coupons WHERE id = ?', id);
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<Coupon>(
    'SELECT * FROM coupons WHERE id = ?',
    id
  );
  return result ?? null;
}

export async function getActiveCoupons(sortOrder: SortOrder): Promise<Coupon[]> {
  const database = await getDatabase();
  let orderClause: string;
  switch (sortOrder) {
    case 'companyAZ':
      orderClause = 'companyName COLLATE NOCASE ASC';
      break;
    case 'companyZA':
      orderClause = 'companyName COLLATE NOCASE DESC';
      break;
    case 'expiryAscending':
      orderClause = "CASE WHEN expiryDate IS NULL THEN 1 ELSE 0 END, expiryDate ASC";
      break;
    case 'expiryDescending':
      orderClause = "CASE WHEN expiryDate IS NULL THEN 1 ELSE 0 END, expiryDate DESC";
      break;
    case 'newest':
      orderClause = 'createdAt DESC';
      break;
    case 'oldest':
      orderClause = 'createdAt ASC';
      break;
    case 'discountHighest':
      orderClause = 'COALESCE(discountValue, 0) DESC';
      break;
    default:
      orderClause = 'createdAt DESC';
  }
  return database.getAllAsync<Coupon>(
    `SELECT * FROM coupons WHERE status = 'active' ORDER BY ${orderClause}`
  );
}

export async function getArchivedCoupons(status: 'used' | 'expired'): Promise<Coupon[]> {
  const database = await getDatabase();
  return database.getAllAsync<Coupon>(
    'SELECT * FROM coupons WHERE status = ? ORDER BY archivedDate DESC',
    status
  );
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE coupons SET isFavorite = ? WHERE id = ?',
    isFavorite ? 1 : 0,
    id
  );
}

export async function markAsUsed(id: string): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync(
    "UPDATE coupons SET status = 'used', usedDate = ?, archivedDate = ? WHERE id = ?",
    now,
    now,
    id
  );
}

export async function archiveCoupon(id: string): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync(
    "UPDATE coupons SET status = 'expired', archivedDate = ? WHERE id = ?",
    now,
    id
  );
}

export async function restoreCoupon(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE coupons SET status = 'active', archivedDate = NULL, usedDate = NULL WHERE id = ?",
    id
  );
}

export async function clearExpiredCoupons(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM coupons WHERE status = 'expired'");
}

export async function autoArchiveExpired(): Promise<number> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const result = await database.runAsync(
    "UPDATE coupons SET status = 'expired', archivedDate = ? WHERE status = 'active' AND expiryDate IS NOT NULL AND expiryDate < ?",
    now,
    now
  );
  return result.changes;
}
