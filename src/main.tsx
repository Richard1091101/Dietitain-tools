import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function mountApp() {
  const container = document.getElementById('root');
  if (container) {
    createRoot(container).render(<App />);
  } else {
    document.addEventListener('DOMContentLoaded', mountApp, { once: true });
  }
}

mountApp();
