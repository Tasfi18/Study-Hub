'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Shield, BookOpen, Calendar, Users, Home, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Toast, { ToastType } from '@/components/Toast';
import Link from 'next/link';

// Import admin components
import StatsSection from '@/components/admin/StatsSection';
import MaterialManagement from '@/components/admin/MaterialManagement';
import UserManagement from '@/components/admin/UserManagement';
import CourseManagement from '@/components/admin/CourseManagement';
import ScheduleManagement from '@/components/admin/ScheduleManagement';
import CategoryChart from '@/components/admin/CategoryChart';
import TopContributors from '@/components/admin/TopContributors';
import RecentActivity from '@/components/admin/RecentActivity';
import QuickActions from '@/components/admin/QuickActions';
import Analytics from '@/components/admin/Analytics';

interface DashboardStats {
  totalUsers: number;
  totalMaterials: number;
  totalDownloads: number;
  pendingApprovals: number;
}

interface CategoryData {
  category: string;
  count: number;
  percentage: number;
}

interface Contributor {
  id: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  uploadCount: number;
  badge: string;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  userName: string;
  createdAt: string;
  status: string;
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalMaterials: 0,
    totalDownloads: 0,
    pendingApprovals: 0,
  });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Active section state - only one section active at a time
  const [activeSection, setActiveSection] = useState<'dashboard' | 'materials' | 'users' | 'courses' | 'schedules' | 'analytics'>('dashboard');

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (user) {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await apiClient.getAdminDashboardStats();
      if (response.success && response.data) {
        setStats(response.data.stats);
        setCategoryData(response.data.categoryDistribution);
        setTopContributors(response.data.topContributors);
        setRecentActivity(response.data.recentActivity);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      // Fallback to basic stats
      try {
        const basicResponse = await apiClient.getStats();
        if (basicResponse.success && basicResponse.data) {
          setStats({
            totalUsers: basicResponse.data.activeUsers || 0,
            totalMaterials: basicResponse.data.totalMaterials || 0,
            totalDownloads: basicResponse.data.totalDownloads || 0,
            pendingApprovals: 0,
          });
        }
      } catch (err) {
        console.error('Failed to load basic stats:', err);
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  const handleStatsUpdate = () => {
    loadDashboardStats();
  };

  const handleExportCSV = () => {
    // Create CSV content
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Users', stats.totalUsers],
      ['Total Materials', stats.totalMaterials],
      ['Total Downloads', stats.totalDownloads],
      ['Pending Approvals', stats.pendingApprovals],
      [''],
      ['Category', 'Count', 'Percentage'],
      ...categoryData.map(c => [c.category, c.count, `${c.percentage}%`]),
    ].map(row => row.join(',')).join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-stats-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('Statistics exported successfully', 'success');
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-blue-100 flex items-center justify-center rounded-xl w-10 h-10">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-none tracking-tight text-gray-900">Study Hub</h1>
              <p className="text-gray-500 text-xs font-medium mt-0.5">Admin Console</p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          {/* Profile */}
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <div
                className="w-9 h-9 rounded-full bg-cover bg-center ring-2 ring-gray-100"
                style={{ backgroundImage: `url(${user.avatar_url})` }}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
            )}
            <div className="hidden md:flex flex-col">
              <p className="text-sm font-semibold text-gray-700">{user?.full_name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6">

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveSection('dashboard')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeSection === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Shield className="h-4 w-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveSection('materials')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeSection === 'materials'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <BookOpen className="h-4 w-4" />
                Materials
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveSection('users')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeSection === 'users'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <Users className="h-4 w-4" />
                  Users
                </button>
              )}
              <button
                onClick={() => setActiveSection('courses')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeSection === 'courses'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <BookOpen className="h-4 w-4" />
                Courses
              </button>
              <button
                onClick={() => setActiveSection('schedules')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeSection === 'schedules'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Calendar className="h-4 w-4" />
                Schedules
              </button>
              <button
                onClick={() => setActiveSection('analytics')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeSection === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </button>
            </div>
          </div>

          {/* Dashboard View */}
          {activeSection === 'dashboard' && (
            <>
              {/* Stats Section */}
              <StatsSection
                stats={stats}
                loading={statsLoading}
                onViewPending={() => setActiveSection('materials')}
              />

              {/* Charts Section */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Contributors takes 2 columns */}
                <div className="lg:col-span-2">
                  <TopContributors
                    contributors={topContributors}
                    loading={statsLoading}
                  />
                </div>
                {/* Category Chart */}
                <CategoryChart
                  data={categoryData}
                  loading={statsLoading}
                />
              </section>

              {/* Bottom Section: Activity & Quick Actions */}
              <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Activity takes 2 columns */}
                <div className="xl:col-span-2">
                  <RecentActivity
                    activities={recentActivity}
                    loading={statsLoading}
                    onViewAll={() => setActiveSection('materials')}
                  />
                </div>
                {/* Quick Actions */}
                <QuickActions
                  pendingCount={stats.pendingApprovals}
                  onApproveAllPending={() => {
                    setActiveSection('materials');
                    showToast('Navigate to Materials tab to approve pending items', 'info');
                  }}
                  onExportCSV={handleExportCSV}
                  onViewReports={() => setActiveSection('materials')}
                />
              </section>
            </>
          )}

          {/* Material Management Section */}
          {activeSection === 'materials' && (
            <MaterialManagement
              user={user}
              isSuperAdmin={isSuperAdmin}
              onStatsUpdate={handleStatsUpdate}
            />
          )}

          {/* User Management Section (Super Admin Only) */}
          {isSuperAdmin && activeSection === 'users' && (
            <UserManagement
              user={user}
              isSuperAdmin={isSuperAdmin}
            />
          )}

          {/* Course Management Section */}
          {activeSection === 'courses' && (
            <CourseManagement
              user={user}
              isSuperAdmin={isSuperAdmin}
            />
          )}

          {/* Schedule Management Section */}
          {activeSection === 'schedules' && (
            <ScheduleManagement
              user={user}
              isSuperAdmin={isSuperAdmin}
            />
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && (
            <Analytics onExportCSV={handleExportCSV} />
          )}
        </div>
      </div>
    </div>
  );
}