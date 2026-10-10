import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Material, MaterialFilters } from '@/types';
import { apiClient } from '@/lib/api';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useMaterials(filters: MaterialFilters, searchQuery: string) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 0,
  });

  // Track if this is the initial load
  const isInitialMount = useRef(true);

  // Memoize the filter string to prevent infinite re-renders
  const filterKey = useMemo(() => {
    return JSON.stringify({ ...filters, search: searchQuery || undefined });
  }, [filters.discipline, filters.term, filters.courseCode, filters.type, filters.category, filters.status, searchQuery]);

  const loadMaterials = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await apiClient.getMaterials({
        ...filters,
        search: searchQuery || undefined,
        page,
        limit: 6,
      });
      if (response.success && response.data) {
        setMaterials(response.data);
        if (response.pagination) {
          setPagination({
            page: response.pagination.page,
            limit: response.pagination.limit,
            total: response.pagination.total,
            totalPages: response.pagination.totalPages,
          });
        }
      } else {
        // Keep existing materials if API call fails
        console.warn('Failed to load materials, keeping existing state');
      }
    } catch (error) {
      console.error('Failed to load materials:', error);
      // Don't clear materials on error - keep showing existing ones
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  const goToPage = useCallback((page: number) => {
    loadMaterials(page);
  }, [loadMaterials]);

  useEffect(() => {
    // Always load materials when filterKey changes
    loadMaterials(1);

    // After first mount, set isInitialMount to false
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [filterKey, loadMaterials]);

  return { materials, loading, loadMaterials, pagination, goToPage };
}
