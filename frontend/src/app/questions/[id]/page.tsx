'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Question, Answer, CreateAnswerForm } from '@/types';
import { apiClient } from '@/lib/api';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  ArrowLeft, MessageCircle, CheckCircle, Clock, Eye,
  User, Calendar, Send, ThumbsUp, Award, BookOpen,
  Image as ImageIcon, X, Edit2, MoreVertical, Shield
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import ImageUpload from '@/components/ImageUpload';

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerForm, setAnswerForm] = useState<CreateAnswerForm>({ content: '' });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isWritingAnswer, setIsWritingAnswer] = useState(false);

  // Define loadQuestion function with useCallback
  const loadQuestion = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getQuestion(params.id as string);
      if (response.success && response.data) {
        setQuestion(response.data);
      } else {
        router.push('/questions');
      }
    } catch (error) {
      console.error('Failed to load question:', error);
      router.push('/questions');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (params.id) {
      loadQuestion();
    }
  }, [loadQuestion, params.id]);

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !answerForm.content.trim()) return;

    try {
      setAnswerLoading(true);
      setImageError(null);

      const submitData = new FormData();
      submitData.append('content', answerForm.content.trim());
      if (selectedImage) {
        submitData.append('image', selectedImage);
      }

      const response = await apiClient.createAnswer(params.id as string, submitData);

      if (response.success) {
        setAnswerForm({ content: '' });
        setSelectedImage(null);
        setIsWritingAnswer(false);
        loadQuestion();
      } else {
        alert(response.error || 'Failed to post answer');
      }
    } catch (error) {
      console.error('Create answer error:', error);
      alert('Failed to post answer. Please try again.');
    } finally {
      setAnswerLoading(false);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!user || !question || question.asked_by !== user.id) return;

    try {
      const response = await apiClient.acceptAnswer(question.id, answerId);
      if (response.success) {
        loadQuestion();
      } else {
        alert(response.error || 'Failed to accept answer');
      }
    } catch (error) {
      console.error('Accept answer error:', error);
      alert('Failed to accept answer. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl p-8 animate-pulse border border-gray-100">
            <div className="h-8 bg-gray-200 rounded-lg w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-100 rounded w-full"></div>
              <div className="h-4 bg-gray-100 rounded w-5/6"></div>
              <div className="h-4 bg-gray-100 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) return null;
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Navigation */}
      {user && (
        <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Study Hub
                </Link>
                <BackButton href="/questions" label="Back to Q&A" className="text-sm" />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {getInitials(user.full_name)}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Question Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          {/* Question Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 flex-1 pr-6 leading-tight">
                {question.title}
              </h1>

              <div className="flex items-center space-x-2">
                {question.is_solved ? (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-700 border border-green-200">
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Solved
                  </span>
                ) : (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-amber-100 text-amber-700 border border-amber-200">
                    <Clock className="w-4 h-4 mr-1.5" />
                    Open
                  </span>
                )}
              </div>
            </div>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {getInitials(question.asked_by_profile?.full_name)}
                </div>
                <div>
                  <span className="font-medium text-gray-900">{question.asked_by_profile?.full_name}</span>
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs capitalize">
                    {question.asked_by_profile?.role}
                  </span>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-1.5" />
                <span title={new Date(question.created_at).toLocaleString()}>
                  Asked {formatRelativeTime(question.created_at)}
                </span>
              </div>

              <div className="flex items-center text-gray-600">
                <Eye className="w-4 h-4 mr-1.5" />
                <span>{question.view_count} views</span>
              </div>

              {question.vote_count > 0 && (
                <div className="flex items-center text-blue-600 font-medium">
                  <ThumbsUp className="w-4 h-4 mr-1.5" />
                  <span>{question.vote_count} votes</span>
                </div>
              )}
            </div>
          </div>

          {/* Question Content */}
          <div className="px-8 py-6">
            <div className="prose max-w-none text-gray-700">
              <p className="whitespace-pre-wrap leading-relaxed">{question.content}</p>

              {question.image_url && (
                <div className="mt-6">
                  <Image
                    src={question.image_url}
                    alt={question.image_filename || 'Question attachment'}
                    className="max-w-full h-auto rounded-xl border border-gray-200 shadow-sm"
                    width={800}
                    height={600}
                    style={{ width: '100%', height: 'auto' }}
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {question.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    # {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Answers Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
              {question.answers?.length || 0} Answers
            </h2>

            {user && !isWritingAnswer && (
              <button
                onClick={() => setIsWritingAnswer(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium text-sm"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Write Answer
              </button>
            )}
          </div>

          <div className="space-y-4">
            {question.answers
              ?.sort((a, b) => {
                // Accepted answers first
                if (a.is_accepted && !b.is_accepted) return -1;
                if (!a.is_accepted && b.is_accepted) return 1;
                // Then by creation date (newest first)
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              })
              .map((answer) => (
                <div
                  key={answer.id}
                  className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${answer.is_accepted
                      ? 'border-green-300 shadow-green-100 shadow-lg'
                      : 'border-gray-100 hover:border-gray-200'
                    }`}
                >
                  {answer.is_accepted && (
                    <div className="px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                      <div className="flex items-center">
                        <Award className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-green-700 font-semibold">Accepted Answer</span>
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Answer Author Info */}
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {getInitials(answer.answered_by_profile?.full_name)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {answer.answered_by_profile?.full_name}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                            {answer.answered_by_profile?.role}
                          </span>
                          {answer.answered_by === question.asked_by && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              Author
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Answered {formatRelativeTime(answer.created_at)}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        {user && question.asked_by === user.id && (
                          answer.is_accepted ? (
                            <div className="flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                              <CheckCircle className="w-4 h-4 mr-1.5" />
                              Accepted
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAcceptAnswer(answer.id)}
                              className="flex items-center px-3 py-1.5 text-green-600 hover:bg-green-50 border-2 border-green-200 hover:border-green-300 rounded-lg transition-all font-medium text-sm"
                              title="Accept this answer as the solution"
                            >
                              <CheckCircle className="w-4 h-4 mr-1.5" />
                              Accept
                            </button>
                          )
                        )}
                        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                          <ThumbsUp className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Answer Content */}
                    <div className="prose max-w-none text-gray-700">
                      <p className="whitespace-pre-wrap leading-relaxed">{answer.content}</p>

                      {answer.image_url && (
                        <div className="mt-4">
                          <Image
                            src={answer.image_url}
                            alt={answer.image_filename || 'Answer attachment'}
                            className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                            width={800}
                            height={600}
                            style={{ width: '100%', height: 'auto' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Vote Count */}
                    {answer.vote_count > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-600">
                          {answer.vote_count} {answer.vote_count === 1 ? 'person' : 'people'} found this helpful
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {(!question.answers || question.answers.length === 0) && (
            <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No answers yet. Be the first to help!</p>
              {user && !isWritingAnswer && (
                <button
                  onClick={() => setIsWritingAnswer(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Write First Answer
                </button>
              )}
            </div>
          )}
        </div>
        {/* Answer Form */}
        {user && isWritingAnswer && (
          <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Your Answer
                </h3>
                <button
                  onClick={() => {
                    setIsWritingAnswer(false);
                    setAnswerForm({ content: '' });
                    setSelectedImage(null);
                  }}
                  className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAnswerSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer Content
                </label>
                <textarea
                  value={answerForm.content}
                  onChange={(e) => setAnswerForm({ content: e.target.value })}
                  placeholder="Share your knowledge and help answer this question..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical bg-gray-50 focus:bg-white transition-colors"
                  required
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-500">
                  Tip: Provide clear, detailed answers with examples when possible.
                </p>
              </div>

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attach Image (Optional)
                </label>
                <ImageUpload
                  selectedFile={selectedImage}
                  onFileSelect={(file) => {
                    setSelectedImage(file);
                    setImageError(null);
                  }}
                  error={imageError}
                  disabled={answerLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {answerForm.content.length > 0 && (
                    <span>{answerForm.content.length} characters</span>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsWritingAnswer(false);
                      setAnswerForm({ content: '' });
                      setSelectedImage(null);
                    }}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={answerLoading || !answerForm.content.trim()}
                    className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {answerLoading ? 'Posting...' : 'Post Answer'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Sign In Prompt */}
        {!user && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-center border border-blue-100">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Join the Discussion
            </h3>
            <p className="text-gray-600 mb-6">
              Sign in to share your knowledge and help answer questions
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              Sign In to Answer
            </Link>
          </div>
        )}

        {/* Guidelines */}
        {user && !isWritingAnswer && question.answers && question.answers.length > 0 && (
          <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
              Answer Guidelines
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Provide clear, detailed explanations</li>
              <li>• Include examples or references when relevant</li>
              <li>• Be respectful and constructive</li>
              <li>• Focus on helping the asker learn</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}