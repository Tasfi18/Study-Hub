// Shared types with backend
export type UserRole = 'student' | 'teacher' | 'admin' | 'super_admin';
export type MaterialStatus = 'pending' | 'approved' | 'rejected';
export type MaterialType = 'pdf' | 'slide' | 'note' | 'assignment' | 'image' | 'video' | 'other';
export type MaterialCategory = 'previous_question' | 'ct_question' | 'final_question' | 'assignment' | 'lecture_note' | 'lab_manual' | 'syllabus' | 'book' | 'other';
export type ScheduleType = 'class_test' | 'lab_test' | 'routine' | 'assignment' | 'viva' | 'presentation' | 'project' | 'other';


export interface User {
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
  // Relations from backend
  discipline?: { id: string; name: string; code: string };
  batch?: { id: string; year: number; semester: string; code: string };
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
  view_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  discipline?: { name: string; code: string };
  batch?: { year: number; semester: string; code: string };
  course_code?: { code: string; title: string };
  uploaded_by_profile?: { id: string; full_name: string; role: UserRole; avatar_url?: string };
  // Rating fields
  average_rating?: number;
  total_reviews?: number;
  user_has_reviewed?: boolean;
  // Bookmark field
  is_bookmarked?: boolean;
}

export interface Discipline {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Batch {
  id: string;
  discipline_id: string;
  year: number;
  semester: string;
  code: string;
}

export interface CourseCode {
  id: string;
  discipline_id: string;
  code: string;
  title: string;
  description?: string;
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
  discipline?: { name: string; code: string };
  course_code?: { code: string; title: string };
  created_by_profile?: { full_name: string };
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
  discipline?: { id: string; name: string; code: string };
  batch?: { id: string; code: string; year: number; semester: string };
  course_code?: { id: string; code: string; title: string };
  asked_by_profile?: { id: string; full_name: string; role: UserRole; avatar_url?: string };
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
  answered_by_profile?: { id: string; full_name: string; role: UserRole; avatar_url?: string };
}

export interface Review {
  id: string;
  user_id: string;
  material_id: string;
  rating: number;
  review?: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: UserRole;
  disciplineName: string; // Required for all users
  studentId?: string; // Student ID (optional for teachers)
}

export interface UploadMaterialForm {
  title: string;
  description?: string;
  disciplineId: string;
  termId?: string;
  courseCodeId?: string;
  category?: MaterialCategory;
  tags?: string[];
  file: File;
}

export interface CreateQuestionForm {
  title: string;
  content: string;
  disciplineId: string;
  batchId?: string;
  courseCodeId?: string;
  tags?: string[];
  image?: File;
}

export interface CreateAnswerForm {
  content: string;
  image?: File;
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

export interface MaterialFilters {
  discipline?: string;
  term?: string;
  courseCode?: string;
  type?: MaterialType;
  category?: MaterialCategory;
  status?: MaterialStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ScheduleFilters {
  type?: ScheduleType;
  discipline?: string;
  batch?: string;
  term?: string;
  date?: string;
  page?: number;
  limit?: number;
}

export interface CreateScheduleForm {
  type: ScheduleType;
  title: string;
  description?: string;
  discipline_id: string;
  course_code_id?: string;
  term?: string;
  schedule_date: string;
  syllabus?: string;
}



// API Response types
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

// Component props types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export type NotificationType = 'approval' | 'rejection' | 'download' | 'system';

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

export interface UserStats {
  uploads: number;
  bookmarks: number;
  reviews: number;
}

