// import AuthGate from '@/components/AuthGate';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { AuthGate, AuthProvider } from '../context/AuthContext';

// Keep the splash screen visible while we load resources
SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
	anchor: '(tabs)'
};

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const [appReady, setAppReady] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				// If you load fonts/images, do it here.
				// Example:
				// await Font.loadAsync({ ... });
			} catch (e) {
				console.warn('Splash init error:', e);
			} finally {
				setAppReady(true);
				// Hide splash once we're ready
				await SplashScreen.hideAsync();
			}
		})();
	}, []);

	if (!appReady) {
		// Keep native splash visible
		return null;
	}
	return (
		<ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
			<AuthProvider>
				<AuthGate>
					<Stack screenOptions={{ headerShown: false }}>
						<Stack.Screen name='(tabs)' options={{ headerShown: false }} />
					</Stack>
				</AuthGate>
			</AuthProvider>
			<StatusBar style='auto' />
		</ThemeProvider>
	);
}
