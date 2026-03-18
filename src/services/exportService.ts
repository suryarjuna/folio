import { Paths, File, Directory } from 'expo-file-system';
import { Share } from 'react-native';
import * as db from '../db/database';
import { Coupon } from '../constants/types';

/**
 * Export all coupons as JSON and present the share sheet.
 */
export async function exportAllCoupons(): Promise<void> {
  const database = await db.getDatabase();
  const allCoupons = await database.getAllAsync<Coupon>(
    'SELECT * FROM coupons ORDER BY createdAt DESC'
  );

  // Strip image URIs for portability
  const exportData = allCoupons.map((c) => ({
    id: c.id,
    companyName: c.companyName,
    code: c.code,
    discountDescription: c.discountDescription,
    discountValue: c.discountValue,
    discountType: c.discountType,
    expiryDate: c.expiryDate,
    minimumPurchase: c.minimumPurchase,
    categories: c.categories,
    notes: c.notes,
    source: c.source,
    isFavorite: c.isFavorite,
    status: c.status,
    archivedDate: c.archivedDate,
    usedDate: c.usedDate,
    barcodeValue: c.barcodeValue,
    websiteURL: c.websiteURL,
    terms: c.terms,
    createdAt: c.createdAt,
  }));

  const json = JSON.stringify(exportData, null, 2);

  // Write to temp file
  const tempDir = new Directory(Paths.cache, 'exports');
  if (!tempDir.exists) {
    tempDir.create();
  }

  const exportFile = new File(tempDir, 'folio-coupons.json');
  if (exportFile.exists) exportFile.delete();
  exportFile.write(json);

  await Share.share({
    message: json,
    title: 'Folio Coupons Export',
  });
}
