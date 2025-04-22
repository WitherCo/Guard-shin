"""
Fix for run_bot.py to allow using pre-registered commands without attempting to register them.

This fix modifies the run_bot.py file to:
1. Disable command registration (which fails with error 20012 for team-owned bots)
2. Allow the bot to use pre-registered commands
"""

import os
import sys
import re

def fix_run_bot_file():
    """Modify the run_bot.py file to disable command registration but keep commands working"""
    try:
        # Read the current file
        with open('run_bot.py', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Add the DISABLE_COMMAND_REGISTRATION field to the GuardShin class init
        # Find the __init__ method
        init_pattern = r'def __init__\(self\):(.*?)# Set up basic command aliases'
        init_match = re.search(init_pattern, content, re.DOTALL)
        
        if init_match:
            init_code = init_match.group(1)
            # Check if DISABLE_COMMAND_REGISTRATION already exists
            if 'self.DISABLE_COMMAND_REGISTRATION' not in init_code:
                # Add it right after intents setup
                init_code_with_disable = re.sub(
                    r'(intents\.message_content = True\s+)',
                    r'\1\n        # Check environment variable for command registration disable\n        self.DISABLE_COMMAND_REGISTRATION = os.getenv("DISABLE_COMMAND_REGISTRATION", "").lower() in ("true", "1", "yes")\n        if self.DISABLE_COMMAND_REGISTRATION:\n            print("Command registration is disabled")\n        ',
                    init_code
                )
                
                # Replace the old init code with the new one
                content = content.replace(init_match.group(1), init_code_with_disable)
        
        # Fix setup_hook method to check for DISABLE_COMMAND_REGISTRATION
        setup_hook_pattern = r'async def setup_hook\(self\):(.*?)async def rotate_status'
        setup_hook_match = re.search(setup_hook_pattern, content, re.DOTALL)
        
        if setup_hook_match:
            setup_hook_code = setup_hook_match.group(1)
            # Check if it already has the DISABLE_COMMAND_REGISTRATION check
            if 'if self.DISABLE_COMMAND_REGISTRATION:' not in setup_hook_code:
                # Modify the section that registers commands
                updated_setup_hook = re.sub(
                    r'(\s+# Register commands with Discord\s+)await self\.register_commands\(\)',
                    r'\1# Check if command registration is disabled\n        if self.DISABLE_COMMAND_REGISTRATION:\n            logger.info("Command registration is disabled. Skipping command sync in setup_hook.")\n        else:\n            await self.register_commands()',
                    setup_hook_code
                )
                
                # Replace the old setup hook with the new one
                content = content.replace(setup_hook_match.group(1), updated_setup_hook)
        
        # Fix on_ready method to check for DISABLE_COMMAND_REGISTRATION
        on_ready_pattern = r'async def on_ready\(self\):(.*?)# Save server information'
        on_ready_match = re.search(on_ready_pattern, content, re.DOTALL)
        
        if on_ready_match:
            on_ready_code = on_ready_match.group(1)
            # Check if it already has the DISABLE_COMMAND_REGISTRATION check
            if 'if self.DISABLE_COMMAND_REGISTRATION:' not in on_ready_code:
                # Modify the section that registers commands
                updated_on_ready = re.sub(
                    r'(\s+# Register slash commands to ensure they\'re available\s+)await self\.register_commands\(\)',
                    r'\1# Check if command registration is disabled\n        if self.DISABLE_COMMAND_REGISTRATION:\n            logger.info("Command registration is disabled. Skipping command sync in on_ready.")\n        else:\n            await self.register_commands()',
                    on_ready_code
                )
                
                # Replace the old on_ready with the new one
                content = content.replace(on_ready_match.group(1), updated_on_ready)
        
        # Write the updated content back to the file
        with open('run_bot.py', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Successfully updated run_bot.py to disable command registration but keep commands working")
        return True
    except Exception as e:
        print(f"❌ Failed to update run_bot.py: {e}")
        return False

if __name__ == "__main__":
    success = fix_run_bot_file()
    sys.exit(0 if success else 1)