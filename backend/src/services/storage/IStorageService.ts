/**
 * Storage Service Interface
 * Defines common operations for different storage providers
 */
export interface IStorageService {
  /**
   * Upload a file to storage
   * @param filePath - The path where the file should be stored
   * @param fileData - The file content as Buffer
   * @param contentType - MIME type of the file
   * @returns Promise<string> - Public URL of the uploaded file
   */
  uploadFile(filePath: string, fileData: Buffer, contentType: string): Promise<string>;

  /**
   * Delete a file from storage
   * @param filePath - The path of the file to delete
   */
  deleteFile(filePath: string): Promise<void>;

  /**
   * Get public URL for a file
   * @param filePath - The path of the file
   * @returns string - Public URL of the file
   */
  getPublicUrl(filePath: string): string;

  /**
   * Check if a file exists in storage
   * @param filePath - The path of the file to check
   * @returns Promise<boolean> - True if file exists
   */
  checkFileExists(filePath: string): Promise<boolean>;

  /**
   * Generate presigned URL for direct upload
   * @param filePath - The path where the file will be stored
   * @param contentType - MIME type of the file
   * @param expiresIn - Expiration time in seconds (default: 300)
   * @returns Promise<string> - Presigned upload URL
   */
  generatePresignedUploadUrl(filePath: string, contentType: string, expiresIn?: number): Promise<string>;

  /**
   * Get storage provider name
   * @returns string - Name of the storage provider
   */
  getProviderName(): string;
}

/**
 * Upload options for file operations
 */
export interface UploadOptions {
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

/**
 * Storage provider configuration
 */
export interface StorageConfig {
  provider: 'supabase' | 'cloudflare-r2' | 'local';
  bucket: string;
}
