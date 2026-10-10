'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
    Rocket, Lightbulb, Users, FileText, Star,
    GraduationCap, Globe, UserPlus, Mail, MapPin, Send
} from 'lucide-react';
import Navigation from '@/components/home/Navigation';

interface Stats {
    totalMaterials: number;
    activeUsers: number;
    totalDownloads: number;
    totalDisciplines: number;
    averageRating: number;
}

export default function AboutPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<Stats | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        message: ''
    });
    const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    useEffect(() => {
        const loadStats = async () => {
            try {
                const response = await apiClient.getStats();
                if (response.success && response.data) {
                    setStats(response.data);
                }
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        };
        loadStats();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('sending');

        // Simulate form submission (replace with actual API call)
        setTimeout(() => {
            setFormStatus('sent');
            setFormData({ firstName: '', lastName: '', email: '', message: '' });
            setTimeout(() => setFormStatus('idle'), 3000);
        }, 1000);
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k+';
        }
        return num.toString() + '+';
    };

    return (
        <div className="min-h-screen bg-[#f6f6f8]">
            <Navigation />
            <main className="flex-grow flex flex-col items-center">
                {/* Hero Section */}
                <section className="w-full px-4 py-12 md:py-20 lg:px-40 flex justify-center bg-white">
                    <div className="w-full max-w-5xl">
                        <div className="flex flex-col-reverse gap-8 lg:flex-row lg:items-center">
                            <div className="flex flex-col gap-6 lg:w-1/2 justify-center">
                                <div className="flex flex-col gap-4 text-left">
                                    <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] md:text-5xl lg:text-6xl text-[#111218]">
                                        Sharing Knowledge, <br />
                                        <span className="text-[#2b4bee]">Shaping Futures</span>
                                    </h1>
                                    <h2 className="text-base md:text-lg text-[#616889] font-normal leading-relaxed">
                                        We are on a mission to empower students everywhere to access, share, and collaborate on high-quality educational resources.
                                    </h2>
                                </div>
                                <div className="flex gap-3">
                                    <Link
                                        href={user ? "/materials" : "/?auth=signin"}
                                        className="flex items-center justify-center rounded-lg h-12 px-6 bg-[#2b4bee] text-white text-base font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-[#2b4bee]/25"
                                    >
                                        Join the Community
                                    </Link>
                                </div>
                            </div>
                            <div className="w-full lg:w-1/2 aspect-video lg:aspect-square rounded-xl shadow-lg overflow-hidden">
                                <Image
                                    src="/about-hero.png"
                                    alt="Students learning together"
                                    width={600}
                                    height={600}
                                    className="w-full h-full object-cover"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mission & Vision Section */}
                <section className="w-full px-4 py-16 lg:px-40 flex justify-center bg-[#f6f6f8]">
                    <div className="w-full max-w-5xl flex flex-col gap-10">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="px-3 py-1 rounded-full bg-[#2b4bee]/10 text-[#2b4bee] text-xs font-bold uppercase tracking-wider">
                                Who We Are
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-[#111218] max-w-2xl">
                                Our Purpose
                            </h2>
                            <p className="text-[#616889] text-base md:text-lg max-w-2xl">
                                We believe education should be collaborative and accessible, breaking down the barriers between students globally.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Mission Card */}
                            <div className="flex flex-col gap-4 rounded-xl border border-[#dbdde6] bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                                <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center text-[#2b4bee] mb-2">
                                    <Rocket className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[#111218]">Our Mission</h3>
                                <p className="text-[#616889] leading-relaxed">
                                    To democratize access to high-quality study materials for every student, regardless of their location, background, or institution. We bridge the gap between those who know and those who want to learn.
                                </p>
                            </div>
                            {/* Vision Card */}
                            <div className="flex flex-col gap-4 rounded-xl border border-[#dbdde6] bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                                <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center text-[#2b4bee] mb-2">
                                    <Lightbulb className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[#111218]">Our Vision</h3>
                                <p className="text-[#616889] leading-relaxed">
                                    A world where education is completely barrier-free. We envision a global classroom where collaboration is the norm, and every student has the tools they need to succeed at their fingertips.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="w-full px-4 py-12 flex justify-center bg-[#2b4bee] text-white">
                    <div className="w-full max-w-5xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/20">
                            <div className="flex flex-col gap-2 p-4 items-center">
                                <Users className="w-10 h-10 mb-2 text-white/80" />
                                <p className="text-4xl md:text-5xl font-black tracking-tight">
                                    {stats ? formatNumber(stats.activeUsers) : '...'}
                                </p>
                                <p className="text-sm md:text-base font-medium opacity-90">Active Students</p>
                            </div>
                            <div className="flex flex-col gap-2 p-4 items-center">
                                <FileText className="w-10 h-10 mb-2 text-white/80" />
                                <p className="text-4xl md:text-5xl font-black tracking-tight">
                                    {stats ? formatNumber(stats.totalMaterials) : '...'}
                                </p>
                                <p className="text-sm md:text-base font-medium opacity-90">Documents Shared</p>
                            </div>
                            <div className="flex flex-col gap-2 p-4 items-center">
                                <Star className="w-10 h-10 mb-2 text-white/80" />
                                <p className="text-4xl md:text-5xl font-black tracking-tight">
                                    {stats ? `${stats.averageRating.toFixed(1)}/5` : '...'}
                                </p>
                                <p className="text-sm md:text-base font-medium opacity-90">Average Rating</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Timeline Section */}
                <section className="w-full px-4 py-16 lg:px-40 flex justify-center bg-white">
                    <div className="w-full max-w-4xl flex flex-col gap-10">
                        <div className="text-center mb-4">
                            <h2 className="text-3xl font-bold text-[#111218]">Our Journey</h2>
                            <p className="text-[#616889] mt-2">From an idea to a growing community.</p>
                        </div>
                        <div className="grid grid-cols-[60px_1fr] gap-x-6 px-4">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center gap-1 pt-2">
                                <div className="size-10 rounded-full bg-[#f0f1f4] flex items-center justify-center text-[#111218] shadow-sm z-10">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <div className="w-[2px] bg-[#e5e7eb] h-full grow min-h-[80px]"></div>
                            </div>
                            <div className="flex flex-1 flex-col pb-10 pt-2">
                                <div className="flex flex-col md:flex-row md:items-baseline gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-[#111218]">Platform Created</h3>
                                    <span className="text-sm font-medium px-2 py-0.5 rounded-md bg-blue-50 text-[#2b4bee]">2024</span>
                                </div>
                                <p className="text-[#616889] text-base leading-relaxed">
                                    Started as a simple idea to help students share study materials within their department. Built the first version to help classmates swap study guides and notes.
                                </p>
                            </div>
                            {/* Step 2 */}
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-[2px] bg-[#e5e7eb] h-2"></div>
                                <div className="size-10 rounded-full bg-[#f0f1f4] flex items-center justify-center text-[#111218] shadow-sm z-10">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div className="w-[2px] bg-[#e5e7eb] h-full grow min-h-[80px]"></div>
                            </div>
                            <div className="flex flex-1 flex-col pb-10 pt-1">
                                <div className="flex flex-col md:flex-row md:items-baseline gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-[#111218]">Growing Community</h3>
                                    <span className="text-sm font-medium px-2 py-0.5 rounded-md bg-blue-50 text-[#2b4bee]">Present</span>
                                </div>
                                <p className="text-[#616889] text-base leading-relaxed">
                                    Word spread across departments and the community grew. Students love the ease of access, and our platform now serves {stats ? formatNumber(stats.activeUsers) : 'many'} active learners.
                                </p>
                            </div>
                            {/* Step 3 */}
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-[2px] bg-[#e5e7eb] h-2"></div>
                                <div className="size-10 rounded-full bg-[#2b4bee] text-white shadow-md z-10 flex items-center justify-center">
                                    <Globe className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex flex-1 flex-col pt-1">
                                <div className="flex flex-col md:flex-row md:items-baseline gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-[#111218]">The Future</h3>
                                    <span className="text-sm font-medium px-2 py-0.5 rounded-md bg-blue-50 text-[#2b4bee]">Coming Soon</span>
                                </div>
                                <p className="text-[#616889] text-base leading-relaxed">
                                    Expanding to more disciplines, adding new features, and building a truly collaborative learning environment for all students.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section className="w-full px-4 py-16 lg:px-40 flex justify-center bg-[#f6f6f8]" id="contact">
                    <div className="w-full max-w-5xl">
                        <div className="flex flex-col lg:flex-row gap-8 bg-white rounded-2xl overflow-hidden shadow-sm border border-[#dbdde6]">
                            {/* Contact Info */}
                            <div className="flex flex-col justify-center p-8 lg:p-12 lg:w-2/5 bg-[#2b4bee] text-white">
                                <h2 className="text-3xl font-bold mb-6">Get in touch</h2>
                                <p className="text-white/80 mb-8 leading-relaxed">
                                    Have questions about the platform? Want to suggest a feature? We&apos;d love to hear from you.
                                </p>
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-start gap-4">
                                        <Mail className="w-5 h-5 mt-1" />
                                        <div>
                                            <h3 className="font-bold">Email Us</h3>
                                            <p className="text-white/80 text-sm">support@studyshare.com</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <MapPin className="w-5 h-5 mt-1" />
                                        <div>
                                            <h3 className="font-bold">Our Campus</h3>
                                            <p className="text-white/80 text-sm">Khulna University,<br />Khulna, Bangladesh</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Contact Form */}
                            <div className="flex flex-col p-8 lg:p-12 lg:w-3/5">
                                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium text-[#111218]" htmlFor="first-name">First Name</label>
                                            <input
                                                className="h-11 rounded-lg border border-[#dbdde6] bg-transparent px-4 text-[#111218] placeholder-[#616889] focus:border-[#2b4bee] focus:ring-1 focus:ring-[#2b4bee] outline-none transition-all"
                                                id="first-name"
                                                placeholder="Your name"
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium text-[#111218]" htmlFor="last-name">Last Name</label>
                                            <input
                                                className="h-11 rounded-lg border border-[#dbdde6] bg-transparent px-4 text-[#111218] placeholder-[#616889] focus:border-[#2b4bee] focus:ring-1 focus:ring-[#2b4bee] outline-none transition-all"
                                                id="last-name"
                                                placeholder="Your surname"
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-[#111218]" htmlFor="email">Email Address</label>
                                        <input
                                            className="h-11 rounded-lg border border-[#dbdde6] bg-transparent px-4 text-[#111218] placeholder-[#616889] focus:border-[#2b4bee] focus:ring-1 focus:ring-[#2b4bee] outline-none transition-all"
                                            id="email"
                                            placeholder="you@example.com"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-[#111218]" htmlFor="message">Message</label>
                                        <textarea
                                            className="rounded-lg border border-[#dbdde6] bg-transparent p-4 text-[#111218] placeholder-[#616889] focus:border-[#2b4bee] focus:ring-1 focus:ring-[#2b4bee] outline-none transition-all resize-none"
                                            id="message"
                                            placeholder="How can we help you?"
                                            rows={4}
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={formStatus === 'sending'}
                                        className="mt-2 h-11 w-full md:w-auto self-start rounded-lg bg-[#2b4bee] px-8 text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {formStatus === 'sending' ? 'Sending...' : formStatus === 'sent' ? 'Message Sent!' : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
