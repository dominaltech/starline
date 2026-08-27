import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../db/storage';

interface AuthContextType {
  user: User;
  role: UserRole;
  isSuperAdmin: boolean;
  switchRole: (role: UserRole) => void;
  usersList: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => storage.getActiveUser());

  useEffect(() => {
    storage.init();
    setUser(storage.getActiveUser());
  }, []);

  const switchRole = (newRole: UserRole) => {
    const users = storage.getUsers();
    const target = users.find(u => u.role === newRole) || {
      id: newRole === 'super_admin' ? 'usr_super' : 'usr_staff',
      username: newRole === 'super_admin' ? 'admin' : 'staff',
      role: newRole,
      name: newRole === 'super_admin' ? 'Proprietor (Super Admin)' : 'Counter Biller (Admin)',
      created_at: new Date().toISOString()
    };
    storage.setActiveUser(target);
    setUser(target);
  };

  const value: AuthContextType = {
    user,
    role: user.role,
    isSuperAdmin: user.role === 'super_admin',
    switchRole,
    usersList: storage.getUsers()
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
