import { useState, useEffect } from 'react';

export const useDeviceDetection = () => {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Check both screen width and touch support
      const isSmallScreen = window.innerWidth < 1024;
      const hasTouchSupport = navigator.maxTouchPoints > 0;
      
      // Only show camera if BOTH conditions indicate mobile/tablet
      setIsMobileOrTablet(isSmallScreen && hasTouchSupport);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobileOrTablet };
};
