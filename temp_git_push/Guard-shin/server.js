/**
 * Guard-shin Discord Bot - Server
 * 
 * Copyright (c) 2025 WitherCo
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'client')));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'Guard-shin',
    description: 'Advanced Discord moderation and security bot',
    invite: 'https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot&permissions=8',
    support: 'https://discord.gg/g3rFbaW6gw'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});