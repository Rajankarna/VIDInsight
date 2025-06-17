import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  thumbnail?: string;
  title: string;
  isYoutube?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, thumbnail, title, isYoutube = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const isYouTubeURL = (url: string): boolean => {
    return isYoutube || url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(url).search);
      videoId = urlParams.get('v') || '';
    } else if (url.includes('youtu.be')) {
      videoId = url.split('/').pop() || '';
    } else {
      videoId = url; // If it's just the YouTube ID directly
    }
    
    return `https://www.youtube.com/embed/${videoId}`;
  };

  useEffect(() => {
    if (!isYouTubeURL(src) && videoRef.current) {
      videoRef.current.load();
    }
  }, [src]);

  if (isYouTubeURL(src)) {
    return (
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={getYouTubeEmbedUrl(src)}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
        ></iframe>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
      <video
        ref={videoRef}
        controls
        className="absolute top-0 left-0 w-full h-full object-cover"
        poster={thumbnail}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;