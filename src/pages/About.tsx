
import React from 'react';
import Navbar from '@/components/Navbar';
import { FileVideo, MessageSquare, Download } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-12">
        {/* Hero section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                About VidInsight
              </h1>
              <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
                Making video content more accessible and actionable through AI-powered analysis.
              </p>
            </div>
          </div>
        </section>
        
        {/* Mission section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
                <p className="text-lg text-gray-600 mb-6">
                  We believe that the wealth of knowledge contained in video content should be easily accessible to everyone.
                </p>
                <p className="text-lg text-gray-600">
                  Our mission is to transform the way people interact with video content by providing powerful AI tools that extract key insights, generate accurate transcriptions, and enable natural language conversations about video content.
                </p>
              </div>
              <div className="mt-10 lg:mt-0">
                <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gradient-to-r from-brand-500 to-brand-700 flex items-center justify-center">
                  <div className="text-white text-center p-8">
                    <div className="flex justify-center mb-4">
                      <FileVideo className="h-16 w-16" />
                    </div>
                    <p className="text-xl font-medium">Making video content smarter</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">How VidInsight Works</h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
                Our platform uses cutting-edge AI to transform videos into accessible insights.
              </p>
            </div>
            
            <div className="mt-12">
              <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                    <FileVideo className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-xl font-medium text-gray-900">Video Processing</h3>
                  <p className="mt-2 text-base text-gray-600 text-center">
                    Upload your video or paste a YouTube URL. Our system will extract the audio and prepare it for analysis.
                  </p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                    <Download className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-xl font-medium text-gray-900">Transcription & Summarization</h3>
                  <p className="mt-2 text-base text-gray-600 text-center">
                    Our AI accurately transcribes speech and generates concise summaries of the video content.
                  </p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                    <MessageSquare className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-xl font-medium text-gray-900">Interactive Q&A</h3>
                  <p className="mt-2 text-base text-gray-600 text-center">
                    Ask questions about the video content and receive intelligent, contextually relevant answers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Technology section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
              <div className="lg:order-2">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Technology</h2>
                <p className="text-lg text-gray-600 mb-6">
                  VidInsight leverages state-of-the-art machine learning models for speech recognition, natural language processing, and question answering.
                </p>
                <p className="text-lg text-gray-600">
                  Our platform continuously improves through machine learning, becoming more accurate and helpful with each video analyzed.
                </p>
              </div>
              <div className="mt-10 lg:mt-0 lg:order-1">
                <div className="aspect-w-16 aspect-h-9 bg-white rounded-lg shadow-lg overflow-hidden border">
                  <div className="p-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-100 rounded-lg p-4 text-center">
                        <p className="text-sm font-medium text-gray-900">Speech Recognition</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-4 text-center">
                        <p className="text-sm font-medium text-gray-900">Natural Language Processing</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-4 text-center">
                        <p className="text-sm font-medium text-gray-900">Text Summarization</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-4 text-center">
                        <p className="text-sm font-medium text-gray-900">Question Answering</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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

export default About;
