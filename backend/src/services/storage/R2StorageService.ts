import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../../config';
import { IStorageService } from './IStorageService';

/**
 * Cloudflare R2 Storage Service Implementation
 * Handles file operations using Cloudflare R2 via S3-compatible API
 */
export class R2StorageService implements IStorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor() {
    // Validate R2 configuration
    if (!config.r2.accountId || !config.r2.accessKeyId || !config.r2.secretAccessKey) {
      throw new Error('R2 configuration missing. Check R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY');
    }

    if (!config.r2.bucketName || !config.r2.publicUrl || !config.r2.endpoint) {
      throw new Error('R2 configuration incomplete. Check R2_BUCKET_NAME, R2_PUBLIC_URL, and R2_ENDPOINT');
    }

    // Initialize S3 client for R2
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: config.r2.endpoint,
      credentials: {
        accessKeyId: config.r2.accessKeyId as string,
        secretAccessKey: config.r2.secretAccessKey as string,
      },
      forcePathStyle: true,
      requestHandler: {
        requestTimeout: 5 * 60 * 1000,
        httpsAgent: undefined
      } as any,
    });

    this.bucketName = config.r2.bucketName as string;
    this.publicUrl = config.r2.publicUrl as string;
  }
  /**
   * Upload file to Cloudflare R2
   */
  async uploadFile(filePath: string, fileData: Buffer, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
        Body: fileData,
        ContentType: contentType,
        CacheControl: 'public, max-age=3600',
        Metadata: {
          'uploaded-at': new Date().toISOString(),
          'content-type': contentType,
        },
      });

      await this.s3Client.send(command);
      return this.getPublicUrl(filePath);
    } catch (error) {
      console.error('R2 upload error:', error);
      throw new Error(`R2 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file from Cloudflare R2
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('R2 delete error:', error);
      throw new Error(`R2 delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generatePresignedUploadUrl(filePath: string, contentType: string, expiresIn: number = 300): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return presignedUrl;
    } catch (error) {
      console.error('R2 presigned URL error:', error);
      throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  /**
   * Get public URL for file
   */
  getPublicUrl(filePath: string): string {
    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    // Construct public URL using R2 public domain
    return `${this.publicUrl}/${cleanPath}`;
  }

  /**
   * Check if file exists in R2
   */
  async checkFileExists(filePath: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: unknown) {
      if (error instanceof Error && (error.name === 'NotFound' || 
          (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404)) {
        return false;
      }
      
      console.error('Error checking file existence in R2:', error);
      return false;
    }
  }

  /**
   * Get storage provider name
   */
  getProviderName(): string {
    return 'cloudflare-r2';
  }

  /**
   * Get S3 client for advanced operations (if needed)
   */
  getS3Client(): S3Client {
    return this.s3Client;
  }
}
