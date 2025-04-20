import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  email?: string;
  discordId?: string;
  avatar?: string;
  role: 'admin' | 'user';
  premium: boolean;
  premiumTier?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPremium: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loginWithDiscord: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuthentication = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    
    checkAuthentication();
  }, []);
  
  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('POST', '/api/auth/login', {
        username,
        password
      });
      
      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Login failed",
          description: error.message || "Invalid username or password",
          variant: "destructive",
        });
        return false;
      }
      
      const userData = await response.json();
      setUser(userData);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register function
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('POST', '/api/auth/register', {
        username,
        email,
        password
      });
      
      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Registration failed",
          description: error.message || "Unable to register. Please try a different username or email.",
          variant: "destructive",
        });
        return false;
      }
      
      const userData = await response.json();
      setUser(userData);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.username}!`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      await apiRequest('POST', '/api/auth/logout');
      
      setUser(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Discord login function
  const loginWithDiscord = () => {
    window.location.href = '/api/auth/discord';
  };
  
  // Check authentication status
  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await apiRequest('GET', '/api/auth/me');
      
      if (!response.ok) {
        setUser(null);
        return false;
      }
      
      const userData = await response.json();
      setUser(userData);
      return true;
    } catch (error) {
      setUser(null);
      return false;
    }
  };
  
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isPremium: user?.premium || false,
    login,
    register,
    logout,
    loginWithDiscord,
    checkAuth
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}