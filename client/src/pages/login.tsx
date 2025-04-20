import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    
    try {
      const success = await login(data.email, data.password);
      
      if (success) {
        setLocation("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDiscordLogin = () => {
    // In a real implementation, redirect to Discord OAuth
    window.location.href = "/discord-login";
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Guard<span className="text-indigo-400">-shin</span>
          </h1>
          <p className="text-gray-400 mt-2">
            Log in to manage your Discord server
          </p>
        </div>
        
        <Card className="border-gray-700 bg-gray-800 text-white">
          <CardHeader>
            <CardTitle>Log in to your account</CardTitle>
            <CardDescription className="text-gray-400">
              Enter your email and password to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="you@example.com"
                          className="bg-gray-700 border-gray-600"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          className="bg-gray-700 border-gray-600"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between items-center text-sm pt-2">
                  <a href="/forgot-password" className="text-indigo-400 hover:underline">
                    Forgot password?
                  </a>
                  <a href="/register" className="text-indigo-400 hover:underline">
                    Create account
                  </a>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Log in"}
                </Button>
              </form>
            </Form>
            
            <div className="relative mt-8 mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full border-gray-600 hover:bg-gray-700"
              onClick={handleDiscordLogin}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#5865F2" className="mr-2"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
              Continue with Discord
            </Button>
          </CardContent>
          <CardFooter className="justify-center text-sm text-gray-400">
            By continuing, you agree to our 
            <a href="/terms-of-service" className="text-indigo-400 hover:underline mx-1">Terms of Service</a> 
            and 
            <a href="/privacy-policy" className="text-indigo-400 hover:underline ml-1">Privacy Policy</a>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}