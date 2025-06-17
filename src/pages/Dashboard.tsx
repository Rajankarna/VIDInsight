
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUserDashboard } from '@/utils/api';
import { FileVideo, History, MessageSquare, Download } from 'lucide-react';
import HistoryCard from '@/components/HistoryCard';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardData {
  recent_sessions: any[];
  total_videos: number;
  total_questions: number;
  total_transcripts: number;
  user: {
    username: string;
  };
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashboardData = await getUserDashboard();
        setData(dashboardData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDashboard();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleDeleteSession = (sessionId: string) => {
    if (data) {
      setData({
        ...data,
        recent_sessions: data.recent_sessions.filter(session => session.id !== sessionId)
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <Link to="/process">
              <Button className="flex items-center">
                <FileVideo className="mr-2 h-4 w-4" />
                Analyze New Video
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {isAuthenticated && data ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center">
                          <div className="rounded-full p-2 bg-brand-100">
                            <FileVideo className="h-5 w-5 text-brand-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Videos</p>
                            <p className="text-3xl font-semibold">{data.total_videos}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center">
                          <div className="rounded-full p-2 bg-blue-100">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Q&As</p>
                            <p className="text-3xl font-semibold">{data.total_questions}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center">
                          <div className="rounded-full p-2 bg-green-100">
                            <Download className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Transcripts</p>
                            <p className="text-3xl font-semibold">{data.total_transcripts}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                      <Link to="/history" className="text-brand-600 hover:text-brand-500 flex items-center text-sm">
                        <History className="h-4 w-4 mr-1" />
                        View All History
                      </Link>
                    </div>
                    
                    {data.recent_sessions.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.recent_sessions.map((session) => (
                          <HistoryCard 
                            key={session.id} 
                            session={session}
                            onDelete={handleDeleteSession}
                          />
                        ))}
                      </div>
                    ) : (
                      <Card className="bg-white">
                        <CardContent className="py-10 text-center">
                          <FileVideo className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No videos analyzed yet</h3>
                          <p className="text-gray-500 mb-4">Get started by analyzing your first video</p>
                          <Link to="/process">
                            <Button>Analyze Your First Video</Button>
                          </Link>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </>
              ) : (
                <Card className="bg-white">
                  <CardContent className="py-10 text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Please sign in to view your dashboard</h3>
                    <p className="text-gray-500 mb-4">You need to be logged in to view your personalized dashboard</p>
                    <div className="flex justify-center space-x-4">
                      <Link to="/login">
                        <Button>Login</Button>
                      </Link>
                      <Link to="/signup">
                        <Button variant="outline">Sign up</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
