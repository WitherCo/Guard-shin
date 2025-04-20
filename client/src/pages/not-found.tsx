import React from 'react';
import { Link } from 'wouter';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="bg-card border rounded-lg p-8 max-w-md w-full">
        <div className="mb-6 flex justify-center">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">
          Sorry, the page you're looking for doesn't exist or is still under construction.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md">
            Go Home
          </Link>
          <Link href="/documentation" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 py-2 px-4 rounded-md">
            View Documentation
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;