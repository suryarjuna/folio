import { Paths, File, Directory } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const IMAGES_DIR_NAME = 'coupon-images';

function getImagesDir(): Directory {
  return new Directory(Paths.document, IMAGES_DIR_NAME);
}

function ensureDirectory(): void {
  const dir = getImagesDir();
  if (!dir.exists) {
    dir.create();
  }
}

/**
 * Save a coupon image and generate a thumbnail.
 * Returns { imageUri, thumbnailUri }.
 */
export async function saveCouponImage(
  sourceUri: string,
  couponId: string
): Promise<{ imageUri: string; thumbnailUri: string }> {
  ensureDirectory();

  const dir = getImagesDir();
  const imageFile = new File(dir, `${couponId}.jpg`);
  const thumbFile = new File(dir, `${couponId}_thumb.jpg`);

  // Copy full image — overwrite if exists
  const source = new File(sourceUri);
  if (imageFile.exists) imageFile.delete();
  source.copy(imageFile);

  // Generate thumbnail
  const thumb = await manipulateAsync(
    sourceUri,
    [{ resize: { width: 200 } }],
    { compress: 0.7, format: SaveFormat.JPEG }
  );
  const thumbSource = new File(thumb.uri);
  if (thumbFile.exists) thumbFile.delete();
  thumbSource.copy(thumbFile);

  return {
    imageUri: imageFile.uri,
    thumbnailUri: thumbFile.uri,
  };
}

/**
 * Delete a coupon's images.
 */
export function deleteCouponImage(couponId: string): void {
  const dir = getImagesDir();
  const imageFile = new File(dir, `${couponId}.jpg`);
  const thumbFile = new File(dir, `${couponId}_thumb.jpg`);

  try {
    if (imageFile.exists) imageFile.delete();
    if (thumbFile.exists) thumbFile.delete();
  } catch {
    // Silently ignore deletion failures — files may already be cleaned up
  }
}
