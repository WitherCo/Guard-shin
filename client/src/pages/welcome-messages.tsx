import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WelcomeMessages() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Welcome message settings
  const [enabled, setEnabled] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome {user} to {server}! You are member #{count}.");
  const [welcomeChannel, setWelcomeChannel] = useState("");
  
  // Welcome image settings
  const [imageEnabled, setImageEnabled] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#2F3136");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [backgroundImage, setBackgroundImage] = useState("default");
  const [welcomeImageStyle, setWelcomeImageStyle] = useState("modern");

  const handleSaveTextSettings = async () => {
    setIsLoading(true);
    
    // Simulating an API call
    setTimeout(() => {
      toast({
        title: "Welcome message updated",
        description: "Your welcome message settings have been saved.",
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleSaveImageSettings = async () => {
    setIsLoading(true);
    
    // Simulating an API call
    setTimeout(() => {
      toast({
        title: "Welcome image updated",
        description: "Your welcome image settings have been saved.",
      });
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome Messages</h1>
        <p className="text-muted-foreground mt-2">
          Configure how new members are greeted when they join your server.
        </p>
      </div>

      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="text">Text Greeting</TabsTrigger>
          <TabsTrigger value="image">Welcome Image</TabsTrigger>
        </TabsList>
        
        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Message Settings</CardTitle>
              <CardDescription>
                Configure a custom text message for when new members join your server.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="welcome-message-enabled" 
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
                <Label htmlFor="welcome-message-enabled">Enable welcome messages</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="welcome-channel">Welcome Channel</Label>
                <Select 
                  value={welcomeChannel} 
                  onValueChange={setWelcomeChannel}
                  disabled={!enabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">general</SelectItem>
                    <SelectItem value="welcome">welcome</SelectItem>
                    <SelectItem value="introductions">introductions</SelectItem>
                    <SelectItem value="lobby">lobby</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Textarea
                  id="welcome-message"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Enter welcome message"
                  disabled={!enabled}
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Available variables: {'{user}'} - Username, {'{server}'} - Server name, {'{count}'} - Member count
                </p>
              </div>
              
              <div className="p-4 border rounded-lg bg-muted">
                <h4 className="font-medium mb-2">Preview:</h4>
                <div className="p-3 bg-card rounded-md border">
                  {welcomeMessage
                    .replace('{user}', 'NewUser')
                    .replace('{server}', 'Your Server')
                    .replace('{count}', '42')}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveTextSettings} 
                disabled={isLoading || !enabled}
              >
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="image">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Image</CardTitle>
              <CardDescription>
                Create custom welcome images for new members (Premium Feature).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="welcome-image-enabled" 
                  checked={imageEnabled}
                  onCheckedChange={setImageEnabled}
                />
                <Label htmlFor="welcome-image-enabled">Enable welcome images</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="background-color">Background Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="background-color"
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      disabled={!imageEnabled}
                      className="w-12 h-10 p-1"
                    />
                    <Input 
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      disabled={!imageEnabled}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="text-color"
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      disabled={!imageEnabled}
                      className="w-12 h-10 p-1"
                    />
                    <Input 
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      disabled={!imageEnabled}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="background-image">Background Image</Label>
                <Select 
                  value={backgroundImage} 
                  onValueChange={setBackgroundImage}
                  disabled={!imageEnabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a background" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                    <SelectItem value="geometric">Geometric</SelectItem>
                    <SelectItem value="space">Space</SelectItem>
                    <SelectItem value="custom">Custom URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="welcome-style">Welcome Card Style</Label>
                <Select 
                  value={welcomeImageStyle} 
                  onValueChange={setWelcomeImageStyle}
                  disabled={!imageEnabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                    <SelectItem value="dynamic">Dynamic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-4 border rounded-lg bg-muted">
                <h4 className="font-medium mb-2">Preview:</h4>
                <div 
                  className="rounded-md flex items-center justify-center h-48 p-4 relative overflow-hidden"
                  style={{ 
                    backgroundColor: backgroundColor,
                    color: textColor
                  }}
                >
                  <div className="text-center z-10">
                    <div className="text-2xl font-bold mb-2">Welcome to Your Server!</div>
                    <div className="text-xl">NewUser#1234</div>
                    <div className="mt-2 text-sm opacity-80">Member #42</div>
                  </div>
                  <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-purple-500 to-blue-600"></div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveImageSettings} 
                disabled={isLoading || !imageEnabled}
              >
                {isLoading ? "Saving..." : "Save Image Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}