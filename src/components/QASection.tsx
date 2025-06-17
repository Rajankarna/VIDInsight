
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { askQuestion } from '@/utils/api';
import { Send, User, Bot } from 'lucide-react';
import { toast } from 'sonner';

interface Conversation {
  id: number;
  question: string;
  answer: string;
  timestamp: string;
}

interface QASectionProps {
  sessionId: string;
  initialMessages?: Conversation[];
}

const QASection: React.FC<QASectionProps> = ({ sessionId, initialMessages = [] }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Conversation[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Add user question immediately to provide instant feedback
      const pendingMessage: Conversation = {
        id: Date.now(),
        question: question,
        answer: '...',
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prevMessages => [...prevMessages,pendingMessage]);
      
      // Clear input field right away
      setQuestion('');
      
      // Make API call
      const data = await askQuestion(sessionId, pendingMessage.question);
      
      // Update with actual response
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === pendingMessage.id 
            ? { ...msg, id: data.conversation_id || msg.id, answer: data.answer } 
            : msg
        )
      );
      
    } catch (error) {
      console.error('Error asking question:', error);
      toast.error('Failed to get an answer. Please try again.');
      
      // Remove pending message on error
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== Date.now())
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-[600px] border rounded-lg overflow-hidden shadow-sm">
      <div className="bg-brand-600 text-white p-4">
        <h2 className="font-medium text-lg">Ask Questions About This Video</h2>
      </div>
      
      <div className="flex-grow overflow-auto p-4 bg-gray-50">
        {messages.length > 0 ? (
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-brand-600 text-white p-2 rounded-full mr-3">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm flex-grow">
                    <p className="text-gray-800">{message.question}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(message.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gray-700 text-white p-2 rounded-full mr-3">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg shadow-sm flex-grow">
                    {message.answer === '...' ? (
                      <div className="flex space-x-2 items-center">
                        <div className="animate-bounce h-2 w-2 bg-gray-400 rounded-full"></div>
                        <div className="animate-bounce h-2 w-2 bg-gray-400 rounded-full animation-delay-200"></div>
                        <div className="animate-bounce h-2 w-2 bg-gray-400 rounded-full animation-delay-400"></div>
                      </div>
                    ) : (
                      <p className="text-gray-800 whitespace-pre-line">{message.answer}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <div className="max-w-md">
              <Bot className="mx-auto h-12 w-12 text-brand-600 opacity-80 mb-3" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Ask me anything about this video</h3>
              <p className="text-gray-500">
                I can answer questions about the content, key points, people featured, and more.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about this video..."
            disabled={isLoading}
            className="flex-grow"
          />
          <Button 
            type="submit" 
            disabled={!question.trim() || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default QASection;
