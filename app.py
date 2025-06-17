from flask import Flask, request, jsonify, session, send_file, send_from_directory
from flask_cors import CORS
import sqlite3
import os
import uuid
import datetime
import hashlib
import json
from werkzeug.utils import secure_filename
import yt_dlp
import google.generativeai as genai
import ffmpeg
import faster_whisper
import re
import io
from datetime import timedelta
import aiohttp
import aiofiles
from cachetools import TTLCache
from sqlalchemy import create_engine, text
from concurrent.futures import ThreadPoolExecutor
import asyncio

# Configure Gemini API key
genai.configure(api_key=os.environ.get('GOOGLE_API_KEY'))

# Initialize Gemini 1.5 Flash model
model = genai.GenerativeModel("gemini-1.5-flash")

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app, supports_credentials=True)

# SQLite Database setup with SQLAlchemy
DATABASE = 'video_analysis.db'
UPLOAD_FOLDER = 'Uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm'}

# Create database engine with connection pooling
engine = create_engine(f'sqlite:///{DATABASE}', pool_size=5, max_overflow=10)

# Cache for transcripts and summaries (TTL: 1 hour)
cache = TTLCache(maxsize=100, ttl=3600)

# Thread pool for CPU-bound tasks
executor = ThreadPoolExecutor(max_workers=4)

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Create database and tables
def init_db():
    with engine.connect() as conn:
        conn.execute(text('''
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(100) NOT NULL,
            is_admin BOOLEAN DEFAULT 0
        )
        '''))
        
        conn.execute(text('''
        CREATE TABLE IF NOT EXISTS session (
            id VARCHAR(100) PRIMARY KEY,
            user_id INTEGER NOT NULL,
            title VARCHAR(200) NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_youtube BOOLEAN NOT NULL,
            video_path VARCHAR(200),
            youtube_id VARCHAR(50),
            transcript TEXT,
            summary TEXT,
            FOREIGN KEY (user_id) REFERENCES user(id)
        )
        '''))
        
        conn.execute(text('''
        CREATE TABLE IF NOT EXISTS conversation (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id VARCHAR(100) NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES session(id)
        )
        '''))
        
        conn.execute(text('''
        CREATE TABLE IF NOT EXISTS contact_message (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_read BOOLEAN DEFAULT 0
        )
        '''))
        
        # Create admin user if not exists
        result = conn.execute(text("SELECT * FROM user WHERE email = 'admin@example.com'")).mappings().fetchone()
        if not result:
            hashed_password = hashlib.sha256('admin123'.encode()).hexdigest()
            conn.execute(text("INSERT INTO user (username, email, password, is_admin) VALUES (:username, :email, :password, :is_admin)"),
                        {'username': 'Admin', 'email': 'admin@example.com', 'password': hashed_password, 'is_admin': 1})
        
        conn.commit()

init_db()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def is_authenticated():
    return 'user_id' in session

def is_admin():
    if 'user_id' in session:
        with engine.connect() as conn:
            user = conn.execute(text("SELECT is_admin FROM user WHERE id = :id"), {'id': session['user_id']}).mappings().fetchone()
            return user and user['is_admin'] == 1
    return False

async def check_youtube_video(youtube_url):
    ydl_opts = {
        'format': 'best[ext=mp4]',
        'simulate': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'quiet': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.extract_info(youtube_url, download=False)
            return True
    except Exception as e:
        print(f"Video availability check failed: {e}")
        return False

async def download_youtube_video(youtube_url, cookies_file=None):
    ydl_opts = {
        'format': 'best[ext=mp4]',
        'outtmpl': os.path.join(UPLOAD_FOLDER, '%(id)s.%(ext)s'),
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'sleep_interval': 1,
        'max_sleep_interval': 5,
        'quiet': True,
        'no_warnings': True
    }
    if cookies_file and os.path.exists(cookies_file):
        ydl_opts['cookiefile'] = cookies_file
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=True)
            video_id = info.get('id', '')
            title = info.get('title', 'Untitled Video')
            filename = f"{video_id}.mp4"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            return {
                'video_id': video_id,
                'title': title,
                'filepath': filepath
            }
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None

def transcribe_video(file_path):
    cache_key = f"transcript_{file_path}"
    if cache_key in cache:
        return cache[cache_key]
    
    try:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Video file not found: {file_path}")

        # Extract audio using FFmpeg with GPU acceleration
        output_audio = io.BytesIO()
        stream = ffmpeg.input(file_path).output('pipe:', format='wav', acodec='pcm_s16le', ar=16000, loglevel='quiet')
        audio_data, _ = ffmpeg.run(stream, capture_stdout=True)
        output_audio.write(audio_data)
        output_audio.seek(0)

        # Load faster-whisper model with CUDA
        whisper_model = faster_whisper.WhisperModel(model_size_or_path="base", device="cuda", compute_type="float16")

        # Transcribe audio
        segments, _ = whisper_model.transcribe(output_audio, language='en')
        transcript = "\n".join(
            f"[{str(timedelta(seconds=int(segment.start)))} - {str(timedelta(seconds=int(segment.end)))}] {segment.text.strip()}"
            for segment in segments
        )

        # Cache the transcript
        cache[cache_key] = transcript if transcript.strip() else "No transcription available."
        return cache[cache_key]
    except Exception as e:
        print(f"Transcription error: {e}")
        return "Error in transcription process."

def summarize_text(transcript):
    cache_key = f"summary_{hashlib.md5(transcript.encode()).hexdigest()}"
    if cache_key in cache:
        return cache[cache_key]
    
    try:
        prompt = f"You are a helpful assistant that provides concise and informative summaries of video content. Please provide a summary of the following transcript:\n\n{transcript}"
        response = model.generate_content(prompt, generation_config={"max_output_tokens": 500})
        cache[cache_key] = response.text
        return cache[cache_key]
    except Exception as e:
        print(f"Summarization error: {e}")
        return "Error in summarization process."

def answer_question(transcript, question):
    try:
        prompt = f"You are a helpful assistant that answers questions based on video transcripts. Based on the following transcript, please answer this question: '{question}'\n\nTranscript: {transcript}"
        response = model.generate_content(prompt, generation_config={"max_output_tokens": 500})
        return response.text
    except Exception as e:
        print(f"Question answering error: {e}")
        return "Error in processing your question."

@app.route('/')
def index():
    if is_authenticated():
        with engine.connect() as conn:
            user = conn.execute(text("SELECT * FROM user WHERE id = :id"), {'id': session['user_id']}).mappings().fetchone()
            return jsonify({"user": dict(user)})
    return jsonify({"message": "Not authenticated"})

@app.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/login', methods=['GET', 'POST'])
async def login():
    if request.method == 'POST':
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"message": "Email and password are required"}), 400
        
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        with engine.connect() as conn:
            user = conn.execute(text("SELECT * FROM user WHERE email = :email AND password = :password"),
                               {'email': email, 'password': hashed_password}).mappings().fetchone()
            
            if user:
                session['user_id'] = user['id']
                return jsonify({
                    "message": "Login successful", 
                    "user": {
                        "id": user['id'],
                        "username": user['username'],
                        "email": user['email'],
                        "is_admin": bool(user['is_admin'])
                    }
                })
            return jsonify({"message": "Invalid credentials"}), 401
    return jsonify({"message": "Please provide login credentials"}), 400

@app.route('/signup', methods=['GET', 'POST'])
async def signup():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({"message": "Username, email, and password are required"}), 400
        
        with engine.connect() as conn:
            existing_user = conn.execute(text("SELECT * FROM user WHERE email = :email"), {'email': email}).mappings().fetchone()
            
            if existing_user:
                return jsonify({"message": "Email already registered"}), 400
            
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
            
            conn.execute(text("INSERT INTO user (username, email, password) VALUES (:username, :email, :password)"),
                        {'username': username, 'email': email, 'password': hashed_password})
            conn.commit()
            
            new_user = conn.execute(text("SELECT * FROM user WHERE email = :email"), {'email': email}).mappings().fetchone()
            user_id = new_user['id']
            
            session['user_id'] = user_id
            return jsonify({
                "message": "Signup successful", 
                "user": {
                    "id": user_id,
                    "username": username,
                    "email": email,
                    "is_admin": False
                }
            })
    return jsonify({"message": "Please provide registration details"}), 400

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return jsonify({"message": "Logged out successfully"})

@app.route('/process', methods=['POST'])
async def process_video():
    if not is_authenticated():
        return jsonify({"message": "Authentication required"}), 401
    
    session_id = str(uuid.uuid4())
    user_id = session['user_id']
    
    is_youtube = False
    youtube_id = None
    video_path = None
    title = None
    cookies_file = None
    
    if 'youtube_url' in request.form:
        youtube_url = request.form.get('youtube_url')
        if not await check_youtube_video(youtube_url):
            return jsonify({"message": "Video is not accessible (private, restricted, or unavailable)"}), 400
        
        if 'cookies' in request.files:
            cookies = request.files['cookies']
            if cookies.filename != '':
                cookies_file = os.path.join(UPLOAD_FOLDER, secure_filename(cookies.filename))
                await asyncio.get_event_loop().run_in_executor(executor, cookies.save, cookies_file)
        
        result = await download_youtube_video(youtube_url, cookies_file)
        
        if cookies_file and os.path.exists(cookies_file):
            await asyncio.get_event_loop().run_in_executor(executor, os.remove, cookies_file)
        
        if not result:
            return jsonify({"message": "Failed to download YouTube video"}), 400
        
        is_youtube = True
        youtube_id = result['video_id']
        video_path = os.path.normpath(result['filepath']).replace(os.sep, '/')
        title = result['title']
        
    elif 'video' in request.files:
        file = request.files['video']
        if file.filename == '':
            return jsonify({"message": "No file selected"}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, f"{session_id}_{filename}")
            await asyncio.get_event_loop().run_in_executor(executor, file.save, file_path)
            video_path = os.path.normpath(file_path).replace(os.sep, '/')
            title = request.form.get('title', filename)
        else:
            return jsonify({"message": "Invalid file format"}), 400
    else:
        return jsonify({"message": "No video provided"}), 400
    
    transcript = await asyncio.get_event_loop().run_in_executor(executor, transcribe_video, video_path)
    summary = summarize_text(transcript)
    
    with engine.connect() as conn:
        conn.execute(text('''
        INSERT INTO session (id, user_id, title, is_youtube, video_path, youtube_id, transcript, summary)
        VALUES (:id, :user_id, :title, :is_youtube, :video_path, :youtube_id, :transcript, :summary)
        '''), {
            'id': session_id,
            'user_id': user_id,
            'title': title,
            'is_youtube': is_youtube,
            'video_path': video_path,
            'youtube_id': youtube_id,
            'transcript': transcript,
            'summary': summary
        })
        conn.commit()
    
    return jsonify({
        "message": "Video processed successfully",
        "session_id": session_id
    })

@app.route('/results/<session_id>')
def get_results(session_id):
    if not is_authenticated():
        return jsonify({"message": "Authentication required"}), 401
    
    with engine.connect() as conn:
        session_data = conn.execute(text("SELECT * FROM session WHERE id = :id"), {'id': session_id}).mappings().fetchone()
        
        if not session_data:
            return jsonify({"message": "Session not found"}), 404
        
        if session_data['user_id'] != session['user_id'] and not is_admin():
            return jsonify({"message": "Unauthorized"}), 403
        
        conversations = conn.execute(text("SELECT * FROM conversation WHERE session_id = :id ORDER BY timestamp DESC"),
                                   {'id': session_id}).mappings().fetchall()
        
        session_dict = dict(session_data)
        conversation_list = [dict(conv) for conv in conversations]
        
        video_url = None
        if session_dict['is_youtube'] and session_dict['youtube_id']:
            video_url = f"https://www.youtube.com/embed/{session_dict['youtube_id']}"
        elif session_dict['video_path']:
            video_url = f"{request.host_url}uploads/{session_dict['video_path'].split('/')[-1]}"
        
        return jsonify({
            "session": session_dict,
            "conversations": conversation_list,
            "video_url": video_url
        })

@app.route('/ask', methods=['POST'])
async def ask_question():
    if not is_authenticated():
        return jsonify({"message": "Authentication required"}), 401
    
    data = request.get_json()
    session_id = data.get('session_id')
    question = data.get('question')
    
    if not session_id or not question:
        return jsonify({"message": "Session ID and question are required"}), 400
    
    with engine.connect() as conn:
        session_data = conn.execute(text("SELECT transcript, user_id FROM session WHERE id = :id"),
                                  {'id': session_id}).mappings().fetchone()
        
        if not session_data:
            return jsonify({"message": "Session not found"}), 404
        
        if session_data['user_id'] != session['user_id'] and not is_admin():
            return jsonify({"message": "Unauthorized"}), 403
        
        transcript = session_data['transcript']
        
        answer = await asyncio.get_event_loop().run_in_executor(executor, answer_question, transcript, question)
        
        conn.execute(text('''
        INSERT INTO conversation (session_id, question, answer)
        VALUES (:session_id, :question, :answer)
        '''), {'session_id': session_id, 'question': question, 'answer': answer})
        conn.commit()
        
        conversation_id = conn.execute(text("SELECT last_insert_rowid()")).fetchone()[0]
        
        return jsonify({
            "answer": answer,
            "conversation_id": conversation_id
        })

@app.route('/download_transcript/<session_id>')
async def download_transcript(session_id):
    if not is_authenticated():
        return jsonify({"message": "Authentication required"}), 401
    
    with engine.connect() as conn:
        session_data = conn.execute(text("SELECT transcript, title, user_id FROM session WHERE id = :id"),
                                  {'id': session_id}).mappings().fetchone()
        
        if not session_data:
            return jsonify({"message": "Session not found"}), 404
        
        if session_data['user_id'] != session['user_id'] and not is_admin():
            return jsonify({"message": "Unauthorized"}), 403
        
        transcript = session_data['transcript']
        title = session_data['title']
        
        safe_title = re.sub(r'[^a-zA-Z0-9]', '_', title)
        temp_file = f"temp_{safe_title}_transcript.txt"
        
        async with aiofiles.open(temp_file, 'w', encoding='utf-8') as f:
            await f.write(f"Transcript for: {title}\n\n")
            await f.write(transcript)
        
        response = send_file(
            temp_file,
            as_attachment=True,
            download_name=f"{safe_title}_transcript.txt",
            mimetype='text/plain'
        )
        
        @response.call_on_close
        async def cleanup():
            if os.path.exists(temp_file):
                await asyncio.get_event_loop().run_in_executor(executor, os.remove, temp_file)
        
        return response

@app.route('/history')
def get_history():
    if not is_authenticated():
        return jsonify({"message": "Authentication required"}), 401
    
    user_id = session['user_id']
    
    with engine.connect() as conn:
        sessions = conn.execute(text("""
        SELECT s.id, s.title, s.timestamp, s.is_youtube, s.youtube_id, s.video_path, 
               COUNT(c.id) as conversation_count
        FROM session s
        LEFT JOIN conversation c ON s.id = c.session_id
        WHERE s.user_id = :user_id
        GROUP BY s.id
        ORDER BY s.timestamp DESC
        """), {'user_id': user_id}).mappings().fetchall()
        
        sessions_list = [dict(session) for session in sessions]
        
        return jsonify({
            "sessions": sessions_list
        })

@app.route('/delete_session/<session_id>', methods=['POST'])
async def delete_session(session_id):
    if not is_authenticated():
        return jsonify({"message": "Authentication required"}), 401
    
    user_id = session['user_id']
    
    with engine.connect() as conn:
        session_data = conn.execute(text("SELECT user_id FROM session WHERE id = :id"), {'id': session_id}).mappings().fetchone()
        
        if not session_data:
            return jsonify({"message": "Session not found"}), 404
        
        if session_data['user_id'] != user_id and not is_admin():
            return jsonify({"message": "Unauthorized"}), 403
        
        video_data = conn.execute(text("SELECT is_youtube, video_path FROM session WHERE id = :id"),
                                {'id': session_id}).mappings().fetchone()
        
        conn.execute(text("DELETE FROM conversation WHERE session_id = :id"), {'id': session_id})
        conn.execute(text("DELETE FROM session WHERE id = :id"), {'id': session_id})
        conn.commit()
        
        if not video_data['is_youtube'] and video_data['video_path']:
            if os.path.exists(video_data['video_path']):
                await asyncio.get_event_loop().run_in_executor(executor, os.remove, video_data['video_path'])
        
        return jsonify({"message": "Session deleted successfully"})

@app.route('/mark_message/<int:message_id>')
def mark_message(message_id):
    if not is_authenticated() or not is_admin():
        return jsonify({"message": "Unauthorized"}), 403
    
    with engine.connect() as conn:
        conn.execute(text("UPDATE contact_message SET is_read = 1 WHERE id = :id"), {'id': message_id})
        conn.commit()
        
        message = conn.execute(text("SELECT * FROM contact_message WHERE id = :id"), {'id': message_id}).mappings().fetchone()
        
        if not message:
            return jsonify({"message": "Message not found"}), 404
        
        return jsonify({"message": "Message marked as read", "data": dict(message)})

@app.route('/delete_message/<int:message_id>', methods=['POST'])
def delete_message(message_id):
    if not is_authenticated() or not is_admin():
        return jsonify({"message": "Unauthorized"}), 403
    
    with engine.connect() as conn:
        result = conn.execute(text("DELETE FROM contact_message WHERE id = :id"), {'id': message_id})
        conn.commit()
        
        if result.rowcount == 0:
            return jsonify({"message": "Message not found"}), 404
        
        return jsonify({"message": "Message deleted successfully"})

@app.route('/contact', methods=['GET', 'POST'])
async def contact():
    if request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        message = data.get('message')
        
        if not name or not email or not message:
            return jsonify({"message": "Name, email, and message are required"}), 400
        
        with engine.connect() as conn:
            conn.execute(text('''
            INSERT INTO contact_message (name, email, message)
            VALUES (:name, :email, :message)
            '''), {'name': name, 'email': email, 'message': message})
            conn.commit()
        
        return jsonify({"message": "Message sent successfully"})
    
    elif request.method == 'GET':
        if not is_authenticated() or not is_admin():
            return jsonify({"message": "Unauthorized"}), 403
        
        with engine.connect() as conn:
            messages = conn.execute(text("SELECT * FROM contact_message ORDER BY timestamp DESC")).mappings().fetchall()
            messages_list = [dict(message) for message in messages]
        
            return jsonify({
                "messages": messages_list
            })

@app.route('/about')
def about():
    return jsonify({
        "title": "About Our Video Analysis Platform",
        "content": "Our platform uses AI to analyze videos, providing transcriptions, summaries, and interactive Q&A capabilities."
    })

@app.route('/team')
def team():
    return jsonify({
        "team_members": [
            {
                "name": "John Doe",
                "role": "Founder & CEO",
                "bio": "AI enthusiast with 10+ years experience in machine learning."
            },
            {
                "name": "Jane Smith",
                "role": "CTO",
                "bio": "Expert in natural language processing and video analysis technologies."
            },
            {
                "name": "Mike Johnson",
                "role": "Lead Developer",
                "bio": "Full-stack developer specialized in building AI-powered applications."
            }
        ]
    })

@app.route('/update_profile', methods=['POST'])
async def update_profile():
    if not is_authenticated():
        return jsonify({"message": "Authentication required"}), 401
    
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    
    if not username or not email:
        return jsonify({"message": "Username and email are required"}), 400
    
    user_id = session['user_id']
    
    with engine.connect() as conn:
        existing_user = conn.execute(text("SELECT id FROM user WHERE email = :email AND id != :id"),
                                   {'email': email, 'id': user_id}).mappings().fetchone()
        
        if existing_user:
            return jsonify({"message": "Email already in use by another account"}), 400
        
        conn.execute(text("UPDATE user SET username = :username, email = :email WHERE id = :id"),
                    {'username': username, 'email': email, 'id': user_id})
        conn.commit()
        
        return jsonify({"message": "Profile updated successfully"})

@app.route('/change_password', methods=['POST'])
async def change_password():
    if not is_authenticated():
        return jsonify({"message": "Authentication required"}), 401
    
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({"message": "Current password and new password are required"}), 400
    
    user_id = session['user_id']
    hashed_current = hashlib.sha256(current_password.encode()).hexdigest()
    
    with engine.connect() as conn:
        user = conn.execute(text("SELECT * FROM user WHERE id = :id AND password = :password"),
                           {'id': user_id, 'password': hashed_current}).mappings().fetchone()
        
        if not user:
            return jsonify({"message": "Current password is incorrect"}), 400
        
        hashed_new = hashlib.sha256(new_password.encode()).hexdigest()
        conn.execute(text("UPDATE user SET password = :password WHERE id = :id"),
                    {'password': hashed_new, 'id': user_id})
        conn.commit()
        
        return jsonify({"message": "Password changed successfully"})

@app.route('/admin/stats')
def admin_stats():
    if not is_authenticated() or not is_admin():
        return jsonify({"message": "Unauthorized"}), 403
    
    with engine.connect() as conn:
        total_users = conn.execute(text("SELECT COUNT(*) FROM user")).fetchone()[0]
        total_sessions = conn.execute(text("SELECT COUNT(*) FROM session")).fetchone()[0]
        total_questions = conn.execute(text("SELECT COUNT(*) FROM conversation")).fetchone()[0]
        
        return jsonify({
            "total_users": total_users,
            "total_sessions": total_sessions,
            "total_videos": total_sessions,
            "total_questions": total_questions
        })

if __name__ == '__main__':
    
    app.run(debug=True)