import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import VideoPlayer from '@/components/VideoPlayer';
import QASection from '@/components/QASection';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getResults, downloadTranscript } from '@/utils/api';
import { Download, ArrowLeft, MessageSquare, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Conversation {
  id: number;
  question: string;
  answer: string;
  timestamp: string;
}

interface ResultsData {
  session: {
    id: string;
    title: string;
    is_youtube: boolean;
    youtube_id?: string;
    video_path?: string;
    timestamp: string;
    transcript: string;
    summary: string;
    duration?: number;
  };
  conversations: Conversation[];
  video_url: string;
}

const Results: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [data, setData] = useState<ResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchResults = async () => {
      if (!sessionId) return;

      setIsLoading(true);
      try {
        const resultsData = await getResults(sessionId);
        setData(resultsData);
      } catch (error) {
        console.error('Error fetching results:', error);
        toast.error('Failed to load video analysis');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchResults();
    } else {
      setIsLoading(false);
    }
  }, [sessionId, isAuthenticated]);

  const handleDownloadTranscript = async () => {
    if (!sessionId) return;

    try {
      await downloadTranscript(sessionId);
      toast.success('Transcript downloaded successfully');
    } catch (error) {
      console.error('Error downloading transcript:', error);
      toast.error('Failed to download transcript');
    }
  };

  const getVideoUrl = () => {
    if (!data) return '';

    if (data.session.is_youtube && data.session.youtube_id) {
      return data.session.youtube_id;
    }

    return data.video_url || '';
  };

  const getVideoThumbnail = () => {
    if (!data) return '';

    if (data.session.is_youtube && data.session.youtube_id) {
      return `https://img.youtube.com/vi/${data.session.youtube_id}/hqdefault.jpg`;
    }

    return '';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-xl font-medium text-gray-900 mb-2">Please sign in to view this page</h2>
            <p className="text-gray-600 mb-4">You need to be logged in to access video analysis results</p>
            <Button onClick={() => navigate('/login')}>Sign In</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            {isLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
            ) : data ? (
              <h1 className="text-2xl font-bold text-gray-900">{data.session.title}</h1>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">Video Analysis</h1>
            )}
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="relative h-[60vh] bg-gray-200 rounded animate-pulse"></div>
                <div className="mt-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
                </div>
              </div>
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow animate-pulse h-96"></div>
              </div>
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Video Preview Section */}
                <div className="w-full rounded-lg overflow-hidden">
                  <VideoPlayer 
                    src={getVideoUrl()}
                    thumbnail={getVideoThumbnail()}
                    title={data.session.title}
                    isYoutube={data.session.is_youtube}
                  />
                </div>
                
                <div className="bg-white rounded-lg shadow-md border overflow-hidden">
                  <Tabs defaultValue="summary">
                    <div className="px-4 pt-4 border-b">
                      <TabsList className="w-full justify-start">
                        <TabsTrigger value="summary" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Summary
                        </TabsTrigger>
                        <TabsTrigger value="transcript" className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Transcript
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <TabsContent value="summary" className="p-4 space-y-4">
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-line">{data.session.summary}</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="transcript" className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Transcript</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleDownloadTranscript}
                          className="flex items-center"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Full Transcript
                        </Button>
                      </div>
                      <div className="prose max-w-none">
                        <p className="text-sm text-gray-700 whitespace-pre-line font-mono">
                          {data.session.transcript}
                          {data.session.transcript.length > 500 && (
                            <span className="block mt-2 text-gray-500">
                              ... (Download for full transcript)
                            </span>
                          )}
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md border h-full">
                  <div className="p-4 border-b">
                    <h2 className="text-lg font-medium flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-brand-600" />
                      Ask About This Video
                    </h2>
                  </div>
                  <div className="p-4">
                    <QASection 
                      sessionId={sessionId || ''} 
                      initialMessages={data.conversations}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-xl font-medium text-gray-900 mb-2">Video analysis not found</h2>
              <p className="text-gray-600 mb-4">The requested analysis doesn't exist or you don't have access to it</p>
              <Button onClick={() => navigate('/process')}>Analyze a Video</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Results;