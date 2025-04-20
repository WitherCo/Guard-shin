import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function PrefixSettings() {
  const { toast } = useToast();
  const [prefix, setPrefix] = useState(";");
  const [isLoading, setIsLoading] = useState(false);

  const handlePrefixChange = async () => {
    setIsLoading(true);
    
    // Simulating an API call
    setTimeout(() => {
      toast({
        title: "Prefix updated",
        description: `Bot prefix has been updated to "${prefix}"`,
      });
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bot Prefix Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize the prefix used to trigger bot commands in your server.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Command Prefix</CardTitle>
            <CardDescription>
              Set the character(s) that users will type before commands to activate the bot.
              Default prefix is ";"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prefix">Prefix</Label>
                <Input
                  id="prefix"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="Enter custom prefix"
                  maxLength={5}
                />
                <p className="text-sm text-muted-foreground">
                  Examples: !, ?, $, -, ., &gt;
                </p>
              </div>

              <div className="rounded-md bg-muted p-4">
                <div className="text-sm font-medium">Preview:</div>
                <div className="mt-2 text-sm text-muted-foreground font-mono">
                  {prefix}help
                </div>
                <div className="mt-1 text-sm text-muted-foreground font-mono">
                  {prefix}ban @user
                </div>
                <div className="mt-1 text-sm text-muted-foreground font-mono">
                  {prefix}kick @user
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handlePrefixChange} 
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Prefix"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Command Examples</CardTitle>
            <CardDescription>
              Examples of how your commands will work with the new prefix.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <span className="font-mono">{prefix}help</span> - Shows the help message
              </p>
              <p>
                <span className="font-mono">{prefix}ban @user [reason]</span> - Bans a user
              </p>
              <p>
                <span className="font-mono">{prefix}kick @user [reason]</span> - Kicks a user
              </p>
              <p>
                <span className="font-mono">{prefix}clear [amount]</span> - Clears messages
              </p>
              <p>
                <span className="font-mono">{prefix}warn @user [reason]</span> - Warns a user
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}