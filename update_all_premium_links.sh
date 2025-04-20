#!/bin/bash

# Update server/discord/commands.ts
sed -i '386s|value: \'\[View Pricing\](https://guard-shin.com/premium)\'|value: \'\[View Pricing\](https://witherco.org/premium)\'|' ./server/discord/commands.ts

# Update bot/commands/prefixCommands.js
sed -i '248s|\[Click here\](https://guard-shin.com/premium)|\[Click here\](https://witherco.org/premium)|' ./bot/commands/prefixCommands.js
sed -i '296s|\[Click here\](https://guard-shin.com/premium)|\[Click here\](https://witherco.org/premium)|' ./bot/commands/prefixCommands.js
sed -i '358s|\[Click here\](https://guard-shin.com/premium)|\[Click here\](https://witherco.org/premium)|' ./bot/commands/prefixCommands.js
sed -i '460s|\[Click here\](https://guard-shin.com/premium)|\[Click here\](https://witherco.org/premium)|' ./bot/commands/prefixCommands.js

# Update bot/utils/premiumCheck.js
sed -i '128s|Visit \[guard-shin.com/premium\](https://guard-shin.com/premium)|Visit \[witherco.org/premium\](https://witherco.org/premium)|' ./bot/utils/premiumCheck.js