import { useState, useEffect, useCallback } from 'react';
import { MaterialFilters } from '@/types';
import { apiClient } from '@/lib/api';

interface FilterOptions {
  disciplines: Array<{ id: string; name: string; code: string }>;
  terms: Array<{ id: string; term: string; discipline_id: string }>;
  courseCodes: Array<{ id: string; code: string; title: string; discipline_id: string }>;
}

export function useFilters() {
  const [filters, setFilters] = useState<MaterialFilters>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  const loadFilterOptions = useCallback(async () => {
    try {
      setFilterOptionsLoading(true);
      const response = await apiClient.getFilterOptions();
      if (response.success && response.data) {
        setFilterOptions(response.data);
      }
    } catch (error) {
      console.error('Failed to load filter options:', error);
    } finally {
      setFilterOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  const handleFilterChange = (key: keyof MaterialFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    
    if (key === 'discipline') {
      newFilters.term = undefined;
      newFilters.courseCode = undefined;
    }
    
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getFilteredTerms = () => {
    if (!filterOptions?.terms || !filters.discipline) return [];
    return filterOptions.terms.filter(term => term.discipline_id === filters.discipline);
  };

  const getFilteredCourseCodes = () => {
    if (!filterOptions?.courseCodes || !filters.discipline) return [];
    return filterOptions.courseCodes.filter(course => course.discipline_id === filters.discipline);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v).length;

  return {
    filters,
    filterOptions,
    filterOptionsLoading,
    handleFilterChange,
    clearFilters,
    getFilteredTerms,
    getFilteredCourseCodes,
    activeFiltersCount,
    loadFilterOptions
  };
}
