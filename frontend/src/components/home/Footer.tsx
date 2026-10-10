'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Mail } from 'lucide-react';

const platformLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Browse Library', href: '/#materials-section' },
    { label: 'Upload Material', href: '#' },
    { label: 'Q&A Forum', href: '/questions' },
    { label: 'Schedules', href: '/schedules' },
];

const resourceLinks = [
    { label: 'Help Center', href: '#' },
    { label: 'Community Guidelines', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Privacy Policy', href: '#' },
];

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#f6f6f8] border-t border-[#e7ebf3] pt-16 pb-8">
            <div className="section-container">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand Column */}
                    <div className="col-span-2 flex flex-col gap-4 pr-8">
                        <Link href="/" className="flex items-center gap-3 text-[#0d121b]">
                            <div className="w-8 h-8 rounded-lg overflow-hidden">
                                <Image
                                    src="/logo.png"
                                    alt="Study Hub Logo"
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <h2 className="text-[#0d121b] text-lg font-bold">Study Hub</h2>
                        </Link>
                        <p className="text-[#4c669a] text-sm leading-relaxed max-w-xs">
                            Making education accessible and collaborative. Share knowledge, learn faster, grow together.
                        </p>
                        <div className="flex gap-4 mt-2">
                            <a href="#" className="text-gray-400 hover:text-[#135bec] transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-[#135bec] transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-[#135bec] transition-colors">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Platform Links */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-[#0d121b] font-bold mb-1">Platform</h3>
                        {platformLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-[#4c669a] hover:text-[#135bec] text-sm transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Resources Links */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-[#0d121b] font-bold mb-1">Resources</h3>
                        {resourceLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-[#4c669a] hover:text-[#135bec] text-sm transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Copyright Bar */}
                <div className="pt-8 border-t border-[#e7ebf3] flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[#9aaac8] text-sm">
                        © {currentYear} Study Hub. All rights reserved.
                    </p>
                    <span className="text-[#9aaac8] text-sm">Share Knowledge, Grow Together</span>
                </div>
            </div>
        </footer>
    );
}
