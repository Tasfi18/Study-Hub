import { supabase } from '../config/supabase';
import { storageService } from './storage';
import { Material, MaterialFilters, PaginatedResponse, Review } from '../types';
import { NotificationService } from './notificationService';

export class MaterialService {
  /**
   * Create a new material record in the database
   */
  static async createMaterial(
    materialData: Omit<Material, 'id' | 'created_at' | 'updated_at' | 'download_count' | 'is_featured' | 'approved_at' | 'approved_by' | 'rejection_reason'>,
    uploadedBy: string
  ): Promise<Material> {
    
    // Clean up empty string values to null for database
    const cleanedData = {
      ...materialData,
      batch_id: materialData.batch_id && materialData.batch_id.trim() !== '' ? materialData.batch_id : null,
      course_code_id: materialData.course_code_id && materialData.course_code_id.trim() !== '' ? materialData.course_code_id : null,
      description: materialData.description && materialData.description.trim() !== '' ? materialData.description : null,
      category: materialData.category && materialData.category.trim() !== '' ? materialData.category.trim() : null,
    };

    console.log('Creating material with data:', {
      title: cleanedData.title,
      discipline_id: cleanedData.discipline_id,
      batch_id: cleanedData.batch_id,
      course_code_id: cleanedData.course_code_id,
      uploaded_by: uploadedBy,
    });

    const { data, error } = await supabase
      .from('materials')
      .insert({
        ...cleanedData,
        uploaded_by: uploadedBy,
        status: 'pending',
        download_count: 0,
        is_featured: false,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw new Error(`Failed to create material: ${error.message}`);
    }

    return data as Material;
  }

  /**
   * Get materials with filtering and pagination
   * Filters by discipline for all users except super_admin
   */
  static async getMaterials(
    filters: MaterialFilters, 
    userContext?: { role: string; disciplineId?: string; userId?: string }
  ): Promise<PaginatedResponse<Material[]>> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    let query = supabase
      .from('materials')
      .select(`
        *,
        discipline:disciplines(name, code),
        batch:batches(year, semester, code),
        course_code:course_codes(code, title),
        uploaded_by_profile:profiles!uploaded_by(id, full_name, role)
      `, { count: 'exact' });

    // Apply discipline-based filtering for all users except super_admin
    if (userContext && userContext.role !== 'super_admin' && userContext.disciplineId) {
      query = query.eq('discipline_id', userContext.disciplineId);
      console.log('Filtering materials by discipline:', {
        role: userContext.role,
        disciplineId: userContext.disciplineId
      });
    }

    // Apply filters
    if (filters.discipline) {
      query = query.eq('discipline_id', filters.discipline);
    }
    
    if (filters.term) {
      query = query.eq('batch_id', filters.term);
    }
    
    if (filters.courseCode) {
      query = query.eq('course_code_id', filters.courseCode);
    }
    
    if (filters.type) {
      query = query.eq('file_type', filters.type);
    }
    
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch materials: ${error.message}`);
    }

    // Enrich materials with rating stats efficiently
    if (data && data.length > 0) {
      const materialIds = data.map(m => m.id);
      
      // Get all reviews for these materials in one query
      const { data: reviews } = await supabase
        .from('reviews')
        .select('material_id, rating')
        .in('material_id', materialIds);

      // Calculate stats for each material
      const statsMap = new Map<string, { sum: number; count: number }>();
      
      if (reviews) {
        reviews.forEach(review => {
          const stats = statsMap.get(review.material_id) || { sum: 0, count: 0 };
          stats.sum += review.rating;
          stats.count += 1;
          statsMap.set(review.material_id, stats);
        });
      }

      // Get bookmark status for logged-in user
      const bookmarksMap = new Map<string, boolean>();
      if (userContext?.userId) {
        const { data: bookmarks } = await supabase
          .from('bookmarks')
          .select('material_id')
          .eq('user_id', userContext.userId)
          .in('material_id', materialIds);

        if (bookmarks) {
          bookmarks.forEach(bookmark => {
            bookmarksMap.set(bookmark.material_id, true);
          });
        }
      }

      // Apply stats and bookmark status to materials
      data.forEach(material => {
        const stats = statsMap.get(material.id);
        if (stats) {
          material.average_rating = stats.sum / stats.count;
          material.total_reviews = stats.count;
        } else {
          material.average_rating = 0;
          material.total_reviews = 0;
        }
        material.is_bookmarked = bookmarksMap.get(material.id) || false;
      });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      success: true,
      message: 'Materials fetched successfully',
      data: data as Material[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    };
  }
  /**
   * Get a single material by ID
   */
  static async getMaterialById(id: string, userContext?: { userId: string }): Promise<Material | null> {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        discipline:disciplines(name, code),
        batch:batches(year, semester, code),
        course_code:course_codes(code, title),
        uploaded_by_profile:profiles!uploaded_by(id, full_name, role)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch material: ${error.message}`);
    }

    // Add rating stats
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('material_id', id);

    if (reviews && reviews.length > 0) {
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      data.average_rating = sum / reviews.length;
      data.total_reviews = reviews.length;
    } else {
      data.average_rating = 0;
      data.total_reviews = 0;
    }

    // Check if user has reviewed
    if (userContext?.userId) {
      const { data: userReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('material_id', id)
        .eq('user_id', userContext.userId)
        .single();
      
      data.user_has_reviewed = !!userReview;

      // Check bookmark status for logged-in user
      const { data: bookmark } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('material_id', id)
        .eq('user_id', userContext.userId)
        .single();
      
      data.is_bookmarked = !!bookmark;
    } else {
      data.user_has_reviewed = false;
      data.is_bookmarked = false;
    }

    return data as Material;
  }

  /**
   * Update material status (approve/reject)
   */
  static async updateMaterialStatus(
    id: string,
    status: 'approved' | 'rejected',
    approvedBy: string,
    rejectionReason?: string
  ): Promise<Material> {
    const updateData: any = {
      status,
      approved_by: approvedBy,
      updated_at: new Date().toISOString(),
    };

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
    } else if (status === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { data, error } = await supabase
      .from('materials')
      .update(updateData)
      .eq('id', id)
      .select('*, uploaded_by')
      .single();

    if (error) {
      throw new Error(`Failed to update material status: ${error.message}`);
    }

    // Send notification to material uploader
    const material = data as Material;
    if (material.uploaded_by) {
      try {
        await NotificationService.create({
          userId: material.uploaded_by,
          type: status === 'approved' ? 'approval' : 'rejection',
          title: `Material ${status === 'approved' ? 'Approved' : 'Rejected'}`,
          message: status === 'approved'
            ? `Your material "${material.title}" has been approved and is now available for download.`
            : `Your material "${material.title}" was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
          data: { materialId: id, materialTitle: material.title },
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't throw error - notification failure shouldn't break the main operation
      }
    }

    return material;
  }

  /**
   * Increment download count
   */
  static async incrementDownloadCount(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_download_count', {
      material_uuid: id,
    });

    if (error) {
      console.error('Failed to increment download count:', error);
    }
  }

  /**
   * Toggle bookmark for a material
   */
  static async toggleBookmark(materialId: string, userId: string): Promise<{ bookmarked: boolean }> {
    // Check if bookmark exists
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('material_id', materialId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Remove bookmark
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('material_id', materialId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to remove bookmark: ${error.message}`);
      }
      return { bookmarked: false };
    } else {
      // Add bookmark
      const { error } = await supabase
        .from('bookmarks')
        .insert({ material_id: materialId, user_id: userId });

      if (error) {
        throw new Error(`Failed to add bookmark: ${error.message}`);
      }
      return { bookmarked: true };
    }
  }

  /**
   * Get user's bookmarked materials
   */
  static async getBookmarkedMaterials(userId: string, page = 1, limit = 10): Promise<PaginatedResponse<Material[]>> {
    const offset = (page - 1) * limit;

    // Get bookmarked material IDs with count
    const { data: bookmarks, count, error } = await supabase
      .from('bookmarks')
      .select(`
        material_id,
        materials!inner (*)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch bookmarks: ${error.message}`);
    }

    // Extract materials from the joined data
    const materials = bookmarks?.map((b: any) => b.materials) || [];

    return {
      success: true,
      message: 'Bookmarks fetched successfully',
      data: materials,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      }
    };
  }

  /**
   * Check if a material is bookmarked by user
   */
  static async isBookmarked(materialId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('material_id', materialId)
      .eq('user_id', userId)
      .single();

    return !!data;
  }

  /**
   * Add or update a review
   */
  static async addOrUpdateReview(
    materialId: string, 
    userId: string, 
    rating: number, 
    review?: string
  ): Promise<Review> {
    // Check if review exists
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('material_id', materialId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing review
      const { data, error } = await supabase
        .from('reviews')
        .update({ rating, review, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select('*, user_profile:profiles!user_id(*)')
        .single();

      if (error) throw new Error(`Failed to update review: ${error.message}`);
      return data as Review;
    } else {
      // Create new review
      const { data, error } = await supabase
        .from('reviews')
        .insert({ material_id: materialId, user_id: userId, rating, review })
        .select('*, user_profile:profiles!user_id(*)')
        .single();

      if (error) throw new Error(`Failed to add review: ${error.message}`);
      return data as Review;
    }
  }

  /**
   * Get reviews for a material
   */
  static async getReviews(materialId: string, page = 1, limit = 10): Promise<{
    reviews: Review[];
    stats: { average: number; total: number; distribution: Record<number, number> };
  }> {
    const offset = (page - 1) * limit;

    // Get paginated reviews
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, user_profile:profiles!user_id(full_name, avatar_url)')
      .eq('material_id', materialId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to fetch reviews: ${error.message}`);

    // Get rating statistics
    const { data: stats } = await supabase
      .from('reviews')
      .select('rating')
      .eq('material_id', materialId);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    let sum = 0;

    stats?.forEach(r => {
      distribution[r.rating as keyof typeof distribution]++;
      sum += r.rating;
      total++;
    });

    return {
      reviews: reviews as Review[],
      stats: {
        average: total > 0 ? sum / total : 0,
        total,
        distribution
      }
    };
  }

  /**
   * Delete a review
   */
  static async deleteReview(reviewId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to delete review: ${error.message}`);
  }

  /**
   * Delete a material (authorization is handled by middleware)
   */
  static async deleteMaterial(materialId: string, userId: string, userRole: string): Promise<boolean> {
    // Validate inputs
    if (!materialId || !userId) {
      throw new Error('Invalid parameters for deletion');
    }

    // Get the material to get file path for cleanup
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('file_path, title')
      .eq('id', materialId)
      .single();

    if (fetchError || !material) {
      console.error('Material not found:', fetchError);
      throw new Error('Material not found');
    }

    console.log('Deleting material:', {
      materialId,
      title: material.title,
      requestedBy: userId,
      userRole,
      storageProvider: storageService.getProviderName()
    });

    // Extract file path from URL for storage deletion
    const filePathMatch = material.file_path.match(/materials\/[^?]*/);
    const storagePath = filePathMatch ? filePathMatch[0] : null;

    // Delete the material from database (cascades to related records)
    const { error: deleteError } = await supabase
      .from('materials')
      .delete()
      .eq('id', materialId);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      throw new Error(`Failed to delete material: ${deleteError.message}`);
    }

    // Try to delete from storage (non-blocking)
    if (storagePath) {
      try {
        await storageService.deleteFile(storagePath);
        console.log('File deleted from storage:', storagePath);
      } catch (storageError) {
        console.error('Failed to delete file from storage:', storageError);
        // Continue even if storage deletion fails
      }
    }

    console.log('Material deleted successfully:', material.title);
    return true;
  }
}