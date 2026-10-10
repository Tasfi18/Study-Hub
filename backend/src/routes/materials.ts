import { Router } from 'express';
import fileUpload from 'express-fileupload';
import os from 'os';
import { MaterialController } from '../controllers/materialController';
import { authenticate, optionalAuthenticate, authorizeDisciplineAction, authorizeTeacherDisciplineAction } from '../middleware/auth';
import { validate, uploadMaterialSchema, approveMaterialSchema, presignedUrlSchema, confirmUploadSchema } from '../middleware/validation';
import { fileConfig } from '../config';
import { ADMIN_ROLES } from '../types';

const router = Router();

// File upload middleware
router.use(fileUpload({
  limits: { fileSize: fileConfig.maxFileSize },
  abortOnLimit: true,
  responseOnLimit: 'File size exceeds the maximum allowed limit.',
  useTempFiles: true,
  tempFileDir: os.tmpdir(),
  createParentPath: true,
  safeFileNames: true,
  preserveExtension: true,
  uploadTimeout: 5 * 60 * 1000,
}));

// Public routes (with optional auth for user-specific features like bookmarks)
router.get('/', optionalAuthenticate, MaterialController.getMaterials);
router.get('/stats', optionalAuthenticate, MaterialController.getStats);
router.get('/:id', optionalAuthenticate, MaterialController.getMaterialById);
router.get('/:id/reviews', optionalAuthenticate, MaterialController.getReviews);

// Protected routes - require authentication
router.use(authenticate);

// Direct upload routes
router.post('/presigned-url', validate(presignedUrlSchema), MaterialController.getPresignedUploadUrl);
router.post('/confirm-upload', validate(confirmUploadSchema), MaterialController.confirmUpload);

// Student, Teacher, and Admin routes
router.post('/', validate(uploadMaterialSchema), MaterialController.uploadMaterial);

// User uploads route (must be before :id routes)
router.get('/user/uploads', MaterialController.getUserUploads);
router.get('/admin/dashboard-stats', authorizeDisciplineAction(ADMIN_ROLES), MaterialController.getAdminDashboardStats);
router.get('/:id/download', MaterialController.downloadMaterial);

// Delete material (only by uploader, admin, or super admin)
router.delete('/:id', authorizeDisciplineAction(ADMIN_ROLES), MaterialController.deleteMaterial);

// Review routes
router.post('/:id/review', MaterialController.addReview);

// Bookmark routes
router.post('/:id/bookmark', MaterialController.toggleBookmark);
router.get('/bookmarks/list', MaterialController.getBookmarks);
router.get('/:id/bookmark/status', MaterialController.checkBookmark);

// View history routes
router.post('/:id/view', MaterialController.trackView);
router.get('/history/views', MaterialController.getViewHistory);

// Share link route
router.post('/:id/share', MaterialController.generateShareLink);



// Teacher and Admin only routes - with discipline-specific authorization for approval/rejection
router.patch(
  '/:id/status',
  authorizeTeacherDisciplineAction(),
  validate(approveMaterialSchema),
  MaterialController.updateMaterialStatus
);

export default router;