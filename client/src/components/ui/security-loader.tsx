import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Shield, ShieldAlert, ShieldCheck, Lock, Scan, Fingerprint } from 'lucide-react';

const loaderVariants = cva(
  "animate-pulse flex flex-col items-center justify-center gap-4 text-center",
  {
    variants: {
      variant: {
        default: "text-primary",
        secondary: "text-secondary",
        destructive: "text-destructive",
        outline: "text-primary/70",
      },
      size: {
        default: "h-20 w-20",
        sm: "h-12 w-12",
        lg: "h-32 w-32",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Define different animation types for variety
export type LoaderType = "shield" | "scanning" | "fingerprint" | "lock" | "random";

export interface SecurityLoaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loaderVariants> {
  type?: LoaderType;
  text?: string;
}

function getRandomLoaderType(): LoaderType {
  const types: LoaderType[] = ["shield", "scanning", "fingerprint", "lock"];
  return types[Math.floor(Math.random() * types.length)];
}

export function SecurityLoader({ 
  className, 
  variant, 
  size, 
  type = "random",
  text,
  ...props 
}: SecurityLoaderProps) {
  // Use random type if specified
  const loaderType = type === "random" ? getRandomLoaderType() : type;
  
  // Animation classes for different loader types
  const iconAnimationClasses = {
    shield: "animate-pulse",
    scanning: "animate-bounce", 
    fingerprint: "animate-pulse",
    lock: "animate-spin-slow",
  };
  
  // Get icon based on loader type
  const renderIcon = () => {
    switch (loaderType) {
      case "shield":
        return (
          <div className="relative">
            <Shield className={cn("opacity-30", iconAnimationClasses.shield)} />
            <ShieldCheck className={cn("absolute top-0 left-0 opacity-80", iconAnimationClasses.shield)} />
          </div>
        );
      case "scanning":
        return <Scan className={cn(iconAnimationClasses.scanning)} />;
      case "fingerprint":
        return <Fingerprint className={cn(iconAnimationClasses.fingerprint)} />;
      case "lock":
        return <Lock className={cn(iconAnimationClasses.lock)} />;
      default:
        return <ShieldAlert className={cn(iconAnimationClasses.shield)} />;
    }
  };

  return (
    <div 
      className={cn("flex flex-col items-center justify-center", className)}
      {...props}
    >
      <div className={cn(loaderVariants({ variant, size, className }))}>
        {renderIcon()}
      </div>
      {text && (
        <p className="mt-4 text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}