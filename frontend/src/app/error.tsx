'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Headphones, ExternalLink } from 'lucide-react';

interface ErrorProps {
    error?: Error;
    reset?: () => void;
}

export default function Error({ reset }: ErrorProps) {
    // Generate a random error reference
    const errorRef = `ERR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

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
                        <div className="flex gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="hidden md:flex items-center justify-center h-10 px-5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-bold transition-all"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex items-center justify-center relative overflow-hidden px-4 py-12 lg:py-20">
                {/* Ambient Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-blue-500/10 blur-[100px] md:blur-[120px] rounded-full pointer-events-none z-0" />

                <div className="relative z-10 flex flex-col items-center max-w-2xl w-full text-center gap-8 md:gap-10">
                    {/* Hero Graphic Container */}
                    <div className="relative w-full flex flex-col items-center justify-center">
                        {/* Abstract Visual Layer */}
                        <div className="relative w-56 h-56 md:w-72 md:h-72 mb-4">
                            <Image
                                src="/500-illustration.png"
                                alt="Server error illustration"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        {/* Large Typography Overlay */}
                        <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[100px] md:text-[160px] font-black tracking-tighter text-gray-200 leading-none select-none opacity-50">
                            500
                        </h1>
                    </div>

                    {/* Error Message Content */}
                    <div className="flex flex-col items-center gap-5 -mt-8 md:-mt-12 relative z-20">
                        <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">
                            Internal Server Error
                        </h2>
                        <p className="text-gray-600 text-base md:text-lg max-w-lg leading-relaxed">
                            Something went wrong on our end. Don&apos;t worry, your study notes are safe. We&apos;ve been notified and are working on a fix.
                        </p>

                        {/* Error Reference Pill */}
                        <div className="mt-2 inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-mono tracking-wide">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                            </span>
                            Error Ref: #{errorRef}
                        </div>
                    </div>

                    {/* Action Buttons Group */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-6">
                        {reset ? (
                            <button
                                onClick={reset}
                                className="group relative flex items-center justify-center gap-2 h-12 px-8 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 min-w-[200px] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform relative z-10" />
                                <span className="relative z-10">Try Again</span>
                            </button>
                        ) : (
                            <Link
                                href="/"
                                className="group relative flex items-center justify-center gap-2 h-12 px-8 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 min-w-[200px] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform relative z-10" />
                                <span className="relative z-10">Return to Home</span>
                            </Link>
                        )}
                        <Link
                            href="mailto:support@studyhub.com"
                            className="group flex items-center justify-center gap-2 h-12 px-8 rounded-lg bg-white border border-gray-200 text-gray-900 text-sm font-bold hover:bg-gray-50 transition-all min-w-[200px] shadow-sm hover:shadow-md"
                        >
                            <Headphones className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                            <span>Contact Support</span>
                        </Link>
                    </div>

                    {/* Additional Quick Links */}
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8 opacity-80">
                        <a
                            href="https://status.studyhub.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            System Status
                        </a>
                        <span className="hidden sm:inline text-gray-300">•</span>
                        <Link
                            href="/about"
                            className="group flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
                        >
                            Help Center
                            <ExternalLink className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Link>
                        <span className="hidden sm:inline text-gray-300">•</span>
                        <a
                            href="mailto:bugs@studyhub.com"
                            className="group flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
                        >
                            Report Issue
                            <ExternalLink className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </a>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white py-8">
                <div className="max-w-7xl mx-auto px-4 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-gray-500 text-sm font-medium">
                        © {new Date().getFullYear()} Study Hub. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="/about" className="text-gray-400 hover:text-blue-600 transition-colors text-sm">
                            About Us
                        </Link>
                        <Link href="/materials" className="text-gray-400 hover:text-blue-600 transition-colors text-sm">
                            Materials
                        </Link>
                        <Link href="/" className="text-gray-400 hover:text-blue-600 transition-colors text-sm">
                            Home
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
