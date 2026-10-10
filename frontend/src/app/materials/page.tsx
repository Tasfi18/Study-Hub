'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Material, MaterialCategory } from '@/types';
import { apiClient } from '@/lib/api';
import { formatRelativeTime, getCategoryDisplayName, getInitials, downloadFile } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Grid3X3, List, Star, Download, Filter, X } from 'lucide-react';
import Navigation from '@/components/home/Navigation';
import BookmarkButton from '@/components/BookmarkButton';
import AuthModal from '@/components/AuthModal';

// Get category image
function getCategoryImage(category: string): string {
    switch (category) {
        case 'previous_question':
        case 'ct_question':
        case 'final_question':
            return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop&q=80';
        case 'assignment':
            return 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=250&fit=crop&q=80';
        case 'lecture_note':
            return 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400&h=250&fit=crop&q=80';
        case 'lab_manual':
            return 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=250&fit=crop&q=80';
        case 'book':
            return 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop&q=80';
        default:
            return 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=250&fit=crop&q=80';
    }
}

// Avatar color
function getAvatarColor(name: string): string {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
}

type SortOption = 'relevance' | 'newest' | 'downloads' | 'rating';

export default function MaterialsPage() {
    const { user } = useAuthStore();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [terms, setTerms] = useState<Array<{ id: string; term: string }>>([]);
    const [allCourses, setAllCourses] = useState<Array<{ id: string; code: string; title: string }>>([]);
    const [disciplines, setDisciplines] = useState<Array<{ id: string; name: string }>>([]);
    const [selectedDiscipline, setSelectedDiscipline] = useState<string>('');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('relevance');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    // Filter courses based on selected terms
    // Term format is "year:semester" (e.g., "4:1" means 4th year, 1st semester)
    // Course codes follow pattern: "CSE XYYZ" where X=year, Y=semester (e.g., "CSE 4201" = 4th year, 2nd semester)
    // So term "4:1" should match courses like "CSE 41XX", term "3:2" should match "CSE 32XX"
    const filteredCourses = useMemo(() => {
        if (selectedTerms.length === 0) {
            return allCourses; // Show all courses if no term selected
        }

        // Get all selected terms and build patterns for each
        const selectedTermObjects = terms.filter(t => selectedTerms.includes(t.id));
        if (selectedTermObjects.length === 0) {
            return allCourses;
        }

        // Build set of valid patterns from all selected terms (e.g., ["41", "32"])
        const validPatterns = new Set<string>();
        selectedTermObjects.forEach(term => {
            const [year, semester] = term.term.split(':');
            if (year && semester) {
                validPatterns.add(`${year}${semester}`);
            }
        });

        // If no valid patterns were created, return all courses
        if (validPatterns.size === 0) {
            return allCourses;
        }

        // Filter courses where the first two digits match any of the valid patterns
        return allCourses.filter(course => {
            // Extract first two digits from course code (e.g., "CSE 4251" → "42", "BA 3101" → "31")
            const match = course.code.match(/\d{2}/);
            if (match) {
                const courseYearSemester = match[0]; // First two digits
                return validPatterns.has(courseYearSemester);
            }
            return false; // Exclude courses without the pattern when filters are active
        });
    }, [allCourses, selectedTerms, terms]);

    // Categories list
    const categories = [
        { id: 'lecture_note', label: 'Lecture Notes' },
        { id: 'previous_question', label: 'Past Questions' },
        { id: 'ct_question', label: 'CT Questions' },
        { id: 'final_question', label: 'Final Questions' },
        { id: 'assignment', label: 'Assignments' },
        { id: 'lab_manual', label: 'Lab Manuals' },
        { id: 'book', label: 'Books' },
        { id: 'thesis', label: 'Thesis' },
    ];

    // Dynamic trending searches (fetched from API)
    const [trendingSearches, setTrendingSearches] = useState<string[]>([]);

    useEffect(() => {
        loadMaterials();
    }, [page, selectedTerms, selectedCourses, selectedCategories, sortBy, selectedDiscipline]);

    useEffect(() => {
        loadFilterOptions();
        loadTrendingSearches();
    }, []);

    // Clear selected courses when term changes (since courses are now filtered)
    useEffect(() => {
        setSelectedCourses([]);
    }, [selectedTerms]);

    const loadFilterOptions = async () => {
        try {
            const response = await apiClient.getFilterOptions();
            if (response.success && response.data) {
                setTerms(response.data.terms || []);
                setAllCourses(response.data.courseCodes || []);
                setDisciplines(response.data.disciplines || []);
            }
        } catch (error) {
            console.error('Failed to load filter options:', error);
        }
    };

    const loadTrendingSearches = async () => {
        try {
            const response = await apiClient.getTrendingSearches();
            if (response.success && response.data) {
                setTrendingSearches(response.data);
            }
        } catch (error) {
            console.error('Failed to load trending searches:', error);
            // Fallback to default
            setTrendingSearches(['Lecture Notes', 'Past Questions', 'Assignments']);
        }
    };

    const loadMaterials = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getMaterials({
                page,
                limit: 12,
                term: selectedTerms.length === 1 ? selectedTerms[0] : undefined,
                courseCode: selectedCourses.length === 1 ? selectedCourses[0] : undefined,
                category: selectedCategories.length === 1 ? selectedCategories[0] as MaterialCategory : undefined,
                search: searchQuery || undefined,
                // For logged-in users, use their discipline; for guests, use selected discipline
                discipline: user ? user.discipline_id : (selectedDiscipline || undefined),
            });
            if (response.success && response.data) {
                setMaterials(response.data);
                setTotalPages(response.pagination?.totalPages || 1);
                setTotalResults(response.pagination?.total || response.data.length);
            }
        } catch (error) {
            console.error('Failed to load materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        loadMaterials();
    };

    const toggleTerm = (id: string) => {
        setSelectedTerms(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
        setPage(1);
    };

    const toggleCourse = (id: string) => {
        setSelectedCourses(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
        setPage(1);
    };

    const toggleCategory = (id: string) => {
        setSelectedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
        setPage(1);
    };

    const clearFilters = () => {
        setSelectedTerms([]);
        setSelectedCourses([]);
        setSelectedCategories([]);
        setSelectedDiscipline('');
        setSearchQuery('');
        setPage(1);
    };

    const activeFiltersCount = selectedTerms.length + selectedCourses.length + selectedCategories.length + (selectedDiscipline ? 1 : 0);

    return (
        <div className="min-h-screen bg-[#f6f6f8]">
            <Navigation />

            <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-6">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className={`w-full lg:w-64 shrink-0 flex flex-col gap-6 ${showMobileFilters ? 'block' : 'hidden lg:flex'}`}>
                        {/* Mobile Close Button */}
                        <div className="flex items-center justify-between lg:hidden">
                            <h2 className="text-lg font-bold text-[#111218]">Filters</h2>
                            <button onClick={() => setShowMobileFilters(false)} className="text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Desktop Header */}
                        <div className="hidden lg:flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-[#111218]">Filters</h2>
                            <button onClick={clearFilters} className="text-[#2b4bee] hover:text-blue-600 text-sm font-medium transition-colors">
                                Reset
                            </button>
                        </div>

                        {/* Discipline Filter - Only shown for guests (public users) */}
                        {/* Logged-in users automatically see their discipline's materials */}
                        {!user && (
                            <details className="group flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden" open>
                                <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors select-none">
                                    <p className="text-[#111218] text-sm font-semibold">Discipline / Department</p>
                                    <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-180" />
                                </summary>
                                <div className="p-4 flex flex-col gap-3 max-h-60 overflow-y-auto">
                                    <label className="flex items-center gap-3 cursor-pointer group/item">
                                        <input
                                            type="radio"
                                            name="discipline"
                                            checked={selectedDiscipline === ''}
                                            onChange={() => { setSelectedDiscipline(''); setPage(1); }}
                                            className="border-slate-300 text-[#2b4bee] focus:ring-[#2b4bee] h-4 w-4"
                                        />
                                        <span className="text-sm text-slate-600 group-hover/item:text-[#2b4bee] transition-colors">
                                            All Disciplines
                                        </span>
                                    </label>
                                    {disciplines.length > 0 ? disciplines.map((discipline) => (
                                        <label key={discipline.id} className="flex items-center gap-3 cursor-pointer group/item">
                                            <input
                                                type="radio"
                                                name="discipline"
                                                checked={selectedDiscipline === discipline.id}
                                                onChange={() => { setSelectedDiscipline(discipline.id); setPage(1); }}
                                                className="border-slate-300 text-[#2b4bee] focus:ring-[#2b4bee] h-4 w-4"
                                            />
                                            <span className="text-sm text-slate-600 group-hover/item:text-[#2b4bee] transition-colors truncate">
                                                {discipline.name}
                                            </span>
                                        </label>
                                    )) : (
                                        <p className="text-sm text-slate-400">No disciplines available</p>
                                    )}
                                </div>
                            </details>
                        )}

                        {/* Term / Semester Filter */}
                        <details className="group flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden" open>
                            <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors select-none">
                                <p className="text-[#111218] text-sm font-semibold">Term / Semester</p>
                                <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="p-4 flex flex-col gap-3 max-h-60 overflow-y-auto">
                                {terms.length > 0 ? terms.map((term) => (
                                    <label key={term.id} className="flex items-center gap-3 cursor-pointer group/item">
                                        <input
                                            type="checkbox"
                                            checked={selectedTerms.includes(term.id)}
                                            onChange={() => toggleTerm(term.id)}
                                            className="rounded border-slate-300 text-[#2b4bee] focus:ring-[#2b4bee] h-4 w-4"
                                        />
                                        <span className="text-sm text-slate-600 group-hover/item:text-[#2b4bee] transition-colors truncate">
                                            {term.term}
                                        </span>
                                    </label>
                                )) : (
                                    <p className="text-sm text-slate-400">No terms available</p>
                                )}
                            </div>
                        </details>

                        {/* Course Filter */}
                        <details className="group flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden" open>
                            <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors select-none">
                                <p className="text-[#111218] text-sm font-semibold">Course</p>
                                <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="p-4 flex flex-col gap-3 max-h-60 overflow-y-auto">
                                {filteredCourses.length > 0 ? filteredCourses.slice(0, 15).map((course) => (
                                    <label key={course.id} className="flex items-center gap-3 cursor-pointer group/item">
                                        <input
                                            type="checkbox"
                                            checked={selectedCourses.includes(course.id)}
                                            onChange={() => toggleCourse(course.id)}
                                            className="rounded border-slate-300 text-[#2b4bee] focus:ring-[#2b4bee] h-4 w-4"
                                        />
                                        <span className="text-sm text-slate-600 group-hover/item:text-[#2b4bee] transition-colors truncate" title={course.title}>
                                            {course.code} - {course.title}
                                        </span>
                                    </label>
                                )) : (
                                    <p className="text-sm text-slate-400">
                                        {selectedTerms.length > 0 ? 'No courses for selected term' : 'No courses available'}
                                    </p>
                                )}
                            </div>
                        </details>

                        {/* Material Type Filter */}
                        <details className="group flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden" open>
                            <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors select-none">
                                <p className="text-[#111218] text-sm font-semibold">Material Type</p>
                                <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="p-4 flex flex-col gap-3">
                                {categories.map((category) => (
                                    <label key={category.id} className="flex items-center gap-3 cursor-pointer group/item">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(category.id)}
                                            onChange={() => toggleCategory(category.id)}
                                            className="rounded border-slate-300 text-[#2b4bee] focus:ring-[#2b4bee] h-4 w-4"
                                        />
                                        <span className="text-sm text-slate-600 group-hover/item:text-[#2b4bee] transition-colors">
                                            {category.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </details>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 flex flex-col min-w-0">
                        {/* Search Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                            <div className="flex flex-col w-full mb-4">
                                <div className="flex w-full items-stretch rounded-lg h-12 relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                                        <Search className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="w-full rounded-lg text-[#111218] focus:outline-0 focus:ring-2 focus:ring-[#2b4bee]/20 border border-slate-200 bg-slate-50 placeholder:text-slate-400 pl-10 pr-24 text-base font-normal transition-shadow"
                                        placeholder="Search by course code, subject, or topic..."
                                    />
                                    <button
                                        onClick={handleSearch}
                                        className="absolute right-1 top-1 bottom-1 bg-[#2b4bee] hover:bg-blue-600 text-white rounded px-4 text-sm font-bold transition-colors"
                                    >
                                        Search
                                    </button>
                                </div>
                            </div>

                            {/* Trending Chips - Hidden on mobile */}
                            <div className="hidden md:flex gap-2 flex-wrap items-center">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Trending:</span>
                                {trendingSearches.map((term) => (
                                    <button
                                        key={term}
                                        onClick={() => {
                                            setSearchQuery(term);
                                            handleSearch();
                                        }}
                                        className="flex h-7 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 px-3 transition-colors"
                                    >
                                        <span className="text-slate-700 text-xs font-medium">{term}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Utility Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowMobileFilters(true)}
                                    className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700"
                                >
                                    <Filter className="w-4 h-4" />
                                    Filters
                                    {activeFiltersCount > 0 && (
                                        <span className="bg-[#2b4bee] text-white text-xs px-1.5 py-0.5 rounded-full">{activeFiltersCount}</span>
                                    )}
                                </button>
                                <p className="text-slate-600 text-sm font-medium">
                                    <span className="text-[#111218] font-bold">{totalResults.toLocaleString()}</span> results found
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Sort Dropdown */}
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-slate-500 font-medium">Sort by:</label>
                                    <div className="relative">
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                                            className="appearance-none bg-white border border-slate-200 text-slate-700 py-1.5 pl-3 pr-8 rounded text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#2b4bee] cursor-pointer"
                                        >
                                            <option value="relevance">Relevance</option>
                                            <option value="newest">Date Uploaded</option>
                                            <option value="downloads">Most Downloaded</option>
                                            <option value="rating">Highest Rated</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                {/* View Toggle */}
                                <div className="flex items-center bg-white rounded border border-slate-200 p-0.5">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1 rounded ${viewMode === 'grid' ? 'text-[#2b4bee]' : 'text-slate-400'} hover:bg-slate-100`}
                                    >
                                        <Grid3X3 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-1 rounded ${viewMode === 'list' ? 'text-[#2b4bee]' : 'text-slate-400'} hover:bg-slate-100`}
                                    >
                                        <List className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Materials Grid */}
                        {loading ? (
                            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                                        <div className="h-40 bg-gray-200"></div>
                                        <div className="p-4">
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : materials.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-[#111218] mb-2">No materials found</h2>
                                <p className="text-slate-600 mb-6">Try adjusting your search or filters</p>
                                <button onClick={clearFilters} className="px-6 py-2.5 bg-[#2b4bee] text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <div className={`grid gap-6 mb-8 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                                {materials.map((material) => {
                                    const uploaderName = material.uploaded_by_profile?.full_name || 'Unknown';
                                    const uploaderInitials = getInitials(uploaderName);
                                    const avatarColor = getAvatarColor(uploaderName);

                                    return (
                                        <article
                                            key={material.id}
                                            className="group flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-[#2b4bee]/30 transition-all duration-300"
                                        >
                                            <Link href={`/materials/${material.id}`} className="h-40 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                                                {/* Badge */}
                                                <span className="absolute top-3 left-3 bg-white/90 text-[#2b4bee] backdrop-blur-sm text-xs font-bold px-2 py-1 rounded shadow-sm z-10">
                                                    {material.course_code?.code || material.discipline?.name?.slice(0, 8) || 'General'}
                                                </span>
                                                {/* Image */}
                                                <img
                                                    src={getCategoryImage(material.category || 'other')}
                                                    alt={material.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                {/* Bookmark */}
                                                {user && (
                                                    <div className="absolute top-3 right-3 z-10">
                                                        <BookmarkButton
                                                            materialId={material.id}
                                                            initialBookmarked={material.is_bookmarked}
                                                            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm"
                                                        />
                                                    </div>
                                                )}
                                            </Link>

                                            <div className="p-4 flex flex-col flex-1">
                                                <Link href={`/materials/${material.id}`}>
                                                    <h3 className="text-[#111218] font-bold text-lg leading-snug line-clamp-2 group-hover:text-[#2b4bee] transition-colors mb-2">
                                                        {material.title}
                                                    </h3>
                                                </Link>
                                                <p className="text-slate-500 text-xs mb-3 font-medium">
                                                    {getCategoryDisplayName(material.category || 'other')} • {formatRelativeTime(material.created_at)}
                                                </p>

                                                {/* Tags */}
                                                {material.tags && material.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                                        {material.tags.slice(0, 2).map((tag, i) => (
                                                            <span key={i} className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-100">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Footer */}
                                                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {material.uploaded_by_profile?.avatar_url ? (
                                                            <img
                                                                src={material.uploaded_by_profile.avatar_url}
                                                                alt={uploaderName}
                                                                className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                                                            />
                                                        ) : (
                                                            <div className={`w-6 h-6 rounded-full ${avatarColor} flex items-center justify-center text-white text-[10px] font-bold`}>
                                                                {uploaderInitials}
                                                            </div>
                                                        )}
                                                        <span className="text-xs text-slate-500 truncate max-w-[80px]">{uploaderName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs font-semibold">
                                                        <div className="flex items-center text-amber-500 gap-1">
                                                            <Star className="w-4 h-4 fill-current" />
                                                            <span>{material.average_rating?.toFixed(1) || '0.0'}</span>
                                                        </div>
                                                        <div className="flex items-center text-slate-400 gap-1">
                                                            <Download className="w-4 h-4" />
                                                            <span>{material.download_count || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mb-12">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="flex items-center justify-center w-10 h-10 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`flex items-center justify-center w-10 h-10 rounded-lg font-medium transition-colors ${page === pageNum
                                                ? 'bg-[#2b4bee] text-white shadow-md'
                                                : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                {totalPages > 5 && (
                                    <>
                                        <span className="text-slate-400 px-1">...</span>
                                        <button
                                            onClick={() => setPage(totalPages)}
                                            className={`flex items-center justify-center w-10 h-10 rounded-lg font-medium transition-colors ${page === totalPages
                                                ? 'bg-[#2b4bee] text-white shadow-md'
                                                : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="flex items-center justify-center w-10 h-10 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Auth Modal for guests */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialView="login"
            />
        </div>
    );
}
