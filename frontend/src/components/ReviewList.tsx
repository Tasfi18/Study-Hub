'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ReviewListProps {
  materialId: string;
  reviews: any[];
  stats: {
    average: number;
    total: number;
    distribution: Record<number, number>;
  };
}

export default function ReviewList({ materialId, reviews: initialReviews, stats }: ReviewListProps) {
  const [reviews, setReviews] = useState(initialReviews);
  
  const getPercentage = (count: number) => {
    if (!stats.total) return 0;
    return (count / stats.total) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-start gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">
              {stats.average.toFixed(1)}
            </div>
            <div className="flex justify-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.floor(stats.average)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {stats.total} reviews
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-3">{rating}</span>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: `${getPercentage(stats.distribution[rating])}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">
                  {stats.distribution[rating]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reviews yet</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-gray-900">
                    {review.user_profile?.full_name || 'Anonymous'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              {review.review && (
                <p className="text-gray-700 mt-2">{review.review}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
