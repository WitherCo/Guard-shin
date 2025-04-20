import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SelectTrigger, SelectValue, Select, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";

// Sample data for charts
const commandUsage = [
  { name: "Ban", count: 45 },
  { name: "Kick", count: 78 },
  { name: "Mute", count: 124 },
  { name: "Clear", count: 89 },
  { name: "Warn", count: 56 },
  { name: "Help", count: 112 },
];

const memberActivity = [
  { date: "Jan", joins: 24, leaves: 12 },
  { date: "Feb", joins: 18, leaves: 10 },
  { date: "Mar", joins: 29, leaves: 8 },
  { date: "Apr", joins: 32, leaves: 15 },
  { date: "May", joins: 45, leaves: 20 },
  { date: "Jun", joins: 52, leaves: 22 },
];

const moderationActions = [
  { date: "Jan", bans: 5, kicks: 8, mutes: 14 },
  { date: "Feb", bans: 3, kicks: 6, mutes: 10 },
  { date: "Mar", bans: 7, kicks: 9, mutes: 16 },
  { date: "Apr", bans: 4, kicks: 7, mutes: 18 },
  { date: "May", bans: 8, kicks: 10, mutes: 22 },
  { date: "Jun", bans: 6, kicks: 12, mutes: 20 },
];

export default function Analytics() {
  const [timeframe, setTimeframe] = useState("30d");
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between mb-8 items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Server Analytics</h1>
          <p className="text-muted-foreground mt-2">
            View detailed statistics and insights about your server.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Timeframe:</span>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3,842</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 font-medium">↑ 12%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commands Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24,521</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 font-medium">↑ 8%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Moderation Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">568</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-red-500 font-medium">↓ 3%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="commands">Commands</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Member Growth</CardTitle>
                <CardDescription>
                  New members vs. leavers over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <div className="flex flex-col space-y-4">
                    {memberActivity.map((month) => (
                      <div key={month.date} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{month.date}</span>
                          <span>Joins: {month.joins} | Leaves: {month.leaves}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-green-500 h-full"
                            style={{ width: `${(month.joins / (month.joins + month.leaves)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Moderation Activity</CardTitle>
                <CardDescription>
                  Moderation actions performed over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <div className="flex flex-col space-y-4">
                    {moderationActions.map((month) => (
                      <div key={month.date} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{month.date}</span>
                          <span>Total: {month.bans + month.kicks + month.mutes}</span>
                        </div>
                        <div className="w-full flex h-8 overflow-hidden rounded-md">
                          <div 
                            className="bg-red-500 h-full"
                            style={{ width: `${(month.bans / (month.bans + month.kicks + month.mutes)) * 100}%` }}
                          ></div>
                          <div 
                            className="bg-orange-500 h-full"
                            style={{ width: `${(month.kicks / (month.bans + month.kicks + month.mutes)) * 100}%` }}
                          ></div>
                          <div 
                            className="bg-yellow-500 h-full"
                            style={{ width: `${(month.mutes / (month.bans + month.kicks + month.mutes)) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex text-xs text-muted-foreground space-x-4">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                            <span>Bans: {month.bans}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                            <span>Kicks: {month.kicks}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                            <span>Mutes: {month.mutes}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Member Statistics</CardTitle>
              <CardDescription>
                Detailed information about server members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Role Distribution</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Admin</span>
                        <span>5 (0.1%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div className="bg-purple-500 h-full" style={{ width: "0.1%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Moderator</span>
                        <span>24 (0.6%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: "0.6%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Verified</span>
                        <span>3,120 (81.2%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: "81.2%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Unverified</span>
                        <span>693 (18.1%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div className="bg-gray-500 h-full" style={{ width: "18.1%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Activity Levels</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Very Active (Daily)</span>
                        <span>785 (20.4%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: "20.4%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Active (Weekly)</span>
                        <span>1,245 (32.4%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div className="bg-green-400 h-full" style={{ width: "32.4%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Semi-active (Monthly)</span>
                        <span>893 (23.2%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div className="bg-yellow-500 h-full" style={{ width: "23.2%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Inactive (&gt;30 days)</span>
                        <span>919 (24.0%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div className="bg-red-500 h-full" style={{ width: "24%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="commands">
          <Card>
            <CardHeader>
              <CardTitle>Command Usage</CardTitle>
              <CardDescription>
                Most frequently used commands
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Top Commands</h3>
                    <div className="space-y-4">
                      {commandUsage.map((cmd) => (
                        <div key={cmd.name} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{cmd.name}</span>
                            <span>{cmd.count} uses</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-primary h-full"
                              style={{ width: `${(cmd.count / Math.max(...commandUsage.map(c => c.count))) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Command Categories</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Moderation</span>
                          <span>1,245 (43.2%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <div className="bg-blue-500 h-full" style={{ width: "43.2%" }}></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Utility</span>
                          <span>795 (27.6%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <div className="bg-green-500 h-full" style={{ width: "27.6%" }}></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Fun</span>
                          <span>512 (17.8%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <div className="bg-purple-500 h-full" style={{ width: "17.8%" }}></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Music</span>
                          <span>328 (11.4%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <div className="bg-pink-500 h-full" style={{ width: "11.4%" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="text-md font-medium mb-2">Premium Analytics</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upgrade to Premium to unlock advanced analytics features including:
                  </p>
                  <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
                    <li>User engagement metrics</li>
                    <li>Channel activity heatmaps</li>
                    <li>Message content analysis</li>
                    <li>Custom report generation</li>
                    <li>Data export capabilities</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}