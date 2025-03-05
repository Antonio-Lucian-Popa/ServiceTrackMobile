import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColorScheme } from 'react-native';

const Tab = createBottomTabNavigator();

// 📌 1. Funcție separată pentru iconițe
const getTabBarIcon = (routeName: string, focused: boolean, color: string, size: number) => {
    if (routeName === 'Home') {
        return <Ionicons name="home" size={size} color={color} />;
    } else if (routeName === 'Settings') {
        return <Ionicons name="settings" size={size} color={color} />;
    }

    return null;
};

export default function Tabs() {
    const colorScheme = useColorScheme(); // Verificăm dacă este Dark Mode activ

    return (
        <Tab.Navigator screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => getTabBarIcon(route.name, focused, color, size),
            tabBarActiveTintColor: colorScheme === 'dark' ? '#FFD700' : '#007AFF',
            tabBarInactiveTintColor: colorScheme === 'dark' ? '#BBBBBB' : 'gray',
            tabBarStyle: {
                backgroundColor: colorScheme === 'dark' ? '#222222' : '#f8f8f8',
                paddingBottom: 5,
            },
        })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        </Tab.Navigator>
    );
}