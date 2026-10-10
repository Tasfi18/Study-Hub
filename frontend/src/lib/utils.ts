import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Admin role constants
 */
export const ADMIN_ROLES = ['admin', 'super_admin'] as const;

/**
 * Check if user has admin privileges
 */
export function isAdminUser(role: string): boolean {
  return ADMIN_ROLES.includes(role as any);
}

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format date in a user-friendly way
 */
export function formatDate(date: string | Date | null | undefined): string {
  // Handle null, undefined, or empty values
  if (!date) {
    return 'Not available';
  }

  const d = new Date(date);

  // Check if the date is valid
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format date in short format without time (e.g., "Nov 24, 2025")
 */
export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) {
    return 'Not available';
  }

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Get material type icon
 */
export function getMaterialTypeIcon(type: string): string {
  switch (type) {
    case 'pdf':
      return '📄';
    case 'slide':
    case 'ppt':
    case 'pptx':
      return '📊';
    case 'note':
    case 'doc':
    case 'docx':
    case 'txt':
      return '📝';
    case 'assignment':
      return '📋';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'image':
      return '🖼️';
    case 'video':
    case 'mp4':
    case 'webm':
    case 'ogg':
    case 'mov':
    case 'avi':
    case 'mkv':
      return '🎬';
    default:
      return '📎';
  }
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get user-friendly category display name
 */
export function getCategoryDisplayName(category: string | undefined): string {
  if (!category) return '';

  switch (category) {
    case 'previous_question':
      return 'Previous Questions';
    case 'ct_question':
      return 'CT Questions';
    case 'final_question':
      return 'Final Questions';
    case 'assignment':
      return 'Assignments';
    case 'lecture_note':
      return 'Lecture Notes';
    case 'lab_manual':
      return 'Lab Manuals';
    case 'syllabus':
      return 'Syllabus';
    case 'other':
      return 'Other';
    default:
      return category;
  }
}

/**
 * Generate avatar initials from full name
 */
export function getInitials(fullName: string | undefined | null): string {
  // Handle undefined, null, or empty string cases
  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    return 'U'; // Default to 'U' for User
  }

  return fullName
    .trim()
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format date as relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'Unknown';

  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }

  const years = Math.floor(diffInSeconds / 31536000);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

/**
 * iOS and mobile device detection utilities
 */
export const deviceUtils = {
  /**
   * Detect if running on iOS device
   */
  isIOS: (): boolean => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },
};

/**
 * Handle file download with device-specific optimization
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'download';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}