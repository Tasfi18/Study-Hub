'use client';

import { Sparkles, UserPlus } from 'lucide-react';

interface GuestBannerProps {
  onAuthModalOpen: () => void;
}

export default function GuestBanner({ onAuthModalOpen }: GuestBannerProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-5 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 bg-[#135bec] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-bold text-[#0d121b] mb-1">
            Welcome to Study Hub! 🎓
          </h3>
          <p className="text-sm text-[#4c669a] leading-relaxed">
            Browse freely! To <span className="font-semibold text-[#135bec]">download materials and track your progress</span>, create your free account.
          </p>
        </div>
        <button
          onClick={onAuthModalOpen}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#135bec] hover:bg-[#0d4ac7] text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>Join Now - Free</span>
        </button>
      </div>
    </div>
  );
}
