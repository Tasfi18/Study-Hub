import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Simple super admin check
const requireSuperAdmin = (req: AuthenticatedRequest, res: Response, next: any) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Super admin access required',
    });
  }
  return next();
};

// Get all users (only confirmed emails)
router.get('/users', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    // First, get all confirmed users from auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) throw authError;

    // Get confirmed user IDs
    const confirmedUserIds = authData.users
      .filter(user => user.email_confirmed_at)
      .map(user => user.id);

    if (confirmedUserIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
      });
    }

    // Now query profiles with confirmed users only
    let query = supabase
      .from('profiles')
      .select(`*, discipline:disciplines(name)`, { count: 'exact' })
      .in('id', confirmedUserIds);

    if (role && role !== 'all') query = query.eq('role', role);
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

    if (error) throw error;

    return res.json({
      success: true,
      data: users,
      pagination: { 
        page: pageNum, 
        limit: limitNum, 
        total: count || 0, 
        totalPages: Math.ceil((count || 0) / limitNum) 
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch users', message: error.message });
  }
});

// Update user role
router.patch('/users/:id/role', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['student', 'teacher', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, message: 'Role updated successfully', data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update role', message: error.message });
  }
});

// Toggle user status
router.patch('/users/:id/status', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, message: 'Status updated successfully', data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update status', message: error.message });
  }
});

// Bulk approve materials
router.patch('/materials/bulk-approve', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { materialIds } = req.body;

    const { data, error } = await supabase
      .from('materials')
      .update({
        status: 'approved',
        approved_by: req.user!.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', materialIds)
      .select();

    if (error) throw error;

    return res.json({ success: true, message: `${data.length} materials approved`, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to approve materials', message: error.message });
  }
});

export default router;
