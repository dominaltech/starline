import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { DbProvider } from './context/DbContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLayout } from './components/layout/AppLayout';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DbProvider>
          <AppLayout />
        </DbProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
