import MlkitOcr, { MlkitOcrResult } from 'react-native-mlkit-ocr';
import { DiscountType } from '../constants/types';

export interface ExtractionResult {
  companyName: string | null;
  code: string | null;
  expiryDate: Date | null;
  discountDescription: string | null;
  discountValue: number | null;
  discountType: DiscountType;
  minimumPurchase: number | null;
  websiteURL: string | null;
  terms: string | null;
  confidence: number;
}

interface TextBlock {
  text: string;
  top: number;
  height: number;
}

/**
 * Run OCR on an image and extract coupon data.
 */
export async function recognizeAndExtract(imageUri: string): Promise<ExtractionResult> {
  const blocks: MlkitOcrResult = await MlkitOcr.detectFromUri(imageUri);

  const textBlocks: TextBlock[] = blocks.map((b) => ({
    text: b.text,
    top: b.bounding?.top ?? 0,
    height: b.bounding?.height ?? 0,
  }));

  const lines = textBlocks.map((b) => b.text.trim()).filter(Boolean);
  return extractCouponData(lines, textBlocks);
}

function extractCouponData(lines: string[], blocks: TextBlock[]): ExtractionResult {
  const fullText = lines.join('\n');

  const companyName = extractCompanyName(blocks, lines);
  const code = extractPromoCode(fullText);
  const expiryDate = extractExpiryDate(fullText);
  const discount = extractDiscount(fullText);
  const minimumPurchase = extractMinimumPurchase(fullText);
  const websiteURL = extractWebsite(fullText);
  const terms = extractTerms(fullText);

  // Confidence scoring
  let confidence = 0.5;
  if (companyName) confidence += 0.2;
  if (code) confidence += 0.15;
  if (expiryDate) confidence += 0.15;
  if (discount.value !== null) confidence += 0.1;
  confidence = Math.min(1, Math.max(0, confidence));

  return {
    companyName,
    code,
    expiryDate,
    discountDescription: discount.description,
    discountValue: discount.value,
    discountType: discount.type,
    minimumPurchase,
    websiteURL,
    terms,
    confidence,
  };
}

function extractCompanyName(blocks: TextBlock[], lines: string[]): string | null {
  const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/;
  const codePattern = /^[A-Z0-9]{4,20}$/;
  const percentPattern = /\d+\s*%/;
  const dollarPattern = /\$\s*\d+/;

  // Sort blocks by vertical position (top first)
  const sorted = [...blocks].sort((a, b) => a.top - b.top);

  for (const block of sorted) {
    const text = block.text.trim();
    if (!text || text.length < 2 || text.length > 40) continue;
    if (datePattern.test(text)) continue;
    if (codePattern.test(text)) continue;
    if (percentPattern.test(text)) continue;
    if (dollarPattern.test(text)) continue;
    if (/^(expires?|valid|use by|terms|conditions|promo|code|coupon)/i.test(text)) continue;
    return text;
  }

  // Fallback: first non-trivial line
  for (const line of lines) {
    if (line.length >= 2 && line.length <= 40 && !/\d{1,2}[\/\-]\d{1,2}/.test(line)) {
      return line;
    }
  }

  return null;
}

function extractPromoCode(text: string): string | null {
  // Pattern 1: labeled codes
  const labeled = text.match(/\b(?:CODE|PROMO|COUPON|USE|ENTER|APPLY)[:\s]+([A-Z0-9]{4,20})\b/i);
  if (labeled) return labeled[1].toUpperCase();

  // Pattern 2: standalone all-caps alphanumeric 4-20 chars with mix of letters and digits
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[A-Z0-9]{4,20}$/.test(trimmed) && /[A-Z]/.test(trimmed) && /[0-9]/.test(trimmed)) {
      return trimmed;
    }
  }

  return null;
}

function extractExpiryDate(text: string): Date | null {
  // Try "Month DD, YYYY" first
  const monthMatch = text.match(
    /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s*(\d{4})/i
  );
  if (monthMatch) {
    const parsed = new Date(`${monthMatch[1]} ${monthMatch[2]}, ${monthMatch[3]}`);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // Try numeric MM/DD/YYYY or MM-DD-YYYY
  const numericMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (numericMatch) {
    const [, p1, p2, p3] = numericMatch;
    let year = parseInt(p3, 10);
    if (year < 100) year += 2000;
    const month = parseInt(p1, 10);
    const day = parseInt(p2, 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d1 = new Date(year, month - 1, day);
      if (!isNaN(d1.getTime())) return d1;
    }

    // Try DD/MM/YYYY as fallback
    if (day >= 1 && day <= 12 && month >= 1 && month <= 31) {
      const d2 = new Date(year, day - 1, month);
      if (!isNaN(d2.getTime())) return d2;
    }
  }

  return null;
}

function extractDiscount(text: string): {
  description: string | null;
  value: number | null;
  type: DiscountType;
} {
  // Percentage off
  const pctMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*off/i);
  if (pctMatch) {
    return { description: pctMatch[0], value: parseFloat(pctMatch[1]), type: 'percentage' };
  }

  // Dollar off
  const dollarMatch = text.match(/\$\s*(\d+(?:\.\d+)?)\s*off/i);
  if (dollarMatch) {
    return { description: dollarMatch[0], value: parseFloat(dollarMatch[1]), type: 'fixedAmount' };
  }

  // BOGO
  const bogoMatch = text.match(/buy\s+\d+\s+get\s+\d+[^\n]*/i);
  if (bogoMatch) {
    return { description: bogoMatch[0], value: null, type: 'bogo' };
  }

  // Free shipping
  if (/free\s+shipping/i.test(text)) {
    return { description: 'Free Shipping', value: null, type: 'freeShipping' };
  }

  // Generic percentage without "off"
  const pctOnly = text.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctOnly) {
    return { description: `${pctOnly[1]}% off`, value: parseFloat(pctOnly[1]), type: 'percentage' };
  }

  // Generic dollar amount
  const dollarOnly = text.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (dollarOnly) {
    return { description: `$${dollarOnly[1]} off`, value: parseFloat(dollarOnly[1]), type: 'fixedAmount' };
  }

  return { description: null, value: null, type: 'other' };
}

function extractMinimumPurchase(text: string): number | null {
  const match = text.match(
    /(?:minimum|min\.?\s*(?:purchase|spend|order)|orders?\s+(?:over|above|of))\s*\$?\s*(\d+(?:\.\d+)?)/i
  );
  return match ? parseFloat(match[1]) : null;
}

function extractWebsite(text: string): string | null {
  const match = text.match(/(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|net|org|co|io)\b/i);
  return match ? match[0] : null;
}

function extractTerms(text: string): string | null {
  const termsMatch = text.match(/(?:terms|t&c|conditions|\*)\s*[:\s](.+)/is);
  if (termsMatch) {
    const terms = termsMatch[1].trim().slice(0, 500);
    return terms || null;
  }
  return null;
}
