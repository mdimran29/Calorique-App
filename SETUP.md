# 🚀 Calorique App Setup Guide

Complete setup instructions for the Nutrivora AI (Calorique) application.

## 📋 Prerequisites

- **Node.js** ≥ 18 LTS (download from [nodejs.org](https://nodejs.org))
- **npm** or **yarn** (comes with Node.js)
- **Git** (for version control)
- **MongoDB Atlas** account (free tier available)
- **Firebase** project
- **Google Gemini API** key
- **Cloudinary** account (for image uploads)

## ✅ Step 1: Clone & Install Dependencies

```bash
# Navigate to the project
cd ~/Desktop/Calorique-App

# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../Frontend
npm install

# Back to root
cd ..
```

**Verify Installation:**
```bash
# Check Node version
node --version  # Should be v18.0.0 or higher
npm --version
```

## 🔑 Step 2: Set Up Environment Variables

### Create Backend Environment File

```bash
# Copy the template
cp .env.example .env

# Edit the file with your credentials
nano .env
# or open with your preferred editor
```

### Required Environment Variables

#### 2.1 MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with username and password
4. Get the connection string (starts with `mongodb+srv://`)
5. Add to `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/calorique?retryWrites=true&w=majority
   ```

#### 2.2 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Copy the JSON content
6. Add to `.env`:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

#### 2.3 Google Gemini API

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Click "Get API Key"
3. Create a new key
4. Copy and add to `.env`:
   ```
   GEMINI_API_KEY=your-api-key-here
   ```

#### 2.4 Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com)
2. Go to Dashboard > Settings > API Keys
3. Copy the credentials and add to `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

#### 2.5 JWT Secrets

Generate secure random secrets:

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShift)
[Convert]::ToBase64String([System.Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes(32))
```

Add to `.env`:
```
JWT_ACCESS_SECRET=your-generated-secret-1
JWT_REFRESH_SECRET=your-generated-secret-2
```

### Complete .env Example

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/calorique?retryWrites=true&w=majority

# JWT
JWT_ACCESS_SECRET=base64-encoded-secret-here
JWT_REFRESH_SECRET=base64-encoded-secret-here

# Firebase
FIREBASE_PROJECT_ID=my-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@my-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Gemini AI
GEMINI_API_KEY=AIzaSy...

# Cloudinary
CLOUDINARY_CLOUD_NAME=my-cloud
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=secret-here
```

## 🏃 Step 3: Start Development Servers

### Terminal 1: Start Backend

```bash
cd Backend
npm run dev
```

Expected output:
```
🚀 Calorique API running on http://localhost:5000
🌍 Environment: development
📡 Health check: http://localhost:5000/api/v1/health
```

### Terminal 2: Start Frontend

```bash
cd Frontend
npm run dev
```

Expected output:
```
VITE v6.3.5  ready in XXX ms

➜  Local:   http://localhost:5173/
```

## ✔️ Step 4: Verify Setup

### Check Backend Health

```bash
curl http://localhost:5000/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-07-14T12:00:00Z"
}
```

### Open Frontend

Visit `http://localhost:5173` in your browser

## 📁 Project Structure

```
Calorique-App/
├── Backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Firebase, Gemini, Cloudinary setup
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, validation
│   │   └── server.ts       # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── Frontend/                # Vite + React app
│   ├── src/
│   │   ├── api/            # API client functions
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # Page components
│   │   ├── store/          # Zustand state
│   │   └── App.tsx         # App entry
│   ├── package.json
│   └── vite.config.ts
│
├── .env.example            # Environment template
├── SETUP.md               # This file
├── Architecture.md        # System design
├── api.md                # API documentation
├── backend.md            # Backend architecture
├── frontend.md           # Frontend architecture
└── Readme.md            # Project overview
```

## 🔧 Available Scripts

### Backend

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Run built server
npm run lint     # Run ESLint
```

### Frontend

```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🐛 Troubleshooting

### Backend won't start

**Error: "Cannot find module 'dotenv'"**
- Solution: Run `npm install` in the Backend directory

**Error: "MONGODB_URI is not defined"**
- Solution: Check that `.env` file exists and has `MONGODB_URI` set correctly

**Error: "Firebase initialization failed"**
- Solution: Verify `FIREBASE_PRIVATE_KEY` includes newlines: `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`

### Frontend port already in use

```bash
# Kill process on port 5173
# On macOS/Linux:
lsof -ti:5173 | xargs kill -9

# On Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Cannot connect to backend from frontend

- Check that backend is running on `http://localhost:5000`
- Update `VITE_API_URL` in frontend `.env` if using different port
- Check for CORS issues in browser console

### MongoDB connection timeout

- Verify MongoDB Atlas connection string format
- Check that your IP is whitelisted in MongoDB Atlas (Network Access)
- Ensure username/password are correct

## 📚 Documentation

- **[Architecture.md](./Architecture.md)** — System design and data flows
- **[api.md](./api.md)** — Complete API endpoint reference
- **[backend.md](./backend.md)** — Backend architecture and database schemas
- **[frontend.md](./frontend.md)** — Frontend architecture and state management

## 🚀 Next Steps

1. ✅ Complete setup (you are here)
2. 📖 Read [Architecture.md](./Architecture.md) for system overview
3. 🔌 Explore [api.md](./api.md) for available endpoints
4. 💻 Check [frontend.md](./frontend.md) for component structure
5. ⚙️ Review [backend.md](./backend.md) for database schemas

## 🆘 Need Help?

- Check the documentation files listed above
- Review error messages in console/logs
- Check `.env` file is correctly configured
- Verify all services (MongoDB, Firebase) are accessible

---

**Happy coding! 🎉**
