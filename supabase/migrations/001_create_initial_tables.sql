-- Migration 001: Create Initial Tables
-- Core tables, types, and indexes for Study Materials Management System

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types for better data integrity
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE material_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE material_type AS ENUM ('pdf', 'slide', 'note', 'assignment', 'other');
CREATE TYPE notification_type AS ENUM ('approval', 'rejection', 'download', 'system');

-- Disciplines/Departments table
CREATE TABLE disciplines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batches table
CREATE TABLE batches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    discipline_id UUID REFERENCES disciplines(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    semester VARCHAR(20) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    discipline_id UUID REFERENCES disciplines(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    student_id VARCHAR(20) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Course codes table for better organization
CREATE TABLE course_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    discipline_id UUID REFERENCES disciplines(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(discipline_id, code)
);

-- Study materials table
CREATE TABLE materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type material_type NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- Organization fields
    discipline_id UUID REFERENCES disciplines(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    course_code_id UUID REFERENCES course_codes(id) ON DELETE SET NULL,
    
    -- Upload and approval tracking
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status material_status DEFAULT 'pending',
    rejection_reason TEXT,
    
    -- Metadata
    tags TEXT[],
    download_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Download tracking table
CREATE TABLE downloads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_materials_discipline ON materials(discipline_id);
CREATE INDEX idx_materials_batch ON materials(batch_id);
CREATE INDEX idx_materials_course_code ON materials(course_code_id);
CREATE INDEX idx_materials_status ON materials(status);
CREATE INDEX idx_materials_uploaded_by ON materials(uploaded_by);
CREATE INDEX idx_materials_created_at ON materials(created_at DESC);
CREATE INDEX idx_materials_tags ON materials USING GIN (tags);
CREATE INDEX idx_downloads_material ON downloads(material_id);
CREATE INDEX idx_downloads_user ON downloads(user_id);
CREATE INDEX idx_downloads_timestamp ON downloads(downloaded_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_discipline ON profiles(discipline_id);
CREATE INDEX idx_profiles_batch ON profiles(batch_id);
