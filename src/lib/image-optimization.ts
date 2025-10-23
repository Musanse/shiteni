// Image optimization configuration
export const imageOptimizationConfig = {
  // Critical images that should load immediately
  criticalImages: [
    '/uploads/image/shiteni%20logo%20(1).png',
    '/placeholder-bus.jpg',
    '/room-placeholder.jpg'
  ],
  
  // Above-the-fold image loading strategy
  aboveTheFold: {
    priority: true,
    loading: 'eager',
    quality: 90
  },
  
  // Below-the-fold image loading strategy
  belowTheFold: {
    priority: false,
    loading: 'lazy',
    quality: 75
  },
  
  // Responsive image sizes
  responsiveSizes: {
    mobile: '(max-width: 768px) 100vw',
    tablet: '(max-width: 1200px) 50vw',
    desktop: '33vw'
  }
};

// Helper function to determine if image should load eagerly
export const shouldLoadEagerly = (src: string, index: number = 0) => {
  return imageOptimizationConfig.criticalImages.includes(src) || index < 2;
};

// Helper function to get responsive sizes
export const getResponsiveSizes = () => {
  return `${imageOptimizationConfig.responsiveSizes.mobile}, ${imageOptimizationConfig.responsiveSizes.tablet}, ${imageOptimizationConfig.responsiveSizes.desktop}`;
};
