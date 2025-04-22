import discord
from discord.ext import commands

# This function gets a cog class from a module
def get_cog_class(module):
    # Find the first class that extends commands.Cog
    for attr_name in dir(module):
        attr = getattr(module, attr_name)
        if isinstance(attr, type) and issubclass(attr, commands.Cog) and attr is not commands.Cog:
            return attr
    return None

# This function creates a setup function for a module that doesn't have one
def create_setup_function(module_name, cog_class_name):
    setup_code = f"""
# Add setup function for Discord.py extension loading
def setup(bot):
    bot.add_cog({cog_class_name}(bot))
"""
    return setup_code

# These files need setup functions
files_to_fix = [
    'essential_commands.py',
    'moderation_commands.py',
    'utility_commands.py',
    'fun_commands.py',
    'music_commands.py',
    'image_commands.py',
    'game_commands.py'
]

# Main function to fix all cog files
def fix_all_cogs():
    for filename in files_to_fix:
        # Get the full path
        filepath = f"cogs/{filename}"
        try:
            # Read the current file content
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Skip if setup function already exists
            if 'def setup(bot):' in content:
                print(f"✓ {filename} already has a setup function")
                continue
                
            # Get the cog class name (assuming it follows the naming convention)
            module_name = filename[:-3]  # Remove .py extension
            cog_class_name = ''.join(word.capitalize() for word in module_name.split('_'))
            
            # Create the setup function
            setup_code = create_setup_function(module_name, cog_class_name)
            
            # Add the setup function to the file content
            new_content = content + "\n" + setup_code
            
            # Write the updated content back to the file
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
                
            print(f"✓ Added setup function to {filename}")
            
        except Exception as e:
            print(f"✗ Error fixing {filename}: {e}")
    
    print("\nSetup fix complete!")

if __name__ == "__main__":
    fix_all_cogs()