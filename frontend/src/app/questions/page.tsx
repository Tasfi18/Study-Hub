'use client';

import { useEffect, useState, useCallback } from 'react';
import { Question, QuestionFilters } from '@/types';
import { apiClient } from '@/lib/api';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import {
  Search, MessageCircle, CheckCircle, Clock, Eye, Plus,
  TrendingUp, X, ChevronDown, BookOpen, Award
} from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/home/Navigation';

interface FilterOptions {
  disciplines: Array<{ id: string; name: string; code: string }>;
  terms: Array<{ id: string; term: string; discipline_id: string }>;
  courseCodes: Array<{ id: string; code: string; title: string; discipline_id: string }>;
}

// Tab type for filtering
type SortTab = 'recent' | 'popular' | 'unanswered' | 'my_questions';

export default function QuestionsPage() {
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<QuestionFilters>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [activeTab, setActiveTab] = useState<SortTab>('recent');
  const [trendingTags, setTrendingTags] = useState<Array<{ tag: string; count: number }>>([]);
  const [topContributors, setTopContributors] = useState<Array<{ name: string; avatar?: string; points: number; rank: number }>>([]);

  // Load questions with sorting
  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getQuestions({ ...filters, search: searchQuery || undefined });
      if (response.success && response.data) {
        let sorted = [...response.data];

        // Apply sorting based on active tab
        if (activeTab === 'popular') {
          sorted.sort((a, b) => (b.view_count + (b.answer_count || 0)) - (a.view_count + (a.answer_count || 0)));
        } else if (activeTab === 'unanswered') {
          sorted = sorted.filter(q => !q.is_solved && (!q.answer_count || q.answer_count === 0));
        } else if (activeTab === 'my_questions' && user) {
          sorted = sorted.filter(q => q.asked_by === user.id);
        }

        setQuestions(sorted);

        // Extract trending tags from questions
        const tagCounts: Record<string, number> = {};
        response.data.forEach(q => {
          q.tags?.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });
        const sortedTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag, count]) => ({ tag, count }));
        setTrendingTags(sortedTags);

        // Extract top contributors (users who asked/answered most)
        const userCounts: Record<string, { name: string; avatar?: string; count: number }> = {};
        response.data.forEach(q => {
          if (q.asked_by_profile) {
            const key = q.asked_by_profile.full_name || 'Unknown';
            if (!userCounts[key]) {
              userCounts[key] = {
                name: key,
                avatar: q.asked_by_profile.avatar_url,
                count: 0
              };
            }
            userCounts[key].count += 1;
          }
        });
        const sortedUsers = Object.values(userCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
          .map((u, i) => ({
            name: u.name,
            avatar: u.avatar,
            points: u.count * 50,
            rank: i + 1
          }));
        setTopContributors(sortedUsers);
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, activeTab, user]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const response = await apiClient.getFilterOptions();
      if (response.success && response.data) {
        setFilterOptions(response.data);
      }
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  }, []);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        if (searchQuery !== (prev.search || '')) {
          return { ...prev, search: searchQuery || undefined };
        }
        return prev;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTopicChange = (topicId: string) => {
    setFilters(prev => ({ ...prev, discipline: topicId || undefined }));
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      <Navigation />

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center w-full px-5 py-8 md:px-10 lg:px-20">
        <div className="max-w-[1200px] w-full flex flex-col gap-8">
          {/* Page Heading & Actions */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
            <div className="flex flex-col gap-2 max-w-2xl">
              <h1 className="text-[#111218] text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em]">
                Community Q&A
              </h1>
              <p className="text-[#616889] text-lg font-normal leading-relaxed">
                Find answers, ask questions, and collaborate with peers to master your subjects.
              </p>
            </div>
            {user && (
              <Link
                href="/questions/new"
                className="flex shrink-0 w-full md:w-auto items-center justify-center gap-2 rounded-lg h-12 px-6 bg-[#2b4bee] hover:bg-[#2b4bee]/90 text-white text-sm font-bold transition-all shadow-lg shadow-[#2b4bee]/25"
              >
                <Plus className="w-5 h-5" />
                <span>Ask a Question</span>
              </Link>
            )}
          </section>

          {/* Search Bar */}
          <section className="w-full">
            <label className="flex flex-col h-14 w-full relative group">
              <div className="flex w-full flex-1 items-stretch rounded-xl h-full bg-white border border-[#dbdde6] group-focus-within:border-[#2b4bee] transition-colors overflow-hidden shadow-sm">
                <div className="text-[#616889] flex items-center justify-center pl-4 pr-2">
                  <Search className="w-6 h-6" />
                </div>
                <input
                  className="flex w-full min-w-0 flex-1 bg-transparent text-[#111218] focus:outline-none placeholder:text-[#616889] px-2 text-base font-normal"
                  placeholder="Search for questions, topics, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="flex items-center pr-4 text-[#616889] hover:text-[#111218]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </label>
          </section>

          {/* Filters */}
          <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#dbdde6] pb-4">
            <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
              <button
                onClick={() => setActiveTab('recent')}
                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-all ${activeTab === 'recent'
                  ? 'bg-[#2b4bee]/10 text-[#2b4bee] border border-[#2b4bee]/30'
                  : 'bg-transparent hover:bg-gray-100 text-[#616889] hover:text-[#111218]'
                  }`}
              >
                <span className="text-sm font-semibold">Most Recent</span>
              </button>
              <button
                onClick={() => setActiveTab('popular')}
                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-all ${activeTab === 'popular'
                  ? 'bg-[#2b4bee]/10 text-[#2b4bee] border border-[#2b4bee]/30'
                  : 'bg-transparent hover:bg-gray-100 text-[#616889] hover:text-[#111218]'
                  }`}
              >
                <span className="text-sm font-medium">Most Popular</span>
              </button>
              <button
                onClick={() => setActiveTab('unanswered')}
                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-all ${activeTab === 'unanswered'
                  ? 'bg-[#2b4bee]/10 text-[#2b4bee] border border-[#2b4bee]/30'
                  : 'bg-transparent hover:bg-gray-100 text-[#616889] hover:text-[#111218]'
                  }`}
              >
                <span className="text-sm font-medium">Unanswered</span>
              </button>
              {user && (
                <button
                  onClick={() => setActiveTab('my_questions')}
                  className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-all ${activeTab === 'my_questions'
                    ? 'bg-[#2b4bee]/10 text-[#2b4bee] border border-[#2b4bee]/30'
                    : 'bg-transparent hover:bg-gray-100 text-[#616889] hover:text-[#111218]'
                    }`}
                >
                  <span className="text-sm font-medium">My Questions</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-[#616889] text-sm hidden md:block">Filter by:</span>
              <div className="relative w-full sm:w-48">
                <select
                  value={filters.discipline || ''}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  className="w-full h-9 bg-white text-[#111218] text-sm border border-[#dbdde6] rounded-lg px-3 focus:outline-none focus:border-[#2b4bee] appearance-none cursor-pointer"
                >
                  <option value="">All Topics</option>
                  {filterOptions?.disciplines.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#616889]">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Question Feed */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {loading ? (
                // Loading skeletons
                [...Array(3)].map((_, i) => (
                  <article key={i} className="flex flex-col gap-4 p-5 rounded-xl bg-white border border-[#f0f1f4] animate-pulse">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-gray-200" />
                      <div className="h-4 bg-gray-200 rounded w-24" />
                      <div className="h-4 bg-gray-200 rounded w-16" />
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded w-16" />
                      <div className="h-6 bg-gray-200 rounded w-16" />
                    </div>
                  </article>
                ))
              ) : questions.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-xl border border-[#f0f1f4]">
                  <div className="size-20 bg-[#2b4bee]/10 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-[#2b4bee]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#111218] mb-2">No questions yet</h3>
                  <p className="text-[#616889] text-center mb-6">
                    {searchQuery || filters.discipline
                      ? 'No questions match your criteria. Try adjusting filters.'
                      : 'Be the first to ask a question and start the conversation!'}
                  </p>
                  {user && (
                    <Link
                      href="/questions/new"
                      className="flex items-center gap-2 px-6 py-3 bg-[#2b4bee] text-white rounded-lg font-medium hover:bg-[#2b4bee]/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Ask a Question
                    </Link>
                  )}
                </div>
              ) : (
                // Question cards
                questions.map((question) => (
                  <Link key={question.id} href={`/questions/${question.id}`}>
                    <article className="group relative flex flex-col gap-3 p-5 rounded-xl bg-white border border-[#f0f1f4] hover:border-[#2b4bee]/50 transition-all hover:shadow-lg hover:shadow-[#2b4bee]/5 cursor-pointer">
                      {/* User info */}
                      <div className="flex items-center gap-2 text-xs text-[#616889]">
                        <div className="flex items-center gap-2">
                          {question.asked_by_profile?.avatar_url ? (
                            <Image
                              src={question.asked_by_profile.avatar_url}
                              alt={question.asked_by_profile.full_name || 'User'}
                              width={24}
                              height={24}
                              className="size-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="size-6 rounded-full bg-[#2b4bee] flex items-center justify-center text-white text-xs font-medium">
                              {getInitials(question.asked_by_profile?.full_name)}
                            </div>
                          )}
                          <span className="font-medium text-[#111218]">
                            {question.asked_by_profile?.full_name || 'Anonymous'}
                          </span>
                        </div>
                        <span>•</span>
                        <span>{formatRelativeTime(question.created_at)}</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-[#111218] group-hover:text-[#2b4bee] transition-colors leading-snug line-clamp-2">
                        {question.title}
                      </h3>

                      {/* Content preview */}
                      <p className="text-[#616889] text-sm line-clamp-2 leading-relaxed">
                        {question.content}
                      </p>

                      {/* Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-4 mt-2 pt-3 border-t border-dashed border-[#dbdde6]">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {question.tags?.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-[#616889] hover:bg-gray-200 transition-colors"
                            >
                              #{tag}
                            </span>
                          ))}
                          {(question.tags?.length || 0) > 3 && (
                            <span className="px-2 py-1 text-xs text-[#616889]">
                              +{(question.tags?.length || 0) - 3}
                            </span>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4">
                          <div className="hidden sm:flex items-center gap-1.5 text-[#616889] text-sm group-hover:text-[#111218] transition-colors">
                            <Eye className="w-4 h-4" />
                            <span>{question.view_count} views</span>
                          </div>
                          {question.is_solved ? (
                            <div className="flex items-center gap-1.5 text-green-600 text-sm font-semibold bg-green-50 px-3 py-1 rounded-full border border-green-100">
                              <CheckCircle className="w-4 h-4" />
                              <span>Solved</span>
                            </div>
                          ) : (question.answer_count || 0) > 0 ? (
                            <div className="flex items-center gap-1.5 text-[#2b4bee] text-sm font-semibold bg-[#2b4bee]/10 px-3 py-1 rounded-full">
                              <MessageCircle className="w-4 h-4" />
                              <span>{question.answer_count} Answers</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[#616889] text-sm font-semibold bg-gray-100 px-3 py-1 rounded-full">
                              <Clock className="w-4 h-4" />
                              <span>Awaiting Answer</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))
              )}

              {/* Load more */}
              {questions.length > 0 && questions.length >= 10 && (
                <div className="flex justify-center mt-6">
                  <button className="text-[#616889] hover:text-[#111218] text-sm font-medium px-4 py-2 transition-colors">
                    Load more questions...
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar / Widgets */}
            <aside className="hidden lg:flex lg:col-span-4 flex-col gap-6">
              {/* Trending Topics Widget */}
              <div className="bg-white border border-[#f0f1f4] rounded-xl p-5">
                <h3 className="text-[#111218] font-bold text-lg mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#2b4bee]" />
                  Trending Topics
                </h3>
                <div className="flex flex-col gap-3">
                  {trendingTags.length > 0 ? (
                    trendingTags.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => setSearchQuery(item.tag)}
                        className="flex justify-between items-center group text-left"
                      >
                        <span className="text-[#616889] text-sm group-hover:text-[#111218] transition-colors">
                          #{item.tag}
                        </span>
                        <span className="text-xs bg-gray-100 text-[#616889] px-2 py-0.5 rounded-full group-hover:bg-[#2b4bee] group-hover:text-white transition-colors">
                          {item.count} {item.count === 1 ? 'post' : 'posts'}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="text-[#616889] text-sm">No trending topics yet</p>
                  )}
                </div>
              </div>

              {/* Top Contributors Widget */}
              <div className="bg-white border border-[#f0f1f4] rounded-xl p-5">
                <h3 className="text-[#111218] font-bold text-lg mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Top Contributors
                </h3>
                <div className="flex flex-col gap-4">
                  {topContributors.length > 0 ? (
                    topContributors.map((contributor, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {contributor.avatar ? (
                          <Image
                            src={contributor.avatar}
                            alt={contributor.name}
                            width={40}
                            height={40}
                            className="size-10 rounded-full object-cover border border-[#f0f1f4]"
                          />
                        ) : (
                          <div className="size-10 rounded-full bg-[#2b4bee] flex items-center justify-center text-white font-medium">
                            {getInitials(contributor.name)}
                          </div>
                        )}
                        <div className="flex flex-col flex-1">
                          <span className="text-[#111218] text-sm font-semibold">{contributor.name}</span>
                          <span className="text-[#616889] text-xs">{contributor.points} pts</span>
                        </div>
                        <div className={`font-bold text-sm ${contributor.rank === 1 ? 'text-yellow-500' : 'text-[#616889]'}`}>
                          #{contributor.rank}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#616889] text-sm">No contributors yet</p>
                  )}
                </div>
              </div>

              {/* Promo Card */}
              <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-[#2b4bee] to-purple-600 text-white shadow-lg">
                <div className="relative z-10 flex flex-col gap-3">
                  <h3 className="font-bold text-lg">Need Help?</h3>
                  <p className="text-sm opacity-90">
                    Can&apos;t find an answer? Ask your question and get help from the community.
                  </p>
                  {user ? (
                    <Link
                      href="/questions/new"
                      className="bg-white text-[#2b4bee] text-sm font-bold py-2 px-4 rounded-lg self-start mt-2 hover:bg-gray-100 transition-colors"
                    >
                      Ask Now
                    </Link>
                  ) : (
                    <Link
                      href="/?auth=signin"
                      className="bg-white text-[#2b4bee] text-sm font-bold py-2 px-4 rounded-lg self-start mt-2 hover:bg-gray-100 transition-colors"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
                <div className="absolute -right-4 -bottom-8 opacity-20">
                  <BookOpen className="w-28 h-28" />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Mobile FAB */}
      {user && (
        <Link
          href="/questions/new"
          className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#2b4bee] rounded-full shadow-lg shadow-[#2b4bee]/30 flex items-center justify-center text-white hover:scale-110 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </Link>
      )}
    </div>
  );
}