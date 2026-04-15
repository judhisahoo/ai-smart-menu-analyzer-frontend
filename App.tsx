import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, Text, View } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import LocationPermissionScreen from './src/screens/LocationPermissionScreen';
import SavingLocationScreen from './src/screens/SavingLocationScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import MainScreen from './src/screens/MainScreen';
import ScanMenuScreen from './src/screens/ScanMenuScreen';
import UnderdevelopScreen from './src/screens/UnderdevelopScreen';

type RootStackParamList = {
  Splash: undefined;
  LocationPermission: undefined;
  SavingLocation: undefined;
  Welcome: undefined;
  Main: undefined;
  ScanMenu: undefined;
  Underdevelop: { screenName: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#C8E6FA' },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
        <Stack.Screen name="SavingLocation" component={SavingLocationScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="ScanMenu" component={ScanMenuScreen} />
        <Stack.Screen name="Underdevelop" component={UnderdevelopScreen} />
      </Stack.Navigator>
      <StatusBar style="dark" backgroundColor="#C8E6FA" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#C8E6FA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A5276',
    marginBottom: 10,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#2E86C1',
    textAlign: 'center',
  },
});
