
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import VideoUploader from '@/components/VideoUploader';
import { processVideo } from '@/utils/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const Process: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (formData: FormData) => {
    if (!isAuthenticated) {
      toast.error('Please log in to analyze videos');
      navigate('/login');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const data = await processVideo(formData);
      
      if (data.session_id) {
        toast.success('Video processed successfully!');
        navigate(`/results/${data.session_id}`);
      } else {
        toast.error('Failed to process video.');
      }
    } catch (error) {
      console.error('Error processing video:', error);
      toast.error('An error occurred while processing the video.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analyze Your Video</h1>
            <p className="text-gray-600">
              Upload a video file or paste a YouTube URL to get started
            </p>
          </div>
          
          {!isAuthenticated ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You need to be logged in to analyze videos.
                    Please <a href="/login" className="font-medium underline">sign in</a> or
                    <a href="/signup" className="font-medium underline"> create an account</a>.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          
          <VideoUploader onSubmit={handleSubmit} isProcessing={isProcessing} />
          
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-3">How it works</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Upload your video file or paste a YouTube URL</li>
              <li>Our AI will process the video and extract audio</li>
              <li>The system will transcribe the speech to text</li>
              <li>An AI-generated summary will be created</li>
              <li>You can then ask questions about the video content</li>
            </ol>
            <div className="mt-4 text-sm text-gray-500">
              <p>Processing time depends on video length. Most videos under 10 minutes complete in less than a minute.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Process;
