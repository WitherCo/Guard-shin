#!/bin/bash
# Guard-shin Discord Bot Manual Export Script
# This script helps prepare the Discord bot files for Render deployment

echo "=== Guard-shin Discord Bot Manual Export Tool ==="
echo "This script will package the Discord bot files for Render deployment."
echo 

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed. Please install git and try again."
    exit 1
fi

# Check for essential files
if [ ! -f "run.py" ] || [ ! -f "requirements.txt" ]; then
    echo "Error: Essential bot files are missing. Make sure you're in the discord-bot directory."
    exit 1
fi

# Create temp directory
TEMP_DIR="guard-shin-bot-export"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR
echo "✓ Created temporary directory: $TEMP_DIR"

# Copy bot files
cp server.js $TEMP_DIR/
cp package.json $TEMP_DIR/
cp render.yaml $TEMP_DIR/
cp requirements.txt $TEMP_DIR/
cp run.py $TEMP_DIR/
cp RENDER_DEPLOYMENT.md $TEMP_DIR/

# Create cogs directory and copy cogs
if [ -d "../cogs" ]; then
    mkdir -p $TEMP_DIR/cogs
    cp -r ../cogs/* $TEMP_DIR/cogs/
    echo "✓ Copied cogs directory"
fi

# Create empty premium guilds file if needed
echo '{"guild_ids": []}' > $TEMP_DIR/premium_guilds.json
echo "✓ Created premium_guilds.json"

echo "✓ All files copied successfully"

# Create README 
cat > $TEMP_DIR/README.md << 'EOF'
# Guard-shin Discord Bot

This is the Discord bot component of the Guard-shin moderation and security platform.

## Deployment

See RENDER_DEPLOYMENT.md for detailed deployment instructions.

## Running Locally

1. Install Python requirements:
   ```
   pip install -r requirements.txt
   ```

2. Install Node.js dependencies:
   ```
   npm install
   ```

3. Set up environment variables by creating a `.env` file with:
   ```
   DISCORD_BOT_TOKEN=your_token_here
   ```

4. Run the bot:
   ```
   python run.py
   ```

   Or use the Node.js wrapper:
   ```
   node server.js
   ```
EOF

echo "✓ Created README.md"

# Create zip file
zip -r guard-shin-bot.zip $TEMP_DIR
echo "✓ Created guard-shin-bot.zip"

echo
echo "=== Export Complete ==="
echo "Files have been exported to: guard-shin-bot.zip"
echo
echo "To deploy on Render:"
echo "1. Extract this zip file"
echo "2. Push these files to a GitHub repository"
echo "3. Follow the instructions in RENDER_DEPLOYMENT.md"
echo

# Clean up temp directory
rm -rf $TEMP_DIR
echo "✓ Cleaned up temporary directory"