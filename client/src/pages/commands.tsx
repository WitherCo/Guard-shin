import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Command {
  name: string;
  description: string;
  category: string;
  usage: string;
  premium: boolean;
}

const Commands: React.FC = () => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    // Temporary mock data while we develop the page
    const mockCommands: Command[] = [
      {
        name: 'ban',
        description: 'Ban a user from the server with an optional reason',
        category: 'moderation',
        usage: '/ban @user [reason]',
        premium: false
      },
      {
        name: 'kick',
        description: 'Kick a user from the server with an optional reason',
        category: 'moderation',
        usage: '/kick @user [reason]',
        premium: false
      },
      {
        name: 'mute',
        description: 'Mute a user for a specified time period',
        category: 'moderation',
        usage: '/mute @user [time] [reason]',
        premium: false
      },
      {
        name: 'welcome',
        description: 'Configure welcome messages for new members',
        category: 'settings',
        usage: '/welcome channel #channel',
        premium: true
      },
      {
        name: 'autorole',
        description: 'Automatically assign roles to new members',
        category: 'settings',
        usage: '/autorole add @role',
        premium: true
      },
      {
        name: 'play',
        description: 'Play a song from YouTube, Spotify or a URL',
        category: 'music',
        usage: '/play [song name or URL]',
        premium: true
      }
    ];

    // Simulate API request
    setTimeout(() => {
      setCommands(mockCommands);
      setLoading(false);
    }, 1000);

    // In a real scenario, we would fetch from the API
    // const fetchCommands = async () => {
    //   try {
    //     const response = await apiRequest('GET', '/api/commands');
    //     
    //     if (response.ok) {
    //       const data = await response.json();
    //       setCommands(data);
    //     } else {
    //       toast({
    //         title: "Error",
    //         description: "Failed to load commands. Please try again.",
    //         variant: "destructive",
    //       });
    //     }
    //   } catch (error) {
    //     console.error('Error fetching commands:', error);
    //     toast({
    //       title: "Error",
    //       description: "An unexpected error occurred. Please try again.",
    //       variant: "destructive",
    //     });
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // 
    // fetchCommands();
  }, [toast]);

  const filteredCommands = commands.filter(command => {
    if (filter === 'all') return true;
    if (filter === 'premium') return command.premium;
    if (filter === 'free') return !command.premium;
    return command.category === filter;
  });

  const categories = ['all', 'moderation', 'settings', 'music', 'premium', 'free'];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Guard-shin Commands</h1>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(category => (
          <button
            key={category}
            className={`px-4 py-2 rounded-md ${
              filter === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
            onClick={() => setFilter(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCommands.map(command => (
          <div 
            key={command.name}
            className="border rounded-lg p-4 bg-card"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold">{command.name}</h3>
              {command.premium && (
                <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">
                  Premium
                </span>
              )}
            </div>
            <p className="text-muted-foreground mb-3">{command.description}</p>
            <div className="bg-muted p-2 rounded font-mono text-sm">
              {command.usage}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Commands;