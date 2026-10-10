'use client';

import Link from 'next/link';
import { Download, Star, Eye, Calendar, HardDrive } from 'lucide-react';
import { Material } from '@/types';
import {
  formatFileSize,
  formatDateShort,
  getCategoryDisplayName,
  getInitials
} from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import BookmarkButton from '@/components/BookmarkButton';
import ShareButton from '@/components/ShareButton';
import AddToCollection from '@/components/AddToCollection';

interface MaterialCardProps {
  material: Material;
  onDownload: (materialId: string) => void;
  downloading: boolean;
  onAuthRequired?: () => void;
}

// Get category image URL (using Unsplash for high-quality free images)
function getCategoryImage(category: string): string {
  switch (category) {
    case 'previous_question':
    case 'ct_question':
    case 'final_question':
      // Exam/Test themed image
      return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop&q=80';
    case 'assignment':
      // Task/Checklist themed image
      return 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=250&fit=crop&q=80';
    case 'lecture_note':
      // Notes/Study themed image
      return 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400&h=250&fit=crop&q=80';
    case 'lab_manual':
      // Science/Lab themed image
      return 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=250&fit=crop&q=80';
    case 'syllabus':
      // Schedule/Calendar themed image
      return 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=250&fit=crop&q=80';
    case 'book':
      // Books/Library themed image
      return 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop&q=80';
    case 'thesis':
      // Graduation/Academic themed image
      return 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=250&fit=crop&q=80';
    default:
      // General academic themed image
      return 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=250&fit=crop&q=80';
  }
}

// Get file extension display
function getFileExtension(fileType: string): string {
  const ext = fileType?.toLowerCase() || '';
  if (ext.includes('pdf')) return 'PDF';
  if (ext.includes('doc')) return 'DOC';
  if (ext.includes('xls')) return 'XLS';
  if (ext.includes('ppt')) return 'PPT';
  if (ext.includes('zip') || ext.includes('rar')) return 'ZIP';
  if (ext.includes('txt')) return 'TXT';
  if (ext.includes('image') || ext.includes('png') || ext.includes('jpg')) return 'IMG';
  return 'FILE';
}

// Get file type badge color
function getFileTypeBadgeColor(fileType: string): string {
  const ext = fileType?.toLowerCase() || '';
  if (ext.includes('pdf')) return 'bg-red-500 text-white';
  if (ext.includes('doc')) return 'bg-blue-500 text-white';
  if (ext.includes('xls')) return 'bg-green-500 text-white';
  if (ext.includes('ppt')) return 'bg-orange-500 text-white';
  if (ext.includes('zip') || ext.includes('rar')) return 'bg-yellow-500 text-white';
  return 'bg-gray-500 text-white';
}

// Get category color for badge
function getCategoryColor(category: string): string {
  switch (category) {
    case 'ct_question': return 'bg-blue-100 text-blue-700';
    case 'previous_question': return 'bg-purple-100 text-purple-700';
    case 'final_question': return 'bg-red-100 text-red-700';
    case 'assignment': return 'bg-green-100 text-green-700';
    case 'lecture_note': return 'bg-amber-100 text-amber-700';
    case 'lab_manual': return 'bg-orange-100 text-orange-700';
    case 'syllabus': return 'bg-cyan-100 text-cyan-700';
    case 'book': return 'bg-indigo-100 text-indigo-700';
    case 'thesis': return 'bg-pink-100 text-pink-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

// Get avatar background color based on name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500'
  ];
  const index = name?.charCodeAt(0) % colors.length || 0;
  return colors[index];
}

export default function MaterialCard({
  material,
  onDownload,
  downloading,
  onAuthRequired
}: MaterialCardProps) {
  const { user } = useAuthStore();
  const categoryImage = getCategoryImage(material.category || 'other');
  const fileExt = getFileExtension(material.file_type);
  const fileBadgeColor = getFileTypeBadgeColor(material.file_type);

  const uploaderName = material.uploaded_by_profile?.full_name || 'Unknown';
  const uploaderInitials = getInitials(uploaderName);
  const avatarColor = getAvatarColor(uploaderName);

  return (
    <article className="group flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Thumbnail Area with Real Image */}
      <div className="relative h-40 overflow-hidden">
        {/* Background Image */}
        <img
          src={categoryImage}
          alt={getCategoryDisplayName(material.category || 'other')}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Dark Overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* File Type Badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-md shadow-md ${fileBadgeColor}`}>
          <span className="text-[10px] font-bold uppercase tracking-wide">
            {fileExt}
          </span>
        </div>

        {/* Bookmark Button */}
        {user && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <BookmarkButton
              materialId={material.id}
              initialBookmarked={material.is_bookmarked}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-[#135bec] shadow-sm"
            />
          </div>
        )}

        {/* Category Badge on Image */}
        {material.category && (
          <div className="absolute bottom-3 left-3">
            <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${getCategoryColor(material.category)} shadow-sm`}>
              {getCategoryDisplayName(material.category)}
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3 className="font-bold text-base text-gray-900 leading-tight mb-2 line-clamp-2 group-hover:text-[#135bec] transition-colors">
          {material.title}
        </h3>

        {/* Discipline */}
        {material.discipline?.name && (
          <p className="text-sm text-gray-500 mb-2">
            {material.discipline.name}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-sm font-bold text-gray-900">
            {material.average_rating?.toFixed(1) || '0.0'}
          </span>
          <span className="text-sm text-gray-500">
            ({material.total_reviews || 0})
          </span>
        </div>

        {/* Description */}
        {material.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
            {material.description}
          </p>
        )}

        {/* File Size, Downloads, Date */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5" />
            <span>{formatFileSize(material.file_size)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            <span>{material.download_count > 1000 ? `${(material.download_count / 1000).toFixed(1)}k` : material.download_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDateShort(material.created_at)}</span>
          </div>
        </div>

        {/* Uploader Info */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-2">
            {/* Avatar */}
            {material.uploaded_by_profile?.avatar_url ? (
              <img
                src={material.uploaded_by_profile.avatar_url}
                alt={uploaderName}
                className="w-7 h-7 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                {uploaderInitials}
              </div>
            )}
            <span className="text-sm text-gray-600">
              By <span className="font-medium text-gray-800">{uploaderName}</span>
            </span>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            {/* Bookmark */}
            {user && (
              <BookmarkButton
                materialId={material.id}
                initialBookmarked={material.is_bookmarked}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-[#135bec] transition-colors"
              />
            )}

            {/* Add to Collection */}
            {user && (
              <AddToCollection
                materialId={material.id}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors"
              />
            )}

            {/* Share */}
            <ShareButton
              materialId={material.id}
              title={material.title}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors"
              onAuthRequired={onAuthRequired}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex gap-2">
          {/* Download Button - Primary */}
          <button
            onClick={() => onDownload(material.id)}
            disabled={downloading || material.status !== 'approved'}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${downloading
                ? 'bg-gray-100 text-gray-400 cursor-wait'
                : material.status === 'approved'
                  ? 'bg-[#2b4bee] text-white hover:bg-[#2343d0]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            title={material.status !== 'approved' ? 'Material pending approval' : 'Download'}
          >
            <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
            {downloading ? 'Downloading...' : 'Download'}
          </button>

          {/* Details Button - Light/Secondary */}
          <Link
            href={`/materials/${material.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-slate-500 text-sm font-medium hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
