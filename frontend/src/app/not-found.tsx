'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, BookOpen, Code, FileText, GraduationCap } from 'lucide-react';

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/materials?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const popularSections = [
    {
      title: 'Lecture Notes',
      icon: FileText,
      color: 'blue',
      href: '/materials?category=lecture_note',
    },
    {
      title: 'Past Questions',
      icon: GraduationCap,
      color: 'purple',
      href: '/materials?category=previous_question',
    },
    {
      title: 'Assignments',
      icon: BookOpen,
      color: 'orange',
      href: '/materials?category=assignment',
    },
    {
      title: 'Lab Manuals',
      icon: Code,
      color: 'emerald',
      href: '/materials?category=lab_manual',
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; hover: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'group-hover:bg-blue-600 group-hover:text-white' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', hover: 'group-hover:bg-purple-600 group-hover:text-white' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', hover: 'group-hover:bg-orange-600 group-hover:text-white' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'group-hover:bg-emerald-600 group-hover:text-white' },
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8] flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Study Hub"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <h2 className="text-lg font-bold tracking-tight text-gray-900">Study Hub</h2>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Home</Link>
              <Link href="/materials" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Materials</Link>
              <Link href="/questions" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Q&A</Link>
              <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">About</Link>
            </nav>
            <Link
              href="/"
              className="hidden md:flex items-center justify-center h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
            >
              Go Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl w-full mx-auto relative z-10">
          {/* 404 Content */}
          <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left: Text Content */}
            <div className="flex flex-col gap-6 flex-1 w-full text-center lg:text-left">
              <div className="space-y-4">
                <h1 className="text-[100px] md:text-[120px] leading-none font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-400 to-gray-200 tracking-tighter select-none">
                  404
                </h1>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Page Not Found
                </h2>
                <p className="text-gray-600 text-base md:text-lg max-w-lg mx-auto lg:mx-0">
                  Looks like you&apos;ve wandered off the syllabus. The study material you&apos;re looking for might have been moved, deleted, or never existed.
                </p>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="w-full max-w-md mx-auto lg:mx-0 mt-4">
                <label className="relative flex items-center group">
                  <span className="absolute left-4 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Search className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-12 pr-28 rounded-xl bg-white border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-gray-900 placeholder-gray-400 transition-all outline-none"
                    placeholder="Try searching for materials..."
                  />
                  <button
                    type="submit"
                    className="absolute right-2 h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors"
                  >
                    Search
                  </button>
                </label>
              </form>

              {/* Return Home Link */}
              <div className="pt-4 flex justify-center lg:justify-start">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline underline-offset-4 decoration-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Homepage
                </Link>
              </div>
            </div>

            {/* Right: Illustration */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="relative w-full aspect-square max-w-[400px]">
                <Image
                  src="/404-illustration.png"
                  alt="Page not found illustration"
                  fill
                  className="object-contain rounded-2xl"
                  priority
                />
                {/* Floating Card */}
                <div className="absolute -bottom-4 -left-4 p-4 bg-white border border-gray-200 rounded-xl shadow-xl hidden sm:flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="p-2 bg-red-100 rounded-lg text-red-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Error Code</div>
                    <div className="text-sm font-mono font-bold text-gray-900">PAGE_NOT_FOUND</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-16 mb-8 border-t border-gray-200" />

          {/* Popular Sections */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Popular Study Sections</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularSections.map((section) => {
                const colors = colorClasses[section.color];
                return (
                  <Link
                    key={section.title}
                    href={section.href}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all duration-300"
                  >
                    <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${colors.bg} ${colors.text} ${colors.hover} transition-colors`}>
                      <section.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{section.title}</h4>
                      <p className="text-xs text-gray-500">Browse materials</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Study Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}
