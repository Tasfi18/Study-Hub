'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Material } from '@/types';
import { apiClient } from '@/lib/api';
import { formatFileSize, formatRelativeTime, getCategoryDisplayName, downloadFile, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Download, Clock, Search, Star, Eye, ArrowRight, Trash2 } from 'lucide-react';
import Navigation from '@/components/home/Navigation';
import BookmarkButton from '@/components/BookmarkButton';

interface ViewHistoryItem {
  id: string;
  user_id: string;
  material_id: string;
  viewed_at: string;
  material: Material;
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

export default function ViewHistoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [historyItems, setHistoryItems] = useState<ViewHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadHistory();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getViewHistory(50);
      if (response.success && response.data) {
        setHistoryItems(response.data);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (materialId: string) => {
    setDownloading(materialId);
    try {
      const response = await apiClient.downloadMaterial(materialId);
      if (response.success && response.data) {
        downloadFile(response.data.downloadUrl, response.data.fileName);
      } else {
        throw new Error('Download URL not available');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to download file. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  // Filter history items based on search
  const filteredItems = historyItems.filter(item =>
    item.material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.material.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by date
  const groupedHistory = filteredItems.reduce((groups, item) => {
    const date = new Date(item.viewed_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, ViewHistoryItem[]>);

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      <Navigation />

      <div className="px-4 py-8 lg:px-40">
        <div className="mx-auto max-w-[1200px] flex flex-col gap-8">
          {/* Page Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.033em] text-[#111218] md:text-4xl">
                Recently Viewed
              </h1>
              <p className="text-slate-600 mt-2">Continue where you left off</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                {historyItems.length} items in history
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex w-full items-stretch rounded-lg h-12 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg text-[#111218] focus:outline-0 focus:ring-2 focus:ring-[#2b4bee]/20 border border-slate-200 bg-slate-50 placeholder:text-slate-400 pl-12 pr-4 text-base font-normal transition-shadow"
                placeholder="Search your history..."
              />
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse border border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-16 bg-slate-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-[#111218] mb-2">
                {searchQuery ? 'No matching results' : 'No viewing history yet'}
              </h3>
              <p className="text-slate-600 mb-6">
                {searchQuery ? 'Try a different search term' : 'Start browsing materials to see them here'}
              </p>
              <Link
                href="/materials"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2b4bee] hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
              >
                Browse Materials
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedHistory).map(([date, items]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-[#2b4bee]/10 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-[#2b4bee]" />
                    </div>
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{date}</h2>
                    <div className="h-px flex-1 bg-slate-200"></div>
                  </div>

                  {/* Items for this date */}
                  <div className="space-y-3">
                    {items.map((item) => {
                      const material = item.material;
                      const uploaderName = material.uploaded_by_profile?.full_name || 'Unknown';
                      const uploaderInitials = getInitials(uploaderName);
                      const avatarColor = getAvatarColor(uploaderName);

                      return (
                        <article
                          key={item.id}
                          className="group flex flex-col sm:flex-row bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-[#2b4bee]/30 transition-all duration-300"
                        >
                          {/* Thumbnail */}
                          <Link href={`/materials/${material.id}`} className="w-full sm:w-48 h-32 sm:h-auto bg-slate-100 relative flex-shrink-0 overflow-hidden">
                            <img
                              src={getCategoryImage(material.category || 'other')}
                              alt={material.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <span className="absolute top-2 left-2 bg-white/90 text-[#2b4bee] backdrop-blur-sm text-xs font-bold px-2 py-1 rounded shadow-sm">
                              {material.course_code?.code || getCategoryDisplayName(material.category || 'other')}
                            </span>

                            {/* Bookmark */}
                            <div className="absolute top-2 right-2">
                              <BookmarkButton
                                materialId={material.id}
                                initialBookmarked={material.is_bookmarked}
                                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm"
                              />
                            </div>
                          </Link>

                          {/* Content */}
                          <div className="flex-1 p-4 flex flex-col">
                            <div className="flex-1">
                              <Link href={`/materials/${material.id}`}>
                                <h3 className="text-[#111218] font-bold text-lg leading-snug line-clamp-1 group-hover:text-[#2b4bee] transition-colors mb-1">
                                  {material.title}
                                </h3>
                              </Link>
                              {material.description && (
                                <p className="text-slate-500 text-sm line-clamp-2 mb-3">
                                  {material.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5" />
                                  Viewed {formatRelativeTime(item.viewed_at)}
                                </span>
                                <span>{formatFileSize(material.file_size)}</span>
                                {material.average_rating && (
                                  <span className="flex items-center gap-1 text-amber-500 font-medium">
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                    {material.average_rating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {material.uploaded_by_profile?.avatar_url ? (
                                  <img
                                    src={material.uploaded_by_profile.avatar_url}
                                    alt={uploaderName}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className={`w-6 h-6 rounded-full ${avatarColor} flex items-center justify-center text-white text-[10px] font-bold`}>
                                    {uploaderInitials}
                                  </div>
                                )}
                                <span className="text-xs text-slate-500">{uploaderName}</span>
                              </div>

                              {material.status === 'approved' && (
                                <button
                                  onClick={() => handleDownload(material.id)}
                                  disabled={downloading === material.id}
                                  className="flex items-center gap-2 px-4 py-2 bg-[#2b4bee] hover:bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                  {downloading === material.id ? 'Downloading...' : 'Download'}
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
