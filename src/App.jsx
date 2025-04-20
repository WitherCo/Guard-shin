import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Flex, Text, Button, useColorModeValue, Heading, Stat, StatLabel, StatNumber, SimpleGrid, Icon, HStack } from '@chakra-ui/react';
import { FiUsers, FiShield, FiCommand, FiAlertTriangle } from 'react-icons/fi';
import Layout from './components/Layout';

// Dashboard component
const Dashboard = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const statData = [
    { title: 'Servers Protected', icon: FiUsers, value: '1,234', color: 'blue.500' },
    { title: 'Commands Executed', icon: FiCommand, value: '45,678', color: 'green.500' },
    { title: 'Users Protected', icon: FiUsers, value: '89,456', color: 'purple.500' },
    { title: 'Raids Prevented', icon: FiAlertTriangle, value: '543', color: 'red.500' },
  ];
  
  return (
    <Box className="fade-in">
      {/* Welcome Header */}
      <Flex 
        className="hero-gradient" 
        direction="column" 
        p={8} 
        borderRadius="lg" 
        color="white"
        mb={6}
      >
        <Heading size="lg" mb={2}>Welcome to Guard-shin Dashboard</Heading>
        <Text fontSize="md" mb={4}>
          Advanced Discord moderation and security bot with intelligent protection
        </Text>
        <Button 
          as="a" 
          href="https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot&permissions=8" 
          target="_blank"
          colorScheme="whiteAlpha" 
          size="md" 
          w="fit-content"
        >
          Add to Server
        </Button>
      </Flex>
      
      {/* Statistics */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={8}>
        {statData.map((stat, i) => (
          <Box key={i} p={5} borderRadius="lg" bg={cardBg} boxShadow="sm">
            <HStack spacing={4}>
              <Flex 
                alignItems="center" 
                justifyContent="center" 
                borderRadius="full" 
                bg={`${stat.color}10`} 
                color={stat.color} 
                boxSize="12"
              >
                <Icon as={stat.icon} boxSize="6" />
              </Flex>
              <Stat>
                <StatLabel>{stat.title}</StatLabel>
                <StatNumber>{stat.value}</StatNumber>
              </Stat>
            </HStack>
          </Box>
        ))}
      </SimpleGrid>
      
      {/* Features Grid */}
      <Box mb={8}>
        <Heading size="md" mb={4}>Features</Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
          {[
            'Auto-Moderation', 
            'Raid Protection', 
            'Verification System',
            'Welcome Messages',
            'Music Player',
            'Advanced Analytics',
            'Custom Commands',
            'Ticket System'
          ].map((feature, i) => (
            <Box 
              key={i}
              p={5} 
              borderRadius="lg" 
              bg={cardBg} 
              boxShadow="sm"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-5px)', boxShadow: 'md' }}
            >
              <Text fontSize="lg" fontWeight="medium">{feature}</Text>
              <Text fontSize="sm" color="gray.500" mt={1}>
                {i % 2 === 0 ? 'Available for all servers' : (
                  <Flex alignItems="center">
                    <Text>Premium Feature</Text>
                    <Text className="premium-badge" ml={2}>PRO</Text>
                  </Flex>
                )}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
};

// Servers component placeholder
const Servers = () => (
  <Box>
    <Heading size="lg" mb={4}>Your Servers</Heading>
    <Text>Select a server to manage its settings.</Text>
  </Box>
);

// Commands component placeholder
const Commands = () => (
  <Box>
    <Heading size="lg" mb={4}>Available Commands</Heading>
    <Text>Browse all available commands for your Discord server.</Text>
  </Box>
);

// Premium component placeholder
const Premium = () => (
  <Box>
    <Heading size="lg" mb={4}>Premium Features</Heading>
    <Text>Upgrade to Premium to unlock advanced features for your server.</Text>
  </Box>
);

// Main App component
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="servers" element={<Servers />} />
          <Route path="commands" element={<Commands />} />
          <Route path="premium" element={<Premium />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;