import React from 'react';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  React.useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [onComplete]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-secondary border-b-transparent rounded-full animate-spin-slow"></div>
        </div>
      </div>
      <h2 className="mt-6 text-2xl font-semibold text-primary">Loading...</h2>
      <p className="mt-2 text-muted-foreground">Please wait while we set things up</p>
    </div>
  );
};

export default LoadingScreen;