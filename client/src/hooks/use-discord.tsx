import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn } from "../lib/queryClient";
import { SubscriptionTier } from "@shared/schema";

interface UserRolesResponse {
  premium: boolean;
  premiumTier: SubscriptionTier;
  roles: string[];
}

export function useDiscordRoles(): UseQueryResult<UserRolesResponse, Error> {
  const { isAuthenticated } = useAuth();

  return useQuery<UserRolesResponse, Error>({
    queryKey: ["/api/discord/user/roles"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
    // Default values if query is disabled or fails
    initialData: {
      premium: false,
      premiumTier: SubscriptionTier.FREE,
      roles: []
    },
  });
}

// Hook to check if a user has premium status
export function usePremiumStatus(): {
  isPremium: boolean;
  premiumTier: SubscriptionTier;
  isLoading: boolean;
} {
  const { data, isLoading } = useDiscordRoles();
  
  return {
    isPremium: data?.premium || false,
    premiumTier: data?.premiumTier || SubscriptionTier.FREE,
    isLoading
  };
}

// Hook to check if user has access to a specific feature
export function useFeatureAccess(feature: string): {
  hasAccess: boolean;
  isLoading: boolean;
} {
  const { isPremium, premiumTier, isLoading } = usePremiumStatus();
  
  // Logic to determine if the user's tier gives access to the feature
  // This can be expanded based on your feature requirements
  const hasAccess = isPremium && (
    // Basic premium features
    (premiumTier === SubscriptionTier.PREMIUM && 
     ['custom-commands', 'anti-alt'].includes(feature)) ||
    
    // Premium Plus gets all features
    (premiumTier === SubscriptionTier.PREMIUM_PLUS)
  );
  
  return { hasAccess, isLoading };
}

// Hook to get user's Discord servers
export function useDiscordServers() {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ["/api/discord/guilds"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
  });
}

// Hook to get a specific Discord server
export function useDiscordServer(guildId: string | null) {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ["/api/discord/guilds", guildId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated && !!guildId,
  });
}