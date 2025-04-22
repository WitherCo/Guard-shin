/**
 * API service for the Guard-shin dashboard
 * Handles fetching server data and other API requests
 */

/**
 * Fetch server data from the API
 * @returns {Promise<Object>} Server data object
 */
export async function fetchServerData() {
  try {
    // Try to fetch from the API endpoint first
    const response = await fetch('/api/server-data');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching server data:', error);
    
    // Fallback to static file if API endpoint fails
    try {
      const staticResponse = await fetch('/server_data.json');
      if (staticResponse.ok) {
        return await staticResponse.json();
      }
    } catch (staticError) {
      console.error('Error loading static data:', staticError);
    }
    
    // Return empty data structure as a last resort
    return {
      servers: [],
      user: null,
      bot: { stats: {} },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Fetch a specific server by ID
 * @param {string} id Server ID
 * @returns {Promise<Object>} Server details
 */
export async function fetchServer(id) {
  try {
    const response = await fetch(`/api/server/${id}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching server ${id}:`, error);
    
    // Try to get server from the full server data as fallback
    try {
      const allData = await fetchServerData();
      const server = allData.servers.find(s => s.id === id);
      if (server) {
        return server;
      }
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
    }
    
    throw error;
  }
}

/**
 * Fetch bot statistics
 * @returns {Promise<Object>} Bot statistics
 */
export async function fetchBotStats() {
  try {
    const response = await fetch('/api/bot-stats');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching bot stats:', error);
    
    // Try to get bot stats from the full server data as fallback
    try {
      const allData = await fetchServerData();
      if (allData.bot && allData.bot.stats) {
        return allData.bot.stats;
      }
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
    }
    
    throw error;
  }
}