import { Router } from 'express';
import fileUpload from 'express-fileupload';
import { QuestionsController } from '../controllers/questions';
import { authenticate } from '../middleware/auth';

const router = Router();

// File upload middleware for image attachments
const imageUploadMiddleware = fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
  abortOnLimit: true,
  responseOnLimit: 'Image size exceeds the maximum allowed limit (5MB).',
  useTempFiles: false,
});

// All routes require authentication for discipline-based filtering
router.use(authenticate);

// Question routes
router.get('/', QuestionsController.getQuestions);
router.get('/:id', QuestionsController.getQuestion);
router.post('/', imageUploadMiddleware, QuestionsController.createQuestion);
router.post('/:id/answers', imageUploadMiddleware, QuestionsController.createAnswer);
router.put('/:questionId/answers/:answerId/accept', QuestionsController.acceptAnswer);

export default router;
