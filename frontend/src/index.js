import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './components/App';
import { BrowserRouter } from 'react-router-dom';
import { SocketProvider } from './contextprovider/socketprovider';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
    <SocketProvider>
    <App />
    </SocketProvider>
    </BrowserRouter>
  </React.StrictMode>
);
