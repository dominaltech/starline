/**
 * WhatsApp Dispatch and Message Template Utilities
 * Supports opening directly in Windows WhatsApp Native Desktop Application (whatsapp://)
 * or WhatsApp Web (https://web.whatsapp.com) with configurable templates and placeholder interpolation.
 */

export type WhatsAppTarget = 'desktop' | 'web';

/**
 * Standardize phone number with Indian '91' country code
 */
export const formatMobileWithCountryCode = (mobile: string): string => {
  const digitsOnly = mobile.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  return digitsOnly;
};

/**
 * Build WhatsApp URI or Web URL based on target protocol
 */
export const buildWhatsAppUrl = (
  phone: string,
  message: string,
  target: WhatsAppTarget = 'desktop'
): string => {
  const formattedPhone = formatMobileWithCountryCode(phone);
  const encodedText = encodeURIComponent(message);

  if (target === 'desktop') {
    // Native Windows WhatsApp protocol — opens the WhatsApp Windows Desktop App directly
    return `whatsapp://send?phone=${formattedPhone}&text=${encodedText}`;
  }

  // Fallback to WhatsApp Web in browser tab
  return `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
};

/**
 * Dispatch / Trigger WhatsApp application
 */
export const openWhatsApp = (
  phone: string,
  message: string,
  target: WhatsAppTarget = 'desktop'
): void => {
  const url = buildWhatsAppUrl(phone, message, target);

  if (target === 'desktop') {
    // For custom protocol on Windows, anchor tag dispatch opens Windows App immediately
    const a = document.createElement('a');
    a.href = url;
    a.target = '_self';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 200);
  } else {
    window.open(url, '_blank');
  }
};

/**
 * Replace placeholders like {customer_name}, {grand_total}, etc. in template strings
 */
export const interpolateTemplate = (
  template: string,
  variables: Record<string, string | number | undefined | null>
): string => {
  let result = template;
  for (const [key, val] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, val !== undefined && val !== null ? String(val) : '');
  }
  return result;
};
