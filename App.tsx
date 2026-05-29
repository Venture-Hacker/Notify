import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { bootstrapNotifications, registerBackgroundHandler } from './src/services/NotificationService';
import { getSettings } from './src/services/StorageService';
import { runAutoDelete } from './src/services/AutoDeleteService';
import { Colors } from './src/theme/colors';

const Stack = createStackNavigator();

registerBackgroundHandler();

export default function App() {
  useEffect(() => {
    async function init() {
      await bootstrapNotifications();
      const settings = await getSettings();
      await runAutoDelete(settings);
    }
    init();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: Colors.bg },
          }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
