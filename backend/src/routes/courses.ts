import express from 'express';
import { CourseController } from '../controllers/courseController';
import { authenticate, authorize, authorizeCourseDisciplineAction } from '../middleware/auth';

const router = express.Router();

// Get all courses (Admin and Super Admin only)
router.get('/', authenticate, authorize(['admin', 'super_admin']), CourseController.getCourses);

// Create course (Admin and Super Admin only)
router.post('/', authenticate, authorize(['admin', 'super_admin']), CourseController.createCourse);

// Update course (Admin and Super Admin only, with discipline check)
router.put('/:id', authenticate, authorizeCourseDisciplineAction(['admin', 'super_admin']), CourseController.updateCourse);

// Delete course (Admin and Super Admin only, with discipline check)
router.delete('/:id', authenticate, authorizeCourseDisciplineAction(['admin', 'super_admin']), CourseController.deleteCourse);

export default router;
