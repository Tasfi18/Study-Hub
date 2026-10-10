import { z } from 'zod';
import { AppConfig } from '../types';

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  PRODUCTION_FRONTEND_URL: z.string().url().optional(),
  EMAIL_REDIRECT_URL: z.string().url().optional(), // For email verification redirects
  MAX_FILE_SIZE: z.string().transform(Number).default('104857600'), // 100MB
  
  // Storage provider selection
  STORAGE_PROVIDER: z.enum(['supabase', 'cloudflare-r2', 'local']).default('supabase'),
  
  // Supabase configuration
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Cloudflare R2 configuration (optional)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),
  R2_ENDPOINT: z.string().url().optional(),
  
  // JWT configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment configuration:');
    if (error instanceof z.ZodError) {
      error.issues.forEach(issue => {
        console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
      });
    }
    process.exit(1);
  }
};

const env = parseEnv();

// Application configuration
export const config: AppConfig = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  frontendUrl: env.NODE_ENV === 'production' && env.PRODUCTION_FRONTEND_URL 
    ? env.PRODUCTION_FRONTEND_URL 
    : env.FRONTEND_URL,
  // Always use EMAIL_REDIRECT_URL if set, otherwise use production URL in production
  emailRedirectUrl: env.EMAIL_REDIRECT_URL ||
    (env.NODE_ENV === 'production'
      ? (env.PRODUCTION_FRONTEND_URL || 'https://kustudyhub.vercel.app')
      : env.FRONTEND_URL),
  maxFileSize: env.MAX_FILE_SIZE,
  
  // Storage configuration
  storage: {
    provider: env.STORAGE_PROVIDER,
  },
  
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // Cloudflare R2 configuration
  r2: {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucketName: env.R2_BUCKET_NAME,
    publicUrl: env.R2_PUBLIC_URL,
    endpoint: env.R2_ENDPOINT,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
  },
};

// Allowed file configurations
export const fileConfig = {
  allowedExtensions: [
    '.pdf', '.ppt', '.pptx', '.doc', '.docx', '.txt', 
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif',
    '.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v',
    '.zip', '.rar', '.7z'
  ],
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/x-m4v',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/octet-stream',
  ],
  maxFileSize: env.MAX_FILE_SIZE,
  storageBucket: 'study-materials',
};

export default config;