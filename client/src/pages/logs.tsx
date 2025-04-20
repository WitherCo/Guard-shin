import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectTrigger, SelectValue, Select, SelectContent, SelectItem } from "@/components/ui/select";

// Sample log data
const moderationLogs = [
  { id: 1, type: "ban", user: "User#1234", moderator: "Mod#5678", reason: "Repeated spam", timestamp: "2023-06-10T14:32:45Z", action: "Ban" },
  { id: 2, type: "kick", user: "Member#9876", moderator: "Admin#4321", reason: "Inappropriate language", timestamp: "2023-06-10T12:18:22Z", action: "Kick" },
  { id: 3, type: "mute", user: "Player#5555", moderator: "Mod#5678", reason: "Excessive caps", timestamp: "2023-06-09T23:45:12Z", action: "Timeout (1h)" },
  { id: 4, type: "warn", user: "Gamer#7777", moderator: "Mod#8888", reason: "Off-topic discussion", timestamp: "2023-06-09T19:21:05Z", action: "Warning" },
  { id: 5, type: "ban", user: "BadUser#6666", moderator: "Admin#4321", reason: "Hate speech", timestamp: "2023-06-08T16:54:33Z", action: "Ban" },
  { id: 6, type: "mute", user: "Chatter#3333", moderator: "Mod#5678", reason: "Spam", timestamp: "2023-06-08T10:12:45Z", action: "Timeout (30m)" },
  { id: 7, type: "warn", user: "NewUser#2222", moderator: "Mod#8888", reason: "Server rules violation", timestamp: "2023-06-07T22:38:19Z", action: "Warning" },
  { id: 8, type: "kick", user: "Visitor#1111", moderator: "Admin#4321", reason: "Advertising", timestamp: "2023-06-07T15:42:51Z", action: "Kick" },
];

const serverLogs = [
  { id: 1, type: "settings", user: "Admin#4321", action: "Updated server name", details: "Changed server name to 'New Server Name'", timestamp: "2023-06-10T16:45:22Z" },
  { id: 2, type: "channel", user: "Mod#5678", action: "Created channel", details: "Created text channel #announcements", timestamp: "2023-06-10T15:32:18Z" },
  { id: 3, type: "role", user: "Admin#4321", action: "Created role", details: "Created role 'VIP Member'", timestamp: "2023-06-09T22:15:47Z" },
  { id: 4, type: "settings", user: "Owner#9999", action: "Updated verification level", details: "Changed verification level to High", timestamp: "2023-06-09T18:22:33Z" },
  { id: 5, type: "channel", user: "Admin#4321", action: "Deleted channel", details: "Deleted text channel #spam", timestamp: "2023-06-08T14:12:09Z" },
  { id: 6, type: "role", user: "Mod#5678", action: "Updated role permissions", details: "Updated permissions for role 'Moderator'", timestamp: "2023-06-08T11:45:21Z" },
  { id: 7, type: "settings", user: "Owner#9999", action: "Enabled community features", details: "Enabled community features for server", timestamp: "2023-06-07T20:33:12Z" },
  { id: 8, type: "channel", user: "Admin#4321", action: "Updated channel permissions", details: "Updated permissions for #general", timestamp: "2023-06-07T17:21:45Z" },
];

const auditLogs = [
  { id: 1, type: "member_join", user: "User#1234", details: "User joined the server", timestamp: "2023-06-10T18:22:45Z" },
  { id: 2, type: "member_leave", user: "Member#9876", details: "User left the server", timestamp: "2023-06-10T17:14:22Z" },
  { id: 3, type: "invite_create", user: "Mod#5678", details: "Created invite link (Expires: Never, Uses: Unlimited)", timestamp: "2023-06-10T15:45:12Z" },
  { id: 4, type: "member_update", user: "Admin#4321", details: "Changed nickname for User#5555 to 'New Nickname'", timestamp: "2023-06-09T21:32:18Z" },
  { id: 5, type: "message_delete", user: "Mod#8888", details: "Deleted message in #general (ID: 1234567890)", timestamp: "2023-06-09T19:11:54Z" },
  { id: 6, type: "member_role_update", user: "Admin#4321", details: "Added role 'Verified' to User#7777", timestamp: "2023-06-08T13:25:41Z" },
  { id: 7, type: "invite_delete", user: "Mod#5678", details: "Deleted invite link (Code: AbCdEf)", timestamp: "2023-06-08T09:18:33Z" },
  { id: 8, type: "webhook_update", user: "Admin#4321", details: "Created webhook in #announcements", timestamp: "2023-06-07T22:14:09Z" },
];

export default function Logs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  // Filter function for moderation logs
  const filteredModerationLogs = moderationLogs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.moderator.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || log.type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  // Filter function for server logs
  const filteredServerLogs = serverLogs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || log.type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  // Filter function for audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || log.type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  // Format timestamp to readable date
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Server Logs</h1>
        <p className="text-muted-foreground mt-2">
          View and search through all server activity logs.
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="ban">Bans</SelectItem>
              <SelectItem value="kick">Kicks</SelectItem>
              <SelectItem value="mute">Mutes</SelectItem>
              <SelectItem value="warn">Warnings</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
              <SelectItem value="channel">Channels</SelectItem>
              <SelectItem value="role">Roles</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button variant="outline">
            Export Logs
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="moderation" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="server">Server</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>
        
        <TabsContent value="moderation">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Logs</CardTitle>
              <CardDescription>
                Records of all moderation actions taken in the server.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left py-3 px-4 font-medium">Time</th>
                      <th className="text-left py-3 px-4 font-medium">Action</th>
                      <th className="text-left py-3 px-4 font-medium">User</th>
                      <th className="text-left py-3 px-4 font-medium">Moderator</th>
                      <th className="text-left py-3 px-4 font-medium">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredModerationLogs.length > 0 ? (
                      filteredModerationLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm">{formatTimestamp(log.timestamp)}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              log.type === 'ban' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              log.type === 'kick' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                              log.type === 'mute' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">{log.user}</td>
                          <td className="py-3 px-4 text-sm">{log.moderator}</td>
                          <td className="py-3 px-4 text-sm">{log.reason}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-muted-foreground">
                          No matching logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="server">
          <Card>
            <CardHeader>
              <CardTitle>Server Logs</CardTitle>
              <CardDescription>
                Records of all server setting changes and updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left py-3 px-4 font-medium">Time</th>
                      <th className="text-left py-3 px-4 font-medium">User</th>
                      <th className="text-left py-3 px-4 font-medium">Action</th>
                      <th className="text-left py-3 px-4 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredServerLogs.length > 0 ? (
                      filteredServerLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm">{formatTimestamp(log.timestamp)}</td>
                          <td className="py-3 px-4 text-sm">{log.user}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              log.type === 'settings' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                              log.type === 'channel' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">{log.details}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          No matching logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                Detailed records of all server events and changes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left py-3 px-4 font-medium">Time</th>
                      <th className="text-left py-3 px-4 font-medium">User</th>
                      <th className="text-left py-3 px-4 font-medium">Event</th>
                      <th className="text-left py-3 px-4 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredAuditLogs.length > 0 ? (
                      filteredAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm">{formatTimestamp(log.timestamp)}</td>
                          <td className="py-3 px-4 text-sm">{log.user}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              log.type.includes('member_join') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              log.type.includes('member_leave') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              log.type.includes('invite') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                              log.type.includes('message') ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {log.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">{log.details}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          No matching logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}