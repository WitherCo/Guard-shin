import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SelectTrigger, SelectValue, Select, SelectContent, SelectItem } from "@/components/ui/select";

// Sample command data
const moderationCommands = [
  { name: "ban", description: "Ban a user from the server", usage: ";ban @user [reason]", premium: false },
  { name: "kick", description: "Kick a user from the server", usage: ";kick @user [reason]", premium: false },
  { name: "mute", description: "Mute a user in the server", usage: ";mute @user [duration] [reason]", premium: false },
  { name: "warn", description: "Warn a user", usage: ";warn @user [reason]", premium: false },
  { name: "infractions", description: "View a user's infractions", usage: ";infractions @user", premium: false },
  { name: "purge", description: "Delete multiple messages at once", usage: ";purge [amount]", premium: false },
  { name: "lockdown", description: "Lock a channel temporarily", usage: ";lockdown [duration]", premium: false },
  { name: "slowmode", description: "Set slowmode for a channel", usage: ";slowmode [seconds]", premium: false },
];

const utilityCommands = [
  { name: "help", description: "Show the help menu", usage: ";help [command]", premium: false },
  { name: "ping", description: "Check the bot's latency", usage: ";ping", premium: false },
  { name: "userinfo", description: "Show info about a user", usage: ";userinfo [@user]", premium: false },
  { name: "serverinfo", description: "Show info about the server", usage: ";serverinfo", premium: false },
  { name: "avatar", description: "Get a user's avatar", usage: ";avatar [@user]", premium: false },
  { name: "role", description: "Manage roles", usage: ";role add/remove @user @role", premium: false },
  { name: "remind", description: "Set a reminder", usage: ";remind [time] [message]", premium: false },
  { name: "poll", description: "Create a poll", usage: ";poll [question] [options]", premium: false },
];

const adminCommands = [
  { name: "setup", description: "Set up bot features", usage: ";setup [feature]", premium: false },
  { name: "prefix", description: "Change the command prefix", usage: ";prefix [new_prefix]", premium: false },
  { name: "autorole", description: "Configure auto-role settings", usage: ";autorole add/remove @role", premium: true },
  { name: "welcome", description: "Configure welcome messages", usage: ";welcome [option] [value]", premium: true },
  { name: "logs", description: "Configure logging channels", usage: ";logs [option] [channel]", premium: false },
  { name: "automod", description: "Configure auto-moderation", usage: ";automod [option] [value]", premium: false },
  { name: "verification", description: "Set up verification system", usage: ";verification [option] [value]", premium: true },
  { name: "backup", description: "Manage server backups", usage: ";backup create/load", premium: true },
];

const musicCommands = [
  { name: "play", description: "Play a song", usage: ";play [song name or URL]", premium: false },
  { name: "skip", description: "Skip the current song", usage: ";skip", premium: false },
  { name: "stop", description: "Stop the music and clear queue", usage: ";stop", premium: false },
  { name: "queue", description: "View the current queue", usage: ";queue", premium: false },
  { name: "volume", description: "Adjust the volume", usage: ";volume [1-100]", premium: false },
  { name: "loop", description: "Loop the current song or queue", usage: ";loop [song/queue]", premium: true },
  { name: "shuffle", description: "Shuffle the queue", usage: ";shuffle", premium: true },
  { name: "lyrics", description: "Show lyrics for the current song", usage: ";lyrics", premium: true },
];

const funCommands = [
  { name: "8ball", description: "Ask the magic 8ball", usage: ";8ball [question]", premium: false },
  { name: "meme", description: "Get a random meme", usage: ";meme", premium: false },
  { name: "joke", description: "Get a random joke", usage: ";joke", premium: false },
  { name: "fact", description: "Get a random fact", usage: ";fact", premium: false },
  { name: "rps", description: "Play rock paper scissors", usage: ";rps [rock/paper/scissors]", premium: false },
  { name: "coinflip", description: "Flip a coin", usage: ";coinflip", premium: false },
  { name: "customcommand", description: "Create custom commands", usage: ";customcommand add [name] [response]", premium: true },
  { name: "quote", description: "Random quote generator", usage: ";quote", premium: false },
];

export default function Commands() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [premiumFilter, setPremiumFilter] = useState("all");
  
  // Combine all commands into one array
  const allCommands = [
    ...moderationCommands.map(cmd => ({ ...cmd, category: "moderation" })),
    ...utilityCommands.map(cmd => ({ ...cmd, category: "utility" })),
    ...adminCommands.map(cmd => ({ ...cmd, category: "admin" })),
    ...musicCommands.map(cmd => ({ ...cmd, category: "music" })),
    ...funCommands.map(cmd => ({ ...cmd, category: "fun" })),
  ];
  
  // Filter commands based on search term, category, and premium status
  const filteredCommands = allCommands.filter(cmd => {
    const matchesSearch = 
      cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = category === "all" || cmd.category === category;
    
    const matchesPremium = 
      premiumFilter === "all" || 
      (premiumFilter === "premium" && cmd.premium) || 
      (premiumFilter === "free" && !cmd.premium);
    
    return matchesSearch && matchesCategory && matchesPremium;
  });
  
  // Get commands for a specific category
  const getCommandsByCategory = (categoryName: string) => {
    return allCommands.filter(cmd => 
      cmd.category === categoryName && 
      (searchTerm === "" || 
        cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        cmd.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) &&
      (premiumFilter === "all" || 
        (premiumFilter === "premium" && cmd.premium) || 
        (premiumFilter === "free" && !cmd.premium)
      )
    );
  };
  
  // Render a command card
  const CommandCard = ({ command }: { command: any }) => (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{command.name}</h3>
          {command.premium && (
            <Badge variant="outline" className="bg-gradient-to-r from-amber-500 to-yellow-300 text-black">
              Premium
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{command.description}</p>
        <div className="mt-2 pt-2 border-t">
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{command.usage}</code>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bot Commands</h1>
        <p className="text-muted-foreground mt-2">
          Browse and search through all available commands for Guard-shin bot.
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search commands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="w-full sm:w-48">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="moderation">Moderation</SelectItem>
                <SelectItem value="utility">Utility</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="fun">Fun</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Select value={premiumFilter} onValueChange={setPremiumFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Commands</SelectItem>
                <SelectItem value="free">Free Commands</SelectItem>
                <SelectItem value="premium">Premium Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {category === "all" ? (
        <Tabs defaultValue="moderation" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="utility">Utility</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
            <TabsTrigger value="fun">Fun</TabsTrigger>
          </TabsList>
          
          <TabsContent value="moderation">
            <Card>
              <CardHeader>
                <CardTitle>Moderation Commands</CardTitle>
                <CardDescription>
                  Commands for server moderation and management.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getCommandsByCategory("moderation").length > 0 ? (
                    getCommandsByCategory("moderation").map((cmd, index) => (
                      <CommandCard key={index} command={cmd} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No matching commands found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="utility">
            <Card>
              <CardHeader>
                <CardTitle>Utility Commands</CardTitle>
                <CardDescription>
                  General utility commands for server management.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getCommandsByCategory("utility").length > 0 ? (
                    getCommandsByCategory("utility").map((cmd, index) => (
                      <CommandCard key={index} command={cmd} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No matching commands found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Commands</CardTitle>
                <CardDescription>
                  Administrative commands for server configuration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getCommandsByCategory("admin").length > 0 ? (
                    getCommandsByCategory("admin").map((cmd, index) => (
                      <CommandCard key={index} command={cmd} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No matching commands found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="music">
            <Card>
              <CardHeader>
                <CardTitle>Music Commands</CardTitle>
                <CardDescription>
                  Commands for playing music in voice channels.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getCommandsByCategory("music").length > 0 ? (
                    getCommandsByCategory("music").map((cmd, index) => (
                      <CommandCard key={index} command={cmd} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No matching commands found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="fun">
            <Card>
              <CardHeader>
                <CardTitle>Fun Commands</CardTitle>
                <CardDescription>
                  Fun and entertaining commands for server members.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getCommandsByCategory("fun").length > 0 ? (
                    getCommandsByCategory("fun").map((cmd, index) => (
                      <CommandCard key={index} command={cmd} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No matching commands found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {category.charAt(0).toUpperCase() + category.slice(1)} Commands
            </CardTitle>
            <CardDescription>
              {category === "moderation" && "Commands for server moderation and management."}
              {category === "utility" && "General utility commands for server management."}
              {category === "admin" && "Administrative commands for server configuration."}
              {category === "music" && "Commands for playing music in voice channels."}
              {category === "fun" && "Fun and entertaining commands for server members."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, index) => (
                  <CommandCard key={index} command={cmd} />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No matching commands found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}