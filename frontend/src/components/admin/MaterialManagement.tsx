'use client';

import { useState, useEffect } from 'react';
import { Material } from '@/types';
import { apiClient } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';
import {
  Check, X, Eye, FileText, Search,
  AlertCircle, CheckCircle, Clock, History,
  ChevronRight, File, Image, FileSpreadsheet
} from 'lucide-react';
import Toast, { ToastType } from '@/components/Toast';

interface MaterialManagementProps {
  user: any;
  isSuperAdmin: boolean;
  onStatsUpdate?: () => void;
}

export default function MaterialManagement({ user, isSuperAdmin, onStatsUpdate }: MaterialManagementProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [filterDiscipline, setFilterDiscipline] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Modals
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; materialId: string; title: string }>({
    isOpen: false,
    materialId: '',
    title: ''
  });

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Recent actions history
  const [recentActions, setRecentActions] = useState<Array<{
    id: string;
    title: string;
    action: 'approved' | 'rejected';
    time: Date;
  }>>([]);

  useEffect(() => {
    if (user) {
      loadMaterials();
      loadDisciplines();
    }
  }, [filterStatus, filterDiscipline, filterCategory, user]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const filters: any = {
        status: filterStatus !== 'all' ? filterStatus : undefined,
        discipline: isSuperAdmin && filterDiscipline !== 'all' ? filterDiscipline :
          !isSuperAdmin && user?.discipline?.id ? user.discipline.id : undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined
      };

      const response = await apiClient.getMaterials(filters);
      if (response.success && response.data) {
        let filteredMaterials = response.data;

        if (searchQuery) {
          filteredMaterials = filteredMaterials.filter((m: Material) =>
            m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.uploaded_by_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.course_code?.title?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setMaterials(filteredMaterials);
        // Auto-select first pending material
        if (filterStatus === 'pending' && filteredMaterials.length > 0 && !selectedMaterial) {
          setSelectedMaterial(filteredMaterials[0]);
        }
      }
    } catch (error) {
      showToast('Failed to load materials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDisciplines = async () => {
    try {
      const response = await apiClient.getFilterOptions();
      if (response.success && response.data?.disciplines) {
        setDisciplines(response.data.disciplines);
      }
    } catch (error) {
      console.error('Failed to load disciplines:', error);
    }
  };

  const handleApprove = async (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    try {
      setActionLoading(materialId);
      const response = await apiClient.approveMaterial(materialId, 'approved');
      if (response.success) {
        showToast('Material approved successfully', 'success');
        // Add to recent actions
        if (material) {
          setRecentActions(prev => [{
            id: materialId,
            title: material.title,
            action: 'approved' as const,
            time: new Date()
          }, ...prev].slice(0, 5));
        }
        await loadMaterials();
        setSelectedMaterial(null);
        onStatsUpdate?.();
      }
    } catch (error) {
      showToast('Failed to approve material', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (materialId: string) => {
    if (!rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }

    const material = materials.find(m => m.id === materialId);
    try {
      setActionLoading(materialId);
      const response = await apiClient.approveMaterial(materialId, 'rejected', rejectionReason);
      if (response.success) {
        showToast('Material rejected', 'success');
        // Add to recent actions
        if (material) {
          setRecentActions(prev => [{
            id: materialId,
            title: material.title,
            action: 'rejected' as const,
            time: new Date()
          }, ...prev].slice(0, 5));
        }
        setShowRejectModal(null);
        setRejectionReason('');
        await loadMaterials();
        setSelectedMaterial(null);
        onStatsUpdate?.();
      }
    } catch (error) {
      showToast('Failed to reject material', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (materialId: string) => {
    try {
      setActionLoading(materialId);
      const response = await apiClient.deleteMaterial(materialId);
      if (response.success) {
        showToast('Material deleted successfully', 'success');
        setDeleteConfirm({ isOpen: false, materialId: '', title: '' });
        await loadMaterials();
        setSelectedMaterial(null);
        onStatsUpdate?.();
      }
    } catch (error) {
      showToast('Failed to delete material', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate stats
  const stats = {
    pending: materials.filter(m => m.status === 'pending').length,
    approved: materials.filter(m => m.status === 'approved').length,
    rejected: materials.filter(m => m.status === 'rejected').length,
    total: materials.length
  };

  // Get category display name
  const getCategoryName = (category: string | undefined) => {
    if (!category) return 'Other';
    const categories: Record<string, string> = {
      'ct_question': 'CT Question',
      'previous_question': 'Previous Question',
      'final_question': 'Final Question',
      'assignment': 'Assignment',
      'lecture_note': 'Lecture Note',
      'lab_manual': 'Lab Manual',
      'syllabus': 'Syllabus',
      'book': 'Book',
      'thesis': 'Thesis',
      'other': 'Other'
    };
    return categories[category] || category;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType?.includes('image')) return <Image className="h-5 w-5 text-orange-500" />;
    if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    return <File className="h-5 w-5 text-blue-500" />;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return formatDate(date.toISOString());
  };

  const pendingMaterials = materials.filter(m => m.status === 'pending');
  const upcomingQueue = pendingMaterials.slice(1, 4);

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="space-y-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 text-sm font-medium">Pending Review</span>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold">Queue</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.pending}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 text-sm font-medium">Approved</span>
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">✓</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.approved}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 text-sm font-medium">Rejected</span>
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold">✗</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.rejected}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 text-sm font-medium">Total Materials</span>
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-semibold">All</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, uploader or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any);
                setSelectedMaterial(null);
              }}
              className="px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {isSuperAdmin && disciplines.length > 0 && (
              <select
                value={filterDiscipline}
                onChange={(e) => setFilterDiscipline(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Disciplines</option>
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="lecture_note">Lecture Notes</option>
              <option value="previous_question">Previous Questions</option>
              <option value="ct_question">CT Questions</option>
              <option value="assignment">Assignments</option>
              <option value="lab_manual">Lab Manuals</option>
              <option value="book">Books</option>
            </select>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Pending Queue (Main Focus) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <Clock className="h-5 w-5 text-blue-600" />
                {filterStatus === 'pending' ? 'Pending Queue' : filterStatus === 'approved' ? 'Approved Materials' : filterStatus === 'rejected' ? 'Rejected Materials' : 'All Materials'}
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {materials.length}
                </span>
              </h3>
            </div>

            {loading && materials.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-500 font-medium">Loading materials...</p>
              </div>
            ) : materials.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No materials found</h4>
                <p className="text-gray-500">
                  {filterStatus === 'pending' ? 'No pending materials to review' : 'Try adjusting your filters'}
                </p>
              </div>
            ) : (
              <>
                {/* Featured/Selected Material Card */}
                {selectedMaterial && filterStatus === 'pending' && (
                  <div className="relative bg-white rounded-2xl border-2 border-blue-200 shadow-xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                    <div className="p-6 md:p-8">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="flex gap-2 mb-3">
                            {selectedMaterial.category && (
                              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                                {getCategoryName(selectedMaterial.category)}
                              </span>
                            )}
                            {selectedMaterial.batch?.year && selectedMaterial.batch?.semester && (
                              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                                Year {selectedMaterial.batch.year} • Term {selectedMaterial.batch.semester}
                              </span>
                            )}
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 leading-tight">{selectedMaterial.title}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 font-medium mb-1">Uploaded</div>
                          <div className="text-sm font-bold text-gray-900">{formatDate(selectedMaterial.created_at)}</div>
                        </div>
                      </div>

                      {/* Uploader Info */}
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200 mb-6">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {selectedMaterial.uploaded_by_profile?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            Uploaded by {selectedMaterial.uploaded_by_profile?.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedMaterial.course_code?.code || 'No course'} • {selectedMaterial.discipline?.name || 'No discipline'}
                          </p>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Description</p>
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {selectedMaterial.description || 'No description provided'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-2">File Info</p>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            {getFileIcon(selectedMaterial.file_type || '')}
                            <span>{selectedMaterial.file_type?.toUpperCase() || 'FILE'} • {formatFileSize(selectedMaterial.file_size || 0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-6 border-t border-gray-200">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => window.open(selectedMaterial.file_path, '_blank')}
                            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all"
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </button>
                          <button
                            onClick={() => handleApprove(selectedMaterial.id)}
                            disabled={actionLoading === selectedMaterial.id}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-bold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50"
                          >
                            <CheckCircle className="h-5 w-5" />
                            {actionLoading === selectedMaterial.id ? 'Approving...' : 'Approve'}
                          </button>
                          <div className="flex-[2] flex gap-2">
                            <input
                              type="text"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Reason for rejection (optional)..."
                              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                            />
                            <button
                              onClick={() => {
                                if (rejectionReason.trim()) {
                                  handleReject(selectedMaterial.id);
                                } else {
                                  setShowRejectModal(selectedMaterial.id);
                                }
                              }}
                              disabled={actionLoading === selectedMaterial.id}
                              className="flex items-center gap-2 border-2 border-red-200 text-red-600 hover:bg-red-50 py-3 px-5 rounded-lg font-bold transition-all disabled:opacity-50 whitespace-nowrap"
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Materials List */}
                <div className="space-y-3">
                  {filterStatus === 'pending' && upcomingQueue.length > 0 && (
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 pl-1">Up Next</p>
                  )}

                  {(filterStatus === 'pending' ? upcomingQueue : materials).map((material) => (
                    <div
                      key={material.id}
                      onClick={() => filterStatus === 'pending' && setSelectedMaterial(material)}
                      className={`bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-md transition-all ${selectedMaterial?.id === material.id ? 'ring-2 ring-blue-500 border-blue-300' : ''
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${material.category === 'lecture_note' ? 'bg-blue-100 text-blue-600' :
                          material.category === 'previous_question' ? 'bg-purple-100 text-purple-600' :
                            material.category === 'assignment' ? 'bg-orange-100 text-orange-600' :
                              'bg-gray-100 text-gray-600'
                          }`}>
                          {getFileIcon(material.file_type || '')}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{material.title}</h4>
                          <p className="text-xs text-gray-500">
                            {material.uploaded_by_profile?.full_name || 'Unknown'} • {getCategoryName(material.category)} • {formatFileSize(material.file_size || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${material.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          material.status === 'approved' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {material.status}
                        </span>
                        <span className="text-xs font-medium text-gray-400">{formatDate(material.created_at)}</span>
                        {filterStatus !== 'pending' && (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* RIGHT: History Sidebar */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <History className="h-5 w-5 text-gray-500" />
                Recent Actions
              </h3>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {recentActions.length === 0 ? (
                <div className="p-8 text-center">
                  <History className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No recent actions</p>
                  <p className="text-xs text-gray-400 mt-1">Your moderation history will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentActions.map((action, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${action.action === 'approved'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-red-100 text-red-600'
                        }`}>
                        {action.action === 'approved' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{action.title}</p>
                        <p className="text-xs text-gray-500">
                          {action.action === 'approved' ? 'Approved' : 'Rejected'} • {formatTimeAgo(action.time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
                <span className="text-xs text-gray-500">Showing last {recentActions.length} actions</span>
              </div>
            </div>

            {/* Quick Tips Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-20">
                <AlertCircle className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <h4 className="font-bold text-lg mb-2">Moderation Tips</h4>
                <ul className="text-sm text-white/90 space-y-2">
                  <li>• Check for appropriate content</li>
                  <li>• Verify file quality</li>
                  <li>• Ensure correct categorization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Reject Material
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Please provide a reason for rejecting this material:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none"
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-5 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(showRejectModal)}
                  disabled={!rejectionReason.trim() || actionLoading === showRejectModal}
                  className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all"
                >
                  {actionLoading === showRejectModal ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Delete Material</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  This action cannot be undone. Are you sure you want to delete
                  <span className="font-semibold"> "{deleteConfirm.title}"</span>?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, materialId: '', title: '' })}
                  className="flex-1 px-5 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.materialId)}
                  disabled={actionLoading === deleteConfirm.materialId}
                  className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all"
                >
                  {actionLoading === deleteConfirm.materialId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}