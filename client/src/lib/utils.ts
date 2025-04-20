import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names into a single string, handling Tailwind CSS conflicts
 * @param inputs - The class names to combine
 * @returns A merged string of class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date into a human-readable string
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions to customize the format
 * @returns A formatted date string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  }
): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-US", options).format(d)
}

/**
 * Formats a price value into a currency string
 * @param price - The price value in cents
 * @param currency - The currency code (default: USD)
 * @returns A formatted currency string
 */
export function formatPrice(
  price: number,
  currency: string = "USD",
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    ...options,
  }).format(price)
}

/**
 * Truncates a string to a maximum length and adds an ellipsis
 * @param str - The string to truncate
 * @param length - The maximum length (default: 50)
 * @returns The truncated string
 */
export function truncate(str: string, length: number = 50): string {
  if (!str || str.length <= length) return str
  return `${str.slice(0, length)}...`
}

/**
 * Debounces a function call
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

/**
 * Generates a random string to use as an ID
 * @param length - The length of the ID (default: 8)
 * @returns A random string
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from(
    { length },
    () => chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('')
}

/**
 * Get the initials from a name (up to 2 characters)
 * @param name - The name to get initials from
 * @returns The initials (1-2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return ''
  
  const parts = name.split(/\s+/).filter(Boolean)
  
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}