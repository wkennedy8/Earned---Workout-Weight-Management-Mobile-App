// import AuthGate from '@/components/AuthGate';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
	Quicksand_300Light,
	Quicksand_400Regular,
	Quicksand_500Medium,
	Quicksand_600SemiBold,
	Quicksand_700Bold,
	useFonts
} from '@expo-google-fonts/quicksand';
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthGate, AuthProvider } from '../context/AuthContext';

// Keep the splash screen visible while we load resources
SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
	anchor: '(tabs)'
};

export default function RootLayout() {
	const colorScheme = useColorScheme();

	const [fontsLoaded] = useFonts({
		Quicksand_300Light,
		Quicksand_400Regular,
		Quicksand_500Medium,
		Quicksand_600SemiBold,
		Quicksand_700Bold
	});

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	if (!fontsLoaded) {
		// Keep native splash visible until fonts load
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
