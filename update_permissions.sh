#!/bin/bash

# Update permissions in prefixCommands.js
sed -i 's/BAN_MEMBERS/BanMembers/g' bot/commands/prefixCommands.js
sed -i 's/KICK_MEMBERS/KickMembers/g' bot/commands/prefixCommands.js
sed -i 's/MANAGE_CHANNELS/ManageChannels/g' bot/commands/prefixCommands.js
sed -i 's/MANAGE_MESSAGES/ManageMessages/g' bot/commands/prefixCommands.js
sed -i 's/MANAGE_ROLES/ManageRoles/g' bot/commands/prefixCommands.js
sed -i 's/MANAGE_GUILD/ManageGuild/g' bot/commands/prefixCommands.js
sed -i 's/ADMINISTRATOR/Administrator/g' bot/commands/prefixCommands.js

# Update permissions in slashCommands.js
sed -i 's/BAN_MEMBERS/BanMembers/g' bot/commands/slashCommands.js
sed -i 's/KICK_MEMBERS/KickMembers/g' bot/commands/slashCommands.js
sed -i 's/MANAGE_CHANNELS/ManageChannels/g' bot/commands/slashCommands.js
sed -i 's/MANAGE_MESSAGES/ManageMessages/g' bot/commands/slashCommands.js
sed -i 's/MANAGE_ROLES/ManageRoles/g' bot/commands/slashCommands.js
sed -i 's/MANAGE_GUILD/ManageGuild/g' bot/commands/slashCommands.js
sed -i 's/ADD_REACTIONS/AddReactions/g' bot/commands/slashCommands.js
sed -i 's/ADMINISTRATOR/Administrator/g' bot/commands/slashCommands.js

echo "Permission constants updated for Discord.js v14"