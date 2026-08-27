import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { DbProvider } from './context/DbContext';
import { AppLayout } from './components/layout/AppLayout';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <DbProvider>
        <AppLayout />
      </DbProvider>
    </AuthProvider>
  );
};

export default App;
