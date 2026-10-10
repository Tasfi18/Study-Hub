import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { supabase } from '../config/supabase';
import { LookupService } from '../services/lookupService';

export class CourseController {
  /**
   * Get all courses (with optional discipline filter)
   * Users see only courses from their discipline (except super_admin)
   */
  static async getCourses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { disciplineId } = req.query;
      const user = req.user;

      let query = supabase
        .from('course_codes')
        .select('*')
        .order('code');

      // Apply discipline-based filtering for all users except super_admin
      if (user && user.role !== 'super_admin' && user.discipline_id) {
        query = query.eq('discipline_id', user.discipline_id);
      }

      // Filter by discipline if provided (and user has permission)
      if (disciplineId) {
        const disciplineUUID = await LookupService.getDisciplineUUID(disciplineId as string);
        if (disciplineUUID) {
          query = query.eq('discipline_id', disciplineUUID);
        }
      }

      const { data, error } = await query;

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch courses',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Courses fetched successfully',
        data,
      } as ApiResponse);

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch courses',
      } as ApiResponse);
    }
  }

  /**
   * Create a new course code
   */
  static async createCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { code, title, disciplineId, year, term } = req.body;

      if (!code || !title || !disciplineId) {
        res.status(400).json({
          success: false,
          error: 'Code, title, and discipline ID are required',
        } as ApiResponse);
        return;
      }

      // Validate year and term if provided
      if (year && (isNaN(parseInt(year)) || parseInt(year) < 1 || parseInt(year) > 4)) {
        res.status(400).json({
          success: false,
          error: 'Year must be between 1 and 4',
        } as ApiResponse);
        return;
      }

      if (term && (isNaN(parseInt(term)) || parseInt(term) < 1 || parseInt(term) > 2)) {
        res.status(400).json({
          success: false,
          error: 'Term must be 1 or 2',
        } as ApiResponse);
        return;
      }

      const disciplineUUID = await LookupService.getDisciplineUUID(disciplineId);
      if (!disciplineUUID) {
        res.status(400).json({
          success: false,
          error: 'Invalid discipline ID',
        } as ApiResponse);
        return;
      }

      // Check discipline authorization: admins can only create courses for their own discipline
      if (req.user!.role === 'admin' && req.user!.discipline_id !== disciplineUUID) {
        res.status(403).json({
          success: false,
          error: 'Unauthorized',
          message: 'You can only create courses for your own discipline',
        } as ApiResponse);
        return;
      }

      const { data, error } = await supabase
        .from('course_codes')
        .insert({
          discipline_id: disciplineUUID,
          code: code.trim().toUpperCase(),
          title: title.trim(),
          year: year ? parseInt(year) : null,
          term: term ? parseInt(term) : null,
        })
        .select()
        .single();

      if (error) {
        res.status(409).json({
          success: false,
          error: 'Course code already exists',
        } as ApiResponse);
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data,
      } as ApiResponse);

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create course',
      } as ApiResponse);
    }
  }

  /**
   * Update an existing course
   */
  static async updateCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { code, title, disciplineId, year, term } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Course ID is required',
        } as ApiResponse);
        return;
      }

      // Validate year and term if provided
      if (year && (isNaN(parseInt(year)) || parseInt(year) < 1 || parseInt(year) > 4)) {
        res.status(400).json({
          success: false,
          error: 'Year must be between 1 and 4',
        } as ApiResponse);
        return;
      }

      if (term && (isNaN(parseInt(term)) || parseInt(term) < 1 || parseInt(term) > 2)) {
        res.status(400).json({
          success: false,
          error: 'Term must be 1 or 2',
        } as ApiResponse);
        return;
      }

      // Build update object dynamically
      const updateData: any = {};
      
      if (code !== undefined) {
        updateData.code = code.trim().toUpperCase();
      }
      
      if (title !== undefined) {
        updateData.title = title.trim();
      }
      
      if (disciplineId !== undefined) {
        const disciplineUUID = await LookupService.getDisciplineUUID(disciplineId);
        if (!disciplineUUID) {
          res.status(400).json({
            success: false,
            error: 'Invalid discipline ID',
          } as ApiResponse);
          return;
        }
        updateData.discipline_id = disciplineUUID;
      }
      
      if (year !== undefined) {
        updateData.year = year ? parseInt(year) : null;
      }
      
      if (term !== undefined) {
        updateData.term = term ? parseInt(term) : null;
      }

      const { data, error } = await supabase
        .from('course_codes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        res.status(400).json({
          success: false,
          error: 'Failed to update course',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Course updated successfully',
        data,
      } as ApiResponse);

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update course',
      } as ApiResponse);
    }
  }

  /**
   * Delete a course
   */
  static async deleteCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Course ID is required',
        } as ApiResponse);
        return;
      }

      const { error } = await supabase
        .from('course_codes')
        .delete()
        .eq('id', id);

      if (error) {
        res.status(400).json({
          success: false,
          error: 'Failed to delete course',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Course deleted successfully',
      } as ApiResponse);

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete course',
      } as ApiResponse);
    }
  }
}
