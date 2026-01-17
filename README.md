# AI Lesson Planning System

An AI-powered lesson planning and assessment management platform for Malaysian teachers. This system helps educators create DSKP-aligned lesson plans, generate assessments, manage classes and students, grade submissions using OCR, and share resources with the community.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-Academic-blue.svg)

## Features

- **AI-Powered Lesson Planning** - Generate comprehensive lesson plans aligned with Malaysian DSKP standards
- **Multiple Assessment Types** - Create textbook exercises, essays, activities, and SPM exam papers
- **OCR-Based Grading** - Automatically grade student answer sheets using AI vision
- **Class Management** - Organize classes, track students, and monitor performance
- **Community Sharing** - Share and discover lesson plans from other educators
- **Analytics Dashboard** - Track student progress and class performance with detailed insights
- **PDF Export** - Export lesson plans, assessments, and reports to PDF format
- **Firebase Authentication** - Secure login with email/password or Google OAuth

## Tech Stack

**Frontend:**
- React 18.2 with React Router
- Ant Design + Material-UI + Bootstrap
- Firebase Authentication
- jsPDF for document generation

**Backend:**
- Node.js with Express 5.1
- MongoDB with Mongoose
- Google Gemini AI & OpenAI API
- JWT authentication
- Multer for file uploads

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (local installation or MongoDB Atlas account)
- [Git](https://git-scm.com/)
- A code editor (VS Code recommended)

You'll also need:
- Google Gemini API key (get from [Google AI Studio](https://makersuite.google.com/app/apikey))
- Firebase project (create at [Firebase Console](https://console.firebase.google.com/))
- OpenAI API key (optional, get from [OpenAI Platform](https://platform.openai.com/api-keys))

## Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd ai-lesson-planning
```

### 2. Install Dependencies

Install dependencies for all parts of the application:

```bash
# Install root dependencies (concurrently for running both servers)
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend/client
npm install
cd ../..
```

Or use the convenient script:

```bash
npm run install-all
```

### 3. Set Up MongoDB

**Option A: MongoDB Atlas (Recommended)**

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string (should look like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)
5. Whitelist your IP address (or use `0.0.0.0/0` for development)

**Option B: Local MongoDB**

1. Install MongoDB Community Edition
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB

   # macOS/Linux
   sudo systemctl start mongod
   ```
3. Your connection string will be: `mongodb://localhost:27017/ai-lesson-planning`

### 4. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
   - Enable "Google" (optional but recommended)
4. Get your Firebase configuration:
   - Go to Project Settings → General
   - Scroll down to "Your apps" → Web app
   - Copy the config values

### 5. Generate Encryption Secret

For encrypting API keys in the database, generate a 64-character hex string:

```bash
# On Linux/macOS
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use an online tool like https://www.random.org/strings/
```

### 6. Configure Environment Variables

#### Backend Configuration

Create `backend/.env` file:

```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-lesson-planning?retryWrites=true&w=majority

# Server
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRE=7

# Encryption Secret (64 character hex string)
ENCRYPTION_SECRET=your_64_character_hex_string_generated_above



# Firebase Admin (Optional - for advanced features)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

#### Frontend Configuration

Create `frontend/client/.env` file:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Important Notes:**
- Never commit `.env` files to version control
- Replace all placeholder values with your actual credentials
- The `ENCRYPTION_SECRET` must be exactly 64 characters (hex)
- Keep your API keys secure and never share them publicly

## Running the Application

### Option 1: Docker (Recommended for Production)

The easiest way to run the application is using Docker. This containerizes both the frontend and backend along with MongoDB.

#### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (includes Docker and Docker Compose)

#### Quick Start with Docker Compose

```bash
# 1. Clone the repository (if not already done)
git clone <your-repository-url>
cd ai-lesson-planning

# 2. Make sure backend/.env is configured (see Environment Variables section)

# 3. Build and start all services
docker-compose up --build

# 4. Access the application at http://localhost:5000
```

The application will be available at:
- **Application**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **MongoDB**: localhost:27017 (accessible from host)

To stop the application:
```bash
# Press Ctrl+C, then run:
docker-compose down

# To remove volumes (database data) as well:
docker-compose down -v
```

#### Build Docker Image Only

If you want to build just the application image without MongoDB:

```bash
# Build the image
docker build -t ai-lesson-planning:latest .

# Run the container (requires external MongoDB)
docker run -p 5000:5000 \
  --env-file backend/.env \
  -e MONGO_URI=your_mongodb_connection_string \
  ai-lesson-planning:latest

# Access at http://localhost:5000
```

#### Docker Commands Reference

```bash
# View running containers
docker ps

# View logs
docker-compose logs -f app

# Restart services
docker-compose restart

# Execute commands in running container
docker exec -it ai-lesson-planning-app sh

# Remove all containers and images
docker-compose down --rmi all
```

### Option 2: Development Mode (Without Docker)

**Run Both Servers Concurrently (Recommended)**

```bash
npm run dev
```

This will start both the backend (port 5000) and frontend (port 3000) simultaneously.

**Run Separately**

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

### Access the Application

**With Docker:**
- **Application**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

**Development Mode:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

### Option 3: Production Build (Without Docker)

```bash
# Build frontend
cd frontend/client
npm run build

# Start backend (serves built frontend)
cd ../../
NODE_ENV=production npm start
```

## First Time Setup

### 1. Create Your Account

1. Navigate to http://localhost:3000
2. Click "Register" or "Sign in with Google"
3. Fill in your details:
   - Name
   - Email
   - Password (if not using Google)
   - School Name
   - Gemini API Key (optional, can add later)

### 2. Add Your Gemini API Key

The system needs a Gemini API key to generate lesson plans and assessments:

1. Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. In the app, click your profile icon → Settings
3. Enter your Gemini API key
4. Click "Save"

### 3. Create Your First Class

1. Go to "Classes" from the sidebar
2. Click "Create New Class"
3. Fill in:
   - Class Name (e.g., "4A Science 2024")
   - Grade (e.g., "Form 4")
   - Subject (e.g., "English")
   - Year (e.g., "2024")
4. Click "Create"

### 4. Add Students (Optional)

1. Open your class
2. Go to "Students" tab
3. Click "Add Student"
4. Enter student details:
   - Name
   - Student ID
   - Email (optional)
   - Roll Number
5. Click "Add Student"

### 5. Generate Your First Lesson Plan

1. Go to "Lesson Planner" from sidebar
2. Click "Create New Lesson"
3. Follow the 4-step wizard:
   - **Step 1**: Choose class and proficiency level
   - **Step 2**: Select DSKP/SOW topic and HOTS focus
   - **Step 3**: Choose activity type and add notes
   - **Step 4**: Review and generate
4. Wait for AI to generate the lesson plan
5. View, edit, or export your lesson plan

## Project Structure

```
ai-lesson-planning/
├── backend/                 # Express.js backend
│   ├── server.js           # Entry point
│   ├── model/              # Mongoose models
│   ├── controller/         # Business logic
│   ├── route/              # API routes
│   ├── middleware/         # Auth & validation
│   └── utils/              # Utility functions
│
├── frontend/client/        # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API services
│   │   ├── context/       # React Context
│   │   ├── hooks/         # Custom hooks
│   │   └── routes.js      # Route configuration
│   └── public/
│
├── package.json           # Root package
└── README.md             # This file
```

## Available Scripts

### Root Level

```bash
npm run dev           # Run both backend and frontend concurrently
npm run server        # Run backend only
npm run client        # Run frontend only
npm run install-all   # Install all dependencies
npm run build         # Build frontend for production
npm start            # Start production server
```

### Backend (cd backend)

```bash
npm start            # Start server (production)
npm run server       # Start with nodemon (development)
```

### Frontend (cd frontend/client)

```bash
npm start            # Start development server
npm run build        # Build for production
npm test            # Run tests
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

```http
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login with email/password
POST   /api/auth/google            # Google OAuth login
POST   /api/auth/firebase-user     # Sync Firebase user
GET    /api/auth/me                # Get current user
PUT    /api/auth/profile           # Update profile
PUT    /api/auth/gemini-key        # Update Gemini API key
POST   /api/auth/logout            # Logout
```

### Class Endpoints

```http
GET    /api/classes                # Get all classes
POST   /api/classes                # Create new class
GET    /api/classes/:id            # Get class by ID
PUT    /api/classes/:id            # Update class
DELETE /api/classes/:id            # Delete class
```

### Lesson Endpoints

```http
GET    /api/lessons                # Get all lesson plans
POST   /api/lessons                # Create lesson plan
GET    /api/lessons/:id            # Get lesson by ID
PUT    /api/lessons/:id            # Update lesson
DELETE /api/lessons/:id            # Delete lesson
POST   /api/lessons/:id/share      # Share to community
```

### Assessment Endpoints

```http
GET    /api/assessment             # Get all assessments
POST   /api/assessment/generate    # Generate assessment
GET    /api/assessment/:id         # Get assessment by ID
PUT    /api/assessment/:id         # Update assessment
DELETE /api/assessment/:id         # Delete assessment
```

See [CLAUDE.md](./CLAUDE.md) for complete API documentation.

## Troubleshooting

### Docker-Related Issues

#### Docker Build Fails

**Problem**: `ERROR [internal] load metadata for docker.io/library/node:18-alpine`

**Solution**:
1. Check your internet connection
2. Ensure Docker Desktop is running
3. Try pulling the base image manually: `docker pull node:18-alpine`
4. Check Docker Hub status: https://status.docker.com/

#### Container Exits Immediately

**Problem**: Container starts then immediately stops

**Solution**:
```bash
# Check container logs
docker-compose logs app

# Common issues:
# 1. Missing .env file - ensure backend/.env exists
# 2. Invalid MONGO_URI - check database connection string
# 3. Port already in use - stop other services using port 5000
```

#### Cannot Connect to MongoDB in Docker

**Problem**: `MongoNetworkError: failed to connect to server`

**Solution**:
1. Ensure MongoDB container is running: `docker-compose ps`
2. Check MongoDB health: `docker-compose logs mongodb`
3. Wait for MongoDB to be fully ready (can take 10-30 seconds)
4. Verify MONGO_URI in docker-compose.yml matches database credentials

#### Docker Volume Permission Issues

**Problem**: Permission denied when accessing mounted volumes

**Solution**:
```bash
# On Linux/macOS, fix permissions
sudo chown -R $USER:$USER ./backend/uploads

# On Windows, run Docker Desktop as administrator
```

### MongoDB Connection Error

**Problem**: `MongoServerError: bad auth Authentication failed`

**Solution**:
1. Check your `MONGO_URI` in `backend/.env`
2. Verify database username and password are correct
3. Ensure IP address is whitelisted in MongoDB Atlas
4. Check if database user has correct permissions
5. If using Docker Compose, ensure MongoDB container is healthy

### Firebase Authentication Error

**Problem**: `Firebase: Error (auth/invalid-api-key)`

**Solution**:
1. Verify all Firebase config values in `frontend/client/.env`
2. Check Firebase console that web app is properly configured
3. Ensure authentication methods are enabled
4. Clear browser cache and try again

### AI Generation Timeout

**Problem**: Lesson plan or assessment generation times out

**Solution**:
1. Verify your Gemini API key is valid
2. Check you haven't exceeded API rate limits
3. Try with a simpler prompt or fewer requirements
4. Check your internet connection

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### PDF Export Not Working

**Problem**: PDF export produces blank file

**Solution**:
1. Ensure assessment has generated content
2. Check browser console for errors
3. Try updating jsPDF library: `npm update jspdf`
4. Clear browser cache

### Module Not Found Errors

**Problem**: `Cannot find module 'xyz'`

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or use the install-all script
npm run install-all
```

## Common Issues

### CORS Errors
- Check backend `corsOptions` in `server.js` includes your frontend URL
- Verify frontend is running on port 3000

### 401 Unauthorized
- Check if you're logged in
- Verify JWT token is being sent in Authorization header
- Check token hasn't expired

### Images Not Uploading
- Check file size limit (default 50MB in `server.js`)
- Verify multer configuration
- Ensure proper file format (JPG, PNG)

## Security Considerations

- Never commit `.env` files
- Rotate API keys regularly
- Use strong passwords for MongoDB users
- Enable Firebase App Check in production
- Use HTTPS in production
- Keep dependencies updated
- Review MongoDB Atlas security rules

## Contributing

This is an academic project (FYP). If you'd like to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

### Unit Tests

The project includes comprehensive unit tests for both backend and frontend.

| Component | Test Suites | Tests | Pass Rate |
|-----------|-------------|-------|-----------|
| **Backend** | 9 | 126 | ✅ 100% |
| **Frontend** | 7 | 58 | ✅ 100% |
| **Total** | **16** | **184** | **✅ 100%** |

#### Running Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

#### Running Frontend Tests

```bash
cd frontend/client

# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Google OAuth login
- [ ] Create and manage classes
- [ ] Add students to classes
- [ ] Generate lesson plan with AI
- [ ] Generate different assessment types
- [ ] Upload student answer images
- [ ] Grade student submissions
- [ ] View analytics dashboard
- [ ] Share lesson to community
- [ ] Download community lesson
- [ ] Export lesson plan to PDF
- [ ] Export assessment to PDF

### Testing User Accounts

For testing purposes, you can create multiple test accounts with different roles.

## Additional Resources

- **Detailed Documentation**: See [CLAUDE.md](./CLAUDE.md) for comprehensive technical documentation
- **MongoDB Documentation**: https://docs.mongodb.com/
- **React Documentation**: https://react.dev/
- **Express Documentation**: https://expressjs.com/
- **Firebase Documentation**: https://firebase.google.com/docs
- **Google Gemini API**: https://ai.google.dev/docs

## Support

If you encounter any issues:

1. Check this README and troubleshooting section
2. Review [CLAUDE.md](./CLAUDE.md) for detailed documentation
3. Check existing GitHub issues
4. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Error messages
   - Environment details (OS, Node version, etc.)

## License

This project is an academic Final Year Project (FYP) and is intended for educational purposes only.

## Acknowledgments

- Malaysian Education Ministry for DSKP standards
- Google for Gemini AI API
- OpenAI for GPT API
- Firebase for authentication services
- Open source community for amazing libraries

---

**Project**: AI Lesson Planning System
**Type**: Final Year Project (FYP1)
**Academic Year**: 2024/2025
**Last Updated**: January 2025

**Made with ❤️ for Malaysian Teachers**
