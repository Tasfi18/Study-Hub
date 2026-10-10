'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Schedule, ScheduleType, Discipline, CourseCode, Batch } from '@/types';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Button from './Button';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schedule?: Schedule | null;
  disciplines: Discipline[];
  batches: Batch[];
  courseCodes: CourseCode[];
}

const SCHEDULE_TYPES: { value: ScheduleType; label: string }[] = [
  { value: 'class_test', label: 'Class Test' },
  { value: 'lab_test', label: 'Lab Test' },
  { value: 'routine', label: 'Routine' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'viva', label: 'Viva' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'project', label: 'Project' },
  { value: 'other', label: 'Other' },
];

// Standard 8 terms
const TERMS = ['1:1', '1:2', '2:1', '2:2', '3:1', '3:2', '4:1', '4:2'];

export default function ScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  schedule,
  disciplines,
  batches,
  courseCodes,
}: ScheduleModalProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    type: 'routine' as ScheduleType,
    description: '',
    discipline_id: '',
    term: '',
    schedule_date: '',
    syllabus: '',
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        type: schedule.type,
        description: schedule.description || '',
        discipline_id: schedule.discipline_id,
        term: schedule.term || '',
        schedule_date: schedule.schedule_date,
        syllabus: schedule.syllabus || '',
      });
    } else if (user?.role === 'admin' && user?.discipline_id) {
      // Auto-set discipline for regular admins
      setFormData(prev => ({
        ...prev,
        discipline_id: user.discipline_id!
      }));
    }
  }, [schedule, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Generate title from type and discipline
      const disciplineName = disciplines.find(d => d.id === formData.discipline_id)?.name || '';
      const typeLabel = SCHEDULE_TYPES.find(t => t.value === formData.type)?.label || '';
      const title = `${typeLabel} - ${disciplineName}`;

      const payload = {
        ...formData,
        title,
        term: formData.term, // Required field
        syllabus: formData.syllabus || undefined,
        description: formData.description || undefined,
      };

      if (schedule) {
        await apiClient.updateSchedule(schedule.id, payload);
      } else {
        await apiClient.createSchedule(payload);
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {schedule ? 'Edit Schedule' : 'Create Schedule'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ScheduleType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                {SCHEDULE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.schedule_date}
                onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topics / Schedule
            </label>
            <textarea
              value={formData.syllabus}
              onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
              rows={4}
              placeholder="e.g., 10:00 am - 11:00 am : Computer Fundamentals"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Enter routine details, topics, or syllabus content</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Details
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Brief overview or summary..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Discipline Section */}
          {user?.role === 'super_admin' ? (
            // Super Admin: Show discipline dropdown
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discipline <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.discipline_id}
                  onChange={(e) => setFormData({ ...formData, discipline_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Discipline</option>
                  {disciplines.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Term <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Term</option>
                  {TERMS.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            // Regular Admin: Show discipline info (read-only) and term selector
            <div>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  📚 Discipline
                </label>
                <p className="text-sm font-semibold text-blue-900">
                  {user?.discipline?.name || 'Your Discipline'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Term <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Term</option>
                  {TERMS.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
