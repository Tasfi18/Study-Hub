import { supabase } from '../config/supabase';

export type NotificationType = 'approval' | 'rejection' | 'download' | 'system';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export class NotificationService {
  static async create(params: CreateNotificationParams) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserNotifications(userId: string, unreadOnly = false) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async markAsRead(notificationId: string, userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true };
  }

  static async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  static async delete(notificationId: string, userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  // Helper Methods for Specific Notifications

  /**
   * Notify admins/teachers when new material is uploaded
   */
  static async notifyMaterialUploaded(materialId: string, materialTitle: string, disciplineId: string) {
    try {
      // Get all admins and teachers from the same discipline
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('discipline_id', disciplineId)
        .in('role', ['admin', 'teacher']);

      if (error || !users || users.length === 0) return;

      // Create notifications for all admins/teachers
      const notifications = users.map(user => ({
        user_id: user.id,
        type: 'system' as const,
        title: 'New Material Uploaded',
        message: `A new material "${materialTitle}" has been uploaded and is pending approval.`,
        data: { materialId, materialTitle },
      }));

      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Failed to notify material upload:', error);
    }
  }

  /**
   * Notify material uploader when someone reviews their material
   */
  static async notifyMaterialReviewed(uploaderId: string, materialTitle: string, reviewerName: string, rating: number) {
    try {
      await this.create({
        userId: uploaderId,
        type: 'system',
        title: 'New Review Received',
        message: `${reviewerName} rated your material "${materialTitle}" with ${rating} star${rating !== 1 ? 's' : ''}.`,
        data: { materialTitle, reviewerName, rating },
      });
    } catch (error) {
      console.error('Failed to notify material review:', error);
    }
  }

  /**
   * Notify batch students about new election
   */
  static async notifyNewElection(batchId: string, electionTitle: string, electionId: string) {
    try {
      // Get all students in the batch
      const { data: students, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('batch_id', batchId)
        .eq('role', 'student');

      if (error || !students || students.length === 0) return;

      const notifications = students.map(student => ({
        user_id: student.id,
        type: 'system' as const,
        title: 'New Election Created',
        message: `A new election "${electionTitle}" has been created for your batch.`,
        data: { electionId, electionTitle },
      }));

      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Failed to notify new election:', error);
    }
  }

  /**
   * Notify when election status changes
   */
  static async notifyElectionStatusChange(batchId: string, electionTitle: string, status: string, electionId: string) {
    try {
      const { data: students, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('batch_id', batchId)
        .eq('role', 'student');

      if (error || !students || students.length === 0) return;

      let message = '';
      if (status === 'active') {
        message = `Voting has started for "${electionTitle}". Cast your vote now!`;
      } else if (status === 'ended') {
        message = `Voting has ended for "${electionTitle}". Results will be announced soon.`;
      }

      if (!message) return;

      const notifications = students.map(student => ({
        user_id: student.id,
        type: 'system' as const,
        title: 'Election Update',
        message,
        data: { electionId, electionTitle, status },
      }));

      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Failed to notify election status change:', error);
    }
  }

  /**
   * Notify when a user is nominated as candidate
   */
  static async notifyCandidateNominated(userId: string, electionTitle: string, position: string) {
    try {
      await this.create({
        userId,
        type: 'system',
        title: 'Nominated as Candidate',
        message: `You have been nominated for the position of ${position} in "${electionTitle}".`,
        data: { electionTitle, position },
      });
    } catch (error) {
      console.error('Failed to notify candidate nomination:', error);
    }
  }

  /**
   * Notify discipline students about new schedule
   */
  static async notifyNewSchedule(disciplineId: string, scheduleTitle: string, scheduleType: string, scheduleDate: string) {
    try {
      // Get all users from the discipline
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('discipline_id', disciplineId);

      if (error || !users || users.length === 0) return;

      const notifications = users.map(user => ({
        user_id: user.id,
        type: 'system' as const,
        title: `New ${scheduleType} Scheduled`,
        message: `${scheduleTitle} has been scheduled for ${new Date(scheduleDate).toLocaleDateString()}.`,
        data: { scheduleTitle, scheduleType, scheduleDate },
      }));

      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Failed to notify new schedule:', error);
    }
  }

  /**
   * Notify about schedule updates
   */
  static async notifyScheduleUpdated(disciplineId: string, scheduleTitle: string, scheduleType: string) {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('discipline_id', disciplineId);

      if (error || !users || users.length === 0) return;

      const notifications = users.map(user => ({
        user_id: user.id,
        type: 'system' as const,
        title: `${scheduleType} Updated`,
        message: `The ${scheduleType.toLowerCase()} "${scheduleTitle}" has been updated. Please check the details.`,
        data: { scheduleTitle, scheduleType },
      }));

      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Failed to notify schedule update:', error);
    }
  }
}
