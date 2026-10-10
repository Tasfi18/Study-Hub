'use client';

import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  totalReviews?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export default function RatingStars({ 
  rating, 
  totalReviews,
  size = 'sm',
  interactive = false,
  onRatingChange 
}: RatingStarsProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  };

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(value)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`${sizeClasses[size]} ${
                value <= Math.floor(rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : value === Math.ceil(rating) && rating % 1 !== 0
                  ? 'fill-yellow-400/50 text-yellow-400'
                  : 'fill-gray-200 text-gray-200'
              }`}
            />
          </button>
        ))}
      </div>
      {!interactive && (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <span className="font-medium">{rating.toFixed(1)}</span>
          {totalReviews !== undefined && (
            <span className="text-gray-400">({totalReviews})</span>
          )}
        </div>
      )}
    </div>
  );
}
