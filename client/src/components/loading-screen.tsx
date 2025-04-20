import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        // Slow down progress as it gets closer to 100
        const increment = Math.max(1, Math.floor((100 - prev) / 10));
        const newProgress = Math.min(99, prev + increment);
        
        return newProgress;
      });
    }, 100);
    
    // Simulate completion after 2.5 seconds
    timer = setTimeout(() => {
      setProgress(100);
      clearInterval(interval);
      
      // Call onComplete after a short delay to show 100%
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 300);
    }, 2500);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);
  
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
      <div className="w-full max-w-md mx-auto p-8">
        <div className="flex flex-col items-center space-y-8">
          {/* Logo or Icon */}
          <div className="text-5xl font-bold text-center bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
            Guard-shin
          </div>
          
          {/* Loading spinner */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-muted-foreground/20 rounded-full"></div>
            <div 
              className="absolute inset-0 border-4 border-l-primary border-r-transparent border-t-transparent border-b-transparent rounded-full animate-spin"
              style={{ animationDuration: '1s' }}
            ></div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Loading text */}
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Loading dashboard... {progress}%</p>
            <p className="text-xs mt-2">Preparing your experience</p>
          </div>
        </div>
      </div>
    </div>
  );
}