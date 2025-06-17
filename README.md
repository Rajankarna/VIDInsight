
# AI-Powered Video Summarization, Transcription, and Q&A

This project provides an AI-powered platform for analyzing videos, generating transcripts, summaries, and allowing users to ask questions about video content.

## Features

- User authentication (signup, login, logout)
- Video processing from local uploads or YouTube links
- AI-powered transcription and summarization
- Question and answer functionality based on video content
- User dashboard with analytics
- Video history management
- Contact form for user inquiries
- Admin dashboard for managing contact messages

## Project Structure

- `app.py`: Flask backend with API endpoints
- `src/`: React frontend components and pages
- `uploads/`: Directory where uploaded videos are stored
- `video_analysis.db`: SQLite database for storing user data, sessions, and conversations

## Backend Setup

1. Install Python dependencies:
```
pip install -r requirements.txt
```

2. Set your OpenAI API key:
```
export OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the Flask application:
```
python app.py
```

The Flask server will start on http://localhost:5000

## Frontend Setup

1. Install Node.js and npm (if not already installed)

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

The React application will start on http://localhost:5173

## API Endpoints

- `POST /login`: User login
- `POST /signup`: User registration
- `GET /logout`: User logout
- `GET /`: Home route, returns user data if authenticated
- `POST /process`: Process video (upload or YouTube URL)
- `GET /results/<session_id>`: Get results for a specific session
- `POST /ask`: Ask a question about a video
- `GET /download_transcript/<session_id>`: Download video transcript
- `GET /history`: Get user's video history
- `GET /dashboard`: Get user's dashboard data
- `POST /delete_session/<session_id>`: Delete a session
- `GET /mark_message/<message_id>`: Mark contact message as read (admin only)
- `POST /delete_message/<message_id>`: Delete contact message (admin only)
- `GET/POST /contact`: Submit or retrieve contact messages
- `GET /about`: Get about page content
- `GET /team`: Get team page content

## Database Schema

### User Table
- id: INTEGER PRIMARY KEY
- username: VARCHAR(50)
- email: VARCHAR(100)
- password: VARCHAR(100) (stored as SHA-256 hash)
- is_admin: BOOLEAN

### Session Table
- id: VARCHAR(100) PRIMARY KEY
- user_id: INTEGER
- title: VARCHAR(200)
- timestamp: DATETIME
- is_youtube: BOOLEAN
- video_path: VARCHAR(200)
- youtube_id: VARCHAR(50)
- transcript: TEXT
- summary: TEXT

### Conversation Table
- id: INTEGER PRIMARY KEY
- session_id: VARCHAR(100)
- question: TEXT
- answer: TEXT
- timestamp: DATETIME

### Contact Message Table
- id: INTEGER PRIMARY KEY
- name: VARCHAR(100)
- email: VARCHAR(100)
- message: TEXT
- timestamp: DATETIME
- is_read: BOOLEAN

## Default Admin Account
- Email: admin@example.com
- Password: admin123
