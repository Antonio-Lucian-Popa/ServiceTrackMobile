import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import Tabs from './Tabs';

export default function RootNavigator() {
  const { userToken } = useAuth();
  // const { userToken, setUserToken } = useAuth(); // ✅ Acum avem `setUserToken`
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const checkLogin = async () => {
  //     let token = await AsyncStorage.getItem('accessToken');
  //     if (token && apiService.isTokenExpired(token)) {
  //       console.log('Access token is expired, trying to refresh...');
  //       token = await apiService.refreshAccessToken();
  //     }

  //     if (token) {
  //       setUserToken(token);
  //     } else {
  //       await apiService.logout();
  //       setUserToken(null);
  //     }

  //     setLoading(false);
  //   };

  //   checkLogin();
  // }, [setUserToken]);

  // if (loading) return null;


  return <NavigationContainer>{userToken ? <Tabs /> : <AuthStack />}</NavigationContainer>;
}
