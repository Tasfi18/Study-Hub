'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { FolderOpen, Plus, Trash2, FileText, Search, ArrowRight, X, Lock, Globe, MoreVertical, Edit2 } from 'lucide-react';
import Navigation from '@/components/home/Navigation';

interface Collection {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
  items: { count: number }[];
}

// Collection cover images based on name patterns
function getCollectionCover(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('exam') || lowerName.includes('midterm') || lowerName.includes('final')) {
    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop&q=80';
  }
  if (lowerName.includes('lab') || lowerName.includes('practical')) {
    return 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop&q=80';
  }
  if (lowerName.includes('project') || lowerName.includes('assignment')) {
    return 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=300&fit=crop&q=80';
  }
  if (lowerName.includes('lecture') || lowerName.includes('note')) {
    return 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400&h=300&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&q=80';
}

// Color schemes for collections
const colorSchemes = [
  { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600' },
  { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600' },
  { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-600' },
  { bg: 'bg-pink-500', light: 'bg-pink-100', text: 'text-pink-600' },
  { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-600' },
  { bg: 'bg-teal-500', light: 'bg-teal-100', text: 'text-teal-600' },
];

function getColorScheme(index: number) {
  return colorSchemes[index % colorSchemes.length];
}

export default function CollectionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollection, setNewCollection] = useState({ name: '', description: '', is_public: false });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadCollections();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCollections = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCollections();
      if (response.success && response.data) {
        setCollections(response.data);
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCollection.name.trim()) return;

    try {
      setCreating(true);
      const response = await apiClient.createCollection(newCollection);
      if (response.success) {
        setShowCreateModal(false);
        setNewCollection({ name: '', description: '', is_public: false });
        loadCollections();
      }
    } catch (error) {
      console.error('Failed to create collection:', error);
      alert('Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this collection? Materials will not be deleted.')) return;

    try {
      setDeleting(id);
      const response = await apiClient.deleteCollection(id);
      if (response.success) {
        loadCollections();
      }
    } catch (error) {
      console.error('Failed to delete collection:', error);
      alert('Failed to delete collection');
    } finally {
      setDeleting(null);
    }
  };

  // Filter collections based on search
  const filteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      <Navigation />

      <div className="px-4 py-8 lg:px-40">
        <div className="mx-auto max-w-[1200px] flex flex-col gap-8">
          {/* Page Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.033em] text-[#111218] md:text-4xl">
                My Collections
              </h1>
              <p className="text-slate-600 mt-2">Organize your study materials into custom playlists</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2b4bee] hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/25"
            >
              <Plus className="w-5 h-5" />
              New Collection
            </button>
          </div>

          {/* Search and Stats */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 w-full">
              <div className="flex w-full items-stretch rounded-lg h-12 relative bg-white border border-slate-200 shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg text-[#111218] focus:outline-0 focus:ring-2 focus:ring-[#2b4bee]/20 border-0 bg-transparent placeholder:text-slate-400 pl-12 pr-4 text-base font-normal"
                  placeholder="Search collections..."
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>{collections.length} collections</span>
              <span>{collections.reduce((sum, c) => sum + (c.items?.[0]?.count || 0), 0)} total items</span>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse border border-slate-200">
                  <div className="h-40 bg-slate-200"></div>
                  <div className="p-5">
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-[#111218] mb-2">
                {searchQuery ? 'No matching collections' : 'No collections yet'}
              </h3>
              <p className="text-slate-600 mb-6">
                {searchQuery ? 'Try a different search term' : 'Create your first collection to organize materials'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2b4bee] hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Collection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCollections.map((collection, index) => {
                const colorScheme = getColorScheme(index);
                const itemCount = collection.items?.[0]?.count || 0;

                return (
                  <Link
                    key={collection.id}
                    href={`/collections/${collection.id}`}
                    className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-[#2b4bee]/30 transition-all duration-300"
                  >
                    {/* Cover Image */}
                    <div className="h-36 relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                      <img
                        src={getCollectionCover(collection.name)}
                        alt={collection.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

                      {/* Visibility Badge */}
                      <span className={`absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${collection.is_public
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                        }`}>
                        {collection.is_public ? (
                          <>
                            <Globe className="w-3 h-3" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            Private
                          </>
                        )}
                      </span>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDelete(collection.id, e)}
                        disabled={deleting === collection.id}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-red-500 text-slate-500 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm disabled:opacity-50"
                        title="Delete collection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Item Count */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <div className={`w-8 h-8 ${colorScheme.bg} rounded-lg flex items-center justify-center`}>
                          <FolderOpen className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white text-sm font-semibold">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-bold text-lg text-[#111218] group-hover:text-[#2b4bee] transition-colors line-clamp-1 mb-1">
                        {collection.name}
                      </h3>
                      {collection.description ? (
                        <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                          {collection.description}
                        </p>
                      ) : (
                        <p className="text-slate-400 text-sm italic">No description</p>
                      )}

                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          Created {new Date(collection.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-[#2b4bee] text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                          View
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#111218]">Create Collection</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCollection({ name: '', description: '', is_public: false });
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#111218] mb-2">
                  Collection Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2b4bee]/20 focus:border-[#2b4bee] transition-shadow text-[#111218] placeholder:text-slate-400"
                  placeholder="e.g., Midterm Prep, Final Year Notes"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111218] mb-2">
                  Description
                </label>
                <textarea
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2b4bee]/20 focus:border-[#2b4bee] transition-shadow text-[#111218] placeholder:text-slate-400 resize-none"
                  rows={3}
                  placeholder="What's this collection about?"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <button
                  type="button"
                  onClick={() => setNewCollection({ ...newCollection, is_public: !newCollection.is_public })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${newCollection.is_public ? 'bg-[#2b4bee]' : 'bg-slate-300'
                    }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${newCollection.is_public ? 'left-6' : 'left-1'
                    }`}></span>
                </button>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#111218]">Make it public</p>
                  <p className="text-xs text-slate-500">Others can view and copy from this collection</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCollection({ name: '', description: '', is_public: false });
                }}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newCollection.name.trim() || creating}
                className="flex-1 px-4 py-3 bg-[#2b4bee] hover:bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/25"
              >
                {creating ? 'Creating...' : 'Create Collection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
