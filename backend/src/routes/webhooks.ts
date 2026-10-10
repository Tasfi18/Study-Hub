import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { ApiResponse } from '../types';

const router = Router();

// Middleware to verify webhook signatures (optional but recommended)
const verifyWebhookSignature = (_req: Request, _res: Response, next: () => void) => {
  // Add webhook signature verification here if needed
  // This depends on your webhook provider's signature method
  next();
};

/**
 * Handle material approval notifications
 */
router.post('/material-approved', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    const { materialId } = req.body;

    if (!materialId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'materialId is required',
      } as ApiResponse);
    }

    // Get material and uploader information
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .select(`
        *,
        uploaded_by_profile:profiles!materials_uploaded_by_fkey(id, full_name, email),
        approved_by_profile:profiles!materials_approved_by_fkey(id, full_name)
      `)
      .eq('id', materialId)
      .single();

    if (materialError || !material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found',
        message: 'Could not find the specified material',
      } as ApiResponse);
    }

    // Create notification for the uploader
    if (material.uploaded_by) {
      const notificationData = {
        user_id: material.uploaded_by,
        type: 'approval',
        title: 'Material Approved',
        message: `Your material "${material.title}" has been approved and is now available for download.`,
        data: { 
          material_id: materialId, 
          approved_by: material.approved_by_profile?.full_name 
        }
      };

      await supabase
        .from('notifications')
        .insert(notificationData);
    }

    return res.status(200).json({
      success: true,
      message: 'Approval notification processed successfully',
    } as ApiResponse);

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      message: 'An error occurred while processing the webhook',
    } as ApiResponse);
  }
});

/**
 * Handle material rejection notifications
 */
router.post('/material-rejected', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    const { materialId, rejectionReason } = req.body;

    if (!materialId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'materialId is required',
      } as ApiResponse);
    }

    // Get material information
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .select('*, uploaded_by_profile:profiles!materials_uploaded_by_fkey(id, full_name, email)')
      .eq('id', materialId)
      .single();

    if (materialError || !material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found',
        message: 'Could not find the specified material',
      } as ApiResponse);
    }

    // Create notification for the uploader
    if (material.uploaded_by) {
      const notificationData = {
        user_id: material.uploaded_by,
        type: 'rejection',
        title: 'Material Rejected',
        message: `Your material "${material.title}" has been rejected. ${rejectionReason ? 'Reason: ' + rejectionReason : ''}`,
        data: { 
          material_id: materialId, 
          rejection_reason: rejectionReason 
        }
      };

      await supabase
        .from('notifications')
        .insert(notificationData);
    }

    return res.status(200).json({
      success: true,
      message: 'Rejection notification processed successfully',
    } as ApiResponse);

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      message: 'An error occurred while processing the webhook',
    } as ApiResponse);
  }
});

export default router;
