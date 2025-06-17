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
from moviepy.editor import VideoFileClip
import whisper
import re
import tempfile
from datetime import timedelta

# Configure Gemini API key
genai.configure(api_key=os.environ.get('GOOGLE_API_KEY'))

# Initialize Gemini 1.5 Flash model
model = genai.GenerativeModel("gemini-1.5-flash")

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management
CORS(app, supports_credentials=True)

# SQLite Database setup
DATABASE = 'video_analysis.db'
UPLOAD_FOLDER = 'Uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Create database and tables if they don't exist
def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        is_admin BOOLEAN DEFAULT 0
    )
    ''')
    
    # Sessions table with added fields: english_transcript and language
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS session (
        id VARCHAR(100) PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(200) NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_youtube BOOLEAN NOT NULL,
        video_path VARCHAR(200),
        youtube_id VARCHAR(50),
        transcript TEXT,
        english_transcript TEXT,
        summary TEXT,
        language VARCHAR(10),
        FOREIGN KEY (user_id) REFERENCES user(id)
    )
    ''')
    
    # Conversations table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS conversation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id VARCHAR(100) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES session(id)
    )
    ''')
    
    # Contact messages table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS contact_message (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT 0
    )
    ''')
    
    # Create an admin user if not exists
    cursor.execute("SELECT * FROM user WHERE email = 'admin@example.com'")
    if not cursor.fetchone():
        hashed_password = hashlib.sha256('admin123'.encode()).hexdigest()
        cursor.execute("INSERT INTO user (username, email, password, is_admin) VALUES (?, ?, ?, ?)",
                      ('Admin', 'admin@example.com', hashed_password, 1))
    
    conn.commit()
    conn.close()

# Initialize the database
init_db()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def is_authenticated():
    return 'user_id' in session

def is_admin():
    if 'user_id' in session:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT is_admin FROM user WHERE id = ?", (session['user_id'],))
        user = cursor.fetchone()
        conn.close()
        return user and user['is_admin'] == 1
    return False

# Function to check YouTube video accessibility
def check_youtube_video(youtube_url):
    ydl_opts = {
        'format': 'best[ext=mp4]',
        'simulate': True,  # Don't download, just check
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

# YouTube video download function
def download_youtube_video(youtube_url, cookies_file=None):
    ydl_opts = {
        'format': 'best[ext=mp4]',  # Simpler format to avoid throttling
        'outtmpl': os.path.join(UPLOAD_FOLDER, '%(id)s.%(ext)s'),
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'sleep_interval': 1,  # Mitigate rate-limiting
        'max_sleep_interval': 5,
        'verbose': True,  # For debugging
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
            print(f"YouTube video saved at: {filepath}")
            print(f"YouTube video exists: {os.path.exists(filepath)}")
            return {
                'video_id': video_id,
                'title': title,
                'filepath': filepath
            }
    
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None

# Function to transcribe video using Whisper with timestamps and translation if necessary
def transcribe_video(file_path):
    try:
        # Validate file existence
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Video file not found: {file_path}")

        # Extract audio from video
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio_file:
            video = VideoFileClip(file_path)
            video.audio.write_audiofile(temp_audio_file.name, codec='pcm_s16le', fps=16000)
            video.audio.close()
            video.close()

            # Load Whisper model (base for speed/accuracy balance)
            whisper_model = whisper.load_model("base")

            # Transcribe audio in original language
            result = whisper_model.transcribe(temp_audio_file.name, task="transcribe")
            original_text = result['text']
            segments = result['segments']
            language = result['language']

            # Format original transcript with timestamps
            formatted_transcript = "\n".join(
                f"[{str(timedelta(seconds=int(segment['start'])))} - {str(timedelta(seconds=int(segment['end'])))}] {segment['text'].strip()}"
                for segment in segments
            )

            # Get English translation if not English
            if language != 'en':
                translation_result = whisper_model.transcribe(temp_audio_file.name, task="translate")
                english_text = translation_result['text']
            else:
                english_text = original_text

        # Clean up temporary file
        os.unlink(temp_audio_file.name)

        # Return formatted original transcript, English text, and language
        if not formatted_transcript.strip():
            return "No transcription available.", None, None
        return formatted_transcript, english_text, language
    except Exception as e:
        print(f"Transcription error: {e}")
        return "Error in transcription process.", None, None

# Function to summarize text using Gemini 1.5 Flash
def summarize_text(english_transcript):
    try:
        prompt = f"You are a helpful assistant that provides concise and informative summaries of video content. Please provide a summary of the following transcript:\n\n{english_transcript}"
        response = model.generate_content(prompt, generation_config={"max_output_tokens": 500})
        return response.text
    except Exception as e:
        print(f"Summarization error: {e}")
        return "Error in summarization process."

# Function to answer questions about the video
def answer_question(english_transcript, question):
    try:
        prompt = f"You are a helpful assistant that answers questions based on video transcripts. Based on the following transcript, please answer this question: '{question}'\n\nTranscript: {english_transcript}"
        response = model.generate_content(prompt, generation_config={"max_output_tokens": 500})
        return response.text
    except Exception as e:
        print(f"Question answering error: {e}")
        return "Error in processing your question."

# Routes
@app.route('/')
def index():
    if is_authenticated():
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user WHERE id = ?", (session['user_id'],))
        user = cursor.fetchone()
        conn.close()
        return jsonify({"user": dict(user)})
    return jsonify({"message": "Not authenticated"})

@app.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"message": "Email and password are required"}), 400
        
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user WHERE email = ? AND password = ?", (email, hashed_password))
        user = cursor.fetchone()
        conn.close()
        
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
def signup():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({"message": "Username, email, and password are required"}), 400
        
        # Check if user already exists
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user WHERE email = ?", (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            conn.close()
            return jsonify({"message": "Email already registered"}), 400
        
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        cursor.execute("INSERT INTO user (username, email, password) VALUES (?, ?, ?)",
                      (username, email, hashed_password))
        conn.commit()
        
        # Get the newly created user
        cursor.execute("SELECT * FROM user WHERE email = ?", (email,))
        new_user = cursor.fetchone()
        user_id = new_user['id']
        conn.close()
        
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
def process_video():
    if not is_authenticated():
        return jsonify({"message": "Authentication required"}), 401
    
    session_id = str(uuid.uuid4())
    user_id = session['user_id']
    
    # Check if it's a YouTube link or file upload
    is_youtube = False
    youtube_id = None
    video_path = None
    title = None
    cookies_file = None
    
    if 'youtube_url' in request.form:
        # Process YouTube URL
        youtube_url = request.form.get('youtube_url')
        # Check video accessibility
        if not check_youtube_video(youtube_url):
            return jsonify({"message": "Video is not accessible (private, restricted, or unavailable)"}), 400
        
        # Handle cookies file if provided
        if 'cookies' in request.files:
            cookies = request.files['cookies']
            if cookies.filename != '':
                cookies_file = os.path.join(UPLOAD_FOLDER, secure_filename(cookies.filename))
                cookies.save(cookies_file)
        
        result = download_youtube_video(youtube_url, cookies_file)
        
        # Clean up cookies file
        if cookies_file and os.path.exists(cookies_file):
            os.remove(cookies_file)
        
        if not result:
            return jsonify({"message": "Failed to download YouTube video"}), 400
        
        is_youtube = True
        youtube_id = result['video_id']
        # Normalize video_path to use forward slashes
        video_path = os.path.normpath(result['filepath']).replace(os.sep, '/')
        title = result['title']
        
    elif 'video' in request.files:
        # Process uploaded file
        file = request.files['video']
        if file.filename == '':
            return jsonify({"message": "No file selected"}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, f"{session_id}_{filename}")
            file.save(file_path)
            print(f"Uploaded file saved at: {file_path}")
            print(f"Uploaded file exists: {os.path.exists(file_path)}")
            
            # Normalize video_path to use forward slashes
            video_path = os.path.normpath(file_path).replace(os.sep, '/')
            title = request.form.get('title', filename)
        else:
            return jsonify({"message": "Invalid file format"}), 400
    else:
        return jsonify({"message": "No video provided"}), 400
    
    # Transcribe the video
    transcript, english_transcript, language = transcribe_video(video_path)
    
    if transcript == "Error in transcription process.":
        return jsonify({"message": "Transcription failed"}), 500
    
    # Summarize the english_transcript
    summary = summarize_text(english_transcript)
    
    # Save to database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO session (id, user_id, title, is_youtube, video_path, youtube_id, transcript, english_transcript, summary, language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (session_id, user_id, title, is_youtube, video_path, youtube_id, transcript, english_transcript, summary, language))
    conn.commit()
    conn.close()
    
    return jsonify({
        "message": "Video processed successfully",
        "session_id": session_id
    })

@app.route('/results/<session_id>')
def get_results(session_id):
    if not is_authenticated():
        return jsonify({"message": "Authentication required"}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get session data
    cursor.execute("SELECT * FROM session WHERE id = ?", (session_id,))
    session_data = cursor.fetchone()
    
    if not session_data:
        conn.close()
        return jsonify({"message": "Session not found"}), 404
    
    # Check if user owns this session or is admin
    if session_data['user_id'] != session['user_id'] and not is_admin():
        conn.close()
        return jsonify({"message": "Unauthorized"}), 403
    
    # Get conversations for this session
    cursor.execute("SELECT * FROM conversation WHERE session_id = ? ORDER BY timestamp DESC", (session_id,))
    conversations = cursor.fetchall()
    
    # Convert to dictionary
    session_dict = dict(session_data)
    conversation_list = [dict(conv) for conv in conversations]
    
    conn.close()
    
    # If it's a YouTube video, we need to provide the embed URL
    video_url = None
    if session_dict['is_youtube'] and session_dict['youtube_id']:
        video_url = f"https://www.youtube.com/embed/{session_dict['youtube_id']}"
    elif session_dict['video_path']:
        # Ensure video_path is a full URL
        video_url = f"{request.host_url}uploads/{session_dict['video_path'].split('/')[-1]}"
    
    return jsonify({
        "session": session_dict,
        "conversations": conversation_list,
        "video_url": video_url
    })

@app.route('/ask', methods=['POST'])
def ask_question():
    if not is_authenticated():
        return jsonify({"message": "Authentication required"}), 401
    
    data = request.get_json()
    session_id = data.get('session_id')
    question = data.get('question')
    
    if not session_id or not question:
        return jsonify({"message": "Session ID and question are required"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get english_transcript from session
    cursor.execute("SELECT english_transcript, user_id FROM session WHERE id = ?", (session_id,))
    session_data = cursor.fetchone()
    
    if not session_data:
        conn.close()
        return jsonify({"message": "Session not found"}), 404
    
    # Check if user owns this session or is admin
    if session_data['user_id'] != session['user_id'] and not is_admin():
        conn.close()
        return jsonify({"message": "Unauthorized"}), 403
    
    english_transcript = session_data['english_transcript']
    
    # Generate answer from Gemini
    answer = answer_question(english_transcript, question)
    
    # Save conversation to database
    cursor.execute('''
    INSERT INTO conversation (session_id, question, answer)
    VALUES (?, ?, ?)
    ''', (session_id, question, answer))
    
    conn.commit()
    conversation_id = cursor.lastrowid
    
    conn.close()
    
    return jsonify({
        "answer": answer,
        "conversation_id": conversation_id
    })

@app.route('/download_transcript/<session_id>')
def download_transcript(session_id):
    if not is_authenticated():
        return jsonify({"message": "Authentication required"}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT transcript, title, user_id FROM session WHERE id = ?", (session_id,))
    session_data = cursor.fetchone()
    
    if not session_data:
        conn.close()
        return jsonify({"message": "Session not found"}), 404
    
    # Check if user owns this session or is admin
    if session_data['user_id'] != session['user_id'] and not is_admin():
        conn.close()
        return jsonify({"message": "Unauthorized"}), 403
    
    transcript = session_data['transcript']
    title = session_data['title']
    
    conn.close()
    
    # Create a temporary file
    safe_title = re.sub(r'[^a-zA-Z0-9]', '_', title)
    temp_file = f"temp_{safe_title}_transcript.txt"
    with open(temp_file, 'w', encoding='utf-8') as f:
        f.write(f"Transcript for: {title}\n\n")
        f.write(transcript)
    
    # Send file for download
    response = send_file(
        temp_file,
        as_attachment=True,
        download_name=f"{safe_title}_transcript.txt",
        mimetype='text/plain'
    )
    
    # Clean up after sending
    @response.call_on_close
    def cleanup():
        if os.path.exists(temp_file):
            os.remove(temp_file)
    
    return response

@app.route('/history')
def get_history():
    if not is_authenticated():
        return jsonify({"message": "Authentication required"}), 401
    
    user_id = session['user_id']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get all sessions for this user
    cursor.execute("""
    SELECT s.id, s.title, s.timestamp, s.is_youtube, s.youtube_id, s.video_path, 
           COUNT(c.id) as conversation_count
    FROM session s
    LEFT JOIN conversation c ON s.id = c.session_id
    WHERE s.user_id = ?
    GROUP BY s.id
    ORDER BY s.timestamp DESC
    """, (user_id,))
    
    sessions = cursor.fetchall()
    sessions_list = [dict(session) for session in sessions]
    
    conn.close()
    
    return jsonify({
        "sessions": sessions_list
    })

@app.route('/delete_session/<session_id>', methods=['POST'])
def delete_session(session_id):
    if not is_authenticated():
        return jsonify({"message": "Authentication required"}), 401
    
    user_id = session['user_id']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verify session belongs to user or user is admin
    cursor.execute("SELECT user_id FROM session WHERE id = ?", (session_id,))
    session_data = cursor.fetchone()
    
    if not session_data:
        conn.close()
        return jsonify({"message": "Session not found"}), 404
    
    if session_data['user_id'] != user_id and not is_admin():
        conn.close()
        return jsonify({"message": "Unauthorized"}), 403
    
    # Get video path to delete file if it's not a YouTube video
    cursor.execute("SELECT is_youtube, video_path FROM session WHERE id = ?", (session_id,))
    video_data = cursor.fetchone()
    
    # Delete associated conversations first
    cursor.execute("DELETE FROM conversation WHERE session_id = ?", (session_id,))
    
    # Delete session
    cursor.execute("DELETE FROM session WHERE id = ?", (session_id,))
    
    conn.commit()
    conn.close()
    
    # Delete video file if it exists and isn't a YouTube video
    if not video_data['is_youtube'] and video_data['video_path']:
        if os.path.exists(video_data['video_path']):
            os.remove(video_data['video_path'])
    
    return jsonify({"message": "Session deleted successfully"})

@app.route('/mark_message/<int:message_id>')
def mark_message(message_id):
    if not is_authenticated() or not is_admin():
        return jsonify({"message": "Unauthorized"}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("UPDATE contact_message SET is_read = 1 WHERE id = ?", (message_id,))
    conn.commit()
    
    # Check if message exists and was updated
    cursor.execute("SELECT * FROM contact_message WHERE id = ?", (message_id,))
    message = cursor.fetchone()
    
    conn.close()
    
    if not message:
        return jsonify({"message": "Message not found"}), 404
    
    return jsonify({"message": "Message marked as read", "data": dict(message)})

@app.route('/delete_message/<int:message_id>', methods=['POST'])
def delete_message(message_id):
    if not is_authenticated() or not is_admin():
        return jsonify({"message": "Unauthorized"}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM contact_message WHERE id = ?", (message_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"message": "Message not found"}), 404
    
    conn.close()
    
    return jsonify({"message": "Message deleted successfully"})

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        message = data.get('message')
        
        if not name or not email or not message:
            return jsonify({"message": "Name, email, and message are required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT INTO contact_message (name, email, message)
        VALUES (?, ?, ?)
        ''', (name, email, message))
        
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Message sent successfully"})
    
    elif request.method == 'GET':
        # Admin only endpoint to get all messages
        if not is_authenticated() or not is_admin():
            return jsonify({"message": "Unauthorized"}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM contact_message ORDER BY timestamp DESC")
        messages = cursor.fetchall()
        messages_list = [dict(message) for message in messages]
        
        conn.close()
        
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
def update_profile():
    if not is_authenticated():
        return jsonify({"message": "Authentication required"}), 401
    
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    
    if not username or not email:
        return jsonify({"message": "Username and email are required"}), 400
    
    user_id = session['user_id']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if email already exists for another user
    cursor.execute("SELECT id FROM user WHERE email = ? AND id != ?", (email, user_id))
    existing_user = cursor.fetchone()
    
    if existing_user:
        conn.close()
        return jsonify({"message": "Email already in use by another account"}), 400
    
    cursor.execute("UPDATE user SET username = ?, email = ? WHERE id = ?",
                  (username, email, user_id))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Profile updated successfully"})

@app.route('/change_password', methods=['POST'])
def change_password():
    if not is_authenticated():
        return jsonify({"message": "Authentication required"}), 401
    
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({"message": "Current password and new password are required"}), 400
    
    user_id = session['user_id']
    hashed_current = hashlib.sha256(current_password.encode()).hexdigest()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verify current password
    cursor.execute("SELECT * FROM user WHERE id = ? AND password = ?", (user_id, hashed_current))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return jsonify({"message": "Current password is incorrect"}), 400
    
    # Update to new password
    hashed_new = hashlib.sha256(new_password.encode()).hexdigest()
    cursor.execute("UPDATE user SET password = ? WHERE id = ?", (hashed_new, user_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Password changed successfully"})

@app.route('/admin/stats')
def admin_stats():
    if not is_authenticated() or not is_admin():
        return jsonify({"message": "Unauthorized"}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get total users
    cursor.execute("SELECT COUNT(*) FROM user")
    total_users = cursor.fetchone()[0]
    
    # Get total sessions
    cursor.execute("SELECT COUNT(*) FROM session")
    total_sessions = cursor.fetchone()[0]
    
    # Get total videos (sessions)
    total_videos = total_sessions
    
    # Get total questions
    cursor.execute("SELECT COUNT(*) FROM conversation")
    total_questions = cursor.fetchone()[0]
    
    conn.close()
    
    return jsonify({
        "total_users": total_users,
        "total_sessions": total_sessions,
        "total_videos": total_videos,
        "total_questions": total_questions
    })


if __name__ == '__main__':
    app.run(debug=True)