import { Response } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest, ApiResponse } from '../types';

// Validation schemas
const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export class CollectionsController {
  // Get user's collections
  static async getCollections(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
      }
      
      const userId = req.user.id;

      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          items:collection_items(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        message: 'Collections fetched successfully',
        data: data || [],
      } as ApiResponse);
    } catch (error) {
      console.error('Get collections error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch collections',
      } as ApiResponse);
    }
  }

  // Create new collection
  static async createCollection(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
      }
      
      const userId = req.user.id;
      const validatedData = createCollectionSchema.parse(req.body);

      const { data, error } = await supabase
        .from('collections')
        .insert({
          user_id: userId,
          name: validatedData.name,
          description: validatedData.description,
          is_public: validatedData.isPublic || false,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Collection created successfully',
        data,
      } as ApiResponse);
    } catch (error) {
      console.error('Create collection error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create collection',
      } as ApiResponse);
    }
  }

  // Get collection by ID with materials
  static async getCollectionById(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
      }
      
      const userId = req.user.id;

      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          items:collection_items(
            id,
            added_at,
            material:materials(
              *,
              discipline:disciplines(id, name, code),
              course_code:course_codes(id, code, title)
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Check access permission
      if (!data.is_public && data.user_id !== userId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have access to this collection',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: 'Collection fetched successfully',
        data,
      } as ApiResponse);
    } catch (error) {
      console.error('Get collection error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch collection',
      } as ApiResponse);
    }
  }

  // Delete collection
  static async deleteCollection(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
      }
      
      const userId = req.user.id;

      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Collection deleted successfully',
      } as ApiResponse);
    } catch (error) {
      console.error('Delete collection error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete collection',
      } as ApiResponse);
    }
  }

  // Add material to collection
  static async addMaterial(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { materialId } = req.body;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
      }
      
      const userId = req.user.id;

      // Verify collection ownership
      const { data: collection } = await supabase
        .from('collections')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!collection || collection.user_id !== userId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have access to this collection',
        } as ApiResponse);
        return;
      }

      // Add material
      const { error } = await supabase
        .from('collection_items')
        .insert({
          collection_id: id,
          material_id: materialId,
        });

      if (error) {
        if (error.code === '23505') {
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Material already in collection',
          } as ApiResponse);
          return;
        }
        throw error;
      }

      res.json({
        success: true,
        message: 'Material added to collection',
      } as ApiResponse);
    } catch (error) {
      console.error('Add material error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to add material',
      } as ApiResponse);
    }
  }

  // Remove material from collection
  static async removeMaterial(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id, materialId } = req.params;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
      }
      
      const userId = req.user.id;

      // Verify collection ownership
      const { data: collection } = await supabase
        .from('collections')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!collection || collection.user_id !== userId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have access to this collection',
        } as ApiResponse);
        return;
      }

      // Remove material
      const { error } = await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', id)
        .eq('material_id', materialId);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Material removed from collection',
      } as ApiResponse);
    } catch (error) {
      console.error('Remove material error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to remove material',
      } as ApiResponse);
    }
  }
}
