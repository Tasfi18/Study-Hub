'use client';

import { ShieldCheck, Download, Star } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const features = [
    {
        icon: ShieldCheck,
        title: 'Verified Content',
        description: 'All summaries and notes are manually reviewed by our team for accuracy and quality before publishing.',
        iconBg: 'bg-blue-100',
        iconColor: 'text-[#135bec]',
        hoverBg: 'group-hover:bg-[#135bec]',
    },
    {
        icon: Download,
        title: 'Free Downloads',
        description: 'Download study guides for offline access. Study anywhere, anytime, even without an internet connection.',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        hoverBg: 'group-hover:bg-purple-600',
    },
    {
        icon: Star,
        title: 'Community Rated',
        description: 'Transparent rating system. See reviews and ratings from peers before you invest your time in a document.',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        hoverBg: 'group-hover:bg-yellow-600',
    },
];

export default function FeaturesSection() {
    const { user } = useAuthStore();

    // Hide features section for logged-in users (it's marketing content for guests)
    if (user) {
        return null;
    }

    return (
        <div className="w-full bg-[#f6f6f8] py-16">
            <div className="section-container">
                {/* Section Header */}
                <div className="flex flex-col gap-4 text-center items-center mb-12">
                    <span className="text-[#135bec] text-sm font-bold uppercase tracking-wider">
                        Our Benefits
                    </span>
                    <h2 className="text-[#0d121b] text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight max-w-[720px]">
                        Why Choose Study Hub?
                    </h2>
                    <p className="text-[#4c669a] text-base leading-relaxed max-w-[600px]">
                        We provide the specialized tools and verified resources you need to succeed academically without the stress.
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="group flex flex-col gap-5 rounded-xl border border-[#cfd7e7] bg-white p-6 hover:shadow-lg transition-all duration-300"
                        >
                            <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${feature.iconBg} ${feature.iconColor} ${feature.hoverBg} group-hover:text-white`}
                            >
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <h3 className="text-[#0d121b] text-xl font-bold leading-tight">
                                    {feature.title}
                                </h3>
                                <p className="text-[#4c669a] text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
