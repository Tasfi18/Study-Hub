import { config } from '../../config';
import { IStorageService } from './IStorageService';
import { SupabaseStorageService } from './SupabaseStorageService';
import { R2StorageService } from './R2StorageService';

/**
 * Storage Service Factory
 * Creates the appropriate storage service based on configuration
 */
class StorageServiceFactory {
  private static instance: IStorageService | null = null;

  /**
   * Get storage service instance (singleton pattern)
   */
  static getInstance(): IStorageService {
    if (!this.instance) {
      this.instance = this.createStorageService();
    }
    return this.instance;
  }

  /**
   * Create storage service based on configuration
   */
  private static createStorageService(): IStorageService {
    const provider = config.storage.provider;

    switch (provider) {
      case 'cloudflare-r2':
        return new R2StorageService();
      
      case 'supabase':
        return new SupabaseStorageService();
      
      case 'local':
        throw new Error('Local storage service not implemented yet');
      
      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
  }

  /**
   * Reset instance (useful for testing)
   */
  static resetInstance(): void {
    this.instance = null;
  }

  /**
   * Get current provider name
   */
  static getCurrentProvider(): string {
    return this.getInstance().getProviderName();
  }
}

// Export singleton instance
export const storageService: IStorageService = StorageServiceFactory.getInstance();

// Export factory for testing purposes
export { StorageServiceFactory };

// Export storage services for direct usage if needed
export { SupabaseStorageService, R2StorageService };
export type { IStorageService };
