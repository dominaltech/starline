import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../db/storage';

interface AuthContextType {
  user: User;
  role: UserRole;
  isSuperAdmin: boolean;
  switchRole: (role: UserRole) => void;
  verifyAndSwitchToSuperAdmin: (password: string) => boolean;
  usersList: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always initialize default active user as Admin as requested
  const [user, setUser] = useState<User>(() => {
    const users = storage.getUsers();
    return users.find((u) => u.role === 'admin') || {
      id: 'usr_staff',
      username: 'staff',
      role: 'admin',
      name: 'Counter Biller (Admin)',
      created_at: new Date().toISOString()
    };
  });

  useEffect(() => {
    storage.init();
    const users = storage.getUsers();
    const adminUser = users.find((u) => u.role === 'admin') || {
      id: 'usr_staff',
      username: 'staff',
      role: 'admin',
      name: 'Counter Biller (Admin)',
      created_at: new Date().toISOString()
    };
    storage.setActiveUser(adminUser);
    setUser(adminUser);
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

  const verifyAndSwitchToSuperAdmin = (password: string): boolean => {
    const settings = storage.getSettings();
    const expectedPassword = settings.super_admin_password || '123456';
    if (password.trim() === expectedPassword.trim()) {
      switchRole('super_admin');
      return true;
    }
    return false;
  };

  const value: AuthContextType = {
    user,
    role: user.role,
    isSuperAdmin: user.role === 'super_admin',
    switchRole,
    verifyAndSwitchToSuperAdmin,
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
