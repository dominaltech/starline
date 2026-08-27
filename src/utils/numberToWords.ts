/**
 * Convert numbers to Indian Rupees in words (Lakhs, Crores format)
 * e.g., 14779.64 -> "Rupees Fourteen Thousand Seven Hundred Seventy-Nine and Sixty-Four Paise Only"
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanThousand(num: number): string {
  if (num === 0) return '';
  let str = '';
  if (num >= 100) {
    str += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 20) {
    str += tens[Math.floor(num / 10)] + (num % 10 !== 0 ? '-' + ones[num % 10] : '') + ' ';
  } else if (num > 0) {
    str += ones[num] + ' ';
  }
  return str.trim();
}

export function numberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Rupees Zero Only';

  const isNegative = amount < 0;
  amount = Math.abs(amount);

  const rounded = Math.round(amount * 100) / 100;
  const integerPart = Math.floor(rounded);
  const paisePart = Math.round((rounded - integerPart) * 100);

  let remaining = integerPart;
  let words = '';

  // Crores (>= 1,00,00,000)
  const crores = Math.floor(remaining / 10000000);
  if (crores > 0) {
    words += convertLessThanThousand(crores) + ' Crore ';
    remaining %= 10000000;
  }

  // Lakhs (>= 1,00,000)
  const lakhs = Math.floor(remaining / 100000);
  if (lakhs > 0) {
    words += convertLessThanThousand(lakhs) + ' Lakh ';
    remaining %= 100000;
  }

  // Thousands (>= 1,000)
  const thousands = Math.floor(remaining / 1000);
  if (thousands > 0) {
    words += convertLessThanThousand(thousands) + ' Thousand ';
    remaining %= 1000;
  }

  // Hundreds & Below
  if (remaining > 0) {
    words += convertLessThanThousand(remaining) + ' ';
  }

  words = words.trim();
  if (!words) words = 'Zero';

  let result = 'Rupees ' + words;

  if (paisePart > 0) {
    result += ' and ' + convertLessThanThousand(paisePart) + ' Paise';
  }

  result += ' Only';

  return (isNegative ? 'Minus ' : '') + result;
}
