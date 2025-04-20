import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  Shield, 
  Save,
  RotateCw
} from 'lucide-react';

const RaidProtection: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const serverId = '123456789012345678'; // For MVP we're using a fixed server ID
  
  // Fetch raid protection settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/servers', serverId, 'raid-protection'],
    enabled: !!serverId,
  });
  
  // Update raid protection settings
  const mutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const res = await apiRequest('POST', `/api/servers/${serverId}/raid-protection`, newSettings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers', serverId, 'raid-protection'] });
      toast({
        title: "Settings updated",
        description: "Raid protection settings have been saved",
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
  
  // Toggle lockdown mutation
  const lockdownMutation = useMutation({
    mutationFn: async (lockdownActive: boolean) => {
      const res = await apiRequest('POST', `/api/servers/${serverId}/raid-protection/lockdown`, { lockdownActive });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers', serverId, 'raid-protection'] });
      toast({
        title: data.lockdownActive ? "Lockdown activated" : "Lockdown disabled",
        description: data.lockdownActive 
          ? "Server is now in lockdown mode" 
          : "Server lockdown has been disabled",
      });
    }
  });
  
  const handleSaveSettings = () => {
    if (!settings) return;
    
    mutation.mutate({
      ...settings,
      // Exclude lockdown status from settings update
      lockdownActive: undefined,
      lockdownActivatedAt: undefined
    });
  };
  
  const handleToggleLockdown = () => {
    if (!settings) return;
    lockdownMutation.mutate(!settings.lockdownActive);
  };
  
  const updateSetting = (key: string, value: any) => {
    if (!settings) return;
    
    queryClient.setQueryData(['/api/servers', serverId, 'raid-protection'], {
      ...settings,
      [key]: value
    });
  };
  
  if (isLoading) {
    return (
      <DashboardLayout title="Raid Protection">
        <div className="flex justify-center items-center h-64">
          <RotateCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-300">Loading settings...</span>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Raid Protection">
      <div className="mb-6">
        <Card className="bg-discord-dark border-discord-darker">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-white">Raid Protection Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure how the bot protects against server raids
                </CardDescription>
              </div>
              
              <div>
                <Button 
                  onClick={handleToggleLockdown}
                  disabled={lockdownMutation.isPending}
                  variant={settings?.lockdownActive ? "destructive" : "outline"}
                >
                  {lockdownMutation.isPending ? (
                    <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  {settings?.lockdownActive ? "Disable Lockdown" : "Enable Lockdown"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {settings?.lockdownActive && (
              <div className="px-4 py-5 bg-red-500 bg-opacity-10 rounded-md mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-white">Anti-Raid Mode: <span className="text-red-500">Active</span></h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Server is currently in lockdown mode. New joins are restricted and verification requirements are increased.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Activated: {settings.lockdownActivatedAt ? new Date(settings.lockdownActivatedAt).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">Enable Raid Protection</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Monitor join patterns and detect potential raids
                  </p>
                </div>
                <Switch 
                  checked={settings?.enabled || false}
                  onCheckedChange={(checked) => updateSetting('enabled', checked)}
                />
              </div>
              
              <Separator className="bg-discord-darker" />
              
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Join Rate Detection
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Join Rate Threshold
                    </label>
                    <Slider 
                      value={[settings?.joinRateThreshold || 20]}
                      onValueChange={(value) => updateSetting('joinRateThreshold', value[0])}
                      min={5} 
                      max={50} 
                      step={1} 
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>5 joins/min</span>
                      <span>{settings?.joinRateThreshold || 20} joins/min</span>
                      <span>50 joins/min</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Number of joins within one minute to trigger raid detection
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-white">Auto-Lockdown</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Automatically restrict server when raid detected
                      </p>
                    </div>
                    <Switch 
                      checked={settings?.autoLockdown || false}
                      onCheckedChange={(checked) => updateSetting('autoLockdown', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <Separator className="bg-discord-darker" />
              
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Verification Settings
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Verification Level During Raids
                  </label>
                  <Select 
                    value={settings?.verificationLevel || "HIGH"}
                    onValueChange={(value) => updateSetting('verificationLevel', value)}
                  >
                    <SelectTrigger className="bg-discord-darker">
                      <SelectValue placeholder="Select verification level" />
                    </SelectTrigger>
                    <SelectContent className="bg-discord-dark border-discord-darker">
                      <SelectItem value="LOW">Low - Email Verified</SelectItem>
                      <SelectItem value="MEDIUM">Medium - Registered for 5+ minutes</SelectItem>
                      <SelectItem value="HIGH">High - Member of server for 10+ minutes</SelectItem>
                      <SelectItem value="HIGHEST">Highest - Verified Phone</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Discord verification level to set during raid lockdowns
                  </p>
                </div>
              </div>
              
              <Separator className="bg-discord-darker" />
              
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Notification Settings
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Alert Channel
                  </label>
                  <Input 
                    className="bg-discord-darker text-white"
                    placeholder="Channel ID"
                    value={settings?.alertChannelId || ''}
                    onChange={(e) => updateSetting('alertChannelId', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Channel where raid alerts will be sent
                  </p>
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

export default RaidProtection;
