import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines classnames with Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats currency values
 * @param value - The value to format
 * @param currency - The currency code (default: UZS)
 * @param options - Intl.NumberFormat options
 */
export function formatCurrency(
  value: number,
  currency: string = "UZS",
  options: Intl.NumberFormatOptions = {}
): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };

  return new Intl.NumberFormat("uz-UZ", { ...defaultOptions, ...options }).format(value);
}

/**
 * Formats date values
 * @param date - The date to format
 * @param options - Intl.DateTimeFormat options
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("uz-UZ", options).format(dateObj);
}

/**
 * Formats date and time values
 * @param date - The date to format
 * @param options - Intl.DateTimeFormat options
 */
export function formatDateTime(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("uz-UZ", options).format(dateObj);
}

/**
 * Truncates text to a specific length
 * @param text - The text to truncate
 * @param length - The maximum length
 */
export function truncateText(text: string, length: number = 50): string {
  if (text.length <= length) return text;
  return `${text.substring(0, length)}...`;
}

/**
 * Calculates the percentage
 * @param value - The value
 * @param total - The total
 * @param decimals - The number of decimals
 */
export function calculatePercentage(
  value: number,
  total: number,
  decimals: number = 1
): number {
  if (total === 0) return 0;
  return parseFloat(((value / total) * 100).toFixed(decimals));
}

/**
 * Formats a number with a specific number of decimals
 * @param value - The value to format
 * @param decimals - The number of decimals
 */
export function formatNumber(
  value: number,
  decimals: number = 0
): string {
  return new Intl.NumberFormat("uz-UZ", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Generates a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Formats a phone number to Uzbekistan format
 * @param phoneNumber - The phone number to format
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, "");
  
  // Check if it's an Uzbekistan number
  if (cleaned.length === 9) {
    return `+998 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7, 9)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith("998")) {
    return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8, 10)} ${cleaned.substring(10, 12)}`;
  }
  
  // Return the original if it doesn't match expected patterns
  return phoneNumber;
}