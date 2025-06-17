
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FileVideo, Search, MessageSquare, Download } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero section */}
        <section className="bg-gradient-to-b from-white to-gray-50 py-16 sm:py-24 hero-pattern">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Transform Videos into</span>
                <span className="block gradient-text">Actionable Insights</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
                AI-powered video summarization, transcription, and interactive Q&A to help you extract more value from your video content.
              </p>
              <div className="mt-10 flex justify-center">
                {isAuthenticated ? (
                  <Link to="/process">
                    <Button size="lg" className="px-8 py-6 text-lg">
                      <FileVideo className="mr-2 h-5 w-5" />
                      Analyze Your Video
                    </Button>
                  </Link>
                ) : (
                  <Link to="/signup">
                    <Button size="lg" className="px-8 py-6 text-lg">
                      Get Started
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
        
        {/* Features section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">Powered by Advanced AI</h2>
              <p className="mt-4 text-lg text-gray-600">Unlock the full potential of your video content</p>
            </div>
            
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm border">
                <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center mb-4">
                  <FileVideo className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Smart Summarization</h3>
                <p className="text-gray-600 text-center">
                  Get concise summaries of video content, saving hours of watching time.
                </p>
              </div>
              
              <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm border">
                <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Interactive Q&A</h3>
                <p className="text-gray-600 text-center">
                  Ask questions about the video and get instant, accurate answers.
                </p>
              </div>
              
              <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm border">
                <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Transcript Generation</h3>
                <p className="text-gray-600 text-center">
                  Convert speech to text with high accuracy and download for reference.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA section */}
        <section className="bg-brand-700 py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-8">Ready to get started?</h2>
            <div className="flex justify-center space-x-4">
              {isAuthenticated ? (
                <Link to="/process">
                  <Button variant="secondary" size="lg">
                    Analyze Video
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button variant="secondary" size="lg">
                      Sign up for Free
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg" className="bg-transparent text-white border-white hover:bg-white/10">
                      Login
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; 2025 VidInsight. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
