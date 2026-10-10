'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { MaterialFilters as MaterialFiltersType } from '@/types';
import { useAuthStore } from '@/store/authStore';

interface FilterOptions {
  disciplines: Array<{ id: string; name: string; code: string }>;
  terms: Array<{ id: string; term: string; discipline_id: string }>;
  courseCodes: Array<{ id: string; code: string; title: string; discipline_id: string }>;
}

interface MaterialFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: MaterialFiltersType;
  filterOptions: FilterOptions | null;
  filterOptionsLoading: boolean;
  onFilterChange: (key: keyof MaterialFiltersType, value: string) => void;
  onClearFilters: () => void;
  getFilteredTerms: () => Array<{ id: string; term: string; discipline_id: string }>;
  getFilteredCourseCodes: () => Array<{ id: string; code: string; title: string; discipline_id: string }>;
  activeFiltersCount: number;
}

export default function MaterialFilters({
  searchQuery,
  onSearchChange,
  filters,
  filterOptions,
  filterOptionsLoading,
  onFilterChange,
  onClearFilters,
  getFilteredTerms,
  getFilteredCourseCodes,
  activeFiltersCount
}: MaterialFiltersProps) {
  const { user } = useAuthStore();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div className="mb-8">
      {/* Hero Search Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Discover Study Materials</h2>

        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search for courses, topics, or keywords..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-lg border border-gray-200 bg-[#f6f6f8] text-gray-900 focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] transition-all placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors whitespace-nowrap"
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-[#135bec] text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px]">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Search Button */}
          <button className="px-6 py-3 rounded-lg bg-[#135bec] hover:bg-[#0d4ac7] text-white font-bold shadow-md transition-colors whitespace-nowrap">
            Search
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {user && showMobileFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Filters</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={onClearFilters}
                className="flex items-center gap-1 text-sm text-[#135bec] hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset all
              </button>
            )}
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Discipline Filter */}
            {filterOptions?.disciplines && filterOptions.disciplines.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Discipline</label>
                <select
                  value={filters.discipline || ''}
                  onChange={(e) => onFilterChange('discipline', e.target.value)}
                  disabled={filterOptionsLoading}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] transition-all disabled:opacity-50 text-sm"
                >
                  <option value="">All Disciplines</option>
                  {filterOptions.disciplines.map((discipline) => (
                    <option key={discipline.id} value={discipline.id}>
                      {discipline.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Term Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Term / Semester</label>
              <select
                value={filters.term || ''}
                onChange={(e) => onFilterChange('term', e.target.value)}
                disabled={filterOptionsLoading}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] transition-all disabled:opacity-50 text-sm"
              >
                <option value="">All Terms</option>
                {(filters.discipline ? getFilteredTerms() : filterOptions?.terms || []).map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.term}
                  </option>
                ))}
              </select>
            </div>

            {/* Course Code Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Course</label>
              <select
                value={filters.courseCode || ''}
                onChange={(e) => onFilterChange('courseCode', e.target.value)}
                disabled={filterOptionsLoading}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] transition-all disabled:opacity-50 text-sm"
              >
                <option value="">All Courses</option>
                {(filters.discipline ? getFilteredCourseCodes() : filterOptions?.courseCodes || []).map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Material Type</label>
              <select
                value={filters.category || ''}
                onChange={(e) => onFilterChange('category', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] transition-all text-sm"
              >
                <option value="">All Types</option>
                <option value="ct_question">CT Questions</option>
                <option value="previous_question">Previous Questions</option>
                <option value="final_question">Final Questions</option>
                <option value="assignment">Assignments</option>
                <option value="lecture_note">Lecture Notes</option>
                <option value="lab_manual">Lab Manuals</option>
                <option value="syllabus">Syllabus</option>
                <option value="book">Books</option>
                <option value="thesis">Thesis</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{activeFiltersCount}</span> filter{activeFiltersCount > 1 ? 's' : ''} applied
              </p>
            </div>
          )}
        </div>
      )}

      {/* Guest Notice */}
      {!user && (
        <p className="text-sm text-gray-500 text-center">
          Sign in to access advanced filters and personalized recommendations
        </p>
      )}
    </div>
  );
}
