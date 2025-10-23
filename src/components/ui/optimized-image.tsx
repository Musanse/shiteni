import React from 'react';
import Image, { ImageProps } from 'next/image';
import { shouldLoadEagerly, getResponsiveSizes } from '@/lib/image-optimization';

interface OptimizedImageProps extends Omit<ImageProps, 'loading'> {
  src: string;
  alt: string;
  priority?: boolean;
  index?: number;
  className?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  priority = false, 
  index = 0, 
  className = '',
  ...props 
}: OptimizedImageProps) {
  const shouldEager = priority || shouldLoadEagerly(src, index);
  
  return (
    <Image
      src={src}
      alt={alt}
      priority={shouldEager}
      loading={shouldEager ? "eager" : "lazy"}
      sizes={getResponsiveSizes()}
      className={className}
      data-priority={shouldEager.toString()}
      {...props}
    />
  );
}

export default OptimizedImage;
