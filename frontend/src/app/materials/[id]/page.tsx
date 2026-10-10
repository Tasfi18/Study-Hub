'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Material } from '@/types';
import { apiClient } from '@/lib/api';
import { formatFileSize, formatRelativeTime, getCategoryDisplayName, downloadFile, isAdminUser, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  Download, FileText, Clock, Star, Trash2, Flag,
  Share2, CheckCircle, Bookmark,
  ChevronRight, Maximize2, ZoomIn, ZoomOut, AlertCircle
} from 'lucide-react';
import BookmarkButton from '@/components/BookmarkButton';
import ReviewModal from '@/components/ReviewModal';
import AddToCollection from '@/components/AddToCollection';
import ShareButton from '@/components/ShareButton';
import ReviewsList from '@/components/ReviewsList';
import AuthModal from '@/components/AuthModal';
import { Review } from '@/types';

export default function MaterialDetailPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; materialId: string; title: string }>({
    isOpen: false,
    materialId: '',
    title: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; materialId: string; title: string }>({
    isOpen: false,
    materialId: '',
    title: ''
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [ratingDistribution, setRatingDistribution] = useState<{ [key: number]: number }>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  const materialId = params.id as string;

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getMaterialById(materialId);

        if (response.success && response.data) {
          setMaterial(response.data);
          // Track view
          apiClient.trackView(materialId).catch(() => { });
        } else {
          // Material not found, redirect to home
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Failed to fetch material:', error);
        window.location.href = '/';
      } finally {
        setLoading(false);
      }
    };

    if (materialId) {
      fetchMaterial();
    }
  }, [materialId]);

  // Fetch reviews and calculate rating distribution
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await apiClient.getReviews(materialId, 1, 100);
        if (response.success && response.data) {
          setReviews(response.data.reviews);

          // Calculate rating distribution
          const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          response.data.reviews.forEach((review: Review) => {
            if (review.rating >= 1 && review.rating <= 5) {
              distribution[review.rating]++;
            }
          });
          setRatingDistribution(distribution);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      }
    };

    if (materialId) {
      fetchReviews();
    }
  }, [materialId]);

  const handleDownload = async () => {
    if (!user) {
      // Show login modal for guests instead of redirecting
      setShowAuthModal(true);
      return;
    }

    try {
      setDownloading(true);
      const response = await apiClient.downloadMaterial(materialId);
      if (response.success && response.data) {
        downloadFile(response.data.downloadUrl, response.data.fileName || 'download');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download material');
    } finally {
      setDownloading(false);
    }
  };

  const canDeleteMaterial = (material: Material): boolean => {
    if (!user || !material.uploaded_by) return false;
    if (isAdminUser(user.role)) return true;
    return material.uploaded_by === user.id;
  };

  const handleDelete = async () => {
    if (!material) return;

    try {
      const response = await apiClient.deleteMaterial(materialId);
      if (response.success) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete material');
    }
  };

  // Get avatar color based on name
  const getAvatarColor = (name: string): string => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  // Get file type display
  const getFileType = (fileType: string): string => {
    const ext = fileType?.toLowerCase() || '';
    if (ext.includes('pdf')) return 'PDF';
    if (ext.includes('doc')) return 'DOCX';
    if (ext.includes('ppt')) return 'PPTX';
    if (ext.includes('xls')) return 'XLSX';
    return 'FILE';
  };

  // Get preview image based on category - high-quality colorful images
  const getPreviewImage = (category: string, _fileType: string, materialId: string): string => {
    // High-quality, colorful study-themed images (properly sized for 5:2 aspect ratio)
    const colorfulPreviews = [
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=480&fit=crop&q=80', // Books study warm
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&h=480&fit=crop&q=80', // Blue books
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=480&fit=crop&q=80', // Colorful supplies
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=480&fit=crop&q=80', // Study desk
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=480&fit=crop&q=80', // Library warm
      'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1200&h=480&fit=crop&q=80', // Open book
      'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1200&h=480&fit=crop&q=80', // Coffee study
      'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1200&h=480&fit=crop&q=80'  // Writing notes
    ];

    // Category-specific colorful images
    const categoryImages: { [key: string]: string } = {
      'assignment': 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&h=480&fit=crop&q=80',
      'lab_manual': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=480&fit=crop&q=80',
      'ct_question': 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=1200&h=480&fit=crop&q=80',
      'final_question': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=480&fit=crop&q=80',
      'previous_question': 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&h=480&fit=crop&q=80',
      'lecture_note': 'https://images.unsplash.com/photo-1517842536804-47c79d3c5a17?w=1200&h=480&fit=crop&q=80'
    };

    // Check for category-specific image
    if (categoryImages[category]) {
      return categoryImages[category];
    }

    // Use material ID to deterministically pick an image
    const hash = materialId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colorfulPreviews[hash % colorfulPreviews.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f6f8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2b4bee] border-t-transparent"></div>
          </div>
          <p className="text-[#616889]">Loading material...</p>
        </div>
      </div>
    );
  }

  if (!material) {
    return null;
  }

  const uploaderName = material.uploaded_by_profile?.full_name || 'Unknown';
  const uploaderInitials = getInitials(uploaderName);
  const avatarColor = getAvatarColor(uploaderName);

  return (
    <div className="min-h-screen bg-[#f6f6f8]">

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 lg:px-10 py-6 lg:py-8">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap gap-2 mb-6 text-sm lg:text-base items-center">
          <Link href="/" className="text-[#616889] hover:text-[#2b4bee] font-medium">Home</Link>
          <ChevronRight className="w-4 h-4 text-[#616889]" />
          {material.discipline?.name && (
            <>
              <span className="text-[#616889] font-medium">{material.discipline.name}</span>
              <ChevronRight className="w-4 h-4 text-[#616889]" />
            </>
          )}
          {material.course_code?.code && (
            <>
              <span className="text-[#616889] font-medium">{material.course_code.code}</span>
              <ChevronRight className="w-4 h-4 text-[#616889]" />
            </>
          )}
          <span className="text-[#111218] font-medium">{getCategoryDisplayName(material.category || 'other')}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Main Content */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Heading Info */}
            <div className="flex flex-col gap-3">
              <h1 className="text-[#111218] text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
                {material.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-[#616889] text-sm lg:text-base">
                {/* Uploader */}
                <div className="flex items-center gap-2">
                  {material.uploaded_by_profile?.avatar_url ? (
                    <img
                      src={material.uploaded_by_profile.avatar_url}
                      alt={uploaderName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-6 h-6 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                      {uploaderInitials}
                    </div>
                  )}
                  <span className="font-medium text-[#111218]">{uploaderName}</span>
                  {material.status === 'approved' && (
                    <CheckCircle className="w-4 h-4 text-[#2b4bee] fill-[#2b4bee]" />
                  )}
                </div>
                <span className="w-1 h-1 rounded-full bg-[#dbdde6]"></span>
                <span>Uploaded {formatRelativeTime(material.created_at)}</span>
                <span className="w-1 h-1 rounded-full bg-[#dbdde6]"></span>
                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-[#111218]">{material.average_rating?.toFixed(1) || '0.0'}</span>
                  <span>({material.total_reviews || 0})</span>
                </div>
              </div>
            </div>

            {/* File Preview */}
            <div className="w-full bg-[#f0f1f4] rounded-xl overflow-hidden border border-[#e5e7eb] shadow-sm group relative">
              <div className="aspect-[5/2] w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
                {/* Fallback placeholder - always rendered but hidden when image loads */}
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2/3 h-[85%] bg-white shadow-lg border border-gray-200 p-4 flex flex-col gap-2 overflow-hidden">
                      <div className="h-5 w-2/3 bg-gray-100 rounded"></div>
                      <div className="h-3 w-full bg-gray-50 rounded"></div>
                      <div className="h-3 w-full bg-gray-50 rounded"></div>
                      <div className="h-3 w-5/6 bg-gray-50 rounded"></div>
                      <div className="h-16 w-full bg-blue-50 rounded mt-2 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-blue-200" />
                      </div>
                      <div className="h-3 w-full bg-gray-50 rounded mt-2"></div>
                      <div className="h-3 w-4/5 bg-gray-50 rounded"></div>
                    </div>
                  </div>
                )}
                {/* Preview Image based on category */}
                <img
                  src={getPreviewImage(material.category || 'other', material.file_type, material.id)}
                  alt={`Preview of ${material.title}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(false)}
                />
                {/* Overlay for "Click to expand" */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[1px]">
                  <button
                    onClick={handleDownload}
                    className="bg-white text-[#111218] px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform"
                  >
                    <Maximize2 className="w-5 h-5" />
                    Preview & Download
                  </button>
                </div>
              </div>
              <div className="bg-white p-4 flex justify-between items-center border-t border-[#e5e7eb]">
                <span className="text-sm font-medium text-[#616889]">{getFileType(material.file_type)} Document</span>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full text-[#616889]">
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full text-[#616889]">
                    <ZoomIn className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Description */}
            {material.description && (
              <div className="bg-white p-6 lg:p-8 rounded-xl border border-[#e5e7eb]">
                <h3 className="text-xl font-bold mb-4 text-[#111218]">Description</h3>
                <div className="prose max-w-none text-[#616889] leading-relaxed">
                  <p className="whitespace-pre-wrap">{material.description}</p>
                </div>
              </div>
            )}

            {/* Ratings & Reviews */}
            <div className="bg-white p-6 lg:p-8 rounded-xl border border-[#e5e7eb]">
              <h3 className="text-xl font-bold mb-6 text-[#111218]">Reviews & Ratings</h3>

              {/* Rating Summary */}
              <div className="flex flex-wrap gap-x-12 gap-y-6 mb-8 pb-8 border-b border-[#f0f1f4]">
                <div className="flex flex-col gap-2 justify-center">
                  <p className="text-[#111218] text-5xl font-black leading-tight tracking-[-0.033em]">
                    {material.average_rating?.toFixed(1) || '0.0'}
                  </p>
                  <div className="flex gap-1 text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= Math.floor(material.average_rating || 0)
                          ? 'fill-current'
                          : star === Math.ceil(material.average_rating || 0) && (material.average_rating || 0) % 1 >= 0.5
                            ? 'fill-current opacity-50'
                            : 'text-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                  <p className="text-[#616889] text-sm font-normal">Based on {material.total_reviews || 0} reviews</p>
                </div>

                {/* Rating Distribution Bars - Only show if there are reviews */}
                {reviews.length > 0 && (
                  <div className="grid min-w-[240px] flex-1 grid-cols-[20px_1fr_40px] items-center gap-y-2 gap-x-3">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = ratingDistribution[rating] || 0;
                      const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                      return (
                        <div key={rating} className="contents">
                          <p className="text-[#111218] text-sm font-medium">{rating}</p>
                          <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-[#f0f1f4]">
                            <div
                              className="rounded-full bg-[#2b4bee] transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                opacity: 0.5 + (rating / 10)
                              }}
                            ></div>
                          </div>
                          <p className="text-[#616889] text-sm font-normal text-right">
                            {percentage}%
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Individual Reviews */}
              {material.status === 'approved' && material.total_reviews && material.total_reviews > 0 ? (
                <ReviewsList materialId={material.id} />
              ) : (
                <p className="text-[#616889] text-center py-8">No reviews yet. Be the first to review!</p>
              )}

              {/* Write Review Button */}
              {material.status === 'approved' && user && (
                <button
                  onClick={() => setReviewModal({
                    isOpen: true,
                    materialId: material.id,
                    title: material.title
                  })}
                  className="mt-6 text-[#2b4bee] font-medium text-sm hover:underline"
                >
                  {material.user_has_reviewed ? 'Update your review' : 'Write a review'}
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Main Action Card */}
            <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-sm sticky top-24">
              {/* Download Button */}
              {material.status === 'approved' ? (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-[#2b4bee] hover:bg-blue-700 text-white font-bold h-12 rounded-lg flex items-center justify-center gap-2 mb-4 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
                >
                  {downloading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  {downloading ? 'Downloading...' : `Download File (${formatFileSize(material.file_size)})`}
                </button>
              ) : (
                <div className="w-full bg-gray-100 text-gray-500 font-bold h-12 rounded-lg flex items-center justify-center mb-4">
                  {material.status === 'pending' ? 'Pending Approval' : 'Not Available'}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between gap-2">
                {user ? (
                  <>
                    <BookmarkButton
                      materialId={material.id}
                      initialBookmarked={material.is_bookmarked || false}
                      className="flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-lg hover:bg-[#f6f6f8] text-[#616889] transition-colors group"
                      showText={true}
                    />
                    <ShareButton
                      materialId={material.id}
                      title={material.title}
                      className="flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-lg hover:bg-[#f6f6f8] text-[#616889] transition-colors group"
                      showText={true}
                    />
                    <button className="flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-lg hover:bg-[#f6f6f8] text-[#616889] transition-colors group">
                      <Flag className="w-6 h-6 group-hover:text-red-500" />
                      <span className="text-xs font-medium">Report</span>
                    </button>
                  </>
                ) : (
                  <p className="w-full text-center text-sm text-[#616889] py-2">
                    Sign in to save, share, or report
                  </p>
                )}
              </div>

              {/* File Details */}
              <div className="mt-6 pt-6 border-t border-[#f0f1f4]">
                <h4 className="text-sm font-bold text-[#111218] uppercase tracking-wider mb-4">File Details</h4>
                <div className="flex flex-col gap-3">
                  {material.course_code && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#616889]">Course</span>
                      <span className="font-medium text-[#111218]">{material.course_code.code}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#616889]">Format</span>
                    <span className="font-medium text-[#111218] uppercase">{getFileType(material.file_type)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#616889]">Downloads</span>
                    <span className="font-medium text-[#111218]">{material.download_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#616889]">File Size</span>
                    <span className="font-medium text-[#111218]">{formatFileSize(material.file_size)}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {material.tags && material.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[#f0f1f4]">
                  <h4 className="text-sm font-bold text-[#111218] uppercase tracking-wider mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {material.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#f0f1f4] hover:bg-[#2b4bee]/10 hover:text-[#2b4bee] text-[#616889] text-sm rounded-full transition-colors cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete Button for Owner/Admin */}
              {canDeleteMaterial(material) && (
                <div className="mt-6 pt-6 border-t border-[#f0f1f4]">
                  <button
                    onClick={() => setDeleteConfirm({
                      isOpen: true,
                      materialId: material.id,
                      title: material.title
                    })}
                    className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Material
                  </button>
                </div>
              )}
            </div>

            {/* Rejection Notice */}
            {material.status === 'rejected' && material.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-900 mb-1">Material Rejected</h3>
                    <p className="text-sm text-red-700">{material.rejection_reason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <ReviewModal
          isOpen={reviewModal.isOpen}
          materialId={reviewModal.materialId}
          materialTitle={reviewModal.title}
          onClose={() => setReviewModal({ isOpen: false, materialId: '', title: '' })}
          onReviewSubmitted={() => {
            setReviewModal({ isOpen: false, materialId: '', title: '' });
            window.location.reload();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Material</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<span className="font-semibold">{deleteConfirm.title}</span>"?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, materialId: '', title: '' })}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for guests */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialView="login"
      />
    </div>
  );
}
