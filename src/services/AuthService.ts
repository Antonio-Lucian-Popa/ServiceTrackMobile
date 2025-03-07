import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const API_URL = 'https://test.uti.umbgrup.ro';
//const PROD_URL = `https://uti.umbgrup.ro`;

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

  getUserIdFRomToken: (token: string): string | null => {
    try {
      const decoded: any = jwtDecode(token);
      console.log('Decoded token:', decoded);
      return decoded.user_id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  request: async (
    endpoint: string,
    method: string = 'GET',
    body?: any,
    isUserId: boolean = false,
    isFormDataType: boolean = false
  ): Promise<any> => {
    try {
      let token = await apiService.getAccessToken();

      if (!token) {
        console.warn("⚠️ Token lipsă. Încerc refresh...");
        token = await apiService.refreshAccessToken();
        if (!token) throw new Error('Unauthorized');
      }

      if (isUserId) {
        let userId = apiService.getUserIdFRomToken(token);
        endpoint = endpoint + userId;
      }

      console.log("🔗 Requesting:", `${API_URL}/${endpoint}`);

      // ⚠️ NU setăm manual Content-Type pentru FormData!
      const headers: any = {
        Authorization: `Bearer ${token}`,
        ...(isFormDataType ? {} : { 'Content-Type': 'application/json' }) // Doar pentru JSON
      };

      const response = await fetch(`${API_URL}/${endpoint}`, {
        method,
        headers,
        body: body ? (isFormDataType ? body : JSON.stringify(body)) : null,
      });

      // ✅ Logăm răspunsul brut pentru debugging
      const responseText = await response.text();
      console.warn("⚠️ API Response Text:", responseText);

      if (!response.ok) {
        console.warn(`⚠️ API response status: ${response.status} - ${response.statusText}`);

        if (response.status === 401) {
          console.log("🔄 Token expirat, încerc refresh...");
          const newToken = await apiService.refreshAccessToken();
          if (newToken) {
            return apiService.request(endpoint, method, body, isUserId, isFormDataType);
          } else {
            throw new Error('Session expired');
          }
        }

        return null; // Evităm parsarea JSON pentru răspunsuri de eroare
      }

      // ✅ Încercăm să parsăm JSON doar dacă răspunsul nu e gol
      try {
        return JSON.parse(responseText);
      } catch (error) {
        console.error("🚨 JSON Parse error:", error);
        return null;
      }

    } catch (error) {
      console.error(`API request error: ${error}`);
      return null;
    }
  },

};

export default apiService;
