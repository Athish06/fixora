# Fixora - AI-Powered Vulnerability Detection Platform

An intelligent vulnerability scanning platform that uses AI to discover custom code patterns, classify vulnerabilities, and auto-generate fixes.

## Features

- **AI-Powered Discovery**: Automatically detect custom wrappers, sinks, and sources in your codebase
- **Smart Classification**: Eliminate 85% of false positives using embedding-based analysis
- **Auto-Fix Generation**: Generate secure code fixes and create pull requests automatically
- **Real-time Scanning**: Scan repositories with live progress tracking
- **Multi-Repository Management**: Manage and monitor multiple repositories from a single dashboard
- **AI Knowledge Base**: Review and verify AI-discovered patterns
- **Comprehensive Activity Log**: Track all security events and user actions

## Tech Stack

- **Frontend**: React, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: FastAPI (Python), Motor (MongoDB async driver)
- **Database**: MongoDB
- **AI**: HuggingFace Inference API (configurable)
- **Authentication**: JWT-based authentication

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB (configured via environment variables)

### Installation

1. **Install Backend Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

2. **Install Frontend Dependencies**
```bash
cd frontend
yarn install
```

### Configuration

#### Backend Environment Variables (`backend/.env`)

```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=vulnscan_db

# JWT Security (IMPORTANT: Change this in production!)
SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars-for-security

# CORS (Update with your frontend URL in production)
CORS_ORIGINS=http://localhost:3000

# Optional: HuggingFace API
HF_TOKEN=
HF_MODEL_DETECTION=meta-llama/Llama-2-7b-chat-hf

# Optional: GitHub Integration
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

#### Frontend Environment Variables (`frontend/.env`)

```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8000
```

### GitHub Setup Guide

To connect and scan repositories, you'll need a GitHub Personal Access Token:

#### Step 1: Create a GitHub Personal Access Token

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/tokens
   - Or: Click your profile → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Generate New Token**
   - Click "Generate new token (classic)"
   - Give it a descriptive name: `Fixora Repository Access`
   - Set expiration as needed (recommend: 90 days)

3. **Select Required Scopes**
   - ✅ **repo** (Full control of private repositories)
     - repo:status
     - repo_deployment
     - public_repo
     - repo:invite
     - security_events
   - ✅ **read:user** (Read user profile data)
   - ✅ **user:email** (Access user email addresses)

4. **Generate and Copy Token**
   - Click "Generate token"
   - **Important**: Copy the token immediately (it won't be shown again)
   - Save it securely

#### Step 2: Configure Token in Fixora

1. **Login to Fixora**
2. **Go to Settings Page**
3. **Paste your GitHub token** in the "GitHub Personal Access Token" field
4. **Click "Save Token"**

#### Step 3: Connect Repositories

1. **Go to Repositories Page**
2. **Click "Connect Repository"**
3. **Enter Repository Details**:
   - **Name**: Repository name (e.g., `my-app`)
   - **Full Name**: owner/repository (e.g., `username/my-app`)
   - **URL**: Full GitHub URL (e.g., `https://github.com/username/my-app`)
   - **Language**: Primary language (e.g., `JavaScript`, `Python`)
   - **Description**: Optional description

4. **Click "Connect Repository"**
5. **Start Scanning**: Click "Start Scan" on the repository detail page

### HuggingFace API Setup

The application uses HuggingFace Inference API for vulnerability detection:

#### Step 1: Get HuggingFace Token

1. **Create/Login to HuggingFace Account**
   - Visit: https://huggingface.co/join

2. **Create Access Token**
   - Go to: https://huggingface.co/settings/tokens
   - Click "New token"
   - Name: `Fixora API Access`
   - Type: Select "Read" or "Fine-grained" with "Inference Providers" permission
   - Click "Generate a token"
   - Copy the token (starts with `hf_`)

#### Step 2: Configure in Fixora

1. **Go to Settings Page**
2. **Paste your HuggingFace token** in the API Token field
3. **Click "Save Token"**

Alternatively, you can set it directly in `/app/backend/.env`:
```env
HF_TOKEN=hf_your_token_here
```

### Running the Application

#### Development Mode

**Backend:**
```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
yarn start
```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`


## API Documentation

Once running, visit: `http://your-backend-url/docs` for interactive API documentation (Swagger UI).

## Usage Flow

### 1. **Authentication**
- Register a new account or login
- JWT token is stored and used for all authenticated requests

### 2. **Connect Repository**
- Navigate to Repositories
- Click "Connect Repository"
- Enter repository details
- Repository is now connected

### 3. **Start Scan**
- Click on a repository
- Click "Start Scan"
- Monitor progress in real-time
- View results when complete

### 4. **Review Vulnerabilities**
- View detected vulnerabilities on repository detail page
- Each vulnerability shows:
  - Severity (Critical, High, Medium, Low, Info)
  - AI confidence score
  - Code snippet
  - AI reasoning
  - Remediation suggestions

### 5. **Verify AI Patterns**
- Go to AI Knowledge Base
- Review patterns discovered by AI
- Verify or reject each pattern
- Improve AI accuracy over time

### 6. **Monitor Activity**
- View Activity Log for all security events
- Track scans, connections, and user actions
- Audit trail for compliance

## Security Notes

- **Never commit API tokens** to version control
- Use **environment variables** for all sensitive configuration
- **Rotate tokens** regularly (recommended: every 90 days)
- Use **fine-grained tokens** with minimal required permissions
- **Review API usage** regularly to detect unauthorized access

## Backend Structure

The backend follows a clean, modular architecture:

```
backend/
├── config/          # Configuration and database setup
│   ├── settings.py  # Application settings
│   └── database.py  # MongoDB connection
├── middleware/      # Authentication and other middleware
│   └── auth.py      # JWT authentication
├── routes/          # API route handlers
│   ├── auth_routes.py
│   ├── repository_routes.py
│   ├── vulnerability_routes.py
│   ├── scan_routes.py
│   ├── ai_pattern_routes.py
│   ├── pull_request_routes.py
│   ├── activity_routes.py
│   └── dashboard_routes.py
├── services/        # Business logic
│   ├── scan_service.py
│   └── activity_service.py
├── schemas/         # Pydantic models
│   ├── user.py
│   ├── repository.py
│   ├── vulnerability.py
│   └── ...
├── utils/           # Utility functions
│   ├── password.py  # Password hashing
│   └── jwt.py       # JWT token handling
└── server.py        # FastAPI application entry point
```

## Architecture

### Phase 1: Discovery
- Grep for common patterns
- AST analysis for custom wrappers/sinks
- One-shot AI prompts for pattern detection

### Phase 2: Static Scanning
- Traditional SAST tools
- Rule-based vulnerability detection

### Phase 3: AI Classification
- Embedding-based similarity matching
- Cluster analysis for false positive filtering
- Confidence scoring

### Phase 4: Auto-Fix
- AI-generated secure code
- LSP integration for compilation checks
- Automated PR creation

## Support

For issues or questions:
1. Check the Activity Log for error details
2. Review backend logs for API errors
3. Verify tokens are correctly configured
4. Ensure MongoDB connection is active

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please follow the standard fork, branch, and pull request workflow.
