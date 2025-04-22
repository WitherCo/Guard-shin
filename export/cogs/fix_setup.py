import os
import re

# Files to fix
files_to_fix = [
    'essential_commands.py',
    'moderation_commands.py',
    'utility_commands.py',
    'fun_commands.py',
    'music_commands.py',
    'image_commands.py',
    'game_commands.py'
]

def create_proper_setup_function(class_name):
    """Create a proper setup function"""
    return """
# Proper setup function for Discord.py extension loading
def setup(bot):
    bot.add_cog({0}(bot))
""".format(class_name)

def fix_file(filename):
    """Fix a single command file"""
    filepath = os.path.join('cogs', filename)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Find the class name
        match = re.search(r'class (\w+)\(commands\.Cog\):', content)
        if not match:
            print(f"❌ Could not find Cog class in {filename}")
            return False
            
        class_name = match.group(1)
        print(f"Found class {class_name} in {filename}")
        
        # Remove any existing async setup function at the end
        content = re.sub(r'\s+# Function to set up the cog\s+async def setup\(bot\):.*?await bot\.add_cog\([^)]+\)\s*$', 
                         '', content, flags=re.DOTALL)
        
        # Check if there's already a proper setup function
        if re.search(r'def setup\(bot\):\s+bot\.add_cog\(', content):
            print(f"✓ {filename} already has a proper setup function")
            return True
            
        # Add the proper setup function
        content += create_proper_setup_function(class_name)
        
        # Write the updated content back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"✓ Fixed setup function in {filename}")
        return True
        
    except Exception as e:
        print(f"❌ Error fixing {filename}: {e}")
        return False

def main():
    """Fix all command files"""
    print("Fixing setup functions in command files...")
    
    success_count = 0
    for filename in files_to_fix:
        if fix_file(filename):
            success_count += 1
            
    print(f"\nFixed {success_count}/{len(files_to_fix)} files successfully")
    
if __name__ == "__main__":
    main()