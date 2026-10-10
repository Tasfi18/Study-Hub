'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Users, GraduationCap, UserCog, ShieldAlert,
  ChevronLeft, ChevronRight, MoreVertical, Download
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Toast, { ToastType } from '@/components/Toast';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  avatar_url?: string;
  created_at?: string;
  discipline?: {
    id: string;
    name: string;
  };
}

interface UserManagementProps {
  isSuperAdmin: boolean;
  currentUserId?: string;
  user?: any;
}

const ROLES = ['student', 'teacher', 'admin', 'super_admin'] as const;
const ITEMS_PER_PAGE = 10;

export default function UserManagement({ isSuperAdmin, currentUserId, user }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      loadUsers();
    }
  }, [isSuperAdmin]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  const loadUsers = useCallback(async (searchTerm?: string) => {
    if (!isSuperAdmin) return;

    try {
      setLoading(true);
      const response = await apiClient.getAllUsers({
        limit: 500,
        search: searchTerm || undefined
      });

      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (isSuperAdmin) {
        loadUsers(searchQuery);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, isSuperAdmin, loadUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isSuperAdmin || userId === currentUserId) return;

    try {
      const response = await apiClient.updateUserRole(userId, newRole);
      if (response.success) {
        showToast('User role updated successfully', 'success');
        loadUsers(searchQuery);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update user role';
      showToast(message, 'error');
    }
  };

  // Calculate stats
  const stats = useMemo(() => ({
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    teachers: users.filter(u => u.role === 'teacher').length,
    admins: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
  }), [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && u.is_active) ||
        (filterStatus === 'inactive' && !u.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, filterRole, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole, filterStatus]);

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'admin':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'teacher':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'teacher': return 'Teacher';
      default: return 'Student';
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Status', 'Discipline', 'Joined'],
      ...filteredUsers.map(u => [
        u.full_name || 'N/A',
        u.email,
        getRoleLabel(u.role),
        u.is_active ? 'Active' : 'Inactive',
        u.discipline?.name || 'N/A',
        u.created_at ? formatDate(u.created_at) : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('Users exported successfully', 'success');
  };

  if (!isSuperAdmin) return null;

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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 text-sm font-medium">Total Users</p>
              <div className="bg-blue-50 p-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-end gap-2 mt-3">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <span className="text-emerald-600 text-xs font-bold bg-emerald-100 px-1.5 py-0.5 rounded flex items-center mb-1">
                Active: {stats.active}
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 text-sm font-medium">Students</p>
              <div className="bg-sky-50 p-2 rounded-lg">
                <GraduationCap className="h-5 w-5 text-sky-600" />
              </div>
            </div>
            <div className="flex items-end gap-2 mt-3">
              <p className="text-3xl font-bold text-gray-900">{stats.students}</p>
              <span className="text-gray-500 text-xs mb-1">
                {stats.total > 0 ? Math.round((stats.students / stats.total) * 100) : 0}% of total
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 text-sm font-medium">Teachers</p>
              <div className="bg-purple-50 p-2 rounded-lg">
                <UserCog className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="flex items-end gap-2 mt-3">
              <p className="text-3xl font-bold text-gray-900">{stats.teachers}</p>
              <span className="text-gray-500 text-xs mb-1">
                {stats.total > 0 ? Math.round((stats.teachers / stats.total) * 100) : 0}% of total
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 text-sm font-medium">Admins</p>
              <div className="bg-orange-50 p-2 rounded-lg">
                <ShieldAlert className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="flex items-end gap-2 mt-3">
              <p className="text-3xl font-bold text-gray-900">{stats.admins}</p>
              <span className="text-gray-500 text-xs mb-1">
                With elevated access
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
            {/* Search */}
            <div className="w-full lg:max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-end">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="h-11 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-500 cursor-pointer hover:bg-gray-50 transition-colors appearance-none pr-10"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                <option value="all">All Roles</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-11 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-500 cursor-pointer hover:bg-gray-50 transition-colors appearance-none pr-10"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center h-11 px-4 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-500 font-medium">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No users found</h4>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">User</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Role</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">Discipline</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell">Joined</th>
                      <th className="p-4 w-20 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {paginatedUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {u.avatar_url ? (
                              <div
                                className="w-10 h-10 rounded-full bg-cover bg-center shrink-0 ring-2 ring-white"
                                style={{ backgroundImage: `url(${u.avatar_url})` }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                                {u.full_name?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900">{u.full_name || 'Unknown'}</p>
                              <p className="text-gray-500 text-xs">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={u.id === currentUserId}
                            className={`text-xs px-2.5 py-1 rounded-full font-medium border cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${getRoleBadgeStyle(u.role)}`}
                          >
                            {ROLES.map(role => (
                              <option key={role} value={role}>{getRoleLabel(role)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                            <span className={`font-medium ${u.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-500 hidden md:table-cell">
                          {u.discipline?.name || '—'}
                        </td>
                        <td className="p-4 text-gray-500 hidden lg:table-cell">
                          {u.created_at ? formatDate(u.created_at) : '—'}
                        </td>
                        <td className="p-4 text-center relative">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === u.id ? null : u.id)}
                            className="text-gray-400 hover:text-blue-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          {actionMenuOpen === u.id && (
                            <div className="absolute right-4 top-12 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
                              <button
                                onClick={() => {
                                  // View profile action
                                  setActionMenuOpen(null);
                                  showToast('View profile coming soon', 'info');
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                View Profile
                              </button>
                              {u.id !== currentUserId && (
                                <button
                                  onClick={() => {
                                    setActionMenuOpen(null);
                                    showToast('User actions coming soon', 'info');
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  Suspend User
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                  <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}</span> of{' '}
                  <span className="font-bold text-gray-900">{filteredUsers.length}</span> users
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`flex items-center justify-center w-8 h-8 rounded text-sm font-medium ${currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'hover:bg-gray-100 text-gray-700'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="flex items-center justify-center w-8 h-8 text-gray-500">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 text-gray-700 text-sm font-medium"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Close action menu when clicking outside */}
      {actionMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActionMenuOpen(null)}
        />
      )}
    </>
  );
}