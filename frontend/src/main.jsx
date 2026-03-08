import react from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import App from './App.jsx';
import './styles/globals.css';

createRoot(document.getElementById('root')).render(
  <react.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </react.StrictMode>
);
