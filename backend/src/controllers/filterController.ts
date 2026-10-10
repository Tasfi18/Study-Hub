import { Response, Request } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { supabase } from '../config/supabase';

export class FilterController {
  /**
   * Get all disciplines (public endpoint for registration)
   */
  static async getDisciplines(_req: Request, res: Response): Promise<void> {
    try {
      const { data: disciplines } = await supabase
        .from('disciplines')
        .select('id, name, code')
        .order('name');

      res.json({
        success: true,
        message: 'Disciplines fetched successfully',
        data: disciplines || [],
      } as ApiResponse);
    } catch (error) {
      console.error('Get disciplines error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch disciplines',
      } as ApiResponse);
    }
  }

  /**
   * Get trending searches based on popular materials
   * Returns top course codes and tags from most downloaded/viewed materials
   */
  static async getTrendingSearches(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      const userDisciplineId = user?.discipline_id;
      const isSuperAdmin = user?.role === 'super_admin';

      // Get top 5 course codes by download count (filtered by user's discipline)
      let courseQuery = supabase
        .from('materials')
        .select(`
          course_code:course_codes!inner(code, title)
        `)
        .not('course_code_id', 'is', null)
        .order('download_count', { ascending: false })
        .limit(20);

      if (!isSuperAdmin && userDisciplineId) {
        courseQuery = courseQuery.eq('discipline_id', userDisciplineId);
      }

      const { data: topMaterials } = await courseQuery;

      // Extract unique course codes
      const courseCodesSet = new Set<string>();
      const trendingCourses: string[] = [];
      topMaterials?.forEach((m: any) => {
        if (m.course_code?.code && !courseCodesSet.has(m.course_code.code)) {
          courseCodesSet.add(m.course_code.code);
          trendingCourses.push(m.course_code.code);
        }
      });

      // Get popular tags from recent materials
      let tagsQuery = supabase
        .from('materials')
        .select('tags')
        .not('tags', 'is', null)
        .order('download_count', { ascending: false })
        .limit(50);

      if (!isSuperAdmin && userDisciplineId) {
        tagsQuery = tagsQuery.eq('discipline_id', userDisciplineId);
      }

      const { data: materialsWithTags } = await tagsQuery;

      // Count tag frequency
      const tagCounts: Record<string, number> = {};
      materialsWithTags?.forEach((m: any) => {
        if (Array.isArray(m.tags)) {
          m.tags.forEach((tag: string) => {
            if (tag && tag.length > 2) {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
          });
        }
      });

      // Get top 5 tags by frequency
      const trendingTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);

      // Combine: top 3 course codes + top 4 tags (max 7 items)
      const trending = [
        ...trendingCourses.slice(0, 3),
        ...trendingTags.slice(0, 4),
      ];

      // Fallback if no data
      const fallbackTrending = ['Lecture Notes', 'Past Questions', 'Assignments'];
      const finalTrending = trending.length > 0 ? trending : fallbackTrending;

      res.json({
        success: true,
        message: 'Trending searches fetched successfully',
        data: finalTrending,
      } as ApiResponse);
    } catch (error) {
      console.error('Get trending searches error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch trending searches',
      } as ApiResponse);
    }
  }

  /**
   * Get basic filter options
   * Users see only options from their discipline (except super_admin)
   */
  static async getFilterOptions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      const userDisciplineId = user?.discipline_id;
      const isSuperAdmin = user?.role === 'super_admin';

      // Get disciplines - show for guests (no user) and super_admin
      // Regular logged-in users don't need this filter as they see only their discipline
      let disciplines: Array<{ id: string; name: string; code: string }> = [];
      const isGuest = !user;
      if (isGuest || isSuperAdmin) {
        const { data } = await supabase
          .from('disciplines')
          .select('id, name, code')
          .order('name');
        disciplines = data || [];
      }

      // Get terms (batches) with discipline info - filtered by user's discipline
      let batchesQuery = supabase
        .from('batches')
        .select(`
          id, 
          year, 
          semester, 
          code,
          discipline_id
        `)
        .order('year', { ascending: true });

      if (!isSuperAdmin && userDisciplineId) {
        batchesQuery = batchesQuery.eq('discipline_id', userDisciplineId);
      }

      const { data: batches } = await batchesQuery;

      // Deduplicate terms by year:semester combination
      // For guests/super_admin, show only unique terms (e.g., "1:1", "1:2", "2:1", "2:2", "3:1", "3:2", "4:1", "4:2")
      const uniqueTermsMap = new Map<string, { id: string; term: string; code?: string; discipline_id?: string }>();
      batches?.forEach(batch => {
        const termKey = `${batch.year}:${batch.semester}`;
        if (!uniqueTermsMap.has(termKey)) {
          uniqueTermsMap.set(termKey, {
            id: batch.id,  // Use first ID as representative
            term: termKey,
            code: batch.code,
            discipline_id: batch.discipline_id
          });
        }
      });
      const terms = Array.from(uniqueTermsMap.values());

      // Get course codes with discipline info - filtered by user's discipline
      let courseCodesQuery = supabase
        .from('course_codes')
        .select(`
          id, 
          code, 
          title,
          discipline_id,
          year,
          term
        `)
        .order('code');

      if (!isSuperAdmin && userDisciplineId) {
        courseCodesQuery = courseCodesQuery.eq('discipline_id', userDisciplineId);
      }

      const { data: courseCodes } = await courseCodesQuery;

      // Prevent caching issues
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.json({
        success: true,
        message: 'Filter options fetched successfully',
        data: {
          disciplines: disciplines || [],
          terms: terms || [],
          courseCodes: courseCodes || []
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Get filter options error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch filter options',
      } as ApiResponse);
    }
  }
}

