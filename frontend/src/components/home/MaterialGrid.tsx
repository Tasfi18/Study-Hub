'use client';

import { FileText, X, Upload, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Material } from '@/types';
import { useAuthStore } from '@/store/authStore';
import MaterialCard from './MaterialCard';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface MaterialGridProps {
  materials: Material[];
  loading: boolean;
  downloading: string | null;
  onDownload: (materialId: string) => void;
  onAuthModalOpen: () => void;
  onUploadModalOpen: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  searchQuery: string;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
}

export default function MaterialGrid({
  materials,
  loading,
  downloading,
  onDownload,
  onAuthModalOpen,
  onUploadModalOpen,
  onClearFilters,
  hasActiveFilters,
  searchQuery,
  pagination,
  onPageChange,
}: MaterialGridProps) {
  const { user } = useAuthStore();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-16 bg-gray-200 rounded mb-4"></div>
            <div className="flex justify-between items-center">
              <div className="h-8 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto">
          <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <FileText className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Materials Found</h3>
          <p className="text-gray-600 mb-8">
            {searchQuery || hasActiveFilters
              ? "Try adjusting your search criteria or filters to find what you're looking for."
              : "Be the first to contribute! Upload study materials to help your fellow students."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {(searchQuery || hasActiveFilters) && (
              <button
                onClick={onClearFilters}
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            )}
            {user ? (
              <button
                onClick={onUploadModalOpen}
                className="inline-flex items-center justify-center px-6 py-3 bg-[#135bec] hover:bg-[#0d4ac7] text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload First Material
              </button>
            ) : (
              <button
                onClick={onAuthModalOpen}
                className="inline-flex items-center justify-center px-6 py-3 bg-[#135bec] hover:bg-[#0d4ac7] text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Sign In to Upload
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Materials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            onDownload={onDownload}
            downloading={downloading === material.id}
            onAuthRequired={onAuthModalOpen}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum: number;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${pagination.page === pageNum
                    ? 'bg-[#135bec] text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Results Info */}
      {pagination && (
        <p className="text-center text-sm text-gray-500">
          Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} materials
        </p>
      )}
    </div>
  );
}
