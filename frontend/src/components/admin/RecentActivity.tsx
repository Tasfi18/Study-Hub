'use client';

import { FileUp, CheckCircle, XCircle, UserPlus, Activity } from 'lucide-react';

interface ActivityItem {
    id: string;
    type: string;
    title: string;
    userName: string;
    createdAt: string;
    status: string;
}

interface RecentActivityProps {
    activities: ActivityItem[];
    loading?: boolean;
    onViewAll?: () => void;
}

const getActivityConfig = (type: string, status: string) => {
    if (type === 'registration') {
        return {
            icon: <UserPlus className="h-4 w-4" />,
            color: 'bg-emerald-500',
            label: 'New Registration',
        };
    }
    if (type === 'upload' || status === 'pending') {
        return {
            icon: <FileUp className="h-4 w-4" />,
            color: 'bg-blue-500',
            label: 'New Upload',
        };
    }
    if (type === 'approval' || status === 'approved') {
        return {
            icon: <CheckCircle className="h-4 w-4" />,
            color: 'bg-green-500',
            label: 'Approved',
        };
    }
    if (type === 'rejection' || status === 'rejected') {
        return {
            icon: <XCircle className="h-4 w-4" />,
            color: 'bg-orange-500',
            label: 'Flagged',
        };
    }
    return {
        icon: <Activity className="h-4 w-4" />,
        color: 'bg-gray-400',
        label: 'Activity',
    };
};

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
};

export default function RecentActivity({ activities, loading = false, onViewAll }: RecentActivityProps) {
    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="h-6 bg-gray-200 rounded w-36 mb-4 animate-pulse"></div>
                <div className="relative pl-2 flex flex-col gap-6">
                    <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200"></div>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="relative flex gap-4 pl-4 animate-pulse">
                            <div className="absolute left-[3px] top-1.5 w-2 h-2 bg-gray-300 rounded-full"></div>
                            <div className="flex flex-col gap-1 flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-20"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex-1 flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>

            {activities.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-8 text-gray-500">
                    <div className="text-center">
                        <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No recent activity</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="relative pl-2 flex flex-col gap-5 flex-1">
                        {/* Timeline line */}
                        <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200"></div>

                        {activities.slice(0, 5).map((activity) => {
                            const config = getActivityConfig(activity.type, activity.status);
                            return (
                                <div key={activity.id} className="relative flex gap-4 pl-4">
                                    {/* Timeline dot */}
                                    <div className={`absolute left-[3px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${config.color}`}></div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-semibold text-gray-900">{activity.userName}</span>
                                            {' '}
                                            {activity.type === 'registration'
                                                ? activity.title.replace(activity.userName, '').trim()
                                                : activity.type === 'upload' || activity.status === 'pending'
                                                    ? `uploaded "${activity.title}"`
                                                    : activity.status === 'approved'
                                                        ? `material "${activity.title}" approved`
                                                        : activity.status === 'rejected'
                                                            ? `material "${activity.title}" flagged for review`
                                                            : activity.title}
                                        </p>
                                        <span className="text-xs text-gray-500">{formatTimeAgo(activity.createdAt)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {onViewAll && (
                        <button
                            onClick={onViewAll}
                            className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-blue-600 border border-dashed border-gray-300 hover:border-blue-300 rounded-lg transition-colors"
                        >
                            View All Activity
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
