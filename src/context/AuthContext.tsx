import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/AuthService';
import { Alert } from 'react-native';

type AuthContextType = {
  userToken: string | null;
  setUserToken: (token: string | null) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      const savedToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (savedToken) {
        setUserToken(savedToken);
      } else if (refreshToken) {
        const newToken = await apiService.refreshAccessToken();
        if (newToken) {
          setUserToken(newToken);
        }
      }
    };

    checkToken();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await apiService.login(username, password);
    if (response) {
      setUserToken(response.access);
      await AsyncStorage.setItem('accessToken', response.access);
      await AsyncStorage.setItem('refreshToken', response.refresh);
    } else {
      Alert.alert('Autentificare eșuată');
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    setUserToken(null);
  };

  return (
    <AuthContext.Provider value={{ userToken, setUserToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth trebuie folosit în interiorul AuthProvider');
  }
  return context;
};
