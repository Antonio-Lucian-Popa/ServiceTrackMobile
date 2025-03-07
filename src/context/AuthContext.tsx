import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/AuthService';
import { ActivityIndicator, Alert, View } from 'react-native';

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
  const [loading, setLoading] = useState(true); // Adăugăm loading aici!

  useEffect(() => {
    const checkToken = async () => {
      const savedToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      console.log("🔍 Token salvat:", savedToken);
      console.log("🔍 Refresh token:", refreshToken);

      if (savedToken) {
        setUserToken(savedToken);
        console.log("🔓 Token existent, încerc să obțin user info...");
        await fetchUserInfo();
      } else if (refreshToken) {
        console.log("🔄 Încerc să reîmprospătez token-ul...");
        const newToken = await apiService.refreshAccessToken();
        if (newToken) {
          setUserToken(newToken);
          await fetchUserInfo();
        }
      } else {
        console.warn("⚠️ Nu există token valid, fac logout.");
        await logout();
      }

      setLoading(false); // 🔥 Acum terminăm loading-ul
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
    console.log("🔴 Logout utilizator...");
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
    } catch (error) {
      console.error('❌ Eroare la obținerea informațiilor utilizatorului:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ userToken, user, setUserToken, login, logout, fetchUserInfo }}>
      {loading ? (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    ) : (
      children
    )}
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
