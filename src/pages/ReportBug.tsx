
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bug } from 'lucide-react';

const ReportBug = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [name, setName] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bugType, setBugType] = useState('');
  const [message, setMessage] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      toast.error('Please fill out all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api('/contact', {
        method: 'POST',
        body: { 
          name, 
          email, 
          message: `Bug Type: ${bugType}\n\n${message}` 
        }
      });
      
      toast.success('Bug report submitted successfully');
      
      // Clear form
      if (!isAuthenticated) {
        setName('');
        setEmail('');
      }
      setBugType('');
      setMessage('');
      
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast.error('Failed to submit bug report');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Bug className="h-12 w-12 mx-auto text-brand-600 mb-2" />
            <h1 className="text-3xl font-bold">Report a Bug</h1>
            <p className="text-gray-600 mt-2">
              Found an issue with our platform? Let us know and we'll fix it ASAP.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Bug Report Form</CardTitle>
              <CardDescription>
                Please provide as much detail as possible to help us understand and resolve the issue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      disabled={isAuthenticated}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      disabled={isAuthenticated}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bugType">Bug Type</Label>
                  <Select value={bugType} onValueChange={setBugType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bug type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ui">UI/Display Issue</SelectItem>
                      <SelectItem value="functionality">Functionality Issue</SelectItem>
                      <SelectItem value="performance">Performance Issue</SelectItem>
                      <SelectItem value="crash">Application Crash</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Description</Label>
                  <Textarea 
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please describe the bug in detail. Include steps to reproduce, expected behavior, and actual behavior."
                    rows={6}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ReportBug;
