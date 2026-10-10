import { Request, Response } from 'express';
import { promises as fs } from 'fs';
import { AuthenticatedRequest, ApiResponse, UploadMaterialRequest, MaterialFilters } from '../types';
import { MaterialService } from '../services/materialService';
import { LookupService } from '../services/lookupService';
import { supabase } from '../config/supabase';
import { storageService } from '../services/storage';
import { fileConfig } from '../config';
import { getMaterialType, generateUniqueFileName, isValidFileType, isValidMimeType } from '../utils/fileUtils';
import { NotificationService } from '../services/notificationService';

export class MaterialController {
  /**
   * Get presigned URL for direct upload to storage
   */
  static async getPresignedUploadUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { fileName, fileSize, contentType, disciplineId } = req.body;

      if (!fileName || !fileSize || !contentType || !disciplineId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'fileName, fileSize, contentType, and disciplineId are required',
        } as ApiResponse);
        return;
      }

      if (fileSize > fileConfig.maxFileSize) {
        res.status(400).json({
          success: false,
          error: 'File too large',
          message: `File size exceeds maximum allowed size of ${fileConfig.maxFileSize} bytes`,
        } as ApiResponse);
        return;
      }

      if (!isValidFileType(fileName, fileConfig.allowedExtensions)) {
        res.status(400).json({
          success: false,
          error: 'Invalid file type',
          message: `Allowed types: ${fileConfig.allowedExtensions.join(', ')}`,
        } as ApiResponse);
        return;
      }

      if (!isValidMimeType(contentType, fileConfig.allowedMimeTypes)) {
        res.status(400).json({
          success: false,
          error: 'Invalid MIME type',
          message: 'File type not supported',
        } as ApiResponse);
        return;
      }

      const disciplineUUID = await LookupService.getDisciplineUUID(disciplineId);
      if (!disciplineUUID) {
        res.status(400).json({
          success: false,
          error: 'Invalid discipline ID',
          message: `Discipline with ID "${disciplineId}" not found`,
        } as ApiResponse);
        return;
      }

      if (user.role !== 'super_admin' && user.discipline_id !== disciplineUUID) {
        res.status(403).json({
          success: false,
          error: 'Unauthorized',
          message: 'You can only upload materials to your own discipline',
        } as ApiResponse);
        return;
      }

      const uniqueFileName = generateUniqueFileName(fileName);
      const filePath = `materials/${uniqueFileName}`;

      const presignedUrl = await storageService.generatePresignedUploadUrl(filePath, contentType, 900);
      const publicUrl = storageService.getPublicUrl(filePath);

      res.json({
        success: true,
        message: 'Presigned URL generated successfully',
        data: {
          uploadUrl: presignedUrl,
          publicUrl,
          filePath,
          fileName: uniqueFileName,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Get presigned URL error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to generate presigned URL',
      } as ApiResponse);
    }
  }

  /**
   * Confirm upload and save material metadata
   */
  static async confirmUpload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const materialData = req.body as UploadMaterialRequest & {
        filePath: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
      };

      if (!materialData.filePath || !materialData.fileName) {
        res.status(400).json({
          success: false,
          error: 'Missing file information',
          message: 'filePath and fileName are required',
        } as ApiResponse);
        return;
      }

      const disciplineUUID = await LookupService.getDisciplineUUID(materialData.disciplineId);
      if (!disciplineUUID) {
        res.status(400).json({
          success: false,
          error: 'Invalid discipline ID',
          message: `Discipline with ID "${materialData.disciplineId}" not found`,
        } as ApiResponse);
        return;
      }

      let batchUUID: string | null = null;
      if (materialData.batchId) {
        batchUUID = await LookupService.getBatchUUID(materialData.batchId);
      }

      let courseCodeUUID: string | null = null;
      if (materialData.courseCodeId) {
        courseCodeUUID = await LookupService.getCourseCodeUUID(materialData.courseCodeId);
      }

      const material = await MaterialService.createMaterial({
        title: materialData.title,
        ...(materialData.description && { description: materialData.description }),
        file_name: materialData.fileName,
        file_path: materialData.filePath,
        file_size: materialData.fileSize,
        file_type: getMaterialType(materialData.fileName, materialData.mimeType),
        mime_type: materialData.mimeType,
        discipline_id: disciplineUUID,
        ...(batchUUID && { batch_id: batchUUID }),
        ...(courseCodeUUID && { course_code_id: courseCodeUUID }),
        ...(materialData.category && { category: materialData.category }),
        tags: materialData.tags || [],
        status: 'pending',
        uploaded_by: user.id,
      }, user.id);

      // Notify admins/teachers about new material upload
      try {
        await NotificationService.notifyMaterialUploaded(
          material.id,
          material.title,
          disciplineUUID
        );
      } catch (notifError) {
        console.error('Failed to send upload notification:', notifError);
      }

      res.status(201).json({
        success: true,
        message: 'Material uploaded successfully',
        data: {
          id: material.id,
          title: material.title,
          fileName: material.file_name,
          status: material.status,
          uploadedAt: material.created_at,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Confirm upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to confirm upload',
      } as ApiResponse);
    }
  }

  /**
   * Upload a new study material
   */
  static async uploadMaterial(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const materialData = req.body as UploadMaterialRequest;

      if (!req.files || !req.files.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
          message: 'Please select a file to upload',
        } as ApiResponse);
        return;
      }

      const uploadedFile = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;

      // Validate file type and size
      if (!isValidFileType(uploadedFile.name, fileConfig.allowedExtensions)) {
        res.status(400).json({
          success: false,
          error: 'Invalid file type',
          message: `Allowed types: ${fileConfig.allowedExtensions.join(', ')}`,
        } as ApiResponse);
        return;
      }

      if (!isValidMimeType(uploadedFile.mimetype, fileConfig.allowedMimeTypes)) {
        res.status(400).json({
          success: false,
          error: 'Invalid MIME type',
          message: 'File type not supported',
        } as ApiResponse);
        return;
      }

      // Generate unique filename and upload to storage
      const uniqueFileName = generateUniqueFileName(uploadedFile.name);
      const filePath = `materials/${uniqueFileName}`;

      let publicUrl: string;
      try {
        const fileData = uploadedFile.tempFilePath
          ? await fs.readFile(uploadedFile.tempFilePath)
          : uploadedFile.data;

        publicUrl = await storageService.uploadFile(filePath, fileData, uploadedFile.mimetype);

        if (uploadedFile.tempFilePath) {
          await fs.unlink(uploadedFile.tempFilePath).catch(() => { });
        }
      } catch (uploadError) {
        console.error('Storage upload error:', uploadError);

        if (uploadedFile.tempFilePath) {
          await fs.unlink(uploadedFile.tempFilePath).catch(() => { });
        }

        const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown storage error';
        const timeoutHint = errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('timed out')
          ? ' The file may be too large or your connection may be too slow.'
          : '';

        res.status(500).json({
          success: false,
          error: 'Upload failed',
          message: `Storage error: ${errorMessage}${timeoutHint}`,
        } as ApiResponse);
        return;
      }

      // Convert integer IDs to UUIDs
      const disciplineUUID = await LookupService.getDisciplineUUID(materialData.disciplineId);
      if (!disciplineUUID) {
        // Clean up uploaded file if lookup fails
        try {
          await storageService.deleteFile(filePath);
          console.log('Cleaned up uploaded file after discipline lookup failure');
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded file:', cleanupError);
        }

        res.status(400).json({
          success: false,
          error: 'Invalid discipline ID',
          message: `Discipline with ID "${materialData.disciplineId}" not found`,
        } as ApiResponse);
        return;
      }

      // Discipline authorization: Users can only upload to their own discipline (except super_admin)
      if (user.role !== 'super_admin' && user.discipline_id !== disciplineUUID) {
        // Clean up uploaded file
        try {
          await storageService.deleteFile(filePath);
          console.log('Cleaned up uploaded file after discipline authorization failure');
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded file:', cleanupError);
        }

        res.status(403).json({
          success: false,
          error: 'Unauthorized',
          message: 'You can only upload materials to your own discipline',
        } as ApiResponse);
        return;
      }

      let batchUUID: string | null = null;
      if (materialData.batchId) {
        batchUUID = await LookupService.getBatchUUID(materialData.batchId);
        if (!batchUUID) {
          // Clean up uploaded file if lookup fails
          try {
            await storageService.deleteFile(filePath);
            console.log('Cleaned up uploaded file after batch lookup failure');
          } catch (cleanupError) {
            console.error('Failed to cleanup uploaded file:', cleanupError);
          }

          res.status(400).json({
            success: false,
            error: 'Invalid batch ID',
            message: `Batch with ID "${materialData.batchId}" not found`,
          } as ApiResponse);
          return;
        }
      }

      let courseCodeUUID: string | null = null;
      if (materialData.courseCodeId) {
        courseCodeUUID = await LookupService.getCourseCodeUUID(materialData.courseCodeId);
        if (!courseCodeUUID) {
          // Clean up uploaded file if lookup fails
          try {
            await storageService.deleteFile(filePath);
            console.log('Cleaned up uploaded file after course code lookup failure');
          } catch (cleanupError) {
            console.error('Failed to cleanup uploaded file:', cleanupError);
          }

          res.status(400).json({
            success: false,
            error: 'Invalid course code ID',
            message: `Course code with ID "${materialData.courseCodeId}" not found`,
          } as ApiResponse);
          return;
        }
      }

      // Create material record with error handling
      let material;
      try {
        material = await MaterialService.createMaterial({
          title: materialData.title,
          ...(materialData.description && { description: materialData.description }),
          file_name: uploadedFile.name,
          file_path: publicUrl,
          file_size: uploadedFile.size,
          file_type: getMaterialType(uploadedFile.name, uploadedFile.mimetype),
          mime_type: uploadedFile.mimetype,
          discipline_id: disciplineUUID,
          ...(batchUUID && { batch_id: batchUUID }),
          ...(courseCodeUUID && { course_code_id: courseCodeUUID }),
          ...(materialData.category && { category: materialData.category }),
          tags: materialData.tags || [],
          status: 'pending',
          uploaded_by: user.id,
        }, user.id);
      } catch (dbError) {
        console.error('Database creation error:', dbError);

        // Clean up uploaded file if database creation fails
        try {
          await storageService.deleteFile(filePath);
          console.log('Cleaned up uploaded file after database error');
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded file:', cleanupError);
        }

        res.status(500).json({
          success: false,
          error: 'Database error',
          message: `Failed to save material record: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`,
        } as ApiResponse);
        return;
      }

      // Notify admins/teachers about new material upload
      try {
        await NotificationService.notifyMaterialUploaded(
          material.id,
          material.title,
          disciplineUUID
        );
      } catch (notifError) {
        console.error('Failed to send upload notification:', notifError);
      }

      res.status(201).json({
        success: true,
        message: 'Material uploaded successfully',
        data: {
          id: material.id,
          title: material.title,
          fileName: material.file_name,
          status: material.status,
          uploadedAt: material.created_at,
        },
      } as ApiResponse);

    } catch (error) {
      console.error('Upload error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        body: req.body,
        files: req.files ? Object.keys(req.files) : 'no files'
      });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred during upload',
      } as ApiResponse);
    }
  }
  /**
   * Get materials with filtering and pagination
   * Regular admins only see materials from their discipline, super admins see all
   */
  static async getMaterials(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Convert filter IDs to UUIDs if they're not already UUIDs
      let disciplineUUID: string | undefined;
      let batchUUID: string | undefined;
      let courseCodeUUID: string | undefined;

      if (req.query.discipline) {
        disciplineUUID = await LookupService.getDisciplineUUID(req.query.discipline as string) || undefined;
      }

      if (req.query.term) {
        batchUUID = await LookupService.getBatchUUID(req.query.term as string) || undefined;
      }

      if (req.query.courseCode) {
        courseCodeUUID = await LookupService.getCourseCodeUUID(req.query.courseCode as string) || undefined;
      }

      const filters: MaterialFilters = {
        discipline: disciplineUUID,
        term: batchUUID,
        courseCode: courseCodeUUID,
        type: req.query.type as any,
        category: req.query.category as any,
        status: req.query.status as any,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      // Pass user context for discipline filtering
      const userContext = req.user ? {
        role: req.user.role,
        userId: req.user.id,
        ...(req.user.discipline_id && { disciplineId: req.user.discipline_id })
      } : undefined;

      const result = await MaterialService.getMaterials(filters, userContext);
      res.json(result);

    } catch (error) {
      console.error('Get materials error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch materials',
      } as ApiResponse);
    }
  }

  /**
   * Get a single material by ID
   */
  static async getMaterialById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;

      // Pass user context if authenticated
      const userContext = user ? { userId: user.id } : undefined;
      const material = await MaterialService.getMaterialById(id, userContext);

      if (!material) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Material not found',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: 'Material fetched successfully',
        data: material,
      } as ApiResponse);

    } catch (error) {
      console.error('Get material error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch material',
      } as ApiResponse);
    }
  }

  /**
   * Approve or reject a material (teachers and admins only)
   */
  static async updateMaterialStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;
      const user = req.user!;

      const material = await MaterialService.updateMaterialStatus(
        id,
        status,
        user.id,
        rejectionReason
      );

      // Send notification to the uploader
      if (material.uploaded_by) {
        try {
          if (status === 'approved') {
            await NotificationService.create({
              userId: material.uploaded_by,
              type: 'approval',
              title: 'Material Approved',
              message: `Your material "${material.title}" has been approved and is now visible to all users.`,
              data: { materialId: material.id, materialTitle: material.title },
            });
          } else if (status === 'rejected') {
            await NotificationService.create({
              userId: material.uploaded_by,
              type: 'rejection',
              title: 'Material Rejected',
              message: `Your material "${material.title}" has been rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`,
              data: { materialId: material.id, materialTitle: material.title, rejectionReason },
            });
          }
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
          // Don't fail the request if notification fails
        }
      }

      res.json({
        success: true,
        message: `Material ${status} successfully`,
        data: material,
      } as ApiResponse);

    } catch (error) {
      console.error('Update material status error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update material status',
      } as ApiResponse);
    }
  }

  /**
   * Download a material (increments download count) - Now requires authentication
   */
  static async downloadMaterial(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const material = await MaterialService.getMaterialById(id);

      if (!material || material.status !== 'approved') {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Material not found or not approved',
        } as ApiResponse);
        return;
      }

      // Increment download count with user information
      await MaterialService.incrementDownloadCount(id);

      // Send notification for download milestones
      const newDownloadCount = (material.download_count || 0) + 1;
      const milestones = [10, 25, 50, 100, 250, 500, 1000];

      if (material.uploaded_by && milestones.includes(newDownloadCount)) {
        try {
          await NotificationService.create({
            userId: material.uploaded_by,
            type: 'download',
            title: 'Download Milestone Reached!',
            message: `Your material "${material.title}" has reached ${newDownloadCount} downloads!`,
            data: { materialId: material.id, materialTitle: material.title, downloadCount: newDownloadCount },
          });
        } catch (notifError) {
          console.error('Failed to send milestone notification:', notifError);
          // Don't fail the request if notification fails
        }
      }

      res.json({
        success: true,
        message: 'Download URL retrieved successfully',
        data: {
          downloadUrl: material.file_path,
          fileName: material.file_name,
          fileSize: material.file_size,
        },
      } as ApiResponse);

    } catch (error) {
      console.error('Download material error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to process download',
      } as ApiResponse);
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getStats(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Get total approved materials
      const { count: totalMaterials } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // Get total downloads
      const { data: materials } = await supabase
        .from('materials')
        .select('download_count');

      const totalDownloads = materials?.reduce((sum: number, m: { download_count?: number }) => sum + (m.download_count || 0), 0) || 0;

      // Get active users count
      let activeUsers = 0;
      try {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        activeUsers = count || 0;
      } catch (error) {
        console.warn('Could not get user count:', error);
      }

      // Get disciplines count
      let totalDisciplines = 0;
      try {
        const { count } = await supabase
          .from('disciplines')
          .select('*', { count: 'exact', head: true });
        totalDisciplines = count || 0;
      } catch (error) {
        console.warn('Could not get disciplines count:', error);
      }

      // Get average rating across all materials
      let averageRating = 0;
      try {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating');
        if (reviews && reviews.length > 0) {
          const totalRating = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
          averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
        }
      } catch (error) {
        console.warn('Could not get average rating:', error);
      }

      res.json({
        success: true,
        data: {
          totalMaterials: totalMaterials || 0,
          activeUsers: activeUsers || 0,
          totalDownloads,
          totalDisciplines: totalDisciplines || 0,
          averageRating: averageRating || 0,
        },
      } as ApiResponse);

    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch statistics',
      } as ApiResponse);
    }
  }

  /**
   * Toggle bookmark for a material
   */
  static async toggleBookmark(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const result = await MaterialService.toggleBookmark(id, userId);

      res.json({
        success: true,
        data: result,
        message: result.bookmarked ? 'Material bookmarked' : 'Bookmark removed',
      } as ApiResponse);
    } catch (error) {
      console.error('Toggle bookmark error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to toggle bookmark',
      } as ApiResponse);
    }
  }

  /**
   * Get user's bookmarked materials
   */
  static async getBookmarks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const bookmarks = await MaterialService.getBookmarkedMaterials(userId, page, limit);

      // Return the paginated response directly (it already has success, data, and pagination)
      res.json(bookmarks);
    } catch (error) {
      console.error('Get bookmarks error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch bookmarks',
      } as ApiResponse);
    }
  }

  /**
   * Check if material is bookmarked
   */
  static async checkBookmark(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const isBookmarked = await MaterialService.isBookmarked(id, userId);

      res.json({
        success: true,
        data: { bookmarked: isBookmarked },
      } as ApiResponse);
    } catch (error) {
      console.error('Check bookmark error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to check bookmark status',
      } as ApiResponse);
    }
  }

  /**
   * Add or update review
   */
  static async addReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rating, review } = req.body;
      const userId = req.user!.id;

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        res.status(400).json({
          success: false,
          error: 'Invalid rating',
          message: 'Rating must be between 1 and 5',
        } as ApiResponse);
        return;
      }

      const result = await MaterialService.addOrUpdateReview(id, userId, rating, review);

      // Notify material uploader about the review
      try {
        // Get material details to find uploader and title
        const { data: material } = await supabase
          .from('materials')
          .select('uploaded_by, title')
          .eq('id', id)
          .single();

        if (material && material.uploaded_by && material.uploaded_by !== userId) {
          // Get reviewer's name
          const { data: reviewer } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();

          await NotificationService.notifyMaterialReviewed(
            material.uploaded_by,
            material.title,
            reviewer?.full_name || 'Someone',
            rating
          );
        }
      } catch (notifError) {
        console.error('Failed to send review notification:', notifError);
      }

      res.json({
        success: true,
        data: result,
        message: 'Review submitted successfully',
      } as ApiResponse);
    } catch (error) {
      console.error('Add review error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to submit review',
      } as ApiResponse);
    }
  }

  /**
   * Get reviews for a material
   */
  static async getReviews(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await MaterialService.getReviews(id, page, limit);

      res.json({
        success: true,
        data: result,
      } as ApiResponse);
    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch reviews',
      } as ApiResponse);
    }
  }

  /**
   * Delete a material (only by uploader or discipline admin)
   */
  static async deleteMaterial(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      // Log the delete attempt for debugging
      console.log('Delete request:', {
        materialId: id,
        userId: user.id,
        userRole: user.role,
        userEmail: user.email
      });

      await MaterialService.deleteMaterial(id, user.id, user.role);

      res.json({
        success: true,
        message: 'Material deleted successfully',
      } as ApiResponse);
    } catch (error) {
      console.error('Delete material error:', error);

      if (error instanceof Error) {
        if (error.message === 'Material not found') {
          res.status(404).json({
            success: false,
            error: 'Not Found',
            message: error.message,
          } as ApiResponse);
          return;
        }

        if (error.message.includes('Unauthorized')) {
          res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: error.message,
          } as ApiResponse);
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete material',
      } as ApiResponse);
    }
  }

  /**
   * Track material view (add to history)
   */
  static async trackView(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Call Supabase function to upsert view history
      const { error } = await supabase.rpc('upsert_view_history', {
        p_user_id: userId,
        p_material_id: id
      });

      if (error) throw error;

      res.json({
        success: true,
        message: 'View tracked successfully',
      } as ApiResponse);
    } catch (error) {
      console.error('Track view error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to track view',
      } as ApiResponse);
    }
  }

  /**
   * Get user's view history
   */
  static async getViewHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 10;

      const { data, error } = await supabase
        .from('view_history')
        .select(`
          *,
          material:materials(
            *,
            discipline:disciplines(id, name, code),
            batch:batches(id, code, year, semester),
            course_code:course_codes(id, code, title)
          )
        `)
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      res.json({
        success: true,
        message: 'View history fetched successfully',
        data: data || [],
      } as ApiResponse);
    } catch (error) {
      console.error('Get view history error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch view history',
      } as ApiResponse);
    }
  }

  /**
   * Generate share link for material
   */
  static async generateShareLink(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Get or generate share token
      const { data: material, error: fetchError } = await supabase
        .from('materials')
        .select('share_token')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      let shareToken = material.share_token;

      // Generate token if doesn't exist
      if (!shareToken) {
        const { data: tokenData, error: rpcError } = await supabase.rpc('generate_share_token');

        if (rpcError) {
          console.error('RPC error:', rpcError);
          throw rpcError;
        }

        if (!tokenData) {
          throw new Error('Failed to generate token');
        }

        shareToken = tokenData;

        const { error: updateError } = await supabase
          .from('materials')
          .update({ share_token: shareToken })
          .eq('id', id);

        if (updateError) throw updateError;
      }

      res.json({
        success: true,
        message: 'Share link generated successfully',
        data: { shareToken },
      } as ApiResponse);
    } catch (error) {
      console.error('Generate share link error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to generate share link',
      } as ApiResponse);
    }
  }

  /**
   * Get user's uploaded materials
   */
  static async getUserUploads(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          discipline:disciplines(id, name, code),
          batch:batches(id, code, year, semester),
          course_code:course_codes(id, code, title)
        `)
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        message: 'User uploads fetched successfully',
        data: data || [],
      } as ApiResponse);
    } catch (error) {
      console.error('Get user uploads error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch user uploads',
      } as ApiResponse);
    }
  }

  /**
   * Get comprehensive admin dashboard statistics
   */
  static async getAdminDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Parse date range from query
      const dateRange = req.query.dateRange as string || 'all';

      // Calculate the date filter based on range
      let dateFilter: Date | null = null;
      const now = new Date();
      switch (dateRange) {
        case '7d':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3m':
          dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFilter = null; // All time
      }

      const dateFilterISO = dateFilter ? dateFilter.toISOString() : null;

      // Get total users count (filtered by date if specified)
      let usersQuery = supabase.from('profiles').select('*', { count: 'exact', head: true });
      if (dateFilterISO) {
        usersQuery = usersQuery.gte('created_at', dateFilterISO);
      }
      const { count: totalUsers } = await usersQuery;

      // Get total approved materials (filtered by date if specified)
      let materialsQuery = supabase.from('materials').select('*', { count: 'exact', head: true }).eq('status', 'approved');
      if (dateFilterISO) {
        materialsQuery = materialsQuery.gte('created_at', dateFilterISO);
      }
      const { count: totalMaterials } = await materialsQuery;

      // Get pending materials count
      const { count: pendingApprovals } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get total downloads (from materials in date range)
      let downloadsQuery = supabase.from('materials').select('download_count');
      if (dateFilterISO) {
        downloadsQuery = downloadsQuery.gte('created_at', dateFilterISO);
      }
      const { data: materials } = await downloadsQuery;
      const totalDownloads = materials?.reduce((sum: number, m: { download_count?: number }) => sum + (m.download_count || 0), 0) || 0;

      // Get category distribution (filtered by date if specified)
      let categoryQuery = supabase.from('materials').select('category').eq('status', 'approved');
      if (dateFilterISO) {
        categoryQuery = categoryQuery.gte('created_at', dateFilterISO);
      }
      const { data: categoryData } = await categoryQuery;

      const categoryDistribution: Record<string, number> = {};
      let totalCategoryCount = 0;
      categoryData?.forEach((m: { category?: string }) => {
        const cat = m.category || 'other';
        categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
        totalCategoryCount++;
      });

      // Convert to percentages
      const categoryPercentages = Object.entries(categoryDistribution).map(([category, count]) => ({
        category,
        count,
        percentage: totalCategoryCount > 0 ? Math.round((count / totalCategoryCount) * 100) : 0,
      })).sort((a, b) => b.count - a.count);

      // Get top contributors (users with most uploads)
      const { data: topContributorsData } = await supabase
        .from('materials')
        .select(`
          uploaded_by,
          profiles!materials_uploaded_by_fkey (
            id,
            full_name,
            role,
            avatar_url
          )
        `)
        .eq('status', 'approved');

      // Count uploads per user
      const uploadsPerUser: Record<string, { count: number; user: any }> = {};
      topContributorsData?.forEach((m: any) => {
        if (m.uploaded_by && m.profiles) {
          if (!uploadsPerUser[m.uploaded_by]) {
            uploadsPerUser[m.uploaded_by] = { count: 0, user: m.profiles };
          }
          uploadsPerUser[m.uploaded_by].count++;
        }
      });

      // Sort and get top 5
      const topContributors = Object.entries(uploadsPerUser)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([userId, data], index) => ({
          id: userId,
          fullName: data.user.full_name,
          role: data.user.role,
          avatarUrl: data.user.avatar_url,
          uploadCount: data.count,
          badge: index === 0 ? 'top_rated' : index === 1 ? 'rising_star' : data.user.role === 'teacher' ? 'verified' : 'contributor',
        }));

      // Get recent activity (last 10 activities)
      const { data: recentMaterials } = await supabase
        .from('materials')
        .select(`
          id,
          title,
          status,
          created_at,
          approved_at,
          profiles!materials_uploaded_by_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      const recentActivity = recentMaterials?.map((m: any) => ({
        id: m.id,
        type: m.status === 'pending' ? 'upload' : m.status === 'approved' ? 'approval' : 'rejection',
        title: m.title,
        userName: m.profiles?.full_name || 'Unknown',
        createdAt: m.created_at,
        status: m.status,
      })) || [];

      // Get recent user registrations
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      const userActivity = recentUsers?.map((u: any) => ({
        id: u.id,
        type: 'registration',
        title: `${u.full_name} registered as ${u.role}`,
        userName: u.full_name,
        createdAt: u.created_at,
        status: 'active',
      })) || [];

      // Merge and sort all activities
      const allActivity = [...recentActivity, ...userActivity]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      res.json({
        success: true,
        message: 'Admin dashboard stats fetched successfully',
        data: {
          stats: {
            totalUsers: totalUsers || 0,
            totalMaterials: totalMaterials || 0,
            totalDownloads,
            pendingApprovals: pendingApprovals || 0,
          },
          categoryDistribution: categoryPercentages,
          topContributors,
          recentActivity: allActivity,
        },
      } as ApiResponse);

    } catch (error) {
      console.error('Get admin dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch admin dashboard statistics',
      } as ApiResponse);
    }
  }
}