# AGENT.md - Mentora App Development Guide

## Build/Test Commands
- `npm start` / `expo start` - Start development server
- `npm run android` / `expo start --android` - Start on Android
- `npm run ios` / `expo start --ios` - Start on iOS  
- `npm run web` / `expo start --web` - Start web version
- No test commands configured (backend has placeholder test script)

## Architecture & Structure
- React Native + Expo app with TypeScript
- Backend: Express.js API server in `mentora-backend/`
- Database: Supabase (PostgreSQL) with client in `src/context/SupabaseContext.tsx`
- Main folders: `src/screens/`, `src/components/`, `src/navigation/`, `src/context/`, `src/utils/`
- React Navigation for routing with drawer and stack navigators

## Code Style & Conventions
- TypeScript with strict mode enabled
- React Native functional components with hooks
- Interfaces for type definitions (e.g., `StudentData`, navigation types)
- React Navigation types: `NativeStackNavigationProp<RootStackParamList, ScreenName>`
- Imports: React Native components first, then third-party, then local relative imports
- Supabase client imported as `{ supabase }` from SupabaseContext
- StyleSheet.create() for styles, camelCase properties
- Error handling with try/catch and Alert.alert() for user feedback
- Async/await pattern for Supabase operations with proper error checking
