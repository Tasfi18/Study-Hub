'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, BookOpen, Search, Filter, GraduationCap, Calendar, Building2, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import Toast, { ToastType } from '@/components/Toast';

interface Course {
  id: string;
  code: string;
  title: string;
  discipline_id: string;
  discipline?: {
    id: string;
    name: string;
  };
  year?: number;
  term?: number;
}

interface CourseFormData {
  code: string;
  title: string;
  disciplineId: string;
  yearTerm: string;
}

interface CourseManagementProps {
  isSuperAdmin: boolean;
  user: any;
}

export default function CourseManagement({ isSuperAdmin, user }: CourseManagementProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; courseId: string; title: string }>({
    isOpen: false,
    courseId: '',
    title: ''
  });

  const [form, setForm] = useState<CourseFormData>({
    code: '',
    title: '',
    disciplineId: '',
    yearTerm: ''
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  const parseYearTerm = (yearTerm: string) => {
    if (!yearTerm) return { year: undefined, term: undefined };
    const [year, term] = yearTerm.split(':');
    return { year, term };
  };

  const loadDisciplines = useCallback(async () => {
    try {
      const response = await apiClient.getFilterOptions();
      if (response.success && response.data?.disciplines) {
        setDisciplines(response.data.disciplines);
      }
    } catch (error) {
      showToast('Failed to load disciplines', 'error');
    }
  }, []);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCourses();
      if (response.success && response.data) {
        const coursesData = isSuperAdmin
          ? response.data
          : response.data.filter((c: Course) => c.discipline_id === user?.discipline?.id);
        setCourses(coursesData);
      }
    } catch (error) {
      showToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, user?.discipline?.id]);

  useEffect(() => {
    if (user) {
      loadCourses();
      loadDisciplines();

      if (!isSuperAdmin && user.discipline?.id) {
        setForm(prev => ({ ...prev, disciplineId: user.discipline.id }));
      }
    }
  }, [user, isSuperAdmin, loadCourses, loadDisciplines]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.code || !form.title || !form.disciplineId) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      const { year, term } = parseYearTerm(form.yearTerm);

      const response = await apiClient.createCourse({
        code: form.code,
        title: form.title,
        disciplineId: form.disciplineId,
        year,
        term
      });

      if (response.success) {
        showToast('Course created successfully', 'success');
        setShowModal(false);
        setForm({ code: '', title: '', disciplineId: '', yearTerm: '' });
        loadCourses();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create course';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      setLoading(true);
      const { year, term } = parseYearTerm(form.yearTerm);

      const response = await apiClient.updateCourse(editingCourse.id, {
        code: form.code,
        title: form.title,
        disciplineId: form.disciplineId,
        year,
        term
      });

      if (response.success) {
        showToast('Course updated successfully', 'success');
        setShowModal(false);
        setEditingCourse(null);
        setForm({ code: '', title: '', disciplineId: '', yearTerm: '' });
        loadCourses();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update course';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      setLoading(true);
      const response = await apiClient.deleteCourse(id);
      if (response.success) {
        showToast('Course deleted successfully', 'success');
        setDeleteConfirm({ isOpen: false, courseId: '', title: '' });
        loadCourses();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete course';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEditCourse = (course: Course) => {
    setEditingCourse(course);
    const yearTerm = course.year && course.term ? `${course.year}:${course.term}` : '';

    setForm({
      code: course.code,
      title: course.title,
      disciplineId: course.discipline_id,
      yearTerm
    });
    setShowModal(true);
  };

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiscipline = filterDiscipline === 'all' || course.discipline_id === filterDiscipline;
    const matchesYear = filterYear === 'all' || (course.year && course.year.toString() === filterYear);
    return matchesSearch && matchesDiscipline && matchesYear;
  });

  // Calculate stats
  const stats = {
    total: courses.length,
    byYear: {
      1: courses.filter(c => c.year === 1).length,
      2: courses.filter(c => c.year === 2).length,
      3: courses.filter(c => c.year === 3).length,
      4: courses.filter(c => c.year === 4).length,
    },
    byDiscipline: disciplines.length,
  };

  const uniqueYears = [...new Set(courses.filter(c => c.year).map(c => c.year))].sort();

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
          </div>
          <div className="mt-4">
            <p className="text-gray-500 text-sm font-medium">Total Courses</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-500 text-sm font-medium">By Year</p>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4].map(year => (
                <span key={year} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                  Y{year}: {stats.byYear[year as keyof typeof stats.byYear]}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-500 text-sm font-medium">Disciplines</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.byDiscipline}</h3>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="bg-orange-50 p-2.5 rounded-lg text-orange-600">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-500 text-sm font-medium">Active Years</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{uniqueYears.length}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by course code or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Discipline Filter */}
          {isSuperAdmin && disciplines.length > 0 && (
            <div className="relative min-w-[180px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterDiscipline}
                onChange={(e) => setFilterDiscipline(e.target.value)}
                className="w-full pl-9 pr-8 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer transition-all"
              >
                <option value="all">All Disciplines</option>
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Year Filter */}
          {uniqueYears.length > 0 && (
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer transition-all"
            >
              <option value="all">All Years</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year}>Year {year}</option>
              ))}
            </select>
          )}

          {/* Add Button */}
          <button
            onClick={() => {
              setShowModal(true);
              setEditingCourse(null);
              const disciplineId = !isSuperAdmin && user?.discipline?.id ? user.discipline.id : '';
              setForm({ code: '', title: '', disciplineId, yearTerm: '' });
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Course Catalog
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full ml-2">
              {filteredCourses.length}
            </span>
          </h3>
          {searchQuery || filterDiscipline !== 'all' || filterYear !== 'all' ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterDiscipline('all');
                setFilterYear('all');
              }}
              className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          ) : null}
        </div>

        {loading && courses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-500 font-medium">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h4>
            <p className="text-gray-500 mb-4">
              {searchQuery || filterDiscipline !== 'all' || filterYear !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first course'}
            </p>
            {!searchQuery && filterDiscipline === 'all' && filterYear === 'all' && (
              <button
                onClick={() => {
                  setShowModal(true);
                  setEditingCourse(null);
                  const disciplineId = !isSuperAdmin && user?.discipline?.id ? user.discipline.id : '';
                  setForm({ code: '', title: '', disciplineId, yearTerm: '' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add First Course
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course Code</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Discipline</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Term</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-sm font-bold rounded-lg border border-blue-200">
                        {course.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{course.title}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{course.discipline?.name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {course.year ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Year {course.year}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">All Years</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {course.term ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          Term {course.term}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">All Terms</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditCourse(course)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, courseId: course.id, title: course.title })}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {editingCourse ? (
                  <>
                    <Edit className="h-5 w-5 text-blue-600" />
                    Edit Course
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-blue-600" />
                    Create New Course
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCourse(null);
                  setForm({ code: '', title: '', disciplineId: '', yearTerm: '' });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g., CSE 101"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Introduction to Computer Science"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Discipline <span className="text-red-500">*</span>
                  </label>
                  {isSuperAdmin ? (
                    <select
                      value={form.disciplineId}
                      onChange={(e) => setForm({ ...form, disciplineId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white appearance-none cursor-pointer transition-all"
                      required
                    >
                      <option value="">Select Discipline</option>
                      {disciplines.map((discipline) => (
                        <option key={discipline.id} value={discipline.id}>
                          {discipline.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={user?.discipline?.name || ''}
                      disabled
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Academic Term
                  </label>
                  <select
                    value={form.yearTerm}
                    onChange={(e) => setForm({ ...form, yearTerm: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white appearance-none cursor-pointer transition-all"
                  >
                    <option value="">All Years & Terms (Optional)</option>
                    <option value="1:1">Year 1 • Term 1</option>
                    <option value="1:2">Year 1 • Term 2</option>
                    <option value="2:1">Year 2 • Term 1</option>
                    <option value="2:2">Year 2 • Term 2</option>
                    <option value="3:1">Year 3 • Term 1</option>
                    <option value="3:2">Year 3 • Term 2</option>
                    <option value="4:1">Year 4 • Term 1</option>
                    <option value="4:2">Year 4 • Term 2</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    Leave blank if this course is available for all years/terms
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCourse(null);
                    setForm({ code: '', title: '', disciplineId: '', yearTerm: '' });
                  }}
                  className="flex-1 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                >
                  {loading ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Delete Course
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                <div className="text-red-600 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-red-800">
                    Are you sure you want to delete <span className="font-semibold">"{deleteConfirm.title}"</span>? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, courseId: '', title: '' })}
                  className="flex-1 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteCourse(deleteConfirm.courseId)}
                  disabled={loading}
                  className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
