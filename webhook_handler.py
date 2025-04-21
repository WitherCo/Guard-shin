import os
import json
import hmac
import hashlib
import logging
from datetime import datetime
import stripe

# Set up logging
logger = logging.getLogger('webhook-handler')
logger.setLevel(logging.INFO)
handler = logging.FileHandler(filename='webhook-handler.log', encoding='utf-8', mode='a')
handler.setFormatter(logging.Formatter('%(asctime)s:%(levelname)s:%(name)s: %(message)s'))
logger.addHandler(handler)

# Console logging
console = logging.StreamHandler()
console.setFormatter(logging.Formatter('%(asctime)s:%(levelname)s:%(name)s: %(message)s'))
logger.addHandler(console)

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

def handle_payment_webhook(payload, sig_header):
    """Handle incoming payment webhooks from Stripe"""
    webhook_secret = os.getenv('PAYMENT_WEBHOOK_SECRET')
    
    if not webhook_secret:
        logger.warning("No webhook secret found - webhook verification disabled")
        event = payload
    else:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError as e:
            # Invalid payload
            logger.error(f"Invalid payload: {e}")
            return {"success": False, "error": "Invalid payload"}
        except stripe.error.SignatureVerificationError as e:
            # Invalid signature
            logger.error(f"Invalid signature: {e}")
            return {"success": False, "error": "Invalid signature"}
    
    # Handle the event
    event_type = event.get('type')
    logger.info(f"Received event: {event_type}")
    
    if event_type == 'checkout.session.completed':
        handle_payment_success(event)
    elif event_type == 'customer.subscription.created':
        handle_subscription_created(event)
    elif event_type == 'customer.subscription.updated':
        handle_subscription_updated(event)
    elif event_type == 'customer.subscription.deleted':
        handle_subscription_deleted(event)
    else:
        logger.info(f"Unhandled event type: {event_type}")
    
    return {"success": True}

def handle_payment_success(event):
    """Handle successful payment event"""
    session = event.data.object
    
    # Get customer information
    customer_id = session.get('customer')
    customer_email = session.get('customer_details', {}).get('email')
    
    # Log the payment information
    logger.info(f"Payment successful for customer {customer_id} ({customer_email})")
    logger.info(f"Amount: {session.get('amount_total') / 100} {session.get('currency', 'usd').upper()}")
    
    # Get subscription information if available
    subscription_id = session.get('subscription')
    if subscription_id:
        logger.info(f"Subscription ID: {subscription_id}")
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            subscription_status = subscription.get('status')
            logger.info(f"Subscription status: {subscription_status}")
            
            # Record the subscription in our database
            update_premium_status(subscription)
        except Exception as e:
            logger.error(f"Error retrieving subscription {subscription_id}: {e}")
    
    # Check metadata for guild ID
    metadata = session.get('metadata', {})
    guild_id = metadata.get('guild_id')
    
    if guild_id:
        logger.info(f"Payment associated with guild ID: {guild_id}")
        # Add guild to premium guilds
        add_guild_to_premium(guild_id)

def handle_subscription_created(event):
    """Handle subscription created event"""
    subscription = event.data.object
    logger.info(f"New subscription created: {subscription.id}")
    update_premium_status(subscription)

def handle_subscription_updated(event):
    """Handle subscription updated event"""
    subscription = event.data.object
    logger.info(f"Subscription updated: {subscription.id}")
    update_premium_status(subscription)

def handle_subscription_deleted(event):
    """Handle subscription deleted event"""
    subscription = event.data.object
    logger.info(f"Subscription deleted: {subscription.id}")
    
    # Check if we have guild information
    metadata = subscription.get('metadata', {})
    guild_id = metadata.get('guild_id')
    
    if guild_id:
        logger.info(f"Removing premium from guild ID: {guild_id}")
        remove_guild_from_premium(guild_id)

def update_premium_status(subscription):
    """Update the premium status based on subscription information"""
    try:
        # Extract information from the subscription
        subscription_id = subscription.id
        customer_id = subscription.customer
        status = subscription.status
        
        # Check metadata for guild ID
        metadata = subscription.get('metadata', {})
        guild_id = metadata.get('guild_id')
        
        if guild_id and status in ('active', 'trialing'):
            logger.info(f"Adding guild {guild_id} to premium for subscription {subscription_id}")
            add_guild_to_premium(guild_id)
        elif guild_id:
            logger.info(f"Subscription {subscription_id} status is {status}, not adding to premium")
    except Exception as e:
        logger.error(f"Error updating premium status: {e}")

def add_guild_to_premium(guild_id):
    """Add a guild to the premium guilds list"""
    try:
        # Load the current premium guilds
        premium_guilds = load_premium_guilds()
        
        # Add the new guild ID
        guild_id = str(guild_id)
        if guild_id not in premium_guilds:
            premium_guilds.append(guild_id)
            
            # Save the updated list
            save_premium_guilds(premium_guilds)
            logger.info(f"Added guild {guild_id} to premium guilds")
        else:
            logger.info(f"Guild {guild_id} is already a premium guild")
    except Exception as e:
        logger.error(f"Error adding guild to premium: {e}")

def remove_guild_from_premium(guild_id):
    """Remove a guild from the premium guilds list"""
    try:
        # Load the current premium guilds
        premium_guilds = load_premium_guilds()
        
        # Remove the guild ID
        guild_id = str(guild_id)
        if guild_id in premium_guilds:
            premium_guilds.remove(guild_id)
            
            # Save the updated list
            save_premium_guilds(premium_guilds)
            logger.info(f"Removed guild {guild_id} from premium guilds")
        else:
            logger.info(f"Guild {guild_id} is not a premium guild")
    except Exception as e:
        logger.error(f"Error removing guild from premium: {e}")

def load_premium_guilds():
    """Load the list of premium guild IDs"""
    try:
        if os.path.exists('premium_guilds.json'):
            with open('premium_guilds.json', 'r') as f:
                data = json.load(f)
                return data.get('guild_ids', [])
        return []
    except Exception as e:
        logger.error(f"Error loading premium guilds: {e}")
        return []

def save_premium_guilds(guild_ids):
    """Save the list of premium guild IDs"""
    try:
        with open('premium_guilds.json', 'w') as f:
            json.dump({'guild_ids': guild_ids}, f)
        logger.info(f"Saved {len(guild_ids)} premium guilds")
    except Exception as e:
        logger.error(f"Error saving premium guilds: {e}")

def handle_update_webhook(payload, sig_header):
    """Handle incoming webhook for bot updates"""
    webhook_secret = os.getenv('UPDATE_WEBHOOK_SECRET')
    
    if not webhook_secret:
        logger.warning("No update webhook secret found - webhook verification disabled")
    else:
        try:
            # Calculate the expected signature
            digest = hmac.new(
                webhook_secret.encode('utf-8'),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            # Check the signature
            if not hmac.compare_digest(f"sha256={digest}", sig_header):
                logger.error("Invalid signature for update webhook")
                return {"success": False, "error": "Invalid signature"}
        except Exception as e:
            logger.error(f"Error verifying update webhook: {e}")
            return {"success": False, "error": "Error verifying webhook"}
    
    # Parse the payload
    try:
        data = json.loads(payload)
        update_type = data.get('type')
        
        logger.info(f"Received update webhook: {update_type}")
        
        if update_type == 'restart':
            # Trigger bot restart
            logger.info("Restarting bot due to webhook request")
            # Implementation depends on your hosting environment
            
        elif update_type == 'update_commands':
            # Trigger command registration update
            logger.info("Updating bot commands due to webhook request")
            # Implementation depends on your hosting environment
            
        else:
            logger.info(f"Unhandled update type: {update_type}")
        
        return {"success": True}
    except Exception as e:
        logger.error(f"Error handling update webhook: {e}")
        return {"success": False, "error": f"Error handling webhook: {e}"}