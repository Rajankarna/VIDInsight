
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { FileVideo, Upload, Video } from 'lucide-react';

interface VideoUploaderProps {
  onSubmit: (formData: FormData) => void;
  isProcessing: boolean;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onSubmit, isProcessing }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeUrl(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    
    if (activeTab === 'upload' && file) {
      formData.append('video', file);
      formData.append('source_type', 'upload');
    } else if (activeTab === 'youtube' && youtubeUrl) {
      formData.append('youtube_url', youtubeUrl);
      formData.append('source_type', 'youtube');
    } else {
      return; // No valid input
    }
    
    onSubmit(formData);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card className="p-6 shadow-md bg-white">
      <Tabs 
        defaultValue="upload" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Video
          </TabsTrigger>
          <TabsTrigger value="youtube" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            YouTube URL
          </TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit}>
          <TabsContent value="upload">
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
                isDragging
                  ? 'border-brand-500 bg-brand-50'
                  : file
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-brand-400'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={openFileSelector}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
              />
              
              {file ? (
                <div className="flex flex-col items-center">
                  <FileVideo className="h-10 w-10 text-green-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <FileVideo className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900">
                    Drag and drop your video here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports MP4, MOV, AVI and other video formats (max. 500MB)
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="youtube">
            <div className="mb-6">
              <Label htmlFor="youtube_url" className="block text-sm font-medium text-gray-700 mb-1">
                YouTube Video URL
              </Label>
              <Input
                id="youtube_url"
                type="text"
                value={youtubeUrl}
                onChange={handleYoutubeUrlChange}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full"
              />
              <p className="mt-2 text-xs text-gray-500">
                Paste a YouTube video URL to analyze its content
              </p>
            </div>
          </TabsContent>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={
                isProcessing || 
                (activeTab === 'upload' && !file) || 
                (activeTab === 'youtube' && !youtubeUrl)
              }
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>Analyze Video</>
              )}
            </Button>
          </div>
        </form>
      </Tabs>
    </Card>
  );
};

export default VideoUploader;
