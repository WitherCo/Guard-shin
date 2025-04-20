import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import App from './App';
import './styles/index.css';

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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);