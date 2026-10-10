import { Router } from 'express';
import {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../controllers/scheduleController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, createScheduleSchema, updateScheduleSchema } from '../middleware/validation';

const router = Router();

// Public routes - all authenticated users can view schedules
router.get('/', authenticate, getSchedules);
router.get('/:id', authenticate, getScheduleById);

// Admin/Super Admin only routes
router.post('/', authenticate, authorize(['admin', 'super_admin']), validate(createScheduleSchema), createSchedule);
router.put('/:id', authenticate, authorize(['admin', 'super_admin']), validate(updateScheduleSchema), updateSchedule);
router.delete('/:id', authenticate, authorize(['admin', 'super_admin']), deleteSchedule);

export default router;
