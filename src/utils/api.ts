
import { toast } from 'sonner';

const API_URL = 'http://localhost:5000'; // Change this to your Flask backend URL

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

export const api = async (endpoint: string, options: ApiOptions = {}) => {
  const defaultOptions: ApiOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  const mergedOptions: ApiOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // If body is FormData, remove Content-Type header to let the browser set it
  if (mergedOptions.body instanceof FormData) {
    delete mergedOptions.headers!['Content-Type'];
  } else if (mergedOptions.body && typeof mergedOptions.body === 'object' && !(mergedOptions.body instanceof FormData)) {
    mergedOptions.body = JSON.stringify(mergedOptions.body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, mergedOptions as RequestInit);
    
    // For file downloads
    if (endpoint.includes('/download_transcript/')) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/["']/g, '')
        : 'transcript.txt';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      return { success: true };
    }

    // Regular JSON response
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error.message || 'An error occurred');
    throw error;
  }
};

// Auth APIs
export const login = async (email: string, password: string) => {
  return api('/login', {
    method: 'POST',
    body: { email, password },
  });
};

export const signup = async (username: string, email: string, password: string) => {
  return api('/signup', {
    method: 'POST',
    body: { username, email, password },
  });
};

export const logout = async () => {
  return api('/logout');
};

// Video processing APIs
export const processVideo = async (formData: FormData) => {
  return api('/process', {
    method: 'POST',
    body: formData,
  });
};

export const getResults = async (sessionId: string) => {
  return api(`/results/${sessionId}`);
};

export const askQuestion = async (sessionId: string, question: string) => {
  return api('/ask', {
    method: 'POST',
    body: { session_id: sessionId, question },
  });
};

export const downloadTranscript = async (sessionId: string) => {
  return api(`/download_transcript/${sessionId}`);
};

export const getUserHistory = async () => {
  return api('/history');
};

export const getUserDashboard = async () => {
  return api('/dashboard');
};

export const deleteSession = async (sessionId: string) => {
  return api(`/delete_session/${sessionId}`, {
    method: 'POST',
  });
};

export const markMessage = async (messageId: number) => {
  return api(`/mark_message/${messageId}`);
};

export const deleteMessage = async (messageId: number) => {
  return api(`/delete_message/${messageId}`, {
    method: 'POST',
  });
};

export const submitContactForm = async (name: string, email: string, message: string) => {
  return api('/contact', {
    method: 'POST',
    body: { name, email, message },
  });
};
