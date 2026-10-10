'use client';

import { Eye, Star, Rocket, Award, User } from 'lucide-react';

interface Contributor {
    id: string;
    fullName: string;
    role: string;
    avatarUrl: string | null;
    uploadCount: number;
    badge: string;
}

interface TopContributorsProps {
    contributors: Contributor[];
    loading?: boolean;
    onViewUser?: (userId: string) => void;
}

const badgeConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    'top_rated': {
        label: 'Top Rated',
        icon: <Star className="h-3.5 w-3.5" />,
        className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    'rising_star': {
        label: 'Rising Star',
        icon: <Rocket className="h-3.5 w-3.5" />,
        className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    'verified': {
        label: 'Verified',
        icon: <Award className="h-3.5 w-3.5" />,
        className: 'bg-green-100 text-green-800 border-green-200',
    },
    'contributor': {
        label: 'Contributor',
        icon: <User className="h-3.5 w-3.5" />,
        className: 'bg-gray-100 text-gray-700 border-gray-200',
    },
};

const roleLabels: Record<string, string> = {
    'student': 'Student',
    'teacher': 'Teacher',
    'admin': 'Admin',
    'super_admin': 'Super Admin',
};

export default function TopContributors({ contributors, loading = false, onViewUser }: TopContributorsProps) {
    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100">
                    <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contributor</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Uploads</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Badge</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[1, 2, 3, 4].map((i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
                                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
                                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-8 ml-auto"></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Top Contributors</h3>
                <span className="text-sm text-gray-500">By uploads</span>
            </div>

            {contributors.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No contributors yet</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contributor</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploads</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Badge</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {contributors.map((contributor) => {
                                const badge = badgeConfig[contributor.badge] || badgeConfig['contributor'];
                                return (
                                    <tr key={contributor.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                {contributor.avatarUrl ? (
                                                    <div
                                                        className="w-9 h-9 rounded-full bg-cover bg-center ring-2 ring-gray-100"
                                                        style={{ backgroundImage: `url(${contributor.avatarUrl})` }}
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                                        {contributor.fullName?.charAt(0) || 'U'}
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-gray-900">{contributor.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {roleLabels[contributor.role] || contributor.role}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                            {contributor.uploadCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
                                                {badge.icon}
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => onViewUser?.(contributor.id)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-blue-50"
                                            >
                                                <Eye className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
