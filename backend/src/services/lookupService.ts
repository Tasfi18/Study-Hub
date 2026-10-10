import { supabase } from '../config/supabase';

export class LookupService {
  /**
   * Get discipline UUID by integer position or code
   */
  static async getDisciplineUUID(identifier: string): Promise<string | null> {
    // Try to parse as integer first (position-based lookup)
    const numId = parseInt(identifier);
    
    if (!isNaN(numId)) {
      // Get disciplines ordered by creation date and pick by position
      const { data, error } = await supabase
        .from('disciplines')
        .select('id')
        .order('created_at', { ascending: true })
        .range(numId - 1, numId - 1)
        .single();
        
      if (!error && data) {
        return data.id;
      }
    }
    
    // Check if identifier looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    let query = supabase.from('disciplines').select('id');
    
    if (isUUID) {
      // If it's a UUID, search by ID only
      query = query.eq('id', identifier);
    } else {
      // Otherwise search by code (case-insensitive)
      query = query.ilike('code', identifier);
    }
    
    const { data, error } = await query.single();
    return !error && data ? data.id : null;
  }

  /**
   * Get batch UUID by integer position or code
   */
  static async getBatchUUID(identifier: string): Promise<string | null> {
    const numId = parseInt(identifier);
    
    if (!isNaN(numId)) {
      const { data, error } = await supabase
        .from('batches')
        .select('id')
        .order('created_at', { ascending: true })
        .range(numId - 1, numId - 1)
        .single();
        
      if (!error && data) {
        return data.id;
      }
    }
    
    // Check if identifier looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    let query = supabase.from('batches').select('id');
    
    if (isUUID) {
      query = query.eq('id', identifier);
    } else {
      query = query.ilike('code', identifier);
    }
    
    const { data, error } = await query.single();
    return !error && data ? data.id : null;
  }

  /**
   * Get course code UUID by integer position or code
   */
  static async getCourseCodeUUID(identifier: string): Promise<string | null> {
    const numId = parseInt(identifier);
    
    if (!isNaN(numId)) {
      const { data, error } = await supabase
        .from('course_codes')
        .select('id')
        .order('created_at', { ascending: true })
        .range(numId - 1, numId - 1)
        .single();
        
      if (!error && data) {
        return data.id;
      }
    }
    
    // Check if identifier looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    let query = supabase.from('course_codes').select('id');
    
    if (isUUID) {
      query = query.eq('id', identifier);
    } else {
      query = query.ilike('code', identifier);
    }
    
    const { data, error } = await query.single();
    return !error && data ? data.id : null;
  }
}