import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import { config } from '../config';
import { AuthenticatedRequest, Profile, ApiResponse } from '../types';

/**
 * Optional authentication middleware that validates JWT tokens if present
 * Allows requests to proceed without authentication but attaches user if token is valid
 * Supports both backend JWT tokens and Supabase JWT tokens
 */
export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    // If no auth header, just proceed without user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    let userId: string | null = null;
    
    try {
      // Try to verify as backend JWT first
      try {
        const decoded = jwt.verify(token, config.jwt.secret) as { sub: string };
        userId = decoded.sub;
      } catch (backendJwtError) {
        // If backend JWT fails, try Supabase JWT
        const { data: { user }, error: supabaseError } = await supabase.auth.getUser(token);
        
        if (!supabaseError && user) {
          userId = user.id;
        }
      }
      
      if (userId) {
        // Fetch user profile from database
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .eq('is_active', true)
          .single();

        if (!error && profile) {
          // Attach user to request object if valid
          req.user = profile as Profile;
        }
      }
    } catch (tokenError) {
      // Invalid token, but we proceed without user for optional auth
      console.log('Optional auth: Invalid token, proceeding as guest');
    }
    
    next();
    
  } catch (error) {
    console.error('Optional authentication error:', error);
    // On error, just proceed without user
    next();
  }
};

/**
 * Authentication middleware that validates JWT tokens and attaches user to request
 * Supports both backend JWT tokens and Supabase JWT tokens
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No valid authorization token found',
      } as ApiResponse);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    let userId: string | null = null;
    
    // Try to verify as backend JWT first
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { sub: string };
      userId = decoded.sub;
    } catch (backendJwtError) {
      // If backend JWT fails, try Supabase JWT
      try {
        const { data: { user }, error: supabaseError } = await supabase.auth.getUser(token);
        
        if (supabaseError || !user) {
          throw new Error('Invalid Supabase token');
        }
        
        userId = user.id;
      } catch (supabaseJwtError) {
        // Both token types failed
        console.error('Token verification failed:', backendJwtError, supabaseJwtError);
        res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'Token verification failed',
        } as ApiResponse);
        return;
      }
    }
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Could not extract user ID from token',
      } as ApiResponse);
      return;
    }
    
    // Fetch user profile from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      // For Google OAuth users, profile might not exist yet
      // Create a minimal profile entry if user exists in auth
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
        
        if (!authError && authUser) {
          // Create minimal profile for new OAuth user
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
              avatar_url: authUser.user_metadata?.avatar_url || '',
              is_active: false, // Will be activated after profile completion
            })
            .select()
            .single();
          
          if (!insertError && newProfile) {
            req.user = newProfile as Profile;
            next();
            return;
          }
        }
      } catch (createError) {
        console.error('Failed to create profile for OAuth user:', createError);
      }
      
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'User not found or inactive',
      } as ApiResponse);
      return;
    }

    // Check if profile is active for regular operations
    // Skip this check for complete-profile endpoint
    if (!req.path.includes('/complete-profile') && !profile.is_active) {
      res.status(401).json({
        success: false,
        error: 'Account inactive',
        message: 'Please complete your profile to continue',
      } as ApiResponse);
      return;
    }

    // Attach user to request object
    req.user = profile as Profile;
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: 'Token verification failed',
    } as ApiResponse);
  }
};

/**
 * Authorization middleware that checks user roles
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User not authenticated',
      } as ApiResponse);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      } as ApiResponse);
      return;
    }

    next();
  };
};

/**
 * Discipline-aware authorization middleware for admin/teacher actions on materials
 * Enhanced to allow super_admin to bypass discipline restrictions
 */
export const authorizeDisciplineAction = (allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User not authenticated',
        } as ApiResponse);
        return;
      }

      // Super admin bypass - can access everything
      if (req.user.role === 'super_admin') {
        next();
        return;
      }

      // For material-specific actions, check if user is the uploader first
      if (req.params.id) {
        const { data: material } = await supabase
          .from('materials')
          .select('discipline_id, uploaded_by')
          .eq('id', req.params.id)
          .single();

        if (material) {
          // Allow if user is the original uploader
          if (req.user.id === material.uploaded_by) {
            next();
            return;
          }
          
          // Otherwise, check role and discipline match for admins/teachers
          if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
              success: false,
              error: 'Insufficient permissions',
              message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
            } as ApiResponse);
            return;
          }

          // Check if user's discipline matches material's discipline
          if (req.user.discipline_id !== material.discipline_id) {
            res.status(403).json({
              success: false,
              error: 'Unauthorized',
              message: 'You can only manage materials from your own discipline',
            } as ApiResponse);
            return;
          }
        }
      } else {
        // For non-material-specific actions, just check role
        if (!allowedRoles.includes(req.user.role)) {
          res.status(403).json({
            success: false,
            error: 'Insufficient permissions',
            message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          } as ApiResponse);
          return;
        }
      }

      next();
    } catch (error) {
      console.error('Discipline authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to verify permissions',
      } as ApiResponse);
    }
  };
};

/**
 * Teacher-specific authorization for material approval/rejection within their discipline
 * Enhanced to support super admin bypass
 */
export const authorizeTeacherDisciplineAction = () => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User not authenticated',
        } as ApiResponse);
        return;
      }

      // Super admin bypass - can access everything
      if (req.user.role === 'super_admin') {
        next();
        return;
      }

      // Check if user is teacher or admin
      if (!['teacher', 'admin'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: 'Access denied. Teacher or Admin role required',
        } as ApiResponse);
        return;
      }

      // For material-specific actions, check discipline match
      if (req.params.id) {
        const { data: material } = await supabase
          .from('materials')
          .select('discipline_id')
          .eq('id', req.params.id)
          .single();

        if (material) {
          // Check if user's discipline matches material's discipline
          if (req.user.discipline_id !== material.discipline_id) {
            res.status(403).json({
              success: false,
              error: 'Unauthorized',
              message: 'You can only manage materials from your own discipline',
            } as ApiResponse);
            return;
          }
        }
      }

      next();
    } catch (error) {
      console.error('Teacher discipline authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to verify permissions',
      } as ApiResponse);
    }
  };
};

/**
 * Course-specific discipline authorization middleware
 * Super admin can manage all courses, regular admin can only manage courses from their discipline
 */
export const authorizeCourseDisciplineAction = (allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User not authenticated',
        } as ApiResponse);
        return;
      }

      // Super admin bypass - can manage all courses
      if (req.user.role === 'super_admin') {
        next();
        return;
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        } as ApiResponse);
        return;
      }

      // For course-specific actions (edit/delete), check discipline match
      if (req.params.id) {
        const { data: course } = await supabase
          .from('course_codes')
          .select('discipline_id')
          .eq('id', req.params.id)
          .single();

        if (course) {
          // Check if user's discipline matches course's discipline
          if (req.user.discipline_id !== course.discipline_id) {
            res.status(403).json({
              success: false,
              error: 'Unauthorized',
              message: 'You can only manage courses from your own discipline',
            } as ApiResponse);
            return;
          }
        }
      }

      next();
    } catch (error) {
      console.error('Course discipline authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to verify permissions',
      } as ApiResponse);
    }
  };
};
