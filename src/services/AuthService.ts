import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const API_URL = 'https://uti.umbgrup.ro';

interface AuthResponse {
  access: string;
  refresh: string;
}

const apiService = {
 
  login: async (username: string, password: string): Promise<AuthResponse | null> => {
    try {
      const response = await fetch(`${API_URL}/rest_api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem('accessToken', data.access);
        await AsyncStorage.setItem('refreshToken', data.refresh);
        return data;
      } else {
        console.error('Login failed:', data);
        return null;
      }
    } catch (error) {
      console.error('Error during login:', error);
      return null;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
  },

  getAccessToken: async () => {
    let token = await AsyncStorage.getItem('accessToken');

    if (token && apiService.isTokenExpired(token)) {
      console.log('Access token is expired, refreshing...');
      token = await apiService.refreshAccessToken();
    }

    return token;
  },

  refreshAccessToken: async (): Promise<string | null> => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) return null;

      const response = await fetch(`${API_URL}/rest_api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error('Token refresh failed');

      await AsyncStorage.setItem('accessToken', data.access);
      await AsyncStorage.setItem('refreshToken', data.refresh);
      return data.access;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  },

  isTokenExpired: (token: string): boolean => {
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded.exp) return false;
      return Date.now() >= decoded.exp * 1000;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  },

  request: async (endpoint: string, method = 'GET', body?: any): Promise<any> => {
    try {
      let token = await apiService.getAccessToken();

      if (!token) {
        token = await apiService.refreshAccessToken();
        if (!token) throw new Error('Unauthorized');
      }

      const response = await fetch(`${API_URL}/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : null,
      });

      if (response.status === 401) {
        const newToken = await apiService.refreshAccessToken();
        if (newToken) {
          return apiService.request(endpoint, method, body);
        } else {
          throw new Error('Session expired');
        }
      }

      return response.json();
    } catch (error) {
      console.error(`API request error: ${error}`);
      return null;
    }
  },
};

export default apiService;
