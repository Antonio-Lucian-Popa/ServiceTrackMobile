import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/AuthService';
import { Alert } from 'react-native';

interface User {
  userid: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  groups: string[];
  marca: string;
}

type AuthContextType = {
  userToken: string | null;
  user: User | null;
  setUserToken: (token: string | null) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUserInfo: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      const savedToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (savedToken) {
        setUserToken(savedToken);
        await fetchUserInfo(); // 🔥 Obținem user info dacă există token
      } else if (refreshToken) {
        const newToken = await apiService.refreshAccessToken();
        if (newToken) {
          setUserToken(newToken);
          await fetchUserInfo();
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
      await fetchUserInfo();
    } else {
      Alert.alert('Autentificare eșuată');
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    setUserToken(null);
    setUser(null);
  };

  const fetchUserInfo = async () => {
    try {
      const userInfo = await apiService.request('oidc_userinfo/', 'GET', null, true);
      console.log('User info:', userInfo);
      setUser({
        userid: userInfo.userid || 0,
        username: userInfo.username || '',
        email: userInfo.email || '',
        first_name: userInfo.first_name || '',
        last_name: userInfo.last_name || '',
        groups: userInfo.groups || [],
        marca: userInfo.marca || '',
      });
      console.log('User info actualizat:', userInfo);
    } catch (error) {
      console.error('Eroare la obținerea informațiilor utilizatorului:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ userToken, user, setUserToken, login, logout, fetchUserInfo }}>
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
