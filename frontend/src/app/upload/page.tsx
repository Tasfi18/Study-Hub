'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UploadMaterialForm } from '@/types';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Toast, { ToastType } from '@/components/Toast';
import {
    Upload, X, AlertCircle, CheckCircle, FileText, Lock, Home,
    ArrowRight, User, Lightbulb, Star, ChevronDown
} from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface FilterOptions {
    disciplines: Array<{ id: string; name: string; code: string }>;
    terms: Array<{ id: string; term: string; discipline_id: string }>;
    courseCodes: Array<{ id: string; code: string; title: string; discipline_id: string; year?: number; term?: number }>;
}

const uploadSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().max(1000).optional(),
    disciplineId: z.string().min(1, 'Please select a discipline'),
    termId: z.string().optional(),
    courseCodeId: z.string().optional(),
    category: z.string().optional(),
});

export default function UploadPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

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
    const selectedTermId = watch('termId');

    const loadFilterOptions = useCallback(async () => {
        try {
            const response = await apiClient.getFilterOptions();
            if (response.success && response.data) {
                setFilterOptions(response.data);
            }
        } catch (error) {
            console.error('Failed to load filter options:', error);
        }
    }, []);

    useEffect(() => {
        loadFilterOptions();
        if (user && !isSuperAdmin && user.discipline_id) {
            setValue('disciplineId', user.discipline_id);
        }
    }, [user, isSuperAdmin, setValue, loadFilterOptions]);

    useEffect(() => {
        if (selectedDiscipline) {
            setValue('termId', '');
            setValue('courseCodeId', '');
        }
    }, [selectedDiscipline, setValue]);

    // Reset courseCodeId when term changes
    useEffect(() => {
        setValue('courseCodeId', '');
    }, [selectedTermId, setValue]);

    const getFilteredTerms = () => {
        if (!filterOptions?.terms || !selectedDiscipline) return [];
        return filterOptions.terms.filter(term => term.discipline_id === selectedDiscipline);
    };

    const getFilteredCourseCodes = () => {
        if (!filterOptions?.courseCodes || !selectedDiscipline) return [];

        // Get the selected term to extract year and semester
        const selectedTerm = filterOptions.terms.find(t => t.id === selectedTermId);

        return filterOptions.courseCodes.filter(course => {
            // First filter by discipline
            if (course.discipline_id !== selectedDiscipline) return false;

            // If a term is selected, filter by year and semester
            if (selectedTerm && selectedTermId) {
                // Term format is "year:semester" (e.g., "1:1")
                const [year, semester] = selectedTerm.term.split(':').map(Number);

                // Only filter if course has year/term defined
                if (course.year !== undefined && course.year !== null) {
                    if (course.year !== year) return false;
                }
                if (course.term !== undefined && course.term !== null) {
                    if (course.term !== semester) return false;
                }
            }

            return true;
        });
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
        },
        maxFiles: 1,
        maxSize: 100 * 1024 * 1024,
        onDrop: (acceptedFiles, rejectedFiles) => {
            if (rejectedFiles.length > 0) {
                setUploadError('File not supported or too large (max 100MB)');
                return;
            }
            if (acceptedFiles.length > 0) {
                setSelectedFile(acceptedFiles[0]);
                setUploadError(null);
                setUploadComplete(false);
            }
        },
    });

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const onSubmit = async (data: Omit<UploadMaterialForm, 'file'>) => {
        if (!selectedFile) {
            setUploadError('Please select a file');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setUploadError(null);

        try {
            const presignedResponse = await apiClient.getPresignedUploadUrl({
                fileName: selectedFile.name,
                fileSize: selectedFile.size,
                contentType: selectedFile.type,
                disciplineId: data.disciplineId,
            });

            if (!presignedResponse.success || !presignedResponse.data) {
                throw new Error(presignedResponse.message || 'Failed to get upload URL');
            }

            const { uploadUrl, publicUrl } = presignedResponse.data;

            await apiClient.uploadToPresignedUrl(uploadUrl, selectedFile, (progress) => {
                setUploadProgress(progress);
            });

            const confirmResponse = await apiClient.confirmUpload({
                title: data.title,
                description: data.description || undefined,
                disciplineId: data.disciplineId,
                batchId: data.termId || undefined,
                courseCodeId: data.courseCodeId || undefined,
                category: data.category || undefined,
                tags: tags,
                filePath: publicUrl,
                fileName: selectedFile.name,
                fileSize: selectedFile.size,
                mimeType: selectedFile.type,
            });

            if (confirmResponse.success) {
                setUploadComplete(true);
                setToast({ message: 'Material uploaded successfully! It will be reviewed shortly.', type: 'success' });
                setTimeout(() => {
                    router.push('/materials');
                }, 2000);
            } else {
                throw new Error(confirmResponse.message || 'Failed to save material');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
            setUploadError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const getFileIcon = () => {
        if (!selectedFile) return null;
        const ext = selectedFile.name.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return <FileText className="h-6 w-6 text-red-500" />;
        if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-6 w-6 text-blue-500" />;
        if (['ppt', 'pptx'].includes(ext || '')) return <FileText className="h-6 w-6 text-orange-500" />;
        return <FileText className="h-6 w-6 text-gray-500" />;
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-[#f6f6f8] flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#2b4bee] to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                        <Lock className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#111218] mb-3">Sign In Required</h1>
                    <p className="text-base text-[#616889] mb-8">You need to sign in to upload study materials.</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/?auth=signin')}
                            className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#2b4bee] hover:bg-[#2b4bee]/90 text-white rounded-lg font-semibold transition-all"
                        >
                            <User className="h-5 w-5" />
                            Sign In to Continue
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-[#111218] border border-[#dbdde6] rounded-lg font-semibold transition-all"
                        >
                            <Home className="h-5 w-5" />
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f6f8]">

            {/* Main Content */}
            <div className="px-4 md:px-12 xl:px-40 flex flex-1 justify-center py-8">
                <div className="flex flex-col max-w-7xl flex-1">
                    {/* Page Heading */}
                    <div className="flex flex-wrap justify-between gap-3 p-4 mb-4">
                        <div className="flex min-w-72 flex-col gap-3">
                            <h1 className="text-[#111218] text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">
                                Contribute to the Community
                            </h1>
                            <p className="text-[#616889] text-base font-normal">
                                Share your study materials to help students succeed.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 px-4">
                        {/* Left Column: Upload & Form */}
                        <div className="flex-1 flex flex-col gap-8">
                            {/* Upload Zone */}
                            <div
                                {...getRootProps()}
                                className={`flex flex-col items-center gap-6 rounded-xl border-2 border-dashed px-6 py-14 transition-colors cursor-pointer group ${isDragActive
                                    ? 'border-[#2b4bee] bg-[#2b4bee]/10'
                                    : 'border-[#2b4bee]/40 bg-[#2b4bee]/5 hover:border-[#2b4bee]/70'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="rounded-full bg-white p-4 shadow-sm group-hover:scale-110 transition-transform duration-200">
                                        <Upload className="h-10 w-10 text-[#2b4bee]" />
                                    </div>
                                    <div className="flex max-w-[480px] flex-col items-center gap-2">
                                        <p className="text-[#111218] text-lg font-bold leading-tight">
                                            Upload Document
                                        </p>
                                        <p className="text-[#616889] text-sm font-normal">
                                            Drag & drop your file here, or click to browse.<br />
                                            Supports PDF, DOCX, PPTX up to 100MB.
                                        </p>
                                    </div>
                                    <button className="flex items-center justify-center rounded-lg h-10 px-6 bg-[#2b4bee] text-white text-sm font-bold shadow-md hover:bg-blue-700 transition-colors">
                                        Browse Files
                                    </button>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {selectedFile && (
                                <div className="flex flex-col gap-3 p-5 rounded-lg border border-[#f0f1f4] bg-white shadow-sm">
                                    <div className="flex gap-6 justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            {getFileIcon()}
                                            <p className="text-[#111218] text-base font-medium">{selectedFile.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {uploadComplete ? (
                                                <>
                                                    <span className="text-[#111218] text-sm font-normal">100%</span>
                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                </>
                                            ) : uploading ? (
                                                <span className="text-[#111218] text-sm font-normal">{uploadProgress}%</span>
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedFile(null)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-full bg-[#dbdde6] h-2 overflow-hidden">
                                        <div
                                            className="h-2 rounded-full bg-[#2b4bee] transition-all duration-300"
                                            style={{ width: `${uploading ? uploadProgress : uploadComplete ? 100 : 0}%` }}
                                        />
                                    </div>
                                    <p className="text-[#616889] text-sm font-normal">
                                        {uploadComplete ? 'Upload Complete' : uploading ? 'Uploading...' : formatFileSize(selectedFile.size)}
                                    </p>
                                </div>
                            )}

                            {/* Error Message */}
                            {uploadError && (
                                <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
                                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-700 text-sm">{uploadError}</p>
                                </div>
                            )}

                            {/* Metadata Form */}
                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                                <h3 className="text-[#111218] text-xl font-bold leading-tight">Material Details</h3>

                                <div className="grid gap-6">
                                    {/* Title */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[#111218] text-sm font-medium">Title *</label>
                                        <input
                                            {...register('title')}
                                            className="w-full rounded-lg text-[#111218] border border-[#dbdde6] bg-white h-12 px-4 text-base focus:outline-none focus:ring-2 focus:ring-[#2b4bee]/50 focus:border-[#2b4bee] transition-all"
                                            placeholder="e.g., Calculus II Final Review"
                                        />
                                        {errors.title && (
                                            <p className="text-red-600 text-xs">{errors.title.message}</p>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[#111218] text-sm font-medium">Description</label>
                                        <textarea
                                            {...register('description')}
                                            className="w-full rounded-lg text-[#111218] border border-[#dbdde6] bg-white p-4 text-base focus:outline-none focus:ring-2 focus:ring-[#2b4bee]/50 focus:border-[#2b4bee] transition-all resize-none"
                                            placeholder="Describe the contents of this material..."
                                            rows={4}
                                        />
                                    </div>

                                    {/* Discipline (only for super admin) - placed first to enable cascading filters */}
                                    {isSuperAdmin && (
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[#111218] text-sm font-medium">Discipline *</label>
                                            <div className="relative">
                                                <select
                                                    {...register('disciplineId')}
                                                    className="w-full rounded-lg text-[#111218] border border-[#dbdde6] bg-white h-12 px-4 text-base focus:outline-none focus:ring-2 focus:ring-[#2b4bee]/50 focus:border-[#2b4bee] transition-all appearance-none"
                                                >
                                                    <option value="">Select discipline</option>
                                                    {filterOptions?.disciplines.map(discipline => (
                                                        <option key={discipline.id} value={discipline.id}>
                                                            {discipline.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#616889]">
                                                    <ChevronDown className="h-5 w-5" />
                                                </div>
                                            </div>
                                            {errors.disciplineId && (
                                                <p className="text-red-600 text-xs">{errors.disciplineId.message}</p>
                                            )}
                                        </div>
                                    )}

                                    {!isSuperAdmin && <input type="hidden" {...register('disciplineId')} />}

                                    {/* Term */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[#111218] text-sm font-medium">Term</label>
                                        <div className="relative">
                                            <select
                                                {...register('termId')}
                                                disabled={!selectedDiscipline}
                                                className="w-full rounded-lg text-[#111218] border border-[#dbdde6] bg-white h-12 px-4 text-base focus:outline-none focus:ring-2 focus:ring-[#2b4bee]/50 focus:border-[#2b4bee] transition-all appearance-none disabled:bg-gray-100 disabled:text-gray-500"
                                            >
                                                <option value="">Select term (optional)</option>
                                                {getFilteredTerms().map(term => (
                                                    <option key={term.id} value={term.id}>
                                                        {term.term}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#616889]">
                                                <ChevronDown className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Course Code & Category Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Course Code */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[#111218] text-sm font-medium">Course Code</label>
                                            <div className="relative">
                                                <select
                                                    {...register('courseCodeId')}
                                                    disabled={!selectedDiscipline}
                                                    className="w-full rounded-lg text-[#111218] border border-[#dbdde6] bg-white h-12 px-4 text-base focus:outline-none focus:ring-2 focus:ring-[#2b4bee]/50 focus:border-[#2b4bee] transition-all appearance-none disabled:bg-gray-100 disabled:text-gray-500"
                                                >
                                                    <option value="">Select course (optional)</option>
                                                    {getFilteredCourseCodes().map(course => (
                                                        <option key={course.id} value={course.id}>
                                                            {course.code} - {course.title}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#616889]">
                                                    <ChevronDown className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Category */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[#111218] text-sm font-medium">Material Type</label>
                                            <div className="relative">
                                                <select
                                                    {...register('category')}
                                                    className="w-full rounded-lg text-[#111218] border border-[#dbdde6] bg-white h-12 px-4 text-base focus:outline-none focus:ring-2 focus:ring-[#2b4bee]/50 focus:border-[#2b4bee] transition-all appearance-none"
                                                >
                                                    <option value="">Select type (optional)</option>
                                                    <option value="lecture_note">Lecture Notes</option>
                                                    <option value="previous_question">Previous Questions</option>
                                                    <option value="ct_question">CT Questions</option>
                                                    <option value="final_question">Final Questions</option>
                                                    <option value="assignment">Assignments</option>
                                                    <option value="lab_manual">Lab Manuals</option>
                                                    <option value="syllabus">Syllabus</option>
                                                    <option value="book">Books</option>
                                                    <option value="other">Other</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#616889]">
                                                    <ChevronDown className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[#111218] text-sm font-medium">Tags</label>
                                        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#dbdde6] bg-white p-2 focus-within:ring-2 focus-within:ring-[#2b4bee]/50 focus-within:border-[#2b4bee] transition-all">
                                            {tags.map(tag => (
                                                <div
                                                    key={tag}
                                                    className="flex items-center gap-1 rounded bg-[#2b4bee]/10 px-2 py-1 text-[#2b4bee]"
                                                >
                                                    <span className="text-sm font-medium">{tag}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTag(tag)}
                                                        className="flex items-center justify-center text-[#2b4bee]/70 hover:text-[#2b4bee]"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={handleTagKeyDown}
                                                className="flex-1 min-w-[120px] border-none bg-transparent p-1 text-base text-[#111218] placeholder:text-[#616889] focus:outline-none focus:ring-0"
                                                placeholder="Type and press Enter..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Footer */}
                                <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-[#f0f1f4]">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="px-6 py-2.5 rounded-lg text-sm font-bold text-[#616889] hover:bg-gray-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading || !selectedFile}
                                        className="px-8 py-2.5 rounded-lg bg-[#2b4bee] text-white text-sm font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {uploading ? 'Uploading...' : 'Publish Material'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Right Column: Sidebar */}
                        <div className="w-full lg:w-[360px] flex flex-col gap-6">
                            {/* Preview Card */}
                            {selectedFile && (
                                <div className="bg-white rounded-xl shadow-sm border border-[#f0f1f4] overflow-hidden">
                                    <div className="p-4 border-b border-[#f0f1f4] bg-gray-50 flex justify-between items-center">
                                        <h3 className="font-bold text-[#111218]">File Preview</h3>
                                        <button
                                            onClick={() => setSelectedFile(null)}
                                            className="text-red-500 text-xs font-bold hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <div className="w-full bg-gradient-to-br from-[#2b4bee]/10 to-indigo-100 aspect-[3/4] rounded-lg border border-gray-200 flex items-center justify-center">
                                            <FileText className="h-16 w-16 text-[#2b4bee]/40" />
                                        </div>
                                        <div className="mt-4 flex flex-col gap-1">
                                            <p className="text-[#111218] font-bold text-sm truncate">{selectedFile.name}</p>
                                            <p className="text-[#616889] text-xs">
                                                {formatFileSize(selectedFile.size)} • {selectedFile.name.split('.').pop()?.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Guidelines Card */}
                            <div className="bg-[#2b4bee]/5 rounded-xl border border-[#2b4bee]/20 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Lightbulb className="h-5 w-5 text-[#2b4bee]" />
                                    <h3 className="font-bold text-[#111218]">Submission Guidelines</h3>
                                </div>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-[#616889]">Upload high-quality, legible PDFs for best readability.</p>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-[#616889]">Include accurate course codes and descriptive titles.</p>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-[#616889]">Avoid files with personal student information.</p>
                                    </li>
                                </ul>
                            </div>

                            {/* Gamification Card */}
                            <div className="bg-gradient-to-br from-[#101322] to-[#2b4bee] rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                                <div className="relative z-10 flex gap-4 items-center">
                                    <div className="size-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                        <Star className="h-5 w-5 text-yellow-300" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Earn Contribution Points</p>
                                        <p className="text-xs text-white/80">Get +50 points for every approved upload!</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
