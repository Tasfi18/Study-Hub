import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ApiResponse } from '../types';

/**
 * Generic validation middleware factory
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorDetails = error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        );

        // Log which fields failed, never the submitted values (they can include personal data).
        console.error('Validation failed:', errorDetails);

        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid request data',
          details: errorDetails,
        } as ApiResponse);
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Validation processing failed',
      } as ApiResponse);
    }
  };
};

// Common validation schemas
export const uploadMaterialSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  disciplineId: z.string().min(1, 'Discipline ID is required'),
  batchId: z.string().min(1).optional().or(z.literal('')),
  courseCodeId: z.string().min(1).optional().or(z.literal('')),
  category: z.enum(['previous_question', 'ct_question', 'final_question', 'assignment', 'lecture_note', 'lab_manual', 'syllabus', 'other']).optional(),
  tags: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return val ? val.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      }
      return val;
    },
    z.array(z.string().max(50, 'Tag too long')).max(10, 'Too many tags').optional()
  ),
});

export const updateMaterialSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const approveMaterialSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().max(500).optional(),
});

export const presignedUrlSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive('File size must be positive'),
  contentType: z.string().min(1, 'Content type is required'),
  disciplineId: z.string().min(1, 'Discipline ID is required'),
});

export const confirmUploadSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional().or(z.literal('')),
  disciplineId: z.string().min(1, 'Discipline ID is required'),
  batchId: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  courseCodeId: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  category: z.enum(['previous_question', 'ct_question', 'final_question', 'assignment', 'lecture_note', 'lab_manual', 'syllabus', 'other']).optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  tags: z.array(z.string().max(50, 'Tag too long')).max(10, 'Too many tags').optional().default([]),
  filePath: z.string().min(1, 'File path is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
});

// Schedule validation schemas
export const createScheduleSchema = z.object({
  type: z.enum(['class_test', 'lab_test', 'routine', 'assignment', 'viva', 'presentation', 'project', 'other'], {
    errorMap: () => ({ message: 'Invalid schedule type' })
  }),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  discipline_id: z.string().uuid('Invalid discipline ID'),
  course_code_id: z.string().uuid('Invalid course code ID').optional(),
  term: z.string().min(1, 'Term is required').max(50, 'Term too long'),
  schedule_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  syllabus: z.string().max(2000, 'Syllabus too long').optional(),
});

export const updateScheduleSchema = createScheduleSchema.partial();
// Election validation schemas
export const createElectionSchema = z.object({
  batch_id: z.string().uuid('Invalid batch ID'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: 'End date must be after start date',
  path: ['end_date'],
});

export const nominateCandidateSchema = z.object({
  manifesto: z.string().min(50, 'Manifesto must be at least 50 characters').max(2000, 'Manifesto too long'),
});

export const updateCandidateStatusSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be either approved or rejected' })
  }),
  rejection_reason: z.string().max(500, 'Rejection reason too long').optional(),
});

export const castVoteSchema = z.object({
  candidate_id: z.string().uuid('Invalid candidate ID'),
});
