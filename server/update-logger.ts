import fetch from 'node-fetch';

/**
 * Update Logger for Guard-shin
 * 
 * This module handles sending consolidated update notifications to Discord
 * via webhook. It batches updates to prevent webhook spam and formats
 * messages consistently.
 */

// Webhook URL for sending update notifications
const UPDATE_WEBHOOK_URL = process.env.UPDATE_WEBHOOK_URL;

// Queue to hold pending updates for batching
interface QueuedUpdate {
  message: string;
  timestamp: Date;
  details?: Record<string, any>;
}

// Batch updates to prevent webhook spam
let updateQueue: QueuedUpdate[] = [];
let timeoutId: NodeJS.Timeout | null = null;
const BATCH_DELAY_MS = 60000; // 1 minute

/**
 * Log an update to be sent via webhook
 * 
 * @param message Main update message
 * @param details Additional details to include
 */
export async function logUpdate(message: string, details?: Record<string, any>): Promise<void> {
  if (!UPDATE_WEBHOOK_URL) {
    console.warn('[update-logger] No webhook URL configured, skipping update notification');
    return;
  }

  // Add update to queue
  updateQueue.push({
    message,
    timestamp: new Date(),
    details
  });

  // Schedule sending if not already scheduled
  if (!timeoutId) {
    timeoutId = setTimeout(sendBatchedUpdates, BATCH_DELAY_MS);
  }
}

/**
 * Force send all queued updates immediately
 */
export async function flushUpdates(): Promise<void> {
  if (updateQueue.length > 0) {
    clearTimeout(timeoutId as NodeJS.Timeout);
    timeoutId = null;
    await sendBatchedUpdates();
  }
}

/**
 * Send all batched updates in a single webhook message
 */
async function sendBatchedUpdates(): Promise<void> {
  if (updateQueue.length === 0) {
    timeoutId = null;
    return;
  }

  try {
    // Create embed fields for each update
    const fields = updateQueue.map(update => {
      let value = update.message;
      
      // Add details if available
      if (update.details) {
        const detailsString = Object.entries(update.details)
          .map(([key, val]) => `**${key}**: ${val}`)
          .join('\n');
          
        if (detailsString) {
          value += '\n' + detailsString;
        }
      }
      
      return {
        name: `Update at ${update.timestamp.toLocaleTimeString()}`,
        value
      };
    });

    // Send consolidated embed
    const payload = {
      content: "Lifeless rose updated:",
      embeds: [{
        title: "Guard-shin Updates",
        description: `${updateQueue.length} updates received in the last batch`,
        color: 0x7289DA,
        fields,
        timestamp: new Date().toISOString(),
        footer: {
          text: "Guard-shin Bot"
        }
      }]
    };

    const response = await fetch(UPDATE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`[update-logger] Failed to send webhook: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(errorText);
    } else {
      console.log(`[update-logger] Successfully sent ${updateQueue.length} updates via webhook`);
    }
  } catch (error) {
    console.error('[update-logger] Error sending webhook:', error);
  }

  // Clear queue and reset timeout
  updateQueue = [];
  timeoutId = null;
}

// Send any pending updates when the process exits
process.on('beforeExit', () => {
  if (updateQueue.length > 0) {
    flushUpdates().catch(err => {
      console.error('[update-logger] Error flushing updates on exit:', err);
    });
  }
});