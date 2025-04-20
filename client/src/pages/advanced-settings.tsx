import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function AdvancedSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Sample advanced settings
  const [logEnabled, setLogEnabled] = useState(true);
  const [deleteCommandsAfter, setDeleteCommandsAfter] = useState(5); // in seconds
  const [customCommandsEnabled, setCustomCommandsEnabled] = useState(true);
  const [customRolesEnabled, setCustomRolesEnabled] = useState(true);
  const [backupEnabled, setBackupEnabled] = useState(false);
  const [backupInterval, setBackupInterval] = useState(24); // in hours

  const handleSaveGeneral = () => {
    setIsLoading(true);
    
    // Simulate an API call
    setTimeout(() => {
      toast({
        title: "Settings saved",
        description: "General settings have been updated successfully.",
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleSaveBackup = () => {
    setIsLoading(true);
    
    // Simulate an API call
    setTimeout(() => {
      toast({
        title: "Backup settings saved",
        description: "Backup settings have been updated successfully.",
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleGenerateBackup = () => {
    setIsLoading(true);
    
    // Simulate an API call
    setTimeout(() => {
      toast({
        title: "Backup generated",
        description: "Server backup has been generated successfully.",
      });
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Advanced Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure advanced options for your Discord server.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure advanced general settings for the bot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="log-commands">Command Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log all commands used in your server
                  </p>
                </div>
                <Switch 
                  id="log-commands" 
                  checked={logEnabled}
                  onCheckedChange={setLogEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="delete-commands">Auto-delete Commands</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically delete command messages after execution
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    id="delete-commands"
                    type="number"
                    value={deleteCommandsAfter}
                    onChange={(e) => setDeleteCommandsAfter(parseInt(e.target.value))}
                    className="w-16"
                    min="0"
                    max="60"
                  />
                  <span className="text-sm text-muted-foreground">seconds</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="custom-commands">Custom Commands</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow server admins to create custom commands
                  </p>
                </div>
                <Switch 
                  id="custom-commands" 
                  checked={customCommandsEnabled}
                  onCheckedChange={setCustomCommandsEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="custom-roles">Custom Role Management</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow bot to manage custom roles
                  </p>
                </div>
                <Switch 
                  id="custom-roles" 
                  checked={customRolesEnabled}
                  onCheckedChange={setCustomRolesEnabled}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveGeneral}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup Settings</CardTitle>
              <CardDescription>
                Configure server backup options (Premium Feature).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-backup">Automatic Backup</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically backup server settings and data
                  </p>
                </div>
                <Switch 
                  id="auto-backup" 
                  checked={backupEnabled}
                  onCheckedChange={setBackupEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="backup-interval">Backup Interval</Label>
                  <p className="text-sm text-muted-foreground">
                    How often to create automatic backups
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    id="backup-interval"
                    type="number"
                    value={backupInterval}
                    onChange={(e) => setBackupInterval(parseInt(e.target.value))}
                    className="w-16"
                    min="1"
                    max="168"
                    disabled={!backupEnabled}
                  />
                  <span className="text-sm text-muted-foreground">hours</span>
                </div>
              </div>
              
              <div className="pt-4">
                <Button variant="outline" onClick={handleGenerateBackup} disabled={isLoading}>
                  Generate Backup Now
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveBackup}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Backup Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="debug">
          <Card>
            <CardHeader>
              <CardTitle>Debug Options</CardTitle>
              <CardDescription>
                Advanced debugging tools for troubleshooting (Admin Only).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/50 p-4 border border-yellow-200 dark:border-yellow-900">
                  <div className="flex items-start">
                    <div className="text-yellow-800 dark:text-yellow-300">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Warning</h3>
                      <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300/80">
                        Debug options can affect bot performance and stability. Use with caution.
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  <Button variant="secondary">Reset Bot Cache</Button>
                  <Button variant="secondary">Reconnect to Discord API</Button>
                  <Button variant="secondary">Check Database Connection</Button>
                  <Button variant="secondary">View Log Files</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}