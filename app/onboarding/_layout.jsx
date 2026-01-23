import { Stack } from 'expo-router';

export default function OnboardingLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				animation: 'slide_from_right',
				gestureEnabled: false // Prevent swiping back
			}}
		>
			<Stack.Screen name='name' />
			<Stack.Screen name='email' />
			<Stack.Screen name='goal' />
			<Stack.Screen name='program' />
			<Stack.Screen name='photo' />
		</Stack>
	);
}
