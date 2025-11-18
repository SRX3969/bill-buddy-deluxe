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

// Check if line is likely a bill item (not total, GST, etc.)
function isLikelyBillItem(text: string): boolean {
  const excludePatterns = [
    /total/i,
    /subtotal/i,
    /grand\s*total/i,
    /gst/i,
    /cgst/i,
    /sgst/i,
    /tax/i,
    /service\s*charge/i,
    /discount/i,
    /bill\s*no/i,
    /invoice/i,
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

// Parse OCR text into structured items
export function parseOCRText(text: string): ExtractedItem[] {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const items: ExtractedItem[] = [];

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

  return items;
}

// Main OCR function
export async function performOCR(
  imageDataUrl: string,
  onProgress?: (progress: number) => void
): Promise<ExtractedItem[]> {
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
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789₹.,-()x/ ',
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    });

    const { data: { text } } = await worker.recognize(imageDataUrl);
    console.log('Raw OCR text:', text);

    const items = parseOCRText(text);
    console.log('Parsed items:', items);

    await worker.terminate();
    return items;
  } catch (error) {
    console.error('OCR error:', error);
    await worker.terminate();
    throw error;
  }
}
