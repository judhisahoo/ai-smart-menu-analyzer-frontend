# Project Instructions: AI Smart Menu Analyzer

This project is an AI-powered mobile application built with **React Native** and **Expo**. It allows users to scan restaurant menus, extract food items, and receive AI-driven insights (descriptions, ingredients) via a backend API.

## Project Overview

- **Purpose:** Provide real-time AI analysis of restaurant menus.
- **Architecture:** Stateless frontend mobile application; relies on a remote API backend for AI processing and data persistence (dynamic insights).
- **Core Technologies:**
  - Framework: React Native (0.81.5), Expo (SDK ~54)
  - Language: TypeScript
  - Routing: React Navigation (Stack Navigator)
  - Local Storage: `AsyncStorage`
  - UI/Styling: React Native `StyleSheet`, Tailwind CSS (configured)

## Application Flow

The application follows a linear, permission-first navigation pattern:

1.  **Splash:** `SplashScreen` acts as the initial entry point, performing permission checks (`expo-location`).
    - Redirects to `LocationPermission` if permissions are missing.
    - Redirects to `SavingLocation` if permissions are granted.
2.  **Onboarding:**
    - `LocationPermission`: Handles requesting user location.
    - `SavingLocation`: Finalizes location setup.
    - `Welcome`: Authenticates/Registers the user (or detects existing session in `AsyncStorage`).
3.  **Main Interface:**
    - `Main`: Central dashboard for navigation to core features.
    - Features accessible from `Main`:
        - `ScanMenu`: Primary tool for image capture and AI analysis.
        - `SearchDish`: Search functionality.
        - `Underdevelop`: Placeholder for unimplemented features (History, Favorites).
    - `ScanMenu` drill-downs:
        - `ComponentScreen`: Detailed analysis of components.
        - `IngredientScreen`: Detailed analysis of ingredients.

## Building and Running

Ensure you have [Node.js](https://nodejs.org/) and [Expo CLI](https://docs.expo.dev/) installed.

### Development Commands
- **Start Development Server:** `npm start`
- **Run on Android:** `npm run android`
- **Run on iOS:** `npm run ios`
- **Run on Web:** `npm run web`

## Development Conventions

- **Component Structure:** Functional components with React Hooks (`useState`, `useEffect`, `useRef`).
- **File Organization:** Source code resides in `src/`. Screens are in `src/screens/`. Constants (like API configuration) are in `src/constants/`.
- **Typing:** Use TypeScript. Define props and state types explicitly (as seen in `App.tsx` and screen files).
- **Styling:** Primarily uses `StyleSheet.create`. Tailwind is configured in `tailwind.config.js` and should be utilized for new UI components.
- **API Interaction:** API endpoints are defined in `src/constants/index.ts` as `BASE_URL`. Screen components use `fetch` to interact with this backend.
- **State Management:** Simple global state or navigation params. Local persistent state is handled using `AsyncStorage`.
- **Navigation:** Controlled via `NavigationContainer` and `createStackNavigator` in `App.tsx`.
