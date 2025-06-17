import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import { Trash, Check, Eye, EyeOff } from 'lucide-react';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  timestamp: string;
  is_read: boolean;
}

const ContactMessagesTable: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      // Updated to call the correct endpoint: '/contact'
      const data = await api('/contact');
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      toast.error('Failed to load contact messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRead = async (messageId: number) => {
    try {
      await api(`/mark_message/${messageId}`);
      
      // Update local state
      setMessages(prevMessages => 
        prevMessages.map(message => 
          message.id === messageId 
            ? { ...message, is_read: !message.is_read } 
            : message
        )
      );
      
      toast.success('Message status updated');
    } catch (error) {
      console.error('Error updating message status:', error);
      toast.error('Failed to update message status');
    }
  };

  const handleDelete = async (messageId: number) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await api(`/delete_message/${messageId}`, {
          method: 'POST',
        });
        
        // Update local state
        setMessages(prevMessages => prevMessages.filter(message => message.id !== messageId));
        
        toast.success('Message deleted successfully');
      } catch (error) {
        console.error('Error deleting message:', error);
        toast.error('Failed to delete message');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/4"></div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="h-12 bg-gray-200 animate-pulse w-full"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 border-t border-gray-100 animate-pulse">
              <div className="h-full bg-gray-100"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Contact Messages</h2>
      
      {messages.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">No contact messages yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <Table>
            <TableCaption>Contact messages from website visitors</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Message</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow 
                  key={message.id}
                  className={message.is_read ? 'bg-gray-50' : 'font-medium'}
                >
                  <TableCell>{message.name}</TableCell>
                  <TableCell>{message.email}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs truncate">
                    {message.message}
                  </TableCell>
                  <TableCell>{new Date(message.timestamp).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      message.is_read 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {message.is_read ? 'Read' : 'Unread'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleRead(message.id)}
                        title={message.is_read ? "Mark as unread" : "Mark as read"}
                      >
                        {message.is_read ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(message.id)}
                        title="Delete message"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ContactMessagesTable;