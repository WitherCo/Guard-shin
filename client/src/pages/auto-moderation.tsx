import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import FeatureToggle from '@/components/dashboard/FeatureToggle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { 
  MessageSquareOff, 
  Workflow, 
  Link, 
  Copy, 
  ImageOff, 
  Save,
  RotateCw
} from 'lucide-react';

const AutoModeration: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const serverId = '123456789012345678'; // For MVP we're using a fixed server ID
  
  // Fetch auto-mod settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/servers', serverId, 'automod'],
    enabled: !!serverId,
  });
  
  // Update auto-mod settings
  const mutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const res = await apiRequest('POST', `/api/servers/${serverId}/automod`, newSettings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers', serverId, 'automod'] });
      toast({
        title: "Settings updated",
        description: "Auto-moderation settings have been saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  const handleSaveSettings = () => {
    if (!settings) return;
    
    mutation.mutate({
      ...settings,
    });
  };
  
  const toggleFeature = (feature: keyof typeof settings, value: boolean) => {
    if (!settings) return;
    
    queryClient.setQueryData(['/api/servers', serverId, 'automod'], {
      ...settings,
      [feature]: value
    });
  };
  
  if (isLoading) {
    return (
      <DashboardLayout title="Auto-Moderation">
        <div className="flex justify-center items-center h-64">
          <RotateCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-300">Loading settings...</span>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Auto-Moderation">
      <div className="mb-6">
        <Card className="bg-discord-dark border-discord-darker">
          <CardHeader>
            <CardTitle className="text-white">Auto-Moderation Settings</CardTitle>
            <CardDescription className="text-gray-400">
              Configure how the bot automatically moderates messages and content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-300">Enabled Features</h3>
                
                <FeatureToggle
                  icon={<MessageSquareOff />}
                  title="Profanity Filter"
                  description="Automatically delete messages containing profanity"
                  enabled={settings?.profanityFilterEnabled || false}
                  onToggle={(value) => toggleFeature('profanityFilterEnabled', value)}
                />
                
                <FeatureToggle
                  icon={<Workflow />}
                  title="Spam Detection"
                  description="Timeout users who send messages too quickly"
                  enabled={settings?.spamDetectionEnabled || false}
                  onToggle={(value) => toggleFeature('spamDetectionEnabled', value)}
                />
                
                <FeatureToggle
                  icon={<Link />}
                  title="Link Filter"
                  description="Block messages containing suspicious links"
                  enabled={settings?.linkFilterEnabled || false}
                  onToggle={(value) => toggleFeature('linkFilterEnabled', value)}
                />
                
                <FeatureToggle
                  icon={<Copy />}
                  title="Duplicate Messages"
                  description="Prevent users from sending the same message repeatedly"
                  enabled={settings?.duplicateMessagesEnabled || false}
                  onToggle={(value) => toggleFeature('duplicateMessagesEnabled', value)}
                />
                
                <FeatureToggle
                  icon={<ImageOff />}
                  title="Media Scanning"
                  description="Scan images for inappropriate content"
                  enabled={settings?.mediaScanningEnabled || false}
                  onToggle={(value) => toggleFeature('mediaScanningEnabled', value)}
                />
              </div>
              
              <Separator className="bg-discord-darker" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Profanity Words</h3>
                  <Textarea 
                    className="bg-discord-darker text-white"
                    placeholder="Enter prohibited words, one per line"
                    rows={5}
                    defaultValue={(settings?.profanityWords || []).join('\n')}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Messages containing these words will be automatically deleted
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Allowed Links</h3>
                  <Textarea 
                    className="bg-discord-darker text-white"
                    placeholder="Enter allowed domains, one per line"
                    rows={5}
                    defaultValue={(settings?.allowedLinks || []).join('\n')}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only links to these domains will be allowed, all others will be blocked
                  </p>
                </div>
              </div>
              
              <Separator className="bg-discord-darker" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Spam Detection Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Message Threshold
                      </label>
                      <Slider 
                        defaultValue={[settings?.spamThreshold || 5]} 
                        min={3} 
                        max={15} 
                        step={1} 
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>3 messages</span>
                        <span>{settings?.spamThreshold || 5} messages</span>
                        <span>15 messages</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Number of messages sent within the time window to trigger spam detection
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Time Window (seconds)
                      </label>
                      <Slider 
                        defaultValue={[settings?.spamTimeWindow || 5]} 
                        min={3} 
                        max={30} 
                        step={1} 
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>3 seconds</span>
                        <span>{settings?.spamTimeWindow || 5} seconds</span>
                        <span>30 seconds</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Time window to count messages for spam detection
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Logging</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Log Channel
                      </label>
                      <Input 
                        className="bg-discord-darker text-white"
                        placeholder="Channel ID"
                        defaultValue={settings?.logChannelId || ''}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Channel where auto-moderation actions will be logged
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={mutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {mutation.isPending ? (
                    <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AutoModeration;
