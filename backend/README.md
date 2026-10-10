# Study Materials Management System - Backend

A minimal backend service for Khulna University's study materials management platform, built with Express.js and Supabase.

## 🏗️ Architecture Overview

This backend serves as a minimal layer between the frontend and Supabase, handling:
- File uploads to Supabase Storage
- Custom business logic not available in Supabase
- Webhook processing for notifications
- Additional authentication middleware

Most functionality is handled directly by Supabase from the frontend for optimal performance.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Supabase project set up
- Environment variables configured

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Set up Supabase database:**
   ```bash
   # Run the schema file in your Supabase SQL editor
   # Copy contents of ../supabase/schema.sql
   
   # Run the seed file (optional)
   # Copy contents of ../supabase/seed.sql
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── routes/
│   ├── upload.js       # File upload handling
│   └── webhooks.js     # Webhook endpoints
├── middleware/
│   └── auth.js         # Authentication middleware
├── server.js           # Main application file
├── package.json        # Dependencies
└── .env.example        # Environment variables template
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `SUPABASE_URL` | Supabase project URL | - |
| `SUPABASE_ANON_KEY` | Supabase anon key | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | - |
| `MAX_FILE_SIZE` | Maximum file upload size | 10485760 (10MB) |

### Supabase Setup

1. **Create a new Supabase project**
2. **Set up Storage bucket:**
   ```sql
   -- Create storage bucket
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('study-materials', 'study-materials', true);
   ```

3. **Configure Storage policies:**
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Allow authenticated uploads" ON storage.objects
   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
   
   -- Allow public access to approved materials
   CREATE POLICY "Public access to materials" ON storage.objects
   FOR SELECT USING (bucket_id = 'study-materials');
   ```

## 📚 API Endpoints

### File Upload
```http
POST /api/upload/material
Authorization: Bearer <supabase-jwt-token>
Content-Type: multipart/form-data

Body:
- file: (File) The study material file
- title: (String) Material title
- description: (String) Optional description
- disciplineId: (UUID) Discipline ID
- batchId: (UUID) Optional batch ID
- courseCodeId: (UUID) Optional course code ID
- tags: (Array) Optional tags
```

### Webhooks
```http
POST /api/webhooks/material-approved
POST /api/webhooks/material-rejected
```

### Health Check
```http
GET /health
```

## 🔒 Security Features

- **Helmet.js** for security headers
- **Rate limiting** (100 requests per 15 minutes per IP)
- **CORS** configuration
- **File type validation**
- **File size limits**
- **JWT authentication** via Supabase
- **Role-based access control**

## 🎯 Usage Examples

### Upload a Study Material
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('title', 'Database Systems Notes');
formData.append('description', 'Comprehensive notes on DBMS');
formData.append('disciplineId', 'discipline-uuid');
formData.append('courseCodeId', 'course-uuid');

const response = await fetch('/api/upload/material', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${supabaseToken}`
    },
    body: formData
});
```

## 🚀 Deployment

### Production Setup

1. **Set production environment variables**
2. **Configure proper CORS origins**
3. **Set up file storage (Supabase Storage recommended)**
4. **Configure rate limiting for production load**
5. **Set up monitoring and logging**

### Deployment Options
- **Vercel** (recommended for Node.js apps)
- **Railway**
- **Heroku**
- **DigitalOcean App Platform**

## 🔧 Development

### Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests (when implemented)
```

### Adding New Routes
1. Create route file in `routes/` directory
2. Import and use in `server.js`
3. Add authentication middleware if needed

## 📈 Performance Considerations

- **File uploads** go directly to Supabase Storage
- **Database operations** use Supabase's optimized queries
- **Caching** can be added for frequently accessed data
- **CDN integration** through Supabase Storage

## 🤝 Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Write clear commit messages
5. Test your changes

## 📞 Support

For questions about this backend implementation, please refer to:
- Supabase documentation for database operations
- Express.js documentation for server configuration
- Project README for overall architecture
