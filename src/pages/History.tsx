
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import HistoryCard from '@/components/HistoryCard';
import { getUserHistory } from '@/utils/api';
import { History as HistoryIcon, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

interface Session {
  id: string;
  title: string;
  timestamp: string;
  is_youtube: boolean;
  youtube_id?: string;
  video_path?: string;
  transcript?: string;
  summary?: string;
  conversation_count?: number;
  duration?: number;
  thumbnail?: string;
}

const History: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const data = await getUserHistory();
        setSessions(data.sessions || []);
        setFilteredSessions(data.sessions || []);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchHistory();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSessions(sessions);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = sessions.filter(
        (session) =>
          session.title.toLowerCase().includes(lowercaseQuery) ||
          (session.transcript && session.transcript.toLowerCase().includes(lowercaseQuery)) ||
          (session.summary && session.summary.toLowerCase().includes(lowercaseQuery))
      );
      setFilteredSessions(filtered);
    }
  }, [searchQuery, sessions]);

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prevSessions) => prevSessions.filter((session) => session.id !== sessionId));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center">
              <HistoryIcon className="mr-2 h-6 w-6 text-brand-600" />
              <h1 className="text-2xl font-bold text-gray-900">Video History</h1>
            </div>
            <div className="w-full sm:w-64 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                  <div className="h-40 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-3 w-1/2"></div>
                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {isAuthenticated ? (
                filteredSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSessions.map((session) => (
                      <HistoryCard 
                        key={session.id} 
                        session={session} 
                        onDelete={handleDeleteSession}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-lg shadow">
                    <HistoryIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                      {searchQuery ? 'No results found' : 'No video history'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchQuery 
                        ? 'Try different search terms or clear your search' 
                        : 'Your analyzed videos will appear here'}
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-16 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Please sign in to view your history</h3>
                  <p className="text-gray-500">You need to be logged in to access your video history</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;
