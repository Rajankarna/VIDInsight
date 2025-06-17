
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import ContactMessagesTable from '@/components/ContactMessagesTable';
import { Users, MessageSquare, Settings, FileVideo } from 'lucide-react';
import { api } from '@/utils/api';

interface AdminStats {
  total_users: number;
  total_sessions: number;
  total_videos: number;
  total_questions: number;
}

const AdminDashboard: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect non-admin users
    if (isAuthenticated && !isAdmin) {
      navigate('/index');
    } else if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    const fetchAdminStats = async () => {
      if (isAuthenticated && isAdmin) {
        try {
          setIsLoading(true);
          const data = await api('/admin/stats');
          setStats(data);
        } catch (error) {
          console.error('Error fetching admin stats:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAdminStats();
  }, [isAuthenticated, isAdmin]);

  if (!isAuthenticated || !isAdmin) {
    return null; // Will be redirected by the useEffect
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage your application and users</p>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse h-20"></div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="rounded-full p-2 bg-blue-100">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Users</p>
                      <p className="text-3xl font-semibold">{stats?.total_users || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="rounded-full p-2 bg-green-100">
                      <FileVideo className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Videos</p>
                      <p className="text-3xl font-semibold">{stats?.total_videos || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="rounded-full p-2 bg-purple-100">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Questions</p>
                      <p className="text-3xl font-semibold">{stats?.total_questions || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="rounded-full p-2 bg-amber-100">
                      <FileVideo className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                      <p className="text-3xl font-semibold">{stats?.total_sessions || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="mb-8">
            <Card>
              <Tabs defaultValue="messages">
                <CardHeader className="border-b pb-3">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="messages" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Bug Reports
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Users
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <TabsContent value="messages" className="mt-0">
                    <ContactMessagesTable />
                  </TabsContent>
                  
                  <TabsContent value="users" className="mt-0">
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
                      <p className="text-gray-500">User management features coming soon</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="settings" className="mt-0">
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
                      <p className="text-gray-500">System settings features coming soon</p>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
