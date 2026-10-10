'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Menu, UserPlus, User, BookOpen, Clock,
  Bookmark, FolderOpen, Calendar, X, ChevronRight, Upload,
  Info, MessageCircle, ChevronDown, LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { isAdminUser } from '@/lib/utils';
import NotificationBell from '@/components/NotificationBell';

interface NavigationProps {
  onAuthModalOpen?: () => void;
}

export default function Navigation({ onAuthModalOpen }: NavigationProps) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMobileMenu]);

  // Primary navigation items (always visible - for public and logged-in users)
  const primaryNavItems = [
    { href: '/about', icon: Info, label: 'About Us' },
    { href: '/materials', icon: BookOpen, label: 'Materials' },
  ];

  // Secondary navigation items (visible when logged in)
  const secondaryNavItems = [
    { href: '/questions', icon: MessageCircle, label: 'Q&A' },
    { href: '/upload', icon: Upload, label: 'Upload' },
    { href: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
    { href: '/history', icon: Clock, label: 'History' },
    { href: '/collections', icon: FolderOpen, label: 'Collections' },
    { href: '/schedules', icon: Calendar, label: 'Schedules' },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  return (
    <>
      <header
        className={`
          sticky top-0 z-50 w-full transition-all duration-300
          ${scrolled
            ? 'bg-[#0d121b]/95 backdrop-blur-md shadow-xl'
            : 'bg-gradient-to-r from-[#0d121b] via-[#1a2138] to-[#0d1a3a]'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-105 overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="Study Hub Logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-white">
                  Study Hub
                </h1>
              </div>
            </Link>

            {user ? (
              <>
                {/* Desktop Navigation - Logged In */}
                <nav className="hidden lg:flex items-center">
                  {/* Nav Container with subtle background */}
                  <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1.5 border border-white/10">
                    {allNavItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`
                            relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                            ${isActive
                              ? 'text-white bg-gradient-to-r from-[#135bec] to-[#0d4ac7] shadow-md shadow-blue-500/25'
                              : 'text-gray-300 hover:text-white hover:bg-white/10'
                            }
                          `}
                        >
                          {item.label}
                        </Link>
                      );
                    })}

                    {isAdminUser(user.role) && (
                      <Link
                        href="/admin"
                        className={`
                          px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                          ${pathname?.startsWith('/admin')
                            ? 'text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-500/25'
                            : 'text-purple-300 hover:bg-purple-500/20'
                          }
                        `}
                      >
                        {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </Link>
                    )}
                  </div>
                </nav>

                {/* Tablet Navigation - Logged In */}
                <nav className="hidden md:flex lg:hidden items-center gap-1">
                  {allNavItems.slice(0, 5).map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${isActive
                            ? 'text-white bg-blue-600'
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                          }
                        `}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                {/* Right Section */}
                <div className="flex items-center gap-2">
                  <NotificationBell />

                  {/* Profile */}
                  <Link
                    href="/profile"
                    className={`
                      hidden sm:flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200
                      ${pathname === '/profile'
                        ? 'bg-white/20 ring-2 ring-blue-400'
                        : 'hover:bg-white/10'
                      }
                    `}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-[#135bec] to-[#0d4ac7] rounded-full flex items-center justify-center shadow-md shadow-blue-500/20">
                      <span className="text-white text-xs font-bold">
                        {user.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden lg:block text-sm font-medium text-white">
                      {user.full_name.split(' ')[0]}
                    </span>
                  </Link>

                  {/* Logout Button */}
                  <button
                    onClick={logout}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
                    aria-label="Menu"
                  >
                    {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </>
            ) : (
              /* Guest Navigation */
              <>
                {/* Desktop Navigation for Guests */}
                <nav className="hidden md:flex items-center">
                  <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1.5 border border-white/10">
                    {primaryNavItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`
                            px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                            ${isActive
                              ? 'text-white bg-gradient-to-r from-[#135bec] to-[#0d4ac7] shadow-md'
                              : 'text-gray-300 hover:text-white hover:bg-white/10'
                            }
                          `}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </nav>

                {/* Auth Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onAuthModalOpen?.()}
                    className="hidden sm:block px-4 py-2 text-sm text-gray-300 hover:text-white font-medium transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => onAuthModalOpen?.()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#135bec] to-[#0d4ac7] hover:from-[#0d4ac7] hover:to-[#0a3a9e] text-white text-sm font-semibold rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Get Started</span>
                  </button>
                  {/* Mobile Menu Button for Guests */}
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
                    aria-label="Menu"
                  >
                    {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation - Logged In */}
      {showMobileMenu && user && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />

          <div className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-gradient-to-b from-white to-gray-50 z-50 md:hidden shadow-2xl overflow-hidden animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#135bec] to-[#0d4ac7] rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-white text-lg font-bold">
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <span className="text-sm font-medium text-gray-700">Notifications</span>
              <NotificationBell />
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
              {allNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200
                    ${pathname === item.href
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                      : 'hover:bg-white hover:shadow-sm text-gray-700'
                    }
                  `}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${pathname === item.href ? 'text-white' : 'text-gray-400'}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${pathname === item.href ? 'text-white/70' : 'text-gray-400'}`} />
                </Link>
              ))}

              {isAdminUser(user.role) && (
                <>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4" />
                  <Link
                    href="/admin"
                    className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 transition-all"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <span className="font-medium text-sm">
                      {user.role === 'super_admin' ? 'Super Admin Panel' : 'Admin Panel'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                  </Link>
                </>
              )}

              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4" />

              <Link
                href="/profile"
                className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 text-gray-700 transition-all"
                onClick={() => setShowMobileMenu(false)}
              >
                <span className="font-medium text-sm">My Profile</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors mb-3"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium text-sm">Logout</span>
              </button>
              <p className="text-center text-xs text-gray-400">
                Study Hub • Share Knowledge
              </p>
            </div>
          </div>
        </>
      )}

      {/* Mobile Navigation - Guest */}
      {showMobileMenu && !user && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />

          <div className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-gradient-to-b from-white to-gray-50 z-50 md:hidden shadow-2xl overflow-hidden animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="Study Hub Logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="text-lg font-bold text-gray-900">Study Hub</h1>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-1">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200
                    ${pathname === item.href
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                      : 'hover:bg-white hover:shadow-sm text-gray-700'
                    }
                  `}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${pathname === item.href ? 'text-white' : 'text-gray-400'}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${pathname === item.href ? 'text-white/70' : 'text-gray-400'}`} />
                </Link>
              ))}
            </div>

            {/* Auth Section */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  onAuthModalOpen?.();
                }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#135bec] to-[#0d4ac7] text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 mb-3"
              >
                <UserPlus className="w-4 h-4" />
                <span>Get Started</span>
              </button>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  onAuthModalOpen?.();
                }}
                className="w-full px-5 py-3 text-gray-600 hover:text-gray-900 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Sign In
              </button>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
              <p className="text-center text-xs text-gray-400">
                Study Hub • Share Knowledge
              </p>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
