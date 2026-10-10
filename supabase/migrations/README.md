# Database Migrations

## Quick Setup (Recommended)

**Option 1: Run All at Once**
```sql
-- Copy and paste: run_all_migrations.sql in Supabase SQL Editor
```

**Option 2: Reset + Setup**  
```sql
-- 1. First run: migrations/000_drop_all_tables.sql (clears everything)
-- 2. Then run: run_all_migrations.sql (sets up fresh)
```

## Manual Setup (Step by Step)

Run these SQL files **in order** in Supabase Dashboard > SQL Editor:

### 0. Drop All Tables (Optional)
```sql
-- Run: migrations/000_drop_all_tables.sql
```
⚠️ **WARNING**: Deletes ALL tables and data! Use to start fresh.

### 1. Create Initial Tables
```sql
-- Run: migrations/001_create_initial_tables.sql
```
Creates tables, types, and indexes.

### 2. Add Triggers & Functions  
```sql
-- Run: migrations/002_add_triggers_and_functions.sql
```
Creates automatic profile creation trigger and utility functions.

### 3. Setup Row Level Security
```sql  
-- Run: migrations/003_setup_row_level_security.sql
```
Sets up Row Level Security policies (fixed for no circular references).

### 4. Add Admin Permissions
```sql
-- Run: migrations/004_add_admin_permissions.sql  
```
Adds admin/teacher permissions.

### 5. Fix User Registration
```sql
-- Run: migrations/005_fix_user_registration.sql  
```
Fixes user registration database errors.

### 6. Add Questions and Answers
```sql
-- Run: migrations/006_add_questions_and_answers.sql  
```
Adds Q&A functionality with questions and answers tables.

### 7. Add Material Category
```sql
-- Run: migrations/007_add_material_category.sql  
```
Adds category field to materials for better organization.

### 8. Add Image Material Type
```sql
-- Run: migrations/008_add_image_material_type.sql  
```
Adds 'image' as a valid material type for JPG, PNG, etc.

### 9. Add Image Attachments to Q&A
```sql
-- Run: migrations/009_add_image_attachments_to_qa.sql  
```
Enables image attachments for questions and answers.

### 10. Add Bookmarks
```sql
-- Run: migrations/010_add_bookmarks.sql  
```
Adds bookmark functionality for saving materials.

### 11. Add Reviews and Ratings
```sql
-- Run: migrations/011_add_reviews_ratings.sql  
```
Adds review and rating system for materials.

### 12. Add Video Material Type
```sql
-- Run: migrations/012_add_video_material_type.sql  
```
Adds 'video' as a valid material type for MP4, AVI, etc.

### 13. Add Delete Policy for Materials
```sql
-- Run: migrations/013_add_delete_policy_materials.sql  
```
Adds RLS policy allowing users to delete their own materials (admins can delete any).

## Files Overview

| File | Purpose | Safe to Re-run |
|------|---------|----------------|
| `000_drop_all_tables.sql` | 🗑️ Delete everything | ⚠️ DATA LOSS |
| `001_create_initial_tables.sql` | 🏗️ Create tables | ✅ Yes (IF NOT EXISTS) |
| `002_add_triggers_and_functions.sql` | ⚡ Add triggers | ✅ Yes (OR REPLACE) |
| `003_setup_row_level_security.sql` | 🔒 Security policies | ✅ Yes (DROP IF EXISTS) |
| `004_add_admin_permissions.sql` | 👑 Admin access | ✅ Yes (DROP IF EXISTS) |
| `005_fix_user_registration.sql` | 🔧 Fix registration | ✅ Yes (OR REPLACE) |
| `006_add_questions_and_answers.sql` | ❓ Q&A system | ✅ Yes (IF NOT EXISTS) |
| `007_add_material_category.sql` | 📁 Categories | ✅ Yes (IF NOT EXISTS) |
| `008_add_image_material_type.sql` | 🖼️ Image support | ✅ Yes (IF NOT EXISTS) |
| `009_add_image_attachments_to_qa.sql` | 📷 Q&A images | ✅ Yes (IF NOT EXISTS) |
| `010_add_bookmarks.sql` | 🔖 Bookmarks | ✅ Yes (IF NOT EXISTS) |
| `011_add_reviews_ratings.sql` | ⭐ Reviews | ✅ Yes (IF NOT EXISTS) |
| `012_add_video_material_type.sql` | 🎥 Video support | ✅ Yes (IF NOT EXISTS) |
| `013_add_delete_policy_materials.sql` | 🗑️ Delete policy | ✅ Yes (DROP IF EXISTS) |
| `run_all_migrations.sql` | 🚀 Run all above | ✅ Yes |

## What's Included

### Core Features
- ✅ **Tables**: Users, profiles, materials, disciplines, batches, course codes
- ✅ **Authentication**: Automatic profile creation on signup
- ✅ **Security**: Row Level Security policies for all tables
- ✅ **Permissions**: Admin and teacher role support

### Additional Features
- ✅ **Q&A System**: Questions and answers with voting
- ✅ **Categorization**: Material categories (CT questions, assignments, etc.)
- ✅ **Media Support**: Images and videos as material types
- ✅ **Image Attachments**: Support for images in Q&A
- ✅ **Bookmarks**: Save materials for later
- ✅ **Reviews & Ratings**: 5-star rating system
- ✅ **Delete Policy**: Users can delete their own materials

### Technical Improvements
- ❌ **Removed**: Circular RLS policy references that caused infinite recursion
- ✅ **Added**: CASCADE DELETE for proper cleanup
- ✅ **Fixed**: Simplified admin permissions using JWT claims
- ✅ **Organized**: Sequential migration files instead of one large schema
- ✅ **Added**: Reset script for easy cleanup

## Test After Setup

1. **User Registration**: Register new user → Profile should auto-create
2. **Admin Panel**: Visit `/admin` → Should load without errors
3. **Material Upload**: Upload a material → Should appear as pending
4. **Material Approval**: Admin approves → Status changes to approved
5. **Download**: Download approved material → Counter increments
6. **Bookmarks**: Bookmark a material → Shows in bookmarks page
7. **Reviews**: Rate a material → Average rating updates
8. **Q&A**: Post a question → Others can answer
9. **Delete**: Delete your own material → Should be removed
10. **Stats**: Dashboard shows real counts

## Troubleshooting

**Problem**: Migration fails  
**Solution**: Run `000_drop_all_tables.sql` then try again (⚠️ This deletes all data!)

**Problem**: RLS errors  
**Solution**: Make sure all migrations ran successfully in order

**Problem**: No profiles created  
**Solution**: Check if trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`

**Problem**: Can't delete materials  
**Solution**: Run migration 013 to add delete policy

**Problem**: Foreign key violations  
**Solution**: CASCADE DELETE should handle this, check migrations 001, 010, 011

**Problem**: Authentication errors  
**Solution**: Check JWT secret in environment variables matches Supabase
