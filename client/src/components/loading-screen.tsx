import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface LoadingScreenProps {
  onComplete?: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Initializing...");
  
  useEffect(() => {
    const messages = [
      "Initializing...",
      "Loading resources...",
      "Connecting to server...",
      "Preparing dashboard...",
      "Almost there..."
    ];
    
    // Simulate a loading process with different messages
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 5;
        
        // Update the message at certain progress thresholds
        if (newProgress === 20) {
          setMessage(messages[1]);
        } else if (newProgress === 40) {
          setMessage(messages[2]);
        } else if (newProgress === 60) {
          setMessage(messages[3]);
        } else if (newProgress === 80) {
          setMessage(messages[4]);
        }
        
        // Call onComplete when loading is done
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 500);
          return 100;
        }
        
        return newProgress;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [onComplete]);
  
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md px-4 py-8 space-y-6 rounded-lg bg-card shadow-xl">
        <div className="flex items-center justify-center mb-6">
          <div className="h-16 w-16 mr-4">
            <div className="h-full w-full rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <h1 className="text-2xl font-bold text-primary">Guard-shin</h1>
        </div>
        
        <Progress value={progress} className="h-2 w-full" />
        
        <p className="text-center text-muted-foreground">{message}</p>
        
        <div className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} WitherCo | Security for Discord
        </div>
      </div>
    </div>
  );
}