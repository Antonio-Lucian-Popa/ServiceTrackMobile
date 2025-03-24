import React from 'react';
import { View, Alert, StyleSheet, useColorScheme } from 'react-native';
import { List, Avatar, Divider, Button, MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { version as appVersion } from '../../package.json'; // Import versiunea din package.json
import { useFocusEffect } from '@react-navigation/native';

const SettingsScreen: React.FC = () => {
  
  const { user, logout, fetchUserInfo } = useAuth();


  useFocusEffect(
    React.useCallback(() => {
      fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert(
      'Deconectare',
      'Ești sigur că vrei să te deconectezi?',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Logout', onPress: async () => {
            console.log('User logged out');
            // 🔴 Deconectare utilizator
            // await AsyncStorage.removeItem('accessToken');
            // await AsyncStorage.removeItem('refreshToken');
            // setUserToken(null);
            logout();
          },
        },
      ]
    );
  };

  const scheme = useColorScheme(); // 🔥 Detectează tema sistemului
  const theme = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme; // 🔥 Aplică tema


  return (
    <PaperProvider theme={theme}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Profilul utilizatorului */}
        <View style={[styles.profileContainer, { backgroundColor: theme.colors.surface }]}>
          <Avatar.Text size={60} label={user?.username.charAt(0).toUpperCase() || '?'} />
          <List.Item
            title={user?.username || 'N/A'}
            titleStyle={[styles.username, { color: theme.colors.onSurface }]}
            descriptionStyle={[styles.marca, { color: theme.colors.onSurfaceVariant }]}
            left={() => null}
          />
        </View>

        <Divider />

        {/* Setări */}
        <List.Section style={styles.listContainer}>
          <List.Item
            title="Versiunea aplicației"
            description={appVersion}
            left={() => <List.Icon icon="information-outline" />}
          />
        </List.Section>

        <Divider />

        {/* Buton de Logout */}
        <View style={styles.logoutContainer}>
          <Button
            mode="contained"
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
            onPress={handleLogout}
          >
            Logout
          </Button>
        </View>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  marca: {
    fontSize: 14,
    color: 'gray',
  },
  logoutContainer: {
    margin: 20,
    marginTop: 'auto',
  },
  listContainer: {
    paddingLeft: 10,
  }
});

export default SettingsScreen;
