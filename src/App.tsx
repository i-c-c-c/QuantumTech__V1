import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { AppRoutes } from './routes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ToastProvider>
          <CartProvider>
            <AdminAuthProvider>
              <AppRoutes />
            </AdminAuthProvider>
          </CartProvider>
        </ToastProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
