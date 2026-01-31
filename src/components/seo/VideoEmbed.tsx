import { useState, useRef, useEffect } from 'react';
import { VideoEmbedData } from '@/types/seo';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';

interface VideoEmbedProps {
  video: VideoEmbedData;
  className?: string;
  showSchema?: boolean;
  autoplay?: boolean;
  lazyLoad?: boolean;
}

export default function VideoEmbed({
  video,
  className,
  showSchema = true,
  autoplay = false,
  lazyLoad = true,
}: VideoEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(!lazyLoad);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse video URL to get embed URL
  const embedUrl = getEmbedUrl(video.url, autoplay);
  const thumbnailUrl = video.thumbnailUrl || getThumbnailUrl(video.url);

  // Lazy load with Intersection Observer
  useEffect(() => {
    if (!lazyLoad || isLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazyLoad, isLoaded]);

  // Generate VideoObject schema
  const videoSchema = showSchema
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: video.title,
        description: video.description,
        thumbnailUrl: thumbnailUrl,
        uploadDate: video.uploadDate,
        duration: video.duration,
        embedUrl: embedUrl,
        contentUrl: video.url,
      }
    : null;

  const handleLoad = () => {
    setIsLoaded(true);
  };

  if (!embedUrl) {
    return <VideoEmbedPlaceholder className={className} />;
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* JSON-LD Schema */}
      {showSchema && videoSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
        />
      )}

      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        {lazyLoad && !isLoaded && isVisible && (
          <button
            onClick={handleLoad}
            className="absolute inset-0 flex items-center justify-center group"
            aria-label={`Play ${video.title}`}
          >
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
            <div className="relative z-10 flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground group-hover:scale-110 transition-transform">
              <Play className="h-8 w-8 ml-1" />
            </div>
          </button>
        )}

        {(!lazyLoad || isLoaded) && (
          <iframe
            src={embedUrl}
            title={video.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        )}

        {lazyLoad && !isVisible && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground">Loading video...</div>
          </div>
        )}
      </div>

      {video.title && (
        <p className="mt-2 text-sm text-muted-foreground">{video.title}</p>
      )}
    </div>
  );
}

// Get embed URL from various video platforms
function getEmbedUrl(url: string, autoplay: boolean = false): string | null {
  try {
    const urlObj = new URL(url);
    const autoplayParam = autoplay ? '&autoplay=1' : '';

    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = '';

      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get('v') || '';
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0${autoplayParam}`;
      }
    }

    // Vimeo
    if (urlObj.hostname.includes('vimeo.com')) {
      const videoId = urlObj.pathname.split('/').pop();
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}?${autoplayParam.slice(1)}`;
      }
    }

    // Already an embed URL
    if (url.includes('/embed/') || url.includes('player.vimeo.com')) {
      return url;
    }

    return null;
  } catch {
    return null;
  }
}

// Get thumbnail URL from video URL
function getThumbnailUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = '';

      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get('v') || '';
      }

      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Empty placeholder for admin
export function VideoEmbedPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground',
        className
      )}
    >
      <div className="text-center p-4">
        <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="font-medium">Video Embed</p>
        <p className="text-sm mt-1">Add a video URL in the post editor</p>
      </div>
    </div>
  );
}

// Create empty video embed data
export function createEmptyVideoEmbed(): VideoEmbedData {
  return {
    url: '', // To be filled by site owner
    title: '', // To be filled by site owner
    description: '', // To be filled by site owner
    thumbnailUrl: null,
    uploadDate: null,
    duration: null,
  };
}
