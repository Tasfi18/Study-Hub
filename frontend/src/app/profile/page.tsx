'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';
import { formatDate, getInitials, formatRelativeTime } from '@/lib/utils';
import {
  User, Mail, Calendar, Shield, Edit, Save, X, Lock, ArrowRight, Home,
  FileText, Star, CheckCircle, Upload, Download, Bookmark,
  Clock, Eye, ChevronLeft, ChevronRight, Share2, MoreHorizontal
} from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import Toast, { ToastType } from '@/components/Toast';
import { UserStats, Material } from '@/types';

type TabType = 'uploads' | 'bookmarks' | 'history' | 'reviews';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('uploads');
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    student_id: user?.student_id || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    uploads: 0,
    bookmarks: 0,
    reviews: 0,
  });
  const [uploadedMaterials, setUploadedMaterials] = useState<Material[]>([]);
  const [bookmarkedMaterials, setBookmarkedMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  const fetchUserStats = useCallback(async () => {
    if (!user) return;
    try {
      const response = await apiClient.getUserStats();
      if (response.success && response.data) {
        setUserStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  }, [user]);

  const fetchUploadedMaterials = useCallback(async () => {
    if (!user) return;
    setMaterialsLoading(true);
    try {
      const response = await apiClient.getUserMaterials();
      if (response.success && response.data) {
        setUploadedMaterials(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch uploaded materials:', error);
    } finally {
      setMaterialsLoading(false);
    }
  }, [user]);

  const fetchBookmarkedMaterials = useCallback(async () => {
    if (!user) return;
    setMaterialsLoading(true);
    try {
      const response = await apiClient.getBookmarks();
      if (response.success && response.data) {
        setBookmarkedMaterials(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch bookmarked materials:', error);
    } finally {
      setMaterialsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setEditForm({
        full_name: user.full_name,
        student_id: user.student_id || '',
      });
      fetchUserStats();
      fetchUploadedMaterials();
    }
  }, [user, fetchUserStats, fetchUploadedMaterials]);

  useEffect(() => {
    if (activeTab === 'bookmarks') {
      fetchBookmarkedMaterials();
    } else if (activeTab === 'uploads') {
      fetchUploadedMaterials();
    }
  }, [activeTab, fetchBookmarkedMaterials, fetchUploadedMaterials]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('fullName', editForm.full_name);
      if (editForm.student_id) {
        formData.append('studentId', editForm.student_id);
      }
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      const response = await apiClient.updateProfile(formData);
      if (response.success) {
        useAuthStore.getState().updateUser(response.data);
        setIsEditing(false);
        setAvatarFile(null);
        showToast('Profile updated successfully!', 'success');
        fetchUserStats();
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      full_name: user?.full_name || '',
      student_id: user?.student_id || '',
    });
    setAvatarFile(null);
    setIsEditing(false);
  };

  const getFileTypeLabel = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCX';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PPTX';
    if (mimeType.includes('image')) return 'IMG';
    return 'FILE';
  };

  const tabs = [
    { id: 'uploads' as TabType, label: 'Uploaded Materials', icon: FileText },
    { id: 'bookmarks' as TabType, label: 'Bookmarks/Saved', icon: Bookmark },
    { id: 'history' as TabType, label: 'Download History', icon: Clock },
    { id: 'reviews' as TabType, label: 'Reviews', icon: Star },
  ];

  const currentMaterials = activeTab === 'uploads' ? uploadedMaterials :
    activeTab === 'bookmarks' ? bookmarkedMaterials : [];

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f6f6f8] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#2b4bee] to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg relative">
              <Lock className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111218] mb-3">
              Sign In Required
            </h1>
            <p className="text-base text-[#616889] mb-8 leading-relaxed">
              You need to sign in to access your profile and manage your account settings.
            </p>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => router.push('/?auth=signin')}
                className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#2b4bee] hover:bg-[#2b4bee]/90 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg"
              >
                <User className="h-5 w-5" />
                Sign In to Continue
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-[#111218] border border-[#dbdde6] rounded-lg font-semibold transition-all duration-200"
              >
                <Home className="h-5 w-5" />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8]">

      {/* Main Content */}
      <main className="flex-1 flex justify-center py-8 px-4 md:px-10 lg:px-20">
        <div className="max-w-[1080px] w-full flex flex-col gap-6">
          {/* Profile Header Card */}
          <div className="bg-white rounded-xl border border-[#dbdde6] p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left w-full">
                <div className="relative group cursor-pointer">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt="Profile"
                      width={128}
                      height={128}
                      className="rounded-full size-32 shadow-md border-4 border-white object-cover"
                    />
                  ) : (
                    <div className="size-32 bg-gradient-to-br from-[#2b4bee] to-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-md border-4 border-white">
                      {getInitials(user.full_name)}
                    </div>
                  )}
                  {isEditing && (
                    <div className="absolute bottom-1 right-1 bg-[#2b4bee] text-white rounded-full p-1.5 shadow-sm border-2 border-white">
                      <Edit className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center flex-1">
                  <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2 mb-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="text-2xl md:text-3xl font-bold text-[#111218] bg-transparent border-b-2 border-[#2b4bee] focus:outline-none px-1"
                      />
                    ) : (
                      <h1 className="text-[#111218] text-2xl md:text-3xl font-bold tracking-tight">{user.full_name}</h1>
                    )}
                    <span className="bg-[#2b4bee]/10 text-[#2b4bee] px-2 py-0.5 rounded-full text-xs font-semibold capitalize">
                      {(user.role || 'student').replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[#616889] text-base font-normal mb-3">
                    {user.email} {user.discipline && `• ${user.discipline.name}`}
                  </p>
                  <p className="text-[#616889] text-sm flex items-center justify-center sm:justify-start gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Member since {user.created_at ? formatDate(user.created_at) : 'Recently'}
                  </p>
                  {user.student_id && (
                    <p className="mt-2 text-sm text-[#4b5563]">
                      Student ID: {user.student_id}
                    </p>
                  )}
                </div>
              </div>
              <div className="w-full md:w-auto flex flex-col gap-3">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 rounded-lg h-10 px-6 bg-[#2b4bee] hover:bg-[#2b4bee]/90 text-white text-sm font-bold transition-all shadow-sm disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#f0f1f4] hover:bg-[#e0e2e8] text-[#111218] text-sm font-bold transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center gap-2 rounded-lg h-10 px-6 bg-[#2b4bee] hover:bg-[#2b4bee]/90 text-white text-sm font-bold transition-all shadow-sm w-full md:w-auto"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                )}
                <div className="flex gap-2 justify-center md:justify-end">
                  <button className="size-10 flex items-center justify-center rounded-lg bg-[#f0f1f4] text-[#616889] hover:bg-[#e0e2e8] transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button className="size-10 flex items-center justify-center rounded-lg bg-[#f0f1f4] text-[#616889] hover:bg-[#e0e2e8] transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Avatar Upload when editing */}
            {isEditing && (
              <div className="mt-6 pt-6 border-t border-[#dbdde6]">
                <label className="block text-sm font-bold text-[#111218] mb-2">
                  Update Profile Picture
                </label>
                <ImageUpload
                  selectedFile={avatarFile}
                  onFileSelect={setAvatarFile}
                />
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1 rounded-xl p-5 bg-white border border-[#dbdde6] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-[#2b4bee]">
                <Upload className="h-16 w-16" />
              </div>
              <p className="text-[#616889] text-sm font-medium uppercase tracking-wider">Materials Uploaded</p>
              <p className="text-[#111218] text-3xl font-bold">{userStats.uploads}</p>
            </div>
            <div className="flex flex-col gap-1 rounded-xl p-5 bg-white border border-[#dbdde6] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-green-500">
                <Download className="h-16 w-16" />
              </div>
              <p className="text-[#616889] text-sm font-medium uppercase tracking-wider">Total Downloads</p>
              <p className="text-[#111218] text-3xl font-bold">
                {uploadedMaterials.reduce((acc, m) => acc + (m.download_count || 0), 0)}
              </p>
            </div>
            <div className="flex flex-col gap-1 rounded-xl p-5 bg-white border border-[#dbdde6] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-yellow-500">
                <Bookmark className="h-16 w-16" />
              </div>
              <p className="text-[#616889] text-sm font-medium uppercase tracking-wider">Bookmarks</p>
              <p className="text-[#111218] text-3xl font-bold">{userStats.bookmarks}</p>
            </div>
          </div>

          {/* Tabs & Content Area */}
          <div className="flex flex-col bg-white rounded-xl border border-[#dbdde6] shadow-sm min-h-[500px]">
            {/* Tabs */}
            <div className="border-b border-[#dbdde6]">
              <div className="flex overflow-x-auto px-6 gap-8 no-scrollbar">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 border-b-[3px] pb-4 pt-5 px-1 whitespace-nowrap transition-all ${activeTab === tab.id
                      ? 'border-[#2b4bee] text-[#2b4bee]'
                      : 'border-transparent text-[#616889] hover:text-[#111218] hover:border-[#dbdde6]'
                      }`}
                  >
                    <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'fill-current' : ''}`} />
                    <span className="text-sm font-bold tracking-[0.015em]">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content Grid */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#111218]">
                  {activeTab === 'uploads' && 'Recent Uploads'}
                  {activeTab === 'bookmarks' && 'Saved Materials'}
                  {activeTab === 'history' && 'Download History'}
                  {activeTab === 'reviews' && 'Your Reviews'}
                </h3>
              </div>

              {materialsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#2b4bee] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : currentMaterials.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-[#f0f1f4] rounded-full flex items-center justify-center mb-4">
                    {activeTab === 'uploads' && <Upload className="h-8 w-8 text-[#616889]" />}
                    {activeTab === 'bookmarks' && <Bookmark className="h-8 w-8 text-[#616889]" />}
                    {activeTab === 'history' && <Clock className="h-8 w-8 text-[#616889]" />}
                    {activeTab === 'reviews' && <Star className="h-8 w-8 text-[#616889]" />}
                  </div>
                  <h3 className="text-lg font-medium text-[#111218] mb-2">
                    {activeTab === 'uploads' && 'No uploads yet'}
                    {activeTab === 'bookmarks' && 'No bookmarks yet'}
                    {activeTab === 'history' && 'No download history'}
                    {activeTab === 'reviews' && 'No reviews yet'}
                  </h3>
                  <p className="text-[#616889]">
                    {activeTab === 'uploads' && 'Start uploading study materials to share with others'}
                    {activeTab === 'bookmarks' && 'Save materials to access them quickly later'}
                    {activeTab === 'history' && 'Your download history will appear here'}
                    {activeTab === 'reviews' && 'Review materials to help other students'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentMaterials.map((material) => (
                    <Link
                      key={material.id}
                      href={`/materials/${material.id}`}
                      className="group flex flex-col gap-3 pb-3 hover:-translate-y-1 transition-transform duration-300"
                    >
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-[#2b4bee]/20 to-indigo-100">
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="h-12 w-12 text-[#2b4bee]/40" />
                        </div>
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                          {getFileTypeLabel(material.mime_type)}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-[#111218] text-base font-semibold leading-tight line-clamp-2 group-hover:text-[#2b4bee] transition-colors">
                            {material.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3 text-[#616889] text-xs font-normal mt-1">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {material.view_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatRelativeTime(material.created_at)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {currentMaterials.length > 0 && (
              <div className="p-6 border-t border-[#dbdde6] flex justify-center">
                <div className="flex gap-2">
                  <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#dbdde6] hover:bg-[#f0f1f4] text-[#616889]">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#2b4bee] text-white text-sm font-medium">
                    1
                  </button>
                  <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#dbdde6] hover:bg-[#f0f1f4] text-[#111218] text-sm font-medium">
                    2
                  </button>
                  <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#dbdde6] hover:bg-[#f0f1f4] text-[#616889]">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast Notification */}
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