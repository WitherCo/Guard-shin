import { IStorage } from "../storage";
import { log } from "../vite";

// This file would contain utilities for managing infractions
// In a full implementation, it would handle expiring timeouts, removing temporary bans, etc.

export async function checkInfractionExpiry(storage: IStorage) {
  // Get all active infractions
  const servers = await storage.getServers();
  
  for (const server of servers) {
    const infractions = await storage.getInfractions(server.id);
    
    // Filter for active infractions that have an expiry time
    const activeWithExpiry = infractions.filter(inf => 
      inf.active && inf.expiresAt && new Date(inf.expiresAt) <= new Date()
    );
    
    // Mark expired infractions as inactive
    for (const infraction of activeWithExpiry) {
      await storage.updateInfraction(infraction.id, {
        active: false
      });
      
      log(`[Infractions] Infraction #${infraction.id} (${infraction.type}) for user ${infraction.username} has expired`);
      
      // In a real implementation, this would remove the punishment from the user
      // For example, removing a timeout or temporary ban
    }
  }
}

// Start a background task to check for expired infractions
export function startInfractionExpiryChecker(storage: IStorage) {
  // Check every minute
  const intervalId = setInterval(() => {
    checkInfractionExpiry(storage).catch(err => {
      console.error("Error checking infraction expiry:", err);
    });
  }, 60 * 1000);
  
  // Return the interval ID so it can be cleared if needed
  return intervalId;
}
