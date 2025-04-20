import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import Dashboard from './pages/Dashboard';
import Servers from './pages/Servers';
import ServerDetails from './pages/ServerDetails';
import Commands from './pages/Commands';
import Premium from './pages/Premium';
import Documentation from './pages/Documentation';
import Analytics from './pages/Analytics';
import Logs from './pages/Logs';
import WelcomeMessages from './pages/WelcomeMessages';
import Layout from './components/Layout';
import './styles/index.css';

// Extend the theme to include custom colors, fonts, etc.
const theme = extendTheme({
  colors: {
    brand: {
      50: '#f5e9ff',
      100: '#dac1ff',
      200: '#c099ff',
      300: '#a571ff',
      400: '#8b49ff', // Primary color
      500: '#7122ff',
      600: '#5a18d1',
      700: '#4310a3',
      800: '#2d0875',
      900: '#170348',
    },
    discord: {
      100: '#738adb',
      500: '#5865F2',
      900: '#3a42a4',
    },
  },
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="servers" element={<Servers />} />
            <Route path="servers/:id" element={<ServerDetails />} />
            <Route path="commands" element={<Commands />} />
            <Route path="premium" element={<Premium />} />
            <Route path="docs" element={<Documentation />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="logs" element={<Logs />} />
            <Route path="welcome-messages" element={<WelcomeMessages />} />
          </Route>
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;