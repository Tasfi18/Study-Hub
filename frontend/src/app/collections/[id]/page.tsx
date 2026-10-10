'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Material } from '@/types';
import { apiClient } from '@/lib/api';
import { formatFileSize, formatDate, getMaterialTypeIcon, getCategoryDisplayName, downloadFile } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Download, Trash2, FolderOpen, Clock } from 'lucide-react';
import BackButton from '@/components/BackButton';
import Link from 'next/link';

interface CollectionDetail {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
  items: {
    id: string;
    added_at: string;
    material: Material;
  }[];
}

export default function CollectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadCollection();
  }, [user, params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCollection = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCollection(params.id as string);
      if (response.success && response.data) {
        setCollection(response.data);
      }
    } catch (error) {
      console.error('Failed to load collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (materialId: string) => {
    try {
      setDownloading(materialId);
      const response = await apiClient.downloadMaterial(materialId);
      if (response.success && response.data) {
        await downloadFile(response.data.downloadUrl, response.data.fileName);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    } finally {
      setDownloading(null);
    }
  };

  const handleRemove = async (materialId: string) => {
    if (!confirm('Remove this material from collection?')) return;
    
    try {
      setRemoving(materialId);
      const response = await apiClient.removeFromCollection(collection!.id, materialId);
      if (response.success) {
        loadCollection();
      }
    } catch (error) {
      console.error('Failed to remove material:', error);
      alert('Failed to remove material');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 sm:p-6 animate-pulse border border-gray-200">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex items-center gap-3 flex-1 w-full">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
                    <div className="flex-1 min-w-0 w-full">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="h-10 bg-gray-200 rounded-lg w-full sm:w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto text-center pt-20">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Collection not found</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6">This collection may have been deleted or you don't have access</p>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <BackButton href="/collections" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{collection.name}</h1>
              {collection.description && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{collection.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  <FolderOpen className="h-3 w-3" />
                  {collection.items?.length || 0} materials
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {!collection.items || collection.items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No materials yet</h3>
            <p className="text-sm sm:text-base text-gray-600">Add materials from the browse page using the folder icon</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {collection.items.map((item) => {
              const material = item.material;
              return (
                <div key={item.id} className="group bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
                  {/* Gradient Border */}
                  <div className="h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 group-hover:h-1.5 transition-all duration-300"></div>
                  
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-lg sm:text-xl">
                            {getMaterialTypeIcon(material.file_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors truncate sm:line-clamp-2">
                              {material.title}
                            </h2>
                            {material.description && (
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                                {material.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                          <span className="text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Added {formatDate(item.added_at)}
                          </span>
                          <span className="text-gray-500">{formatFileSize(material.file_size)}</span>
                          {material.discipline && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {material.discipline.name}
                            </span>
                          )}
                          {material.category && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              {getCategoryDisplayName(material.category)}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            material.status === 'approved' ? 'bg-green-100 text-green-700' :
                            material.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {material.status === 'approved' ? '✓ Approved' : 
                             material.status === 'pending' ? '⏳ Pending' : '✗ Rejected'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                        <button
                          onClick={() => handleRemove(material.id)}
                          disabled={removing === material.id}
                          className="p-2 sm:p-2.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
                          title="Remove from collection"
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        
                        {material.status === 'approved' ? (
                          <button
                            onClick={() => handleDownload(material.id)}
                            disabled={downloading === material.id}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <Download className="h-4 w-4" />
                            <span>{downloading === material.id ? 'Downloading...' : 'Download'}</span>
                          </button>
                        ) : (
                          <div className="flex-1 sm:flex-initial px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-100 text-gray-500 text-sm font-semibold rounded-lg text-center">
                            {material.status === 'pending' ? 'Awaiting Approval' : 'Not Available'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
