import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAuth, supabase } from '../config/supabase';
import { config } from '../config';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';
import fileUpload from 'express-fileupload';
import { storageService } from '../services/storage';
import { generateUniqueFileName, isValidFileType, isValidMimeType } from '../utils/fileUtils';

const router = Router();

// File upload middleware - with parseNested option
router.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for profile images
  abortOnLimit: true,
  responseOnLimit: 'File size exceeds the maximum allowed limit.',
  useTempFiles: false, // Use memory instead of temp files
  parseNested: true, // Parse nested fields
}));

/**
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
        message: 'Email and password are required',
      } as ApiResponse);
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: error.message,
      } as ApiResponse);
    }

    // Fetch user profile from database to get role and other details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        discipline:disciplines(id, name, code),
        batch:batches(id, year, semester, code)
      `)
      .eq('id', data.user.id)
      .eq('is_active', true)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({
        success: false,
        error: 'Profile not found',
        message: 'User profile not found or inactive',
      } as ApiResponse);
    }

    // Generate JWT token
    const token = jwt.sign(
      { sub: data.user.id },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          discipline_id: profile.discipline_id,
          batch_id: profile.batch_id,
          student_id: profile.student_id,
          discipline: profile.discipline,
          batch: profile.batch,
        },
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Login processing failed',
    } as ApiResponse);
  }
});

/**
 * Register new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role = 'student', disciplineName, disciplineCode, batchId, studentId } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Email, password, and full name are required',
      } as ApiResponse);
    }

    // Validate discipline for all users
    if (!disciplineName && !disciplineCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Discipline is required for all users',
      } as ApiResponse);
    }

    // Look up discipline UUID if discipline name or code is provided
    let disciplineUUID: string | null = null;
    if (disciplineName || disciplineCode) {
      const { data: discipline } = await supabase
        .from('disciplines')
        .select('id')
        .or(disciplineName ? `name.eq.${disciplineName}` : `code.eq.${disciplineCode}`)
        .single();
      
      if (!discipline) {
        return res.status(400).json({
          success: false,
          error: 'Invalid discipline',
          message: `Discipline "${disciplineName || disciplineCode}" not found`,
        } as ApiResponse);
      }
      
      disciplineUUID = discipline.id;
    }

    // Create user in Supabase Auth
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
        emailRedirectTo: `${config.emailRedirectUrl}/`,
      },
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Registration failed',
        message: error.message,
      } as ApiResponse);
    }

    // Ensure profile is created (fallback if trigger fails)
    if (data.user) {
      try {
        // Prepare profile data
        const profileData: any = {
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          role: role,
        };

        // Add discipline_id if provided
        if (disciplineUUID) {
          profileData.discipline_id = disciplineUUID;
        }

        // Add batch_id if provided (typically for students)
        if (batchId) {
          profileData.batch_id = batchId;
        }

        // Add student_id if provided
        if (studentId) {
          profileData.student_id = studentId;
        }

        await supabase.from('profiles').upsert(profileData);
      } catch (profileError) {
        console.warn('Profile creation fallback failed:', profileError);
        // Don't fail registration if profile creation fails - trigger might have worked
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Check your email for verification.',
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Registration processing failed',
    } as ApiResponse);
  }
});

/**
 * Resend verification email
 */
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Missing email',
        message: 'Email is required',
      } as ApiResponse);
    }

    // Trigger resend verification email in Supabase
    const { error } = await supabaseAuth.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${config.emailRedirectUrl}/`,
      },
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Resend failed',
        message: error.message,
      } as ApiResponse);
    }

    return res.json({
      success: true,
      message: 'Verification email sent successfully',
    } as ApiResponse);

  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to resend verification email',
    } as ApiResponse);
  }
});

/**
 * Get current user profile (requires authentication)
 */
router.get('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        discipline:disciplines(id, name, code),
        batch:batches(id, year, semester, code)
      `)
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
        message: 'User profile not found',
      } as ApiResponse);
    }

    return res.json({
      success: true,
      message: 'Profile fetched successfully',
      data: profile,
    } as ApiResponse);

  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch profile',
    } as ApiResponse);
  }
});

/**
 * Update user profile (requires authentication)
 */
router.patch('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { disciplineName, disciplineCode, batchId, studentId, fullName } = req.body;

    // Prepare update data
    const updateData: any = {};

    if (fullName !== undefined) {
      updateData.full_name = fullName;
    }

    // Handle discipline lookup if provided
    if (disciplineName !== undefined || disciplineCode !== undefined) {
      if (disciplineName || disciplineCode) {
        const { data: discipline } = await supabase
          .from('disciplines')
          .select('id')
          .or(disciplineName ? `name.eq.${disciplineName}` : `code.eq.${disciplineCode}`)
          .single();
        
        if (!discipline) {
          return res.status(400).json({
            success: false,
            error: 'Invalid discipline',
            message: `Discipline "${disciplineName || disciplineCode}" not found`,
          } as ApiResponse);
        }
        
        updateData.discipline_id = discipline.id;
      } else {
        updateData.discipline_id = null;
      }
    }

    if (batchId !== undefined) {
      updateData.batch_id = batchId || null;
    }

    if (studentId !== undefined) {
      updateData.student_id = studentId || null;
    }

    // Handle avatar upload if file is present
    if (req.files && req.files.avatar) {
      const avatarFile = Array.isArray(req.files.avatar) 
        ? req.files.avatar[0] 
        : req.files.avatar;

      // Validate file type
      if (!isValidFileType(avatarFile.name, ['.jpg', '.jpeg', '.png', '.gif', '.webp'])) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type',
          message: 'Supported formats: JPG, PNG, GIF, WebP',
        } as ApiResponse);
      }

      if (!isValidMimeType(avatarFile.mimetype, [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp'
      ])) {
        return res.status(400).json({
          success: false,
          error: 'Invalid MIME type',
          message: 'Supported formats: JPG, PNG, GIF, WebP',
        } as ApiResponse);
      }

      // Generate unique filename and upload
      const uniqueFileName = generateUniqueFileName(avatarFile.name);
      const filePath = `avatars/${uniqueFileName}`;

      try {
        // Upload to storage service
        const publicUrl = await storageService.uploadFile(
          filePath, 
          avatarFile.data, 
          avatarFile.mimetype
        );
        
        // Add avatar URL to update data
        updateData.avatar_url = publicUrl;
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Upload failed',
          message: 'Failed to upload profile picture',
        } as ApiResponse);
      }
    }

    // Only proceed if there's something to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data to update',
        message: 'Please provide at least one field to update',
      } as ApiResponse);
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select(`
        *,
        discipline:disciplines(id, name, code),
        batch:batches(id, year, semester, code)
      `)
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({
        success: false,
        error: 'Update failed',
        message: `Failed to update profile: ${error.message}`,
      } as ApiResponse);
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    } as ApiResponse);

  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update profile',
    } as ApiResponse);
  }
});

/**
 * Get user statistics (uploads, bookmarks, reviews)
 */
router.get('/stats', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get uploads count
    const { count: uploadsCount, error: uploadsError } = await supabase
      .from('materials')
      .select('id', { count: 'exact', head: true })
      .eq('uploaded_by', userId);

    if (uploadsError) {
      throw new Error(`Failed to get uploads count: ${uploadsError.message}`);
    }

    // Get bookmarks count
    const { count: bookmarksCount, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (bookmarksError) {
      throw new Error(`Failed to get bookmarks count: ${bookmarksError.message}`);
    }

    // Get reviews count
    const { count: reviewsCount, error: reviewsError } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (reviewsError) {
      throw new Error(`Failed to get reviews count: ${reviewsError.message}`);
    }

    res.json({
      success: true,
      message: 'User stats fetched successfully',
      data: {
        uploads: uploadsCount || 0,
        bookmarks: bookmarksCount || 0,
        reviews: reviewsCount || 0,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch user stats',
    } as ApiResponse);
  }
});

/**
 * Complete profile after Google OAuth
 */
router.post('/complete-profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { role, disciplineName, studentId } = req.body;

    // Validate required fields
    if (!role || !disciplineName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Role and discipline are required',
      } as ApiResponse);
    }

    // Validate student ID for students
    if (role === 'student' && !studentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing student ID',
        message: 'Student ID is required for students',
      } as ApiResponse);
    }

    // Look up discipline UUID
    const { data: discipline } = await supabase
      .from('disciplines')
      .select('id')
      .eq('name', disciplineName)
      .single();
    
    if (!discipline) {
      return res.status(400).json({
        success: false,
        error: 'Invalid discipline',
        message: `Discipline "${disciplineName}" not found`,
      } as ApiResponse);
    }

    // Update profile with complete information
    const updateData: any = {
      role,
      discipline_id: discipline.id,
      is_active: true, // Activate account after profile completion
      updated_at: new Date().toISOString(),
    };

    if (role === 'student' && studentId) {
      updateData.student_id = studentId;
    }

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select(`
        *,
        discipline:disciplines(id, name, code),
        batch:batches(id, year, semester, code)
      `)
      .single();

    if (error) {
      console.error('Profile completion error:', error);
      return res.status(500).json({
        success: false,
        error: 'Update failed',
        message: `Failed to complete profile: ${error.message}`,
      } as ApiResponse);
    }

    // Generate permanent JWT token
    const token = jwt.sign(
      { sub: userId },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Profile completed successfully',
      data: {
        token,
        user: {
          id: updatedProfile.id,
          email: updatedProfile.email,
          full_name: updatedProfile.full_name,
          role: updatedProfile.role,
          discipline_id: updatedProfile.discipline_id,
          batch_id: updatedProfile.batch_id,
          student_id: updatedProfile.student_id,
          discipline: updatedProfile.discipline,
          batch: updatedProfile.batch,
        },
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Complete profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to complete profile',
    } as ApiResponse);
  }
});

export default router;