import { Response } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest, ApiResponse, QuestionFilters } from '../types';
import { generateUniqueFileName } from '../utils/fileUtils';
import { NotificationService } from '../services/notificationService';

// Validation schemas
const createQuestionSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  disciplineId: z.string().uuid(),
  batchId: z.string().uuid().optional(),
  courseCodeId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});

const createAnswerSchema = z.object({
  content: z.string().min(1),
});

export class QuestionsController {
  // Get all questions with filters
  static async getQuestions(req: AuthenticatedRequest, res: Response) {
    try {
      const filters: QuestionFilters = req.query;
      const page = Math.max(1, parseInt(String(filters.page || '1')) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(String(filters.limit || '10')) || 10));
      const offset = (page - 1) * limit;

      let query = supabase
        .from('questions')
        .select(`
          *,
          discipline:disciplines(id, name, code),
          batch:batches(id, code, year, semester),
          course_code:course_codes(id, code, title),
          asked_by_profile:profiles!asked_by(id, full_name, role)
        `)
        .order('created_at', { ascending: false });

      // Apply discipline-based filtering for all users except super_admin
      if (req.user && req.user.role !== 'super_admin' && req.user.discipline_id) {
        query = query.eq('discipline_id', req.user.discipline_id);
      }

      // Apply filters
      if (filters.discipline) query = query.eq('discipline_id', filters.discipline);
      if (filters.batch) query = query.eq('batch_id', filters.batch);
      if (filters.courseCode) query = query.eq('course_code_id', filters.courseCode);
      if (filters.solved !== undefined) query = query.eq('is_solved', filters.solved);
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) throw error;

      // Get answer counts for each question
      const questionsWithCounts = await Promise.all(
        (data || []).map(async (question) => {
          const { count } = await supabase
            .from('answers')
            .select('*', { count: 'exact', head: true })
            .eq('question_id', question.id);
          
          return {
            ...question,
            answer_count: count || 0
          };
        })
      );

      return res.json({
        success: true,
        message: 'Questions retrieved successfully',
        data: questionsWithCounts,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      } as ApiResponse);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve questions',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse);
    }
  }

  // Get single question with answers
  static async getQuestion(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // Increment view count
      await supabase.rpc('increment_question_views', { question_id: id });

      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          discipline:disciplines(id, name, code),
          batch:batches(id, code, year, semester),
          course_code:course_codes(id, code, title),
          asked_by_profile:profiles!asked_by(id, full_name, role),
          answers:answers(
            *,
            answered_by_profile:profiles!answered_by(id, full_name, role)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Question not found',
        } as ApiResponse);
      }

      return res.json({
        success: true,
        message: 'Question retrieved successfully',
        data,
      } as ApiResponse);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve question',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse);
    }
  }

  // Create new question
  static async createQuestion(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      let imageUrl: string | null = null;
      let imageFilename: string | null = null;

      // Handle image upload if present
      if (req.files && req.files.image) {
        const uploadedFile = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;

        // Validate file type (images only)
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(uploadedFile.mimetype)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid file type',
            message: 'Only image files (JPG, PNG, GIF, WebP) are allowed',
          } as ApiResponse);
        }

        // Generate unique filename and upload to Supabase Storage
        const uniqueFileName = generateUniqueFileName(uploadedFile.name);
        const filePath = `qa-images/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('study-materials')
          .upload(filePath, uploadedFile.data, {
            contentType: uploadedFile.mimetype,
            upsert: false,
          });

        if (uploadError) {
          return res.status(500).json({
            success: false,
            error: 'Failed to upload image',
            message: uploadError.message,
          } as ApiResponse);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('study-materials')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
        imageFilename = uploadedFile.name;

        console.log('Image uploaded successfully:', { imageUrl, imageFilename });
      }

      // Validate text data
      const textData = {
        title: req.body.title,
        content: req.body.content,
        disciplineId: req.body.disciplineId,
        batchId: req.body.batchId || undefined,
        courseCodeId: req.body.courseCodeId || undefined,
        tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
      };

      const validation = createQuestionSchema.safeParse(textData);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: validation.error.errors.map(e => e.message),
        } as ApiResponse);
      }

      const questionData = validation.data;

      // Check discipline authorization: users can only create questions in their own discipline
      if (req.user!.role !== 'super_admin' && req.user!.discipline_id !== questionData.disciplineId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized',
          message: 'You can only create questions in your own discipline',
        } as ApiResponse);
      }

      const { data, error } = await supabase
        .from('questions')
        .insert({
          title: questionData.title,
          content: questionData.content,
          discipline_id: questionData.disciplineId,
          batch_id: questionData.batchId || null,
          course_code_id: questionData.courseCodeId || null,
          asked_by: userId,
          tags: questionData.tags || [],
          image_url: imageUrl,
          image_filename: imageFilename,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Question created:', { id: data.id, imageUrl, imageFilename });

      return res.status(201).json({
        success: true,
        message: 'Question created successfully',
        data,
      } as ApiResponse);
    } catch (error) {
      console.error('Create question error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create question',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse);
    }
  }

  // Create answer for a question
  static async createAnswer(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: questionId } = req.params;
      const userId = req.user!.id;
      let imageUrl: string | null = null;
      let imageFilename: string | null = null;

      // Handle image upload if present
      if (req.files && req.files.image) {
        const uploadedFile = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
        
        // Validate file type (images only)
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(uploadedFile.mimetype)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid file type',
            message: 'Only image files (JPG, PNG, GIF, WebP) are allowed',
          } as ApiResponse);
        }

        // Generate unique filename and upload to Supabase Storage
        const uniqueFileName = generateUniqueFileName(uploadedFile.name);
        const filePath = `qa-images/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('study-materials')
          .upload(filePath, uploadedFile.data, {
            contentType: uploadedFile.mimetype,
            upsert: false,
          });

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          return res.status(500).json({
            success: false,
            error: 'Failed to upload image',
            message: uploadError.message,
          } as ApiResponse);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('study-materials')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
        imageFilename = uploadedFile.name;

        console.log('Answer image uploaded successfully:', { imageUrl, imageFilename });
      }

      // Validate text data
      const textData = {
        content: req.body.content,
      };

      const validation = createAnswerSchema.safeParse(textData);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: validation.error.errors.map(e => e.message),
        } as ApiResponse);
      }

      const answerData = validation.data;

      const { data, error } = await supabase
        .from('answers')
        .insert({
          question_id: questionId,
          content: answerData.content,
          answered_by: userId,
          image_url: imageUrl,
          image_filename: imageFilename,
        })
        .select(`
          *,
          answered_by_profile:profiles!answered_by(id, full_name, role)
        `)
        .single();

      if (error) throw error;

      // Get question details for notification
      const { data: question } = await supabase
        .from('questions')
        .select('asked_by, title')
        .eq('id', questionId)
        .single();

      // Send notification to question author (if not answering their own question)
      if (question && question.asked_by && question.asked_by !== userId) {
        try {
          const answererName = data.answered_by_profile?.full_name || 'Someone';
          await NotificationService.create({
            userId: question.asked_by,
            type: 'system',
            title: 'New Answer to Your Question',
            message: `${answererName} answered your question "${question.title}"`,
            data: { 
              questionId, 
              answerId: data.id, 
              questionTitle: question.title 
            },
          });
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
          // Don't fail the request if notification fails
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Answer created successfully',
        data,
      } as ApiResponse);
    } catch (error) {
      console.error('Create answer error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create answer',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse);
    }
  }

  // Accept answer (only question author can do this)
  static async acceptAnswer(req: AuthenticatedRequest, res: Response) {
    try {
      const { questionId, answerId } = req.params;
      const userId = req.user!.id;

      // Verify user owns the question
      const { data: question } = await supabase
        .from('questions')
        .select('asked_by, title')
        .eq('id', questionId)
        .single();

      if (!question || question.asked_by !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Only the question author can accept answers',
        } as ApiResponse);
      }

      // Get answer details for notification
      const { data: answer } = await supabase
        .from('answers')
        .select('answered_by')
        .eq('id', answerId)
        .single();

      // Mark answer as accepted and question as solved
      // First, unaccept any previously accepted answers for this question
      await supabase
        .from('answers')
        .update({ is_accepted: false })
        .eq('question_id', questionId)
        .eq('is_accepted', true);

      // Now mark the new answer as accepted
      const { error: answerError } = await supabase
        .from('answers')
        .update({ is_accepted: true })
        .eq('id', answerId)
        .eq('question_id', questionId);

      if (answerError) throw answerError;

      const { error: questionError } = await supabase
        .from('questions')
        .update({ is_solved: true })
        .eq('id', questionId);

      if (questionError) throw questionError;

      // Send notification to answer author
      if (answer && answer.answered_by) {
        try {
          await NotificationService.create({
            userId: answer.answered_by,
            type: 'system',
            title: 'Your Answer Was Accepted',
            message: `Your answer to "${question.title}" has been marked as the accepted solution!`,
            data: { 
              questionId, 
              answerId, 
              questionTitle: question.title 
            },
          });
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
          // Don't fail the request if notification fails
        }
      }

      return res.json({
        success: true,
        message: 'Answer accepted successfully',
      } as ApiResponse);
    } catch (error) {
      console.error('Accept answer error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to accept answer',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse);
    }
  }
}
