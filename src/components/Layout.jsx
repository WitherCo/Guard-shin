import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Flex, useColorModeValue, IconButton, Avatar, Menu, MenuButton, MenuList, MenuItem, Text } from '@chakra-ui/react';
import { FiMenu, FiBell, FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import Sidebar from './Sidebar';

const Layout = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const navBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Placeholder for mobile menu toggle
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  
  return (
    <Flex minHeight="100vh" bg={bgColor}>
      {/* Sidebar - hidden on mobile */}
      <Box display={{ base: 'none', md: 'block' }}>
        <Sidebar />
      </Box>
      
      {/* Main Content Area */}
      <Box flex="1" ml={{ base: 0, md: '64' }}>
        {/* Top Navigation Bar */}
        <Flex
          as="nav"
          align="center"
          justify="space-between"
          p={4}
          bg={navBg}
          borderBottomWidth="1px"
          borderColor={borderColor}
          position="sticky"
          top="0"
          zIndex="sticky"
        >
          {/* Mobile Menu Toggle */}
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            aria-label="Open Menu"
            icon={<FiMenu />}
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            variant="ghost"
          />
          
          {/* Page Title (mobile only) */}
          <Text
            display={{ base: 'flex', md: 'none' }}
            fontSize="xl"
            fontWeight="bold"
            color="brand.500"
          >
            Guard-shin
          </Text>
          
          {/* Right Side User Menu */}
          <Flex align="center">
            {/* Notification Bell */}
            <IconButton
              aria-label="Notifications"
              icon={<FiBell />}
              variant="ghost"
              mr={3}
              position="relative"
            >
              {/* Notification Badge */}
              <Box
                as="span"
                position="absolute"
                top="1"
                right="1"
                bg="red.500"
                borderRadius="full"
                w="2"
                h="2"
              />
            </IconButton>
            
            {/* User Menu */}
            <Menu>
              <MenuButton
                as={Box}
                rounded="full"
                cursor="pointer"
              >
                <Avatar size="sm" name="User" bg="brand.500" />
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FiUser />}>Profile</MenuItem>
                <MenuItem icon={<FiSettings />}>Settings</MenuItem>
                <MenuItem icon={<FiLogOut />}>Log Out</MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Flex>
        
        {/* Page Content */}
        <Box p={5}>
          <Outlet />
        </Box>
      </Box>
    </Flex>
  );
};

export default Layout;