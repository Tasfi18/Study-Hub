'use client';

import React, { useState, useEffect } from 'react';
import { X, GraduationCap } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import Image from 'next/image';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = 'login'
}) => {
  const [currentView, setCurrentView] = useState<'login' | 'register'>(initialView);

  // Reset view when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentView(initialView);
    }
  }, [isOpen, initialView]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSuccess = () => {
    onClose();
  };

  const handleSwitchView = () => {
    setCurrentView(currentView === 'login' ? 'register' : 'login');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container - Full Screen on Mobile, Centered on Desktop */}
      <div className="relative flex w-full h-full lg:items-center lg:justify-center lg:p-8">
        <div className="relative flex w-full h-full lg:h-auto lg:max-h-[90vh] lg:max-w-5xl lg:rounded-2xl overflow-hidden bg-white shadow-2xl">

          {/* Left Side - Hero Image (Hidden on Mobile) */}
          <div className="hidden lg:flex lg:w-1/2 relative">
            <Image
              src="/login-hero.png"
              alt="Students studying in library"
              fill
              className="object-cover"
              priority
            />
            {/* Blue Overlay */}
            <div className="absolute inset-0 bg-[#135bec]/40" />

            {/* Content Over Image */}
            <div className="relative z-10 flex flex-col justify-between p-10 h-full">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-[#135bec]" />
                </div>
                <h2 className="text-lg font-bold text-white">Study Hub</h2>
              </div>

              {/* Hero Text */}
              <div className="max-w-md">
                <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
                  Empowering the next generation of scholars.
                </h1>
                <p className="text-lg text-white/90">
                  Discover study materials, notes, and guides shared by students from Khulna University.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-[#f6f6f8] lg:bg-white">
            {/* Mobile Header */}
            <div className="lg:hidden sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#135bec] rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-bold text-[#0d121b]">Study Hub</h2>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Desktop Close Button */}
            <button
              onClick={onClose}
              className="hidden lg:flex absolute top-4 right-4 z-10 w-10 h-10 rounded-lg bg-gray-100 items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* Form Container */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
              <div className="w-full max-w-[400px]">
                {currentView === 'login' ? (
                  <LoginForm
                    onSuccess={handleSuccess}
                    onSwitchToRegister={handleSwitchView}
                  />
                ) : (
                  <RegisterForm
                    onSuccess={handleSuccess}
                    onSwitchToLogin={handleSwitchView}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;