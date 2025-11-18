// Common food items found in Indian restaurant bills
export const FOOD_VOCABULARY = [
  // North Indian
  'Paneer Butter Masala', 'Butter Chicken', 'Chicken Tikka Masala', 'Dal Makhani',
  'Palak Paneer', 'Kadai Paneer', 'Shahi Paneer', 'Malai Kofta', 'Chole Bhature',
  'Rajma Chawal', 'Aloo Gobi', 'Baingan Bharta', 'Bhindi Masala',
  
  // Breads
  'Butter Naan', 'Garlic Naan', 'Plain Naan', 'Tandoori Roti', 'Laccha Paratha',
  'Missi Roti', 'Roomali Roti', 'Kulcha', 'Bhatura', 'Puri',
  
  // South Indian
  'Masala Dosa', 'Plain Dosa', 'Idli', 'Vada', 'Medu Vada', 'Uttapam',
  'Rava Dosa', 'Onion Dosa', 'Paper Dosa', 'Sambar', 'Rasam',
  
  // Chinese & Indo-Chinese
  'Chilli Chicken', 'Manchurian', 'Fried Rice', 'Hakka Noodles', 'Schezwan Noodles',
  'Spring Roll', 'Momos', 'Chowmein', 'Gobi Manchurian', 'Paneer Chilli',
  
  // Rice
  'Biryani', 'Veg Biryani', 'Chicken Biryani', 'Mutton Biryani', 'Egg Biryani',
  'Pulao', 'Jeera Rice', 'Plain Rice', 'Steamed Rice',
  
  // Fast Food
  'Pizza', 'Burger', 'Sandwich', 'French Fries', 'Pasta', 'Garlic Bread',
  'Nachos', 'Tacos', 'Wrap', 'Sub', 'Hot Dog',
  
  // Desserts
  'Gulab Jamun', 'Rasgulla', 'Rasmalai', 'Kulfi', 'Ice Cream', 'Brownie',
  'Pastry', 'Cake', 'Kheer', 'Gajar Halwa', 'Jalebi',
  
  // Drinks
  'Lassi', 'Masala Chai', 'Coffee', 'Cold Coffee', 'Cappuccino', 'Latte',
  'Fresh Lime', 'Coca Cola', 'Pepsi', 'Sprite', 'Thumbs Up', 'Fanta',
  'Mango Shake', 'Chocolate Shake', 'Buttermilk', 'Mineral Water',
  
  // Starters
  'Paneer Tikka', 'Chicken Tikka', 'Tandoori Chicken', 'Kebab', 'Seekh Kebab',
  'Hara Bhara Kebab', 'Veg Cutlet', 'Samosa', 'Pakora', 'Aloo Tikki'
];

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Find closest match in vocabulary
export function findClosestMatch(
  input: string,
  maxDistance: number = 3
): { match: string; distance: number; confidence: number } | null {
  const normalizedInput = input.toLowerCase().trim();
  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  for (const word of FOOD_VOCABULARY) {
    const normalizedWord = word.toLowerCase();
    const distance = levenshteinDistance(normalizedInput, normalizedWord);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = word;
    }
  }

  if (bestMatch && bestDistance <= maxDistance) {
    const confidence = Math.max(0, 100 - (bestDistance * 20));
    return { match: bestMatch, distance: bestDistance, confidence };
  }

  return null;
}

// Auto-correct common OCR mistakes
export function correctOCRErrors(text: string): string {
  const corrections: { [key: string]: string } = {
    'Naan1': 'Naan',
    'Naan!': 'Naan',
    'Poneer': 'Paneer',
    'Panner': 'Paneer',
    'Panir': 'Paneer',
    'Chikcen': 'Chicken',
    'Chiken': 'Chicken',
    'Chickn': 'Chicken',
    'Masla': 'Masala',
    'Masaala': 'Masala',
    'Biryanii': 'Biryani',
    'Biriyani': 'Biryani',
    'Dosa)': 'Dosa',
    'Dosa1': 'Dosa',
    'Momos)': 'Momos',
    'Momose': 'Momos'
  };

  let corrected = text;
  for (const [wrong, right] of Object.entries(corrections)) {
    corrected = corrected.replace(new RegExp(wrong, 'gi'), right);
  }

  return corrected;
}
