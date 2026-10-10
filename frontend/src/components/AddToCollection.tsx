'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FolderOpen, Plus, Check } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface AddToCollectionProps {
  materialId: string;
  className?: string;
  showText?: boolean;
}

export default function AddToCollection({ materialId, className, showText = false }: AddToCollectionProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleClick = () => {
    if (!showDropdown) {
      loadCollections();
    }
    setShowDropdown(!showDropdown);
  };

  const handleAdd = async (collectionId: string) => {
    try {
      setAdding(collectionId);
      const response = await apiClient.addToCollection(collectionId, materialId);
      if (response.success) {
        setTimeout(() => setShowDropdown(false), 1000);
      }
    } catch (error: any) {
      if (error.message?.includes('already in collection')) {
        alert('Material is already in this collection');
      } else {
        alert('Failed to add to collection');
      }
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={handleClick}
        className={className || "p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"}
        title="Add to collection"
      >
        <FolderOpen className={className?.includes('p-1') ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
        {showText && (
          <span className="text-sm font-medium">Add to Collection</span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[99]"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Popup */}
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 z-[100]">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <p className="text-base font-bold text-gray-800 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-green-600" />
                Add to Collection
              </p>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading collections...
                </div>
              ) : collections.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FolderOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">No collections yet</p>
                  <p className="text-xs text-gray-500 mb-4">Create your first collection to organize materials</p>
                  <Link 
                    href="/collections" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Collection
                  </Link>
                </div>
              ) : (
                <div className="py-2">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => handleAdd(collection.id)}
                      disabled={adding === collection.id}
                      className="w-full px-5 py-3 text-left text-sm text-gray-700 hover:bg-green-50 disabled:opacity-50 flex items-center justify-between group transition-colors"
                    >
                      <span className="truncate font-medium group-hover:text-green-700">{collection.name}</span>
                      {adding === collection.id && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Check className="h-4 w-4" />
                          <span className="text-xs">Added</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
