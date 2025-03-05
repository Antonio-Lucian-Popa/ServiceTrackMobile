import { useAuth } from '../context/AuthContext';
import apiService from './AuthService';

// const API_URL = 'https://uti.umbgrup.ro';
const API_URL = 'https://test.uti.umbgrup.ro';

export interface ServiceUtilaj {
  data: string;
  data_executie: string;
  executat: boolean;
  id: number;
  mecanic: number; // mecanic id
  observatii: string;
  pdf: string;
  titlu: string;
  user: number; // user id
  utilaj: number; // utilaj id
}

// Hook care gestionează serviciile pentru `ServiceUtilaj`
export const useServiceUtilaj = () => {
  const { setUserToken } = useAuth();

  const findAllServicesOnUtilajId = async (utilajId: number): Promise<ServiceUtilaj[] | null> => {
    try {
      const token = await apiService.getAccessToken();
      if (!token) throw new Error('Unauthorized');

      const response = await fetch(`${API_URL}/service_utilaj/${utilajId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        console.error('Unauthorized:', response);
        await apiService.logout();
        setUserToken(null);
        return null;
      }

      if (!response.ok) {
        console.error('Request failed:', response);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error during API call:', error);
      return null;
    }
  };

  return { findAllServicesOnUtilajId };
};
