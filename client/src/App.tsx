import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, HashRouter } from 'react-router-dom';
import { ChakraProvider, extendTheme, Box, Button, Flex, Heading, Text, Container } from '@chakra-ui/react';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';

// Create a custom theme with dark mode as default
const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#f0e4ff',
      100: '#d1b3ff',
      200: '#b183ff',
      300: '#9254ff',
      400: '#7425ff',
      500: '#5500e6',
      600: '#4400b4',
      700: '#330082',
      800: '#220052',
      900: '#110022',
    },
  },
});

// Home page component
const Home = () => (
  <Box as="section" py={20} bg="gray.900" color="white">
    <Container maxW="container.xl">
      <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between">
        <Box maxW={{ base: '100%', md: '50%' }} mb={{ base: 10, md: 0 }}>
          <Heading as="h1" size="2xl" mb={4}>
            Guard-shin Discord Bot
          </Heading>
          <Text fontSize="xl" mb={6}>
            Advanced moderation and security for your Discord server. Protect your community with intelligent, user-friendly tools.
          </Text>
          <Flex gap={4} wrap="wrap">
            <Button 
              as="a" 
              href="https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=applications.commands%20bot&permissions=8"
              target="_blank"
              colorScheme="purple" 
              size="lg"
            >
              Add to Discord
            </Button>
            <Button 
              as={Link} 
              to="/premium" 
              colorScheme="purple" 
              variant="outline" 
              size="lg"
            >
              View Premium Plans
            </Button>
          </Flex>
        </Box>
        <Box 
          maxW={{ base: '100%', md: '45%' }} 
          bg="gray.800" 
          p={6} 
          borderRadius="lg" 
          boxShadow="lg"
        >
          <Heading as="h3" size="lg" mb={6} textAlign="center">
            Premium Features
          </Heading>
          <Flex direction="column" gap={4}>
            <Flex align="center" gap={3}>
              <Box bg="purple.500" p={2} borderRadius="md">
                <Text>🛡️</Text>
              </Box>
              <Box>
                <Heading as="h4" size="sm">Advanced Auto-Moderation</Heading>
                <Text color="gray.400" fontSize="sm">Customizable filters, auto-actions, and anti-spam</Text>
              </Box>
            </Flex>
            <Flex align="center" gap={3}>
              <Box bg="purple.500" p={2} borderRadius="md">
                <Text>🎵</Text>
              </Box>
              <Box>
                <Heading as="h4" size="sm">Music Commands</Heading>
                <Text color="gray.400" fontSize="sm">High-quality music playback with playlist support</Text>
              </Box>
            </Flex>
            <Flex align="center" gap={3}>
              <Box bg="purple.500" p={2} borderRadius="md">
                <Text>📊</Text>
              </Box>
              <Box>
                <Heading as="h4" size="sm">Server Analytics</Heading>
                <Text color="gray.400" fontSize="sm">Track activity, member growth, and moderation stats</Text>
              </Box>
            </Flex>
            <Flex align="center" gap={3}>
              <Box bg="purple.500" p={2} borderRadius="md">
                <Text>🖼️</Text>
              </Box>
              <Box>
                <Heading as="h4" size="sm">Custom Welcome Images</Heading>
                <Text color="gray.400" fontSize="sm">Personalized welcome cards for new members</Text>
              </Box>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Container>
  </Box>
);

// Main App component with routing
function App() {
  // Use HashRouter for GitHub Pages compatibility
  const isGitHubPages = import.meta.env.GITHUB_PAGES === 'true';
  const RouterComponent = isGitHubPages ? HashRouter : Router;
  
  return (
    <ChakraProvider theme={theme}>
      <RouterComponent>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/premium" element={<Checkout />} />
          <Route path="/premium/success" element={<PaymentSuccess />} />
          <Route path="*" element={<Home />} /> {/* Catch-all route */}
        </Routes>
      </RouterComponent>
    </ChakraProvider>
  );
}

export default App;