'use client';

import { useAuthStore } from '@/store/authStore';

interface CTABannerProps {
    onAuthModalOpen: () => void;
}

export default function CTABanner({ onAuthModalOpen }: CTABannerProps) {
    const { user } = useAuthStore();

    const handleSignUp = () => {
        if (!user) {
            onAuthModalOpen();
        }
    };

    const scrollToMaterials = () => {
        document.getElementById('materials-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="w-full bg-white py-16 px-4 border-t border-[#e7ebf3]">
            <div className="max-w-[960px] mx-auto bg-[#135bec] rounded-2xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                {/* Decorative elements */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black opacity-10 rounded-full blur-3xl" />

                {/* Content */}
                <div className="relative z-10 flex flex-col gap-4 text-center md:text-left">
                    <h2 className="text-white text-2xl sm:text-3xl font-black leading-tight">
                        Ready to boost your grades?
                    </h2>
                    <p className="text-blue-100 text-base sm:text-lg max-w-md">
                        Join thousands of KU students who are already acing their exams with our study materials.
                    </p>
                </div>

                {/* Buttons */}
                <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {!user ? (
                        <button
                            onClick={handleSignUp}
                            className="bg-white text-[#135bec] hover:bg-gray-100 font-bold py-3 px-8 rounded-lg shadow-lg transition-colors whitespace-nowrap"
                        >
                            Sign Up Free
                        </button>
                    ) : (
                        <button
                            onClick={scrollToMaterials}
                            className="bg-white text-[#135bec] hover:bg-gray-100 font-bold py-3 px-8 rounded-lg shadow-lg transition-colors whitespace-nowrap"
                        >
                            Browse Materials
                        </button>
                    )}
                    <button
                        onClick={scrollToMaterials}
                        className="bg-blue-700 text-white hover:bg-blue-800 border border-blue-500 font-bold py-3 px-8 rounded-lg transition-colors whitespace-nowrap"
                    >
                        Learn More
                    </button>
                </div>
            </div>
        </div>
    );
}
