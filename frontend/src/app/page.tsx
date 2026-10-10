'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';
import { downloadFile } from '@/lib/utils';
import { useMaterials } from '@/hooks/useMaterials';
import { useFilters } from '@/hooks/useFilters';
import AuthModal from '@/components/AuthModal';
import UploadModal from '@/components/UploadModal';
import Toast, { ToastType } from '@/components/Toast';
import {
  Navigation,
  HeroSection,
  StatsStrip,
  FeaturesSection,
  MaterialFilters,
  MaterialGrid,
  CTABanner,
  Footer,
  GuestBanner,
  VerificationMessage,
} from '@/components/home';

export default function HomePage() {
  const { user } = useAuthStore();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const {
    filters,
    filterOptions,
    filterOptionsLoading,
    handleFilterChange,
    clearFilters,
    getFilteredTerms,
    getFilteredCourseCodes,
    activeFiltersCount,
    loadFilterOptions
  } = useFilters();

  const { materials, loading, loadMaterials, pagination, goToPage } = useMaterials(filters, searchQuery);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  // Reload filter options when user login state changes
  useEffect(() => {
    loadFilterOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle email verification redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const accessToken = urlParams.get('access_token');

    if (type === 'signup' || (accessToken && urlParams.get('token_type'))) {
      setVerificationMessage('Email verified successfully! Welcome to Study Hub.');
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      setTimeout(() => {
        setVerificationMessage(null);
      }, 5000);
    }
  }, []);

  // Auto-search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFilterChange('search', searchQuery);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleDownload = async (materialId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      setDownloading(materialId);

      // Track view in history
      apiClient.trackView(materialId).catch(() => { });

      const response = await apiClient.downloadMaterial(materialId);
      if (response.success && response.data) {
        downloadFile(response.data.downloadUrl, response.data.fileName || 'download');
      } else {
        throw new Error('Download URL not available');
      }

    } catch (error) {
      console.error('Download failed:', error);

      if (error instanceof Error) {
        if (error.message.includes('Unauthorized') || error.message.includes('401')) {
          setShowAuthModal(true);
          return;
        }
        alert(error.message);
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      setDownloading(null);
    }
  };

  const handleClearFilters = () => {
    clearFilters();
    setSearchQuery('');
  };

  return (
    <div className="relative min-h-screen bg-[#f6f6f8] overflow-x-hidden">
      <Navigation onAuthModalOpen={() => setShowAuthModal(true)} />

      <main className="flex-1">
        {/* Email Verification Success Message */}
        {verificationMessage && (
          <VerificationMessage
            message={verificationMessage}
            onClose={() => setVerificationMessage(null)}
          />
        )}

        {/* Hero Section */}
        <HeroSection
          onAuthModalOpen={() => setShowAuthModal(true)}
          onUploadModalOpen={() => setShowUploadModal(true)}
        />

        {/* Stats Strip */}
        <StatsStrip />

        {/* Features Section */}
        <FeaturesSection />

        {/* Materials Section */}
        <div id="materials-section" className="bg-[#f6f6f8] py-12">
          <div className="section-container">

            {/* Guest Info Banner */}
            {!user && (
              <GuestBanner onAuthModalOpen={() => setShowAuthModal(true)} />
            )}

            {/* Search and Filters */}
            <MaterialFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filters={filters}
              filterOptions={filterOptions}
              filterOptionsLoading={filterOptionsLoading}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              getFilteredTerms={getFilteredTerms}
              getFilteredCourseCodes={getFilteredCourseCodes}
              activeFiltersCount={activeFiltersCount}
            />

            {/* Materials Grid */}
            <MaterialGrid
              materials={materials}
              loading={loading}
              downloading={downloading}
              onDownload={handleDownload}
              onAuthModalOpen={() => setShowAuthModal(true)}
              onUploadModalOpen={() => setShowUploadModal(true)}
              onClearFilters={handleClearFilters}
              hasActiveFilters={activeFiltersCount > 0}
              searchQuery={searchQuery}
              pagination={pagination}
              onPageChange={goToPage}
            />
          </div>
        </div>

        {/* CTA Banner */}
        <CTABanner onAuthModalOpen={() => setShowAuthModal(true)} />

        {/* Footer */}
        <Footer />
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          showToast('Material uploaded successfully! It will be reviewed by admins.', 'success');
          loadMaterials();
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
