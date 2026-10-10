'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Material } from '@/types';
import { apiClient } from '@/lib/api';
import { formatFileSize, getCategoryDisplayName, formatRelativeTime, getInitials, downloadFile } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Download, Search, Bookmark, ChevronDown, Grid3X3, List, Share2, Eye } from 'lucide-react';
import BookmarkButton from '@/components/BookmarkButton';
import Navigation from '@/components/home/Navigation';

// Get file type display
function getFileType(fileType: string): string {
  const ext = fileType?.toLowerCase() || '';
  if (ext.includes('pdf')) return 'PDF';
  if (ext.includes('doc')) return 'DOC';
  if (ext.includes('ppt')) return 'PPT';
  if (ext.includes('xls')) return 'XLS';
  if (ext.includes('zip') || ext.includes('rar')) return 'ZIP';
  return 'FILE';
}

// Get category image
function getCategoryImage(category: string): string {
  switch (category) {
    case 'previous_question':
    case 'ct_question':
    case 'final_question':
      return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop&q=80';
    case 'assignment':
      return 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=250&fit=crop&q=80';
    case 'lecture_note':
      return 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400&h=250&fit=crop&q=80';
    case 'lab_manual':
      return 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=250&fit=crop&q=80';
    case 'book':
      return 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop&q=80';
    default:
      return 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=250&fit=crop&q=80';
  }
}

// Avatar color
function getAvatarColor(name: string): string {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
  const index = name?.charCodeAt(0) % colors.length || 0;
  return colors[index];
}

export default function BookmarksPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadBookmarks();
  }, [user, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getBookmarks(page, 12);
      if (response.success && response.data) {
        if (page === 1) {
          setMaterials(response.data);
        } else {
          setMaterials(prev => [...prev, ...response.data!]);
        }
        setTotalItems(response.pagination?.total || response.data.length);
        setHasMore((response.pagination?.page || 1) < (response.pagination?.totalPages || 1));
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort materials
  const filteredMaterials = useMemo(() => {
    let result = [...materials];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query) ||
        m.discipline?.name?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [materials, searchQuery, sortBy]);

  const handleDownload = async (materialId: string) => {
    setDownloading(materialId);
    try {
      const response = await apiClient.downloadMaterial(materialId);
      if (response.success && response.data) {
        downloadFile(response.data.downloadUrl, response.data.fileName);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleLoadMore = () => {
    setPage(p => p + 1);
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      <Navigation />

      <div className="px-4 py-8 lg:px-40">
        <div className="mx-auto max-w-[1200px] flex flex-col gap-8">
          {/* Page Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.033em] text-[#111218] md:text-4xl">
                My Saved Library
              </h1>
              <p className="mt-2 text-[#616889]">
                Manage your bookmarked study materials and resources.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[#2b4bee]/10 px-4 py-1.5 text-sm font-medium text-[#2b4bee]">
              <Bookmark className="w-4 h-4 fill-current" />
              <span>{totalItems} items saved</span>
            </div>
          </div>

          {/* Filters & Controls Toolbar */}
          <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm lg:flex-row lg:items-center">
            {/* Search */}
            <div className="flex-1">
              <div className="relative flex h-11 w-full items-center overflow-hidden rounded-lg bg-[#f0f1f4] focus-within:ring-2 focus-within:ring-[#2b4bee]/20">
                <div className="flex h-full items-center justify-center pl-4 text-[#616889]">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search saved materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-full w-full border-none bg-transparent px-3 text-[#111218] placeholder:text-[#616889] focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* Dropdowns and Toggles */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative min-w-[140px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'alphabetical')}
                  className="h-11 w-full appearance-none rounded-lg border border-[#dbdde6] bg-white px-4 py-2 pr-10 text-sm font-medium text-[#111218] focus:border-[#2b4bee] focus:outline-none focus:ring-0"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="alphabetical">Alphabetical (A-Z)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#616889]">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>

              {/* Divider */}
              <div className="hidden h-8 w-px bg-[#dbdde6] lg:block"></div>

              {/* View Toggle */}
              <div className="flex h-11 items-center rounded-lg bg-[#f0f1f4] p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex h-full items-center justify-center rounded px-3 transition-all ${viewMode === 'grid'
                      ? 'bg-white text-[#111218] shadow-sm'
                      : 'text-[#616889] hover:text-[#111218]'
                    }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex h-full items-center justify-center rounded px-3 transition-all ${viewMode === 'list'
                      ? 'bg-white text-[#111218] shadow-sm'
                      : 'text-[#616889] hover:text-[#111218]'
                    }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading && materials.length === 0 ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[#111218] mb-2">
                {searchQuery ? 'No matching bookmarks' : 'No bookmarks yet'}
              </h2>
              <p className="text-[#616889] mb-6">
                {searchQuery ? 'Try adjusting your search' : 'Start bookmarking materials to access them quickly'}
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-[#2b4bee] text-white rounded-lg hover:bg-[#2343d0] transition-colors font-medium"
              >
                Browse Materials
              </Link>
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {filteredMaterials.map((material) => {
                const uploaderName = material.uploaded_by_profile?.full_name || 'Unknown';
                const uploaderInitials = getInitials(uploaderName);
                const avatarColor = getAvatarColor(uploaderName);

                return (
                  <div
                    key={material.id}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-[#f0f1f4] bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                      <div
                        className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url('${getCategoryImage(material.category || 'other')}')` }}
                      ></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

                      {/* Type Badge */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-black/40 px-2 py-1 text-xs font-medium text-white backdrop-blur-md">
                        {getFileType(material.file_type)}
                      </div>

                      {/* Bookmark Button */}
                      <BookmarkButton
                        materialId={material.id}
                        initialBookmarked={true}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#2b4bee] shadow-sm hover:bg-white transition-colors"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          {material.discipline?.name || 'General'}
                        </span>
                        <span className="text-xs text-[#616889]">
                          {formatRelativeTime(material.created_at)}
                        </span>
                      </div>

                      <h3 className="mb-2 text-lg font-bold leading-tight text-[#111218] group-hover:text-[#2b4bee] transition-colors line-clamp-2">
                        {material.title}
                      </h3>

                      <p className="mb-4 line-clamp-2 text-sm text-[#616889]">
                        {material.description || getCategoryDisplayName(material.category || 'other')}
                      </p>

                      {/* Footer */}
                      <div className="mt-auto flex items-center gap-2 border-t border-[#f0f1f4] pt-3">
                        {/* Uploader Avatar */}
                        {material.uploaded_by_profile?.avatar_url ? (
                          <img
                            src={material.uploaded_by_profile.avatar_url}
                            alt={uploaderName}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`h-6 w-6 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                            {uploaderInitials}
                          </div>
                        )}
                        <span className="text-xs font-medium text-[#111218]">{uploaderName}</span>

                        {/* Actions */}
                        <div className="ml-auto flex gap-1">
                          <Link
                            href={`/materials/${material.id}`}
                            className="p-1.5 text-[#616889] hover:text-[#2b4bee] transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {material.status === 'approved' && (
                            <button
                              onClick={() => handleDownload(material.id)}
                              disabled={downloading === material.id}
                              className="p-1.5 text-[#616889] hover:text-[#2b4bee] transition-colors disabled:opacity-50"
                              title="Download"
                            >
                              <Download className={`w-4 h-4 ${downloading === material.id ? 'animate-bounce' : ''}`} />
                            </button>
                          )}
                          <button className="p-1.5 text-[#616889] hover:text-[#2b4bee] transition-colors" title="Share">
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <div className="flex justify-center py-6">
              <button
                onClick={handleLoadMore}
                className="flex items-center gap-2 rounded-lg border border-[#f0f1f4] bg-white px-6 py-2.5 text-sm font-medium text-[#616889] shadow-sm transition-all hover:bg-gray-50 hover:text-[#111218]"
              >
                <span>Load more materials</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading && materials.length > 0 && (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#2b4bee] border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}