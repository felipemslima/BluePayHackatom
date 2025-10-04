import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom'; // <-- Importante

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* O <App /> precisa estar dentro do <BrowserRouter> */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);