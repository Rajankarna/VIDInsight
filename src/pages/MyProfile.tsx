
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { api } from '@/utils/api';
import { Settings, User, Bell, Shield } from 'lucide-react';

const MyProfile = () => {
  const { isAuthenticated, user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notification preferences (demo)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newVideoAlerts, setNewVideoAlerts] = useState(true);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [isAuthenticated, user, navigate]);
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await api('/update_profile', {
        method: 'POST',
        body: { username, email }
      });
      
      toast.success('Profile updated successfully');
      checkAuth(); // Refresh user data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await api('/change_password', {
        method: 'POST',
        body: { current_password: currentPassword, new_password: newPassword }
      });
      
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNotificationUpdate = async () => {
    // This would typically save to the backend
    toast.success('Notification preferences updated');
  };
  
  if (!isAuthenticated) {
    return null; // will be redirected by useEffect
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center">
            <div className="bg-brand-100 rounded-full p-3 mr-4">
              <User className="h-8 w-8 text-brand-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>
          </div>
          
          <Card>
            <Tabs defaultValue="profile">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile" className="flex items-center justify-center">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="password" className="flex items-center justify-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Password
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center justify-center">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <TabsContent value="profile">
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="username">Username</Label>
                      <Input 
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Your username"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full md:w-auto"
                    >
                      {isLoading ? 'Updating...' : 'Update Profile'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="password">
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input 
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input 
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input 
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                      className="w-full md:w-auto"
                    >
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="notifications">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium">Email Notifications</h3>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <Switch 
                        checked={emailNotifications} 
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium">New Video Alerts</h3>
                        <p className="text-sm text-gray-500">Get notified when new features are added</p>
                      </div>
                      <Switch 
                        checked={newVideoAlerts} 
                        onCheckedChange={setNewVideoAlerts}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleNotificationUpdate}
                      className="w-full md:w-auto"
                    >
                      Save Preferences
                    </Button>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MyProfile;
