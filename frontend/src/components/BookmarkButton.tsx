'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface BookmarkButtonProps {
  materialId: string;
  initialBookmarked?: boolean;
  className?: string;
  showText?: boolean;
}

export default function BookmarkButton({
  materialId,
  initialBookmarked = false,
  className = '',
  showText = false
}: BookmarkButtonProps) {
  const { user } = useAuthStore();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      // You could trigger auth modal here
      alert('Please login to bookmark materials');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.toggleBookmark(materialId);
      if (response.success && response.data) {
        setBookmarked(response.data.bookmarked);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleBookmark}
      disabled={loading}
      className={`inline-flex items-center justify-center transition-all duration-200 ${bookmarked
          ? 'text-yellow-500 hover:text-yellow-600'
          : 'text-gray-400 hover:text-gray-600'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Bookmark
        className={`h-5 w-5 ${bookmarked ? 'fill-current' : ''}`}
      />
      {showText && (
        <span className="ml-1.5 text-sm font-medium">
          {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </span>
      )}
    </button>
  );
}
