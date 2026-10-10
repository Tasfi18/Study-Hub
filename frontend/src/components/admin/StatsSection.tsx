'use client';

import { Users, FileText, Download, Clock } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalMaterials: number;
  totalDownloads: number;
  pendingApprovals: number;
}

interface StatsSectionProps {
  stats: Stats;
  loading?: boolean;
  onViewPending?: () => void;
}

export default function StatsSection({ stats, loading = false, onViewPending }: StatsSectionProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse shadow-sm">
            <div className="flex items-start justify-between">
              <div className="bg-gray-200 p-2.5 rounded-lg w-10 h-10"></div>
              <div className="bg-gray-200 rounded-full w-16 h-6"></div>
            </div>
            <div className="mt-4">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Users */}
      <div className="bg-white border border-gray-200 p-5 rounded-xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Active
          </span>
        </div>
        <div>
          <p className="text-gray-500 text-sm font-medium">Total Users</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers.toLocaleString()}</h3>
        </div>
      </div>

      {/* Total Materials */}
      <div className="bg-white border border-gray-200 p-5 rounded-xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600">
            <FileText className="h-5 w-5" />
          </div>
          <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Approved
          </span>
        </div>
        <div>
          <p className="text-gray-500 text-sm font-medium">Total Materials</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalMaterials.toLocaleString()}</h3>
        </div>
      </div>

      {/* Total Downloads */}
      <div className="bg-white border border-gray-200 p-5 rounded-xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="bg-orange-50 p-2.5 rounded-lg text-orange-600">
            <Download className="h-5 w-5" />
          </div>
          <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Growing
          </span>
        </div>
        <div>
          <p className="text-gray-500 text-sm font-medium">Total Downloads</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalDownloads.toLocaleString()}</h3>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white border-2 border-blue-200 p-5 rounded-xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
        <div className="flex items-start justify-between relative z-10">
          <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600">
            <Clock className="h-5 w-5" />
          </div>
          {onViewPending && (
            <button
              onClick={onViewPending}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View All
            </button>
          )}
        </div>
        <div className="relative z-10">
          <p className="text-gray-500 text-sm font-medium">Pending Approvals</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1">{stats.pendingApprovals}</h3>
        </div>
      </div>
    </div>
  );
}
