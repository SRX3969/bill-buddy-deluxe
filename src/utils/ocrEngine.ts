import Tesseract from 'tesseract.js';
import { findClosestMatch, correctOCRErrors } from './foodVocabulary';

export interface ExtractedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  confidence: number;
  rawText?: string;
  suggestion?: string;
}

export interface BillMetadata {
  merchantName?: string;
  billNumber?: string;
  date?: string;
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
}

export interface OCRResult {
  items: ExtractedItem[];
  metadata: BillMetadata;
}

// Extract quantity from text
function extractQuantity(text: string): { quantity: number; cleanText: string } {
  const patterns = [
    /(\d+)\s*x/i,           // "2x"
    /x\s*(\d+)/i,           // "x2"
    /\((\d+)\)/,            // "(2)"
    /qty\s*[:.]?\s*(\d+)/i, // "Qty: 2"
    /(\d+)\s*pc/i,          // "2 PC"
    /(\d+)\s*nos/i,         // "2 nos"
    /\*\s*(\d+)/,           // "*2"
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const qty = parseInt(match[1]);
      const cleanText = text.replace(pattern, '').trim();
      return { quantity: qty, cleanText };
    }
  }

  return { quantity: 1, cleanText: text };
}

// Extract price from text
function extractPrice(text: string): { price: number; cleanText: string } | null {
  // Remove common currency symbols and formats
  const pricePatterns = [
    /₹\s*(\d+(?:\.\d{2})?)/,     // "₹220" or "₹220.00"
    /Rs\.?\s*(\d+(?:\.\d{2})?)/i, // "Rs. 220"
    /INR\s*(\d+(?:\.\d{2})?)/i,  // "INR 220"
    /(\d+(?:\.\d{2})?)\s*\/-/,   // "220/-"
    /(\d+(?:\.\d{2})?)\s*=/,     // "220="
    /=\s*(\d+(?:\.\d{2})?)/,     // "=220"
    /(\d+(?:\.\d{2})?)$/,        // "220" at end of line
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) {
      const price = parseFloat(match[1]);
      if (price > 0 && price < 10000) { // Reasonable price range
        const cleanText = text.replace(pattern, '').trim();
        return { price, cleanText };
      }
    }
  }

  return null;
}

// Extract merchant name from top lines
function extractMerchantName(lines: string[]): string | undefined {
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length > 3 && line.length < 50 && !/\d/.test(line)) {
      return line;
    }
  }
  return undefined;
}

// Extract bill number
function extractBillNumber(text: string): string | undefined {
  const patterns = [
    /bill\s*(?:no|number|#)[\s:]*([A-Z0-9-]+)/i,
    /invoice\s*(?:no|number|#)[\s:]*([A-Z0-9-]+)/i,
    /receipt\s*(?:no|number|#)[\s:]*([A-Z0-9-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return undefined;
}

// Extract date
function extractDate(text: string): string | undefined {
  const patterns = [
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return undefined;
}

// Extract totals and taxes
function extractMetadata(text: string): Pick<BillMetadata, 'subtotal' | 'tax' | 'discount' | 'total'> {
  const metadata: Pick<BillMetadata, 'subtotal' | 'tax' | 'discount' | 'total'> = {};
  
  const subtotalMatch = text.match(/(?:sub\s*total|subtotal)[\s:]*₹?\s*(\d+(?:\.\d{2})?)/i);
  if (subtotalMatch) metadata.subtotal = parseFloat(subtotalMatch[1]);
  
  const taxMatch = text.match(/(?:tax|gst|cgst\s*\+\s*sgst)[\s:]*₹?\s*(\d+(?:\.\d{2})?)/i);
  if (taxMatch) metadata.tax = parseFloat(taxMatch[1]);
  
  const discountMatch = text.match(/(?:discount)[\s:]*₹?\s*(\d+(?:\.\d{2})?)/i);
  if (discountMatch) metadata.discount = parseFloat(discountMatch[1]);
  
  const totalMatch = text.match(/(?:grand\s*total|total|net\s*amount)[\s:]*₹?\s*(\d+(?:\.\d{2})?)/i);
  if (totalMatch) metadata.total = parseFloat(totalMatch[1]);
  
  return metadata;
}

// Check if line is likely a bill item (not total, GST, etc.)
function isLikelyBillItem(text: string): boolean {
  const excludePatterns = [
    /total/i,
    /subtotal/i,
    /grand\s*total/i,
    /^gst/i,
    /^cgst/i,
    /^sgst/i,
    /^tax[\s:]/i,
    /service\s*charge/i,
    /discount/i,
    /bill\s*no/i,
    /invoice/i,
    /receipt/i,
    /date/i,
    /time/i,
    /phone/i,
    /mobile/i,
    /address/i,
    /thank\s*you/i,
    /visit\s*again/i,
    /^\d{10,}/, // Long numbers (likely phone/GST)
    /^[A-Z0-9]{15,}/, // Alpha-numeric IDs
  ];

  for (const pattern of excludePatterns) {
    if (pattern.test(text)) {
      return false;
    }
  }

  return true;
}

// Parse OCR text into structured items and metadata
export function parseOCRText(text: string): OCRResult {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const items: ExtractedItem[] = [];
  
  // Extract metadata
  const metadata: BillMetadata = {
    merchantName: extractMerchantName(lines),
    billNumber: extractBillNumber(text),
    date: extractDate(text),
    ...extractMetadata(text),
  };

  for (let line of lines) {
    line = line.trim();
    
    // Skip if not a bill item
    if (!isLikelyBillItem(line)) continue;

    // Extract quantity
    const { quantity, cleanText: afterQty } = extractQuantity(line);

    // Extract price
    const priceResult = extractPrice(afterQty);
    if (!priceResult) continue; // Skip lines without price

    const { price, cleanText: itemName } = priceResult;

    // Clean and correct item name
    let correctedName = correctOCRErrors(itemName);
    correctedName = correctedName.replace(/[.…]+/g, ' ').trim();
    correctedName = correctedName.replace(/\s+/g, ' ');

    if (correctedName.length < 3) continue; // Skip very short names

    // Try to find vocabulary match
    const match = findClosestMatch(correctedName);
    let confidence = 85; // Default confidence
    let suggestion: string | undefined;

    if (match) {
      if (match.confidence > 80) {
        correctedName = match.match;
        confidence = match.confidence;
      } else if (match.confidence > 60) {
        suggestion = match.match;
        confidence = match.confidence;
      }
    }

    items.push({
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: correctedName,
      price,
      quantity,
      confidence,
      rawText: line,
      suggestion,
    });
  }

  return { items, metadata };
}

// Main OCR function
export async function performOCR(
  imageDataUrl: string,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  console.log('Starting OCR...');

  const worker = await Tesseract.createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  try {
    // Configure Tesseract for better accuracy
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789₹.,-()x/:# ',
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    });

    const { data: { text } } = await worker.recognize(imageDataUrl);
    console.log('Raw OCR text:', text);

    const result = parseOCRText(text);
    console.log('Parsed result:', result);

    await worker.terminate();
    return result;
  } catch (error) {
    console.error('OCR error:', error);
    await worker.terminate();
    throw error;
  }
}
