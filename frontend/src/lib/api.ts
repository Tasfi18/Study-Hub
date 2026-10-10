import { ApiResponse, PaginatedResponse, Material, MaterialFilters, LoginForm, RegisterForm, UserStats, Schedule, ScheduleFilters, CreateScheduleForm, Question } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Get token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private getHeaders(includeContentType = true): HeadersInit {
    const headers: HeadersInit = {};

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = options.headers || this.getHeaders();

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;

          // Handle expired/invalid token - auto logout
          if (response.status === 401 && this.token) {
            this.clearToken();
            // Clear auth state from storage
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth-storage');
              // Redirect to home page to trigger re-login
              window.location.href = '/';
            }
          }
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection or try again later.');
      }
      throw error;
    }
  }

  // Auth methods
  async login(credentials: LoginForm): Promise<ApiResponse<{ token: string; user: any }>> {
    const response = await this.request<ApiResponse<{ token: string; user: any }>>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(userData: RegisterForm): Promise<ApiResponse> {
    return this.request<ApiResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async resendVerificationEmail(email: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getProfile(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/auth/profile');
  }

  async completeProfile(data: { role: string; disciplineName: string; studentId?: string }): Promise<ApiResponse<{ token: string; user: any }>> {
    const response = await this.request<ApiResponse<{ token: string; user: any }>>(
      '/auth/complete-profile',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  // Token management
  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Material methods
  async getMaterials(filters?: MaterialFilters): Promise<PaginatedResponse<Material[]>> {
    const queryParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const query = queryParams.toString();
    const endpoint = `/materials${query ? `?${query}` : ''}`;

    return this.request<PaginatedResponse<Material[]>>(endpoint);
  }

  async getMaterialById(id: string): Promise<ApiResponse<Material>> {
    return this.request<ApiResponse<Material>>(`/materials/${id}`);
  }

  async uploadMaterial(formData: FormData): Promise<ApiResponse> {
    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

    try {
      const response = await fetch(`${this.baseURL}/materials`, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle expired/invalid token
      if (response.status === 401 && this.token) {
        this.clearToken();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          window.location.href = '/';
        }
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Upload timeout - file may be too large or connection too slow');
      }
      throw error;
    }
  }

  async getPresignedUploadUrl(data: {
    fileName: string;
    fileSize: number;
    contentType: string;
    disciplineId: string;
  }): Promise<ApiResponse<{
    uploadUrl: string;
    publicUrl: string;
    filePath: string;
    fileName: string;
  }>> {
    return this.request<ApiResponse<{
      uploadUrl: string;
      publicUrl: string;
      filePath: string;
      fileName: string;
    }>>('/materials/presigned-url', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadToPresignedUrl(url: string, file: File, onProgress?: (progress: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Set timeout to 10 minutes for large files
      xhr.timeout = 10 * 60 * 1000;

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload. Please check your connection.'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout. File may be too large or connection too slow.'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  async confirmUpload(data: {
    title: string;
    description?: string;
    disciplineId: string;
    batchId?: string;
    courseCodeId?: string;
    category?: string;
    tags?: string[];
    filePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/materials/confirm-upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteMaterial(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/materials/${id}`, {
      method: 'DELETE',
    });
  }

  // Download material - authentication required
  async downloadMaterial(id: string): Promise<ApiResponse<{ downloadUrl: string; fileName: string }>> {
    return this.request<ApiResponse<{ downloadUrl: string; fileName: string }>>(
      `/materials/${id}/download`
    );
  }

  // Bookmark methods
  async toggleBookmark(materialId: string): Promise<ApiResponse<{ bookmarked: boolean }>> {
    return this.request<ApiResponse<{ bookmarked: boolean }>>(`/materials/${materialId}/bookmark`, {
      method: 'POST',
    });
  }

  async getBookmarks(page = 1, limit = 10): Promise<PaginatedResponse<Material[]>> {
    return this.request<PaginatedResponse<Material[]>>(`/materials/bookmarks/list?page=${page}&limit=${limit}`);
  }

  async checkBookmark(materialId: string): Promise<ApiResponse<{ bookmarked: boolean }>> {
    return this.request<ApiResponse<{ bookmarked: boolean }>>(`/materials/${materialId}/bookmark/status`);
  }

  // View history methods
  async trackView(materialId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/materials/${materialId}/view`, {
      method: 'POST',
    });
  }

  async getViewHistory(limit = 10): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/materials/history/views?limit=${limit}`);
  }

  // Share link methods
  async generateShareLink(materialId: string): Promise<ApiResponse<{ shareToken: string }>> {
    return this.request<ApiResponse<{ shareToken: string }>>(`/materials/${materialId}/share`, {
      method: 'POST',
    });
  }

  // Review methods
  async addReview(materialId: string, rating: number, review?: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/materials/${materialId}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating, review }),
    });
  }

  async getReviews(materialId: string, page = 1, limit = 10): Promise<ApiResponse<{
    reviews: any[];
    stats: { average: number; total: number; distribution: Record<number, number> };
  }>> {
    return this.request<ApiResponse<{
      reviews: any[];
      stats: { average: number; total: number; distribution: Record<number, number> };
    }>>(`/materials/${materialId}/reviews?page=${page}&limit=${limit}`);
  }

  // Test API connectivity
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      console.log('API not reachable:', error);
      return false;
    }
  }

  // Simple direct download fallback
  async downloadMaterialDirect(id: string): Promise<{ downloadUrl: string; fileName: string }> {
    console.log('Attempting direct download for material:', id);

    // Try multiple common file serving patterns
    const possibleUrls = [
      `${this.baseURL}/materials/${id}/download`,
      `${this.baseURL}/files/${id}`,
      `${this.baseURL}/materials/files/${id}`,
      `${this.baseURL}/uploads/${id}`,
      // If running locally, try without /api prefix
      `${this.baseURL.replace('/api', '')}/materials/${id}/download`,
      `${this.baseURL.replace('/api', '')}/files/${id}`,
    ];

    for (const url of possibleUrls) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.log('Found working download URL:', url);
          return {
            downloadUrl: url,
            fileName: `material-${id}`
          };
        }
      } catch (error) {
        // Continue to next URL
        console.log(`URL ${url} failed:`, error);
      }
    }

    throw new Error('No working download URL found');
  }
  async downloadMaterialPublic(id: string): Promise<{ downloadUrl: string; fileName: string }> {
    // First try the public endpoint
    const publicUrl = `${this.baseURL}/materials/${id}/download-public`;

    try {
      const response = await fetch(publicUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || data;
      }
    } catch (error) {
      console.log('Public endpoint not available, trying direct file access...');
    }

    // Fallback: Try to construct direct file URL
    // This assumes the backend serves files directly at /materials/files/{id}
    const directUrl = `${this.baseURL}/materials/files/${id}`;

    try {
      const response = await fetch(directUrl, {
        method: 'HEAD', // Check if file exists
      });

      if (response.ok) {
        const filename = response.headers.get('content-disposition')
          ? response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '')
          : 'download';

        return {
          downloadUrl: directUrl,
          fileName: filename || 'material'
        };
      }
    } catch (error) {
      console.log('Direct file access also failed');
    }

    // Final fallback: Use the regular endpoint but handle errors gracefully
    throw new Error('Material not found or no longer available');
  }

  async approveMaterial(id: string, status: 'approved' | 'rejected', rejectionReason?: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/materials/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    });
  }

  async getStats(): Promise<ApiResponse<{
    totalMaterials: number;
    activeUsers: number;
    totalDownloads: number;
    totalDisciplines: number;
    averageRating: number;
  }>> {
    return this.request<ApiResponse<{
      totalMaterials: number;
      activeUsers: number;
      totalDownloads: number;
      totalDisciplines: number;
      averageRating: number;
    }>>('/materials/stats');
  }

  // Get all disciplines (public endpoint for registration)
  async getDisciplines(): Promise<ApiResponse<Array<{ id: string; name: string; code: string }>>> {
    return this.request<ApiResponse<any>>('/filters/disciplines');
  }

  // Get basic filter options (authenticated)
  async getFilterOptions(): Promise<ApiResponse<{
    disciplines: Array<{ id: string; name: string; code: string }>;
    terms: Array<{ id: string; term: string; discipline_id: string }>;
    courseCodes: Array<{ id: string; code: string; title: string; discipline_id: string }>;
  }>> {
    return this.request<ApiResponse<any>>('/filters/options');
  }

  // Get trending searches (dynamic based on popular materials)
  async getTrendingSearches(): Promise<ApiResponse<string[]>> {
    return this.request<ApiResponse<string[]>>('/filters/trending');
  }

  // Course methods
  async createCourse(courseData: { code: string; title: string; disciplineId: string; year?: string; term?: string }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  }

  async getCourses(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/courses');
  }

  async updateCourse(courseId: string, courseData: { code?: string; title?: string; disciplineId?: string; year?: string; term?: string }): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  }

  async deleteCourse(courseId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/courses/${courseId}`, {
      method: 'DELETE',
    });
  }

  // Questions & Answers methods
  async getQuestions(filters?: any): Promise<ApiResponse<Question[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return this.request<ApiResponse<Question[]>>(`/questions${queryString ? `?${queryString}` : ''}`);
  }

  async getQuestion(id: string): Promise<ApiResponse<Question>> {
    return this.request<ApiResponse<Question>>(`/questions/${id}`);
  }

  async createQuestion(questionData: { title: string; content: string; disciplineId: string; batchId?: string; courseCodeId?: string; tags?: string[] } | FormData): Promise<ApiResponse> {
    const isFormData = questionData instanceof FormData;

    return this.request<ApiResponse>('/questions', {
      method: 'POST',
      body: isFormData ? questionData : JSON.stringify(questionData),
      headers: this.getHeaders(!isFormData), // Don't include Content-Type for FormData
    });
  }

  async createAnswer(questionId: string, answerData: { content: string } | FormData): Promise<ApiResponse> {
    const isFormData = answerData instanceof FormData;

    return this.request<ApiResponse>(`/questions/${questionId}/answers`, {
      method: 'POST',
      body: isFormData ? answerData : JSON.stringify(answerData),
      headers: this.getHeaders(!isFormData), // Don't include Content-Type for FormData
    });
  }

  async acceptAnswer(questionId: string, answerId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/questions/${questionId}/answers/${answerId}/accept`, {
      method: 'PUT',
    });
  }

  // User profile methods
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return this.request<ApiResponse<UserStats>>('/auth/stats');
  }

  async getUserMaterials(): Promise<ApiResponse<Material[]>> {
    return this.request<ApiResponse<Material[]>>('/materials/user/uploads');
  }

  async updateProfile(formData: FormData): Promise<ApiResponse> {
    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/auth/profile`, {
      method: 'PATCH',
      headers,
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle expired/invalid token
      if (response.status === 401 && this.token) {
        this.clearToken();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          window.location.href = '/';
        }
      }
      throw new Error(data.message || data.error || 'Failed to update profile');
    }

    return data;
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async deleteAccount(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/auth/account', {
      method: 'DELETE',
    });
  }

  // Super Admin functions
  async getAllUsers(params?: { page?: number; limit?: number; role?: string; search?: string }): Promise<PaginatedResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    return this.request<PaginatedResponse<any[]>>(`/super-admin/users${queryString ? `?${queryString}` : ''}`);
  }

  async updateUserRole(userId: string, role: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/super-admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/super-admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  async bulkApproveMaterials(materialIds: string[]): Promise<ApiResponse> {
    return this.request<ApiResponse>('/super-admin/materials/bulk-approve', {
      method: 'PATCH',
      body: JSON.stringify({ materialIds }),
    });
  }

  // Collections methods
  async getCollections(): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>('/collections');
  }

  async createCollection(data: { name: string; description?: string; isPublic?: boolean }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCollection(id: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/collections/${id}`);
  }

  async deleteCollection(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/collections/${id}`, {
      method: 'DELETE',
    });
  }

  async addToCollection(collectionId: string, materialId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/collections/${collectionId}/materials`, {
      method: 'POST',
      body: JSON.stringify({ materialId }),
    });
  }

  async removeFromCollection(collectionId: string, materialId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/collections/${collectionId}/materials/${materialId}`, {
      method: 'DELETE',
    });
  }

  // Schedule methods
  async getSchedules(filters?: any): Promise<PaginatedResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return this.request<PaginatedResponse<any[]>>(`/schedules?${params.toString()}`);
  }

  async getScheduleById(id: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/schedules/${id}`);
  }

  async createSchedule(data: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSchedule(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSchedule(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/schedules/${id}`, {
      method: 'DELETE',
    });
  }

  // Notification methods
  async getNotifications(unreadOnly = false): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`);
  }

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return this.request<ApiResponse<{ count: number }>>('/notifications/unread-count');
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  async deleteNotification(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin Dashboard methods
  async getAdminDashboardStats(dateRange?: '7d' | '30d' | '3m' | '1y'): Promise<ApiResponse<{
    stats: {
      totalUsers: number;
      totalMaterials: number;
      totalDownloads: number;
      pendingApprovals: number;
    };
    categoryDistribution: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
    topContributors: Array<{
      id: string;
      fullName: string;
      role: string;
      avatarUrl: string | null;
      uploadCount: number;
      badge: string;
    }>;
    recentActivity: Array<{
      id: string;
      type: string;
      title: string;
      userName: string;
      createdAt: string;
      status: string;
    }>;
  }>> {
    const url = dateRange ? `/materials/admin/dashboard-stats?dateRange=${dateRange}` : '/materials/admin/dashboard-stats';
    return this.request<ApiResponse<any>>(url);
  }

}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;