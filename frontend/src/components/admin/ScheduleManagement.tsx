'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Edit, Trash2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Schedule } from '@/types';
import Toast, { ToastType } from '@/components/Toast';
import ScheduleModal from '@/components/ScheduleModal';

interface ScheduleManagementProps {
  user: any;
  isSuperAdmin: boolean;
}

export default function ScheduleManagement({ user, isSuperAdmin }: ScheduleManagementProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [courseCodes, setCourseCodes] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    loadSchedules();
    loadDisciplines();
    loadBatches();
    loadCourseCodes();
  }, []);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSchedules();
      if (response.success && response.data) {
        setSchedules(response.data);
      }
    } catch (error) {
      showToast('Failed to load schedules', 'error');
    } finally {
      setLoading(false);
    }
  };
  const loadBatches = async () => {
    try {
      const response = await apiClient.getFilterOptions();
      // TODO: batches property not available in getFilterOptions response
      // Implement separate endpoint for batches or add to filter options
      if (response.success && response.data) {
        setBatches([]);
      }
    } catch (error) {
      console.error('Failed to load batches:', error);
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

  const loadCourseCodes = async () => {
    try {
      const response = await apiClient.getFilterOptions();
      // Using courseCodes from response which is available
      if (response.success && response.data?.courseCodes) {
        setCourseCodes(response.data.courseCodes);
      }
    } catch (error) {
      console.error('Failed to load course codes:', error);
    }
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setShowModal(true);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await apiClient.deleteSchedule(scheduleId);
      if (response.success) {
        showToast('Schedule deleted successfully', 'success');
        await loadSchedules();
      } else {
        throw new Error(response.message || 'Failed to delete schedule');
      }
    } catch (error) {
      showToast('Failed to delete schedule', 'error');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingSchedule(null);
  };

  const handleModalSuccess = async () => {
    await loadSchedules();
    showToast(editingSchedule ? 'Schedule updated successfully' : 'Schedule created successfully', 'success');
    handleModalClose();
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Schedule Management</h3>
            <p className="text-sm text-gray-500 mt-1">
              Manage exam schedules and important dates
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            Add Schedule
          </button>
        </div>
        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium">Loading schedules...</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No schedules found</h3>
            <p className="text-gray-500">Create your first schedule to get started</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Title</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Course</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-900">
                        {new Date(schedule.schedule_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{schedule.title}</span>
                      {schedule.term && (
                        <span className="ml-2 text-xs text-gray-500">({schedule.term})</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                        {schedule.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">
                        {schedule.course_code?.code || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditSchedule(schedule)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Edit schedule"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Delete schedule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <ScheduleModal
          isOpen={showModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          schedule={editingSchedule}
          disciplines={disciplines}
          batches={batches}
          courseCodes={courseCodes}
        />
      )}
    </>
  );
}