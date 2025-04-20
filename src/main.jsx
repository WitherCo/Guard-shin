import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import App from './App';
import './styles/index.css';

// For debugging
console.log('Environment variables:', {
  GITHUB_PAGES: import.meta.env.GITHUB_PAGES,
  BASE_URL: import.meta.env.BASE_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
});

// Extend Chakra UI theme with our custom colors and settings
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

// Add event listener to log when the app is loaded
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded event fired - App should render now');
});

// Log rendering process to help debug GitHub Pages
console.log('Rendering React app...');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);

console.log('React app rendered');