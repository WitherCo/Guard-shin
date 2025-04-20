import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const handleDiscordAuth = () => {
    // In a real implementation, this would redirect to Discord OAuth
    window.location.href = "/discord-login";
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-4xl w-full mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Guard<span className="text-indigo-400">-shin</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Advanced Discord moderation and security bot for your server
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle className="text-indigo-400">Powerful Moderation</CardTitle>
                <CardDescription className="text-gray-400">
                  Complete tools to manage your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Auto-moderation with customizable filters</li>
                  <li>Raid protection with intelligent detection</li>
                  <li>Verification system for new members</li>
                  <li>Infractions logging and management</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle className="text-indigo-400">Premium Features</CardTitle>
                <CardDescription className="text-gray-400">
                  Enhance your Discord experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Custom welcome images for new members</li>
                  <li>Advanced analytics and insights</li>
                  <li>Auto-response and custom commands</li>
                  <li>Music player with high-quality streaming</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-6 px-8 text-lg"
              onClick={() => window.open("https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot&permissions=8", "_blank")}
            >
              Add to Discord
            </Button>
            <Button 
              className="bg-gray-700 hover:bg-gray-600 text-white py-6 px-8 text-lg"
              variant="outline" 
              onClick={handleDiscordAuth}
            >
              Dashboard Login
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-900 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Why Choose Guard-shin?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-indigo-400 mb-4">Intelligent Protection</h3>
              <p className="text-gray-300">
                Our advanced algorithms detect and prevent raids, spam, and harmful content before it impacts your community.
              </p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-indigo-400 mb-4">Easy to Use</h3>
              <p className="text-gray-300">
                Simple setup process with an intuitive dashboard that makes managing your server effortless.
              </p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-indigo-400 mb-4">Reliable Service</h3>
              <p className="text-gray-300">
                99.9% uptime with 24/7 monitoring ensures your server is always protected.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-indigo-900 py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to secure your Discord server?</h2>
          <p className="text-lg text-indigo-200 mb-8">
            Join thousands of servers already protected by Guard-shin.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-white text-indigo-900 hover:bg-gray-100"
              onClick={() => window.open("https://discord.gg/g3rFbaW6gw", "_blank")}
            >
              Join Support Server
            </Button>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-indigo-800"
              onClick={() => setLocation("/documentation")}
            >
              View Documentation
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p>© 2025 Guard-shin Bot | By WitherCo</p>
          </div>
          
          <div className="flex gap-6">
            <a href="/terms-of-service" className="hover:text-white">Terms</a>
            <a href="/privacy-policy" className="hover:text-white">Privacy</a>
            <a href="/contact-public" className="hover:text-white">Contact</a>
            <a href="/documentation" className="hover:text-white">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}