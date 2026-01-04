import React, { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#4ade80',
              color: '#fff',
            },
          },
          error: {
            style: {
              background: '#f87171',
              color: '#fff',
            },
          },
        }}
      />
    </>
  );
};