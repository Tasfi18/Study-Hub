import path from 'path';
import crypto from 'crypto';
import { MaterialType } from '../types';

/**
 * Determines material type based on file extension and MIME type
 */
export const getMaterialType = (fileName: string, _mimeType: string): MaterialType => {
  const ext = path.extname(fileName).toLowerCase();
  
  if (ext === '.pdf') return 'pdf';
  if (['.ppt', '.pptx'].includes(ext)) return 'slide';
  if (['.doc', '.docx', '.txt'].includes(ext)) return 'note';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return 'image';
  if (['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v'].includes(ext)) return 'video';
  if (['.zip', '.rar', '.7z'].includes(ext)) return 'other';
  
  return 'other';
};

/**
 * Generates a unique filename with timestamp and random suffix
 */
export const generateUniqueFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  
  // Sanitize filename - remove special characters
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '_');
  
  return `${sanitizedName}_${timestamp}_${randomSuffix}${ext}`;
};

/**
 * Formats file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes';

  // Clamp so very large files still get a unit instead of "undefined".
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validates file extension against allowed types
 */
export const isValidFileType = (fileName: string, allowedExtensions: string[]): boolean => {
  const ext = path.extname(fileName).toLowerCase();
  return allowedExtensions.includes(ext);
};

/**
 * Validates MIME type against allowed types
 */
export const isValidMimeType = (mimeType: string, allowedMimeTypes: string[]): boolean => {
  return allowedMimeTypes.includes(mimeType);
};

/**
 * Sanitizes search query for database operations
 */
export const sanitizeSearchQuery = (query: string): string => {
  return query.trim().replace(/[^\w\s]/gi, '').substring(0, 100);
};