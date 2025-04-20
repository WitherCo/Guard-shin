#!/usr/bin/env python3
"""
Guard-shin Discord Bot - Python to Lua Bridge
This module handles communication between Python and Lua components
"""

import json
import socket
import asyncio
import logging
import os
from typing import Dict, Any, Optional, Union, List, Tuple

# Configure logger
logger = logging.getLogger('guard-shin.lua_bridge')

class LuaBridge:
    """Bridge class to communicate with Lua component"""
    
    def __init__(self, host: str = '127.0.0.1', port: int = 7777):
        """Initialize the Lua bridge
        
        Args:
            host: The host where the Lua IPC server is running
            port: The port where the Lua IPC server is listening
        """
        self.host = host
        self.port = port
        self.ipc_folder = os.path.join('bot', 'ipc')
        self.command_file = os.path.join(self.ipc_folder, 'commands.json')
        self.response_file = os.path.join(self.ipc_folder, 'responses.json')
        
        # Create IPC folder if it doesn't exist
        os.makedirs(self.ipc_folder, exist_ok=True)
        
        # Initialize with empty files
        with open(self.command_file, 'w') as f:
            f.write('{}')
        with open(self.response_file, 'w') as f:
            f.write('{}')
    
    async def send_command(self, command: str, args: List[Any] = None, 
                          message: Dict[str, Any] = None, 
                          guild: Dict[str, Any] = None) -> Dict[str, Any]:
        """Send a command to the Lua component
        
        Args:
            command: The command name to execute
            args: The arguments for the command
            message: Message context information
            guild: Guild context information
            
        Returns:
            Dictionary with the command result
        """
        if args is None:
            args = []
        if message is None:
            message = {}
        if guild is None:
            guild = {}
        
        request = {
            'type': 'command',
            'command': command,
            'args': args,
            'message': message,
            'guild': guild
        }
        
        return await self._send_request(request)
    
    async def send_event(self, event_type: str, data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Send an event to the Lua component
        
        Args:
            event_type: The type of event
            data: Event data
            
        Returns:
            Dictionary with the event processing result
        """
        if data is None:
            data = {}
        
        request = {
            'type': 'event',
            'event': event_type,
            'data': data
        }
        
        return await self._send_request(request)
    
    async def _send_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Send a request to the Lua component using socket
        
        Args:
            request: The request to send
            
        Returns:
            The response from the Lua component
        """
        try:
            # Create socket
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                # Connect to Lua IPC server
                sock.connect((self.host, self.port))
                
                # Send request
                request_json = json.dumps(request)
                sock.sendall(request_json.encode() + b'\n')
                
                # Receive response
                response_data = b''
                while True:
                    chunk = sock.recv(4096)
                    if not chunk:
                        break
                    response_data += chunk
                    if response_data.endswith(b'\n'):
                        break
                
                # Parse response
                if response_data:
                    response_json = response_data.decode().strip()
                    try:
                        return json.loads(response_json)
                    except json.JSONDecodeError:
                        logger.error(f"Failed to decode response: {response_json}")
                        return {'success': False, 'error': 'Invalid response format'}
                
                return {'success': False, 'error': 'No response received'}
                
        except ConnectionRefusedError:
            logger.error(f"Connection refused to Lua IPC server at {self.host}:{self.port}")
            # Fall back to file-based IPC if socket connection fails
            return await self._send_request_file(request)
        except Exception as e:
            logger.error(f"Error communicating with Lua component: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _send_request_file(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Send a request to the Lua component using file-based IPC
        
        This is a fallback method if socket communication fails
        
        Args:
            request: The request to send
            
        Returns:
            The response from the Lua component
        """
        try:
            # Write command to file
            with open(self.command_file, 'w') as f:
                json.dump(request, f)
            
            # Wait for response (with timeout)
            for _ in range(30):  # 3 second timeout (100ms * 30)
                await asyncio.sleep(0.1)
                try:
                    with open(self.response_file, 'r') as f:
                        content = f.read().strip()
                        if content:
                            try:
                                response = json.loads(content)
                                # Clear response file
                                with open(self.response_file, 'w') as f:
                                    f.write('{}')
                                return response
                            except json.JSONDecodeError:
                                continue
                except (FileNotFoundError, PermissionError):
                    continue
            
            # Timeout reached
            return {'success': False, 'error': 'Timeout waiting for response'}
            
        except Exception as e:
            logger.error(f"Error in file-based IPC: {e}")
            return {'success': False, 'error': str(e)}
    
    def format_discord_message(self, message) -> Dict[str, Any]:
        """Format a Discord message object for Lua consumption
        
        Args:
            message: Discord.py message object
            
        Returns:
            Dictionary with message data
        """
        try:
            return {
                'id': str(message.id),
                'content': message.content,
                'author': {
                    'id': str(message.author.id),
                    'name': message.author.name,
                    'discriminator': message.author.discriminator,
                    'bot': message.author.bot
                },
                'channel': {
                    'id': str(message.channel.id),
                    'name': getattr(message.channel, 'name', 'DM')
                },
                'guild': {
                    'id': str(message.guild.id),
                    'name': message.guild.name
                } if message.guild else None,
                'timestamp': message.created_at.isoformat() if hasattr(message, 'created_at') else None
            }
        except Exception as e:
            logger.error(f"Error formatting message for Lua: {e}")
            return {'id': 'unknown', 'content': '', 'error': str(e)}
    
    def format_discord_guild(self, guild) -> Dict[str, Any]:
        """Format a Discord guild object for Lua consumption
        
        Args:
            guild: Discord.py guild object
            
        Returns:
            Dictionary with guild data
        """
        try:
            return {
                'id': str(guild.id),
                'name': guild.name,
                'member_count': guild.member_count,
                'owner_id': str(guild.owner_id) if hasattr(guild, 'owner_id') else None,
                'icon': guild.icon.url if hasattr(guild, 'icon') and guild.icon else None,
                'created_at': guild.created_at.isoformat() if hasattr(guild, 'created_at') else None
            }
        except Exception as e:
            logger.error(f"Error formatting guild for Lua: {e}")
            return {'id': 'unknown', 'name': 'Unknown Server', 'error': str(e)}


# Create a global instance for easy imports
lua_bridge = LuaBridge()

# Export LuaBridge class
__all__ = ['LuaBridge', 'lua_bridge']