import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Documentation() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter documentation sections based on search term
  const filterContent = (content: string) => {
    if (!searchTerm) return true;
    return content.toLowerCase().includes(searchTerm.toLowerCase());
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Documentation</h1>
        <p className="text-muted-foreground mt-2">
          Learn how to use Guard-shin bot and all its features.
        </p>
      </div>
      
      <div className="mb-6">
        <Input
          placeholder="Search documentation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md"
        />
      </div>
      
      <Tabs defaultValue="getting-started" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="commands">Commands</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>
        
        <TabsContent value="getting-started">
          {filterContent("getting started setup invite permissions") && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Getting Started with Guard-shin</CardTitle>
                <CardDescription>
                  Learn how to add the bot to your server and set it up.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Inviting the Bot</h3>
                  <p className="text-muted-foreground">
                    To add Guard-shin to your server, click the "Add to Discord" button on our homepage or use the link below:
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input 
                      value="https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot&permissions=8" 
                      readOnly
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={() => navigator.clipboard.writeText("https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot&permissions=8")}>
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    The bot requires Administrator permissions to function properly.
                  </p>
                </div>
                
                <div className="space-y-2 pt-4">
                  <h3 className="text-lg font-medium">Initial Setup</h3>
                  <p className="text-muted-foreground">
                    Once the bot is added to your server, you can begin configuring it with the following steps:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 pl-4 text-muted-foreground">
                    <li>Use <code className="bg-muted px-1 rounded text-sm">;setup</code> command to start the guided setup process.</li>
                    <li>Set a prefix with <code className="bg-muted px-1 rounded text-sm">;prefix [your_prefix]</code> (default is ";")</li>
                    <li>Configure moderator roles with <code className="bg-muted px-1 rounded text-sm">;modrole add @role</code></li>
                    <li>Set up logging channels with <code className="bg-muted px-1 rounded text-sm">;logs set #channel</code></li>
                  </ol>
                </div>
                
                <div className="space-y-2 pt-4">
                  <h3 className="text-lg font-medium">Permissions</h3>
                  <p className="text-muted-foreground">
                    Guard-shin requires specific permissions to function properly:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                    <li><strong>Administrator</strong> - For full functionality and features</li>
                    <li><strong>Manage Server</strong> - For server setting changes</li>
                    <li><strong>Manage Roles</strong> - For role management commands</li>
                    <li><strong>Manage Channels</strong> - For channel management</li>
                    <li><strong>Kick/Ban Members</strong> - For moderation commands</li>
                    <li><strong>Read/Send Messages</strong> - For basic functionality</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
          
          {filterContent("dashboard web interface settings") && (
            <Card>
              <CardHeader>
                <CardTitle>Using the Dashboard</CardTitle>
                <CardDescription>
                  Learn how to use the web dashboard to manage your server.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Accessing the Dashboard</h3>
                  <p className="text-muted-foreground">
                    The Guard-shin dashboard provides a user-friendly interface to manage all bot features. To access:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 pl-4 text-muted-foreground">
                    <li>Log in with your Discord account by clicking "Dashboard Login" on our homepage</li>
                    <li>You'll see all servers where you have "Manage Server" permissions and Guard-shin is added</li>
                    <li>Select the server you want to manage</li>
                  </ol>
                </div>
                
                <div className="space-y-2 pt-4">
                  <h3 className="text-lg font-medium">Dashboard Features</h3>
                  <p className="text-muted-foreground">
                    The dashboard allows you to configure:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                    <li><strong>Auto-Moderation</strong> - Set up filters for inappropriate content</li>
                    <li><strong>Raid Protection</strong> - Configure anti-raid measures</li>
                    <li><strong>Verification</strong> - Set up member verification</li>
                    <li><strong>Welcome Messages</strong> - Customize join/leave messages</li>
                    <li><strong>Logging</strong> - Configure detailed server logs</li>
                    <li><strong>Command Prefix</strong> - Change the bot's command prefix</li>
                    <li><strong>Premium Features</strong> - Manage premium subscriptions and features</li>
                  </ul>
                </div>
                
                <div className="space-y-2 pt-4">
                  <h3 className="text-lg font-medium">Dashboard Permissions</h3>
                  <p className="text-muted-foreground">
                    Access to dashboard features depends on your Discord permissions:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                    <li><strong>Server Owner/Administrator</strong> - Full access to all settings</li>
                    <li><strong>Manage Server</strong> - Access to most settings</li>
                    <li><strong>Moderator (with appropriate roles)</strong> - Access to moderation logs and tools</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="commands">
          {filterContent("commands moderation admin") && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Command Usage</CardTitle>
                <CardDescription>
                  Learn how to use Guard-shin commands effectively.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Command Structure</h3>
                  <p className="text-muted-foreground">
                    Guard-shin commands follow this general structure:
                  </p>
                  <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                    {`prefix + command + subcommand + arguments
Example: ;ban @user Spamming in chat
         └─┘ └──┘ └────┘ └───────────┘
         prefix cmd  user    reason   `}
                  </pre>
                </div>
                
                <div className="space-y-2 pt-4">
                  <h3 className="text-lg font-medium">Getting Help</h3>
                  <p className="text-muted-foreground">
                    To get help with commands, use:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                    <li><code className="bg-muted px-1 rounded text-sm">;help</code> - Shows a list of all available commands</li>
                    <li><code className="bg-muted px-1 rounded text-sm">;help [command]</code> - Shows detailed help for a specific command</li>
                  </ul>
                </div>
                
                <div className="space-y-2 pt-4">
                  <h3 className="text-lg font-medium">Command Categories</h3>
                  <p className="text-muted-foreground">
                    Commands are organized into categories:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                    <li><strong>Moderation</strong> - Commands for managing users and enforcing rules</li>
                    <li><strong>Admin</strong> - Administrative commands for server configuration</li>
                    <li><strong>Utility</strong> - General utility and information commands</li>
                    <li><strong>Fun</strong> - Entertainment commands for server members</li>
                    <li><strong>Music</strong> - Commands for playing music in voice channels</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    View all commands in each category with <code className="bg-muted px-1 rounded text-sm">;help [category]</code>
                  </p>
                </div>
                
                <div className="pt-4">
                  <Button variant="outline" onClick={() => window.location.href = '/commands'}>
                    View Full Command List
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="features">
          {filterContent("features automod raid protection verification") && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Auto-Moderation</CardTitle>
                <CardDescription>
                  Learn how to set up and use the auto-moderation features.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">What is Auto-Moderation?</h3>
                  <p className="text-muted-foreground">
                    Auto-moderation automatically detects and takes action on rule-breaking content without manual moderator intervention. It can:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                    <li>Filter inappropriate content and language</li>
                    <li>Remove spam and excessive caps/emojis</li>
                    <li>Detect and prevent raid attempts</li>
                    <li>Manage server invites and links</li>
                  </ul>
                </div>
                
                <div className="space-y-2 pt-4">
                  <h3 className="text-lg font-medium">Setting Up Auto-Moderation</h3>
                  <p className="text-muted-foreground">
                    Configure auto-moderation through the dashboard or with these commands:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                    <li><code className="bg-muted px-1 rounded text-sm">;automod setup</code> - Start guided setup</li>
                    <li><code className="bg-muted px-1 rounded text-sm">;automod filter [type] [action]</code> - Configure content filters</li>
                    <li><code className="bg-muted px-1 rounded text-sm">;automod spam [on/off]</code> - Toggle spam detection</li>
                    <li><code className="bg-muted px-1 rounded text-sm">;automod links [allow/deny]</code> - Configure link filtering</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
          
          {filterContent("features raid protection anti-raid") && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Raid Protection</CardTitle>
                <CardDescription>
                  Learn how to secure your server against raid attacks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">What is Raid Protection?</h3>
                  <p className="text-muted-foreground">
                    Raid protection helps prevent coordinated attacks on your server by monitoring join patterns and suspicious activity. It automatically:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                    <li>Detects unusual spikes in member joins</li>
                    <li>Identifies and removes spam accounts</li>
                    <li>Can temporarily lock down the server during attacks</li>
                    <li>Provides detailed logging of raid attempts</li>
                  </ul>
                </div>
                
                <div className="space-y-2 pt-4">
                  <h3 className="text-lg font-medium">Setting Up Raid Protection</h3>
                  <p className="text-muted-foreground">
                    Configure raid protection through the dashboard or with these commands:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                    <li><code className="bg-muted px-1 rounded text-sm">;raidprotection setup</code> - Start guided setup</li>
                    <li><code className="bg-muted px-1 rounded text-sm">;raidprotection sensitivity [low/medium/high]</code> - Set detection sensitivity</li>
                    <li><code className="bg-muted px-1 rounded text-sm">;raidprotection action [verify/kick/ban]</code> - Set automatic action</li>
                    <li><code className="bg-muted px-1 rounded text-sm">;lockdown [duration]</code> - Manually trigger server lockdown</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
          
          {filterContent("features verification captcha") && (
            <Card>
              <CardHeader>
                <CardTitle>Verification System</CardTitle>
                <CardDescription>
                  Learn how to set up member verification for your server.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">What is Verification?</h3>
                  <p className="text-muted-foreground">
                    The verification system ensures new members are legitimate before they can access your server. Features include:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                    <li>Captcha verification to prevent bots</li>
                    <li>Account age requirements</li>
                    <li>Custom verification messages</li>
                    <li>Automatic role assignment after verification</li>
                  </ul>
                </div>
                
                <div className="space-y-2 pt-4">
                  <h3 className="text-lg font-medium">Setting Up Verification</h3>
                  <p className="text-muted-foreground">
                    Configure verification through the dashboard or with these commands:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                    <li><code className="bg-muted px-1 rounded text-sm">;verification setup</code> - Start guided setup</li>
                    <li><code className="bg-muted px-1 rounded text-sm">;verification type [captcha/reaction/message]</code> - Set verification method</li>
                    <li><code className="bg-muted px-1 rounded text-sm">;verification role @role</code> - Set the role given after verification</li>
                    <li><code className="bg-muted px-1 rounded text-sm">;verification message [text]</code> - Set custom verification message</li>
                  </ul>
                </div>
                
                <div className="rounded-md bg-muted p-4 mt-4">
                  <div className="text-sm font-medium mb-2">Premium Feature</div>
                  <p className="text-sm text-muted-foreground">
                    Advanced verification options including custom captcha styles, multi-factor verification, and raid-proof verification are available with Premium.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="faq">
          {filterContent("faq questions answers help") && (
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Common questions and answers about Guard-shin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <h3 className="font-medium">How do I change the bot's prefix?</h3>
                  <p className="text-muted-foreground">
                    Use the command <code className="bg-muted px-1 rounded text-sm">;prefix [new_prefix]</code> to change the command prefix. For example, <code className="bg-muted px-1 rounded text-sm">;prefix !</code> will change the prefix to "!".
                  </p>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-medium">What are the premium features?</h3>
                  <p className="text-muted-foreground">
                    Premium features include custom welcome images, advanced verification, auto-response systems, reaction roles, and more. You can see all premium features on the Pricing page.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-medium">Why can't the bot see all channels?</h3>
                  <p className="text-muted-foreground">
                    The bot needs appropriate permissions to access channels. Ensure it has the "View Channels" permission for all channels you want it to moderate or operate in.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-medium">How do I report a bug?</h3>
                  <p className="text-muted-foreground">
                    You can report bugs through the dashboard's Contact page or by joining our support server and opening a ticket.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-medium">Can I use custom commands?</h3>
                  <p className="text-muted-foreground">
                    Yes, custom commands are available with premium subscriptions. You can create them with the <code className="bg-muted px-1 rounded text-sm">;customcommand add [name] [response]</code> command.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-medium">How many servers can I use the bot in?</h3>
                  <p className="text-muted-foreground">
                    The free version can be used in unlimited servers. Premium subscriptions are per-server and need to be purchased separately for each server.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-medium">Does the bot support slash commands?</h3>
                  <p className="text-muted-foreground">
                    Yes, Guard-shin supports both traditional prefix commands and Discord slash commands.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-medium">How do I get help if I'm stuck?</h3>
                  <p className="text-muted-foreground">
                    Join our <a href="https://discord.gg/g3rFbaW6gw" className="text-primary hover:underline">support server</a> for immediate assistance, or contact us through the dashboard.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}