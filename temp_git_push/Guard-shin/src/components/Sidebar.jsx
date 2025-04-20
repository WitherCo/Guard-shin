import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Icon,
  Link,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiHome,
  FiServer,
  FiCommand,
  FiStar,
  FiBarChart2,
  FiList,
  FiMessageSquare,
  FiBook,
  FiPlus,
  FiSettings,
  FiUsers,
  FiShield,
} from 'react-icons/fi';

// Navigation items for the sidebar
const navItems = [
  { name: 'Dashboard', icon: FiHome, path: '/' },
  { name: 'Servers', icon: FiServer, path: '/servers' },
  { name: 'Commands', icon: FiCommand, path: '/commands' },
  { name: 'Analytics', icon: FiBarChart2, path: '/analytics', premium: true },
  { name: 'Logs', icon: FiList, path: '/logs' },
  { name: 'Automod', icon: FiShield, path: '/automod' },
  { name: 'Welcome Messages', icon: FiMessageSquare, path: '/welcome', premium: true },
  { name: 'User Management', icon: FiUsers, path: '/users' },
  { name: 'Documentation', icon: FiBook, path: '/docs' },
  { name: 'Premium', icon: FiStar, path: '/premium' },
  { name: 'Settings', icon: FiSettings, path: '/settings' },
];

const Sidebar = () => {
  const location = useLocation();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      as="aside"
      w="64"
      position="fixed"
      h="100vh"
      borderRight="1px"
      borderRightColor={borderColor}
      bg={bg}
      py={5}
      overflowY="auto"
      className="sidebar"
    >
      {/* Logo and Bot Name */}
      <Flex px={4} mb={8} alignItems="center">
        <Box 
          w="40px" 
          h="40px" 
          borderRadius="md" 
          bgGradient="linear(to-r, brand.500, brand.700)" 
          mr={3}
        />
        <Text fontSize="xl" fontWeight="bold" color="brand.500">
          Guard-shin
        </Text>
      </Flex>
      
      {/* Navigation Links */}
      <VStack spacing={1} align="stretch">
        {navItems.map((item) => (
          <Link
            as={RouterLink}
            to={item.path}
            key={item.name}
            _hover={{ textDecoration: 'none' }}
          >
            <HStack
              py={3}
              px={4}
              spacing={3}
              borderRadius="md"
              transition="all 0.2s"
              bg={location.pathname === item.path ? 'brand.400' : 'transparent'}
              color={location.pathname === item.path ? 'white' : 'inherit'}
              _hover={{
                bg: location.pathname === item.path ? 'brand.500' : 'gray.100',
                color: location.pathname === item.path ? 'white' : 'brand.500',
              }}
            >
              <Icon as={item.icon} fontSize="lg" />
              <Text>{item.name}</Text>
              {item.premium && (
                <Badge colorScheme="yellow" ml="auto" variant="solid" borderRadius="full" px={2} py={0.5} fontSize="xs">
                  PRO
                </Badge>
              )}
            </HStack>
          </Link>
        ))}
      </VStack>
      
      {/* Add to Discord Button */}
      <Flex 
        mt={8} 
        mx={4} 
        p={3}
        borderRadius="md"
        bg="brand.500"
        color="white"
        fontWeight="medium"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ bg: 'brand.600' }}
        as="a"
        href="https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot&permissions=8"
        target="_blank"
      >
        <Icon as={FiPlus} mr={2} />
        Add to Discord
      </Flex>
      
      {/* Support Server Link */}
      <Flex 
        mt={3} 
        mx={4} 
        p={3}
        borderRadius="md"
        bg="#5865F2" // Discord blue
        color="white"
        fontWeight="medium"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ bg: '#4752C4' }}
        as="a"
        href="https://discord.gg/g3rFbaW6gw"
        target="_blank"
      >
        Support Server
      </Flex>
    </Box>
  );
};

export default Sidebar;