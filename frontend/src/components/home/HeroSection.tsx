'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Upload, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface HeroSectionProps {
  onAuthModalOpen: () => void;
  onUploadModalOpen: () => void;
}

export default function HeroSection({ onAuthModalOpen, onUploadModalOpen }: HeroSectionProps) {
  const { user } = useAuthStore();
  const router = useRouter();

  const handleStartLearning = () => {
    if (!user) {
      onAuthModalOpen();
    } else {
      document.getElementById('materials-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUpload = () => {
    if (!user) {
      onAuthModalOpen();
    } else {
      router.push('/upload');
    }
  };

  return (
    <section className="relative w-full bg-white overflow-hidden py-10 sm:py-14 lg:py-16 xl:py-20 flex items-center">
      {/* Subtle background gradient */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none hidden lg:block" />

      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">

          {/* Left Content - Text */}
          <div className="flex-1 flex flex-col gap-6 text-center lg:text-left">

            {/* Main Headline - LARGER */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight text-[#0d121b]">
              Master Your{' '}
              <span className="block sm:inline">Studies with{' '}</span>
              <span className="text-[#135bec]">Peer-Shared</span>{' '}
              Notes.
            </h1>

            {/* Subtitle - LARGER */}
            <p className="text-[#4c669a] text-lg sm:text-xl lg:text-2xl leading-relaxed max-w-xl mx-auto lg:mx-0">
              Join thousands of students sharing lecture notes, exam guides, and flashcards. Study smarter, not harder.
            </p>

            {/* CTA Buttons - LARGER */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <button
                onClick={handleStartLearning}
                className="group inline-flex items-center justify-center gap-2.5 h-14 px-8 bg-[#135bec] hover:bg-[#0d4ac7] text-white text-lg font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                Start Learning
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={handleUpload}
                className="inline-flex items-center justify-center gap-2.5 h-14 px-8 bg-white border-2 border-[#e7ebf3] hover:border-[#135bec] hover:text-[#135bec] text-[#0d121b] text-lg font-bold rounded-xl transition-all"
              >
                <Upload className="w-5 h-5" />
                Upload Notes
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-4 justify-center lg:justify-start pt-2">
              <div className="flex -space-x-2.5">
                {[
                  'bg-gradient-to-br from-pink-500 to-rose-500',
                  'bg-gradient-to-br from-violet-500 to-purple-600',
                  'bg-gradient-to-br from-blue-500 to-indigo-600',
                ].map((bg, i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-white ${bg} flex items-center justify-center text-white text-sm font-bold shadow-md`}
                  >
                    {['S', 'M', 'A'][i]}
                  </div>
                ))}
              </div>
              <p className="text-base sm:text-lg text-[#4c669a]">
                Joined by <span className="font-semibold text-[#0d121b]">10,000+</span> students
              </p>
            </div>
          </div>

          {/* Right: Hero Image - MUCH LARGER */}
          <div className="flex-1 w-full lg:w-[60%] xl:w-[65%]">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/15">
              <Image
                src="/hero-students.png"
                alt="Students studying together"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 700px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
