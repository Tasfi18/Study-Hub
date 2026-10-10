'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, FileText, Users, Star, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface PlatformStats {
    totalDisciplines: number;
    totalMaterials: number;
    activeUsers: number;
    averageRating: number;
}

export default function StatsStrip() {
    const [stats, setStats] = useState<PlatformStats>({
        totalDisciplines: 0,
        totalMaterials: 0,
        activeUsers: 0,
        averageRating: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await apiClient.getStats();
                if (response.success && response.data) {
                    setStats({
                        totalDisciplines: response.data.totalDisciplines || 0,
                        totalMaterials: response.data.totalMaterials || 0,
                        activeUsers: response.data.activeUsers || 0,
                        averageRating: response.data.averageRating || 0,
                    });
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const formatNumber = (num: number): string => {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K+`;
        }
        return num > 0 ? `${num}+` : '0';
    };

    const statsData = [
        {
            label: 'Disciplines',
            value: loading ? '...' : formatNumber(stats.totalDisciplines),
            icon: GraduationCap,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-500/10',
            textColor: 'text-blue-600',
        },
        {
            label: 'Study Materials',
            value: loading ? '...' : formatNumber(stats.totalMaterials),
            icon: FileText,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-500/10',
            textColor: 'text-purple-600',
        },
        {
            label: 'Active Students',
            value: loading ? '...' : formatNumber(stats.activeUsers),
            icon: Users,
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-500/10',
            textColor: 'text-emerald-600',
        },
        {
            label: 'User Rating',
            value: loading ? '...' : stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)}/5` : 'N/A',
            icon: Star,
            color: 'from-amber-500 to-orange-500',
            bgColor: 'bg-amber-500/10',
            textColor: 'text-amber-600',
        },
    ];

    return (
        // Hidden on mobile (below md breakpoint)
        <div className="hidden md:block w-full relative overflow-hidden">
            {/* Advanced Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900" />

            {/* Animated gradient orbs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-indigo-500/10 rounded-full blur-3xl" />

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}
            />

            {/* Content */}
            <div className="relative z-10 section-container py-12 lg:py-16">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-4">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-200">Platform Statistics</span>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-white">
                        Trusted by Students Everywhere
                    </h3>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {statsData.map((stat, index) => (
                        <div
                            key={stat.label}
                            className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-white/20"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Glow effect on hover */}
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

                            <div className="relative z-10 flex flex-col items-center text-center gap-3">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                                    <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                                </div>

                                {/* Value */}
                                <span className={`text-3xl lg:text-4xl font-black text-white ${loading ? 'animate-pulse' : ''}`}>
                                    {stat.value}
                                </span>

                                {/* Label */}
                                <span className="text-sm font-medium text-gray-400">{stat.label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom accent */}
                <div className="flex justify-center mt-8">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span>Live data • Updated in real-time</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
