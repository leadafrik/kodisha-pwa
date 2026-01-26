/**
 * Advanced Image Component
 * Features:
 * - Lazy loading with Intersection Observer
 * - Blur-up effect (low quality placeholder → high quality)
 * - Automatic WebP support detection
 * - Fallback handling
 * - Loading states with skeleton
 * - Error handling with fallback image
 */

import React, { useState, useEffect, useRef, ImgHTMLAttributes } from "react";

interface AdvancedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Main image source */
  src: string;
  /** Low quality placeholder (small, blurred) */
  blurSrc?: string;
  /** Alternative text */
  alt: string;
  /** WebP source for browsers that support it */
  webpSrc?: string;
  /** Show skeleton loader while loading */
  showSkeleton?: boolean;
  /** Custom skeleton className */
  skeletonClassName?: string;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback on error */
  onError?: () => void;
  /** Container className for wrapper */
  containerClassName?: string;
  /** Enable lazy loading */
  lazy?: boolean;
  /** Image fit object-fit value */
  objectFit?: "cover" | "contain" | "fill" | "scale-down";
}

/**
 * Advanced Image Component with lazy loading and blur-up
 *
 * Usage:
 * ```tsx
 * <AdvancedImage
 *   src="/images/product.jpg"
 *   blurSrc="/images/product-blur.jpg"
 *   alt="Product"
 *   lazy
 *   showSkeleton
 * />
 * ```
 */
export const AdvancedImage: React.FC<AdvancedImageProps> = ({
  src,
  blurSrc,
  alt,
  webpSrc,
  showSkeleton = true,
  skeletonClassName = "w-full h-48 bg-slate-200 animate-pulse rounded-lg",
  onLoad,
  onError,
  containerClassName = "",
  lazy = true,
  objectFit = "cover",
  className = "",
  ...props
}) => {
  const [imageLoaded, setImageLoaded] = useState(!lazy && !blurSrc);
  const [imageError, setImageError] = useState(false);
  const [showBlur, setShowBlur] = useState(!!blurSrc);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && imgRef.current && lazy) {
          // Load image
          imgRef.current.src = webpSrc && supportsWebP() ? webpSrc : src;
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: "50px", // Start loading 50px before image enters viewport
      }
    );

    if (containerRef.current && lazy) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [src, webpSrc, lazy]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setShowBlur(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
    setShowBlur(false);
    onError?.();
  };

  const supportsWebP = (): boolean => {
    const canvas = document.createElement("canvas");
    return canvas.toDataURL("image/webp").includes("webp");
  };

  if (imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 rounded-lg ${containerClassName}`}
      >
        <div className="text-center">
          <p className="text-sm text-slate-600">Image failed to load</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${containerClassName}`}
    >
      {/* Loading skeleton */}
      {showSkeleton && !imageLoaded && (
        <div className={`absolute inset-0 ${skeletonClassName}`} />
      )}

      {/* Blur placeholder */}
      {blurSrc && showBlur && (
        <img
          src={blurSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full ${className}`}
          style={{
            filter: "blur(10px)",
            objectFit,
          }}
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={!lazy ? webpSrc && supportsWebP() ? webpSrc : src : undefined}
        alt={alt}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`w-full h-full transition-opacity duration-300 ${
          imageLoaded && !showBlur ? "opacity-100" : "opacity-0"
        } ${className}`}
        style={{
          objectFit,
        }}
        loading={lazy ? "lazy" : "eager"}
        {...props}
      />
    </div>
  );
};

/**
 * Image Gallery Component
 * Display multiple images with lazy loading
 */
interface ImageGalleryProps {
  images: {
    src: string;
    alt: string;
    blurSrc?: string;
  }[];
  className?: string;
  imageClassName?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className = "grid grid-cols-2 gap-4",
  imageClassName = "h-40 rounded-lg",
}) => (
  <div className={className}>
    {images.map((img, idx) => (
      <AdvancedImage
        key={idx}
        src={img.src}
        blurSrc={img.blurSrc}
        alt={img.alt}
        containerClassName={imageClassName}
        lazy
        showSkeleton
      />
    ))}
  </div>
);

/**
 * Responsive image component
 * Automatically selects best format/size
 */
interface ResponsiveImageProps extends Omit<AdvancedImageProps, "srcSet"> {
  /** Map of srcset images */
  srcSet?: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  srcSet,
  src,
  blurSrc,
  alt,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    if (!srcSet) return;

    const updateImageSrc = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setImageSrc(srcSet.mobile);
      } else if (width < 1024) {
        setImageSrc(srcSet.tablet);
      } else {
        setImageSrc(srcSet.desktop);
      }
    };

    updateImageSrc();
    window.addEventListener("resize", updateImageSrc);
    return () => window.removeEventListener("resize", updateImageSrc);
  }, [srcSet]);

  return (
    <AdvancedImage
      src={imageSrc}
      blurSrc={blurSrc}
      alt={alt}
      {...props}
    />
  );
};

export default AdvancedImage;
