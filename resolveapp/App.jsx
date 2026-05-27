// App.jsx
import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import LoginScreen from './screens/Auth/LoginScreen';
import PermissionsScreen from './screens/Permission/PermissionScreen';
import LockdownCountdownScreen from './screens/Tabs/LockdownCountdownScreen';
import TabNavigator from './screens/Tabs/TabNavigator';
import ProfileScreen from './screens/ProfileScreen';
import HomeScreen from './screens/Tabs//HomeScreen';
import LockdownSetupScreen from './screens/Tabs/LockdownSetupScreen';
import CustomAlert from './components/CustomAlert';
import { setAlertRef } from './utils/AlertService';

const Stack = createNativeStackNavigator();

export default function App() {

  const [showCountdownIntent, setShowCountdownIntent] = useState(false);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    // Check for showCountdown intent extra (Android only)
    if (Platform.OS === 'android') {
      if (global?.IntentLauncherAndroid && global.IntentLauncherAndroid.getInitialIntent) {
        global.IntentLauncherAndroid.getInitialIntent().then((intent) => {
          if (intent && intent.extras && intent.extras.showCountdown) {
            setShowCountdownIntent(true);
          }
        });
      }
    }
  }, []);

  useEffect(() => {
    if (showCountdownIntent && navigationRef.isReady()) {
      navigationRef.navigate('Countdown');
    }
  }, [showCountdownIntent, navigationRef]);


  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName={"Permissions"} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="LockdownSetup" component={LockdownSetupScreen} />
        <Stack.Screen name="Countdown" component={LockdownCountdownScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
      <CustomAlert ref={(r) => setAlertRef(r)} />
    </NavigationContainer>
  );
}
