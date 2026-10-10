'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Review } from '@/types';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Star, User } from 'lucide-react';

interface ReviewsListProps {
  materialId: string;
  className?: string;
}

export default function ReviewsList({ materialId, className = '' }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getReviews(materialId, 1, 20);
        if (response.success && response.data) {
          setReviews(response.data.reviews);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [materialId]);

  if (loading) {
    return (
      <div className={`animate-pulse space-y-3 ${className}`}>
        <div className="h-20 bg-gray-100 rounded-lg"></div>
        <div className="h-20 bg-gray-100 rounded-lg"></div>
        <div className="h-20 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className={`text-center py-6 text-gray-500 text-sm ${className}`}>
        No reviews yet. Be the first to review this material!
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {reviews.map((review) => (
        <div 
          key={review.id} 
          className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
        >
          {/* User Info & Rating */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                {review.user_profile?.avatar_url ? (
                  <Image 
                    src={review.user_profile.avatar_url} 
                    alt={review.user_profile.full_name}
                    width={32}
                    height={32}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {review.user_profile?.full_name || 'Anonymous'}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(review.created_at)}
                </p>
              </div>
            </div>
            
            {/* Rating Stars */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= review.rating
                      ? 'text-yellow-500 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Review Text */}
          {review.review && (
            <p className="text-sm text-gray-700 leading-relaxed">
              {review.review}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
