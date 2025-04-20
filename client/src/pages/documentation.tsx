import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Documentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: 'Copied to clipboard',
          description: 'Command copied to clipboard successfully!',
        });
      })
      .catch(() => {
        toast({
          title: 'Failed to copy',
          description: 'Could not copy to clipboard. Please try again.',
          variant: 'destructive',
        });
      });
  };

  const sections = [
    { id: 'getting-started', title: 'Getting Started' },
    { id: 'moderation', title: 'Moderation' },
    { id: 'auto-moderation', title: 'Auto-Moderation' },
    { id: 'raid-protection', title: 'Raid Protection' },
    { id: 'verification', title: 'Verification' },
    { id: 'welcome-messages', title: 'Welcome Messages' },
    { id: 'music-player', title: 'Music Player' },
    { id: 'premium-features', title: 'Premium Features' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Guard-shin Documentation</h1>
      <p className="text-muted-foreground mb-8">Complete guide to using Guard-shin bot's features</p>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-1/4">
          <div className="sticky top-4 bg-card rounded-lg p-4 border">
            <h2 className="text-xl font-bold mb-4">Contents</h2>
            <nav>
              <ul className="space-y-2">
                {sections.map(section => (
                  <li key={section.id}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors ${
                        activeSection === section.id ? 'bg-primary text-primary-foreground' : ''
                      }`}
                      onClick={() => setActiveSection(section.id)}
                    >
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
        
        {/* Main content */}
        <div className="md:w-3/4">
          <div className="bg-card rounded-lg p-6 border">
            {activeSection === 'getting-started' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Getting Started with Guard-shin</h2>
                <p className="mb-4">
                  Guard-shin is an advanced Discord moderation and security bot that provides 
                  intelligent protection for your server. Follow these steps to get started:
                </p>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">1. Invite Guard-shin to your server</h3>
                  <p className="mb-2">Click the button below to add Guard-shin to your Discord server:</p>
                  <a
                    href="https://discord.com/oauth2/authorize?client_id=1361873604882731008"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Invite Guard-shin
                  </a>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">2. Set up permissions</h3>
                  <p className="mb-4">
                    Guard-shin requires specific permissions to function properly. Make sure the bot
                    has the following permissions:
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Manage Server</li>
                    <li>Kick Members</li>
                    <li>Ban Members</li>
                    <li>Manage Roles</li>
                    <li>Manage Channels</li>
                    <li>Manage Messages</li>
                    <li>Read Message History</li>
                    <li>Send Messages</li>
                  </ul>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">3. Basic configuration</h3>
                  <p className="mb-2">
                    Configure the basic settings of Guard-shin using the following command:
                  </p>
                  <div className="bg-muted p-3 rounded-md mb-2 font-mono flex justify-between items-center">
                    <code>/setup</code>
                    <button 
                      onClick={() => copyToClipboard('/setup')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This will guide you through the initial setup process.
                  </p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">4. Join our support server</h3>
                  <p className="mb-2">
                    If you need help or want to stay updated with the latest features, join our support server:
                  </p>
                  <a
                    href="https://discord.gg/g3rFbaW6gw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Join Support Server
                  </a>
                </div>
              </div>
            )}
            
            {activeSection === 'premium-features' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Premium Features</h2>
                <p className="mb-6">
                  Upgrade to Guard-shin Premium to unlock powerful features that enhance your server's moderation
                  capabilities and member experience.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  <div className="border rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-2">Custom Welcome Images</h3>
                    <p>Customize welcome images with server statistics and user avatars.</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-2">Advanced Auto-Mod</h3>
                    <p>Advanced content filtering with custom word lists and AI-powered detection.</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-2">Music Player</h3>
                    <p>High-quality music playback from YouTube, Spotify, and SoundCloud.</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-2">Auto-Responders</h3>
                    <p>Create custom auto-responses with triggers and advanced formatting.</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-700 to-blue-700 text-white rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-bold mb-2">Unlock All Premium Features</h3>
                  <p className="mb-4">Get access to all premium features with a subscription starting at just $5.99/month.</p>
                  <a 
                    href="/premium-subscription" 
                    className="inline-block bg-white text-blue-700 font-bold py-2 px-4 rounded hover:bg-blue-50 transition-colors"
                  >
                    View Premium Plans
                  </a>
                </div>
              </div>
            )}
            
            {/* Other sections would go here */}
            {(activeSection !== 'getting-started' && activeSection !== 'premium-features') && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">Coming soon...</p>
                <h3 className="text-xl font-semibold">This documentation section is being updated</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;