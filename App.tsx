import { StatusBar } from 'expo-status-bar';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect } from 'react';
import SplashScreen from './src/screens/SplashScreen';
import LocationPermissionScreen from './src/screens/LocationPermissionScreen';
import SavingLocationScreen from './src/screens/SavingLocationScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import MainScreen from './src/screens/MainScreen';
import ScanMenuScreen from './src/screens/ScanMenuScreen';
import UnderdevelopScreen from './src/screens/UnderdevelopScreen';
import ComponentScreen from './src/screens/ComponentScreen';
import IngredientScreen from './src/screens/IngredientScreen';
import SearchDishScreen from './src/screens/SearchDishScreen';
import { setUnauthorizedHandler } from './src/services/auth';

export type RootStackParamList = {
  Splash: undefined;
  LocationPermission: undefined;
  SavingLocation: undefined;
  Welcome: undefined;
  Main: undefined;
  ScanMenu: undefined;
  SearchDish: undefined;
  ComponentScreen: { data: any };
  IngredientScreen: { data: any };
  Underdevelop: { screenName: string };
};

const Stack = createStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
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
        <Stack.Screen name="SearchDish" component={SearchDishScreen} />
        <Stack.Screen name="ComponentScreen" component={ComponentScreen} />
        <Stack.Screen name="IngredientScreen" component={IngredientScreen} />
        <Stack.Screen name="Underdevelop" component={UnderdevelopScreen} />
      </Stack.Navigator>
      <StatusBar style="dark" backgroundColor="#C8E6FA" />
    </NavigationContainer>
  );
}
