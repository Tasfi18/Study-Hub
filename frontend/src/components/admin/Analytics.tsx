'use client';

import { useState, useEffect } from 'react';
import {
    Users, FileText, Download, Star, TrendingUp,
    BarChart3, ArrowUpRight, Award
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface AnalyticsStats {
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

interface TopMaterial {
    id: string;
    title: string;
    downloadCount: number;
    category: string;
}

interface AnalyticsProps {
    onExportCSV?: () => void;
}

const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
        lecture_note: 'bg-blue-500',
        previous_question: 'bg-red-500',
        ct_question: 'bg-orange-500',
        final_question: 'bg-purple-500',
        assignment: 'bg-pink-500',
        lab_manual: 'bg-teal-500',
        book: 'bg-indigo-500',
        thesis: 'bg-emerald-500',
        other: 'bg-gray-500',
    };
    return colors[category] || 'bg-gray-500';
};

const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
        lecture_note: 'Lecture Notes',
        previous_question: 'Past Questions',
        ct_question: 'CT Questions',
        final_question: 'Final Questions',
        assignment: 'Assignments',
        lab_manual: 'Lab Manuals',
        book: 'Books',
        thesis: 'Thesis',
        other: 'Other',
    };
    return labels[category] || category;
};

export default function Analytics({ onExportCSV }: AnalyticsProps) {
    const [stats, setStats] = useState<AnalyticsStats>({
        totalUsers: 0,
        totalMaterials: 0,
        totalDownloads: 0,
        pendingApprovals: 0,
    });
    const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
    const [topMaterials, setTopMaterials] = useState<TopMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'7D' | '30D' | '3M' | '1Y'>('30D');

    useEffect(() => {
        loadAnalyticsData();
    }, [dateRange]);

    const loadAnalyticsData = async () => {
        try {
            setLoading(true);

            // Convert display format to API format (lowercase)
            const apiDateRange = dateRange.toLowerCase() as '7d' | '30d' | '3m' | '1y';

            // Load dashboard stats with date filter
            const dashboardResponse = await apiClient.getAdminDashboardStats(apiDateRange);
            if (dashboardResponse.success && dashboardResponse.data) {
                setStats(dashboardResponse.data.stats);
                setCategoryData(dashboardResponse.data.categoryDistribution || []);
            }

            // Load top materials (basic fetch, sorted by default)
            const materialsResponse = await apiClient.getMaterials({
                limit: 10,
            });
            if (materialsResponse.success && materialsResponse.data) {
                // Sort by download count and take top 5
                const sortedMaterials = materialsResponse.data
                    .map((m) => ({
                        id: m.id,
                        title: m.title,
                        downloadCount: m.download_count || 0,
                        category: m.category || 'other',
                    }))
                    .sort((a, b) => b.downloadCount - a.downloadCount)
                    .slice(0, 5);
                setTopMaterials(sortedMaterials);
            }
        } catch (error) {
            console.error('Failed to load analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const kpiCards = [
        {
            label: 'Total Users',
            value: stats.totalUsers.toLocaleString(),
            icon: Users,
            color: 'blue',
            trend: '+12%',
            trendUp: true,
        },
        {
            label: 'Study Materials',
            value: stats.totalMaterials.toLocaleString(),
            icon: FileText,
            color: 'purple',
            trend: '+5%',
            trendUp: true,
        },
        {
            label: 'Total Downloads',
            value: stats.totalDownloads >= 1000
                ? `${(stats.totalDownloads / 1000).toFixed(1)}k`
                : stats.totalDownloads.toLocaleString(),
            icon: Download,
            color: 'orange',
            trend: '+18%',
            trendUp: true,
        },
        {
            label: 'Pending Review',
            value: stats.pendingApprovals.toLocaleString(),
            icon: Star,
            color: 'pink',
            trend: stats.pendingApprovals > 0 ? 'Action needed' : 'All clear',
            trendUp: false,
            isNeutral: stats.pendingApprovals === 0,
        },
    ];

    const colorClasses: Record<string, { bg: string; icon: string; glow: string }> = {
        blue: { bg: 'bg-blue-50', icon: 'text-blue-600', glow: 'bg-blue-500/5' },
        purple: { bg: 'bg-purple-50', icon: 'text-purple-600', glow: 'bg-purple-500/5' },
        orange: { bg: 'bg-orange-50', icon: 'text-orange-600', glow: 'bg-orange-500/5' },
        pink: { bg: 'bg-pink-50', icon: 'text-pink-600', glow: 'bg-pink-500/5' },
    };

    // Calculate total for percentage
    const totalMaterials = categoryData.reduce((sum, c) => sum + c.count, 0);

    // Build conic gradient for donut chart
    const buildConicGradient = () => {
        if (categoryData.length === 0) return 'bg-gray-200';

        const colors = categoryData.map(c => getCategoryColor(c.category).replace('bg-', ''));
        let gradient = 'conic-gradient(';
        let currentPercent = 0;

        categoryData.forEach((cat, index) => {
            const percent = totalMaterials > 0 ? (cat.count / totalMaterials) * 100 : 0;
            const tailwindColor = getCategoryColor(cat.category);
            // Map tailwind colors to hex
            const colorMap: Record<string, string> = {
                'bg-blue-500': '#3b82f6',
                'bg-red-500': '#ef4444',
                'bg-orange-500': '#f97316',
                'bg-purple-500': '#a855f7',
                'bg-pink-500': '#ec4899',
                'bg-teal-500': '#14b8a6',
                'bg-indigo-500': '#6366f1',
                'bg-emerald-500': '#10b981',
                'bg-gray-500': '#6b7280',
            };
            const hexColor = colorMap[tailwindColor] || '#6b7280';
            gradient += `${hexColor} ${currentPercent}% ${currentPercent + percent}%`;
            if (index < categoryData.length - 1) gradient += ', ';
            currentPercent += percent;
        });

        gradient += ')';
        return gradient;
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                {/* Loading skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                            <div className="h-10 w-10 bg-gray-200 rounded-lg mb-4" />
                            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                            <div className="h-8 bg-gray-200 rounded w-16" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Platform Analytics</h2>
                    <p className="text-sm text-gray-500">Deep dive into user growth and content performance.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Range Chips */}
                    <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                        {(['7D', '30D', '3M', '1Y'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${dateRange === range
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    {onExportCSV && (
                        <button
                            onClick={onExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card) => {
                    const colors = colorClasses[card.color];
                    return (
                        <div
                            key={card.label}
                            className="relative p-5 rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 ${colors.bg} rounded-lg`}>
                                    <card.icon className={`w-5 h-5 ${colors.icon}`} />
                                </div>
                                {card.trendUp ? (
                                    <span className="flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                                        {card.trend}
                                        <TrendingUp className="w-3 h-3 ml-0.5" />
                                    </span>
                                ) : card.isNeutral ? (
                                    <span className="flex items-center text-gray-500 text-xs font-bold bg-gray-100 px-2 py-1 rounded-full">
                                        {card.trend}
                                    </span>
                                ) : (
                                    <span className="flex items-center text-amber-600 text-xs font-bold bg-amber-50 px-2 py-1 rounded-full">
                                        {card.trend}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">{card.label}</h3>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                            {/* Decorative glow */}
                            <div className={`absolute -right-6 -bottom-6 w-24 h-24 ${colors.glow} rounded-full blur-2xl group-hover:opacity-100 opacity-50 transition-opacity`} />
                        </div>
                    );
                })}
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Materials */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-bold text-gray-900">Top Performing Materials</h3>
                        </div>
                        <Link
                            href="/materials"
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            View All
                        </Link>
                    </div>
                    <div className="flex flex-col gap-5">
                        {topMaterials.length > 0 ? (
                            topMaterials.map((material, index) => {
                                const maxDownloads = topMaterials[0]?.downloadCount || 1;
                                const percentage = (material.downloadCount / maxDownloads) * 100;
                                const categoryColor = getCategoryColor(material.category);

                                return (
                                    <div key={material.id} className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg ${categoryColor.replace('bg-', 'bg-')}/10 flex items-center justify-center flex-shrink-0`}>
                                            <span className={`text-sm font-bold ${categoryColor.replace('bg-', 'text-')}`}>
                                                #{index + 1}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-900 truncate pr-2">
                                                    {material.title}
                                                </span>
                                                <span className="text-xs font-bold text-gray-500 flex-shrink-0">
                                                    {material.downloadCount.toLocaleString()} downloads
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`${categoryColor} h-2 rounded-full transition-all`}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-8">No materials found</p>
                        )}
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-gray-900">Content Distribution</h3>
                    </div>

                    {categoryData.length > 0 ? (
                        <>
                            {/* Donut Chart */}
                            <div className="flex-1 flex items-center justify-center relative py-4">
                                <div
                                    className="w-40 h-40 rounded-full"
                                    style={{ background: buildConicGradient() }}
                                />
                                <div className="absolute w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                                    <span className="text-2xl font-bold text-gray-900">
                                        {totalMaterials.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-gray-500">Total Files</span>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                {categoryData.slice(0, 6).map((cat) => {
                                    const percent = totalMaterials > 0 ? Math.round((cat.count / totalMaterials) * 100) : 0;
                                    return (
                                        <div key={cat.category} className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${getCategoryColor(cat.category)}`} />
                                            <span className="text-xs text-gray-600 truncate">
                                                {getCategoryLabel(cat.category)} ({percent}%)
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-sm text-gray-500">No category data</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Insights Card */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-blue-100 text-sm font-medium mb-1">Platform Insights</p>
                        <h3 className="text-2xl font-bold">
                            {stats.totalMaterials > 0
                                ? `${Math.round(stats.totalDownloads / stats.totalMaterials)} downloads/material avg`
                                : 'No data yet'
                            }
                        </h3>
                    </div>
                    <ArrowUpRight className="w-8 h-8 opacity-50" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                    <span className="bg-white/20 px-2 py-0.5 rounded text-white font-medium mr-2">
                        {stats.totalUsers > 0
                            ? `${Math.round((stats.totalMaterials / stats.totalUsers) * 100)}%`
                            : '0%'
                        }
                    </span>
                    <span className="text-blue-100">of users have uploaded materials</span>
                </div>
            </div>
        </div>
    );
}
