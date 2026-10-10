'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface ShareButtonProps {
  materialId: string;
  title: string;
  className?: string;
  showText?: boolean;
  onAuthRequired?: () => void;
}

export default function ShareButton({
  materialId,
  title,
  className,
  showText = false,
  onAuthRequired
}: ShareButtonProps) {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    // If user is not logged in, call onAuthRequired callback
    if (!user) {
      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.generateShareLink(materialId);

      if (response.success && response.data) {
        // Create a link to the material details page
        const shareUrl = `${window.location.origin}/materials/${materialId}`;
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to generate share link:', error);
      alert('Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const iconSize = className?.includes('p-1') ? 'h-3.5 w-3.5' : 'h-5 w-5';

  return (
    <button
      onClick={handleShare}
      disabled={loading || copied}
      className={className || "p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"}
      title={user ? "Share material" : "Sign in to share"}
    >
      {copied ? <Check className={iconSize + " text-green-600"} /> : <Share2 className={iconSize} />}
      {showText && (
        <span className="text-sm font-medium">
          {copied ? 'Copied!' : 'Share'}
        </span>
      )}
    </button>
  );
}
