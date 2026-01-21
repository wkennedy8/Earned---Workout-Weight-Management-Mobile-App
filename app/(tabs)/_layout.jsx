import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Tabs } from 'expo-router';

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarShowLabel: false,
				tabBarStyle: {
					paddingTop: 8,
					height: 64
				}
			}}
		>
			<Tabs.Screen
				name='index'
				options={{
					title: 'Home',
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name='house.fill' color={color} />
					)
				}}
			/>
			<Tabs.Screen
				name='workout'
				options={{
					headerShown: false,
					title: 'Workout',
					tabBarIcon: ({ color }) => (
						<FontAwesome6 size={24} name='dumbbell' color={color} />
					)
				}}
			/>
			<Tabs.Screen
				name='profile'
				options={{
					headerShown: false,
					title: 'Profile',
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name='person.fill' color={color} />
					)
				}}
			/>
		</Tabs>
	);
}
