'use client';


import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UploadMaterialForm } from '@/types';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Button from './Button';
import Modal from './Modal';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface FilterOptions {
  disciplines: Array<{ id: string; name: string; code: string }>;
  terms: Array<{ id: string; term: string; discipline_id: string }>;
  courseCodes: Array<{ id: string; code: string; title: string; discipline_id: string }>;
}

const uploadSchema = z.object({
  title: z.string().min(3, 'Title required').max(200),
  description: z.string().max(1000).optional(),
  disciplineId: z.string().min(1, 'Select discipline'),
  termId: z.string().optional(),
  courseCodeId: z.string().optional(),
  category: z.string().optional(),
});

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  
  const isSuperAdmin = user?.role === 'super_admin';
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<Omit<UploadMaterialForm, 'file'>>({
    resolver: zodResolver(uploadSchema),
  });

  const selectedDiscipline = watch('disciplineId');

  useEffect(() => {
    if (isOpen) {
      loadFilterOptions();
      reset();
      setSelectedFile(null);
      setUploadError(null);
      
      // Auto-populate discipline for non-super_admin users
      if (user && !isSuperAdmin && user.discipline_id) {
        setValue('disciplineId', user.discipline_id);
      }
    }
  }, [isOpen, reset, user, isSuperAdmin, setValue]);

  useEffect(() => {
    if (selectedDiscipline) {
      setValue('termId', '');
      setValue('courseCodeId', '');
    }
  }, [selectedDiscipline, setValue]);

  const loadFilterOptions = async () => {
    try {
      const response = await apiClient.getFilterOptions();
      if (response.success && response.data) {
        setFilterOptions(response.data);
      }
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const getFilteredTerms = () => {
    if (!filterOptions?.terms || !selectedDiscipline) return [];
    return filterOptions.terms.filter(term => term.discipline_id === selectedDiscipline);
  };

  const getFilteredCourseCodes = () => {
    if (!filterOptions?.courseCodes || !selectedDiscipline) return [];
    return filterOptions.courseCodes.filter(course => course.discipline_id === selectedDiscipline);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif'],
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm'],
      'video/ogg': ['.ogg'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi'],
      'video/x-matroska': ['.mkv'],
      'video/x-m4v': ['.m4v'],
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
      'application/x-7z-compressed': ['.7z'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
    noClick: false,
    noKeyboard: false,
    useFsAccessApi: false,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        setUploadError('File not supported or too large (max 100MB)');
        return;
      }
      
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        setUploadError(null);
      }
    },
  });
  
const onSubmit = async (data: Omit<UploadMaterialForm, 'file'>) => {
  if (!selectedFile) {
    setUploadError('Please select a file');
    return;
  }

  setUploading(true);
  setUploadProgress(0);
  setUploadError(null);

  try {
    // Step 1: Get presigned URL from backend
    const presignedResponse = await apiClient.getPresignedUploadUrl({
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      contentType: selectedFile.type,
      disciplineId: data.disciplineId,
    });

    if (!presignedResponse.success || !presignedResponse.data) {
      // Show detailed error if available
      const errorMsg = presignedResponse.details 
        ? `${presignedResponse.message}\n${presignedResponse.details.join('\n')}`
        : presignedResponse.message || 'Failed to get upload URL';
      throw new Error(errorMsg);
    }

    const { uploadUrl, publicUrl, filePath, fileName } = presignedResponse.data;

    // Step 2: Upload directly to R2 with progress tracking
    await apiClient.uploadToPresignedUrl(uploadUrl, selectedFile, (progress) => {
      setUploadProgress(progress);
    });

    // Step 3: Confirm upload with backend
    const confirmResponse = await apiClient.confirmUpload({
      title: data.title,
      description: data.description || undefined,
      disciplineId: data.disciplineId,
      batchId: data.termId || undefined,
      courseCodeId: data.courseCodeId || undefined,
      category: data.category || undefined,
      tags: [], // Empty array instead of undefined
      filePath: publicUrl,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      mimeType: selectedFile.type,
    });

    if (confirmResponse.success) {
      reset();
      setSelectedFile(null);
      setUploadProgress(0);
      onSuccess?.();
      onClose();
    } else {
      // Show detailed error if available
      const errorMsg = confirmResponse.details 
        ? `${confirmResponse.message}\n${confirmResponse.details.join('\n')}`
        : confirmResponse.message || 'Failed to save material information';
      setUploadError(errorMsg);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
    setUploadError(errorMessage);
    console.error('Upload error:', error);
  } finally {
    setUploading(false);
    setUploadProgress(0);
  }
};

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Material</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* File Upload */}
          <div>
            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
                } touch-manipulation`}
                style={{ minHeight: '120px' }}
              >
                <input {...getInputProps({ accept: '.pdf,.ppt,.pptx,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.mp4,.webm,.ogg,.mov,.avi,.mkv,.m4v,.zip,.rar,.7z' })} />
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-base font-medium text-gray-700 mb-2">
                  {isDragActive ? 'Drop file here' : 'Tap to choose file'}
                </p>
                <p className="text-sm text-gray-500 mb-2">or drag and drop</p>
                <p className="text-xs text-gray-500">PDF, PPT, DOC, TXT, Images, Videos, ZIP • Max 100MB</p>
              </div>
            ) : (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-900 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-green-700">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-green-600 hover:text-green-800 p-1 touch-manipulation"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            
            {uploadError && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {uploadError}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              {...register('title')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter material title"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Discipline & Term */}
          <div className="grid grid-cols-2 gap-3">
            {/* Only show discipline selector for super_admin */}
            {isSuperAdmin ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discipline *</label>
                <select
                  {...register('disciplineId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select</option>
                  {filterOptions?.disciplines.map(discipline => (
                    <option key={discipline.id} value={discipline.id}>
                      {discipline.name}
                    </option>
                  ))}
                </select>
                {errors.disciplineId && (
                  <p className="mt-1 text-xs text-red-600">{errors.disciplineId.message}</p>
                )}
              </div>
            ) : (
              <input type="hidden" {...register('disciplineId')} />
            )}

            <div className={isSuperAdmin ? '' : 'col-span-2'}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
              <select
                {...register('termId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                disabled={!selectedDiscipline}
              >
                <option value="">Select</option>
                {getFilteredTerms().map(term => (
                  <option key={term.id} value={term.id}>
                    {term.term}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Course & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select
                {...register('courseCodeId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 text-sm"
                disabled={!selectedDiscipline}
              >
                <option value="">Select course (optional)</option>
                {getFilteredCourseCodes().map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select category (optional)</option>
                <option value="ct_question">CT Questions</option>
                <option value="previous_question">Previous Questions</option>
                <option value="final_question">Final Questions</option>
                <option value="assignment">Assignments</option>
                <option value="lecture_note">Lecture Notes</option>
                <option value="lab_manual">Lab Manuals</option>
                <option value="syllabus">Syllabus</option>
                <option value="book">Books</option>
                <option value="thesis">Thesis</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Brief description (optional)"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={uploading}
              disabled={uploading || !selectedFile}
              className="flex-1"
            >
              Upload
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default UploadModal;
