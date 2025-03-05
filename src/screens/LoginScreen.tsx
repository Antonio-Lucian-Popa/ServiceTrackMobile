import React, { useState } from 'react';
import {
  View,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Button,
  useColorScheme,
} from 'react-native';

import {
  Text,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';

import { useAuth } from '../context/AuthContext';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureText] = useState(true); // Control vizibilitate parolă
  const [loading, setLoading] = useState(false);
  const { login } = useAuth(); // Folosim contextul de autentificare

  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return (
    <PaperProvider theme={theme}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}  style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.loginBox, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>Bine ai venit</Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>Autentifică-te pentru a continua</Text>

          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.onSurface }]}
            autoCapitalize="none"
            mode="outlined"
            placeholderTextColor={theme.colors.onSurface}
            theme={{
              colors: {
                text: 'black', // 🔥 Asigură text negru în orice temă
              },
            }}
          />

          {/* TextInput pentru parolă cu buton de vizibilitate */}
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Parolă"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureText} // 🔥 Ascunde/afișează parola
              textContentType="password"
              style={[styles.passwordInput, { backgroundColor: theme.colors.surface, color: theme.colors.onSurface }]}
              mode="outlined"
              placeholderTextColor={theme.colors.onSurface}
              theme={{
                colors: {
                  text: 'black', // 🔥 Asigură text negru în orice temă
                },
              }}
            />
            {/* <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
              {secureText ? <EyeOff size={24} color="gray" /> : <Eye size={24} color="gray" />}
            </TouchableOpacity> */}
          </View>

          <View style={styles.buttonContainer}>
            <Button title="Login" onPress={async () => {
              setLoading(true);
              try {
                await login(username, password);
              } catch {
                Alert.alert('Eroare', 'Autentificare eșuată');
              } finally {
                setLoading(false);
              }
            }} disabled={loading} />
          </View>

          {loading && <ActivityIndicator size="large" style={styles.loading} />}
        </View>
      </KeyboardAvoidingView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loginBox: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  input: { marginBottom: 10 },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    padding: 10,
  },
  buttonContainer: { marginTop: 10 },
  loading: { marginTop: 10 },
});

export default LoginScreen;
