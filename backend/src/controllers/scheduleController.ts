import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest, Schedule, ApiResponse, PaginatedResponse } from '../types';
import { NotificationService } from '../services/notificationService';

/**
 * Get all schedules with filters
 * Users see only schedules from their discipline (except super_admin)
 */
export const getSchedules = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      type,
      discipline,
      term,
      date,
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('schedules')
      .select(`
        *,
        discipline:disciplines(name, code),
        course_code:course_codes(code, title),
        created_by_profile:profiles(full_name)
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('schedule_date', { ascending: false });

    // Apply discipline-based filtering for all users except super_admin
    if (req.user && req.user.role !== 'super_admin' && req.user.discipline_id) {
      query = query.eq('discipline_id', req.user.discipline_id);
    }

    if (type) query = query.eq('type', type);
    if (discipline) query = query.eq('discipline_id', discipline);
    if (term) query = query.eq('term', term);
    if (date) query = query.eq('schedule_date', date);

    const { data: schedules, error, count } = await query
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    const response: PaginatedResponse<Schedule[]> = {
      success: true,
      message: 'Schedules retrieved successfully',
      data: schedules as Schedule[],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get schedules error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve schedules',
      message: error.message,
    } as ApiResponse);
  }
};

/**
 * Get schedule by ID
 */
export const getScheduleById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: schedule, error } = await supabase
      .from('schedules')
      .select(`
        *,
        discipline:disciplines(name, code),
        course_code:course_codes(code, title),
        created_by_profile:profiles(full_name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Schedule retrieved successfully',
      data: schedule,
    } as ApiResponse<Schedule>);
  } catch (error: any) {
    console.error('Get schedule error:', error);
    res.status(404).json({
      success: false,
      error: 'Schedule not found',
      message: error.message,
    } as ApiResponse);
  }
};

/**
 * Create new schedule (Admin/Super Admin only)
 */
export const createSchedule = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      type,
      title,
      description,
      discipline_id,
      course_code_id,
      term,
      schedule_date,
      syllabus,
    } = req.body;

    // Check discipline authorization: admin can only create schedules for their own discipline
    if (req.user!.role === 'admin' && req.user!.discipline_id !== discipline_id) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only create schedules for your own discipline',
      } as ApiResponse);
      return;
    }

    const { data: schedule, error } = await supabase
      .from('schedules')
      .insert({
        type,
        title,
        description,
        discipline_id,
        course_code_id,
        term,
        schedule_date,
        syllabus,
        created_by: req.user!.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Notify discipline users about new schedule
    try {
      await NotificationService.notifyNewSchedule(
        discipline_id,
        title,
        type,
        schedule_date
      );
    } catch (notifError) {
      console.error('Failed to send schedule notification:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: schedule,
    } as ApiResponse<Schedule>);
  } catch (error: any) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create schedule',
      message: error.message,
    } as ApiResponse);
  }
};

/**
 * Update schedule (Admin/Super Admin only)
 */
export const updateSchedule = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      type,
      title,
      description,
      discipline_id,
      course_code_id,
      term,
      schedule_date,
      syllabus,
    } = req.body;

    // Check discipline authorization: admin can only update schedules for their own discipline
    if (req.user!.role === 'admin') {
      // First, get the existing schedule to check its discipline
      const { data: existingSchedule, error: fetchError } = await supabase
        .from('schedules')
        .select('discipline_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingSchedule) {
        res.status(404).json({
          success: false,
          error: 'Schedule not found',
          message: 'The schedule you are trying to update does not exist',
        } as ApiResponse);
        return;
      }

      // Check if admin can update this schedule (must be their discipline)
      if (existingSchedule.discipline_id !== req.user!.discipline_id) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only update schedules for your own discipline',
        } as ApiResponse);
        return;
      }

      // Also check the new discipline_id if it's being changed
      if (discipline_id && discipline_id !== req.user!.discipline_id) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You cannot change schedule to a different discipline',
        } as ApiResponse);
        return;
      }
    }

    const { data: schedule, error } = await supabase
      .from('schedules')
      .update({
        type,
        title,
        description,
        discipline_id,
        course_code_id,
        term,
        schedule_date,
        syllabus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notify discipline users about schedule update
    try {
      await NotificationService.notifyScheduleUpdated(
        schedule.discipline_id,
        schedule.title,
        schedule.type
      );
    } catch (notifError) {
      console.error('Failed to send schedule update notification:', notifError);
    }

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: schedule,
    } as ApiResponse<Schedule>);
  } catch (error: any) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update schedule',
      message: error.message,
    } as ApiResponse);
  }
};

/**
 * Delete schedule (Admin/Super Admin only)
 */
export const deleteSchedule = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check discipline authorization: admin can only delete schedules for their own discipline
    if (req.user!.role === 'admin') {
      const { data: existingSchedule, error: fetchError } = await supabase
        .from('schedules')
        .select('discipline_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingSchedule) {
        res.status(404).json({
          success: false,
          error: 'Schedule not found',
          message: 'The schedule you are trying to delete does not exist',
        } as ApiResponse);
        return;
      }

      if (existingSchedule.discipline_id !== req.user!.discipline_id) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only delete schedules for your own discipline',
        } as ApiResponse);
        return;
      }
    }

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Schedule deleted successfully',
    } as ApiResponse);
  } catch (error: any) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete schedule',
      message: error.message,
    } as ApiResponse);
  }
};
