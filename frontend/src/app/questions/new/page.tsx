'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';
import { CreateQuestionForm } from '@/types';
import { ArrowLeft, Plus, X } from 'lucide-react';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';

interface FilterOptions {
  disciplines: Array<{ id: string; name: string; code: string }>;
  terms: Array<{ id: string; term: string; discipline_id: string }>;
  courseCodes: Array<{ id: string; code: string; title: string; discipline_id: string }>;
}

export default function NewQuestionPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateQuestionForm>({
    title: '',
    content: '',
    disciplineId: '',
    batchId: undefined,
    courseCodeId: undefined,
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  // Define loadFilterOptions function with useCallback
  const loadFilterOptions = useCallback(async () => {
    try {
      const response = await apiClient.getFilterOptions();
      if (response.success && response.data) {
        setFilterOptions(response.data);
        // Auto-select user's discipline if available and not super_admin
        if (user?.discipline_id && !isSuperAdmin) {
          setFormData(prev => ({ ...prev, disciplineId: user.discipline_id! }));
        }
      }
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  }, [user, isSuperAdmin]);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadFilterOptions();
  }, [user, router, loadFilterOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.disciplineId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setImageError(null);

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('content', formData.content.trim());
      submitData.append('disciplineId', formData.disciplineId);

      if (formData.batchId) {
        submitData.append('batchId', formData.batchId);
      }
      if (formData.courseCodeId) {
        submitData.append('courseCodeId', formData.courseCodeId);
      }
      if (formData.tags && formData.tags.length > 0) {
        submitData.append('tags', JSON.stringify(formData.tags.filter(tag => tag.trim())));
      }
      if (selectedImage) {
        submitData.append('image', selectedImage);
      }

      const response = await apiClient.createQuestion(submitData);

      if (response.success) {
        router.push('/questions');
      } else {
        alert(response.error || 'Failed to create question');
      }
    } catch (error) {
      console.error('Create question error:', error);
      alert('Failed to create question. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const getFilteredTerms = () => {
    if (!filterOptions?.terms || !formData.disciplineId) return [];
    return filterOptions.terms.filter(term => term.discipline_id === formData.disciplineId);
  };

  const getFilteredCourseCodes = () => {
    if (!filterOptions?.courseCodes || !formData.disciplineId) return [];
    return filterOptions.courseCodes.filter(course => course.discipline_id === formData.disciplineId);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-bold text-blue-600">Study Hub</Link>
              <Link href="/questions" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                Q&A
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-sm text-gray-500">
                Welcome, <span className="font-semibold text-gray-900">{user.full_name}</span>
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton href="/questions" label="Back to Questions" />
          <h1 className="text-3xl font-bold text-gray-900">Ask a Question</h1>
        </div>

        {/* Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Question Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What's your question? Be specific and clear..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={200}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 characters</p>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Question Details *
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Provide more details about your question. Include any relevant context, what you've tried, or specific areas where you need help..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                required
              />
            </div>
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attach Image
              </label>
              <ImageUpload
                selectedFile={selectedImage}
                onFileSelect={(file) => {
                  setSelectedImage(file);
                  setImageError(null);
                }}
                error={imageError}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Add a screenshot, diagram, or image to help explain your question
              </p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Only show discipline selector for super_admin */}
              {isSuperAdmin && (
                <div>
                  <label htmlFor="discipline" className="block text-sm font-medium text-gray-700 mb-2">
                    Discipline *
                  </label>
                  <select
                    id="discipline"
                    value={formData.disciplineId}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      disciplineId: e.target.value,
                      batchId: undefined,
                      courseCodeId: undefined
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Discipline</option>
                    {filterOptions?.disciplines.map((discipline) => (
                      <option key={discipline.id} value={discipline.id}>
                        {discipline.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={isSuperAdmin ? '' : 'md:col-span-2'}>
                <label htmlFor="batch" className="block text-sm font-medium text-gray-700 mb-2">
                  Term (Optional)
                </label>
                <select
                  id="batch"
                  value={formData.batchId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, batchId: e.target.value || undefined }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!formData.disciplineId}
                >
                  <option value="">Any Term</option>
                  {getFilteredTerms().map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.term}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Course (Optional)
                </label>
                <select
                  id="courseCode"
                  value={formData.courseCodeId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, courseCodeId: e.target.value || undefined }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!formData.disciplineId}
                >
                  <option value="">Any Course</option>
                  {getFilteredCourseCodes().map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (Optional)
              </label>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tags to help categorize your question..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/questions"
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Posting...' : 'Post Question'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}