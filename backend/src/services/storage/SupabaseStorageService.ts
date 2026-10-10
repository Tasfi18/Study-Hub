import { supabase } from '../../config/supabase';
import { fileConfig } from '../../config';
import { IStorageService } from './IStorageService';

/**
 * Supabase Storage Service Implementation
 * Handles file operations using Supabase Storage
 */
export class SupabaseStorageService implements IStorageService {
  private readonly bucketName: string;

  constructor() {
    this.bucketName = fileConfig.storageBucket;
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(filePath: string, fileData: Buffer, contentType: string): Promise<string> {
    console.log('Uploading to Supabase Storage:', {
      filePath,
      fileSize: fileData.length,
      contentType,
      bucket: this.bucketName
    });

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, fileData, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const publicUrl = this.getPublicUrl(filePath);
    console.log('Supabase upload successful:', publicUrl);
    
    return publicUrl;  }

  /**
   * Delete file from Supabase Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    console.log('Deleting from Supabase Storage:', filePath);

    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(`Supabase delete failed: ${error.message}`);
    }

    console.log('Supabase delete successful:', filePath);
  }

  /**
   * Get public URL for file
   */
  getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Check if file exists in Supabase Storage
   */
  async checkFileExists(filePath: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(filePath.substring(0, filePath.lastIndexOf('/')), {
          search: filePath.substring(filePath.lastIndexOf('/') + 1)
        });

      return !error && data && data.length > 0;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  async generatePresignedUploadUrl(filePath: string, _contentType: string, _expiresIn: number = 300): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUploadUrl(filePath);

      if (error) {
        throw new Error(`Supabase presigned URL error: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Supabase presigned URL error:', error);
      throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getProviderName(): string {
    return 'supabase';
  }
}
