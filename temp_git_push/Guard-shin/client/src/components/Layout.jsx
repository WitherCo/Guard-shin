import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  Flex,
  useColorModeValue,
  Link,
  Button,
  Icon,
  Text,
  Image,
  Drawer,
  DrawerContent,
  IconButton,
  useDisclosure,
  BoxProps,
  FlexProps,
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
  FiMenu,
  FiLogOut,
  FiPlus,
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';

// Common LinkItems for sidebar navigation
const LinkItems = [
  { name: 'Dashboard', icon: FiHome, path: '/' },
  { name: 'Servers', icon: FiServer, path: '/servers' },
  { name: 'Commands', icon: FiCommand, path: '/commands' },
  { name: 'Premium', icon: FiStar, path: '/premium' },
  { name: 'Analytics', icon: FiBarChart2, path: '/analytics' },
  { name: 'Logs', icon: FiList, path: '/logs' },
  { name: 'Welcome Messages', icon: FiMessageSquare, path: '/welcome-messages' },
  { name: 'Documentation', icon: FiBook, path: '/docs' },
];

export default function Layout() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bg = useColorModeValue('gray.100', 'gray.900');
  
  return (
    <Box minH="100vh" bg={bg}>
      <SidebarContent onClose={() => onClose} display={{ base: 'none', md: 'block' }} />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full">
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      {/* mobilenav */}
      <MobileNav onOpen={onOpen} />
      <Box ml={{ base: 0, md: 60 }} p="4">
        <Outlet />
      </Box>
    </Box>
  );
}

// Sidebar component
const SidebarContent = ({ onClose, ...rest }) => {
  const bgSidebar = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      transition="3s ease"
      bg={bgSidebar}
      borderRight="1px"
      borderRightColor={borderColor}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}>
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontWeight="bold" color="#8b49ff">
          Guard-shin
        </Text>
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onClose}
          variant="outline"
          aria-label="close menu"
          icon={<FiMenu />}
        />
      </Flex>
      
      {/* Link Items */}
      {LinkItems.map((link) => (
        <NavItem key={link.name} icon={link.icon} path={link.path}>
          {link.name}
        </NavItem>
      ))}
      
      {/* Add Server Button */}
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        mt={6}
        bg="#8b49ff"
        color="white"
        _hover={{
          bg: '#7122ff',
        }}
        as="a"
        href="https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot&permissions=8"
        target="_blank"
      >
        <Icon
          mr="4"
          fontSize="16"
          as={FiPlus}
        />
        Add Server
      </Flex>
      
      {/* Support Server Button */}
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        mt={2}
        bg="discord.500"
        color="white"
        _hover={{
          bg: 'discord.900',
        }}
        as="a"
        href="https://discord.gg/g3rFbaW6gw"
        target="_blank"
      >
        <Icon
          mr="4"
          fontSize="16"
          as={FiMessageSquare}
        />
        Support Server
      </Flex>
    </Box>
  );
};

// NavItem Component
const NavItem = ({ icon, path, children, ...rest }) => {
  return (
    <Link
      as={RouterLink}
      to={path}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}>
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        _hover={{
          bg: 'brand.400',
          color: 'white',
        }}
        {...rest}>
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};

// Mobile Navigation
const MobileNav = ({ onOpen, ...rest }) => {
  const bgNav = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={bgNav}
      borderBottomWidth="1px"
      borderBottomColor={borderColor}
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      {...rest}>
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <Text
        display={{ base: 'flex', md: 'none' }}
        fontSize="2xl"
        fontWeight="bold"
        color="brand.400">
        Guard-shin
      </Text>

      <Flex alignItems={'center'}>
        <Button
          variant={'solid'}
          colorScheme={'brand'}
          size={'sm'}
          mr={4}
          leftIcon={<FiLogOut />}>
          Log Out
        </Button>
      </Flex>
    </Flex>
  );
};