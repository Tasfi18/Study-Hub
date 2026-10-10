import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/notifications - Get all notifications (query: unreadOnly=true for unread only)
router.get('/', getNotifications);

// GET /api/notifications/unread-count - Get count of unread notifications
router.get('/unread-count', getUnreadCount);

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', markAsRead);

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', deleteNotification);

export default router;
