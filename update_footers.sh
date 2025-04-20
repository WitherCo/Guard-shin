#!/bin/bash
# Update all premium footers to use http://witherco.org/premium
sed -i "s|text: 'Visit https://guard-shin.com/premium to upgrade'|text: 'Visit http://witherco.org/premium to upgrade'|g" bot/commands/prefixCommands.js
sed -i "s|text: 'Visit https://guard-shin.com/premium to upgrade'|text: 'Visit http://witherco.org/premium to upgrade'|g" bot/utils/premiumCheck.js
sed -i 's|footer: { text: "Visit https://guard-shin.com/premium to upgrade" }|footer: { text: "Visit http://witherco.org/premium to upgrade" }|g' server/discord/commands.ts
sed -i 's|value: "\[Click here\](https://guard-shin.com/premium) to view Premium plans."|value: "[Click here](http://witherco.org/premium) to view Premium plans."|g' bot/commands/prefixCommands.js
sed -i 's|value: "Visit \[guard-shin.com/premium\](https://guard-shin.com/premium) to view Premium plans."|value: "Visit [witherco.org/premium](http://witherco.org/premium) to view Premium plans."|g' bot/utils/premiumCheck.js
sed -i 's|value: "\[View Pricing\](https://guard-shin.com/premium)"|value: "[View Pricing](http://witherco.org/premium)"|g' server/discord/commands.ts
