import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SEOImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataUrl?: string;
  caption?: string;
  priority?: boolean;
}

export default function SEOImage({
  src,
  alt,
  width,
  height,
  lazy = true,
  placeholder = 'empty',
  blurDataUrl,
  caption,
  priority = false,
  className,
  ...props
}: SEOImageProps) {
  const [isLoaded, setIsLoaded] = useState(!lazy || priority);
  const [isVisible, setIsVisible] = useState(!lazy || priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px 0px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, isVisible]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  // Calculate aspect ratio for placeholder
  const aspectRatio = width && height ? `${width} / ${height}` : undefined;

  const imageElement = (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
      style={{ aspectRatio }}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Blur placeholder */}
      {placeholder === 'blur' && blurDataUrl && !isLoaded && (
        <img
          src={blurDataUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-lg"
        />
      )}

      {/* Main image */}
      {isVisible && !hasError && (
        <img
          src={src}
          alt={alt}
          width={width || 800}
          height={height || 450}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <span className="text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );

  // Wrap in figure if caption is provided
  if (caption) {
    return (
      <figure className="my-4">
        {imageElement}
        <figcaption className="mt-2 text-sm text-center text-muted-foreground">
          {caption}
        </figcaption>
      </figure>
    );
  }

  return imageElement;
}

// Responsive image with srcset
export function ResponsiveImage({
  src,
  alt,
  sizes,
  srcSet,
  width,
  height,
  lazy = true,
  className,
  ...props
}: SEOImageProps & {
  sizes?: string;
  srcSet?: string;
}) {
  const [isLoaded, setIsLoaded] = useState(!lazy);

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ aspectRatio: width && height ? `${width} / ${height}` : undefined }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        srcSet={srcSet}
        sizes={sizes}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={() => setIsLoaded(true)}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        {...props}
      />
    </div>
  );
}

// Image placeholder for admin
export function ImagePlaceholder({
  className,
  aspectRatio = '16 / 9',
  label = 'Featured Image',
}: {
  className?: string;
  aspectRatio?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground bg-muted/20',
        className
      )}
      style={{ aspectRatio }}
    >
      <div className="text-center p-4">
        <div className="h-10 w-10 mx-auto mb-2 rounded-lg bg-muted flex items-center justify-center">
          <svg
            className="h-6 w-6 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="font-medium">{label}</p>
        <p className="text-sm mt-1">Upload an image in the editor</p>
      </div>
    </div>
  );
}
