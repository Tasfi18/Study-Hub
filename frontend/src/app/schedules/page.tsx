'use client';

import { useEffect, useState, useCallback } from 'react';
import { Schedule, ScheduleType } from '@/types';
import { apiClient } from '@/lib/api';
import { Calendar, BookOpen, Filter, ChevronDown, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import LoadingSpinner from '@/components/LoadingSpinner';
import Toast, { ToastType } from '@/components/Toast';
import BackButton from '@/components/BackButton';

const SCHEDULE_CONFIG = {
  types: {
    class_test: { label: 'Class Test', color: 'blue' },
    lab_test: { label: 'Lab Test', color: 'cyan' },
    routine: { label: 'Routine', color: 'teal' },
    assignment: { label: 'Assignment', color: 'purple' },
    viva: { label: 'Viva', color: 'indigo' },
    presentation: { label: 'Presentation', color: 'emerald' },
    project: { label: 'Project', color: 'slate' },
    other: { label: 'Other', color: 'gray' },
  } as const,
  terms: ['1:1', '1:2', '2:1', '2:2', '3:1', '3:2', '4:1', '4:2'],
};

const getColorClasses = (color: string) => ({
  badge: `bg-${color}-50 text-${color}-700 border-${color}-200`,
  gradient: `from-${color}-500 to-${color}-600`,
});

// Date Card Component
const DateCard = ({ date }: { date: string }) => {
  const dateObj = new Date(date);
  return (
    <div className="flex-shrink-0">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-sm transition-all hover:shadow-md w-20 text-center">
        <div className="text-2xl font-bold leading-none">{dateObj.getDate()}</div>
        <div className="text-xs font-medium opacity-90 uppercase tracking-wide mt-1">
          {dateObj.toLocaleDateString('en-US', { month: 'short' })}
        </div>
        <div className="text-[10px] opacity-75 mt-0.5">{dateObj.getFullYear()}</div>
      </div>
    </div>
  );
};

// Schedule Badge Component
const ScheduleBadge = ({ type, term }: { type: ScheduleType; term?: string }) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${getColorClasses(SCHEDULE_CONFIG.types[type].color).badge}`}>
      {SCHEDULE_CONFIG.types[type].label}
    </span>
    {term && (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        Term {term}
      </span>
    )}
  </div>
);

// Course Info Component
const CourseInfo = ({ courseCode }: { courseCode?: { code: string; title: string } }) => {
  if (!courseCode) return null;
  return (
    <div className="inline-flex items-center gap-2 text-sm bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
      <BookOpen className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
      <span className="font-bold text-blue-900">{courseCode.code}</span>
      <span className="text-gray-400">·</span>
      <span className="text-gray-700 truncate">{courseCode.title}</span>
    </div>
  );
};

// Info Section Component
const InfoSection = ({ title, content, icon: Icon }: { title: string; content: string; icon: any }) => (
  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="h-4 w-4 text-amber-600" />
      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">{title}</h4>
    </div>
    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{content}</p>
  </div>
);

// Schedule Card Component
const ScheduleCard = ({ schedule }: { schedule: Schedule }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-200 group">
    <div className="p-5">
      <div className="flex gap-4">
        <DateCard date={schedule.schedule_date} />
        
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header Section */}
          <div>
            <ScheduleBadge type={schedule.type} term={schedule.term} />
            <h3 className="text-xl font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors line-clamp-2">
              {schedule.title}
            </h3>
          </div>

          {/* Course Info */}
          {schedule.course_code && <CourseInfo courseCode={schedule.course_code} />}
          
          {/* Syllabus Section */}
          {schedule.syllabus && <InfoSection title="Syllabus / Topics" content={schedule.syllabus} icon={BookOpen} />}
          
          {/* Description */}
          {schedule.description && (
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line line-clamp-3">
              {schedule.description}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Filter Select Component
const FilterSelect = ({ label, value, onChange, options, emoji }: any) => (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
      {emoji} {label}
    </label>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all hover:border-gray-400"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export default function SchedulesPage() {
  const { user } = useAuthStore();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    term: '',
    discipline: '',
    dateFilter: 'upcoming',
  });

  useEffect(() => {
    fetchDisciplines();
  }, []);

  const fetchDisciplines = async () => {
    try {
      const response = await apiClient.getFilterOptions();
      if (response.success && response.data?.disciplines) {
        setDisciplines(response.data.disciplines);
      }
    } catch (error: any) {
      console.error('Failed to fetch disciplines:', error);
    }
  };

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      
      if (filters.discipline) params.discipline = filters.discipline;
      else if (user?.discipline_id) params.discipline = user.discipline_id;
      if (filters.type) params.type = filters.type;
      if (filters.term) params.term = filters.term;
      
      const response = await apiClient.getSchedules(params);
      if (response.success && response.data) {
        setSchedules(response.data);
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to fetch schedules', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters, user?.discipline_id]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const filterSchedulesByDate = (schedules: Schedule[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filters.dateFilter) {
      case 'today':
        return schedules.filter(s => {
          const scheduleDate = new Date(s.schedule_date);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate.getTime() === today.getTime();
        });
      case 'upcoming':
        return schedules.filter(s => {
          const scheduleDate = new Date(s.schedule_date);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate.getTime() >= today.getTime();
        });
      case 'past':
        return schedules.filter(s => {
          const scheduleDate = new Date(s.schedule_date);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate.getTime() < today.getTime();
        });
      default:
        return schedules;
    }
  };

  const filteredSchedules = filterSchedulesByDate(schedules);

  const dateFilterOptions = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'today', label: 'Today' },
    { value: 'past', label: 'Past' },
    { value: 'all', label: 'All Schedules' },
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    ...Object.entries(SCHEDULE_CONFIG.types).map(([value, { label }]) => ({ value, label })),
  ];

  const termOptions = [
    { value: '', label: 'All Terms' },
    ...SCHEDULE_CONFIG.terms.map(term => ({ value: term, label: term })),
  ];

  const disciplineOptions = [
    { value: '', label: 'All Disciplines' },
    ...disciplines.map(d => ({ value: d.id, label: d.name })),
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* Header */}
        <div className="mb-6">
          <BackButton href="/" label="Back to Home" className="mb-4" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Academic Schedules
                </h1>
                <p className="text-gray-600 text-sm mt-0.5">
                  {user?.role === 'super_admin' 
                    ? 'All disciplines' 
                    : user?.discipline?.name || 'Your schedules'}
                </p>
              </div>
            </div>

            {filteredSchedules.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">
                  {filteredSchedules.length} {filteredSchedules.length === 1 ? 'schedule' : 'schedules'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Filter className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-gray-900">Filters</span>
                <p className="text-xs text-gray-500 mt-0.5">Customize your view</p>
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="px-5 pb-5 border-t border-gray-100 pt-5 bg-gray-50">
              <div className={`grid grid-cols-1 md:grid-cols-2 ${user?.role === 'super_admin' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
                <FilterSelect
                  label="Date Range"
                  emoji="📅"
                  value={filters.dateFilter}
                  onChange={(e: any) => setFilters({ ...filters, dateFilter: e.target.value })}
                  options={dateFilterOptions}
                />

                {user?.role === 'super_admin' && (
                  <FilterSelect
                    label="Discipline"
                    emoji="🎓"
                    value={filters.discipline}
                    onChange={(e: any) => setFilters({ ...filters, discipline: e.target.value })}
                    options={disciplineOptions}
                  />
                )}

                <FilterSelect
                  label="Type"
                  emoji="📚"
                  value={filters.type}
                  onChange={(e: any) => setFilters({ ...filters, type: e.target.value })}
                  options={typeOptions}
                />

                <FilterSelect
                  label="Term"
                  emoji="📖"
                  value={filters.term}
                  onChange={(e: any) => setFilters({ ...filters, term: e.target.value })}
                  options={termOptions}
                />
              </div>
            </div>
          )}
        </div>

        {/* Schedules List */}
        {filteredSchedules.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-sm mx-auto">
              <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                <Calendar className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No schedules found</h3>
              <p className="text-gray-600 text-sm mb-5">
                There are no schedules matching your current filters.
              </p>
              <button
                onClick={() => setFilters({ type: '', term: '', discipline: '', dateFilter: 'upcoming' })}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow font-medium"
              >
                Clear filters
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSchedules.map((schedule) => (
              <ScheduleCard key={schedule.id} schedule={schedule} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
