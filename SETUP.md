# eGarden Development Setup Guide

This guide will help you set up the eGarden React Native app for development.

## Prerequisites

- Node.js 18 or later
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Git
- iOS Simulator (for iOS development on macOS)
- Android Studio & Android Emulator (for Android development)

## Initial Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repository-url>
cd egarden
npm install
```

### 2. Environment Configuration

Copy the environment example file and configure your API keys:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual API keys and configuration:

#### Required API Keys

1. **Firebase Configuration**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication, Realtime Database, and Storage
   - Get your Firebase config and add to `.env`

2. **OpenWeather API** (for weather features)
   - Sign up at [OpenWeatherMap](https://openweathermap.org/api)
   - Get your API key and add to `OPENWEATHER_API_KEY`

3. **PlantNet API** (for plant identification)
   - Register at [PlantNet API](https://my.plantnet.org/)
   - Get your API key and add to `PLANTNET_API_KEY`

4. **OpenAI API** (for AI chat features)
   - Sign up at [OpenAI](https://platform.openai.com/)
   - Get your API key and add to `OPENAI_API_KEY`

5. **Stripe** (for payment processing)
   - Create a Stripe account at [Stripe](https://stripe.com/)
   - Get your publishable key and add to `STRIPE_PUBLISHABLE_KEY`

### 3. Firebase Setup

1. **Authentication**
   - Enable Email/Password authentication
   - Configure sign-in methods as needed

2. **Realtime Database**
   - Create a Realtime Database
   - Set up security rules (start with test mode, then configure proper rules)

3. **Storage**
   - Enable Cloud Storage
   - Configure storage rules for plant images

### 4. EAS Configuration

If you plan to build the app:

```bash
npx eas-cli login
npx eas build:configure
```

Update `EAS_PROJECT_ID` in your `.env` file.

## Development Commands

### Start Development Server

```bash
# Start with Expo
npm run dev

# Or start normally
npm start
```

### Platform-Specific Development

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web Development
npm run web
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check
```

## Building for Production

### Development Builds

```bash
# Android preview build
npm run build:android:preview

# iOS preview build
npm run build:ios:preview
```

### Production Builds

```bash
# All platforms
npm run build:production

# Specific platform
npm run build:android
npm run build:ios
```

## Troubleshooting

### Common Issues

1. **Metro bundler cache issues**
   ```bash
   npx expo start --clear
   ```

2. **Node modules issues**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **iOS build issues**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Android build issues**
   - Make sure Android Studio is properly installed
   - Check that ANDROID_HOME environment variable is set

### Environment Variables Not Loading

- Ensure your `.env` file is in the root directory
- Restart the development server after changing `.env`
- For Expo managed workflow, use `EXPO_PUBLIC_` prefix for client-side variables

### Firebase Connection Issues

- Verify all Firebase configuration values are correct
- Ensure Firebase services are enabled in your project
- Check Firebase security rules

## Development Features

### Demo Mode

If API keys are not configured, many services will run in demo mode with simulated data:

- AI services will return mock responses
- Payment processing will simulate transactions
- Plant identification will return sample results

### Hot Reloading

The app supports hot reloading for faster development. Changes to most files will automatically reload the app.

### Debugging

- Use Flipper for advanced debugging
- React Developer Tools for component inspection
- Expo DevTools for Expo-specific debugging

## Project Structure

```
eGarden/
├── app/                    # App screens (Expo Router)
├── components/            # Reusable UI components
├── services/              # API and business logic
├── context/               # React Context providers
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── constants/             # App constants and themes
├── utils/                 # Utility functions
├── assets/                # Images, fonts, and static files
├── locales/               # Internationalization files
└── __tests__/             # Test files
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Add tests if applicable
4. Run linting and type checking
5. Submit a pull request

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [eGarden API Documentation](docs/API.md) (if available)

## Support

For development support:
- Check the GitHub Issues for known problems
- Join our Discord/Slack for real-time help (if available)
- Email: dev-support@egarden.app