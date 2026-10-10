import { Request } from 'express';

// Database Types (matching PostgreSQL schema)
export type UserRole = 'student' | 'teacher' | 'admin' | 'super_admin';
export type MaterialStatus = 'pending' | 'approved' | 'rejected';
export type MaterialType = 'pdf' | 'slide' | 'note' | 'assignment' | 'image' | 'video' | 'other';
export type MaterialCategory = 'previous_question' | 'ct_question' | 'final_question' | 'assignment' | 'lecture_note' | 'lab_manual' | 'syllabus' | 'other';
export type NotificationType = 'approval' | 'rejection' | 'download' | 'system';
export type ScheduleType = 'class_test' | 'lab_test' | 'routine' | 'assignment' | 'viva' | 'presentation' | 'project' | 'other';
export type ElectionStatus = 'upcoming' | 'active' | 'ended';
export type CandidateStatus = 'pending' | 'approved' | 'rejected';

// Role Constants
export const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin'];

// Database Tables
export interface Discipline {
  id: string;
  name: string;
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  discipline_id: string;
  year: number;
  semester: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  discipline_id?: string;
  batch_id?: string;
  student_id?: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseCode {
  id: string;
  discipline_id: string;
  code: string;
  title: string;
  description?: string;
  created_at: string;
}

export interface Material {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: MaterialType;
  category?: MaterialCategory;
  mime_type: string;
  discipline_id: string;
  batch_id?: string;
  course_code_id?: string;
  uploaded_by: string;
  approved_by?: string;
  status: MaterialStatus;
  rejection_reason?: string;
  tags?: string[];
  download_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  // Relations
  discipline?: Discipline;
  batch?: Batch;
  course_code?: CourseCode;
  uploaded_by_profile?: Profile;
}

export interface Download {
  id: string;
  material_id: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  downloaded_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  material_id: string;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  material_id: string;
  rating: number;
  review?: string;
  created_at: string;
  updated_at: string;
  user_profile?: Profile;
}

export interface MaterialWithRating extends Material {
  average_rating: number;
  total_reviews: number;
  user_has_reviewed?: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface Schedule {
  id: string;
  type: ScheduleType;
  title: string;
  description?: string;
  discipline_id: string;
  course_code_id?: string;
  term?: string;
  schedule_date: string;
  syllabus?: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  discipline?: Discipline;
  course_code?: CourseCode;
  created_by_profile?: Profile;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  discipline_id: string;
  batch_id?: string;
  course_code_id?: string;
  asked_by: string;
  tags?: string[];
  is_solved: boolean;
  view_count: number;
  vote_count: number;
  image_url?: string;
  image_filename?: string;
  created_at: string;
  updated_at: string;
  // Relations
  discipline?: Discipline;
  batch?: Batch;
  course_code?: CourseCode;
  asked_by_profile?: Profile;
  answers?: Answer[];
  answer_count?: number;
}

export interface Answer {
  id: string;
  question_id: string;
  content: string;
  answered_by: string;
  is_accepted: boolean;
  vote_count: number;
  image_url?: string;
  image_filename?: string;
  created_at: string;
  updated_at: string;
  // Relations
  answered_by_profile?: Profile;
}

export interface Election {
  id: string;
  batch_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: ElectionStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  batch?: Batch;
  created_by_profile?: Profile;
  candidates?: Candidate[];
  total_votes?: number;
}

export interface Candidate {
  id: string;
  election_id: string;
  user_id: string;
  manifesto: string;
  status: CandidateStatus;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  // Relations
  user?: Profile;
  vote_count?: number;
}

export interface Vote {
  id: string;
  election_id: string;
  voter_id: string;
  candidate_id: string;
  voted_at: string;
}

// Request/Response Types
export interface AuthenticatedRequest extends Request {
  user?: Profile;
  params: any;
  body: any;
  headers: any;
}

export interface UploadMaterialRequest {
  title: string;
  description?: string;
  disciplineId: string;
  batchId?: string;
  courseCodeId?: string;
  category?: MaterialCategory;
  tags?: string[];
}

export interface MaterialFilters {
  discipline?: string | undefined;
  term?: string | undefined;
  courseCode?: string | undefined;
  type?: MaterialType;
  category?: MaterialCategory;
  status?: MaterialStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateQuestionRequest {
  title: string;
  content: string;
  disciplineId: string;
  batchId?: string | undefined;
  courseCodeId?: string | undefined;
  tags?: string[] | undefined;
}

export interface CreateAnswerRequest {
  content: string;
}

export interface QuestionFilters {
  discipline?: string;
  batch?: string;
  courseCode?: string;
  search?: string;
  solved?: boolean;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  details?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Configuration Types
export type StorageProvider = 'supabase' | 'cloudflare-r2' | 'local';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  emailRedirectUrl: string;
  maxFileSize: number;
  storage: {
    provider: StorageProvider;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  r2: {
    accountId: string | undefined;
    accessKeyId: string | undefined;
    secretAccessKey: string | undefined;
    bucketName: string | undefined;
    publicUrl: string | undefined;
    endpoint: string | undefined;
  };
  jwt: {
    secret: string;
  };
}