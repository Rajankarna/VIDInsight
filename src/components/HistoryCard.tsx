
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FileVideo, Download, MessageSquare, Trash } from 'lucide-react';
import { downloadTranscript, deleteSession } from '@/utils/api';
import { toast } from 'sonner';

interface SessionData {
  id: string;
  title: string;
  timestamp: string;
  is_youtube: boolean;
  youtube_id?: string;
  video_path?: string;
  thumbnail?: string;
  conversation_count?: number;
  duration?: number;
}

interface HistoryCardProps {
  session: SessionData;
  onDelete: (sessionId: string) => void;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ session, onDelete }) => {
  const handleDownload = async () => {
    try {
      await downloadTranscript(session.id);
      toast.success('Transcript downloaded successfully');
    } catch (error) {
      console.error('Error downloading transcript:', error);
      toast.error('Failed to download transcript');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      try {
        await deleteSession(session.id);
        onDelete(session.id);
        toast.success('Analysis deleted successfully');
      } catch (error) {
        console.error('Error deleting session:', error);
        toast.error('Failed to delete analysis');
      }
    }
  };

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number = 0): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get thumbnail based on whether it's a YouTube video or not
  const getThumbnail = (): string => {
    if (session.thumbnail) {
      return session.thumbnail;
    }
    if (session.is_youtube && session.youtube_id) {
      return `https://img.youtube.com/vi/${session.youtube_id}/hqdefault.jpg`;
    }
    return '/upload.png';
  };

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img 
          src={getThumbnail()} 
          alt={session.title}
          className="w-full h-40 object-cover"
        />
        {session.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(session.duration)}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-gray-900 line-clamp-1">{session.title}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(session.timestamp).toLocaleDateString()} • {session.is_youtube ? 'YouTube' : 'Upload'}
            </p>
          </div>
          <FileVideo className="h-5 w-5 text-brand-600 shrink-0" />
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleDownload}
              className="flex items-center text-xs py-1 h-8"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Transcript
            </Button>
            
            <Button
              size="sm" 
              variant="destructive" 
              onClick={handleDelete}
              className="flex items-center text-xs py-1 h-8"
            >
              <Trash className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </div>
          
          <Link to={`/results/${session.id}`}>
            <Button 
              size="sm"
              className="flex items-center text-xs py-1 h-8"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              {session.conversation_count || 0} Q&A
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default HistoryCard;
